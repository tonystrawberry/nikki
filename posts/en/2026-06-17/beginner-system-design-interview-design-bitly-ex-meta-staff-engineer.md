---
title: "Beginner System Design Interview: Design Bitly w/ a Ex-Meta Staff Engineer"
date: "2026-06-17"
excerpt: "Hello Interview's beginner walkthrough of designing Bitly — requirements, core entities, API, counter vs hash short-code generation, base62, 301 vs 302 redirects, read/write split, Redis cache, and CAP."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "bitly", "url-shortener", "interview", "distributed-systems", "redis", "caching"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=iUU4O1sWtJA"
---

Notes from Hello Interview (Evan, ex-Meta staff engineer) on **designing a URL shortener like Bitly** — positioned as the classic **beginner** system design question, with concepts explained more slowly than in their advanced videos.

## Interview roadmap

1. **Requirements** (functional + non-functional)
2. **Core entities**
3. **API**
4. **High-level design** (satisfy functional requirements)
5. **Deep dives** (satisfy non-functional requirements)

Skip **data flow** for user-facing product designs (save that for infra questions like rate limiters or message queues).

Back-of-envelope math upfront is optional — only estimate when numbers **change the design**.

## What the system does

A URL shortener converts long URLs into short ones; visiting the short URL **redirects** to the original.

## Functional requirements

- Users can **create a short URL** from a long URL
- Users can be **redirected** to the original URL from the short URL

Common optional extensions in interviews:

- **Custom alias** — user provides their own short code (e.g. `bit.ly/Evan`) if not taken
- **Expiration time** — short URL valid only for a period (e.g. conference link for one week)

## Non-functional requirements

Typical scale Evan gives candidates:

- **100 million DAU**
- **~1 billion URLs** shortened over all time

Other NFRs to call out in context:

| Concern | URL shortener framing |
|---------|----------------------|
| **Low-latency redirects** | Redirect path must be fast — users feel latency immediately |
| **Unique short codes** | Collisions redirect users to wrong sites — must guarantee uniqueness |
| **Scalability** | Support 100M DAU and 1B stored mappings |
| **CAP** | Favor **availability + partition tolerance** over strong consistency (see below) |

## Core entities

- **User** — owns short URLs (email, password hash, etc. are auxiliary; don't over-detail in interviews)
- **URL mapping** — short code ↔ long URL (the core table)

## API

- `POST /urls` — body: long URL (+ optional custom alias, optional expiration) → returns short URL
- `GET /{shortCode}` — redirect to long URL (302 in the high-level design)

## High-level design (v1)

```
Client → Load balancer → URL Service → Database (URL mappings)
```

- **Create:** insert `(shortCode, longUrl)` → return short URL
- **Redirect:** lookup `shortCode` → return **302 redirect** to long URL

### 301 vs 302 redirects

| Code | Behavior | When to use |
|------|----------|-------------|
| **302** | Temporary — browser always hits your server | Default when you don't need analytics, or want every redirect logged |
| **301** | Permanent — browsers/CDNs may cache; may skip your server | When redirects are truly permanent and you don't need per-click logging |

For Bitly **without analytics**, 302 is fine. With analytics, 302 ensures redirects always reach your server so you can count clicks.

## Deep dive: generating short codes

Bad approaches:

1. **Prefix of long URL** — many URLs share prefixes (`twitter.com/...`) → one-to-many mapping, collisions
2. **Hash long URL only** — deterministic, so same long URL always gets same short code (OK for dedup), but hash collisions need handling; append salt/rehash on collision

Good approaches:

### Counter + base62 (recommended in video)

- Maintain an **auto-incrementing counter** per new URL
- **Base62 encode** the counter (0–9, A–Z, a–z) for compact strings
- **6 characters** → 62⁶ ≈ **56 billion** combinations
- **No collisions** — sequential IDs are unique by construction

### Random number + base62

- Pick random integer in [0, 56B), base62 encode
- **Birthday paradox:** collision probability rises faster than intuition — with ~1B URLs, collisions become a real concern
- Must **check DB and retry** on collision

### Hash long URL + base62 slice

- Hash (MD5, Murmur, SHA-256) → base62 → take first 6 chars
- Deterministic dedup for same long URL
- On collision, append salt and rehash

## Deep dive: CAP and consistency

URL shortener does **not** need strong **read-after-write** consistency (unlike banking or ticket booking).

If a user creates a short URL and shares it instantly, **eventual consistency** is acceptable — a brief "try again in a minute" error is tolerable. Favor **AP** over **CP**.

## Deep dive: scaling reads (redirect-heavy)

Redirects dominate traffic — **read-heavy** workload.

### Read/write service split

- **Write service** — creates short URLs
- **Read service** — handles redirects
- **API Gateway** routes `POST /urls` → write service, `GET /{shortCode}` → read service

Scale each tier horizontally (auto-scaling groups behind load balancer).

### Redis cache (read-through LRU)

- On redirect: check **Redis** for `shortCode → longUrl`
- **Cache miss:** read DB, populate cache, return
- **Read-through + LRU** eviction for hot short URLs

Primary key lookup on Postgres (B-tree) is already fast, but cache removes DB load at scale.

Peak redirect QPS (rough): 100M DAU × a few redirects/day → ~1K req/s average, **10–100K req/s** at peak with burst multiplier.

## Key Takeaways

- Bitly is the **classic entry-level** system design question — requirements → entities → API → design → deep dives
- **Counter + base62** is the cleanest collision-free short-code strategy; random needs birthday-paradox math
- **Never use URL prefix** as short code — shared prefixes break one-to-one mapping
- **302 vs 301** depends on whether you need server-side redirect logging (analytics)
- **Read/write split + Redis read-through cache** for redirect-heavy scaling
- **Eventual consistency is OK** — not every system needs strong read-after-write
- Only run back-of-envelope estimates when they **change architectural decisions**
