---
title: "AWS Systems Manager notes (overview, Fleet Manager, DHMC, documents, Run Command, Session Manager, Automation, Parameter Store, Inventory, State Manager, Distributor, Patch Manager, Maintenance Windows, OpsCenter)"
date: "2026-03-17"
excerpt: "Condensed notes on AWS Systems Manager: agent, Fleet Manager, DHMC, documents, Run Command, Session Manager, Automation, Parameter Store, Inventory, State Manager, Distributor, Patch Manager, Maintenance Windows, OpsCenter (OpsItems, runbooks)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "systems-manager", "ssm", "cloudops", "certification", "ec2", "fleet-manager", "run-command", "session-manager", "automation", "parameter-store", "inventory", "state-manager", "distributor", "patch-manager", "maintenance-windows", "opscenter"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 2
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Overview

**AWS Systems Manager** is a suite of tools to **manage a fleet of EC2 instances and on-premises servers at scale**. It appears often on the CloudOps exam. Use it for:

- **Insights** into the state of your infrastructure
- **Detecting problems** and **patching automation**
- **Compliance** (e.g. configuration, patching)

It supports **Windows and Linux**, is integrated with **CloudWatch** (metrics, dashboards) and **Config**, and is **free** — you pay only for the resources it uses or creates (e.g. EC2 for automation).

**When to think SSM:** Patching instances, running automation, or managing many instances/on-prem servers usually involves Systems Manager.

## How SSM works

- An **SSM agent** must be installed on the systems you want to manage.
- The agent is **preinstalled** on **Amazon Linux 2** and some **Ubuntu** AMIs.
- If an instance does **not** show up as managed in SSM, check:
  1. **SSM agent** — not running, not installed, or misconfigured.
  2. **IAM** — the instance (or on-prem server) needs an IAM role (or credentials) with permissions to talk to Systems Manager.
- The **instance (or server) calls out to SSM**; SSM does not need to reach in. So the instance does **not** need inbound SSH, HTTP, or other rules for SSM to manage it — only outbound access to AWS APIs (and the correct IAM role).

## Fleet Manager

- **Fleet Manager** lets you **centrally and remotely manage** all nodes that have registered with Systems Manager: **EC2 instances**, **on-premises servers or VMs**, **Edge devices**, and **IoT devices**. Supports **Windows and Linux**. Every node must have the **SSM agent** installed to talk to the SSM service.
- **IAM for EC2:** Attach an **IAM instance profile** that includes **AmazonSSMManagedInstanceCore** so instances can register with SSM and Fleet Manager. Alternatively you can use **Default Host Management Configuration** to simplify onboarding (fewer manual IAM steps). Without the right permissions or config, nodes will not show up as managed.
- **What Fleet Manager is for:** See all managed nodes in one place and apply SSM actions at scale. Use it to **track node status, health, and performance**; run **troubleshooting and management tasks**; and get **access** — **Windows RDP** or **Session Manager** for CLI access to Linux instances. Fleet Manager is the **hub** for using other SSM features (Run Command, Patch Manager, State Manager, etc.) against your fleet.
- **What AmazonSSMManagedInstanceCore grants (exam-relevant):** The policy gives the instance permission to: **register** with Systems Manager / Fleet Manager; use **Session Manager**; read **SSM documents** and **Parameter Store** parameters; **receive and run** commands (e.g. Run Command); perform **Patch Manager** operations; and **report** to **Inventory**, **Compliance**, and configuration status in SSM. Attaching this (or equivalent) to EC2 instances is required for them to be fully manageable by SSM.
- **Registering EC2 (recap):** Launch with an AMI that has the agent (e.g. **Amazon Linux 2**), attach the instance profile with **AmazonSSMManagedInstanceCore**, and optionally use a security group with no inbound rules — the agent registers by calling out to AWS. Nodes then appear in Fleet Manager (platform, OS, agent version, status).

## Default Host Management Configuration (DHMC)

- **Purpose:** With **DHMC** enabled, EC2 instances can become **managed instances without an EC2 instance profile** (no IAM role attached to the instance). SSM access is still required, but it is provided through a different mechanism.
- **How it works:** Every EC2 instance has an **instance identity document** (and, in this flow, an **instance identity role** — a built-in, no-permissions role you do not control). Its job is to **identify the instance** to AWS services such as Systems Manager. This is **not** the same as an EC2 instance profile. The instance uses this identity to authenticate to SSM; **Systems Manager then passes an IAM role** to the instance so it can be managed (Session Manager, Run Command, Patch Manager, etc.). All of this happens **without** you attaching an instance profile to the instance.
- **Requirements:** **IMDSv2** (instance metadata service version 2) must be enabled on the instance (e.g. **Metadata version: V2 only** in EC2 advanced details). The **SSM agent** must be at least **version 3.2.x** (exact minimum is shown in Fleet Manager when you enable DHMC) so it supports this flow; older AMIs may ship an older agent and require a **manual agent upgrade** before the instance will register.
- **After onboarding:** Once the instance is managed via DHMC, SSM features (Session Manager, Patch Manager, Inventory, etc.) are enabled, and the **SSM agent is automatically kept up to date** by AWS.
- **Scope:** DHMC is **enabled per region**; turn it on in each region where you want this behavior.

**Enabling and using DHMC (hands-on):**

- In **Fleet Manager** (left-hand side), open the **Default host management** (or similar) configuration. Enable it and create the IAM role using the **recommended** settings — this role is what SSM will pass to instances; you do **not** attach it as an EC2 instance profile. Click **Configure** to save.
- **Launch a test instance:** Use an AMI with the SSM agent (e.g. **Amazon Linux 2023**). Attach **no** instance profile (Security → IAM role = none). Under **Advanced details**, set **Metadata** to **V2 only** (IMDSv2). Launch; the instance will have **no IAM role** shown in the EC2 console.
- If the instance does **not** appear in Fleet Manager, the agent may be too old. Check the minimum agent version required by DHMC in the Fleet Manager UI. **Upgrade the agent** on the instance: connect (e.g. Session Manager if you have another managed node, or temporarily use EC2 Instance Connect/key), stop the SSM agent, run the official install steps for your OS and architecture (e.g. x86_64 from “Manually installing SSM agent on EC2 instances for Linux”), then start the agent. After the upgrade (e.g. to 3.2.923 or higher), refresh Fleet Manager — the instance should appear as a managed node even though it has no instance profile.
- To turn DHMC off: Fleet Manager → Default host management → Configure → Disable. Terminate test instances when done.

## Tags and resource groups

- **Tags** are key–value pairs on AWS resources (e.g. EC2, S3, DynamoDB, Lambda). Use them for **resource grouping**, **automation**, **security**, and **cost allocation**. Common keys: `Environment`, `Team`. Prefer more tags rather than fewer.
- **Resource groups** let you group resources by **tag filters** (e.g. `Environment = dev`). Resource Groups is **regional**. You can scope by resource type (e.g. EC2 only) or across types.
- **Why use resource groups with SSM:** You can run SSM actions **at the group level** — for example, patch all instances in the “dev” group or run a command on all “finance” instances. Creating resource groups (e.g. by `Environment`, `Team`) is a prerequisite for doing SSM operations by group in later steps.

## Documents

- **Documents** are the core of SSM. They are defined in **JSON or YAML** and describe **parameters** and **steps** (actions). A document is executed by a specific SSM feature (Run Command, State Manager, Patch Manager, Automation).
- **Ownership:** Many documents are **owned by Amazon** (e.g. `AWS-ApplyPatchBaseline`); you can also create **your own** and version them. Documents can be **shared** with other accounts.
- **Use cases:** Run a single command or a full script across instances; used by **State Manager**, **Patch Manager**, **Automation**; documents can **read from Parameter Store** for modular, dynamic behavior.
- **Document types:** **Command/Session** (run commands on targets) or **Automation** (runbooks that perform actions on AWS resources from outside the instance). Automation documents are often called **runbooks**.

## Run Command

- **Run Command** runs a **document** (or a single command) across a **fleet of EC2 instances**. Targets can be chosen by **instance IDs**, **tags**, or **resource groups**. No **SSH** is required — the SSM agent runs the commands; the instance does not need port 22 open.
- **Rate control:** Run on a subset of targets at a time (e.g. 1 at a time, 50 at a time, or a percentage) to avoid overloading or to roll out gradually.
- **Error threshold:** Stop the run after a number or percentage of failures (e.g. stop on first error, or stop if more than 5% fail).
- **Output:** Command output can be viewed in the console (up to a character limit), sent to **S3**, or to **CloudWatch Logs** (e.g. separate streams for stdout/stderr).
- **Notifications:** Send status (in progress, success, failed) to **SNS**. **EventBridge** (CloudWatch Events) rules can **invoke Run Command** (e.g. on a schedule or on an event). Fully integrated with **IAM** and **CloudTrail** (audit who ran what).
- **Example:** Create a custom **command document** (e.g. YAML) with a parameter (e.g. `message`) and steps (install httpd, start it, write an HTML file using the parameter). Execute it via Run Command on multiple instances with rate control (e.g. one at a time) and error threshold; send output to CloudWatch Logs.

## Session Manager

- **Purpose:** Start a **secure shell (CLI) session** on EC2 instances and on-premises servers **without SSH** — no bastion host, no SSH keys. Access via **console**, **CLI**, or **Session Manager SDK**. Unlike traditional SSH or **EC2 Instance Connect** (which uses SSH), Session Manager uses the **SSM service** as the broker; the instance never accepts inbound SSH.
- **How it works:** The instance runs the **SSM agent** and has the right **IAM** permissions to register with SSM. The **user** connects to the **Session Manager service** with IAM permissions; Session Manager then runs an **interactive shell** on the instance — the same underlying mechanism as **Run Command**, but for a **live shell** instead of a one-off command. Supports **Linux**, **macOS**, and **Windows**.
- **Logging and compliance:** All **connections** and **executed commands** can be **logged** to **S3** or **CloudWatch Logs**, giving you an audit trail and better security/compliance than SSH (where command history is not centrally captured). **CloudTrail** can record **StartSession** events when someone starts a Session Manager session, for automation, compliance, and alerting.
- **IAM:** IAM controls **who** can use Session Manager and **which instances** they can access. You can use **resource tags** to restrict access (e.g. allow connection only to instances tagged `environment = dev`). The user needs SSM permissions (e.g. `ssm:StartSession`); if you send logs to S3 or CloudWatch, the policy must also allow writing there. Optionally you can **restrict which commands** a user is allowed to run in a session for tighter security.
- **Security (exam-relevant):** With **SSH** you typically open **inbound port 22** (or a bastion) and give users keys or IP access; with **Session Manager** you need **no inbound rules** on the instance — only the **SSM agent**, the **instance IAM role** (e.g. AmazonSSMManagedInstanceCore), and a **user with Session Manager IAM permissions**. All session data can be logged to S3 or CloudWatch.

**Session Manager (console and preferences)**

- From **Session Manager** in the left nav, select a managed instance and **Start session** — you get an interactive shell (run any commands: `echo`, `ls`, `sudo`, install packages, etc.) even when the instance has **no SSH inbound rules** in its security group. The **entire session** is logged by Session Manager. After ending the session, use **Session history** in Session Manager to see that the session was recorded.
- **Preferences** (edit in Session Manager): **Idle timeout**; **KMS encryption** for session data; **run session as a specific user** (e.g. `ec2-user` for Linux); **CloudWatch logging** (log all sessions to CloudWatch Logs); **S3 logging** (send session log data to S3); **Linux shell profile** and **Windows shell profile**. Many organizations use Session Manager instead of SSH for EC2 access because it is more controlled and provides stronger compliance (central logging, no open inbound ports).

## SSM Automation (runbooks)

- **Automations** simplify **maintenance and deployment** for EC2 and other AWS resources. Unlike Run Command (which runs **inside** instances via the agent), **Automation runs from outside** — it calls AWS APIs (e.g. stop/start instances, create AMI, create EBS snapshot, update ASG).
- **Runbooks:** Automation **documents** are called **runbooks**. They can be **Amazon-owned** (e.g. `AWS-RestartEC2Instance`) or **custom**. Categories include instance management, patching, remediation, backups, cost management.
- **Triggers:** Run manually (console, CLI, SDK), on a **schedule** (e.g. **Maintenance Window**), via **EventBridge** (rule target = SSM Automation), or as **AWS Config remediation** (run when a resource is non-compliant).
- **Execution options:** Simple (all targets), **rate control** (e.g. one target at a time), **multi-account and multi-region**, or **manual step-by-step** (approval between steps). You can specify an **IAM role** for the automation to assume. Rate control and error threshold apply similarly to Run Command.
- **Example:** Execute `AWS-RestartEC2Instance` with rate control, target = resource group (e.g. Dev group). Steps: stop instances, then start instances. No SSH or custom script needed; useful to restart a fleet safely.

## Example: Patched AMI and ASG refresh (automation flow)

A common pattern: an **ASG** runs instances from an **old AMI**; you want to **patch the AMI** and have the ASG use the new AMI, then refresh instances.

1. **Automation** (with an IAM role that can create instances, run commands, create AMIs, update ASG):
   - **Launch** an EC2 instance from the **source AMI**.
   - **Run Command** on that instance using **AWS-RunPatchBaseline** (SSM document) to install patches.
   - **Stop** the instance, **create an AMI** from it, then **terminate** the instance. You now have a **patched AMI**.
2. **Update the ASG** to use the new AMI: inside the same automation, run a **script** (e.g. Python) that **updates the launch template** with the new AMI ID and **updates the ASG** to use that launch template. New instances launched by the ASG will use the patched AMI.
3. **Replace existing instances:** Existing instances in the ASG are still on the old AMI. Use **EC2 Instance Refresh** (ASG feature) — which can be **started from the automation** — to replace them with instances from the new launch template.

Everything is orchestrated in a **single SSM Automation**; no manual steps, and it interacts with multiple AWS APIs (EC2, SSM Run Command, ASG, launch templates).

## Parameter Store

- **Purpose:** Secure, serverless storage for **configuration** and **secrets**. Optionally encrypt values with **KMS** (SecureString). **Version tracking** when you update parameters. Access controlled by **IAM**. Integrates with **EventBridge** (notifications in certain cases) and **CloudFormation** (parameters as stack inputs).
- **Types:** **String** (plain text, up to 4 KB standard / 8 KB advanced), **StringList**, **SecureString** (encrypted with KMS — your CMK or the default `alias/aws/ssm`). Applications need IAM permission to read the parameter **and** KMS permission to decrypt (for SecureString).
- **Hierarchy:** Use **paths** to organize parameters (e.g. `/my-app/dev/db-url`, `/my-app/dev/db-password`, `/my-app/prod/db-url`). This simplifies **IAM policies**: grant access by path (e.g. entire app, or one app + environment). Parameters are listed in the console by hierarchy.
- **Secrets Manager:** You can **reference** a Secrets Manager secret from Parameter Store (reference syntax); useful to centralize access. **Public parameters** are provided by AWS (e.g. latest Amazon Linux 2 AMI ID per region) and are available via the Parameter Store API.
- **Tiers:**
  - **Standard:** Free. Up to **10,000** parameters, **4 KB** value max. No **parameter policies**. Cannot share with other accounts.
  - **Advanced:** **$0.05 per parameter per month**. Up to **100,000** parameters, **8 KB** value max. **Parameter policies** available. Can **share** with other accounts.
- **Parameter policies (Advanced only):** Attach policies to force or encourage rotation/updates:
  - **Expiration (TTL):** Parameter must be deleted or updated by a given time; use for sensitive data (e.g. passwords) so it is not left stale. **EventBridge** can receive a notification (e.g. 15 days before expiry) so you can update or delete in time.
  - **No-change notification:** If a parameter has not been updated for X days, EventBridge notifies you (e.g. to enforce periodic rotation). You can attach multiple policies to one parameter.
- **CLI:** `aws ssm get-parameters --names "/my-app/dev/db-url" "/my-app/dev/db-password"` returns values; add `--with-decryption` to decrypt SecureString (requires KMS permission). `aws ssm get-parameters-by-path --path "/my-app/dev"` returns all parameters under that path; use `--recursive` to include all nested paths (e.g. `/my-app` with `--recursive` returns dev and prod). Combine with `--with-decryption` for SecureStrings. **Version history** is available in the console for each parameter.

## Inventory

- **Purpose:** Collect **metadata** from **managed instances** (EC2 and on-prem): installed software, OS info, drivers, configurations, installed updates, running services. Builds a searchable **inventory** of what is on each node.
- **View and analyze:** View in the **SSM console** (e.g. instance coverage by type, top OS versions, top applications). Optionally **sync inventory data to S3** via **Resource Data Sync** — then query with **Athena** (serverless SQL) and build dashboards with **QuickSight**.
- **Collection:** You set a **metadata collection interval** (minutes, hours, or days). Inventory can be **aggregated from multiple accounts** into one account for central querying. **Custom inventory** types can be defined (e.g. replication status per instance).
- **How it’s enabled:** Enabling “inventory on all instances” in the **Inventory** page creates a **State Manager association** that puts instances into the state “gather software inventory.” Targets are the managed instance IDs; **State Manager** runs the association and reports success/pending per instance. Once the association has run, instances show as “inventory enabled” and you can see summaries (OS, applications, etc.) and detailed data.
- **Resource Data Sync (hands-on):** Create a **Resource Data Sync** (e.g. “DemoSync”) and choose an **S3 bucket** for SSM to write inventory data. The bucket needs a **bucket policy** that allows the SSM service to `PutObject` (and any required prefixes) in that bucket; use the policy example from the console and replace bucket name and account ID. After the sync is created, data is written to S3 and you can run **advanced queries** in **Athena** from the Inventory page (e.g. by inventory type such as **AWS:Application** — name, version, architecture, publisher, etc.). Initial sync can take a few minutes to populate.

## State Manager

- **Purpose:** **Automate** keeping managed instances in a **state you define**. You create an **association**: an SSM **document** that describes the desired state, plus a **schedule** (e.g. every 24 hours) on which the association is applied to targets (instance IDs, tags, or resource groups).
- **Use cases:** **Bootstrap** instances with software (e.g. install CloudWatch agent); **patch** OS and applications on a schedule; enforce configuration (e.g. “port 22 must be closed,” “antivirus must be installed”). **Inventory** is implemented as a State Manager association whose “state” is “gather software inventory.”
- **How it works:** You choose an SSM **document** (e.g. AWS-ConfigureAWSPackage for CloudWatch agent, or the built-in inventory document), select **targets** (instances or a group), and set a **schedule**. State Manager runs the document on the schedule and reports **association status** and **execution history** (success, pending, failed) per instance. If an instance drifts (e.g. someone uninstalls software), the next run can bring it back to the desired state.
- **Exam-relevant:** State Manager = **desired state** + **schedule** + **SSM document**; associations are the mechanism for ongoing configuration and for enabling features like Inventory across the fleet.

## Distributor

- **Purpose:** **Package and deploy software** to **managed instances** (EC2, on-prem). You create a **Distributor package** (an SSM document) and deploy it to different **platforms** (e.g. Windows, Linux).
- **Package contents (in S3):** Package content is stored in **Amazon S3**. You provide **one zip file per target operating system** (e.g. one for Linux, one for Windows). Each zip contains an **install script**, an **uninstall script**, **executable(s)**, and a **JSON manifest** that describes the package. You can create **your own packages**, use **AWS-provided packages**, or **third-party packages** to install or update software on instances regularly.
- **How to install:** **(1) Run Command** — one-time install: run a command that installs the Distributor package on selected instances. **(2) State Manager** — on a schedule: use the document **AWS-ConfigureAWSPackage** so instances **regularly receive** the package from Distributor (desired state = package installed/updated); State Manager keeps the package in place and can repair drift (e.g. if someone uninstalls it).

## Patch Manager

- **Purpose:** **Automate patching** of managed instances: **OS updates**, **application updates**, and **security updates**. Supports **EC2** and **on-premises**; **Linux**, **macOS**, and **Windows**. Run **on demand** (when you choose) or **on a schedule** via a **Maintenance Window**.
- **Flow:** Patch Manager **scans** instances and produces a **patch compliance report** (which patches are missing or installed). The report can be sent to **S3** and used for auditing or automation. Patching is then applied (scan + install) using the document **AWS-RunPatchBaseline**, which can be run from the console, SDK, or a Maintenance Window. The **SSM agent** on each instance **queries Patch Manager** to determine which patches to install based on the **patch baseline** assigned to that instance. **Rate control** is available (e.g. via Maintenance Window) when running across many instances.
- **Two main concepts:** **(1) Patch baseline** — **(2) Patch groups.**

**Patch baseline**

- Defines **which patches may or must be installed** (and which are rejected) on your instances. **Predefined** baselines are provided by AWS per OS; they are **managed by AWS** and **cannot be modified**. **Default** behavior is to install only **critical and security** patches.
- **Custom patch baselines:** You create your own baseline: choose **approved** vs **rejected** patches, **auto-approve** patches within X days of release (so they get installed even without manual approval), and the **operating system**. You can also specify a **custom or alternative patch repository** (e.g. an internal corporate repo). One baseline can be set as the **default** for instances that do not belong to a patch group.
- To **apply** patches you run the SSM document **AWS-RunPatchBaseline**, which applies both **OS** and **application** patches (Linux, macOS, Windows Server).

**Patch groups**

- **Patch groups** associate a **set of instances** with a **specific patch baseline**. Use them when you have different baselines (e.g. dev vs prod) and want instances to get different patch sets.
- **Tag instances** with the tag key **`Patch Group`** (or the configured key) and a value (e.g. `dev`, `prod`, `test`). An instance can be in **only one patch group** at a time. Each **patch group** is **registered with exactly one** patch baseline.
- **Default baseline:** Instances **without** a patch group tag use the **default** patch baseline. So: instance with `Patch Group = dev` → baseline for “dev”; instance with `Patch Group = prod` or no patch group tag → baseline for “prod” or default. When you run **AWS-RunPatchBaseline** (e.g. via Run Command or Maintenance Window), each instance’s agent asks Patch Manager which baseline applies; Patch Manager uses the instance’s **Patch Group** tag (or default) to return the right list of patches to install.

**Patch policy (console)**

- In Patch Manager you can **create a patch policy** to automate scanning and/or installation. **Policy name** (e.g. DemoPolicy). **Scan only** (see what’s missing) or **scan and install**. If scan and install: set a **scanning schedule** (e.g. daily at 1:00 AM) and an **installation schedule** (e.g. weekly on Sunday); optional **reboot** if needed. Choose the **patch baseline** per OS: use the **recommended default** (AWS-defined for all supported OSes) or **custom baselines** (one per OS). Optionally **write patch logs to S3**. **Targets:** current region or **all regions** (single policy for multi-region). **Deployment targets:** all managed nodes or specific instances. **Rate control** (e.g. 10% of nodes at a time) and **error threshold** (stop if too many failures to avoid taking down the fleet). **IAM:** instance profile/role for applying patches. Create the policy to apply.
- **Patch Manager overview UI:** Dashboards for instance management, **compliance**, and reports; **node patching details**; **patch baselines** per OS (view, create custom with **approval rules** and **exceptions**); **patches** list (by OS, release date, importance); **settings** (e.g. Security Hub integration); link to **Maintenance Windows** on the left.

## Maintenance Windows

- **Purpose:** Define a **schedule** (and duration) when SSM can run **tasks** on registered instances — e.g. **OS patching**, **driver updates**, **software installation** — so changes happen during a controlled window (e.g. 3:00–5:00 AM).
- **Contents:** A Maintenance Window has a **schedule** (cron or rate expression), a **duration** (how long the window stays open), a set of **registered targets** (instances, by ID/tag/resource group), and **tasks** (e.g. Run Command with **AWS-RunPatchBaseline**, or Automation) that run during the window. You can use **rate control** so only a subset of targets are patched at a time within the window.
- **Creating a Maintenance Window (console):** Create with a **name** (e.g. DemoMaintenanceWindow). Option to **allow unregistered targets** (tasks can target instances not pre-registered). **Schedule:** cron (e.g. daily at 3:00 AM) or rate expression. **Duration** (e.g. 2 hours). Option to **stop initiating new tasks** X hours before the window closes (e.g. 1 hour). Optional explicit start/end time. After creation, **register tasks** in the window — e.g. **Run Command** with document **AWS-RunPatchBaseline**, name the task (e.g. “patch”), select **targets** (registered or unregistered instances). Set **concurrency** (e.g. one target at a time) and **error threshold** (e.g. 0 to stop on first failure). The patch runs only during the window. You can delete the Maintenance Window to clean up.
- **Exam-relevant:** Patch Manager is used to **patch** instances; patches can be run **inside a Maintenance Window** with **rate control** to avoid impacting the whole fleet at once.

## OpsCenter

- **Purpose:** **View, investigate, and remediate issues in one place**. Operational issues are **centralized** in Systems Manager to **reduce mean time to resolve (MTTR)**. Supports **EC2** and **on-premises** managed nodes.
- **What flows in:** Data is **aggregated** from **CloudWatch**, **Application Insights**, **EventBridge**, **Config**, **Security Hub**, **DevOps Guru**, and **SSM Incident Manager**. Examples: **security findings** (Security Hub), **performance issues** (e.g. DynamoDB throttling), **failures** (e.g. instance failed to launch from an ASG).
- **OpsItems:** An **OpsItem** is an operational issue or interruption that needs investigation and remediation. It can be created from **events**, **resources**, **configuration changes**, **CloudTrail** logs, **EventBridge**, or other sources. In OpsCenter you see all OpsItems and get **recommendations** — which **runbooks** and **SSM Automations** can help resolve the issue.
- **Notifications and automation:** You can set up **notifications** and **automations** around OpsItems. Example: **EventBridge** (e.g. daily) invokes a **Lambda** that scans EC2 for **orphaned EBS volumes** (e.g. unattached or unused for 45+ days) and **creates OpsItems** in OpsCenter. From OpsCenter, recommendations might include running an SSM document to **create a snapshot**, **delete a snapshot**, or **delete the volume** — executed as **SSM Automations**.

## Features (reference)

Systems Manager has many capabilities; exam-relevant areas include:

- **Node / fleet:** Fleet Manager, Compliance, Inventory, Hybrid Activations, **Session Manager**, **Run Command**, **State Manager**, **Patch Manager**, Distributor
- **Change management:** **Automation**, Change Calendar, **Maintenance Windows**, **Documents**, Quick Setup
- **Application:** Application Manager, AppConfig, **Parameter Store**
- **Operations:** Explorer, OpsCenter, CloudWatch dashboards

---
*Summary from course/tutorial transcripts.*
