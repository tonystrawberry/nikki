---
title: "AWS Account Management: Health Dashboard, Organizations, SCPs, and Control Tower"
date: "2026-03-28"
excerpt: "CloudOps notes on AWS Health (service vs account vs org views, EventBridge automation), AWS Organizations (OUs, consolidated billing, SCPs, RI sharing, PrincipalOrgID), and Control Tower landing zones and guardrails."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "health", "organizations", "scp", "control-tower", "multi-account", "billing", "sysops", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 13
collectionTitle: "AWS CloudOps Engineer - Associate"
---

High-yield material for **SysOps** / **CloudOps**: how **AWS Health** surfaces incidents, how **Organizations** structures accounts and **SCPs** limit them, and how **Control Tower** bootstraps a governed multi-account estate. The course also positions **Billing** (consolidated payer, cost tools) alongside the org **management account**—use the **Billing console** on the payer for invoices and allocation; details below focus on Health, Organizations, and Control Tower. For **Service Catalog**, **CloudWatch billing alarms**, **Budgets**, **Cost Explorer**, **cost allocation tags**, **CUR**, **Compute Optimizer**, and **Billing Conductor**, see **[AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools](/en/posts/aws-service-catalog-billing-cost-management)**.

## AWS Health Dashboard (two faces)

### Service health (public / “Service History”)

- Formerly **AWS Service Health Dashboard** — **Region** × **service** status over time, **RSS** feeds, and **open** global issues affecting many customers.
- **General** availability picture, not tailored to **your** resources.

### Your account health (personalized)

- Formerly **Personal Health Dashboard (PHD)**; now **Health** for **your accounts** in the console (**bell** → **Event log** / Health).
- Shows **open** and **recent** issues, **scheduled changes** (e.g. **EBS** maintenance), **affected resources**, **remediation** hints, and an **event log** (opened/resolved times) for problems that **actually touch** resources you use.
- **Global** experience: incidents relevant to **your** usage (e.g. **EC2** in **us-east-2**) even when public Service Health looks broad.

### Organization health

- Aggregate **Health** visibility across **all accounts** in an **AWS Organization** (configure from the org context).
- Automate on top via **EventBridge** (see below).

## AWS Health → EventBridge

**AWS Health** emits events you can match with **EventBridge** rules to drive **SNS**, **Lambda**, **SQS**, **Kinesis**, etc.

- Covers **account-specific** events (resources you use) and **public** service events where useful.
- **Use cases:** email when **EC2** instances are scheduled for **platform updates**; **Lambda** on “**exposed IAM keys**”-style findings to **disable** keys; **EC2 reboot** / other **targets** when instances are scheduled for **retirement** so workloads recover without waiting for forced stop.

**Note:** treat orchestration as **asynchronous** like other AWS control-plane integrations—design for **retries** and **idempotency**.

## AWS Organizations

**Global** service to group **multiple accounts** under one **organization**.

- **Management account** (payer / “master”) — owns **consolidated billing** (**one** payment method pays for **all** members). **Member** accounts join by **invitation** (accept in the child; invitations **expire**, e.g. on the order of **two weeks** in the course) or are **created** by the org (email + **IAM role** name for **OrganizationAccountAccessRole**-style access).
- An AWS account can belong to **only one** organization at a time.
- **Pricing benefits:** **aggregated** usage can improve **volume** discounts (**EC2**, **S3**, …); **Reserved Instances** and **Savings Plans** discounts can be **shared** across accounts when **sharing** is **enabled** on **both** (or all relevant) accounts — can **disable** sharing per account (including payer) to **isolate** commitment benefits.

### Organizational units (OUs)

- **Root** OU holds the **management** account; create nested OUs (**dev** / **test** / **prod**, **business unit**, **project**, or mixed).
- **Move** member accounts between OUs to align **SCPs** and operational boundaries. **Best practice:** keep the **management** account at **root** unless you have a strong reason to move it.

### Why multi-account (vs one account, many VPCs)

- Stronger **blast-radius** isolation than VPCs alone.
- **Tagging** standards for **cost allocation**; **org-wide CloudTrail** to a **central S3** bucket; **central logging** account for **CloudWatch Logs**; **cross-account** **IAM roles** for **break-glass** / automation from the **management** account.

### Consolidated billing (SysOps angle)

- **Charges** roll up to the **management** account; use **Billing** and **Cost Management** there for **invoices**, **budgets**, and **allocation** (tags, **CUR**, etc.).

## Service control policies (SCPs)

**SCPs** are **organization** policies attached to **root**, **OUs**, or **accounts**. They **restrict** the **maximum** permissions **IAM identities** in **member** accounts can ever get—they **do not grant** permissions by themselves.

- **Management account is exempt** — **no SCP** limits the **management** account (prevents locking out the org).
- Effective access in a member = **intersection** of **identity policies** and **all inherited SCPs** along the OU path; an **explicit `Deny`** anywhere in scope **wins**.
- You typically attach **`FullAWSAccess`** (allow all services) at high levels, then add **`Deny`** SCPs (or use **allow-list** SCPs that only permit listed services—much stricter).
- **Demonstrated effect:** **Deny S3** on an OU blocks **S3** even for the **account root user** in a **member** account.

### SCP patterns (exam-style)

- **Deny `ec2:RunInstances`** unless **`aws:RequestTag/department`** **exists** (enforce **tag on launch**).
- **Deny `RunInstances`** unless **`business-unit`** tag **starts with** `infra-` (tag **shape**, not just presence).
- **Deny `RunInstances`** unless a tag like **`deployment-type`** is **`in-region`** or **`edge`** only (allowed **enumerations**).
- **Region allow-list:** **`Deny *`** on `*/*` with **`Condition`** **`StringNotEquals`** on **`aws:RequestedRegion`** limited to **`eu-central-1`**, **`eu-west-1`**, … (everything outside those Regions **denied**).

### Other organization policy types (awareness)

- **Backup policies** — org-wide **AWS Backup** plans.
- **Tag policies** — standardize **tag keys** / **values** for **audit** and **cost allocation**; list **non-compliant** resources; automate reactions via **EventBridge** on tag compliance signals.

### `aws:PrincipalOrgID`

In **resource policies** (e.g. **S3** bucket policy), **`aws:PrincipalOrgID`** lets you **allow** principals from **any** account in the org **without** listing every **account ID**.

## AWS Control Tower

Opinionated **landing zone** on top of **Organizations**: **multi-account** layout, **guardrails**, and **dashboards** with minimal manual wiring.

- **Landing zone** wizard: **home Region**, optional **Region deny** for unapproved Regions, **additional Regions** for **governance** scope.
- Creates **OUs** (course demo: **Security** + **Sandbox**; post-setup console may show **Core** vs **Custom** with **audit** / **log archive** under **Core**).
- **Dedicated accounts:** **Log archive** (immutable-style logging), **Audit** (security tooling), plus **management** / **workload** patterns—**emails** per account required.
- **Account access:** **IAM Identity Center** (successor to **SSO**) is the **default** path to access **all** enrolled accounts from **one** portal; **self-managed** access is possible but heavier.
- **CloudTrail** enabled for the **landing zone**; optional **S3** log delivery and **KMS** encryption.
- **Guardrails:** **preventive** (implemented with **SCPs**—e.g. block **deleting** log archive, block **public** log bucket policies, block **disabling** **CloudTrail**) and **detective** (often **AWS Config** rules). Course cited on the order of **~20 preventive** and **~2 detective** in a default bundle—counts change over time.
- **Operational rule of thumb:** after enrollment, prefer **Control Tower** workflows (**Account Factory**, **OU** registration) for accounts and structure you want **governed** by the landing zone; avoid **fighting** the automation from raw **Organizations** for those resources.
- **Cost / time:** provisioning is **slow** (course: **~60 minutes**) and **not** free—**avoid** running full setup in a personal account unless you accept charges.

## Key Takeaways

- **Service Health** = broad **Region**/**service** timeline; **Account Health** = **your** resources, **affected assets**, **maintenance**, **remediation**; **Org Health** = rolled-up view; **bell** / **Event log** entry points.
- **Health → EventBridge** enables **SNS** alerts, **Lambda** remediation, **EC2** actions, etc., for **scheduled** work and **risk** events.
- **Organizations** = **global**, **one org per account**, **management** payer, **consolidated billing**, **volume** and **RI** / **Savings Plans** sharing (with **per-account** sharing toggles), **nested OUs**, **org trails** / **central logs**.
- **SCPs** constrain **members** only; **`Deny`** and **allow-lists** are powerful; **tag** and **Region** conditions are common exam patterns; **`aws:PrincipalOrgID`** simplifies **cross-account** **trust** in **resource** policies.
- **Control Tower** = **landing zone** + **guardrails** (**SCP** + **Config**) + **Identity Center** portal + **Security/Audit/Log** accounts; **expensive** and **slow** to stand up—know **what** it creates, not just **how** to click through in prod blindly.
