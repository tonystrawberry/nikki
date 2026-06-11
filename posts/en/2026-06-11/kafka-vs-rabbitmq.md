---
title: "Kafka vs RabbitMQ"
date: "2026-06-11"
excerpt: "Hello Interview on choosing between Kafka and RabbitMQ — smart broker vs smart consumer, queue vs append-only log, and the ordering, throughput, delivery, and ops trade-offs that should drive the decision."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "kafka", "rabbitmq", "message-queue", "streaming", "distributed-systems", "interview"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=1HOVtQ-_fcE"
---

Kafka and RabbitMQ aren't interchangeable — picking the wrong one can mean significant rework later. But they exist to solve the **same fundamental problem**: when one service calls another directly (order service → inventory service over HTTP), the caller gets stuck waiting, times out, or drops requests the moment the callee is slow or down. A message queue adds a **buffer** between services: the producer drops a message and returns immediately, and the consumer processes it whenever it's ready. During a flash-sale spike, the queue absorbs the load and lets downstream services work at their own pace.

Both give you this decoupling — producers, consumers, a broker in the middle. But **how they work under the hood is fundamentally different**, and that's what should drive the choice.

## RabbitMQ: a smart broker with simple consumers

RabbitMQ is a traditional message broker with an intuitive queue mental model:

- A producer sends a message to the broker.
- The broker applies **routing rules** you configured to decide which queue it belongs to.
- A consumer pulls messages off the queue, processes them, and sends an **acknowledgement**.
- On ack, RabbitMQ **deletes** the message. Failed deliveries are retried, and after repeated failures the message is moved to a **dead-letter queue** automatically.

The broker does the heavy lifting — routing, tracking deliveries, retries, dead-lettering — while the consumer just subscribes, processes, and acks. This maps cleanly onto **task-oriented workloads**: sending emails, processing payments, resizing images. A unit of work goes in, something does it, the message disappears. (In Kafka you'd build dead-letter handling yourself.)

## Kafka: a simple broker with smart consumers

Kafka is essentially a **distributed append-only log**. A producer appends a message to a **topic**, and it **doesn't disappear when read** — it stays in the log for hours, days, weeks, or indefinitely depending on retention.

- Consumers track their own position, called an **offset**. Read message 500 → remember you're at 500. Crash and restart → look up where you left off and resume.
- Need to reprocess an hour ago? Just **rewind the offset**.
- Messages are **durable and replayable**, so multiple consumer groups read the same stream independently — analytics and real-time notifications consume the same events, and a service that comes online six months later can read the entire history from day one.

So: **RabbitMQ is a message broker — messages flow through it; Kafka is a log — messages live in it.** In RabbitMQ a consumed message is gone; in Kafka messages persist and any number of consumers can read them from any point in history. This one difference drives almost every other trade-off — which is why many teams use **both**: Kafka as the durable event stream, RabbitMQ as the task queue processing the work those events trigger.

## The technical trade-offs

### Ordering

- **RabbitMQ** queues are strictly ordered — a single consumer gets perfect ordering. Add multiple consumers for throughput and you trade away that ordering.
- **Kafka** splits each topic into **partitions**; order is guaranteed only **within a partition**. A **partition key** routes related messages together (all of customer 12345's orders → same partition, processed in sequence) — so you get **per-entity ordering with parallelism**, but no global order.
- Trade-off: RabbitMQ = global ordering with one consumer; Kafka = per-entity ordering with parallelism.

### Throughput & latency

- **RabbitMQ**: ~4,000–10,000 msgs/sec, ~1–5 ms latency at low volume. The broker **pushes** messages but does a lot of per-message work (delivery state, acks, routing), so throughput drops as that overhead adds up.
- **Kafka**: 1,000,000+ msgs/sec (~100×), but higher baseline latency (~5–50 ms) because consumers **pull in batches**. The broker just appends to a sequential log, so latency stays consistent even as volume grows.

### Delivery guarantees

When a consumer fails to process a message, you either lose it or redeliver it (risking duplicates):

- **At-most-once**: broker sends once, no retry — fast, but messages can be lost forever.
- **At-least-once**: broker retries until acked — no data loss, but consumers may see a message twice. **Both** systems support this; it's the industry-standard default.
- **Exactly-once**: Kafka supports it, but it's **much narrower than it sounds** — only when input and output are Kafka topics in the **same cluster** under Kafka transactions. The moment you write to a database, call an external API, or cross clusters, you're back to at-least-once. Don't pick Kafka just for "exactly-once" — in practice you still need **idempotent consumers**.

### Operational complexity

- **RabbitMQ** is simpler: a single binary, straightforward clustering, built-in management UI — approachable for a small team running a few queues.
- **Kafka** is harder: historically needed Zookeeper (newer versions use **Raft** instead), plus partition rebalancing, broker failures, topic configs, and consumer-group coordination. **Managed services** (Confluent Cloud, Amazon MSK, Azure Event Hubs) absorb most of this — strongly consider one unless you already have infra expertise.

## When to use which

**Reach for RabbitMQ** when you need task queues / background jobs (emails, payments, image resizing — work goes in, gets done, disappears), smart content-based routing, low latency at moderate scale, and simple operations. *Real-world: Instagram processes photo uploads (resizing/filtering) via RabbitMQ workers; Reddit uses it for comment threads and karma.*

**Reach for Kafka** when you need multiple systems reading the same events independently (analytics, fraud detection, billing, audit logging), replay of historical data, massive scale (millions of events/sec with consistent latency), or a durable permanent event history. *Real-world: Netflix processes petabytes/day for recommendations and billing; Uber uses it for real-time pricing and fraud detection; LinkedIn invented Kafka and powers its feed and messaging with it.*

## Key takeaways

- **Smart broker + simple consumers (RabbitMQ)** vs **simple broker + smart consumers (Kafka)** — this is the root distinction.
- **Queue vs log**: RabbitMQ deletes on ack; Kafka retains and lets any consumer replay by offset.
- **Ordering**: RabbitMQ global (single consumer) vs Kafka per-partition (parallel) — choose your partition key deliberately.
- **Throughput/latency**: RabbitMQ ~4k–10k msgs/sec at 1–5 ms; Kafka 1M+/sec at 5–50 ms.
- **Don't chase exactly-once** — it's Kafka-cluster-internal only; build idempotent consumers regardless.
- If your use case is a constrained task queue, pick **RabbitMQ** for simplicity; for durable, replayable, high-scale event streams, lean **Kafka** (likely managed). Or use **both**.
