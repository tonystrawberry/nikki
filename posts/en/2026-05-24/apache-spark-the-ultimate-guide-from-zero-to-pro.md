---
title: "Apache Spark — The Ultimate Guide (notes)"
date: "2026-05-24"
excerpt: "Notes from a 6-hour Apache Spark deep-dive by Ansh Lamba — distributed computing fundamentals, architecture, DataFrames, joins, and memory management."
author: "Tony Duong"
category: "note"
tags: ["spark", "big-data", "data-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=FNJze2Ea780"
---

Notes from Ansh Lamba's 6-hour Apache Spark master class. I watched up to **3:50:46** (just past broadcast joins, before unified memory management) — the sections below reflect what I covered. I'll come back for the rest.

## Why distributed computing

The course opens by contrasting vertical scaling (upgrade one machine) with horizontal scaling (add more machines).

- Vertical hits ceilings fast: hardware limits, single point of failure, low availability.
- Horizontal: more machines = more compute + redundancy. This is what Spark is built around.

The mental model: **driver** is the team lead, **executors** are the workers. You declare how many you want and how big each is; the cluster manager (YARN, standalone, or in Databricks the platform itself) provisions them.

## Spark architecture

- **Driver** holds the application code, builds the logical plan, schedules work.
- **Executors** run tasks on partitions of data.
- The driver communicates with the cluster manager to request resources, then ships tasks to executors.
- Spark is written in Scala/Java; **PySpark** is a Python wrapper layered on top of the Java API via Py4J, mainly because the data community lives in Python.

## DataFrames vs RDDs

- **RDDs** are the original abstraction — a distributed list with logical partitions on top, immutable, lazily evaluated. The "specialty" is that the data is split across machines.
- **DataFrames** are a higher-level structured API. Internally they still compile down to RDD operations, but with the Catalyst optimizer in between.
- The course walks through creating a DataFrame in Databricks and showing that no job runs until an **action** (like `.show()` or `.collect()`) is triggered.

## Lazy evaluation, transformations, actions

- **Transformations** (filter, select, groupBy, join) build the DAG but don't execute.
- **Actions** (show, collect, count, write) trigger execution.
- This lets Spark see the whole pipeline and optimize before running anything — predicate pushdown, column pruning, etc.

## Narrow vs wide transformations

- **Narrow**: each output partition depends on a single input partition (`filter`, `map`, `select`). No data movement across the network.
- **Wide**: output partition depends on multiple input partitions (`groupBy`, `join`, `distinct`). Requires a **shuffle** — data moves between executors over the network. Wide transformations are where performance goes to die if you're not careful.

## Jobs, stages, tasks

- One **action** = one **job**.
- A job is split into **stages** at every shuffle boundary (wide transformation).
- Each stage is a set of **tasks**, one per partition.
- The Spark UI's DAG view is exactly this hierarchy; reading it well is the difference between guessing and knowing where time goes.

## Joins

- **Shuffle join (sort-merge)**: both sides get shuffled by the join key so matching rows land on the same executor. Default for large + large.
- **Broadcast join**: the smaller side is sent in full to every executor; no shuffle. Much faster, but only safe when the broadcast side fits in driver/executor memory (default threshold around 10 MB; tunable).
- The Spark optimizer will sometimes auto-broadcast based on stats; you can also force it with `broadcast(df)` in PySpark.
- Rule of thumb the speaker hammers: **always check if a join can be a broadcast join before accepting a shuffle**.

## Driver memory and `.collect()`

- `.collect()` pulls all partitions back to the driver. If the total size exceeds driver JVM heap → driver OOM, application dies.
- The fix is rarely "make the driver bigger". The fix is "don't call `.collect()` on a 100 GB DataFrame". Use `.show(N)`, `.take(N)`, or write to storage instead.

## What I haven't covered yet

The remaining ~2 hours go into:

- Unified memory management (execution vs storage memory pool)
- Executor OOM patterns and garbage collection
- Storage levels, `cache()` vs `persist()`
- Dynamic partition pruning
- Edge nodes, deployment modes (client vs cluster)
- Spark SQL engine internals and query plans

To be continued.

## Key takeaways

- **Lazy evaluation is the whole point.** Build the DAG, then let Catalyst optimize it before any work happens.
- **Shuffles are the cost.** Every wide transformation is a network operation. Broadcast where you can.
- **Read the DAG, not the code.** The Spark UI tells you what *actually* ran — that's what you tune.
- **Don't `.collect()` blindly.** It's the most common cause of driver OOM in production.
- **Memory tuning is downstream of understanding the model.** No amount of `spark.driver.memory=64g` saves a `.collect()` on the wrong DataFrame.

## Speaker

[Ansh Lamba](https://www.youtube.com/@AnshLamba) — relaxed, conversational delivery, lots of "make sense?" check-ins and "buddy" framing. Makes a long course actually finishable.
