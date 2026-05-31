---
title: "Message Queues in System Design Interviews w/ Meta Staff Engineer"
date: "2026-05-31"
excerpt: "Notes from Hello Interview on message queues for system design interviews — motivating example, acks, delivery guarantees, scaling, back pressure, ordering, poison messages, DLQs, and Kafka vs SQS vs RabbitMQ."
author: "Tony Duong"
category: "note"
tags: ["system-design", "message-queue", "kafka", "sqs", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=1ISRd0bS714"
---

Notes from Evan (former Meta staff engineer, Hello Interview) on **message queues in system design interviews** — when to use them, how they work under the hood, and the deep-dive topics interviewers probe once you draw one on the whiteboard.

## Motivating example: photo upload app

Imagine Instagram-style uploads that need resizing, filters, and content moderation — each step takes seconds.

**Synchronous architecture problems:**

- **Latency** — user waits 6+ seconds staring at a spinner
- **Fragility** — if the filter service crashes mid-processing, the whole upload fails and prior work is lost
- **Bursty traffic** — a spike from 50 to 5,000 uploads/sec overwhelms servers capped at ~200/sec; requests time out or fail

**Queue-based fix:** server saves the file, writes a message ("photo 456 needs processing") to a queue, and immediately responds to the client. A pool of worker consumers pulls messages and processes in parallel.

- Uploads become fast (save + enqueue only)
- Failures are isolated (message redelivered to another worker)
- Traffic spikes deepen the queue instead of dropping work — at worst, processing is delayed

## What is a message queue?

A **buffer between producer and consumer**:

- **Producer** creates work (upload server)
- **Consumer** does work (worker pool)
- Producer sends a message and moves on; consumer pulls at its own pace

**Key property: decoupling** — producer and consumer don't know about each other. Scale each side independently.

**Kitchen analogy:** waiter puts order on ticket rail, cook grabs when ready. The rail decouples front-of-house from back-of-house.

## How queues work under the hood

### Acknowledgements (acks)

When a consumer pulls a message, the queue doesn't delete it immediately. The consumer must send an **ack** when done. If the worker crashes before acking, the message is redelivered — nothing is lost.

### Preventing duplicate processing

While a worker processes (before ack), the message is still "in the queue." Different systems handle visibility differently:

- **SQS:** message becomes **invisible** to other consumers for a configurable window (e.g. 30s)
- **Kafka:** assigns each partition to exactly one consumer in a group
- **RabbitMQ:** channel-level prefetch limits and ack timeouts

### Delivery guarantees

| Guarantee | Meaning | When to use |
|-----------|---------|-------------|
| **At least once** (most common) | Every message delivered ≥1 time; duplicates possible | Default answer in interviews — make consumers **idempotent** |
| **At most once** | Fire-and-forget; message deleted on pickup | Analytics/metrics where losing a few events is OK |
| **Exactly once** | Processed exactly one time | Hard in distributed systems; don't promise unless you can defend the mechanism |

**Idempotency example:** "set user 123's profile photo to photo 5" is safe to run twice. "increment post count by 1" is not — prefer "set post count to 54" instead.

## When to use a queue (four signals)

1. **Async work** — user doesn't need the result immediately (email, reports, uploads)
2. **Bursty traffic** — absorb spikes without dropping requests
3. **Decoupling** — producer and consumer have different scaling/hardware needs (lightweight upload servers vs GPU-heavy workers)
4. **Reliability** — downstream temporarily down; queue holds messages until recovery

**Pitfall:** don't add a queue to a **synchronous** workload with strict latency SLAs (e.g. sub-500ms). Queues add complexity and break latency constraints.

## Deep dives interviewers love

### Scaling via partitioning

A single queue has throughput limits. **Partition** into independent sub-queues so different workers process in parallel.

**Partition key trade-off:** key by `user_id` for ordering per user, but a celebrity's partition becomes hot. Key by `ride_id` for even distribution but lose per-user ordering. Choosing the partition key is a deliberate design decision.

### Back pressure

If producers outpace consumers, the queue grows indefinitely — a queue **delays** capacity problems, it doesn't solve them. At 300 msg/s in and 200 msg/s out, you're falling behind by 100/s forever.

**Responses:**

- Autoscale consumers based on queue depth
- Apply **back pressure** — reject or slow producers ("try again in a minute")
- Monitor and alert on queue depth

### Poison messages and dead letter queues (DLQ)

A corrupted image that always fails processing becomes a **poison message** — retrying forever blocks the consumer.

**Fix:** configure max retry count (e.g. 5). After exhausting retries, move to a **dead letter queue (DLQ)** for inspection. Main queue keeps moving. Mentioning DLQs proactively signals seniority.

### Durability and fault tolerance

Modern queues (especially **Kafka**) persist messages to disk and replicate across brokers. If one broker goes down, replicas hold the data — same concept as database read replicas.

Kafka retains messages for a configurable window (day, week, forever), enabling **replay** — reprocess from an hour ago if consumers were broken or offline.

## Common technologies

| System | Best for |
|--------|----------|
| **Kafka** | High throughput, durability, partitions, replay, consumer groups — **default pick for interviews** |
| **SQS** | Fully managed AWS, simple — standard (high throughput, best-effort ordering) or FIFO (strict ordering, lower throughput); visibility timeout |
| **RabbitMQ** | Traditional broker with exchanges/bindings for complex routing — less common in system design interviews |

## Key takeaways

- Message queues **decouple** producers from consumers, **buffer** bursty traffic, and **distribute** work across worker pools
- Default to **at least once delivery** with **idempotent** consumers
- Know acks, visibility/invisibility, partitioning, back pressure, poison messages, and DLQs before your interview
- Don't introduce a queue into a synchronous low-latency path
- If you need one technology to know cold: **Kafka**
