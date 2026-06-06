---
title: "DDIA Chapter 12: The Future of Data Systems"
date: "2026-06-04"
excerpt: "Notes on the final DDIA chapter — integrating batch and stream processing, unbundling databases, end-to-end correctness, and the ethics of data-intensive systems. Reading in progress."
author: "Tony Duong"
category: "note"
tags: ["distributed-systems", "ddia", "data-integration", "ethics"]
collection: "ddia"
collectionOrder: 12
collectionTitle: "Designing Data-Intensive Applications"
---

*Reading in progress — started 2026-06-04, to be resumed.*

Chapter 12 of *Designing Data-Intensive Applications* is the closing chapter. After ten chapters on foundations and two on batch and stream processing, it steps back and asks: **how do all these pieces fit together, and where is data-intensive systems heading?**

## Data integration: combining specialized tools

Modern systems rarely use one database for everything. Teams combine OLTP databases, search indexes, caches, data warehouses, stream processors, and ML pipelines — each optimized for a job.

The hard problem is **keeping derived datasets consistent** when the source of truth changes. Patterns from earlier chapters reappear:

- **Change Data Capture (CDC)** from Ch. 11
- **Event sourcing** and immutable logs
- **Batch pipelines** for backfill and analytics
- **Stream processing** for near-real-time updates

The chapter argues for thinking in terms of **dataflows** — how data moves and transforms across systems — rather than isolated components.

## Unbundling the database

Traditional databases bundle storage, indexing, query language, replication, and transaction processing into one product.

The trend is **unbundling**: use the right specialized store for each access pattern (documents, graphs, time series, search) and connect them with streams and batch jobs.

Trade-offs:

- More flexibility and better performance per use case
- More operational complexity — you own the integration layer
- Need strong conventions for schemas, lineage, and correctness

## Batch and stream processing: two sides of one coin

Ch. 10 (batch) and Ch. 11 (stream) looked different. Ch. 12 unifies them:

- Both process **derived data** from an immutable log or dataset
- **Stream** = low latency, continuous; **batch** = high throughput, replay from history
- Modern engines (Flink, Spark Structured Streaming, Kafka) blur the boundary — same log, different consumption modes

**Kappa** vs **Lambda** revisited: the goal is one logical pipeline where possible, not two divergent codebases.

## Designing for correctness

Distributed systems make **correctness** subtle. Key ideas:

### End-to-end integrity

Individual components may be correct, but the **system as a whole** can still lose or duplicate data. Fixes require thinking across the entire pipeline:

- **Idempotent writes** (Ch. 11, message queues)
- **Exactly-once semantics** where achievable (often via idempotency + deduplication, not magic)
- **Transactional outbox** and **CDC** for reliable propagation

### Constraints and coordination

When you need stronger guarantees (uniqueness, foreign keys across services), you need **coordination** — locks, leases, or consensus (ties back to Ch. 9 consistency and consensus).

The chapter warns: coordination has a **cost** (latency, availability). Use it only where the business truly requires it.

### Timeliness and integrity

**Integrity** = no corruption, no lost data. **Timeliness** = data is fresh enough for the use case.

They are independent — you can have correct but stale data, or fresh but wrong data. Design explicitly for both.

## Derived data and application design

Applications should treat their database as a **cache of derived state** from an event log or upstream source of truth — not always as the ultimate authority.

This mindset helps when:

- Rebuilding indexes after bugs
- Adding new read models (CQRS-style)
- Migrating storage systems

## Load and coordination of dataflow

Complex pipelines need **scheduling**, **backpressure**, and **monitoring** across stages. A failure in step 7 of 10 should not silently corrupt downstream consumers.

Operational concerns: schema evolution across pipeline stages, replay after fixes, and testing derived outputs against source events.

## Ethics and the future

The final sections turn to **human consequences**:

- **Predictive analytics** and behavioral data — feedback loops that shape user behavior
- **Privacy** — consent, data minimization, right to deletion vs immutable logs
- **Algorithmic accountability** — who is responsible when automated systems harm users?
- **Data as a competitive moat** — concentration of data power among few platforms

Kleppmann closes with a reminder: engineers build systems that affect real people. Technical excellence without ethical reflection is incomplete.

## Key takeaways (draft — reading in progress)

- **Data integration** is the central challenge of modern architectures — not picking one database
- **Unbundle** storage/query/indexing; **integrate** with logs, CDC, batch, and stream
- Batch and stream are **complementary modes** over the same immutable data
- **End-to-end correctness** requires idempotency, reliable delivery, and pipeline-wide thinking
- **Integrity** and **timeliness** are separate dimensions — design for both explicitly
- The **future** includes more specialized tools *and* more responsibility for how data is used

---

*To be updated after finishing the chapter.*
