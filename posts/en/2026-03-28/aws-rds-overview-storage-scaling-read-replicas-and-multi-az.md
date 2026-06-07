---
title: "AWS RDS, Aurora, RDS Proxy, and ElastiCache"
date: "2026-03-28"
excerpt: "Managed SQL and caching for CloudOps: RDS/Aurora (including Serverless and Global Database), RDS Proxy, and ElastiCache Redis/Memcached scaling, patterns, and metrics."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "rds", "aurora", "elasticache", "redis", "rds-proxy", "mysql", "postgresql", "sql", "cloudwatch", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 11
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## What RDS Is

**Amazon RDS (Relational Database Service)** is a **managed** relational database service for engines that use **SQL**. AWS provisions and operates the database layer; you do **not** SSH into the underlying host (managed service boundary).

### Supported engines (know the list)

- **PostgreSQL**, **MySQL**, **MariaDB**
- **Oracle**, **Microsoft SQL Server**, **IBM Db2**
- **Amazon Aurora** (AWS-proprietary; **MySQL-** or **PostgreSQL-compatible** drivers — see Aurora section below)

## RDS vs Self-Managed on EC2

RDS includes operational work you would otherwise own on EC2:

- automated **provisioning** and **OS patching** (for the DB stack AWS manages)
- **continuous backups** and **point-in-time restore (PITR)**
- **monitoring** dashboards and metrics
- **read replicas** for read scaling
- **Multi-AZ** for high availability / disaster recovery
- **maintenance windows** for upgrades
- **vertical scaling** (larger instance class) and **horizontal read scaling** (replicas)
- storage on **EBS** (familiar performance/cost model)

Tradeoff: **no shell access** to the DB instance — use RDS features, Parameter Groups, and monitoring instead.

## RDS Storage Autoscaling

Avoids manual storage increases when the database fills up.

**Behavior (course rules — confirm in current docs):**

- You set a **maximum** allocated storage cap.
- Autoscaling can trigger when:
  - **free storage < 10%** of currently allocated space, **and**
  - low-storage condition has lasted **> 5 minutes**, **and**
  - **≥ 6 hours** since the **last** storage modification.

**Use case:** unpredictable growth workloads. Supported across **RDS engines** (per training).

## Read Replicas

**Purpose:** scale **reads** off the primary (writer).

- Up to **15** read replicas per source (exam number).
- Placement: **same AZ**, **cross-AZ**, or **cross-Region**.
- Replication is **asynchronous** → replicas are **eventually consistent** (read-your-writes is **not** guaranteed immediately).
- Replicas accept **read-only** SQL (e.g. `SELECT`); not for `INSERT` / `UPDATE` / `DELETE`.
- **Promote** a replica to a **standalone** primary (it leaves the replication topology and becomes its own read/write DB).

**Application change:** readers must use **replica endpoints** (connection strings / routing layer) — the primary DNS alone does not fan out reads automatically.

### Classic use case: reporting

Run **analytics/reporting** against a **replica** so **OLTP** traffic on the primary stays protected.

### Data transfer cost

- **Same Region**, different AZ: replication traffic is typically **free** (managed-service exception in course material).
- **Cross-Region** replica: replication incurs **cross-Region data transfer** charges.

## Multi-AZ (High Availability / DR)

**Purpose:** **availability** and **failover**, **not** read scaling.

- **One DNS name** for the application.
- **Synchronous** replication from **primary** in **AZ A** to a **standby** in **AZ B**.
- Standby is **not** queried for reads or writes under normal operation — it exists for **failover**.
- On primary failure (AZ outage, instance failure, storage failure, network partition to primary, etc.), **automatic failover** promotes standby → new primary. Apps that **retry** the same endpoint typically recover without manual DNS changes.

### Read replica + Multi-AZ

**Yes:** a **read replica** can itself be deployed **Multi-AZ** for DR on that replica (common exam twist).

## Single-AZ → Multi-AZ (exam)

- **Zero downtime** operation from the user’s perspective: **modify** the instance and **enable Multi-AZ** (no stop/start of the app’s maintenance window required for that toggle alone — follow AWS docs for exceptions).

**Behind the scenes (conceptual):** RDS takes a **snapshot** of the primary, **restores** a **standby**, then establishes **sync** replication until the pair is caught up.

### Multi-AZ failover triggers (memorize for the exam)

Failover from primary to standby can occur when:

- **Primary DB instance failure** or **underlying storage failure**
- **Primary OS** undergoing **software patching** (managed maintenance)
- **Loss of network connectivity** to the primary
- **Manual operations** that force replacement: e.g. **changing instance type**, **primary busy/unresponsive**
- **AZ outage** affecting the primary AZ
- **Manual failover:** **Reboot with failover** in the console/CLI

## Automated backups vs snapshots (RDS)

### Automated backups (continuous + PITR)

- **Continuous** backup stream with **point-in-time restore (PITR)** within the retention window.
- **Retention:** **0–35 days** (`0` = **disabled** automated backups).
- Run during a configurable **backup window** (subset of **maintenance** scheduling).
- On **instance deletion**, you can choose to **retain** automated backups for a period (per console options).
- **Restore** always creates a **new** DB instance — **no in-place restore** onto the same instance ID.

### Manual snapshots

- **IO impact:** snapshot can cause a brief pause (**seconds to minutes**) on **Single-AZ**; with **Multi-AZ**, snapshot is taken from the **standby** to reduce impact on the primary.
- **First** snapshot is **full**; later snapshots are **incremental** (similar idea to EBS).
- **Manual snapshots do not expire** until you delete them.
- **Final snapshot** optional when deleting an instance.
- **Share** snapshots **cross-account** (like EBS): only **manual** snapshots (or **copy** an automated snapshot to manual first). **Automated backups** themselves are **not** shared as-is.
- **Encrypted snapshots:** sharing requires the other account to have **KMS** permissions on the **CMK** used for the snapshot (same pattern as EBS).

## RDS events, subscriptions, and database logs

### Events

RDS records **events** for instances, snapshots, parameter groups, security groups, etc. (e.g. state **pending → running**, backup started, modifications).

- **Event subscriptions** → **SNS** topic; filter by **source type** (DB instance, snapshot, parameter group, **cluster**, etc.) and **category**.
- Same events can integrate with **EventBridge** for rules-based automation.

### Log files → CloudWatch Logs

DB engines expose logs (e.g. **error**, **slow query**, **general**, **audit** — engine-dependent). Enable **log exports** on the instance to publish to **CloudWatch Logs**, then use **metric filters** (e.g. count `ERROR`) and **alarms** → **SNS** for operator alerts.

**Console:** **Events** tab (recent history), **Logs & events** on the instance, **Modify** → log export checkboxes.

## CloudWatch metrics for RDS

### Standard (hypervisor-level)

Examples: `DatabaseConnections`, `SwapUsage`, `ReadIOPS` / `WriteIOPS`, `ReadLatency` / `WriteLatency`, `ReadThroughput` / `WriteThroughput`, `DiskQueueDepth`, `FreeStorageSpace`, **CPU**.

**Troubleshooting intuition:** high **latency** or **DiskQueueDepth** → storage bottleneck; pegged **ReadIOPS** → may need more **IOPS**/larger volume; high **CPU** → larger class or query tuning.

### Enhanced Monitoring

- Agent on the **DB instance** (not just hypervisor): **50+** OS metrics — **process/thread** CPU, memory, **filesystem**, disk I/O.
- Granularity down to **1 second** (course showed **60s** default); requires an **IAM role** for the monitoring agent.

**Console:** Monitoring view → dropdown **CloudWatch** vs **Enhanced monitoring** vs **OS process list**.

## RDS Performance Insights

Visual **database load** over time; slice by:

- **Waits** — what resource dominates (**CPU**, **I/O**, **locks**, etc.) → guides whether to scale **compute** vs **storage/IOPS**.
- **SQL** — expensive statements to optimize with app owners.
- **Hosts** — which app servers hammer the DB (maybe need **read replica** or throttling).
- **Users** — which DB logins drive load.

**Load** is framed as **active sessions** (engine-specific). Optional **paid** tier: **proactive recommendations**.

**Support:** not on all instance classes (course: **`db.t2.*`** often **unsupported**); enable on **Modify** for supported classes with a **retention** period for history.

## Amazon Aurora (high level)

**Proprietary** AWS engine; **wire-compatible** with **PostgreSQL** or **MySQL** (use those drivers/clients).

### Why Aurora (exam framing)

- **Cloud-optimized** storage and replication — course cites large performance multiples vs same-engine **RDS** (numbers vary by workload; treat as **faster/more scalable** story).
- **Storage auto-grows** from **10 GiB** up to **128 TiB** (course said **256 TiB** — verify current Aurora limits).
- Up to **15** read replicas with **low replica lag** (course: **sub-10 ms** typical).
- **Failover** much faster than classic RDS Multi-AZ (course: **&lt; ~30 seconds** average for writer failover).
- **Higher list price** than RDS but often **better efficiency at scale** (cost/perf tradeoff questions).

### Storage topology (conceptual)

- **Six** copies of data across **three** AZs; **quorum** for writes (**4/6**) and reads (**3/6**) — survives **AZ** loss and supports **self-healing** / peer repair.
- Logical **shared cluster volume** that **stripes** across many small volumes (you do not manage segments).

### Cluster endpoints (critical for exams)

- **Writer endpoint** — always resolves to the **current primary** (read/write). Survives **failover** without app reconfiguration.
- **Reader endpoint** — **connection-level** load balancing across **Aurora replicas** (not per-statement). Use for read scaling.
- Individual instances also have **instance endpoints** for targeted connections.

**Replicas:** up to **15**; **any** replica can be promoted if the writer fails. **Cross-Region** read replicas supported. **Auto scaling** policy can add/remove replicas based on **CPU** or **connections** (min/max bounds).

### Aurora hands-on recap (console)

- **Standard create** → **Aurora MySQL** or **PostgreSQL**; filter engine versions for features (**Global Database**, **Parallel Query**, **Serverless v2**).
- **Cluster storage:** **Standard** vs **IO-Optimized** (higher I/O workloads).
- **Instances:** burstable/provisioned classes, or **Serverless v2** (**ACU** min/max instead of fixed class).
- **Availability:** add **reader** in another AZ for HA + read capacity.
- **Endpoints:** **writer** + **reader** on the **cluster**; security group on **3306** (MySQL) etc.
- Options: **IAM DB auth**, **Kerberos**, **Enhanced Monitoring**, **encryption**, **backtrack**, log exports, **deletion protection**, **Local write forwarding** (writes hitting a reader forwarded to writer — simplifies some app patterns).
- **Global Database:** **Add AWS Region** (requires compatible engine/instance sizes per console).
- **Delete order:** remove **readers** first, then **writer**, then **cluster**.

### Aurora Serverless

**Aurora Serverless** (v2 in current products — course frames the idea) scales **capacity with load** using **Aurora capacity units (ACUs)** instead of picking a fixed instance class.

- Fits **intermittent**, **spiky**, or **unpredictable** workloads with less **capacity planning**.
- **Pay** for **used** capacity (often **per-second** billing in marketing — confirm pricing).
- Still uses the **shared Aurora storage** model; a **managed proxy / router fleet** sits in front of DB capacity so scaling of **compute** is **opaque** to the app (you connect to the **cluster** as usual).

### Aurora Global Database

**Global Database** extends Aurora across Regions:

- **One primary Region** — **all writes** go there.
- Up to **10** secondary **Regions** (read-only copies for local reads — verify current limit in docs).
- Replication lag primary → secondary typically **&lt; ~1 second** (course figure).
- Up to **16** read replicas **per** secondary Region (course figure).
- **Disaster recovery:** promoting a secondary Region can achieve **RTO** under **~1 minute** in training examples.

**Application rule:** secondaries serve **reads**; **writes** must target the **primary** Region.

### Aurora CloudWatch metrics (examples)

- **`AuroraReplicaLag`** — lag for a given replica instance.
- **Replica lag min/max** — extremes across instances in the cluster; **high lag** → readers may serve **stale** data (**eventual consistency** across replicas).
- **`DatabaseConnections`** — current connections per instance.
- **Insert latency** (and similar) — average time for **INSERT** operations (performance troubleshooting).

### Aurora backups, backtrack, and cloning

| Feature | Behavior |
|---------|----------|
| **Automated backups** | Retention **1–35 days**; **cannot** disable on Aurora (per course). **PITR** to **new cluster** (like RDS). |
| **Backtrack** | **In-place** rewind of the **cluster** (no new cluster) within a window (course: up to **72 hours**). **Aurora MySQL** only in the training material — confirm engine support in docs. |
| **Database cloning** | **New cluster** that initially **shares** the same **cluster storage volume** as the source; **copy-on-write** as diverging changes occur — **fast** way to spin up **staging** from **prod**. |

## RDS and Aurora security

### Encryption at rest

- Uses **KMS** CMKs; **encryption choice is fixed at first launch** of the primary instance.
- **Read replicas:** if the primary is **unencrypted**, you **cannot** create an **encrypted** replica directly — **snapshot** unencrypted DB → **restore** as **encrypted** (new instance).
- To encrypt an existing **unencrypted** DB: **snapshot → restore encrypted**.

### Encryption in flight (TLS)

Clients should use **TLS** with AWS **RDS CA certificates** (downloadable from AWS documentation).

### Authentication

- **Username/password** (default).
- **IAM database authentication** — e.g. **EC2 instance role** obtains an auth token instead of embedding passwords (central IAM control).

### Network

- **Security groups** control **port**/source IP / source SG access — primary network boundary for RDS/Aurora in a VPC.

### Access model

- **No SSH** to managed RDS/Aurora instances — **except** **RDS Custom** (special product with more OS access).

### Audit

- Enable engine **audit logs**; for long retention and search, ship to **CloudWatch Logs** (and onward to S3/Athena/OpenSearch patterns as needed).

## Amazon RDS Proxy

**RDS Proxy** is a **fully managed**, **highly available** (multi-AZ), **serverless-scaling** **database proxy** in your **VPC**.

### Why use it

- **Connection pooling:** many app workers (or **Lambda** concurrent executions) open **short-lived** connections; the proxy **multiplexes** them onto a **smaller** set of **actual DB connections** → less **CPU/RAM** stress on RDS/Aurora, fewer **timeouts** and **connection storms**.
- **Faster failover:** course cites up to **~66%** reduction in failover disruption for **RDS Multi-AZ** or **Aurora** failovers — apps keep talking to the **proxy endpoint**; the proxy **retargets** to the new writer.
- **IAM authentication** + **Secrets Manager** for **credentials** (optional strong pattern): exam cue “enforce IAM DB auth + secrets” → **RDS Proxy**.

### Compatibility and connectivity

- Engines: **MySQL**, **PostgreSQL**, **MariaDB**, **SQL Server**, **Aurora** (MySQL and PostgreSQL compatible).
- **No** application logic rewrite beyond using the **proxy endpoint** instead of the DB endpoint (same SQL wire protocol).
- **Not publicly accessible** — only from **within the VPC** (and connected networks).

### Lambda + RDS

**Lambda** scales to **many concurrent executions**; without a proxy, each function may open a **new DB connection** → **connection limit** exhaustion. Point Lambdas at **RDS Proxy** so the **pool** absorbs the fan-out.

## Amazon ElastiCache

**ElastiCache** is the managed service for **Redis**-compatible engines (**Redis OSS**, **Valkey** as Redis alternative in console) and **Memcached** — **in-memory** stores with **very low latency**.

### Why cache

- **Offload reads** from **RDS**: check cache → **cache hit** return; **cache miss** → read **RDS**, then **populate** cache for later hits.
- **Session store** for **stateless** apps: any app instance can read session data from the cache after login.

**Reality check:** caching requires **application changes** (lookup strategy, **TTL**, **invalidation** when source data changes — the hard part).

### Redis vs Memcached (exam-level)

| | **Redis** | **Memcached** |
|---|-----------|----------------|
| **Replication / HA** | **Multi-AZ** with **auto-failover**; **read replicas** (up to **5** in cluster-mode-disabled story) | Classic model: **no** replication; **sharded** multi-node partition; **simpler** but **volatile** |
| **Durability** | **AOF** persistence, **backup/restore** (engine-dependent) | Often **purely ephemeral**; **backup/restore** nuances differ by deployment mode (e.g. **serverless** vs self-managed in course) |
| **Data structures** | **Sets**, **sorted sets** (e.g. **leaderboards**) | Simple **key/value** |
| **Threading** | Mostly single-threaded per process (simplified) | **Multi-threaded** architecture can help throughput |

### Creating a cluster (console recap)

- Engine: **Valkey** (Redis-compatible), **Redis OSS**, or **Memcached**; **Serverless** vs **node-based** cluster.
- **Cluster mode disabled** — one **shard**, one **primary**, **0–5** replicas; **cluster mode enabled** — **multiple shards** for horizontal scale-out.
- **Multi-AZ** + **auto-failover** (Redis) for HA (extra cost).
- **Subnet group**, **security groups**, **encryption at rest** (KMS), **encryption in transit** (enables **Redis AUTH** token or **ACL user groups**).
- Logs to **CloudWatch Logs** (slow log, engine log). **Outposts** option for on-premises footprint.

**Endpoints:** **primary** and **reader** endpoints (Redis with replicas) for apps to connect.

### Redis scaling (SysOps / exam)

**Cluster mode disabled**

- **Horizontal:** add/remove **read replicas** (max **5**).
- **Vertical:** change **node type** — behind the scenes ElastiCache provisions a **new node group**, **replicates** data, updates **DNS** → **transparent** to apps.

**Cluster mode enabled**

- **Online scaling:** cluster stays **up**; possible **performance dip** during change.
- **Offline scaling:** cluster **unavailable** during change; allows bigger structural moves (e.g. some **engine upgrades**).
- **Horizontal:** **resharding** — add/remove **shards**; **rebalance** key space across shards.
- **Vertical:** change shard **node type** — can be **online** in many cases.

**Metrics:** **Evictions** (non-expired keys dropped for space) → tune **eviction policy**, **bigger** nodes, or **more** shards/replicas; **CPUUtilization**; **SwapUsage** (keep low, e.g. **&lt; ~50 MB** in course); **CurrConnections** (connection churn / pooling issues); **DatabaseMemoryUsagePercentage**; **ReplicationLag** / **BytesUsedForReplication** (want **low lag**).

### Memcached scaling

- **Cluster:** **1–40** nodes (soft limit — request increase for more).
- **Horizontal:** add/remove **nodes**; clients use **configuration endpoint** + **Auto Discovery** so they learn **all** node IPs **without** hardcoding each node.
- **Vertical:** create a **new** cluster with larger nodes → **point app** to **new** endpoints → **delete** old cluster (**manual** cutover). New cluster starts **empty** — app must **repopulate** (no automatic data move like Redis backup restore in the simple Memcached story).

**Auto Discovery:** client hits **config endpoint** → first node returns **metadata** listing **all** node IPs → client connects to appropriate node for keys.

**Metrics:** similar themes — **Evictions**, **CPUUtilization**, **SwapUsage**, **CurrConnections**, **FreeableMemory**.

## Creating and Operating an RDS Instance (hands-on recap)

**Console:** RDS → **Databases** → **Create database**.

- **Easy create** vs **full configuration** — full exposes Multi-AZ templates (e.g. two-instance Multi-AZ DB instance, three-instance cluster) for production-style setups; **free tier** often **single-AZ** only.
- **Engine** (e.g. MySQL), **version**, **instance class** (e.g. `db.t4g.micro` on free tier).
- **Credentials:** self-managed password or **Secrets Manager** (more secure, **extra cost**).
- **Auth:** password and optional **IAM DB authentication**.
- **Storage:** size (e.g. 20 GiB) + optional **storage autoscaling** with a **max** cap.
- **Connectivity:** VPC, subnet group, **public access** (yes/no), new or existing **security group** (inbound **3306** for MySQL from your IP in demos).
- **Port** (default **3306** for MySQL).
- **Monitoring:** Standard vs **Enhanced Monitoring**; optional **log export** to CloudWatch.

**Client:** connect with any SQL client using **endpoint**, **port**, **user**, **password**, **database name**.

**Operations shown:** CloudWatch metrics (CPU, connections), **manual snapshots**, **PITR restore**, **cross-Region snapshot** copy, **create read replica**, **modify** Multi-AZ on replica.

**Cleanup:** disable **deletion protection** (modify → apply), then **delete** (optional final snapshot).

## Key Takeaways

- RDS = **managed SQL**; engines include **Aurora**, Postgres, MySQL, MariaDB, Oracle, SQL Server, Db2.
- **Storage Autoscaling** uses **free-space thresholds**, **duration**, **cooldown**, and a **max** size cap.
- **Read replicas** = **async**, **eventual consistency**, **read scale** / reporting / **promotion**; **same-Region AZ** replication **free**, **cross-Region** **paid** transfer.
- **Multi-AZ** = **sync** standby, **one endpoint**, **automatic failover**; **not** a read pool; can combine with **Multi-AZ on replicas**. Know **failover triggers** (failure, patching, network, instance class change, unresponsive, storage failure, AZ outage, **reboot with failover**).
- **Enable Multi-AZ** on existing DB is **online**; implementation uses **snapshot + restore + sync** internally.
- **Automated backups:** **0–35** day retention, **PITR**, restore → **new** instance. **Snapshots:** **manual** persistent, **shareable** (encrypted needs **KMS**), **Multi-AZ** snapshots from **standby**.
- **Events** → **SNS** subscriptions or **EventBridge**; **logs** → **CloudWatch Logs** + **metric filters** / **alarms**.
- **CloudWatch** standard vs **Enhanced Monitoring** (OS-level); **Performance Insights** for **Waits/SQL/users/hosts** (not on all instance families).
- **Aurora:** compatible with **MySQL/Postgres**, **auto-growing** shared storage, **6/3 AZ** quorum story, **writer** + **reader** **endpoints**, **fast failover**, **backtrack** (in-place, MySQL in course), **clone** (COW), **cross-Region** replicas / **Global Database** (**primary writes**, **&lt;~1s** replication, **DR RTO** story).
- **Aurora Serverless:** **ACU**-style scaling, **pay-for-use**, good for **spiky** workloads; **proxy** layer abstracts compute scaling.
- **RDS Proxy:** **pooling**, **Lambda**-friendly, **~66%** failover improvement (course), **IAM** + **Secrets Manager**, **VPC-only** endpoint.
- **ElastiCache:** **Redis** vs **Memcached** tradeoffs; **cache-aside** + **sessions**; **cluster mode** on/off scaling patterns; **Memcached** vertical = **new cluster** + **repoint**; **Auto Discovery** for Memcached clients.
- **Security:** **KMS** at-rest at **create** time; **snapshot-restore** to encrypt; **TLS** in flight; **IAM DB auth**; **SGs**; no SSH except **RDS Custom**; **audit logs** → **CloudWatch Logs** for retention/analysis.
