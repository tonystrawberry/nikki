---
title: "AWS DataSync and AWS Backup: Disaster Recovery Notes"
date: "2026-03-29"
excerpt: "CloudOps exam notes on AWS DataSync (agents, NFS/SMB/HDFS, S3/EFS/FSx targets, schedules, metadata, Snowcone) and AWS Backup (backup plans, cross-region/account, vault lock WORM, console workflow)."
author: "Tony Duong"
category: "note"
tags: ["aws", "datasync", "aws-backup", "disaster-recovery", "snowcone", "s3", "efs", "fsx", "worm", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 15
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Exam-oriented **disaster recovery** and data-movement material: **AWS DataSync** for large dataset transfers with optional metadata preservation, and **AWS Backup** for centralized, policy-driven backups including immutable vault policies.

## AWS DataSync

**AWS DataSync** moves and **synchronizes** large amounts of data **to and from** AWS. It shows up frequently on associate-style exams; the core is knowing **when an agent is required**, **what it can talk to**, and that replication is **scheduled**, not streaming.

### Where DataSync runs

- **On-premises or another cloud:** you connect to file or object sources using **NFS**, **SMB**, **HDFS**, or similar protocols. A **DataSync agent** must run **on that side** (on-prem VM/appliance or equivalent in the other cloud) to perform the connection.
- **AWS to AWS:** copying between **Amazon S3**, **Amazon EFS**, and **Amazon FSx** (and among supported FSx variants in the course narrative) uses the **DataSync service** **without** deploying an agent.

### Destinations and storage classes

DataSync can write to:

- **Amazon S3**, including **cold** tiers and **Glacier**-class destinations as presented in training.
- **Amazon EFS**
- **Amazon FSx** (course: supports the FSx family you would pair with file workloads)

### Scheduling and behavior

- Transfer **tasks are not continuous**. You **schedule** runs (e.g. **hourly**, **daily**, **weekly**). Expect **lag** between changes at the source and the next sync window.
- DataSync can **preserve file permissions and metadata**, aligned with **NFS POSIX** semantics and **SMB** ACLs. Training calls this out as the option that **keeps metadata intact** when moving data between locations—a common **differentiator** in scenario questions.

### Performance and direction

- A single task can use up to about **10 Gbps** of throughput; you can set **bandwidth limits** so sync does not saturate the WAN.
- Sync can run **from on-premises into AWS** and **from AWS back to on-premises** (bidirectional story).

### Low-bandwidth pattern: Snowcone

If the exam scenario wants **DataSync** but **WAN capacity** is insufficient, **AWS Snowcone** is the highlighted device: it ships with the **DataSync agent pre-installed**. Flow: place **Snowcone** on-prem, ingest data with the agent, **ship** the device to AWS, then complete sync into **S3**, **EFS**, or **FSx** in Region.

## AWS Backup

**AWS Backup** is a **fully managed** service to **centrally manage and automate backups** across many AWS resources, without custom scripts or one-off manual jobs for each service.

### Supported resources (high level)

The supported list grows over time; the course emphasizes the **pattern** and representative services, including for example:

- **Compute and block:** **EC2**, **EBS**
- **Object:** **Amazon S3**
- **Databases:** **RDS** (engines supported by Backup), **Aurora**, **DynamoDB**, **DocumentDB**, **Neptune**
- **File:** **EFS**, **FSx** (including **Lustre** and **Windows File Server**)
- **Hybrid:** **AWS Storage Gateway** (e.g. **Volume Gateway**)

Verify current **Backup** supported resource list in AWS documentation before production design.

### Cross-Region, cross-account, and recovery style

- **Cross-region backup copies** support **DR** strategies (secondary Region retention from one console/workflow).
- **Cross-account backups** support multi-account operating models.
- **Point-in-time recovery (PITR)** is available for **supported** services (e.g. **Aurora** in the training narrative—confirm per engine/product).

### Backup plans and policies

- **On-demand** backups and **scheduled** backups.
- **Tag-based** backup selection (e.g. only resources tagged `environment=production`).
- **Backup plans** encode:
  - **Frequency** (e.g. every 12 hours, daily, weekly, or **cron**-style expressions where offered)
  - **Backup window** (start time and duration / completion window)
  - Optional **transition of backup storage to cold** after a delay (never, or after days / weeks / months / years)
  - **Retention** for recovery points (always retain vs time-bounded in those same units)

Recovery points are stored in **AWS-managed** storage (internally backed by **S3** in the course explanation)—operators work with **backup vaults** and jobs, not your own bucket for primary backup storage.

### Backup vault lock (WORM)

**Vault Lock** enforces a **WORM** (**write once, read many**) style policy on a **backup vault**:

- Locked recovery points **cannot be deleted** in ways that violate the policy.
- Protects against **accidental or malicious** deletes and against changes that **shorten or weaken** retention.
- Training states that **even the account root user** cannot delete protected backups when lock rules apply—strong **compliance** and **ransomware-resilience** story on exams.

## Console walkthrough (recap)

Typical lab flow:

1. **Create backup plan** — start from a **template**, **build** a plan in the wizard, or define **JSON**.
2. **Backup rules** — a plan can contain **multiple** rules (e.g. **daily** and **monthly**). Each rule sets **backup vault** (default or custom), **frequency**, **backup window**, **cold storage transition**, **retention**, and optional **copy to another Region** for DR.
3. **Assign resources** — use the **default service role** (or a custom role) with correct permissions. Selection modes: **all supported resource types** (often combined with **tags**), or **specific resource types** and instances (e.g. one **DynamoDB** table or all tables).
4. **Tag example** — a volume tagged `environment=production` is **automatically** included when the plan assignment matches that tag.
5. **Operate** — monitor **backup**, **restore**, and **copy** jobs; review **settings** for org-wide policies, cross-account monitoring, etc.
6. **Cleanup** — remove **assignments**, then **rules** / **plan**; delete test **EBS** volumes if applicable.

## Key Takeaways

- **DataSync** = **large data movement/sync**; **agent** for **NFS/SMB/HDFS** (on-prem or other cloud); **no agent** for **S3 ↔ EFS ↔ FSx** inside AWS.
- Targets include **S3** (including **Glacier-class** story in course), **EFS**, **FSx**; jobs are **scheduled** (hourly/daily/weekly), **not** continuous.
- **Metadata and POSIX/SMB permissions** preservation is a **high-value** exam detail.
- Throughput up to **~10 Gbps** per task with optional **throttling**; **bidirectional**; **Snowcone** + **pre-installed agent** for **limited bandwidth**.
- **AWS Backup** = **central** automated backups across a **broad** service set; **cross-Region** and **cross-account**; **backup plans** with **frequency**, **window**, **cold transition**, **retention**; **tag-based** assignment.
- Recovery points live in **managed** vault storage (S3 under the hood per training); **Vault Lock** = **WORM** / **immutable** backups, **root** cannot bypass delete in the compliance framing taught.
- Console path: **template plan** → **multiple rules** → **assign resources** (tags + default role) → **jobs** → ordered **teardown**.
