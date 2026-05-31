---
title: "AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools"
date: "2026-03-28"
excerpt: "CloudOps notes on AWS Service Catalog (products, portfolios, sharing, TagOptions), CloudWatch billing metrics in us-east-1, Cost Explorer, Budgets with actions, cost allocation tags, CUR, Compute Optimizer, and Billing Conductor."
author: "Tony Duong"
category: "note"
tags: ["aws", "service-catalog", "billing", "cost-explorer", "budgets", "cur", "compute-optimizer", "cloudformation", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 14
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Companion to **[AWS Account Management: Health Dashboard, Organizations, SCPs, and Control Tower](/en/posts/aws-health-dashboard-organizations-control-tower)** — focused on **self-service provisioning**, **spend visibility**, **budgets**, and **optimization** tooling.

## AWS Service Catalog

**Problem:** builders want **speed**, but ad-hoc **CloudFormation** / console clicks create **non-standard** or **non-compliant** resources.

**Model:**

- **Admins** publish **products** — wrappers around **provisioning artifacts** (most often **CloudFormation** templates; **Terraform**-style options exist in console but are out of scope for the core exam story).
- **Portfolios** group products (e.g. “**WebDev**” templates only).
- **Access:** **IAM** principals (**users** / **groups** / **roles**) in the **same** account get portfolio access; for **cross-account** sharing use **Principal ARN** style grants as documented.
- **End users** see an **allow-listed** product list and **launch** a **provisioned product**; behind the scenes Service Catalog runs **CloudFormation** (stack name often prefixed e.g. **`SC-`**). Users may have **no broad AWS access**—only **Service Catalog**.

**Advanced (awareness):** **Constraints** narrow parameters users can choose (launch guardrails). **Support** contact fields on products for internal helpdesk routing.

**Console branding:** **Preferences** can customize **logo**, **accent color**, and **brand name** for the portal in **supported Regions**; elsewhere may require an **AWS Support** request.

### Sharing portfolios

| Mode | Behavior |
| --- | --- |
| **Share reference / import** | Recipient **imports** a **shared portfolio** link; stays **in sync** with the **owner** account when products are added or updated. |
| **Deploy a copy** | **Snapshot**-style copy into the recipient; **updates** in the source do **not** flow automatically — re-copy or re-publish as needed. |

Imported portfolios can feed **local** portfolios / products in the recipient account per org process.

### TagOptions

Central **key/value** pairs managed by Service Catalog. Associate a **TagOption** with a **portfolio** (and/or **product**) so every **provisioned** stack **inherits** those tags (e.g. `Environment=prod`) for **cost allocation** and **allowed-tag** discipline. **TagOptions** can be **shared** to other accounts or the **organization** like portfolios.

## CloudWatch billing alarms

**Billing metrics live only in `us-east-1` (N. Virginia)** in **CloudWatch**, even though they represent **account-wide** (global) **spend** — not a single Region’s infrastructure bill.

1. **Billing console** → **Billing preferences** → enable **Receive billing alerts** (usage charges and fees). Wait for metrics to appear (course: **~15 minutes** minimum; sometimes longer).
2. **CloudWatch** (in **`us-east-1`**) → **Alarms** → **Billing** (this section **only** appears there).
3. Choose **metrics:** **Total Estimated Charge** for **whole-account** spend, or drill into **By Service** (e.g. **EC2**, **S3**, **Config**).
4. Set a **static threshold** (e.g. **> $10**) and route to **SNS**.

**Limitation:** **Actual** invoiced charges — not a substitute for **tag**-scoped or **project**-level accounting (**Budgets** / **CUR** are better for that).

## AWS Cost Explorer

Interactive **cost and usage** analytics: charts, **custom reports**, **saved** views.

- **Granularity:** from **account** totals down to **monthly**, **hourly**, or **resource-level** breakdowns (where data exists).
- **Savings Plans:** recommendations based on historical usage (estimated monthly spend, commitment suggestions).
- **Forecasts:** project spend **months** ahead (course cited **up to ~18 months** with confidence bands — verify UI).
- Often the **primary** “billing service” called out on associate-style exams besides **Budgets** / **CUR**.

## AWS Budgets

Create **budgets** on **cost**, **usage**, **Reservation** utilization/coverage, or **Savings Plans** utilization/coverage.

- **Templates:** e.g. **zero spend** (free tier watch), **monthly cost**, **daily Savings Plan coverage** — quick setup with fewer knobs.
- **Advanced:** same **dimensions** as Cost Explorer — **service**, **linked account**, **tag**, **Region**, **instance type**, **AZ**, **purchase option**, **charge type** (**unblended**, **blended**, **amortized**), include **refunds** / **credits**, etc.
- **Notifications:** up to **~5** per budget (verify quota); thresholds on **actual** spend (e.g. **80%** of monthly budget) and/or **forecasted** spend (early warning).
- **Channels:** **email**, **SNS**, **AWS Chatbot** (Slack / Chime / Teams).
- **Actions (optional):** require an **IAM service role** for **Budgets**. When a threshold fires, optionally **attach IAM policy** to users/groups/roles, **attach SCP** to org **root** / **OU**, **stop EC2** instances, or **stop RDS** instances (Region-scoped) — **remediate** or **freeze** spend paths.
- **Pricing:** first **two** budgets **free**, then a **per-budget daily** fee (course: **$0.02**/day — confirm pricing).

**vs billing alarms:** Budgets are **richer** (filters, forecast, RI/SP, actions).

## Cost allocation tags

Split costs in **CUR**, **Cost Explorer**, and **Usage reports** by **tag**.

- **User-defined** tags appear as **`user:`** prefix in reports (e.g. `user:Environment`) once **activated** under **Cost Management** → **Cost allocation tags**.
- **AWS-generated** tags use the **`aws:`** namespace (e.g. **`aws:createdBy`**, **`aws:cloudformation:stack-id`**) — enable the ones you need the same way.
- Tags must exist on **resources** in production; activation only **exposes** them for **billing** lineage (retroactive behavior follows AWS docs).

## Cost and Usage Report (CUR)

The **most detailed** cost export: **line-item** **hourly** or **daily**, **pricing**, **RI**/SP metadata, **resource IDs** (optional), and **activated** allocation tags.

- Delivered to **S3** on a schedule (e.g. **daily**); default **bucket policy** assists delivery.
- **Athena** / **Redshift** / **QuickSight** integrations available from the wizard; **compression** and **report versioning** (append new files vs overwrite) configurable.
- **Activation** can take **up to ~24 hours** before data is usable.

## AWS Usage Reports

From **Billing** / **Cost Management**, download **CSV** **usage** reports per **service** (e.g. **EC2** **usage types** by **day** for a **billing period**). Handy for **ad-hoc** spreadsheets; **CUR** is the **system of record** for heavy analytics.

## AWS Compute Optimizer

**Rightsizing** guidance using **ML** on **configuration** + **CloudWatch** utilization.

- **Supported (high level):** **EC2** instances, **EC2 Auto Scaling groups**, **EBS** volumes, **Lambda**, **ECS on Fargate**, **Aurora** / **RDS**, **commercial software licenses** (where offered).
- Classifications such as **over-provisioned**, **under-provisioned**, **optimized**; course claims **up to ~25%** savings potential — treat as **marketing order-of-magnitude**.
- **Export** recommendations to **S3**.
- **IAM:** viewers typically need **`ComputeOptimizerReadOnlyAccess`** (managed policy).
- **Exam pitfall:** **new EC2** instances may **not** appear until **enough** metrics exist — course guideline **~30 hours** of runtime for **data collection**.

## AWS Billing Conductor

**Does not change** what AWS **charges** you — it changes how **internal** or **customer-facing** **invoices** are **presented** and **allocated**.

- **Pro forma** bills, **markups** / **discounts**, **account grouping** for **departments** / **cost centers**, **MSP** **customer** pricing views, **chargeback** / **showback**.
- Target **enterprises** and **complex accounting**; overkill for small teams.

## Key Takeaways

- **Service Catalog** = approved **CFN** (±) **products** in **portfolios** + **IAM** access; **imported shared** portfolio **syncs**; **copy** does not; **TagOptions** enforce **tags** on **provisioned** resources.
- **Billing alarms** = **`us-east-1`** **CloudWatch** only; enable **billing alerts** first; **total** or **per-service** metrics → **SNS**.
- **Cost Explorer** = explore, **forecast**, **SP** recommendations; **Budgets** = thresholds, **forecast** alerts, **optional stop/SCP/IAM** actions, **granular** filters; **2** budgets **free** then **paid**.
- **Cost allocation tags** must be **on resources** and **activated**; **CUR** = **authoritative** **detailed** export to **S3** + **Athena**/BI; **Usage reports** = lighter **CSV** pulls.
- **Compute Optimizer** = **rightsizing** across multiple services; **read-only** policy; **~30h** **EC2** history caveat.
- **Billing Conductor** = **re-billing** / **showback** **presentation**, not AWS **list price** **reality**.
