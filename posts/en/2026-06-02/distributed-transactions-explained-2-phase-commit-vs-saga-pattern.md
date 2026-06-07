---
title: "Distributed Transactions Explained: 2 Phase Commit vs Saga Pattern"
date: "2026-06-02"
excerpt: "Notes from Hello Interview on distributed transactions — when single-DB ACID breaks across services, why 2PC blocks at scale, and how Saga (choreography vs orchestration) with compensations and transactional outbox works in production."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "distributed-systems", "saga", "two-phase-commit", "microservices", "interview"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=DOFflggE_0Q"
---

Notes from Hello Interview on **distributed transactions** — what changes when one database becomes many, why two-phase commit (2PC) rarely works across services, and why the industry uses **Saga** instead.

## When transactions were easy

Early on, a single database handles everything. Place an order: charge card, reserve inventory, record ledger entry — all in one transaction. If any step fails, the DB rolls back automatically.

**ACID guarantees that matter here:**

- **Atomicity** — all three writes succeed together, or none do
- **Isolation** — no other query sees half-finished state while the transaction runs

## What changes when you scale out

Traffic and data grow. You shard the database or split into microservices — each service owns its own DB on its own machine.

The payment flow that was one transaction is now **three separate operations on three separate databases**:

1. Charge card (payment DB)
2. Reserve inventory (inventory DB)
3. Record ledger entry (accounting DB)

You can't wrap a transaction across independent databases. If the card charge commits but inventory reservation fails (out of stock), there's no DB-level rollback — the charge is already committed elsewhere.

This is a **distributed transaction**: one logical operation spanning multiple independent databases/services where all steps must succeed together or be cleaned up.

## Two-phase commit (2PC)

Classic academic solution. Introduce a **coordinator** that ensures all participants agree before anything becomes permanent.

### Phase 1 — Prepare

Coordinator asks every participant: "Can you commit?" Each DB does the work, durably records changes, locks affected rows, and votes yes or no.

- Any **no** → coordinator tells everyone to abort and release locks
- All **yes** → move to phase 2

### Phase 2 — Commit

Coordinator sends commit to everyone. Participants make changes permanent and release locks.

**Benefit:** strong consistency — same guarantee as a single DB. No partial state visible.

### Why 2PC fails in production

2PC is a **blocking protocol** — dangerous in distributed systems because you depend on multiple machines staying healthy simultaneously.

**Coordinator crash scenario:** coordinator collects all yes votes, then crashes before sending commit. Participants sit with locks held, unable to commit or abort. Every transaction touching those rows is blocked.

Other problems:

- **Slowest participant wins** — one slow service holds locks for everyone
- **Network partitions** — coordinator can't tell if a message got through; no safe default

**Industry reality:** almost nobody uses 2PC across independent services. Pat Helland's ["Life Beyond Distributed Transactions"](https://www.youtube.com/watch?v=DOFflggE_0Q) argues distributed transactions across autonomous services don't work at internet scale.

2PC exists in production **inside** distributed databases (Google Spanner, YugabyteDB) where coordinator and participants are tightly coupled — the DB handles complexity internally. Across services with different deployment schedules and failure modes, it falls apart.

## Saga pattern

What Uber, Netflix, Amazon, and DoorDash use in production.

**Different assumption:** you don't need all-or-nothing atomicity across services. You need to **eventually** reach a consistent state when things go wrong.

Instead of one big distributed transaction with cross-service locks:

- Break work into a **chain of independent local transactions**
- Each service commits to its own DB on its own terms
- When a later step fails, run **compensating actions** (business-level undos): refund instead of rollback, cancellation instead of abort

**Trade-off:** **eventual consistency** instead of strong consistency. The system may be temporarily inconsistent while compensations run (customer briefly sees a charge before refund). But nothing is blocked — other transactions keep flowing.

## Choreography vs orchestration

### Choreography (decentralized)

Publish/subscribe: each service broadcasts an event when done; interested services react.

- Card service charges → publishes `CardCharged`
- Inventory service listens → reserves stock → publishes `InventoryReserved`
- Ledger service records entry
- On failure, failing service publishes failure event; upstream services run compensations

Works for **2–3 step** simple flows. At 5–6 services, tracing state becomes painful — digging through logs across a dozen services to answer "where did it fail? did the refund go through?"

### Orchestration (centralized)

Dedicated **orchestrator** controls the flow step by step: charge card → wait → reserve stock → wait. On failure, orchestrator knows exactly what failed and runs compensations in the right order.

Tools: **Temporal** (from Uber Cadence engineer), **AWS Step Functions**.

**Key difference from 2PC coordinator:** orchestrator is **durable**. On crash, it reads state from its DB and resumes — no dangling locks, no blocked transactions during recovery.

Most teams at serious scale use orchestration.

## Compensating actions — the hard part

"Just undo the previous step" sounds clean but gets messy:

- Refund is **visible** to the customer (charge notification, then refund notification) — correct but not invisible like a DB rollback
- Some actions can't be undone: sent email, fired webhook to third party
- Each saga step needs a well-defined compensation; some are inherently imperfect
- Compensations can **fail too** — refund API down → need retry logic
- Retried refunds must be **idempotent** (run once or ten times, same result)

## Dual write problem and transactional outbox

After charging the card, the service must:

1. Save result to its DB
2. Publish an event so the next step proceeds

These are two separate writes to two systems:

- DB succeeds, publish fails → saga stalls
- Publish succeeds, DB fails → downstream reacts to something that didn't happen

**Fix: transactional outbox**

- Write data **and** outgoing event to the same DB in one local transaction (event goes in an `outbox` table)
- Either both commit or neither do
- Background process (CDC tailing transaction logs, or polling outbox table) publishes events to the message broker

## Decision framework

### First: do you need a distributed transaction at all?

If data that transacts together can live in the **same database**, do that. Move inventory and ledger tables into the payments DB if they always update together. Local ACID is simpler, faster, and more reliable than any distributed alternative.

### If you genuinely can't avoid distributing

Use a **Saga** — industry default, not really debated.

| Situation | Choice |
|-----------|--------|
| 3–4 steps, independent services, no need for centralized visibility | **Choreography** (e.g. order-placed → email notification) |
| Complex flows, branching, need to see where transactions are stuck, tricky compensation logic | **Orchestration** (Temporal, Step Functions) |
| Eventual consistency truly unacceptable | Consider single distributed DB (Spanner, YugabyteDB) with internal strong consistency — not DIY 2PC across services |

## Production pattern at scale

**Saga with orchestration** + **idempotent operations at every step** + **transactional outbox** for reliable events.

Accept eventual consistency deliberately — that's the trade-off Uber, Netflix, and Amazon run in production today.

## Key takeaways

- Single-DB ACID breaks when services own separate databases — partial failures become routine, not edge cases
- 2PC gives strong consistency but **blocks** on coordinator crashes, slow participants, and partitions — avoid across independent services
- Saga uses local commits + **compensating actions** for eventual consistency without blocking
- **Choreography** for simple flows; **orchestration** for complex ones (Temporal, Step Functions)
- Design compensations carefully — they're visible, imperfect, and need idempotent retries
- Use **transactional outbox** to avoid the dual-write problem
- Best answer when possible: **don't distribute the transaction** — colocate data in one DB
