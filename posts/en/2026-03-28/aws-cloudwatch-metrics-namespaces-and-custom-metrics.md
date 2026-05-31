---
title: "AWS Observability and Governance: CloudWatch, EventBridge, CloudTrail, and Config"
date: "2026-03-28"
excerpt: "CloudOps notes on CloudWatch, EventBridge (CloudTrail API patterns, Pipes, DLQ), Service Quotas, CloudTrail (digest integrity, org trails, EventBridge latency), and AWS Config (rules, aggregators, SSM remediation, vs CloudWatch and CloudTrail)."
author: "Tony Duong"
category: "note"
tags: ["aws", "cloudwatch", "eventbridge", "cloudtrail", "aws-config", "service-quotas", "monitoring", "logs", "alarms", "synthetics", "containers", "ec2", "observability", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 12
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## What CloudWatch Metrics Are For

**Amazon CloudWatch** collects **metrics** for AWS services (and custom sources). Each metric has a **name** (often self-explanatory: `CPUUtilization`, `NetworkIn`, …). **Trends** in metrics support **troubleshooting** and **capacity** decisions.

### Structure

- **Namespace** — groups metrics (e.g. `AWS/EC2`, `AWS/EBS`, service-specific namespaces).
- **Dimensions** — attributes that identify the series (e.g. **`InstanceId`**, `AutoScalingGroupName`, environment tags). Up to **30** dimensions per metric (per course).
- **Timestamp** — each data point is time-stamped.

**Console:** **CloudWatch** → **Metrics** → **All metrics** → browse by **namespace** and filter by **Region**, **resource**, **dimension**.

## Anomaly detection

CloudWatch can learn a **baseline** from historical metric data using **machine learning**, then flag **anomalies** when values fall outside the expected band.

- Create **alarms** on **anomaly detection** instead of only **static** thresholds.
- You can **exclude** time ranges or events from **training** if early data was unrepresentative (maintenance windows, incidents).

## EC2: Basic vs Detailed Monitoring

- **Default (basic):** hypervisor metrics for EC2 at **5-minute** granularity (free).
- **Detailed monitoring (paid add-on):** **1-minute** granularity for the instance.

**Why enable detailed monitoring:** react faster to changes; can help **Auto Scaling groups** make **scale-out / scale-in** decisions sooner when policies depend on those metrics.

**Gap:** **Memory (RAM)** usage is **not** provided by default EC2 metrics — publish it as a **custom metric** (or use the **CloudWatch agent** / scripts).

## Custom Metrics (`PutMetricData`)

Use the **`PutMetricData`** API (CLI, SDK, or **CloudWatch unified agent** under the hood) to publish your own **namespace**, **metric names**, **values**, **units**, and **dimensions** (e.g. `InstanceId`, `InstanceType`, `Environment`).

### Resolution (storage resolution)

- **Standard resolution:** data points as granular as **1 minute** (60 seconds).
- **High resolution:** allow submissions every **1, 5, 10, or 30 seconds** (for bursty or fine-grained workloads — confirm parameter names in current API docs).

### Timestamps (high-yield exam detail)

CloudWatch **accepts** metric timestamps **up to two weeks in the past** or **up to two hours in the future** **without rejecting** the call.

**Implication:** **incorrect host time** (skewed NTP) can make metrics appear **misaligned** in graphs. Keep instances **time-synced** if you rely on accurate chronology.

### Workflow pattern

1. Process on EC2 (or Lambda, etc.) measures RAM, disk, business KPIs, login counts, …
2. Call **`PutMetricData`** on a schedule (cron, systemd timer, agent).
3. New metrics appear under a **custom namespace** in **All metrics** with your **dimensions**.

The **CloudWatch unified agent** uses **`PutMetricData`** (and related APIs) to push standard and custom metrics regularly.

## Dashboards

- **Cross-Region and cross-account:** one dashboard can show widgets whose metrics come from **multiple Regions** and **multiple AWS accounts** (exam highlight).
- **Time zone**, **time range**, and **auto refresh** are configurable; dashboards can be **shared** with users **without** AWS accounts (share links / embedded views — follow current console options).
- **Pricing (course framing):** **3** dashboards including up to **50** metrics **free**; additional dashboards billed per month (verify pricing).
- **Automatic dashboards:** AWS can generate a starter dashboard for a service (e.g. **Auto Scaling**) filtered by **resource group**.
- **Custom dashboards:** add widgets — **line**, **stacked area**, **number**, **text**, **alarm status**, **Logs Insights** result tables, etc. All widgets share the **same** global time range for correlation.
- When adding a metric widget, pick the **Region** explicitly so **Frankfurt** and **us-east-1** series can sit side by side.

## CloudWatch Logs

### Model

- **Log group** — usually one per **application** or integration.
- **Log stream** — instances of that app: **containers**, **hosts**, **Lambda** invocations, **stdout/stderr** pairs, etc.
- **Retention** — **never expire**, or **1 day** up to **10 years** (course also showed **120 months** in console — same idea).

### Ingestion sources (examples)

**SDK**, **Unified Agent** (preferred; legacy **Logs Agent** deprecated), **Elastic Beanstalk**, **ECS** task definitions, **Lambda** (default), **VPC Flow Logs**, **API Gateway**, **CloudTrail** (via configuration), **Route 53** query logging, **RDS** / **Aurora** exports, etc.

### Encryption

Logs are **encrypted** by default; optional **KMS** CMK per log group.

### Metric filters

Define a **pattern** (e.g. count lines matching `installing` or `ERROR`). On match, **increment a CloudWatch metric** in a namespace you choose → graph and **alarm** on that metric (e.g. too many `error` lines → **SNS**).

### Subscription filters (real-time)

Stream matching log events to **Kinesis Data Streams**, **Kinesis Data Firehose**, or **Lambda**. Use **filter patterns** to select which events leave the group. Enables **near–real-time** analytics, **S3** archival via Firehose, **OpenSearch** ingestion, custom processors.

**Limit (course):** up to **two** subscription filters per **log group** — confirm current quotas.

### Batch export to S3

**`CreateExportTask`** exports a time range of logs to **S3** — **batch**, can take **up to ~12 hours**; **not** real-time.

### Cross-account log aggregation (pattern)

**Sender** account: subscription filter on a log group → **destination** object representing the **recipient** stream. **Recipient:** **resource policy** on the destination + **IAM role** assumable by sender that can **PutRecord** to **Kinesis**. Enables centralizing logs from many accounts/Regions into one pipeline (e.g. Kinesis → Firehose → S3).

## CloudWatch Logs Insights

- **Purpose-built query language** over **historical** log data — **not** a live tailing engine; runs when you **execute** a query.
- Auto-discovers **fields**; supports **filter**, **stats**, **sort**, **limit**, **parse**.
- Save queries, add **visualizations** to **dashboards**, export results.
- Can query **multiple log groups** at once, including **cross-account** (where configured).

Console provides **sample queries** (e.g. Lambda latency stats, **VPC Flow Logs** top IPs).

## Live Tail

**Live Tail** streams **near–real-time** matching events in the console for **debugging** (optional log stream filter + pattern). **Pricing:** limited **free** hours per day in the course — **stop** sessions when finished to avoid charges.

## Logs data protection

**Data protection policies** on a log group **detect** and **mask** sensitive data (100+ built-in **identifiers**: email, credit card, SSN, credentials, …) using **ML**; **custom** identifiers supported.

- Masked in **Insights**, **metric filters**, and **subscription** deliveries unless the principal has **`logs:Unmask`** (or equivalent unmask permission).
- Optional **audit** delivery to another log group, **S3**, or **Firehose**; metric **`LogEventsWithFindings`** → **alarm** → **SNS** when sensitive data is detected.

## Alarms

### States

- **OK** — condition not breached.
- **ALARM** — threshold or rule fired; **actions** run.
- **INSUFFICIENT_DATA** — not enough samples to evaluate.

### Evaluation

**Period** defines the window; statistics (**Average**, **Maximum**, **SampleCount**, …). Works with **high-resolution custom metrics** (e.g. **10s**, **30s**, or multiples of **60s** — align with metric resolution).

**Threshold types:** **static** or **anomaly detection** band.

### Actions

- **EC2:** **Stop**, **Terminate**, **Reboot**, **Recover**.
- **Auto Scaling:** scale **in** / **out**.
- **SNS** → email, chat, **Lambda** automation, etc.

### Composite alarms

Combine **other alarms** with **AND** / **OR** logic to reduce **noise** (e.g. alert only when **CPU high** **and** **network low**).

### EC2 status check alarms → recovery

Alarms on **instance status**, **system status**, or **attached EBS** health. **Recovery** moves the instance to **new** hardware while preserving **primary/secondary/elastic IPs**, **instance metadata**, **placement group** (supported instance types only).

### Log metric filter → alarm

Chain: **logs** → **metric filter** → **metric** → **alarm** → **SNS**.

### Testing alarms

**`set-alarm-state`** (CLI/API) forces **OK** / **ALARM** / **INSUFFICIENT_DATA** to validate **SNS** or **EC2** actions without waiting for real load (course demo: **terminate** instance on forced **ALARM**).

## CloudWatch Synthetics (Canaries)

**Headless scripts** (**Node.js** or **Python**) that mimic **customer journeys** (**HTTP/API** checks, **UI** flows with **headless Chrome**).

- Run **once** or on a **schedule**; capture **latency**, **HAR**, **screenshots**.
- **Blueprints:** heartbeat URL, **REST API** CRUD, **broken link** crawler, **visual** diff vs baseline, **Canary Recorder** (record browser → generated script), **GUI workflow** builder.
- On failure → **alarm** → automation (course example: **Lambda** updates **Route 53** to a healthy Region).

### Canaries in a VPC

To hit **private** targets: enable **DNS resolution** and **DNS hostnames** on the VPC. Canary results still go to CloudWatch:

- **Public path:** private subnet + **NAT gateway** for outbound API calls to CloudWatch.
- **Private AWS path:** **VPC interface endpoints** for **CloudWatch** (and often **S3** gateway endpoint for artifacts) so traffic stays on the AWS network.

## CloudWatch Container Insights

Collects **metrics** and **logs** for **ECS**, **Fargate**, **EKS**, and **ROSA** (OpenShift on AWS) without a custom **sidecar** for basic enablement.

- **Cluster**- and **service**-level metrics by default.
- **Enhanced** visibility adds **task** / **pod** / **container**-level granularity for deeper **CPU**, **memory**, **network**, and **throttle** troubleshooting.

Enable at **account** level or when creating a **cluster**.

## CloudWatch Internet Monitor

**Internet Monitor** is a **service plus dashboard** that uses AWS’s **global network telemetry** to show how **internet** conditions (cities, **ASNs**, AWS **edge / PoP** health) may affect **your** workloads and **end users**.

- **Global** traffic patterns and **health events**; **recommendations** aimed at improving **latency** and experience where possible.
- Telemetry surfaces in **CloudWatch Metrics** and **CloudWatch Logs**; **global health events** can go to **EventBridge** for **alerting** and automation.

## CloudWatch Network Synthetic Monitor

For **hybrid** links (**Direct Connect** or **site-to-site VPN**) between **on-premises** and **AWS**, **Network Synthetic Monitor** probes **IPv4** paths with **ICMP** or **TCP** — **no agent** installation on your side.

- Surfaces **packet loss**, **latency**, and **jitter** so you catch **degradation** on the **corporate ↔ cloud** path.
- Results publish to **CloudWatch Metrics** for **dashboards** and **alarms**.

## Amazon EventBridge (formerly CloudWatch Events)

**EventBridge** is the modern name for what used to be **CloudWatch Events** — expect **EventBridge** on exams and in newer docs.

### Core model

1. **Sources** emit **events** (JSON documents: `detail-type`, `source`, `account`, `time`, `region`, `resources`, `detail`, …).
2. **Rules** on an **event bus** match either an **event pattern** or a **schedule** (**cron** / **rate**).
3. Matched events invoke **targets** (often many per rule, with IAM).

**Example patterns:** EC2 **state-change** (e.g. `shutting-down`, `terminated`), S3 **object created**, **IAM root console sign-in**, **Trusted Advisor** findings.

**Example targets:** **Lambda**, **SQS**, **SNS**, **Kinesis Data Streams**, **Step Functions**, **ECS** tasks, **AWS Batch** jobs, **CodePipeline** / **CodeBuild**, **SSM Automation**, **EC2** API actions (start/stop/reboot), **API Gateway**, **CloudWatch Logs** (as a log **target**), and more.

### CloudTrail → EventBridge: reacting to almost any API call

Management (and configured) **API calls** recorded by **CloudTrail** also surface as events on the **default event bus**, so you can match **specific APIs** with **event patterns** and send to **SNS**, **Lambda**, etc.

**Examples (course):**

| Goal | API / service | Pattern idea |
| --- | --- | --- |
| Alert on **DynamoDB table deletion** | **`DeleteTable`** (DynamoDB) | Match **`eventName`** / **`eventSource`** for that call → **SNS**. |
| Alert on **role assumption** | **`AssumeRole`** (**STS**) | Match **`eventName`** / **`eventSource`** for **sts.amazonaws.com** → **SNS**. |
| Alert on **security group ingress changes** | **`AuthorizeSecurityGroupIngress`** (EC2) | Match that **EC2 API** → **SNS**. |

**Caveat:** delivery via **CloudTrail → EventBridge** is **not** real-time automation — see **CloudTrail** section for typical **latency** (course cites on the order of **~15 minutes** to **EventBridge** and **~5 minutes** for **log files** landing in **S3**; **verify** current docs).

### Event buses

| Bus | Purpose |
| --- | --- |
| **Default** | AWS services publish **service events** here (one per account per Region). |
| **Partner** | **SaaS** integrations (e.g. **Auth0**, **Zendesk**, **Datadog** — check current partner list) send events into a **partner** bus. |
| **Custom** | Your applications call **`PutEvents`** into **your** bus; same **rules** and **targets** as the default model. |

**Cross-account (two-way trust):**

- **Bus → bus:** On the **source** account’s bus, a **resource policy** must allow **`events:PutEvents`** (or equivalent) toward the **destination** bus. On the **destination** account’s bus, a **resource policy** must allow the **source account** (e.g. **root** principal from that account) to **`PutEvents`** into **that** bus. **Both** sides must explicitly permit send and receive.
- **Bus → SQS / SNS / Lambda / API Gateway / Kinesis** (targets that support **resource policies**): the **sending** side typically uses an **IAM role** that can **`SendMessage`**, **`Publish`**, **`Invoke`**, etc. The **destination** resource policy must allow the **other account** (or that role) to perform the action. Same **dual** permission idea: **sender** can act + **receiver** accepts.

### Archives and replay

**Archive** all events or a **filtered subset** from a bus; retention **indefinite** or **time-bounded**. **Replay** archived events into the bus (e.g. after fixing a **buggy Lambda** consumer) for **debugging** and **safe reprocessing**.

### Schema Registry

EventBridge can **discover** / register **schemas** for events on a bus so you know **field shapes**; supports **versioning** and **code generation** (bindings) from a schema.

### EventBridge Pipes

**Pipes** wire **supported streaming / queue sources** to **EventBridge-style targets** with **optional** **filter** and **enrichment** steps — **no custom consumer code** to pull from the source or push to many targets.

**Sources (examples):** **DynamoDB Streams**, **Kinesis Data Streams**, **Amazon MQ**, **Amazon MSK**, **SQS**, **self-managed Apache Kafka**.

**Targets (examples):** **Kinesis Data Firehose**, **Kinesis Data Streams**, **EventBridge event bus**, **Amazon Redshift** (where integration is offered), **SQS**, **SNS**, **API Gateway**, **ECS tasks**, and other **EventBridge** targets the console supports.

**Flow:** source → (optional) **filter** → (optional) **enrichment** → target.

**Enrichment** adapts or augments the payload using **Lambda**, **Step Functions**, **API Gateway**, or an **EventBridge API destination** — then the **enriched** event goes to the **target**.

### Retries and dead-letter queues (DLQ)

If delivery to a **target** fails (target down, timeouts, throttling, …), EventBridge **retries** using a **retry policy**: course defaults cited as **~24 hours** maximum window and **~185** attempts — **verify** current defaults and limits in docs.

After retries are **exhausted**, failed invocations can go to a **dead-letter queue** implemented with **SQS** so you can **inspect** and **reprocess** events later.

### SSM Automation as a target

**Systems Manager Automation** documents can be **targets** of rules — e.g. **EC2 Instance State-change** → run a **bootstrap** automation that installs software on a **newly started** instance. Same as other EventBridge use cases: trigger on **events** or on a **schedule** for **routine** automation.

### Console layout (high level)

- **Rules** — **event pattern** vs **schedule** (the console also highlights **EventBridge Scheduler** as the **preferred** path for many **recurring schedules**).
- **Pipes** — managed **source → filter → enrich → target** (see above).
- **Event buses** — default, **custom**, partner association.
- **Partner event sources** — third-party → partner bus.
- **API destinations** — invoke **external HTTPS** APIs with OAuth/API keys from rules.
- **Schemas** — browse **AWS** event schemas or **custom** registries.

### Event pattern filtering (content filtering)

Beyond simple equality, patterns support **prefix** / **suffix**, **anything-but**, **numeric** comparisons (e.g. `> 0`), **IP** matching (**CIDR**), **`exists`** (field must be present), **equals-ignore-case**, and nested combinations on `detail` (e.g. S3 **`detail-type`**: **Object Created** + **`detail.bucket.name`** + **`detail.object.key`** **suffix** `.png` + **source IP**).

Use **sample events** in the console (or docs) to copy **exact** field names (`instance-id`, `state`, …).

### Input transformers

For each target, optionally **reshape** the event:

1. **Input path** — JSONPath-like map from the event into up to **~100** **variables** (e.g. `<timestamp>` ← `$.time`, `<instance>` ← `$.detail.instance-id`, `<state>` ← `$.detail.state`, `<arn>` ← `$.resources[0]`).
2. **Input template** — string or JSON **body** sent to the target, referencing those variables.

**Use case:** downstream wants a **small fixed JSON** (e.g. for **CloudWatch Logs** target) instead of the full EventBridge envelope. **Test** with **sample events** in the rule wizard before saving.

### Hands-on patterns (course)

- **Rule** on **EC2 Instance State-change Notification** where `detail.state` is **`shutting-down`** or **`terminated`** → **SNS** topic (console can create the **invocation role**).
- **Schedule** (or **Scheduler**) **rate** **1 hour** → **invoke Lambda** (or ECS, Firehose, …).
- **Custom bus** for **application**-emitted events; **disable** rules when not needed to stop charges and noise.

## Service Quotas

**Service Quotas** lists **per-service limits** for the account (and whether each quota is **adjustable**). The console shows **applied** value, **usage** (where available), and graphs for metrics such as **Lambda concurrent executions**.

- **Request quota increases** — small bumps may **auto-approve**; larger requests go through **Support** with a **wait**.
- **CloudWatch alarms on quotas** — e.g. alarm when usage reaches **80%** of the **applied** quota for **Lambda concurrent executions** so operators can **raise** the limit before **throttling**. Configure **actions** (e.g. **SNS**) from the alarm.

**vs Trusted Advisor:** **Trusted Advisor** exposes **service limit** checks (on the order of **~50** in the course narrative) and can feed **CloudWatch** for alarms, but **Service Quotas** is the **dedicated** place to **browse** and **monitor** **all** quotas — prefer **quota-native** alarms for **breadth**.

## AWS CloudTrail

**CloudTrail** records **API activity** and **console** actions for **governance**, **compliance**, and **audit**. It is **on** by default at the account level (with console **Event history** behavior as documented).

### What gets logged

- Calls from the **console**, **CLI**, **SDKs**, and **AWS services** acting on your behalf.
- **Event history** in the console shows recent activity (course: **~90 days** of **management** events in the **Event history** view — confirm current behavior).

### Trails and long-term storage

Create a **trail** to deliver events to **S3** (and optionally **CloudWatch Logs**). Trails can be **single-Region** or **multi-Region** so you **centralize** history (e.g. one **bucket** for the org). **Beyond** the default console retention window, **S3** (often queried with **Athena**) is the **durable** store.

**Forensics example:** who **terminated** an EC2 instance — look up the **`TerminateInstances`** (or equivalent) record in **CloudTrail** for **principal**, **time**, **Region**, and **request parameters**.

### Event categories

| Type | What it is | Default in trails |
| --- | --- | --- |
| **Management events** | Control-plane changes and reads on resources (**CreateSubnet**, **AttachRolePolicy**, **DescribeInstances**, …). Often split into **read** vs **write** for cost / noise control. | **Logged** by default in trails (read/write options configurable). |
| **Data events** | High-volume **data plane** activity — e.g. **S3 object** APIs (**GetObject**, **PutObject**, **DeleteObject**), **Lambda** **`Invoke`**. | **Off** by default (expensive / noisy); enable **selectively** per bucket/function with read/write filters. |
| **Insight events** | Output of **CloudTrail Insights** (see below). | Only when **Insights** is enabled and charges apply. |

### CloudTrail Insights (paid add-on)

**Insights** analyzes **management** activity to learn **normal** patterns, then emits **Insight events** when it detects **anomalies** (e.g. unusual **provisioning**, **IAM** bursts, **service limit** pressure, gaps in **routine** changes).

Deliveries: **CloudTrail console**, delivery to **S3** (along the trail), and **EventBridge** events for **automation** (e.g. **SNS** email on suspicious activity).

### Log file integrity (digest)

For trails writing to **S3**, enable **log file validation**. CloudTrail periodically writes a **digest** file (course: about **every hour**) that **lists** the log files from that window and includes a **SHA-256** hash of each object. Digests live in the **same bucket** under a **separate prefix** from the raw logs.

**Use:** recompute the hash of a delivered log file and compare to the digest — if they **match**, the file was **not** altered or replaced after delivery (strong **compliance** story).

**Protect the bucket:** **bucket policy**, **versioning**, **MFA Delete** (where applicable), **encryption**, **S3 Object Lock** (immutability) — defense in depth so audit data cannot be silently changed. Also lock down **CloudTrail** and the **trail** configuration with **IAM** so logging cannot be disabled or redirected by unauthorized principals.

### EventBridge and S3 delivery latency

Treat **CloudTrail-driven automation** as **near-time**, not **synchronous**: course ballpark **~15 minutes** from API call to **EventBridge**, and **~5 minutes** for **log file** delivery to **S3** — **confirm** current AWS documentation.

### AWS Organizations trails

An **organization trail** (created from the **management account**) can log **API activity** for **all member accounts** into a **central S3 bucket** (and optional **Logs**). The **same trail name** appears in every account; **member accounts** can **see** the trail exists but **cannot delete or modify** the **organization** trail — good for **centralized audit** and **tamper resistance** at the member layer.

### Practical note

Console **Event history** can lag a few **minutes** behind the action (e.g. **TerminateInstances** appears shortly after **refresh**).

## AWS Config

**AWS Config** continuously **records configuration** of supported **resources** and **evaluates** them against **rules** for **compliance** and **drift** visibility. It answers questions such as: “Is **SSH** open to **0.0.0.0/0** on any **security group**?”, “Are **S3** buckets **public**?”, “How did this **ALB** **listener** / **certificate** **change** over time?”

- **Per Region** service — enable and pay **per Region**; use **aggregation** (see below) for a **cross-Region / cross-account** view.
- **Does not block** actions — Config is **detective**, not a substitute for **IAM**, **SCPs**, or **preventive** controls.
- **Historical timeline** per resource: **configuration** versions, **compliance** over time, and links to **CloudTrail** for **who** invoked **which API** (e.g. **`AuthorizeSecurityGroupIngress`**, **`RevokeSecurityGroupIngress`**).

### Recorder and delivery

- **Scope:** record **all** supported types in the Region or **only** selected **resource types** (cheaper).
- **Global resources:** optionally include **IAM** users, **groups**, **roles**, and **customer managed policies** (stored in **one** designated Region — **cost** implications).
- Uses a **service-linked role**; **configuration history** delivered to **S3** (optional **prefix**). Optional **SNS** topic for **all** configuration and compliance notifications (broad firehose — pair with **subscription filters** if you only want subsets).
- **Pricing** is usage-based (per **configuration item** recorded and per **rule evaluation** in the Region) — costs can grow quickly with **wide** recording; **verify** current pricing.

### Rules

- **AWS managed rules** — large catalog (course cited **75+**; count changes over time).
- **Custom rules** — implement evaluation in **Lambda** (e.g. “every **EBS** volume is **gp2**”, “every **EC2** in **dev** is **t2.micro**”).
- **Triggers:** on **configuration change** and/or on a **periodic** schedule (e.g. re-scan every **N** hours).

### Remediation (SSM Automation)

Non-compliance **does not** auto-fix unless you attach **remediation**: often an **SSM Automation** document (**AWS-managed** or **custom**, including docs that **invoke Lambda**).

- **Examples (course):** **`AWS-DisableIncomingSSHOnPort22`** on a non-compliant **security group**; **`AWS-ConfigureS3BucketLogging`** when bucket logging is off.
- **Manual** vs **automatic** remediation; configurable **retries** (e.g. up to **~5** attempts if still non-compliant after a run).

### Notifications

- **EventBridge** rules on **Config** non-compliance or change events for **selective** automation.
- **SNS** directly from Config for broad notifications; refine with **SNS** **filter policies** / subscriptions.

### Aggregators

Create an **aggregator** only in a **central “aggregator” account** — not in every **source** account. The aggregator **pulls** **inventory** and **compliance** from **authorized** accounts and **Regions** into **one** console view.

- **With AWS Organizations:** create from the **management** account — **authorization** across the org is **simplified** (course: automatic trust path).
- **Without Organizations:** each **source** account must **authorize** the **aggregator** account to **collect** data.
- **Rule deployment** is still **per account / Region** — the aggregator **does not** centralize **rule definitions**; use **CloudFormation StackSets** (or similar) to roll out the **same** rules everywhere.

### Settings integrations

Console **Settings** can wire **SNS** and **EventBridge**/**CloudWatch Events** rules so only **specific** rules or compliance transitions notify downstream systems.

## CloudWatch vs CloudTrail vs Config

| Lens | **CloudWatch** | **CloudTrail** | **Config** |
| --- | --- | --- | --- |
| **Primary job** | **Performance** and **operability** — **metrics**, **alarms**, **logs**, **dashboards**. | **Who did what** — **API** and **console** **audit**. | **What is configured** — **resource shape** vs **desired** **rules**; **compliance** **timeline**. |
| **ELB example** | **Request count**, **HTTP errors**, **latency**, cross-Region **dashboards**. | **`ModifyListener`**, **`AuthorizeSecurityGroupIngress`**, **certificate** changes — **actor** and **time**. | **Listener** **TLS** policy, **certificate** attachment, **security group** attachments — **compliant** or not, **history** of changes. |

The three are **complementary**: **CloudWatch** for **health** and **capacity**, **Config** for **configuration** **governance**, **CloudTrail** for **accountability**.

## Key Takeaways

- Metrics: **namespaces**, **dimensions** (≤ **30**), **dashboards** optional; EC2 **5 min** vs **1 min** detailed; **RAM** = **custom**; **`PutMetricData`** + **timestamp** quirks (**2 weeks** / **2 hours**).
- **Anomaly detection** = ML **band** + optional **alarms**; exclude bad training windows.
- **Dashboards** = **multi-Region**, **multi-account**, shared **time range**, **auto** or **custom** widgets; **free tier** limits then per-dashboard cost.
- **Logs:** **groups** / **streams**, **retention**, **KMS**; ingest from **Lambda**, **VPC Flow Logs**, **API GW**, **CloudTrail**, etc.; **metric filters** → metrics → **alarms**; **Insights** = **query** historical logs; **Live Tail** for live debug; **data protection** = **mask** + **audit** + **`LogEventsWithFindings`**.
- **Export** (`CreateExportTask`) = **batch** to **S3** (slow); **subscription filters** = **real-time** to **Kinesis** / **Firehose** / **Lambda**; **cross-account** needs **destination** + **policies** + **IAM**.
- **Alarms:** **OK** / **ALARM** / **INSUFFICIENT_DATA**; targets **EC2**, **ASG**, **SNS**; **composite** for **AND/OR**; **status check** + **recovery**; **`set-alarm-state`** to test.
- **Synthetics:** **scheduled** **Node/Python** + **Chrome** canaries; **VPC** + **NAT** or **interface endpoints** for private monitoring + private telemetry.
- **Container Insights** for **ECS/EKS/Fargate/ROSA**; **enhanced** mode for **task/container** detail.
- **Internet Monitor** — **global** internet health vs **your** apps; **metrics** / **logs** + **EventBridge** health events; **UX** recommendations.
- **Network Synthetic Monitor** — **DX** / **VPN** path; **ICMP**/**TCP** **IPv4**, **no agent**; **loss** / **latency** / **jitter** → **metrics**.
- **EventBridge** (ex-**CloudWatch Events**): **default** / **partner** / **custom** buses; **rules** (**pattern** or **schedule**); **targets** include **SSM Automation**; **CloudTrail**-derived **API** patterns (**DeleteTable**, **STS AssumeRole**, **AuthorizeSecurityGroupIngress**, …) → **SNS**/Lambda (not **real-time**); **archives** + **replay**; **Schema Registry**; **cross-account** = **both** **sender** and **receiver** **policies** (bus↔bus) or **IAM role** + **resource policy** (SQS/SNS/Lambda/API GW/Kinesis); **filtering**; **input transformers**; **Pipes** = **no-code** **source** (DynamoDB streams, Kinesis, MQ, MSK, SQS, Kafka) → optional **filter** / **enrich** (Lambda, Step Functions, API GW, API destination) → **target**; **retries** + **SQS DLQ** for failed deliveries (verify defaults).
- **Service Quotas** — browse limits, **request increases**, **CloudWatch** alarms on **% of quota** (e.g. Lambda concurrency); broader than **Trusted Advisor** limit checks alone.
- **CloudTrail** — **API**/**console** audit; **Event history** ~**90d** **management** events; **trails** → **S3** / **Logs** (**multi-Region** / **org** trails); **management** vs **data** (S3 objects, **Lambda Invoke**) vs **Insights**; **digest** + **SHA-256** for **log integrity**; protect **bucket** + **trail** with **IAM**/**Object Lock**/versioning; **long-term** → **S3** + **Athena**; **Insights** → **S3** + **EventBridge**; **org trail** — **members** **read-only** on trail; **EventBridge** latency **~minutes** (not synchronous).
- **Config** — **per-Region** **recorder** + **rules** (managed + **Lambda** custom); **change** or **periodic** evaluation; **timeline** + **CloudTrail** link; **S3** history + **Athena**; **remediation** via **SSM** docs (e.g. **disable SSH**, **enable bucket logging**); **aggregators** in **one** central account (**Org** vs **manual** auth); **StackSets** for **rule** rollout; **EventBridge**/ **SNS** notifications; **does not deny** API calls.
- **CloudWatch** vs **CloudTrail** vs **Config** — **metrics**/ops vs **audit** vs **configuration compliance** (see comparison table).
