---
title: "System Design Interview: Design Ticketmaster w/ a Ex-Meta Staff Engineer"
date: "2026-06-05"
excerpt: "Notes from Hello Interview on designing Ticketmaster — no double booking, two-phase reserve/confirm, Redis TTL locks, Elasticsearch + CDC, virtual waiting queue for surges, and CAP trade-offs per path."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "ticketmaster", "interview", "consistency", "elasticsearch", "redis"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=fhdPyoO6aXI"
---

Notes from Hello Interview (ex-Meta staff engineer) on **designing a Ticketmaster-like ticket booking service** — a top question at Meta (product design and system design interviews).

## Interview roadmap

1. **Requirements** (functional + non-functional)
2. **Core entities** + **APIs**
3. **High-level design** (satisfy functional requirements)
4. **Deep dives** (satisfy non-functional requirements)

Keep requirements under ~5 minutes.

## Functional requirements

- Users can **search** for events
- Users can **view** an event (details, seat map, available tickets)
- Users can **book** tickets

## Non-functional requirements (context-specific)

Don't just list "scalability" and "availability" — explain **what makes this system hard**.

| Concern | Ticketmaster-specific framing |
|---------|-------------------------------|
| **Consistency vs availability (CAP)** | **Strong consistency for booking** — no double booking (one seat, one user). **High availability for search/view** — OK if a new event appears a few seconds late |
| **Read/write ratio** | ~100:1 (many browse, few buy; ~1% conversion) |
| **Scaling** | Not generic scale — **surges from popular events** (Taylor Swift, Super Bowl, World Cup) |
| **Low-latency search** | Full table scan won't work |

Out of scope (note below the line): GDPR, generic fault tolerance details, etc. — check priorities with interviewer.

## Core entities

- **Event** (venue, performer, metadata, relation to tickets)
- **Venue** (location, seat map)
- **Performer**
- **Ticket** (seat, price, status, event FK)

Start with entity names; detail fields as design evolves.

## APIs

### View event

`GET /events/{eventId}` → event, venue, performer, list of tickets (for seat map)

### Search

`GET /search?term=&location=&type=&date=...` → list of **partial** events (enough for results; full detail via view endpoint)

### Book (two-phase — like real Ticketmaster)

1. **Reserve:** `POST /booking/reserve` — body: `ticketId` only; **user from JWT/header**, not body (security)
2. **Confirm:** `PUT/PATCH /booking/confirm` — `ticketId` + payment details → **Stripe** (webhook callback on success)

Reserve holds the seat ~10 minutes while user pays.

## High-level architecture

**Client** → **API Gateway** (auth, rate limiting, routing) → **microservices**:

| Service | Role |
|---------|------|
| **Event CRUD** | View event, load seat map data |
| **Search** | Event discovery |
| **Booking** | Reserve + confirm |

**PostgreSQL** for primary storage — relationships (event → tickets), **ACID transactions** for booking correctness. SQL vs NoSQL is a weak debate in interviews; focus on **required qualities** (transactions, consistency on tickets). Either Postgres or DynamoDB with transactions could work.

**Ticket status:** `available` | `reserved` | `booked` (+ user ID when booked)

**Stripe** for payments (async; webhook confirms success before marking `booked`).

## Reservation expiry — the key design decision

**Problem:** User reserves, abandons payment — seat stuck `reserved` forever.

### Mid-level: timestamp + query or cron

- Add `reserved_timestamp`; query treats `reserved` older than 10 min as available
- Or cron every ~10 min to reset stale reservations

**Downside (senior gap):** cron introduces delay **n** — seat may stay locked up to cron interval past 10 minutes (e.g. 19 minutes total).

### Senior: Redis distributed lock with TTL

- On reserve: **don't** update Postgres status — set `ticketId` in Redis with **TTL = 10 minutes**
- On seat map: query `available` tickets, then **filter out** IDs present in Redis lock
- TTL expires → seat automatically available (no cron lag)
- Separate Redis because **multiple booking service instances** need one consistent lock view

**If Redis fails:** brief window where double-book attempts possible; Postgres ACID still ensures **one winner** on confirm — bad UX for losers, acceptable trade-off to discuss with product.

## Deep dives

### Low-latency search — Elasticsearch + CDC

Initial design: SQL `LIKE` wildcard → full table scan — too slow.

**Elasticsearch** with inverted index for text search; geospatial support for location.

**Don't use ES as primary store** (durability, transactions). Sync from Postgres:

- Dual-write in app code (handle partial failure), or
- **CDC** → stream → update ES (common interview answer; events/venues rarely change — no queue needed)

**Caching popular searches:**

- OpenSearch node query cache
- Redis keyed by search term
- **CDN** cache `GET /search` for ~30–60s (works when same query params; breaks with personalized ranking or high-cardinality params like exact lat/long)

### Real-time seat map + surge handling

**Stale seat map:** user loads page; seats sell out in seconds → clicks show error.

**Options:**

- **Long polling** — cheap, good for short sessions on page
- **SSE (Server-Sent Events)** — server pushes seat updates to client (unidirectional; enough here). WebSockets possible but overkill.

**Popular events:** page loads, seats vanish instantly — bad UX.

**Virtual waiting queue** (Redis sorted set by arrival time, or random for fairness):

- Millions hit at once → enter queue message instead of event page
- Release users in batches as capacity allows (e.g. per seats booked)
- Notify via SSE when admitted → then book

Simple, creative choke point — not always the most complex tech.

### Scaling reads

- API Gateway + services scale horizontally (managed LB)
- **Cache** event/venue/performer in Redis (rarely change) — view API only hits DB for **dynamic tickets**
- Shard Postgres if math shows need (shard key discussion: `eventId` vs `venueId` for geo)

**Math tip:** only do back-of-envelope estimates when results **change the design** — not as a checkbox at the start.

## DDIA connections

Patterns that echo *Designing Data-Intensive Applications*:

- **Derived data** — Elasticsearch index maintained from source of truth (Ch. 11 CDC, data integration)
- **Logs/streams** — CDC as change stream from OLTP DB
- **Consistency** — strong guarantees where business requires it (booking), relaxed where OK (search)
- **Caching** — trade freshness for read latency on hot paths

## Key takeaways

- **No double booking** drives **strong consistency on the booking path**; search/view can favor availability
- **Two-phase booking** (reserve → pay → confirm) is standard; model APIs accordingly
- **Redis TTL lock** beats cron for 10-minute holds — senior differentiator
- **Elasticsearch + CDC** for search; not dual-primary with Postgres
- **Virtual waiting queue** for celebrity-event surges
- **SSE + caching** for seat map freshness and read-heavy traffic
- Specify NFRs **in problem context**, not as generic buzzwords
