---
title: "Amazon Route 53: Registrar Delegation, Resolver, Logging, and Governance"
date: "2026-03-29"
excerpt: "CloudOps exam notes on separating registrar from DNS, delegating NS to Route 53, S3 static website aliases, hybrid DNS with Resolver endpoints, cross-account private hosted zones, query logging, Resolver DNS Firewall, ARC, Route 53 Profiles, and cost cleanup."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "route-53", "dns", "resolver", "s3", "hybrid-dns", "dns-firewall", "arc", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 20
collectionTitle: "AWS CloudOps Engineer - Associate"
---

This note covers **who serves DNS** vs **where you bought the domain**, **S3 static websites** behind **custom** names, **hybrid** **DNS** with **Route 53 Resolver**, **cross-account** **private hosted zones**, **logging**, **DNS Firewall**, **Application Recovery Controller**, **Route 53 Profiles**, and **pricing**/**cleanup** after labs.

**Earlier parts:** **[DNS fundamentals](/en/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases)** · **[Routing policies and health checks](/en/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow)**.

## Domain registrar vs DNS service

- **Registrar** = where you **pay** for the **domain** (annual renewal). Examples: **Route 53** registration, **GoDaddy**, **Google Domains**, others.
- **DNS hosting** = where the **zone** and **records** live (**authoritative** **name servers**).

**You can mix vendors:** register at **GoDaddy** but host DNS in **Route 53**, or register in **Route 53** but use another **DNS** provider (less common in training).

**Delegation:** create a **public hosted zone** in **Route 53** and copy the **four** **NS** records Route 53 assigns. At the **registrar**, set **custom name servers** to those **values**. After **propagation**, **all** **record** edits happen in **Route 53**; the registrar only holds **registration** and **NS delegation**.

## S3 static website and Route 53

- Enable **static website hosting** on the bucket and set **index** document (e.g. **`index.html`**). Objects must be **readable** as required (public or via **policies** — follow current **S3** **best practices**).
- **Exam-critical:** the **bucket name** must **exactly match** the **FQDN** you want (e.g. **`blog.example.com`** bucket for **`blog.example.com`** record).
- In **Route 53**, create an **alias** **A** record targeting the **S3 website endpoint** for that **Region** (console walks **S3 website endpoints**, not the **REST API** endpoint).
- **HTTP only** on **S3 website** endpoints for this pattern; **HTTPS** with a **custom domain** typically requires **CloudFront** in front (certificate on **ACM**, **alternate domain** on distribution).

## Route 53 Resolver (hybrid DNS)

- Every **VPC** gets a **Resolver** address (**.2**) that answers **queries** for **Amazon-provided** DNS, **private hosted zones** attached to the **VPC**, and **public** internet names via **recursive** resolution **by default**.

**Hybrid** setups need **connectivity** (**Site-to-Site VPN**, **Direct Connect**, or equivalent) between **on-premises** and **AWS**.

| Endpoint | Direction | Role (high level) |
|----------|-----------|-------------------|
| **Inbound** | **On-premises resolvers → AWS** | Forward queries for **private** **Route 53** names (e.g. **private hosted zones**) into **AWS** so **on-prem** clients resolve **cloud** records. |
| **Outbound** | **AWS → on-premises DNS** | Forward queries from **VPC** workloads to **your** **datacenter** DNS for **internal** zones (e.g. **`app.corp.internal`**). |

Place **inbound**/**outbound** **resolver endpoints** in **subnets** with **routing** to **on-prem**; **security groups** control **who** can use them. **Forwarding rules** define **which** suffixes go **where**.

## DNS query logging vs Resolver query logging

### Public hosted zones — DNS query logging

- Logs **public** **DNS queries** received for **public hosted zones** (as described in training).
- Typical destination: **CloudWatch Logs** (and from there **export** to **S3** if needed).
- Example fields called out: **log format version**, **timestamp**, **hosted zone ID**, **query name**, **query type**, **response code**, **protocol**, **edge location**, **resolver IP**, **EDNS client subnet** — confirm **current** log **schema** in docs.

### Resolver query logging

- Logs **DNS queries** from **resources in your VPCs** — covers **private hosted zones**, **Resolver** **inbound/outbound** paths, **Resolver DNS Firewall**, etc.
- Destinations: **CloudWatch Logs**, **S3**, or **Kinesis Data Firehose** (course list).
- **Sharing:** configuration can be shared to **other accounts** via **AWS Resource Access Manager (RAM)** where supported.

## Resolver DNS Firewall

- **Managed** filtering of **outbound** DNS **queries** leaving the **VPC** through **Route 53 Resolver** (before or as part of resolution path — think **egress** **DNS** **policy**).
- **Block** known-bad **domains** or **allow** only **approved** **domains** — mitigates **DNS-based exfiltration** and **malware** **C2** using DNS.
- **AWS Firewall Manager** can help **organize** **policies** across accounts (as in the lecture).
- **Logs** integrate with **CloudWatch Logs** and **Resolver query logging** (per training).

## Application Recovery Controller (ARC)

- **Orchestrates** and **automates** **recovery** for **mission-critical** apps across **AZs** and **Regions** (active/active or active/standby).
- **Readiness checks** continuously validate that **standby** / **replica** **infrastructure** can take traffic.
- **Routing controls** work with **Route 53** and **health** primitives to **shift** traffic (**zonal** **shift**, **regional** **failover**) when **impairments** occur.
- **Use when** **RTO/RPO** and **regulatory** / **business continuity** **requirements** demand **controlled** **failover** — **Route 53** remains the **DNS** **layer** **coordinating** **user** **traffic** **moves** in the story.

## Route 53 Profiles

- **Central** management of **DNS-related** **configuration** across **many** **VPCs** and **accounts**.
- Can associate **resources** such as **private hosted zones**, **Resolver rules**, **Resolver DNS Firewall** **rule groups**, and **VPC interface endpoints** — then **apply** the **profile** to **selected** **VPCs** so they **inherit** the **same** **DNS** **setup**.
- **Cross-account:** **share** **profiles** (and related **resources**) with **RAM** so **other** **accounts** **consume** a **standard** **baseline**.
- Console may also surface **DNSSEC**, **failure mode**, and **Resolver** **lookup** **options** at the **profile** level (verify **current** **features**).

## Cross-account private hosted zone association

- A **private hosted zone** in **Account A** can be **associated** with a **VPC** in **Account B** (multi-account **shared services** or **hub** DNS patterns).
- **Order of operations (exam):**
  1. In **Account A** (zone owner), create a **VPC association authorization** for the **VPC** in **Account B** (API/CLI — e.g. `create-vpc-association-authorization` in the **Route 53** API family).
  2. In **Account B**, **associate** the **VPC** with the **private hosted zone** as usual; **Route 53** allows it because the **authorization** already exists in **Account A**.

Without the **authorization**, the **cross-account** **association** **fails**.

## Costs and lab cleanup

**Confirm** all numbers against **[Route 53 pricing](https://aws.amazon.com/route53/pricing/)** — training uses **round** figures.

- **Registered domain:** renewal is **annual** (course cited **~$12/year** for a **cheap** **`.com`** — **your** **TLD** and **registrar** **vary**). **Deleting** the **hosted zone** does **not** cancel **domain** **registration**; the **name** **remains** **registered** until it **expires** or you **transfer** it.
- **Hosted zone:** a **public** or **private** **hosted zone** has a **monthly** **charge** if it **exists** (training cited **~$0.50/month** per zone — record **count** does **not** change that **base** story). To **delete** a **hosted zone**, **remove** **all** **records** **first** (except the **NS**/**SOA** that Route 53 may manage — follow **console** **steps** for **emptying** the zone), then **delete** the **zone**.
- **Labs:** terminate **EC2** instances, **ALBs**, and **target groups** created for **routing** demos in **each** **Region** used; remove **health checks** and **Traffic Flow** **policy records** if you created them (Traffic Flow can be **expensive**).

## Key Takeaways

- **Registrar ≠ DNS:** **delegate** **NS** at the **registrar** to **Route 53**’s **name servers** to use **hosted zones** in **AWS**.
- **S3 website + custom name:** **bucket name = FQDN**; **alias** to **website** **endpoint**; **HTTP** only at **S3** — **HTTPS** → **CloudFront** pattern.
- **Resolver** **inbound** = **on-prem** → **AWS** names; **outbound** = **VPC** → **on-prem** DNS; needs **network** **path** and **rules**.
- **Two logging families:** **public zone** **query logging** vs **VPC** **Resolver** **query logging** (destinations and **RAM** differ).
- **DNS Firewall** = **filter** **outbound** **DNS** from **VPCs**; **exfiltration** **use case**; **Firewall Manager** for **scale**.
- **ARC** = **readiness** + **traffic** **shifts** for **multi-AZ**/**multi-Region** **recovery** with **Route 53** integration.
- **Profiles** = **standardize** **DNS** **attachments** across **VPCs**/ **accounts**; **RAM** for **sharing**.
- **Cross-account PHZ:** **authorization** in **zone account** **first**, then **VPC** **association** in **member** **account**.
- **Billing:** **hosted zone** **monthly** fee while the **zone** **exists**; **empty** **records** then **delete** **zone**; **domain** **renewal** is **separate** from **zone** **deletion**.

---
*See also: [Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow](/en/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow).*
