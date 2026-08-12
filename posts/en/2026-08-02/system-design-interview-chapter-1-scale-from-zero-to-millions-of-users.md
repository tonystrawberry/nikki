---
title: "System Design Interview Chapter 1: Scale From Zero to Millions of Users"
date: "2026-08-02"
excerpt: "Notes from Alex Xu — how a single-server app evolves into a multi-datacenter architecture with load balancers, caches, CDN, shards, and async workers."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "interview", "scalability", "caching", "cdn", "sharding"]
coverImage: ""
youtubeUrl: ""
collection: "system-design-interview"
collectionOrder: 1
collectionTitle: "System Design Interview"
---

Notes from *System Design Interview – An Insider’s Guide* (Alex Xu), Chapter 1. The chapter is a tour of **vertical → horizontal scaling**: start with one box, then add the pieces you need as traffic grows.

## Start simple: one server

Everything on one machine — web, app, database, static files.

```mermaid
flowchart LR
  User([User]) --> Box["Single server\nWeb + App + DB + files"]
```

Fine for a prototype. Breaks when:

- CPU / memory / disk max out
- One process crash takes the whole product down
- You cannot deploy without downtime

## Separate web tier and data tier

First real split:

- **Web/app servers** — stateless request handling
- **Database** — durable state

Why it matters: you can scale and fail each tier independently. The app talks to the DB over the network; the DB is no longer “just another folder on the same box.”

```mermaid
flowchart LR
  User([User]) --> Web[Web / App]
  Web --> DB[(Database)]
```

## Vertical vs horizontal scaling

| Approach | Idea | Limit |
|----------|------|--------|
| **Vertical** (scale up) | Bigger CPU/RAM/disk on one machine | Hardware ceiling, single point of failure, expensive |
| **Horizontal** (scale out) | More machines | Needs load balancing, shared-nothing design, operational complexity |

Interview default at internet scale: **scale out**, keep servers **stateless**.

## Load balancer

Put a load balancer in front of multiple web servers.

- Clients hit a single VIP / hostname
- LB spreads traffic (round-robin, least connections, etc.)
- One web server dies → LB stops sending it traffic

Web tier should store **no session on disk of a specific machine**. Sessions go to a shared store (Redis, DB) so any server can handle any request.

```mermaid
flowchart TB
  Users([Users]) --> LB[Load balancer]
  LB --> W1[Web 1]
  LB --> W2[Web 2]
  LB --> W3[Web 3]
  W1 --> Session[(Shared session / Redis)]
  W2 --> Session
  W3 --> Session
  W1 --> DB[(Database)]
  W2 --> DB
  W3 --> DB
```

## Database replication

Typical pattern: **one primary (writes) + read replicas**.

- Writes → primary
- Reads → replicas
- Replication lag is real — design for it (read-your-writes when needed)

```mermaid
flowchart LR
  App[App servers] -->|writes| Primary[(Primary)]
  App -->|reads| R1[(Replica)]
  App -->|reads| R2[(Replica)]
  Primary -.->|replicate| R1
  Primary -.->|replicate| R2
```

Failing over the primary is an ops problem; mention it in interviews even if you do not design the full HA story.

## Cache

Database is expensive for hot reads. Add a cache (Redis/Memcached) in front of slow queries or computed results.

Practical rules:

- Cache **hot** data with a clear TTL / invalidation story
- Watch for **cache stampede** and **thundering herd**
- Prefer cache-aside unless you have a reason for write-through

```mermaid
flowchart LR
  App[App] -->|1. lookup| Cache[(Cache)]
  Cache -->|miss| DB[(Database)]
  DB -->|2. load + fill| Cache
  Cache -->|3. hit / filled| App
```

## CDN for static content

Images, JS, CSS, videos → CDN edge nodes close to users.

- Lower latency
- Less load on origin
- Cache invalidation / versioned URLs when assets change

```mermaid
flowchart LR
  User([User]) --> Edge[CDN edge]
  Edge -->|cache miss| Origin[Origin / object store]
  Edge -->|cached asset| User
```

## Stateless web tier (again, louder)

If a request requires sticky sessions tied to one machine, you cannot freely autoscale or replace nodes. Push session/state to Redis or the DB. Treat web servers as cattle.

## Multi-datacenter / geographic distribution

At larger scale:

- Users in different regions → geo-DNS or global LB
- Data residency and replication across DCs
- Higher complexity for consistency and failover

Mention when the prompt implies worldwide traffic.

## Message queues and async work

Not every request should do heavy work inline.

- API accepts work → enqueue → workers process
- Decouples spikes from processing capacity
- Retries, DLQs, and idempotency become part of the design

Examples: image processing, emails, feed fan-out, billing jobs.

```mermaid
flowchart LR
  API[API] -->|enqueue| Q[(Message queue)]
  Q --> W1[Worker]
  Q --> W2[Worker]
  W1 --> Store[(DB / storage)]
  W2 --> Store
```

## Logging, metrics, automation

Scaling without observability is flying blind:

- Centralized logs
- Metrics + alerts (latency, error rate, saturation)
- Automation for deploys, scaling, failover drills

## The evolution path (cheat sheet)

```mermaid
flowchart TD
  A[Single server] --> B[Separate web + DB]
  B --> C[LB + stateless web tier]
  C --> D[Primary + read replicas]
  D --> E[Cache]
  E --> F[CDN for static]
  F --> G[Shard / partition data]
  G --> H[Queues + workers]
  H --> I[Multi-region]
```

## Interview takeaway

Chapter 1 is not one design — it is a **menu of scaling levers**. In a real interview you pick the next lever when a bottleneck appears (CPU, DB reads, static latency, write throughput, async fan-out), and you say *why* that lever fits the bottleneck.
