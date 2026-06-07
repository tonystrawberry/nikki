---
title: "Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow"
date: "2026-03-29"
excerpt: "CloudOps exam notes on Route 53 routing policies (simple, weighted, latency, failover, geolocation, geoproximity, multi-value, IP-based), health checks and calculated checks, CloudWatch for private targets, and Traffic Flow policies."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "route-53", "dns", "health-check", "failover", "latency-routing", "geolocation", "traffic-flow", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 19
collectionTitle: "AWS CloudOps Engineer - Associate"
---

**Routing policies** in **Route 53** control **which answer** the **DNS service returns** to clients. They do **not** proxy traffic: **DNS only answers queries**; the **client** then opens **HTTP/TCP** connections to the **IPs or hostnames** in the response. This is **not** the same as an **Application Load Balancer** routing to backend targets.

**Prerequisite:** records, **TTL**, and **alias vs CNAME** → **[Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME](/en/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases)**.

## Simple routing

- **Default** policy: usually **one** target (e.g. one **A** record value).
- You **may** put **multiple** **IPv4**/**IPv6** values **in the same** simple record; resolvers can return **several** addresses and the **client** picks one (often described as **random** among answers in training).
- **Alias** + **simple:** only **one** **AWS** target (e.g. one **ALB**).
- **No** **Route 53 health checks** on **simple** routing (in the course model).

## Weighted routing

- **Multiple records** with the **same** **name** and **type**; each has a **weight** (relative integer).
- **Traffic share** for each record ≈ **weight / sum(weights)** over those records — weights **do not** need to sum to **100**.
- **Use cases:** **split** traffic across Regions, **canary** a new version (**small** weight), **gradual** cutover, **drain** a target by setting weight **0** (course: if **all** weights are **0**, behavior can fall back to **equal** treatment — confirm current docs).
- **Optional** **health checks** per weighted record (when health checks are enabled elsewhere in the design).

## Latency-based routing

- Route 53 returns the **one** record whose **AWS Region** (for that record) has **lowest measured latency** from the **DNS resolver** making the query — **not** “shortest path on a map” in the abstract; it is **AWS’s** latency view for **that Region** association.
- For a **bare IP** (e.g. **EC2** public IP), you **must** **set the Region** for the record (Route 53 does **not** infer Region from the IP).
- **Optional** health checks; unhealthy records can be skipped when configured.
- **Testing:** your **browser** location vs **CloudShell** **dig** (resolver in another Region) vs **VPN** exit country will show **different** “closest” Regions — **TTL** cache matters when switching VPN.

## Failover routing

- **Primary** and **secondary** (active/passive style) **records** for the same name.
- **Primary** **must** be associated with a **health check** (mandatory in the training flow).
- If **primary** is **unhealthy**, answers **fail over** to **secondary** (which may optionally have its own health check).
- **Use case:** **DR** or standby endpoint when **primary** fails **health** checks.

## Geolocation routing

- Routes based on the **end user’s geographic location** (**continent**, **country**, **U.S. state** in supported cases) — **not** the same as **latency-based** (which is “closest **AWS Region**” from the resolver’s perspective).
- **More specific** rules win (e.g. **state** over **country** over **continent**).
- You **should** define a **default** geolocation record for **locations that match nothing else** (e.g. “rest of world” → English site).
- **Use cases:** **localization**, **compliance** / **content** restrictions, **directing** users to **region-appropriate** stacks.
- **Optional** health checks.

## Geoproximity routing

- Combines **user** and **resource** **geography** with a **bias** value to **shift** which endpoint “wins” for a given user.
- **Resources** can be **AWS Regions** (selected from a list) or **non-AWS** locations via **latitude/longitude** (e.g. **on-premises**).
- **Positive bias** “expands” preference toward that resource; **negative bias** shrinks it — used to **steer** traffic (e.g. **drain** or **prefer** a Region) without renaming DNS.
- **Route 53 Traffic Flow** (visual editor) is used to configure **geoproximity** with **bias** and **maps** in the console narrative.

## Multi-value answer routing

- **Purpose:** return **answers** for **multiple** **resources** at the **same** DNS name — **client-side** “load spread”: the **resolver** returns **several** **A**/**AAAA** values and the **client** picks **one** (unlike an **ELB**, which **proxies** traffic — **multi-value is not** an **ELB** **substitute**).
- **Up to eight** **healthy** answers per query in the training narrative when **health checks** are attached — **unhealthy** targets are **dropped** from the answer set.
- **Each** multi-value **record** is its **own** row (same **name**/type) with **one** IP and an **optional** **health check** — distinct from **simple** routing where **multiple IPs** sit **in one** record **without** health checks (so a **simple** multi-IP answer **can** include **dead** backends).
- **Lab tip:** **Invert health check status** in the console **temporarily** flips healthy/unhealthy to **simulate** failure without changing **security groups**.

## IP-based routing

- Match the **client’s source IP** (as seen by Route 53 for the query) against **CIDR** blocks you define, and return the **corresponding** endpoint.
- **Use cases:** steer **known** **ISP** / **corporate** **IP ranges**, **cost** or **performance** tuning when **client** networks are **predictable**.

## Route 53 health checks

### What they are for

**Health checks** let Route 53 **stop** returning **unhealthy** targets in **weighted**, **latency**, **failover**, **geolocation**, **geoproximity**, and **multi-value** scenarios (where supported).

### Endpoint health checks (public)

- **Targets** must be **reachable from the public internet** (e.g. **ALB**, **EC2** **public IP**, hostname resolving to public endpoints).
- **Many** global **health checker** nodes (course cites on the order of **~15**) probe the endpoint.
- **Protocols:** **HTTP**, **HTTPS**, **TCP** (and related options in console).
- **Healthy** if enough checkers report success — course cites **> 18%** of checkers reporting **healthy** as the threshold for “endpoint healthy” (confirm **documentation** for exact rules).
- **Interval:** **standard** (e.g. **30** seconds) vs **fast** (**10** seconds, **higher cost**).
- **Success:** typically **2xx** or **3xx** for HTTP(S); optional **string match** in the **first 5,120 bytes** of the response body.
- **Security groups / NACLs / firewalls:** you **must** allow **inbound** traffic from **Route 53 health checker IP ranges** (published by AWS) to the **port** and **path** under test.

### Calculated health checks

- **Parent** health check aggregates **child** health checks with **logical** rules (**AND** / **OR** / **NOT**), e.g. “healthy if **at least N** of **M** children pass.”
- Course mentions up to **256** child checks — confirm **quotas**.

### Private or unreachable endpoints

- Public checkers **cannot** hit **RFC1918** **VPC-only** endpoints **directly**.
- **Pattern:** emit metrics from the **private** resource (e.g. **CloudWatch** **agent**, **custom metric**), attach a **CloudWatch alarm**, and create a health check that **tracks the alarm state** — **alarm = unhealthy** flips DNS away from that path.

### Observability

- Health checks expose **CloudWatch** **metrics** (and optional **alarms** / **SNS** on failure in the console).

## Traffic Flow (policies)

- **Visual** **editor** for **complex** trees: **weighted**, **failover**, **latency**, **geolocation**, **multi-value**, **geoproximity**, nested rules, endpoints.
- Policies are **versioned** and can be **applied** to **hosted zones** as **policy records**.
- **Pricing:** training calls out **significant** monthly cost for **Traffic Flow policy records** (e.g. **~$50/month** per policy record in the demo — **verify** current **[Route 53 pricing](https://aws.amazon.com/route53/pricing/)**); delete test policies to avoid charges.
- Records created from Traffic Flow often **link** back to the **policy** for edits rather than being plain static rows only.

## Key Takeaways

- **“Routing policy”** = **DNS answer selection** — **no** traffic passes **through** Route 53 like a proxy.
- **Simple:** one target (or multi-IP **random** client choice); **alias** simple = **one** AWS target; **no** health checks in the basic story.
- **Weighted:** **relative** weights → **proportional** traffic; **weight 0** to **drain**; optional health checks.
- **Latency:** **lowest latency** to the **stated AWS Region** per record; **set Region** for raw **IPs**; test with **VPN**/**resolver** location.
- **Failover:** **primary** + **secondary**; **primary** **requires** a **health check** in the lab narrative.
- **Geolocation:** match **user** **location** (country/continent/…); add **default**; not the same as **latency**.
- **Geoproximity:** **bias** shifts **preference** between **Regions** or **lat/long** endpoints; **Traffic Flow** for **advanced** setup.
- **Multi-value:** up to **~8** **healthy** **IPs** per answer; **client** picks; **not** an **ELB**; beats **simple** multi-IP on **health** awareness.
- **IP-based:** route by **client** **CIDR**.
- **Health checks:** **public** endpoints + **SG** allowlist for **checker** IPs; **calculated** for **boolean** combos; **CloudWatch alarm** health checks for **private** workloads.

---
*Previous: [Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME](/en/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases). Next: [Amazon Route 53: Registrar Delegation, Resolver, Logging, and Governance](/en/posts/aws-route-53-delegation-resolver-logging-firewall-arc-profiles).*
