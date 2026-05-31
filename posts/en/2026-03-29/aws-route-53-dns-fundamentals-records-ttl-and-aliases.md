---
title: "Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME"
date: "2026-03-29"
excerpt: "CloudOps exam notes on DNS resolution and terminology, Route 53 as authoritative DNS and registrar, A/AAAA/CNAME/NS, email records (MX, TXT/SPF/DKIM/DMARC), TTL tradeoffs, and Route 53 alias records for ALB and zone apex."
author: "Tony Duong"
category: "note"
tags: ["aws", "route-53", "dns", "alias", "cname", "ttl", "mx", "spf", "dkim", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 18
collectionTitle: "AWS CloudOps Engineer - Associate"
---

**DNS** and **Amazon Route 53** are core to **routing users** to **applications** on AWS. This note covers **how DNS works** at a high level, **Route 53** capabilities (including the **100% SLA** claim), **record types** you must recognize, **TTL** behavior, **email** records, and the critical **CNAME vs Route 53 alias** distinction for **load balancers** and the **zone apex**.

## DNS fundamentals

### What DNS does

The **Domain Name System (DNS)** maps **human-readable hostnames** (e.g. `www.example.com`) to **IP addresses** (or other targets) so browsers and APIs can reach servers. It is the **global backbone** for resolving names on the internet.

### Terminology

| Term | Meaning |
|------|--------|
| **Domain registrar** | Where you **purchase/register** a domain (e.g. **Route 53**, **GoDaddy**, others). |
| **DNS records** | Individual rows in a zone (types like **A**, **AAAA**, **CNAME**, **NS**, **MX**, **TXT**, …). |
| **Zone file** | The collection of **records** for a DNS zone (the **source of truth** for that zone at the authoritative name servers). |
| **Name servers** | Servers that **answer** DNS **queries** (recursive resolvers walk the tree; **authoritative** servers hold the zone data). |
| **TLD** (top-level domain) | **`.com`**, **`.org`**, **`.gov`**, **country codes**, etc. |
| **Second-level domain** | e.g. **`example.com`** (two labels before the public suffix in the usual teaching example). |
| **Subdomain** | e.g. **`www.example.com`**, **`api.example.com`**. |
| **FQDN** (fully qualified domain name) | Full hostname such as **`api.www.example.com`**. |
| **URL** | Combines **scheme** (**`https://`**), **host**, **path**, etc. |

The **root** of the DNS tree is **implicit** (often drawn as a trailing **`.`** in technical diagrams).

### Recursive resolution (conceptual)

When a client asks for **`example.com`**:

1. The **stub resolver** (often via a **local / ISP / corporate** **recursive** DNS server) queries the **root** DNS servers.
2. **Root** points to the **TLD** name servers for **`.com`** (**NS** records).
3. The **TLD** servers point to the **authoritative** name servers for **`example.com`** (**NS** at the registrar / DNS host).
4. The **authoritative** server returns the final answer (e.g. **A** record → **IPv4**).

**Resolvers cache** answers for the **TTL** (see below) so repeat lookups **do not** hit the authoritative chain every time.

## Amazon Route 53 overview

- **Highly available**, **scalable**, **fully managed** **DNS** service.
- **Authoritative DNS:** **you** define **hosted zones** and **records**; Route 53 answers queries **authoritatively** for those zones.
- **Domain registrar:** you can **register** domains in Route 53 (annual fee, **auto-renew** recommended if you intend to keep the name).
- **Health checks** can be tied to routing (covered in more advanced Route 53 topics).
- **Naming:** **Route 53** refers to **UDP/TCP port 53**, the traditional **DNS** port.
- **SLA:** training states Route 53 is the **only** AWS service with a **100%** **availability** **SLA** — verify current **AWS** **Service Level Agreements** for wording.

### Hosted zone and registration flow

After **registering** a domain (or **delegating** **NS** to Route 53), you get a **hosted zone** containing at minimum:

- **NS** records — **which name servers** are authoritative (Route 53’s **name servers** for your zone).
- **SOA** (start of authority) — **zone metadata** (serial, refresh timers, etc.).

**Source of truth** for your **records** is whatever you configure **in that hosted zone** in Route 53.

### Record anatomy (Route 53)

Each record typically includes:

- **Name** (hostname / subdomain within the zone, or **apex** / root of the zone).
- **Type** (**A**, **AAAA**, **CNAME**, …).
- **Value** (IP, hostname, or structured text depending on type).
- **Routing policy** (simple, weighted, latency, failover, geolocation, etc. — advanced topics).
- **TTL** — **time to live** for **caching** (except **alias** records, below).

## Core record types (exam essentials)

- **A** — hostname → **IPv4** address.
- **AAAA** — hostname → **IPv6** address.
- **CNAME** — hostname → **another hostname** (canonical name). **Cannot** be used at the **zone apex** for a standard CNAME (DNS RFC constraint — **apex CNAME** is invalid in classic DNS).
- **NS** — delegates **subdomains** or points to **authoritative** servers for the zone.
- **SOA** — **zone** authority metadata (present in hosted zones).

**Advanced** types exist (**SRV**, **PTR**, **CAA**, etc.) — associate-level focus stays on the list above plus email-related records.

## Email-related records (MX and TXT)

You do not need to **memorize** full mail stacks, but you should **recognize** these on exams:

| Record | Role |
|--------|------|
| **MX** | **Mail exchange** — where **inbound** mail for the domain should be **delivered** (priority + target host). |
| **TXT** | Arbitrary **text**; used for **verification**, **SPF**, **DKIM** publication, **DMARC**, etc. |

Common patterns:

- **SPF** (Sender Policy Framework) — published in **TXT**; lists **which servers** may **send** mail for your domain.
- **DKIM** — often published as **CNAME**s (e.g. **SES** provides **three** **CNAME**s for **selector** keys) for **cryptographic** signing; some setups use **TXT**.
- **DMARC** — **TXT** at **`_dmarc.domain`** defining **policy** when **SPF**/**DKIM** fail.

**Amazon SES** flow (high level): **verify** domain → add **TXT** for **verification** → add **DKIM** **CNAME**s → add **SPF** (and **MX** if receiving via SES) → wait for **DNS propagation** → domain shows **verified**. The console can **create records in Route 53** for you.

**Exam pattern:** **MX** = **receive**; **SPF**/**DKIM**/**DMARC** support **sending** and **trust** — **SPF**/**DKIM** content often lives in **TXT** (and **DKIM** keys as **CNAME** in SES’s model).

## TTL (time to live)

- **TTL** tells **resolvers and clients** how long they **may cache** the **answer** (e.g. **300** seconds).
- **High TTL** (e.g. **24 hours**): **fewer** queries → **lower** Route 53 **query** cost, but **slower** global convergence when you **change** a record (old IPs **linger** in caches until TTL **expires**).
- **Low TTL** (e.g. **60** seconds): **faster** updates after a change, but **more** queries and **higher** **per-query** cost.

**Migration strategy:** before a **planned** IP or endpoint change, **lower** TTL **ahead of time** (e.g. **24 hours** before) so most caches pick up the **short** TTL; perform the **cutover**; then **raise** TTL again once stable.

**TTL is required** on normal records. **Route 53 alias** records **do not** let you set TTL manually — **Route 53** assigns it (see below).

Verify **`dig`** / **`nslookup`** output in labs: **TTL** counts down on **cached** answers.

## CNAME vs Route 53 alias records

### CNAME

- Maps **one hostname** to **another hostname** (any **FQDN** target, not only AWS).
- **Valid** for **subdomains** like **`app.example.com`**.
- **Invalid** at **zone apex** **`example.com`** in standard DNS — the console error **“CNAME not permitted at apex”** reflects this.

### Alias (Route 53 extension)

- **AWS-specific** extension: alias **A** or **AAAA** that targets **supported AWS resources** by **hostname** (e.g. **ELB** DNS name, **CloudFront** distribution, **API Gateway**, **Elastic Beanstalk**, **S3 website endpoint**, **VPC interface endpoint**, **Global Accelerator**, another **record** in the same zone, …).
- Works for **apex** **and** **subdomains** — **solves** **apex** routing to **ALB**/**CloudFront** where **CNAME** cannot.
- **No separate charge** for **queries** to **alias** **A/AAAA** pointing to **AWS** targets in the **standard** pricing story (confirm [Route 53 pricing](https://aws.amazon.com/route53/pricing/) for current rules).
- **Health evaluation:** alias to **ELB** can **tie** to **target health** (e.g. **evaluate target health** in the console).
- **Underlying IP changes** (e.g. **load balancer** nodes): alias **tracks** the **AWS** **endpoint** — you **do not** manually update IPs.

**Important limitation:** you **cannot** create an **alias** to the **EC2** **public DNS** name as a first-class alias target the way you do for **ELB** — use **A** to **IP**, or put an **ALB**/**CloudFront** in front, or other patterns.

### Exam pattern

- **User-friendly name** → **ALB**/**CloudFront** → prefer **alias** **A**/**AAAA** for **apex** **`example.com`** and for **native** **AWS** integration.
- **Subdomain** → **external** hostname: **CNAME** is fine.

## Optional lab context (multi-Region EC2 + ALB)

Training often deploys **EC2** instances in **multiple Regions** with a small **user-data** **web** server, plus an **Application Load Balancer** in **one** Region, then points **Route 53** **A**/**CNAME**/**alias** records at **instance IPs** or the **ALB** DNS name to **observe** **TTL** and **routing** behavior.

## Key Takeaways

- **DNS** resolves **names** → **IPs** via a **hierarchical** system (**root** → **TLD** → **authoritative**); **resolvers cache** using **TTL**.
- **Route 53** = **authoritative** **DNS** + **registrar** + **health-aware** routing options; **name** references **port 53**; know the **100% SLA** claim from training.
- **A**/**AAAA** = direct **IP** mapping; **CNAME** = **hostname** chain; **NS**/**SOA** = **delegation** and **zone** metadata.
- **MX** = **inbound mail**; **TXT**/**SPF**/**DKIM**/**DMARC** = **sending** and **domain** **verification** patterns.
- **TTL** balances **cost**/**query volume** vs **speed** of **propagation** after changes; **lower** TTL **before** **migrations**.
- **CNAME** **cannot** sit at **zone apex**; **Route 53 alias** **A**/**AAAA** **can**, targets **AWS** resources, **no** manual **TTL**, **tracks** **ELB**/**CloudFront** **endpoints**, **not** a generic **alias** to **EC2** **DNS** name.

---
*Next: [Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow](/en/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow).*
