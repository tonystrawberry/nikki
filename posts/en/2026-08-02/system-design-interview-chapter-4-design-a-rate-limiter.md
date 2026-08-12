---
title: "System Design Interview Chapter 4: Design a Rate Limiter"
date: "2026-08-02"
excerpt: "Notes from Alex Xu — why rate limit, algorithms (token bucket, leaking bucket, fixed/sliding window), Redis-backed distributed limiters, and HTTP headers."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "interview", "rate-limiting", "redis", "token-bucket"]
coverImage: ""
youtubeUrl: ""
collection: "system-design-interview"
collectionOrder: 4
collectionTitle: "System Design Interview"
---

Notes from *System Design Interview*, Chapter 4 — design a **rate limiter**: control how many requests a client can send in a time window.

## Why rate limit?

- Protect APIs from abuse and accidental floods
- Enforce business tiers (free vs paid QPS)
- Reduce cost (downstream DB / third-party APIs)
- Improve fairness across tenants

Typical response when over limit: `429 Too Many Requests` (+ optional `Retry-After`).

## Requirements to clarify

- Who is limited? IP, user ID, API key, endpoint?
- Limits: e.g. 1000 req/min soft, 10k/day hard?
- Distributed across many API servers?
- Approximate OK, or must be exact?
- Where does it sit: gateway, middleware, service mesh?

## High-level placement

```mermaid
flowchart LR
  Client([Client]) --> RL[Rate limiter]
  RL -->|allowed| API[API servers]
  RL -->|429| Client
  API --> Back[(Downstream)]
```

Often at the **API gateway** so every service does not reinvent it. Rules can be config-driven (per route, per tenant).

## Algorithms

### Token bucket

- Bucket holds up to `capacity` tokens
- Refills at `rate` tokens/sec
- Each request costs 1 token; reject if empty

```mermaid
flowchart TB
  Refill["Refill rate\n(tokens / sec)"] --> Bucket["Token bucket\n(capacity)"]
  Req([Request]) --> Check{Tokens > 0?}
  Bucket --> Check
  Check -->|yes: take 1| Allow[Allow]
  Check -->|no| Deny[429 Deny]
```

**Pros:** allows short bursts; simple mental model  
**Cons:** burstiness may still hurt backends if capacity is large

Widely used in practice (including cloud API gateways).

### Leaking bucket

- Requests enter a queue; processed at fixed rate
- Smooths traffic to a constant outflow

```mermaid
flowchart LR
  In([Bursty requests]) --> Q[Queue / bucket]
  Q -->|constant rate| Out[Steady outflow]
```

**Pros:** predictable egress rate  
**Cons:** bursty clients wait or drop; queue size is a tuning knob

### Fixed window counter

- Count requests in window `[0:00–1:00)`, reset at boundary
- Cheap (one counter per key per window)

**Problem:** boundary spike — 100 at `0:59` + 100 at `1:01` ≈ 200 in two seconds with a “100/min” limit.

```mermaid
flowchart LR
  subgraph W1["Window N — limit 100"]
    A["100 req at 0:59"]
  end
  subgraph W2["Window N+1 — limit 100"]
    B["100 req at 1:01"]
  end
  A --- B
  B --> Spike["≈ 200 req in ~2s across boundary"]
```

### Sliding window log

- Store timestamp of each request
- On new request, drop timestamps outside the window, count the rest

**Pros:** accurate  
**Cons:** memory heavy at high QPS

### Sliding window counter

- Hybrid: weighted count of previous window + current window
- Softens fixed-window boundary spikes with less memory than a full log

Good interview default when you want accuracy without unbounded timestamp lists.

## Distributed rate limiting

Many API servers → local in-memory counters **diverge**. Centralize counters:

```mermaid
flowchart TB
  C1[API server 1] --> Redis[(Redis\natomic counters)]
  C2[API server 2] --> Redis
  C3[API server 3] --> Redis
  Redis -->|allow / deny| C1
  Redis -->|allow / deny| C2
  Redis -->|allow / deny| C3
```

Trade-offs:

| Approach | Notes |
|----------|--------|
| Redis central store | Simple; Redis becomes critical path |
| Sticky sessions + local | Fragile; avoid |
| Approximate / eventual | Higher throughput, occasional overshoot |

Use atomic ops or Lua so check-and-decrement is race-safe.

## HTTP headers (nice interview detail)

```text
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1700000000
```

Plus `Retry-After` on 429. Clients can back off intelligently.

## Soft vs hard limits, multi-layer

Real systems often combine:

- Edge / WAF limits (IP floods)
- Gateway per-API-key limits
- Per-service limits for expensive endpoints

## Deep-dive talking points

- Race conditions without atomic Redis ops
- Hot keys (one celebrity API key) → shard keys or local + sync
- Rules stored in config service, hot-reloaded
- Monitoring: reject rate, latency of limiter itself
- Fail-open vs fail-closed if Redis is down (product decision)

## Interview takeaway

Name the **algorithm**, place the limiter at the **edge**, store counters in a **shared atomic store** for multi-node correctness, and return **429 + headers**. Then discuss burstiness vs accuracy vs cost — that is the real design.
