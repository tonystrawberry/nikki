---
title: "AWS IAM Identity: Permission Boundaries, Federation, STS, and Access Tools"
date: "2026-03-29"
excerpt: "CloudOps exam notes on IAM permission boundaries vs identity policies and SCPs, Credentials Report and Access Advisor, IAM Access Analyzer, STS (AssumeRole, SAML, web identity, MFA), enterprise vs app federation (SAML, custom broker, Cognito), and the IAM policy simulator."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "iam", "sts", "saml", "cognito", "permission-boundary", "access-analyzer", "federation", "cloudops", "certification", "security"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 17
collectionTitle: "AWS CloudOps Engineer - Associate"
---

**Identity and access** topics that show up repeatedly on **SysOps / CloudOps** exams: how **effective permissions** combine **SCPs**, **permission boundaries**, and **identity-based policies**; **operational** IAM tools for **credential hygiene** and **least privilege**; **external access** detection with **IAM Access Analyzer**; **temporary credentials** via **AWS STS**; **federation** patterns for **enterprise** and **public** applications; and **policy simulation** before you change production.

Related collection posts: **[AWS Security, Compliance, Encryption, and Secrets for CloudOps](/en/posts/aws-security-compliance-encryption-and-secrets-notes)** (KMS, Secrets Manager, Security Hub, etc.).

## IAM permission boundaries

- **Supported only for IAM users and roles** — **not** for **IAM groups**.
- A **permission boundary** is a **managed policy** that sets the **maximum** permissions an entity is allowed to **receive**. It does **not** grant access by itself.
- **Effective permissions** for the principal are the **intersection** of:
  - what **identity-based** policies **allow**, and
  - what the **permission boundary** **allows** (and minus explicit **denies** in either place, plus **resource** policies and **SCPs** where applicable).

**Mental model from training:** if the boundary allows only **`s3:*`**, **`cloudwatch:*`**, and **`ec2:*`**, and the identity policy allows **`iam:CreateUser`**, the **union** of “what the boundary permits” and “what the identity policy asks for” still yields **no** **`IAM`** API access — **`CreateUser`** is outside the boundary, so it is **not** effective.

### How boundaries relate to Organizations SCPs

Think of three layers that **narrow** what is possible:

1. **Service control policies (SCPs)** — org / OU / account **guardrails** (no grants to principals by themselves).
2. **Permission boundary** — cap on what **this user or role** can ever be given.
3. **Identity-based policy** — what you **intend** the principal to do.

**Effective** access sits where all applicable constraints **overlap**. **Permission boundaries** behave **somewhat like SCPs** in spirit: they define an outer **limit**; **identity policies** define **actual** allows inside that limit.

### Typical use cases

- **Delegate** IAM administration to **non-admin** users (e.g. create users or attach policies) **without** letting them **escalate** to full admin — the boundary **blocks** disallowed services or actions.
- Let **developers** **self-assign** certain policies while **preventing privilege escalation** beyond the boundary.
- Tighten **one user or role** without changing **account-wide** **SCPs**.
- **Prototype** the effect of an **SCP-like** cap using a **boundary** on a test principal before rolling out org policies.

## IAM Credentials Report (account scope)

- **Account-level** report: **IAM → Credential report** → **Download** (CSV).
- Lists **all IAM users** in the account (and reflects **root** where applicable in the training narrative) with **credential** metadata:
  - user creation time
  - **password** enabled / last used / last changed; **rotation** expectations if rotation is configured
  - **MFA** status
  - **access keys**: present or not, **rotation** and **last used**
  - **signing certificates** and related fields (as shown in the course CSV)
- Use it for **security reviews**: stale passwords, missing **MFA**, old **access keys**, accounts that deserve follow-up.

## IAM Access Advisor (user / role / group scope)

- **Per-principal** view in the console: open a **user** (or equivalent entry point for **roles** / **groups** in the IAM console) → **Access Advisor** / **Last accessed** information.
- Shows **which AWS services** the principal **could** use (from granted permissions) and **when** each service was **last accessed** (API or console activity in the reporting window).
- Supports **least privilege**: identify **unused** service permissions and **shrink** policies.
- **Drill-down:** for a service (e.g. **EC2**), the UI can indicate **which policy** (e.g. **`AdministratorAccess`**) granted access to that service — useful when many policies are attached.

## IAM Access Analyzer

- **Purpose:** find resources that are **shared** with **principals outside** your defined **zone of trust** (unintended **external** or **cross-account** exposure).
- **Resource types** called out in training include **S3 buckets**, **IAM roles**, **KMS keys**, **Lambda functions and layers**, **SQS queues**, and **Secrets Manager secrets** (confirm current coverage in AWS docs).
- You define a **zone of trust** — e.g. **this AWS account** or **your entire Organization** — and the analyzer reports **findings** where access extends **beyond** that zone (e.g. **another account**, **anonymous** / **public** principals, **external** identities by IP or pattern, depending on resource policy).
- **Enabling** an analyzer creates a **service-linked role** so Access Analyzer can read resource and policy data. **Enabling** the feature is **free** in the course narrative; confirm **pricing** for ongoing use.
- **Finding lifecycle:**
  - **Active** — still matches policy.
  - **Resolved** — you **fixed** the policy (e.g. removed `Principal: *` on an **SQS** queue); **rescan** to confirm.
  - **Archived** — you accept the risk (e.g. **intentionally public** **S3**); finding moves to **archived** state.
- **Archive rules:** auto-**archive** findings that match criteria you define (e.g. recurring **public bucket** patterns you have **approved**).

## AWS Security Token Service (STS)

- **STS** issues **short-lived** credentials (**access key ID**, **secret**, **session token**) for **limited-time** access to AWS APIs.
- **Duration:** temporary credentials are valid for a **configurable** period (course mentions **up to about an hour** or **longer** depending on context and API — verify current **maximum session duration** per flow and role settings).
- Common **APIs:**
  - **`AssumeRole`** — obtain credentials for an **IAM role** in the **same** or **another** account; used for **cross-account** access, **session** elevation, and **federated** flows that wrap **AssumeRole**.
  - **`AssumeRoleWithSAML`** — exchange a **SAML assertion** from an **enterprise IdP** for **temporary** AWS credentials (after **trust** and **SAML provider** configuration).
  - **`AssumeRoleWithWebIdentity`** — exchange **OIDC** / web-identity tokens (e.g. social login) for **temporary** credentials; **AWS now steers you toward Amazon Cognito** for new app designs instead of calling this API directly from apps in many scenarios.
  - **`GetSessionToken`** — obtain **MFA-backed** temporary credentials for an **IAM user** or **root** user after **MFA** verification (course framing).
- **Cross-account pattern (exam classic):**
  1. In **Account B** (e.g. **production**), create an **IAM role** with permissions to the resource (e.g. **S3** bucket) and a **trust policy** allowing **Account A** (e.g. **development**) to **`sts:AssumeRole`**.
  2. In **Account A**, grant principals (users, roles, or groups) **`sts:AssumeRole`** on that **role ARN**.
  3. User in **A** calls **`AssumeRole`** → receives **temporary** credentials → uses them as **Account B**’s role for **API** calls.

Without **both** sides — **trust** in **B** and **permission to assume** in **A** — **AssumeRole** fails.

## Identity federation (overview)

**Federation** means users **do not** need **long-lived IAM users** in AWS: they authenticate **elsewhere**, then receive **temporary** AWS credentials (usually via **STS** and **roles**).

### SAML 2.0 (enterprise)

- Typical for **large enterprises** with **Active Directory Federation Services**, **Azure AD**, or other **SAML 2.0** **IdPs**.
- User authenticates to **IdP** → receives **SAML assertion** → exchanges it via **`AssumeRoleWithSAML`** (CLI/SDK) or the **console federation** endpoint (browser sign-in to **AWS Management Console**).
- **Benefit:** **no per-employee IAM user**; **access** is **role-based** and **temporary**.

### Custom identity broker (enterprise, non-SAML)

- When there is **no SAML 2.0** path, you build a **custom identity broker application** that:
  - authenticates users against your **corporate** identity store, and
  - calls **STS** (with **privileged** broker credentials) to mint **temporary** credentials with a **tailored** policy per user.
- **More work** than native **SAML** integration but same **idea**: **external identity** → **broker** → **STS** → **temporary** AWS access.

### Amazon Cognito (public and mobile apps)

- For **web** or **mobile** users (e.g. upload to **S3** with **Facebook** / **Google** / **Cognito User Pools** / **SAML** / **OIDC**):
  - App authenticates user with **IdP** → gets **token** → app calls **Cognito federated identity pools (identity pool)** → Cognito validates the token and calls **STS** → app receives **temporary** credentials scoped by **IAM roles** mapped in the **identity pool**.
- **AWS documentation** has moved away from recommending **raw Web Identity Federation** without **Cognito** for new applications — **Cognito** is the **exam-oriented** answer for **federated identity** for **public** apps.

## IAM policy simulator

- **Purpose:** **test** and **troubleshoot** whether a **principal** would be **allowed** or **denied** a given **action** on a **resource** **before** or **without** making live changes everywhere.
- Accessible from the **IAM console** (link from **AWS documentation** for **IAM Policy Simulator** if the console URL moves).
- Can incorporate:
  - **identity-based** policies on **users**, **groups**, **roles**
  - **resource-based** policies (e.g. **S3** bucket policy)
  - **permission boundaries**
  - **Organizations SCPs** when the account is in an **Organization** (simulator reflects **SCP** effect in the course demo)
- You pick **service** and **action** (e.g. **`sqs:DeleteMessage`**, **`sqs:DeleteQueue`**), run **simulation**, and inspect **allow** / **implicit deny** with **which statement** matched (or none).
- Strong tool for **debugging** “why is this **denied**?” when multiple policies interact.

## Key Takeaways

- **Permission boundaries** apply to **users and roles only**; they **cap** effective permissions; combine with **identity policies** and **SCPs** as **intersecting** constraints.
- **Credentials Report** = **account-wide** **CSV** **credential** inventory; **Access Advisor** = **per-principal** **service** last-access for **least privilege**.
- **Access Analyzer** = **zone of trust** vs **external** access **findings**; **resolve** by fixing policies or **archive** accepted risk; **archive rules** for automation.
- **STS** = **temporary** credentials; **`AssumeRole`** for **roles** and **cross-account**; **`AssumeRoleWithSAML`** for **enterprise** **SAML**; **`GetSessionToken`** for **MFA** sessions; **web identity** flows increasingly **Cognito-centric**.
- **Federation** = **external IdP** → **token/assertion** → **STS** (directly or via **Cognito**) → **temporary** AWS access; **custom broker** when **not SAML**.
- **Policy simulator** = safe **what-if** across **identity**, **resource**, **boundary**, and **SCP** layers.
