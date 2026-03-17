---
title: "AWS EC2 notes (launch, resize, placement, SSH, CloudWatch Agent, status checks, hibernate, Instance Scheduler, AMI, Image Builder)"
date: "2026-03-16"
excerpt: "Condensed notes on EC2: launch, resize, placement, SSH/Instance Connect, CloudWatch and agent, status checks, Hibernate, Instance Scheduler, AMI (create, No-Reboot, cross-account), EC2 Image Builder, AMI in production."
author: "Tony Duong"
category: "note"
tags: ["aws", "ec2", "cloudops", "certification", "cloudwatch", "security", "ssm", "ami", "image-builder"]
---

## Launching an instance

- **Name**, **AMI** (e.g. Amazon Linux), **instance type** (e.g. t2.micro for free tier).
- **Key pair:** Create or select; RSA PEM for SSH. Store the `.pem` file (e.g. in Downloads).
- **Network settings:** Create or edit security group; allow SSH (port 22) from your IP or from anywhere for demos.
- **Storage:** Default is usually fine (EBS-backed).
- **Connect:** Copy the instance **public IPv4**, then from terminal:
  - `chmod 400 YourKey.pem` (required — wrong permissions cause “unprotected private key file”).
  - `ssh -i YourKey.pem ec2-user@<public-ip>` (username depends on AMI: `ec2-user` for Amazon Linux, `ubuntu` for Ubuntu).
- **EC2 Instance Connect:** In the console, open “EC2 Instance Connect”; it suggests the username and opens a browser-based shell. No need to provide your own key — it pushes a **one-time SSH public key** (valid 60 seconds) from AWS and connects from the EC2 Instance Connect IP range.

## Changing instance type (resize)

- **Only for EBS-backed instances.** Steps: **stop** the instance → **change instance type** (e.g. t2.micro → t2.small) → **start** the instance.
- After stop/start, the instance may run on a **different physical host**; **EBS storage is preserved** (data, files, OS stay the same). Instance store would not persist.
- **EBS-optimized:** Newer generations (e.g. t3) support EBS-optimized by default (better throughput to EBS). Older types like t2.small may not.
- t2.small (and most non–t2.micro) are **not free tier** — you will be charged. Prefer t2.micro for practice if staying in free tier.

## Placement groups

Control how EC2 instances are placed relative to each other (no direct hardware choice, but you set the strategy).

| Strategy | Description | Use case |
|----------|-------------|----------|
| **Cluster** | Instances in same AZ, low-latency / same “cluster” of hardware. ~10 Gbps between instances with enhanced networking. | High performance, big data, low-latency apps. **Risk:** if the AZ fails, all fail. |
| **Spread** | Each instance on **different hardware**; can span AZs. **Max 7 instances per AZ** per spread placement group. | Maximize HA; critical apps where instance failures must be isolated. |
| **Partition** | Instances spread across **partitions** (each partition ≈ a rack). Up to **7 partitions per AZ**; partitions can span multiple AZs. Many instances per partition; **hundreds per group**. | Partition-aware apps: HDFS, HBase, Cassandra, Kafka. One partition failure doesn’t take down others. |

## SSH and connection troubleshooting

- **“Unprotected private key file”:** Fix PEM permissions, e.g. `chmod 400 YourKey.pem`.
- **“Permission denied” / “Host key not found” / “Connection closed”:** Wrong **username** for the AMI (e.g. using `ubuntu` on Amazon Linux). Use the correct user for your AMI.
- **Connection timeout:** Usually **network/security** — check:
  - **Security group:** Inbound SSH (port 22) from your IP (or from EC2 Instance Connect range if using that).
  - **Route tables** and **NACLs** for the instance’s subnet.
  - Instance has a **public IPv4** if you expect to reach it from the internet.
  - Instance not **overloaded** (e.g. CPU 100%) so it can accept new connections.

**EC2 Instance Connect vs SSH:**

- **SSH:** Your IP must be allowed in the security group (inbound port 22). You use your key pair.
- **EC2 Instance Connect:** You don’t use your key. AWS pushes a short-lived key and connects **from the EC2 Instance Connect service IP range**. The security group must allow **SSH (22) from that range**, not only “My IP”. Get the range from the [AWS IP address ranges](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html) JSON (filter by service “EC2 Instance Connect” and your region).

## EC2 Instance Connect endpoint (private instances)

For **EC2 instances in private subnets** (no direct internet access):

- Create an **EC2 Instance Connect endpoint** (VPC endpoint for the service).
- Attach a **security group** to the endpoint that allows **outbound SSH** to the target instances.
- Target instances’ security groups must allow **inbound SSH from the endpoint’s security group**.
- No **internet gateway**, **NAT gateway**, or public IP needed on the instances; you connect via the endpoint and then use EC2 Instance Connect to the private instance.

## CloudWatch and EC2 (exam-relevant)

- **Basic monitoring:** Metrics at **5-minute** resolution (no extra cost).
- **Detailed monitoring:** Metrics at **1-minute** resolution (extra cost).
- **Built-in EC2 metrics** (pushed by AWS): **CPU** (utilization; for T2/T3 burstable: credit usage and balance), **network** (in/out, packets), **status checks** (instance status = VM health, system status = underlying hardware, EBS status = attached volumes), **disk** read/write **only for instance store–backed** instances (for EBS-backed, disk metrics are on the **EBS volume** in CloudWatch, not on the EC2 instance).
- **RAM is not included** in default EC2 metrics — common exam point. You must push **custom metrics** (e.g. RAM, app-level) from the instance; resolution can be 1 minute or, for high-resolution, down to **1 second**. The instance needs an **IAM role** with permission to publish metrics to CloudWatch.

## Unified CloudWatch Agent

- For **EC2 or on-premises** servers: collect **additional system-level metrics** (RAM, disk, processes, etc.) and **send logs** to CloudWatch Logs. By default, no logs or custom metrics are sent from an EC2 instance without an agent.
- **Configuration:** SSM Parameter Store (central, recommended for multiple instances) or a local config file. The instance (or on-prem server) needs **IAM permissions** for CloudWatch (metrics + logs) and, if using SSM, for Parameter Store.
- **Namespace:** Metrics pushed by the agent use the **CWAgent** namespace by default (configurable).
- **procstat plugin (exam):** The only way to get **per-process** metrics (CPU usage, memory per process) on Linux or Windows is the **Unified CloudWatch Agent** with the **procstat** plugin. You select processes by **PID file**, **process name**, or **pattern**. Metrics appear with a **procstat_** prefix (e.g. `procstat_cpu_usage`, `procstat_time`).

## Installing and configuring the CloudWatch agent

- **IAM role:** Create an EC2 role with **CloudWatchAgentServerPolicy** (put metrics, send logs, get parameters from SSM). To **store** the agent config in SSM during setup, you also need **CloudWatchAgentAdminPolicy** (put parameter); after setup you can remove the admin policy and keep only the server policy. Attach the role to the instance.
- **Install:** `sudo yum install -y amazon-cloudwatch-agent` (Amazon Linux 2). Then run the **wizard**: `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard` — choose Linux, EC2, root user; optionally StatsD/CollectD (if you enable CollectD without having it installed, the agent will fail to start); enable host metrics (CPU, **memory**); add EC2 dimensions; set resolution (1s to 60s); optionally add log file paths (e.g. `/var/log/httpd/access_log`, `error_log`) with log group names and retention. The wizard outputs a JSON config; store it in **SSM Parameter Store** (e.g. `AmazonCloudWatch-Linux`) so other instances can fetch it.
- **Start from SSM:** `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-Linux`. Or start from a local config file with `-c file:path/to/config.json`. Log groups and streams appear in CloudWatch Logs; metrics (e.g. `mem_used_percent`, disk, CPU, network, processes, swap) appear under the **CWAgent** namespace.

## Status checks and recovery

- **System status check:** AWS monitors the **physical host** (power, hardware). If it fails, use **stop** then **start** (not reboot) so the instance is **migrated to another host** (new public IP; same EBS data). Check **Personal Health Dashboard** for scheduled maintenance affecting your instance.
- **Instance status check:** Software and network config on the instance (e.g. exhausted memory, invalid network config). Fix by **rebooting** or changing instance config.
- **EBS status check:** Attached EBS volumes reachable and able to do I/O. If failed, **reboot** or **replace** the affected volume.
- **CloudWatch metrics:** `StatusCheckFailed_System`, `StatusCheckFailed_Instance`, `StatusCheckFailed_AttachedEBS`, and `StatusCheckFailed` (any of the three). Use these for alarms.
- **Recovery options:**
  1. **CloudWatch Alarm with “Recover” action:** On status-check failure (e.g. system), the alarm triggers and AWS **recovers** the instance (migrates to new host). Keeps **same private IP, public IP, EIP, metadata, placement group**. Can also send SNS notification. **“Reboot”** action for instance-level (software) issues.
  2. **ASG with min = max = desired = 1:** Health check based on EC2 status. Unhealthy instance is terminated; ASG launches a new one. You lose same IP/EBS attachment; use if you can tolerate replacement and have automation to restore state.

## EC2 Hibernate

- **Stop** keeps EBS data; **terminate** can delete or keep volumes. **Start** = full OS boot + user data + app startup (slow).
- **Hibernate:** RAM is **written to the root EBS volume**, then the instance stops. On start, RAM is **loaded from disk** — from the OS perspective the instance was never stopped (e.g. `uptime` continues). **Faster** restart; no re-init of apps/caches.
- **Requirements:** Root volume must be **EBS**, **encrypted**, and **large enough** to hold the instance’s RAM. Instance RAM limit for hibernation is currently &lt; 150 GB (reference; check docs). Not for bare metal. Supported for on-demand, reserved, spot. Hibernation duration is typically limited (e.g. up to 60 days).
- **Enable:** At launch, set **Stop - Hibernate** behavior and ensure root volume is encrypted and sized for RAM (e.g. 8 GB root for 1 GB RAM). After hibernate → start, `uptime` will not reset.

## Instance Scheduler (AWS Solution)

- **Not a service** — an **AWS Solution** deployed via **CloudFormation**. Automatically **start and stop** EC2 instances, RDS instances, and EC2 Auto Scaling groups on a schedule to **reduce cost** (e.g. outside business hours).
- **How it works:** Schedules are stored in a **DynamoDB** table. A **Lambda** (triggered on a schedule, e.g. every 5 minutes) reads the table and triggers other Lambdas to start or stop the resources. Supports **cross-account** and **cross-region**. Tag resources with the schedule key (e.g. `Schedule`) so the solution knows what to act on.
- **Deploy:** Search “Instance Scheduler AWS” → open the solution page → **Launch solution** → CloudFormation opens with the template URL. Parameters: tag key, default timezone, enabled/disabled, services (EC2, RDS, Neptune, DocumentDB, ASG), optional RDS snapshot on stop, etc. After deployment, configure schedules in the DynamoDB config table (e.g. office hours, weekdays). Exam may ask about the **purpose** of this solution (cost savings via scheduled start/stop).

## AMI (Amazon Machine Image)

- **What it is:** A customization of an EC2 instance — OS, software, monitoring tools. **Faster boot and config** when you launch from a custom AMI because everything is pre-packaged. AMIs are **region-specific**; you can copy them across regions.
- **Sources:** **Public** (AWS, e.g. Amazon Linux 2), **your own** (create and maintain; tools can automate), **AWS Marketplace** (third-party AMIs, often paid).
- **Create from instance:** Customize an instance → **stop** it (for file system integrity) → right-click → **Image and templates** → **Create image**. EBS snapshots are created behind the scenes. Launch new instances from **AMIs** → **My AMIs** (or “From AMI” in launch flow). Instances from your AMI boot faster (no need to re-run full user data).
- **Migrate across AZ:** Create an AMI from an instance in AZ A, then **launch** from that AMI and select a **subnet in AZ B** — same data and apps in a different AZ.

## AMI: No-Reboot option

- **Default:** Creating an AMI **shuts down** the instance first, then snapshots the EBS volume → **file system integrity**.
- **No-Reboot enabled:** Snapshot is taken from the **running** instance. **Risk:** No guarantee of file system consistency; OS buffers may not be flushed. Use only when you accept that trade-off.
- **AWS Backup:** When Backup creates AMIs of EC2, it **does not reboot** the instance (no-reboot behavior). So Backup does **not** guarantee file system integrity. For **scheduled AMI backups with integrity**, use e.g. **EventBridge** (schedule) → **Lambda** → create AMI **with** reboot (stop instance, create image, then start).

## AMI: Cross-account sharing and copy

- **Sharing:** You share an AMI with another account; **you remain the owner**. **Unencrypted** AMI: share with specific accounts or make public. **Encrypted** (customer managed key, CMK): you must also **share the KMS key** with the target account (e.g. describe, decrypt, re-encrypt) so they can launch from the AMI.
- **Copy (cross-account):** Target account **copies** the shared AMI into their account → they **own** the new AMI. Source must grant **read** on the **underlying EBS snapshots**. If encrypted, source shares the CMK; target can **re-encrypt** the snapshot with their own CMK during copy.
- **Console:** **Actions** → **Edit AMI permissions** → add account IDs or org/OU ARNs; optionally **add create volume permission to associated snapshots** so the other account can use the AMI.

## EC2 Image Builder

- **Purpose:** Automate **creation, maintenance, validation, and testing** of AMIs (and container images). Exam-relevant.
- **Flow:** Image Builder launches a **builder EC2 instance** → runs **build components** (install Java, AWS CLI v2, app, updates, etc.) → creates an **AMI** → launches a **test instance** from that AMI → runs **tests** (optional; e.g. security, app checks) → **distributes** the AMI (e.g. to multiple regions). All automated.
- **Recipe:** Defines **source image** (e.g. Amazon Linux 2, x86) and **components** (AWS-managed or custom). Component order can be set. Use **x86** source if building on e.g. t2.micro (no ARM64).
- **Infrastructure configuration:** Instance type for build/test, **IAM instance profile** with: **EC2InstanceProfileForImageBuilder**, **ECRContainerBuilds** (for Docker), **AmazonSSMManagedInstanceCore**.
- **Distribution:** Which regions receive the AMI. Can distribute to several regions automatically.
- **Schedule:** Manual, or e.g. weekly / when dependencies update (CRON). **Free service** — you pay only for EC2 and storage used during build and for the AMI/snapshots.
- **Cleanup:** Deregister the AMI, then **delete** the **backing EBS snapshots**.

## AMI in production

- **Pre-approved AMIs:** Tag AMIs (e.g. `environment=prod`). **IAM policy** with a **condition** that allows `ec2:RunInstances` only when the AMI has that tag → users can launch only from approved AMIs. Restrict who can add tags to AMIs.
- **AWS Config:** Define a rule that checks EC2 instances; flag **non-compliant** instances (launched from an AMI that is not approved/tagged). Compliant instances stay green; take action on non-compliant ones.

---
*Summary from course/tutorial transcripts*
