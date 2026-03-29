---
title: "AWS Security, Compliance, Encryption, and Secrets for CloudOps"
date: "2026-03-29"
excerpt: "CloudOps exam notes on WAF, Shield, Firewall Manager, Inspector, logging with Athena, GuardDuty, Macie, Trusted Advisor, Security Hub, Audit Manager, KMS (rotation, MRK, deletion), ACM, and Secrets Manager vs Parameter Store."
author: "Tony Duong"
category: "note"
tags: ["aws", "waf", "shield", "firewall-manager", "kms", "acm", "tls", "secrets-manager", "security-hub", "guardduty", "inspector", "macie", "cloudops", "certification", "compliance", "encryption"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 13
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Consolidated **security and compliance** material for **SysOps / CloudOps** certification prep: **perimeter** controls (**WAF**, **Shield**, **Firewall Manager**), **vulnerability** and **data privacy** services, **centralized** security posture (**Security Hub**, **GuardDuty**, **Trusted Advisor**, **Audit Manager**), the **logging → S3 → Athena** pattern, and **encryption** primitives (**KMS**, **ACM**) plus **Secrets Manager** vs **Systems Manager Parameter Store**.

For **disaster recovery** data movement and backups, see **[AWS DataSync and AWS Backup: Disaster Recovery Notes](/en/posts/aws-datasync-and-backup-disaster-recovery-notes)**.

## AWS WAF (Web Application Firewall)

- **Layer 7 (HTTP/HTTPS)** protection — contrast with **layer 4** (**TCP/UDP**) where **NLB** lives; **WAF does not attach to NLB** in the exam story.
- **Attach to:** **Application Load Balancer**, **API Gateway**, **CloudFront**, **AppSync** GraphQL APIs, **Cognito** user pools.
- **Web ACLs** hold **rules**; **rule groups** bundle reusable rules. **IP sets** can hold up to **10,000** addresses per set (use multiple rules/sets for more).
- Rule types called out in training: **IP** allow/deny, **HTTP headers** and **body**, **URI** strings (e.g. **SQL injection**, **XSS** patterns), **size constraints**, **geo match** (allow/block countries), **rate-based** rules (e.g. cap requests per IP per time window for **DDoS**-style abuse).
- **Regional** Web ACLs for regional resources; **CloudFront** uses **global** Web ACLs created in **us-east-1** (N. Virginia).
- **Exam architecture:** need **WAF** + **static IPs** → **Global Accelerator** (Anycast static IPs) in front of an **ALB**, with **WAF** on the **ALB** (same Region as the app).

## AWS Shield and AWS Firewall Manager

### Shield

- **Shield Standard:** **free**, on for all customers; mitigates common **L3/L4** attacks (**SYN/UDP** floods, reflection attacks, etc.).
- **Shield Advanced:** **optional** paid tier (course cites on the order of **~$3,000/month per organization** — confirm pricing); broader **DDoS** mitigation for **EC2**, **ELB**, **CloudFront**, **Global Accelerator**, **Route 53**; **24/7 DDoS Response Team (DRT)**; **cost protection** for scale-out during attacks; **automatic application-layer** mitigation that can **create and adjust WAF rules** for **L7** events.

### Firewall Manager

- **Organization-wide** security policies across **member accounts**: **WAF** rules, **Shield Advanced** settings, **security group** baselines for **EC2/ALB/ENI**, **Network Firewall**, **Route 53 Resolver DNS Firewall**.
- Policies are defined **per Region** and **replicated** across the org; **new resources** (e.g. a new **ALB**) can **automatically** inherit policies — a key differentiator from one-off **WAF** only.
- **Positioning:** use **WAF** alone for a **single-account / one-off** Web ACL; use **Firewall Manager** to **standardize** and **automate** WAF (and other firewall types) **across accounts**; **Firewall Manager** can also help **roll out Shield Advanced** org-wide.
- Console demos often note **per-policy monthly cost** for Firewall Manager — avoid clicking **Subscribe** in personal accounts during labs.

### How they fit together

**WAF** + **Shield Advanced** + **Firewall Manager** are **complementary**: define ACLs in **WAF**, **orchestrate** them with **Firewall Manager** for **multi-account** consistency, add **Shield Advanced** when you need **DRT**, **cost protection**, and **automatic L7** WAF tuning under attack.

## Amazon Inspector

- **Continuous** security assessments for **EC2** (via **SSM** agent — instances must be **managed** by **Systems Manager**), **container images** pushed to **ECR**, and **Lambda** (on deploy) for **CVEs** / dependencies; **network reachability** analysis for **EC2**.
- Findings go to **Security Hub** and **EventBridge**; **risk scores** help prioritize.
- **Pricing / trials:** course mentions per-resource metering and trials — **disable** when labs finish.

## Amazon Macie

- **Fully managed** discovery of **sensitive data** (e.g. **PII**) in **S3** using **ML** and pattern matching.
- Alerts flow through **EventBridge** → **SNS**, **Lambda**, etc. Training frames **Macie** as **S3-focused** for this section.

## Audit logging and analysis

Common **security and audit** log sources:

| Source | Role (high level) |
|--------|-------------------|
| **CloudTrail** | **API** and console **audit** |
| **AWS Config** | **Configuration** and **compliance** over time |
| **CloudWatch Logs** | Application and service **logs**, retention controls |
| **VPC Flow Logs** | **IP traffic** visibility inside the VPC |
| **ELB access logs** | **Metadata** for requests through the load balancer |
| **CloudFront** logs | Viewer requests to distributions |
| **WAF** logs | Requests evaluated by **WAF** |

**Exam pattern:** land logs in **S3**, analyze with **Athena** (e.g. investigate **ELB** access when **EC2** instances are gone). Harden log buckets: **encryption**, **IAM/bucket policies**, **MFA**; long-term retention with **Glacier** / **S3 Object Lock** / **Vault Lock** style controls where compliance requires immutability.

## Amazon GuardDuty

- **Threat detection** using **ML**, **anomaly detection**, and **threat intelligence**; **no agents**; **30-day** trial in course narrative.
- **Core data sources:** **CloudTrail** (including unusual **management** and **S3 data-plane** APIs), **VPC Flow Logs**, **Route 53 Resolver** **DNS logs** (e.g. suspicious or **encoded** queries suggesting compromise).
- **Optional** data sources in training (verify current product list): **EKS** audit logs, **RDS/Aurora** login activity, **EBS**, **Lambda** network activity, **S3** data events, **runtime** monitoring, etc.
- **Findings** → **EventBridge** → **Lambda**, **SNS**, etc.
- **Cryptocurrency** / **mining** activity is called out as a **dedicated finding family** on exams.

## AWS Trusted Advisor

- **No installation**; high-level **checks** across **cost optimization**, **performance**, **security**, **fault tolerance**, **service limits**, **operational excellence** (examples: public **EBS/RDS** snapshots, **IAM** hygiene).
- **Free** tier vs **Business/Enterprise** support for **full** checks and **AWS Support API** access.
- Integrations: **Security Hub**, **Config**, **Compute Optimizer**; **CloudWatch** alarms on metrics such as **service limit** usage → **SNS**.
- **Organizations:** **aggregated** Trusted Advisor view from the **management** account when the org has **all features** and eligible **support** plan; enable **trusted access** / **delegated administrator** as documented.

## AWS Security Hub

- **Central** security posture dashboard; **aggregates** findings from **GuardDuty**, **Inspector**, **Macie**, **IAM Access Analyzer**, **Systems Manager**, **Firewall Manager**, **Health**, **Config**, and **partner** products.
- **AWS Config must be enabled** (prerequisite) for Security Hub’s **configuration-driven** checks.
- **Security standards** (e.g. **CIS AWS Foundations**) and **automated checks**; findings to **EventBridge**; **Amazon Detective** for **investigation** and root-cause analysis.
- **Multi-account:** integrate with **Organizations**; optional **delegated Security Hub administrator** for centralized configuration (e.g. run **CIS** across members).
- **Pricing:** per-check and **finding ingestion** charges; course mentions **free tier** for first **10,000** finding events and a **30-day** trial — confirm current pricing.

## AWS Audit Manager

- Continuous **risk** and **compliance** assessments for frameworks such as **GDPR**, **HIPAA**, **PCI DSS**, **SOC 2**.
- Select **frameworks**, define **scope** (accounts, Regions, services), collect **automated evidence** into **evidence folders**, run **control reviews** (with delegation), track **remediation**, and export **audit-ready** reports.

## AWS KMS (Key Management Service)

### Basics

- **IAM**-integrated **authorization**; **every use** of a key is **auditable** via **CloudTrail** (high-yield exam fact).
- **Symmetric keys:** one key material for **encrypt and decrypt**; you never export raw key bytes — only call **KMS APIs**. Default for most **AWS service** integrations.
- **Asymmetric keys:** **public** encrypt / **private** decrypt (or **sign/verify**); **public** key can be distributed to clients **outside** AWS that cannot call **KMS**; **private** key use stays API-only.

### Key types

| Kind | Notes |
|------|--------|
| **AWS owned** | Free; invisible; used under the hood (e.g. default **SSE-S3** / **DynamoDB** server-side encryption stories). |
| **AWS managed** | Free; **alias** pattern **`aws/<service>`**; **key policies** often restrict **ViaService** to the owning service (e.g. **EC2** for **EBS**). |
| **Customer managed** | You control **key policy**; course cites **~$1/month** per key plus **~$0.03 per 10,000** API calls — confirm pricing. |

### Key policies and cross-account

- **Every KMS key must have a key policy** — without it, **no one** can use the key (stricter default story than **S3** bucket-only IAM).
- **Default** key policy: trust the **account** + **IAM** for fine-grained allow.
- **Custom** policies for **least privilege** and **cross-account** access (e.g. share an **encrypted EBS** snapshot: source account **CMK** policy trusts the other account; target account **copies** the snapshot and **re-encrypts** with its **own CMK**).

### Regional keys and EBS

- Keys are **Regional**. **Cross-Region** **EBS** snapshot copy = snapshot is re-encrypted with a **CMK in the destination Region** (same logical key cannot span Regions for that workflow).

### Rotation

- **AWS-managed KMS keys:** automatic rotation about **every year**.
- **Customer-managed symmetric keys:** optional **automatic** rotation on a period between **90** and **2,560** days (still often discussed as ~**1 year** default); **automatic** and **on-demand** rotation keep the **same key ID** while **backing key** material rotates; old ciphertext still decrypts.
- **On-demand rotation:** **customer-managed symmetric** only; does not replace automatic schedule; subject to **service quotas** on frequency.
- **Manual rotation** (e.g. faster than KMS supports automatically): create a **new** key (**new key ID**), keep the **old** key for **decrypt**, move an **alias** with **UpdateAlias** so applications keep a **stable alias** name.
- **Asymmetric** and **imported** keys: use **alias**-based **manual** rotation patterns; **imported** keys rely on **manual** material rotation workflows (aliases help).

### Multi-Region Keys (MRK)

- **Primary** in one Region and **replica** keys in others share the **same key ID** and **key material** so you can **encrypt in Region A** and **decrypt in Region B** **without re-encrypting** ciphertext for that workflow; rotation on the primary **replicates**.
- Each replica has its **own key policy**; MRKs are **not** a single “global” object.
- Use when you truly need **cross-Region** crypto with one logical key (e.g. **global** **DynamoDB** / **Aurora** patterns, **client-side** encryption across Regions). Default guidance remains **prefer Regional keys** unless you have a concrete MRK use case.

### Deletion and safety

- Schedule key deletion with a **waiting period** of **7–30 days**. In **pending deletion**, the key **cannot** be used for **crypto** operations (dependent services **fail**); **scheduled rotation** is suspended; you can **cancel** deletion during the window.
- Prefer **disabling** a key first if unsure. **Automation:** **CloudTrail** records **denied** **KMS** calls when apps still reference a **pending-deletion** key → **CloudWatch Logs** **metric filter** → **alarm** → **SNS** to catch **stranded dependencies**.

### Changing the CMK on EBS

- You **cannot** change the **CMK** on an existing **EBS volume** in place: **snapshot**, create a **new volume** from the snapshot, and select a **new KMS key** (re-encrypt path).

## AWS Certificate Manager (ACM)

- **Provision, manage, and deploy** **TLS** certificates for **HTTPS** on **ALB/CLB/NLB**, **CloudFront**, **API Gateway** — **not** for exporting **public** ACM certs onto arbitrary **EC2** instances (private keys for **ACM-issued public** certs stay in the **ACM** trust boundary).
- **Public** ACM certificates: **free**; **automatic renewal** about **60 days** before expiry when ACM issued the cert.
- **Validation:** **DNS** (preferred for automation; **Route 53** can create records automatically) or **email** to domain contacts.
- **Imported** public certs: **no** ACM auto-renewal; **EventBridge** can emit **daily** **expiration** events starting ~**45** days before expiry (configurable); **AWS Config** managed rule **`acm-certificate-expiration-check`** flags **non-compliant** soon-to-expire certs — both can trigger **Lambda** / **SNS** / **SQS**.
- **ALB:** optional **listener rule** to **redirect HTTP → HTTPS**.
- **API Gateway custom domains:** **Edge-optimized** → traffic via **CloudFront** → ACM cert must be in **us-east-1**; **Regional** → ACM cert in the **same Region** as the API stage; **Private** APIs → **interface VPC endpoint** + **resource policy**.

## AWS Secrets Manager vs Systems Manager Parameter Store

### Secrets Manager

- Purpose-built for **secrets** with **optional automatic rotation** on a schedule using **Lambda** (AWS-managed rotation Lambdas for **RDS**, **Redshift**, **DocumentDB**, etc., or **custom** Lambdas for API keys and other secrets).
- **KMS** encryption is **mandatory** for stored secret material.
- **Multi-Region secrets:** **replicate** to other Regions; **promote** a replica after **DR** events.
- **Pricing** (course ballpark): **~$0.40/secret/month**, **~$0.05 per 10,000 API calls**, **30-day** trial — verify pricing.
- **CloudTrail** logs **API calls** and **Secrets Manager–specific non-API events** (e.g. **RotationStarted**, **RotationSucceeded**, **RotationFailed**, **RotationAbandoned**, secret version **delete** lifecycle events). **Metric filters** on **RotationFailed** → **CloudWatch alarm** → **SNS**; debug failed rotations in **Lambda** **CloudWatch Logs**.

### Parameter Store

- **Broader** parameter storage; **lower** cost; **KMS** encryption is **optional** (**SecureString**).
- **No** native rotation — implement **EventBridge** **schedule** → **Lambda** to rotate credentials and **update** the parameter.
- Can **reference** **Secrets Manager** secrets through **SSM** APIs in integration scenarios described in training.

## Key Takeaways

- **WAF** = **L7** only; **ALB**, **API Gateway**, **CloudFront**, **AppSync**, **Cognito** — **not NLB**; **CloudFront** ACLs **global** in **us-east-1**; **GA + ALB + WAF** for **static IP** + **WAF**.
- **Shield Standard** vs **Advanced**; **Firewall Manager** for **org-wide** **WAF** / **Shield** / **SG** / **Network Firewall** / **DNS Firewall** with **auto-onboarding** of new resources.
- **Inspector** = **ECR** / **EC2** / **Lambda** **CVE**-style scanning + **reachability**; **Macie** = **S3** **PII** discovery.
- **Logging** sources → **S3** → **Athena**; lock down and **retain** log buckets for **compliance**.
- **GuardDuty** = **CloudTrail** + **VPC Flow** + **DNS** (+ optional add-ons); **crypto-mining** findings; **EventBridge** automation.
- **Trusted Advisor** = six **pillars**; **full** features with **Business/Enterprise**; **Org** aggregation with right **support** + **trusted access**.
- **Security Hub** needs **Config**; aggregates **major** security services + **partners**; **Detective** for investigation; **delegated admin** for **multi-account**.
- **Audit Manager** = **continuous** **framework** evidence (**GDPR**, **HIPAA**, **PCI**, **SOC 2**, etc.).
- **KMS** = **CloudTrail** on all key use; **symmetric** vs **asymmetric**; **AWS owned** / **AWS managed** / **customer managed**; **mandatory key policies**; **cross-Region** **EBS** = **re-encrypt**; **cross-account** encrypted snapshots = **key policy** + **copy** + **target CMK**; **rotation** vs **alias** **manual** rotation; **MRK** for specific **cross-Region** crypto models; **pending deletion** **blocks** crypto; **EBS CMK** change via **snapshot**.
- **ACM** = **TLS** for **managed** AWS endpoints; **DNS** validation + **auto-renew**; **imported** certs need **EventBridge**/**Config** hygiene; **API Gateway** **edge** = **us-east-1** cert.
- **Secrets Manager** = **rotation** + **KMS** + **multi-Region** + rich **CloudTrail** **events**; **Parameter Store** = **cheaper**, **flexible**, **DIY** rotation, optional **KMS**.

---
*Companion post: [AWS DataSync and AWS Backup: Disaster Recovery Notes](/en/posts/aws-datasync-and-backup-disaster-recovery-notes).*
