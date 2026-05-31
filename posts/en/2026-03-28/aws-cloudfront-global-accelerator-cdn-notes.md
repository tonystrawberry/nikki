---
title: "AWS CloudFront and Global Accelerator: CDN, Caching, Origins, and Edge Networking"
date: "2026-03-28"
excerpt: "Exam-oriented notes on CloudFront as a CDN, origins (S3 OAC, VPC, custom HTTP), caching and invalidation, Origin Shield, geo restrictions, logging and reports, ALB sticky sessions, and Global Accelerator vs CloudFront."
author: "Tony Duong"
category: "note"
tags: ["aws", "cloudfront", "cdn", "global-accelerator", "s3", "alb", "caching", "edge", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 10
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## CloudFront as a CDN

**Amazon CloudFront** is AWS’s **content delivery network (CDN)**. On the exam, **CDN** → think **CloudFront**.

- Caches **read-heavy** content at **edge locations** (points of presence) worldwide so users get **lower latency** and better experience.
- Large global footprint (course: on the order of **200+** PoPs — verify current numbers).
- Spreading traffic across the edge also helps with **DDoS** resilience; integrates with **AWS Shield** and **WAF** (security section in depth).

**Example:** Origin is an **S3 bucket in Australia**; a user in the **US** hits a **nearby edge**. First request may **fetch from origin**; later US users often get a **cache hit** at the edge without another trip to Australia.

## Origins

CloudFront pulls from an **origin** (backend):

| Origin type | Notes |
|-------------|--------|
| **Amazon S3** | Distribute and cache objects; can also support **upload** patterns via CloudFront. Secure S3 access with **Origin Access Control (OAC)** plus **bucket policy** (replaces legacy OAI patterns in modern setups). |
| **VPC origin** | **Private** ALB, **NLB**, or **EC2** in your VPC — no need to expose the app to the public internet (preferred for private apps; some console tiers may gate VPC origin). |
| **Custom origin (HTTP)** | Any HTTP server: **S3 static website endpoint** (website hosting enabled), **public ALB**, on-prem, etc. |

## Request Flow (cache basics)

1. Client → **edge location**.
2. Edge checks **cache** for that object (see **cache key** / policies below).
3. **Cache hit** → serve from edge.
4. **Cache miss** → CloudFront fetches from **origin**, **stores** response at the edge (per TTL/policy), returns to client.

S3 origins: traffic between CloudFront and S3 often uses the **AWS network**; **OAC** and **bucket policy** ensure **only CloudFront** (your distribution) can read private objects — **objects stay private** while viewers use the **CloudFront domain**.

## CloudFront vs S3 Cross-Region Replication (CRR)

| | **CloudFront** | **S3 CRR** |
|---|----------------|------------|
| **Model** | **Global edge cache**; objects cached at edges for a **TTL** | **Full bucket replication** to another Region |
| **Coverage** | Many PoPs worldwide by design | Only Regions you configure |
| **Freshness** | Cached; refresh via **TTL** or **invalidation** | Near **real-time** replica of objects |
| **Best for** | **Static** (or cacheable) content globally | **Dynamic** or **strongly consistent** multi-Region read patterns, fewer Regions |

## Hands-on pattern: Private S3 + CloudFront

- Create **S3 bucket**, upload objects (**private** — direct object URL **403**, console **Open** uses **pre-signed** URL).
- Create **CloudFront distribution**; choose a **plan** (course: **free** tier sufficient for demos; **pay-as-you-go** / higher tiers for more security or product features).
- Origin type **S3**; enable **private bucket access** / **OAC** (recommended settings).
- After deploy, **S3 bucket policy** often shows **statements allowing CloudFront** to `GetObject` (service may add/update automatically).
- Viewers use **`https://<distribution-domain>/<object-key>`** (e.g. `/coffee.jpg`, `/index.html`) — **no public S3 ACL** required.

## Caching: TTL, Policies, Invalidation

- **Cache** lives at **each edge**. Goal: high **cache hit ratio** → fewer origin hits.
- **TTL:** how long an object stays valid in cache (**0** to **~1 year**). Influenced by **`Cache-Control`** (e.g. `max-age`) and **`Expires`** from the origin; behavior settings can enforce **min / default / max** TTL when headers are missing or to clamp values.
- **Cache policies / legacy cache settings:** include **which headers, cookies, and query strings** participate in the **cache key** (more variants → lower hit ratio).
- **`CreateInvalidation`:** force removal of paths from edge caches (e.g. `/index.html`, `/images/*`, or `/*`) so the **next** request refetches origin **before** TTL expires.

## Origin Shield

Without Shield, **many edges** might each **miss** and **hammer** the origin for the same object.

**Origin Shield** adds a **regional caching layer** between edges and origin (“**cache for your cache**”): first edge miss may fill Shield; **other edges** fetch from **Shield** instead of always hitting S3/ALB — **reduces origin load** and can improve **availability** under load.

## VPC Origins vs Legacy Public Origins

**Preferred (modern):** **VPC origin** — CloudFront reaches **private** ALB / NLB / EC2 inside the VPC.

**Legacy pattern:** Origin had to be **public**; you allowed **CloudFront edge IP ranges** in **security groups** (tedious, error-prone if ranges change or SGs are misconfigured). Still useful to recognize in older architectures.

## Geo Restriction

Restrict viewers by **country** using a **geo-IP** database:

- **Allow list** (only approved countries) or **block list** (banned countries).
- Common use: **copyright** / licensing.

Console availability can depend on **distribution plan** / **billing** mode (course: sometimes requires **pay-as-you-go** for the geo UI).

## Logging, Reports, and Monitoring

### Standard logging (S3)

- Optional logs of **viewer requests** to an **S3 bucket** (often **separate** from the **origin** content bucket); use a **prefix** per distribution.
- Can also stream to **CloudWatch Logs** or **Kinesis Data Firehose** for real-time pipelines.
- Analyze with **Athena** (like other access logs).

### Built-in reports (console)

**Cache statistics**, **popular objects**, **top referrers**, **usage**, **viewers** — these use CloudFront’s **own telemetry**; you **do not** have to enable S3 access logging for them.

### Troubleshooting note

CloudFront may **cache HTTP error responses** (**4xx**, **5xx**) from the origin for a period — a bad **403/404/502** can stick until TTL or **invalidation**.

### Metrics

Examples: request counts, bytes to viewers, **cache hit/miss**, **4xx/5xx**, origin latency — use for **operations** and **tuning**.

## Deep Dive: Cache Key Ingredients

Three levers (each with similar modes: **none**, **whitelist**, **all**):

1. **Headers**  
   - **Forward all** → effectively **no caching** (TTL often **0**).  
   - **Whitelist** → cache varies by those header values.  
   - **Forward none** (except defaults) → **best hit ratio** when the app does not need viewer headers at origin.

2. **Cookies** (really the `Cookie` header’s key/value pairs)  
   - Whitelist only cookies that **must** vary the response (e.g. **A/B** or **language**).

3. **Query strings**  
   - Whitelist only parameters that **must** affect the object (e.g. `size`, `version`).

### Origin custom headers vs cache behavior

- **Origin custom headers:** set on the **origin** in CloudFront; **constant** name/value **added to every origin request** (e.g. shared secret proving traffic came from CloudFront). **Not** used as the cache key.
- **Cache behavior** header whitelist: **forwarded** and part of **caching** decisions.

### Maximize cache hits (exam-style)

- Split **static** assets (S3, few/no cookies/query strings) from **dynamic** API/HTML that needs headers/cookies.
- Prefer **`Cache-Control: max-age`** from origin; tune **min/default/max** TTL on the behavior.
- Invalidate after **deploys** when TTL is long.

## CloudFront + ALB Sticky Sessions

ALB stickiness uses a cookie (e.g. **`AWSALB`**). If CloudFront **does not forward** that cookie to the origin, stickiness **breaks**.

**Fix:** **Whitelist** the **stickiness cookie** in the **cache behavior** so it reaches the ALB. (Course mentions keeping cached TTL **shorter** than auth/session cookie lifetime as a hygiene practice — depth beyond many exam items.)

## AWS Global Accelerator

**Problem:** Users worldwide hit one **Regional** endpoint over the **public internet** → many hops, latency, packet loss risk.

### Unicast vs Anycast

- **Unicast:** one IP → one server.
- **Anycast:** **same IP** advertised from **multiple** locations; routing sends the client to the **nearest** PoP.

### How Global Accelerator works

- Provisions **two static Anycast IPv4 addresses** (global) for your accelerator.
- Client traffic enters the **closest edge**, then rides the **AWS global network** to **endpoints** in one or more Regions (ALB, NLB, EC2, **EIP** — **public or private**).
- **No caching** — packets are **proxied** through to your app.
- **Health checks** + **fast regional failover** (course: **under ~1 minute** to healthy endpoint).
- **DDoS** help via **Shield**; clients only need to allow **two IPs**.

### Global Accelerator vs CloudFront

| | **CloudFront** | **Global Accelerator** |
|---|----------------|------------------------|
| **Primary role** | **HTTP(S) CDN** — cache at edge | **TCP/UDP proxy** — **no** cache |
| **Traffic** | Often served **from edge cache** | Always forwarded to **Regional endpoints** |
| **Great for** | Static assets, many HTTP cache scenarios; some dynamic acceleration | **Non-HTTP** (gaming, **IoT**, **VoIP**), **static IP** ingress worldwide, **predictable failover** |
| **Shared** | Uses AWS **edge** / global network, **Shield** integration | Same broad edge/network story |

### Hands-on recap (course)

Global Accelerator is a **global** console (no Region selector). Configure **listener** (e.g. **TCP 80**), **endpoint groups** per Region, **endpoints** (EC2, ALB, NLB, EIP), **health checks** (e.g. **HTTP** `/`). Same Anycast IP from different geographic vantage points routes to **nearest healthy** Regional endpoint (demo used **VPN** to illustrate US vs EU routing). **Clean up:** disable/delete accelerator, terminate test instances.

## Key Takeaways

- **CDN** on the exam → **CloudFront**; edges **cache** for **latency** and **scale**; **OAC + bucket policy** for **private S3** origins.
- **Origins:** **S3**, **VPC** (private ALB/NLB/EC2), **custom HTTP**; prefer **VPC origins** over **public origin + CloudFront IP allow lists** when possible.
- **Caching:** balance **TTL**, **cache key** (headers/cookies/query strings), and **invalidations**; **Origin Shield** reduces **origin** fan-out.
- **Geo restriction** = country **allow/block** lists (plan/billing may affect console options).
- **Logging** to **S3** (separate bucket) and optional streams; **reports** in console are **independent** of S3 log enablement; **errors can be cached**.
- **ALB stickiness** → **whitelist** the **session cookie** on CloudFront.
- **Global Accelerator** = **Anycast** static IPs, **no cache**, **TCP/UDP**, **health checks** and **fast failover**; contrasts with **CloudFront**’s **edge caching** model.
