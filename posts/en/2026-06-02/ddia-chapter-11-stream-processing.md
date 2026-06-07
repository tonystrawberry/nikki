---
title: "DDIA Chapter 11: Stream Processing"
date: "2026-06-02"
excerpt: "Notes on stream processing in Designing Data-Intensive Applications — event streams, message brokers, CDC, event sourcing, time semantics, stream joins, and fault tolerance."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "stream-processing", "kafka", "event-sourcing"]
collection: "ddia"
collectionOrder: 11
collectionTitle: "Designing Data-Intensive Applications"
---

Chapter 11 of *Designing Data-Intensive Applications* picks up where batch left off. If batch processing answers "what happened over this huge dataset?", **stream processing** asks "what is happening *right now*, as events arrive?" This chapter connects messaging systems, databases, and real-time computation into one coherent picture.

## Where stream processing sits

Recall the three-system model from Chapter 10:

- **Services (online):** respond to user requests; latency in milliseconds.
- **Batch (offline):** process a fixed dataset; latency in minutes or hours.
- **Stream (near-real-time):** process events as they flow in; latency in seconds — not instant like a request/response, but far faster than batch.

Stream processing is the glue between "something happened" and "react to it soon."

## Events and event streams

An **event** is a small, immutable, self-contained record of something that happened at a point in time — a page view, a sensor reading, a payment.

Events differ from **commands** (do this) and **state** (current value). Events are facts about the past.

An **event stream** is an unbounded sequence of events, usually ordered by time. Producers append; consumers read forward (and sometimes replay from an earlier offset).

Encoding matters: JSON is easy but schema evolution is painful. Avro, Protobuf, and schema registries help producers and consumers evolve independently.

## Message brokers and logs

**Message brokers** (RabbitMQ, Kafka, Pulsar, etc.) decouple producers from consumers — the same decoupling pattern as queues in system design interviews, but oriented around *streams* of events rather than one-off jobs.

Two broad models:

| Model | Behavior | Examples |
|-------|----------|----------|
| **Queue (AMQP/JMS style)** | Message deleted after ack; competing consumers load-balance | RabbitMQ, SQS |
| **Log (Kafka style)** | Messages retained; consumers track offset; replay possible | Kafka, Pulsar |

**Partitioned logs** scale throughput: each partition is an ordered sub-stream. Producers pick a partition key; consumers in a group each own some partitions.

Design tricks that keep brokers fast:

- **Batching** small writes into larger ones
- **Sequential disk writes** (append-only logs) instead of random I/O
- **Zero-copy** transfer where possible

Consumer patterns:

- **Load balancing:** each message to one consumer in the group
- **Fan-out:** same message to many independent consumer groups (e.g. indexing + analytics + billing from one stream)

Acknowledgements and redelivery mirror queue semantics: at-least-once is common; consumers must be idempotent.

## Databases and streams — two sides of the same coin

The chapter's central insight: **a database's write-ahead log (WAL) is already a stream of events.** Replication often works by tailing that log. Stream processing extends the idea outward.

### Change Data Capture (CDC)

**CDC** turns database row changes into a stream of events (insert/update/delete). Tools like Debezium tail the DB transaction log.

Use cases: invalidate caches, update search indexes, sync read replicas, feed analytics — all without polling the database.

### Event sourcing

Instead of storing current state and overwriting it, store the **sequence of events** that led to the current state. State is derived by replaying events (or snapshots + replay).

Advantages:

- Complete audit trail
- Temporal queries ("what did the account look like on March 1?")
- Easier evolution — new consumers can rebuild state from the log
- Aligns with immutable, append-only thinking from batch processing

Drawbacks:

- Schema evolution on stored events is hard
- Replaying long histories is slow without snapshots
- "Deleting" data becomes awkward (tombstone events, compaction)
- Not every domain fits naturally as a pure event log

### State, streams, and immutability

Batch philosophy (immutable inputs, deterministic functions) carries over: **immutable events + derived state** is a powerful default. The database holds the current snapshot; the stream holds the history.

## Uses of stream processing

Stream processors (Kafka Streams, Flink, Spark Structured Streaming, ksqlDB) apply functions to incoming events:

- **Complex Event Processing (CEP):** detect patterns across events ("three failed logins then a large transfer")
- **Stream analytics:** rolling counts, averages, percentiles over windows
- **Maintaining materialized views:** keep an aggregated table up to date incrementally
- **Search/index updates:** push documents into Elasticsearch as they change
- **Notifications and alerting:** react within seconds, not after the nightly batch

## Reasoning about time

This is one of the chapter's hardest topics — and one interviewers love.

Two clocks:

- **Event time:** when the event actually happened (timestamp in the event)
- **Processing time:** when the processor sees it

Network delays, retries, and mobile offline sync mean event time and processing time diverge. Stream systems must handle **out-of-order events**.

### Windows

Aggregations usually happen over **windows** of time:

| Window type | Description |
|-------------|-------------|
| **Tumbling** | fixed, non-overlapping (e.g. every 1 minute) |
| **Hopping** | fixed size, overlapping (e.g. 5-min window every 1 min) |
| **Sliding** | all events within last N minutes of each event |
| **Session** | gap-based — group events with pauses < threshold into one session |

**Watermarks** estimate how far event time has progressed — they tell the processor "we probably won't see events older than X anymore" so windows can close and emit results, even with stragglers.

## Stream joins

Joins in streams are trickier than in batch because data arrives continuously and unbounded.

- **Stream–stream join:** two streams, events matched if they fall in the same window (e.g. clicks joined with impressions within 30 minutes)
- **Stream–table join:** enrich events with lookup data from a **changelog stream** of a table (CDC makes this natural)
- **Table–table join:** both sides are changelog streams; equivalent to maintaining a materialized join view incrementally

## Fault tolerance

Stream jobs run for days or months. When a node crashes, state must survive.

Approaches:

- **Microbatching (Spark Streaming legacy model):** chop the stream into small batch intervals; checkpoint each batch. Simple but higher latency.
- **Checkpointing (Flink, Kafka Streams):** periodically snapshot operator state + input offsets to durable storage. On recovery, resume from last checkpoint.
- **Idempotent writes + at-least-once delivery:** same safety net as message queues — design outputs to tolerate retries.

Determinism and replayability (from batch) apply here too: if you can replay events from a log and get the same result, recovery is straightforward.

## Batch vs stream — and unifying them

Historically:

- **Lambda architecture:** batch layer (accurate, slow) + speed layer (approximate, fast) + serving layer merging both. Powerful but operationally painful — two pipelines, two codebases.
- **Kappa architecture:** treat everything as a stream; batch is just replaying the log with a longer window. Simpler mentally if your log retains enough history.

Modern systems blur the line: Spark Structured Streaming, Flink batch mode, and Kafka's log retention mean **one engine, two modes** — stream for low latency, replay the same log for backfill.

## Key takeaways

- **Events** are immutable facts; **streams** are unbounded, ordered sequences of them.
- **Message brokers** decouple producers and consumers; **log-based** systems (Kafka) add replay and fan-out that queues don't.
- **CDC** and **event sourcing** connect databases to streams — the WAL was always a stream underneath.
- **Event time vs processing time** and **watermarks** are essential for correct windowed aggregations.
- **Stream joins** (stream–stream, stream–table, table–table) extend relational thinking to unbounded data.
- **Checkpointing** and **idempotent consumers** make long-running stream jobs fault-tolerant.
- Batch and stream are partners, not opposites — same immutability and determinism ideas, different latency targets.
