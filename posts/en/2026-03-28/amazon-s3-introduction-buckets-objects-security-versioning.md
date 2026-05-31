---
title: "Amazon S3 Introduction: Buckets, Objects, Security, and Versioning"
date: "2026-03-28"
excerpt: "Section 10 S3 notes through advanced topics: MFA delete, access logs, Object Lock and Glacier Vault Lock, VPC endpoints, Access Analyzer, plus replication, lifecycle, events, performance, batch, inventory, and Athena."
author: "Tony Duong"
category: "note"
tags: ["aws", "s3", "storage", "iam", "security", "versioning", "replication", "lifecycle", "object-lock", "vpc", "athena", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 9
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Why S3 Matters

Amazon S3 is a core AWS building block, often described as **infinitely scalable object storage**. Much of the web and many AWS services integrate with S3.

Common use cases include:

- backup and general file storage
- disaster recovery (e.g. replicate or copy data to another Region)
- archival (cheaper tiers such as Glacier classes)
- hybrid cloud extension from on-premises storage
- hosting static assets (media, images, videos)
- data lakes and analytics
- software delivery and static website hosting

Real-world examples cited in the material include long-term regulatory retention (e.g. Nasdaq-scale archival patterns) and running analytics for business insights on data in S3.

## Buckets and Regions

- Data lives in **buckets** (think top-level containers).
- A bucket name must be **globally unique across all AWS accounts and Regions** — a common exam gotcha.
- Buckets are **created in a specific Region** even though the console shows buckets from all Regions in one list. S3 feels global, but **the bucket is regional**.

## Bucket Naming Rules

Rules to remember at a high level:

- lowercase letters, numbers, hyphens only (no uppercase, no underscores)
- length between 3 and 63 characters
- cannot look like an IP address
- must start with a letter or number
- avoid disallowed prefixes (follow current AWS docs for the full list)

## Objects and Keys

- Files in S3 are **objects**.
- Each object has a **key**: the **full path** string (e.g. `myfile.txt` or `folder1/subfolder/myfile.txt`).
- The console shows “folders,” but S3 has **no real directory hierarchy** — everything is a **key**; slashes are just characters in the key.
- A key splits conceptually into **prefix** (path-like part) and **object name** (final segment).

### Size and Upload

- Maximum object size: **5 TB**.
- For objects **larger than 5 GB**, you must use **multipart upload** (split into parts).

### Metadata, Tags, Versioning

- **Metadata:** system or user key-value pairs describing the object.
- **Tags:** up to 10 key-value pairs; useful for lifecycle, security, and cost allocation.
- **Version ID:** present when **versioning** is enabled on the bucket.

## Console Basics: Creating a Bucket and Uploading

Typical flow:

1. Pick a **Region** before creating the bucket.
2. If offered **bucket type**, choose **General purpose** for standard exam-style workloads (directory buckets are a specialized case).
3. Choose a **globally unique** bucket name.
4. **Object Ownership:** ACLs disabled is the **recommended** default.
5. **Block Public Access:** leave **on** unless you intentionally need public reads (see security below).
6. **Versioning:** often start **disabled**, then enable when you need safe updates and recovery.
7. **Default encryption:** e.g. **SSE-S3** with optional **bucket key** for cost/performance benefits on many workloads.

After upload, **Open** in the console may work via an authenticated flow, while the **plain object URL** can return **Access Denied** until the object/bucket is public or the requester is authorized — contrast with a **pre-signed URL**, which embeds temporary authorization and works for the intended principal.

You can create **prefix “folders”** in the UI for organization; deleting a “folder” deletes objects under that prefix.

## S3 Security Model

### User-Based (IAM)

- Attach **IAM policies** to users, groups, or roles to allow or deny **S3 API actions** (e.g. `GetObject`, `PutObject`).

### Resource-Based

- **Bucket policies:** JSON policies on the bucket (and often objects via `bucket/*`). Common for **public read**, **force encryption on upload**, **VPC/source restrictions**, **CloudFront OAC/OAI-style patterns**, **MFA conditions**, and **cross-account** access.
- **ACLs:** finer-grained but **less common** now; **Object ACL** and **Bucket ACL** can often be **disabled** in favor of bucket policies and IAM.

### When Access Is Allowed

An IAM principal can perform an action if **IAM allows it** or a **resource policy allows it**, and there is **no explicit Deny** (Deny wins).

### EC2 and Cross-Account

- Prefer **IAM roles** for EC2 (not long-lived IAM users) to grant S3 access.
- **Cross-account** access to your bucket is typically done with a **bucket policy** trusting the other account’s principals.

### Block Public Access

Account- or bucket-level **Block Public Access** is an extra guardrail: even a mistaken **public bucket policy** may **not** take effect while Block Public Access remains on. Disable it only when you **intentionally** want public objects and understand the risk.

## Making Objects Public (Hands-On Pattern)

1. **Edit Block Public Access** on the bucket to allow public policies (only if required).
2. Add a **bucket policy** that allows `s3:GetObject` for principal `"*"` (or a narrower principal) on resource `arn:aws:s3:::bucket-name/*`.

**Policy generator reminder:** `GetObject` applies to **objects**, so the resource ARN is typically **`bucket-arn/*`**. **`ListBucket`** applies to the **bucket** resource itself (ARN **without** `/*`).

## Advanced Bucket Policy Ideas (Awareness)

You do not need to memorize every JSON example for the exam, but you should know **what bucket policies can express**, for example:

- restrict access to principals in an **AWS Organization** (`aws:PrincipalOrgID` condition)
- **deny uploads** unless encryption headers are present (enforce encryption at upload)
- restrict by **source IP** (public/elastic IP ranges; not private IPs in the way described)
- **VPC / VPC endpoint** conditions (with endpoint usage)
- **MFA** present for sensitive reads
- **CloudFront** origin access patterns so only CloudFront can read origin objects

## Versioning

- Enable **versioning at the bucket level**.
- Each overwrite of the same key creates a **new version ID** instead of silently losing the old bytes.
- Objects uploaded **before** versioning was turned on often show version **`null`** for that legacy object.
- **Suspending** versioning does **not** delete existing versions — it stops new versions from being created.

### First-time versioning: propagation delay (exam note)

When you **turn on versioning for the first time** on a bucket, AWS documentation states the change can take a **short time** to fully propagate (often cited as **about 15 minutes** in course material).

While propagation is incomplete, **reads or writes to newly created or updated objects** may fail with **`404 NoSuchKey`** (or similar “not found” behavior). **Recommendation:** wait until versioning is fully effective before relying on critical **write** operations. Verify current AWS documentation — if this guidance changes, exam questions may shift accordingly.

### Deletes: Delete Marker vs Permanent Delete

- Deleting the “current” object in the console (without targeting a version) usually adds a **delete marker**: the object **looks** gone but **older versions** remain; removing the **delete marker** can **restore** the latest non-deleted version.
- Deleting a **specific version ID** is a **permanent delete** — destructive and not undoable.

### Rollback

To roll back content (e.g. a static `index.html`), you can delete the **newer version ID** you no longer want as current (permanent delete of that version), leaving an older version as the latest.

## S3 Replication

Replication copies objects from a **source** bucket to a **destination** bucket **asynchronously** (AWS runs it in the background).

### CRR vs SRR

- **CRR (Cross-Region Replication):** source and destination buckets are in **different** Regions.
- **SRR (Same-Region Replication):** source and destination are in the **same** Region.

Buckets can live in the **same or different AWS accounts**.

### Prerequisites

- **Versioning must be enabled** on **both** source and destination buckets.
- An **IAM role** (or equivalent service permissions) must allow S3 replication to **read** from the source and **write** to the destination (and related operations AWS needs).

### Why use replication

- **CRR:** compliance, **lower latency** for users in another Region, **cross-account** copies, DR-style patterns.
- **SRR:** **aggregate logs** from many buckets into one, keep a **live copy** between environments (e.g. prod vs test patterns described in training).

### What gets replicated (default vs optional)

- After you create a replication rule, **only objects uploaded (or changed) from that point forward** are replicated — **existing objects are not** backfilled automatically.
- To replicate **already existing** objects (or **fix failed** replications), use **S3 Batch Replication** (batch operations), separate from the live replication rule itself.
- **Delete marker replication** is **optional**. If enabled, delete markers can copy to the destination; if disabled, they stay on the source only.
- **Permanent deletes** (deleting a **specific version ID**) are **not** replicated — so a malicious or mistaken hard delete in the source does not automatically wipe the replica version (by design).

### No chaining

If bucket **A** replicates to **B**, and **B** replicates to **C**, objects created in **A** do **not** automatically end up in **C** via that chain. There is **no replication chaining** through intermediate buckets.

### Replication Time Control (RTC)

**RTC** is an optional add-on for S3 replication that provides a **time SLA–style guarantee** on how fast new objects replicate (training material cites **99.99% of new objects replicated within 15 minutes** when RTC is enabled).

Why it matters:

- **Predictable, auditable** replication latency for compliance or strict business requirements
- **CloudWatch metrics** (and alerting) so you can **monitor** replication and detect when it **falls behind**
- Works with replication in the **same Region or across Regions** (same underlying CRR/SRR setups)

**Cost:** enabling RTC adds **extra charges** (pricing is **per GB** related to replicated data — confirm current S3 pricing). Use it when stakeholders need that **guaranteed replication window**, not for every workload.

### Hands-on patterns to remember

- Create **origin** and **replica** buckets, both with **versioning on**.
- Under **Management → Replication rules**, create a rule (scope can be whole bucket or a prefix), pick destination bucket/Region (CRR if Regions differ), and create/assign the **IAM role**.
- Prompt about **replicating existing objects** → typically **Batch Operations** if you need historical data; saying “no” means only **new** objects replicate.
- **Version IDs** on the replica often **match** the source for replicated versions (useful when correlating copies).
- **Delete marker** on source → may appear on destination **only if** delete marker replication is enabled.
- **Permanent delete** of a version on the source → **does not** remove that version from the replica.

## Cross-Account Replication and Object Ownership

For replication **into another account’s bucket**:

1. The **destination bucket policy** must **trust the replication IAM role** from the source account — allow actions such as replicating objects, replication of deletes where applicable, and **bucket-level versioning** APIs the role needs (`GetBucketVersioning`, `PutBucketVersioning`, etc., as required by your setup).

### Default ownership of replicated objects

By default, the **object owner** in the destination bucket may remain the **source account** (the owner of the object as written). That can be fine for backups but breaks expectations if account B needs to **fully own** and **read** objects under its own policies.

### Owner override (destination owns the objects)

To make the **destination account** the owner of replicated objects:

- Enable the appropriate **owner override** (bucket-owner-enforced / destination owner) option on the **replication rule** (wording in the console may vary).
- Grant the source replication role **`s3:ObjectOwnerOverrideToBucketOwner`** (or the current equivalent permission name in IAM).
- The **destination bucket policy** must also allow that role to perform the **ownership override** so new objects are owned by the destination bucket account.

**Exam angle:** replication “works” (objects appear) but **account B cannot read** them if ownership and permissions are wrong — fix with **owner override** plus matching **IAM + bucket policy** permissions.

## Storage Classes and Lifecycle Rules

Objects can **transition** between storage classes over time (course diagrams show paths among **S3 Standard**, **Standard-IA**, **Intelligent-Tiering**, **S3 One Zone-IA**, and **Glacier** tiers such as **Instant Retrieval**, **Flexible Retrieval**, and **Deep Archive** — confirm the current [transition matrix](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-availability.html) in AWS docs).

- **Infrequently accessed** → consider **Standard-IA** (or related IA tiers appropriate to durability needs).
- **Archive** → move toward **Glacier**-class tiers when retrieval time and cost tradeoffs fit.

### Automating with lifecycle configuration

**Lifecycle rules** combine:

1. **Transition actions** — move objects to another class after N days (e.g. to Standard-IA after 60 days, to Glacier after 180 days).
2. **Expiration actions** — delete objects after a period (e.g. access logs after 365 days), **expire non-current versions** when versioning is on, or **abort incomplete multipart uploads** after N days (e.g. 7–14 days if uploads should have finished).

Rules can target the **whole bucket**, a **prefix**, or **object tags** (e.g. only `department=finance`).

### Exam-style scenario: thumbnails vs originals

- **Source profile images:** keep on **Standard** initially; lifecycle transitions to **Glacier** (e.g. after 60 days) if users can tolerate slower retrieval (e.g. up to hours for flexible tiers — match SLA in the question).
- **Thumbnails:** cheaper tier acceptable (**One Zone-IA** if recreatable and lower durability OK); **expire** after 60 days if regeneratable from the original. Use **different prefixes** (e.g. `originals/` vs `thumbnails/`) to attach different rules.

### Exam-style scenario: deleted-object retention with versioning

- Enable **versioning** so deletes create **delete markers** and old versions remain recoverable.
- Transition **non-current versions** to **Standard-IA** for immediate-ish recovery window, then later to **Glacier Deep Archive** for long retention with slow/cheaper retrieval — matching a policy like “recover immediately for 30 days” / “within 48 hours for up to a year” as stated in the prompt.

### Lifecycle rule actions (console)

Under **Management → Lifecycle rules**, actions include:

- transition **current** versions between storage classes (timeline of multiple steps is supported)
- transition **non-current** versions to cheaper/archive classes
- **expire** current versions after N days
- **permanently delete non-current** versions after N days
- delete **expired object delete markers** and/or **abort incomplete multipart uploads**

The console can show a **timeline** of transitions and expirations for current vs non-current versions.

### S3 analytics (storage class recommendations)

**S3 Storage Class Analysis** (often called S3 analytics in courses) generates recommendations (CSV report) to help pick transition days — training material notes it is aimed at **Standard** and **Standard-IA** (not One Zone-IA or Glacier). Reports update **daily**; expect roughly **24–48 hours** before useful analysis appears. Use the CSV as input to tune lifecycle rules.

## S3 Event Notifications

S3 can emit **events** for **object created**, **removed**, **restored**, **replication**, etc. You can **filter** by prefix/suffix (e.g. `*.jpg`).

**Destinations (classic):**

- **SNS** topic
- **SQS** queue
- **Lambda** function

Delivery is usually **within seconds**, but can take **a minute or longer**.

### Permissions pattern

S3 does **not** use an IAM role on the bucket for these targets. Instead, the **destination** carries a **resource policy** (SNS topic policy, SQS queue policy, or **Lambda resource policy**) that **allows the S3 service** to publish or invoke. This mirrors the idea of **S3 bucket policies** but on the **target** resource.

**Hands-on reminder:** configuring SQS without updating the queue policy often fails validation until **SendMessage** (or equivalent) is allowed for S3; S3 may send a **test** message on save. Event payload includes fields such as **`eventName`** (e.g. `ObjectCreated:Put`) and the object **key**.

### Amazon EventBridge integration

You can enable **EventBridge** for the bucket so **events also flow to EventBridge**, then use **rules** to fan out to **many AWS services** (course material cites **18+** destinations). Benefits include **richer filtering** (metadata, size, name), **multiple targets**, **archive/replay**, and often **more reliable** delivery patterns than legacy notifications alone.

## S3 Performance: Baseline and Optimizations

### Baseline

- S3 scales to very high request rates with low latency (course ballpark: **~100–200 ms** time to first byte for many workloads).
- Throughput is often discussed as **per prefix**: on the order of **3,500 PUT/COPY/POST/DELETE** and **5,500 GET/HEAD** requests per second **per prefix** (verify current quotas/docs). **Prefixes** are the path segments “above” the object name; **different prefixes** get separate scaling partitions — spreading keys across prefixes increases aggregate throughput (e.g. four prefixes → multiply GET capacity in parallel designs).

### Multipart upload

- **Recommended** above **~100 MB**; **required** above **5 GB**.
- Split the object into parts (up to **10,000** parts), upload parts **in parallel** (better bandwidth, retry **failed parts** only), then **`CompleteMultipartUpload`** with **ETag** list so S3 assembles the final object. **Incomplete** uploads can linger; clean up with a **lifecycle rule** that **aborts incomplete multipart uploads** after N days.
- **CLI:** `aws s3 mb` for bucket creation; multipart flow uses **`aws s3api`** (`create-multipart-upload`, `upload-part`, `list-parts`, `complete-multipart-upload`, `list-multipart-uploads`). Until **complete**, parts do not show as a normal object in the console.

### Transfer Acceleration

Speeds transfers by sending data to a **nearby edge location**, then moving over the **AWS backbone** to the bucket Region. Works with **multipart**. Useful for long geographic distances (e.g. US client → AU bucket).

### Byte-range GETs

Clients request **ranges** of the object in **parallel** to speed downloads or to **read only a header** section (e.g. first N bytes). Failed ranges can be retried in smaller chunks.

### KMS (exam awareness)

Encrypted objects may be subject to **KMS API limits**; very high request rates can require throttling awareness alongside S3 (confirm limits in current docs).

## S3 Batch Operations

Run **bulk jobs** on many existing objects with **one job definition**: replace metadata/tags, **copy** between buckets, **encrypt** previously unencrypted objects, change ACLs, **restore** from Glacier, **invoke Lambda** per object for custom logic, etc.

**Why use Batch Operations vs a script:** built-in **retries**, **progress tracking**, **completion reports**, and reporting.

**Manifest:** list objects via **CSV** (bucket, key, optional version) or **S3 Inventory** report. **Athena** can query inventory outputs to **filter** which keys go into the manifest (e.g. find unencrypted objects, then batch-encrypt).

**Permissions:** an **IAM role** trusted by **S3 Batch Operations** with least privilege (read manifest, read/write target objects, write reports).

## S3 Inventory

**Inventory** lists objects and **metadata** (better than repeatedly calling **List** APIs for large buckets).

**Uses:** audits for **encryption** and **replication** status, object counts, storage by class, **non-current version** size, compliance reporting.

**Output:** **CSV**, **ORC**, or **Apache Parquet**; schedules **daily** or **weekly**. First delivery may take up to **~48 hours**. Query outputs with **Athena**, **Redshift**, **Spark**, **Hive**, **Presto**, etc.

**Destination bucket** for reports must be in the **same Region** as the source bucket configuration (a common setup mistake in demos).

**Cleanup:** disable or delete inventory configurations when no longer needed to avoid ongoing report generation.

**Manifest files:** `manifest.json` + checksum describe the CSV/Parquet parts and schema.

## Amazon Athena

**Athena** is a **serverless** **SQL** query service over data **in S3** (engine lineage: **Presto/Trino**-class). **No** servers or warehouse to provision; you pay for **data scanned** (per TB).

**Formats:** CSV, JSON, **ORC**, **Avro**, **Parquet**, and others.

**Typical uses:** ad hoc analytics, BI, reporting, querying **logs** (ALB, **CloudTrail**, **VPC Flow Logs**, **S3 access logs**).

**Exam cue:** “serverless SQL on data in S3” → **Athena**.

### Performance and cost

- Prefer **columnar** formats (**Parquet**, **ORC**) to scan **fewer columns**; often convert via **Glue** ETL from CSV.
- **Compress** data to reduce bytes scanned.
- **Partition** S3 keys (e.g. `year=1991/month=01/day=01/`) so predicates prune partitions and scan less data.
- Prefer **fewer, larger** files (e.g. **≥ ~128 MB** ballpark) over huge numbers of tiny files to reduce overhead.

### Federated query

Athena can query **external** data sources via **data source connectors** (implemented with **Lambda**): e.g. **DynamoDB**, **RDS/Aurora**, **CloudWatch Logs**, **Redshift**, on-premises DBs. Results can be written back to **S3**.

### Hands-on pattern (S3 access logs)

1. Set **query result location** in S3 in Athena settings.
2. `CREATE DATABASE`, then **`CREATE TABLE`** pointing at the log bucket **prefix** (documentation provides templates — often only **bucket name** and **prefix** need edits; trailing **`/`** matters).
3. Run SQL: **preview**, aggregates (e.g. counts by **HTTP status**), investigate **403** / **404** patterns.

## S3 MFA Delete

**MFA Delete** adds an extra control for destructive versioning operations: callers must provide a **valid MFA code** (virtual MFA app, hardware token, etc.) in addition to normal credentials.

### When MFA is required (once enabled)

- **Permanently deleting a specific object version** (true version delete, not merely a delete marker).
- **Suspending versioning** on the bucket.

### When MFA is not required

- **Enabling** versioning.
- **Listing** object versions (including “deleted” / non-current versions).

### Requirements and operations

- **Versioning must be enabled** on the bucket first (MFA Delete is a versioning-related control).
- **Only the bucket owner’s root user** can **turn MFA Delete on or off** (per course material — confirm current AWS docs; this is a narrow, sensitive workflow).
- The **AWS Management Console** often **cannot** toggle MFA Delete; you typically use the **AWS CLI** (e.g. `put-bucket-versioning` with MFA device ARN + **serial + current TOTP code** in the API parameters).

**Operational warning:** demos use **root access keys** to run CLI — **avoid** leaving root long-term access keys active; deactivate/delete them after the task.

## S3 Server Access Logging

**Server access logging** writes a log record for **requests** against a bucket (authorized or denied) into a **separate target bucket** as log files. Use it for **audit** and later analysis (e.g. **Athena**).

- The **logging (destination) bucket** must be in the **same Region** as the source bucket configuration (per course).
- **Never** set the **logging bucket to the same bucket** you are monitoring: each `PUT` of a log object generates more access, which generates more logs → **infinite growth** and **runaway cost**.

Enabling logging in the console usually **updates the target bucket policy** so the **S3 logging service** can `PUT` log objects. Log **delivery can lag** (minutes to hours in practice).

Log **line format** is documented by AWS (field layout for parsing). Optional **prefix** in the destination organizes keys (e.g. `logs/`).

## WORM: Glacier Vault Lock vs S3 Object Lock

### S3 Glacier Vault Lock (classic Glacier vaults)

For **Glacier vault–style** workflows (course framing): apply a **Vault Lock policy**, then **lock** that policy so it **cannot be edited or removed**. That supports a **WORM** (**write once, read many**) model: objects under that policy are **immutable** for compliance/retention. Treat as **strong immutability** for regulated archives (wording in training: even admins/AWS cannot bypass the locked policy).

### S3 Object Lock (on S3 buckets)

**Object Lock** also enables **WORM**, but at **per-object / per-version** granularity on **versioned** buckets.

**Prerequisite:** **Versioning enabled** (Object Lock is configured at bucket creation or with specific constraints — follow current console/docs).

**Retention modes:**

| Mode | Strictness |
|------|------------|
| **Compliance** | **No one** (including **root**) can shorten retention, delete protected versions early, or weaken the mode — maximum immutability for a defined retention period. |
| **Governance** | Most users cannot bypass; **privileged** principals with the right **IAM** permissions (e.g. `s3:BypassGovernanceRetention`) can **adjust retention** or **delete** where allowed. |

You set a **retention period** (can often be **extended**; compliance mode cannot be **shortened**).

**Legal hold:** independent of retention — marks an object as **frozen indefinitely** until removed (e.g. litigation). Any user with **`s3:PutObjectLegalHold`** (and related) can **place or clear** legal hold when your governance allows.

**Exam focus:** know **compliance vs governance**, **retention period vs legal hold**, and that **Object Lock is per-object/version**, whereas **Vault Lock** is **vault-policy–level** for Glacier-style vaults.

## Private Access to S3 from a VPC

### Gateway endpoint (S3) — default exam answer for private subnets

- **No hourly charge** for the S3 **gateway** endpoint.
- Used by resources **in that VPC** via **route tables** (prefix list targets S3 in the Region).
- **VPC DNS support** must be enabled so instances resolve and route correctly; you still use **standard S3 DNS names** (traffic stays on the **AWS network** to S3 rather than over the public internet path).
- **Security groups** must allow **outbound** traffic that reaches the endpoint path as your design requires.

Suited to **EC2 in private subnets** reaching S3 without a NAT-based public path.

### Interface endpoint (PrivateLink) for S3

- Creates **ENIs** in subnets with **per-AZ** cost (course ballpark: **~$0.01/hour per AZ** — verify pricing).
- Can support **on-premises** access over **VPN** or **Direct Connect** into the VPC, then to the endpoint.
- Requires **DNS support** and **DNS hostnames** on the VPC for the private names to work as expected.

**Exam:** prefer **gateway endpoint** for **private EC2 → S3** when the question is about **free, VPC-internal** access; know **interface endpoints** exist for **PrivateLink-style** and **hybrid** patterns.

## IAM Access Analyzer for Amazon S3

**IAM Access Analyzer** (as applied to S3) **evaluates** resource policies and related controls — **bucket policies**, **ACLs**, **access point policies**, etc. — and **reports** which buckets are **publicly** accessible or **shared with external AWS accounts** (unintended exposure).

Use it to **review findings**: expected vs **accidental** cross-account or public access, then **tighten** policies. It is an **ongoing monitoring / audit** style feature that can show up as a **single exam question** on unintended sharing.

## Key Takeaways

- S3 is regional buckets with **global uniqueness** of names; objects are **keys**, not real folders.
- Large objects need **multipart upload** above **5 GB** (recommended **> ~100 MB**); max object **5 TB**; up to **10k** parts; **lifecycle** can abort **stale MPU**; **`aws s3api`** for low-level multipart.
- Security combines **IAM**, **bucket policies**, optional ACLs, **encryption**, and **Block Public Access**.
- **Pre-signed URLs** grant time-limited access without making the bucket public.
- **Versioning** plus understanding **delete markers** vs **version deletes** is essential for safe updates and recovery.
- After **first enabling versioning**, allow time for **propagation** before critical writes; **`NoSuchKey`** can appear during that window (confirm in current docs).
- **Replication** needs **versioning on both sides**, an **IAM role**, **async** copy of **new** objects by default, **Batch Replication** for backfill, optional **delete marker** sync, **no** replication of **permanent version deletes**, and **no chaining**; optional **RTC** for an SLA-style **15-minute** replication window (per product terms), **CloudWatch** visibility, and **extra per-GB cost**.
- **Cross-account** replication often needs a **destination bucket policy** plus **object ownership** planning (**owner override** when the destination account must own and read objects).
- **Lifecycle** automates **transitions** and **expirations** (current/non-current versions, delete markers, incomplete MPU); scope by **prefix** or **tags**; **S3 Analytics** helps tune Standard → IA transitions.
- **Event notifications** → **SNS / SQS / Lambda** via **resource policies** on targets; **EventBridge** enables richer routing; delivery usually fast but not strictly real-time.
- **Performance:** very high baseline RPS **per prefix**; optimize with **multipart**, **Transfer Acceleration**, **byte-range GETs**, and **prefix spread**.
- **Batch Operations** + **Inventory** (+ **Athena** to filter manifests) for large-scale fixes (e.g. encrypt all unencrypted objects).
- **Athena** = serverless **SQL** on S3; minimize scan with **Parquet/ORC**, **compression**, **partitioning**, and right-sized files; optional **federated** queries via connectors.
- **MFA Delete** (versioning buckets): **CLI/root-owner** workflow; MFA for **permanent version delete** and **suspending versioning** — not for enabling versioning or listing versions.
- **Access logging:** separate **destination** bucket, **same Region**; **never** log into the **source** bucket (avoid **feedback loops**); analyze with **Athena**.
- **WORM:** **Glacier Vault Lock** (locked vault policy) vs **S3 Object Lock** (**compliance** vs **governance**, **retention** vs **legal hold**, **`s3:PutObjectLegalHold`**).
- **Private S3 from VPC:** **gateway endpoint** (free, route tables); **interface endpoint** (ENI cost, **PrivateLink**, on-prem paths); **DNS** settings matter.
- **Access Analyzer** surfaces **public** and **cross-account** S3 access from policies/ACLs/access points.
