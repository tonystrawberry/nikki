---
title: "Apache Spark — The Ultimate Guide (notes)"
date: "2026-05-24"
excerpt: "Notes from a 6-hour Apache Spark deep-dive by Ansh Lamba — distributed computing fundamentals, architecture, DataFrames, joins, memory management, caching, partition pruning, and AQE."
author: "Tony Duong"
category: "note"
tags: ["spark", "big-data", "data-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=FNJze2Ea780"
---

Notes from Ansh Lamba's 6-hour Apache Spark master class. Watched start to finish — the first half (through broadcast joins) and the second half (memory management → AQE) are both captured below.

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

## Executor memory layout

The executor JVM heap (`spark.executor.memory`) plus a ~10% overhead is what you actually get when you request memory. The course also mentions off-heap memory and PySpark memory — both default to zero and are rarely used. The heap itself splits three ways:

- **Reserved memory** — fixed 300 MB for the Spark engine. Non-negotiable.
- **Spark memory pool** — 60% of `(heap − 300 MB)` by default (`spark.memory.fraction`). This is where the real work happens.
- **User memory** — the remaining 40%. Holds UDF state and user-defined data structures.

## Unified memory pool: storage vs execution

The Spark memory pool is split 50/50 by default (`spark.memory.storageFraction`) into:

- **Storage memory** — long-term, holds cached DataFrames.
- **Execution memory** — short-term, performs joins, aggregations, transformations.

The split is **flexible, not rigid**:

- **Execution > storage.** If execution needs more space and storage has free room, it borrows freely. If storage is full of cached blocks, execution can **evict** them using LRU. Execution has priority.
- **Storage > execution.** Storage can borrow free execution space, but **cannot evict** execution. If execution later needs that space back, storage gets pushed out via LRU. One-way authority.

When storage itself overflows, it evicts its own least-used cached blocks — never execution's.

## Executor OOM and data spill

Each wide transformation (e.g. `groupBy`) sends rows for the same key to one partition. Each task processes one partition at a time inside execution memory.

- If a partition doesn't fit, Spark **spills** intermediate results to disk to free space — partitions are spilled whole; you can't shift "half a partition".
- Spilling is fine. The actual OOM comes when **one partition by itself is bigger than execution memory** — a skew problem. You can't spill your way out because Spark eventually has to materialize that partition in memory to process it.
- Bumping `spark.executor.memory` works once, then breaks again when the skew grows. The right fix is to **kill the skew**, not buy more RAM.

## Salting

The standard skew remedy. If one key (say `food`) hogs 80% of the rows:

1. Add a `salt` column with random values from a small range (e.g. `0..3` → 4 buckets).
2. Group by `(key, salt)` instead of `key` alone.
3. The skewed key is now split across N independent partitions that each fit in memory.

You pick the salt cardinality based on how much you need to split the hot key. Salting trades a clean group-by for an extra aggregation step, but turns an OOM into a working job.

## Caching: `cache()` vs `persist()`

Without caching, every action recomputes the full DAG. If `df1` is reused to build `df2`, `df3`, `df4`, Spark rebuilds `df1` from source every time — execution memory is short-term and gets reclaimed between actions.

- `df.cache()` parks the DataFrame in **storage memory** so subsequent uses become an in-memory table scan (visible in `.explain()` as `InMemoryTableScan` instead of recomputed projections).
- `cache()` is just `persist(StorageLevel.MEMORY_AND_DISK)` for the DataFrame API. For the RDD API, `cache()` is `MEMORY_ONLY` instead — a common point of confusion.
- Other storage levels: `MEMORY_ONLY` (recompute spills, don't disk), `DISK_ONLY` (slow but safe), `MEMORY_ONLY_2` (replicated for fault tolerance), `OFF_HEAP` (experimental, requires explicit enable).
- Only cache DataFrames that are (a) small enough to fit and (b) reused multiple times. There's no `uncache()` — call `df.unpersist()`.

## Edge node, client mode vs cluster mode

You don't talk to the cluster manager directly. A gateway machine — the **edge node** — has the cluster credentials, and developers SSH in to submit jobs.

Two deployment modes, depending on where the driver runs:

- **Client mode**: driver runs on the submitting machine (your laptop / the edge node). Logs stream locally, easy for development — but if you close the laptop the driver dies and the whole job dies. Cross-network chatter between driver and executors adds latency. Dev only.
- **Cluster mode**: driver runs on one of the cluster nodes alongside the executors. Resilient to the submitter disconnecting, low-latency driver↔executor traffic. Standard for production.

## Partition pruning

When you `df.write.partitionBy("department").parquet(path)`, Spark writes one folder per distinct value: `department=HR/`, `department=IT/`, …

On read, if your query has a filter on the partition column (`.filter(col("department") == "HR")`), Spark only scans the matching folder. The Spark UI's *number of files read* and *number of partitions read* prove it: with partitioning + filter on the partition column, you scan a few KB instead of the whole table. At TB scale this is the single biggest knob.

## Dynamic partition pruning (DPP)

The clever case: you're joining a **partitioned fact table** to a **small dimension table** that has a filter on a column shared with the partition key, but no filter on the fact table itself.

Naively Spark would scan every partition of the fact table. DPP rewrites this:

1. Scan and filter the dimension table (cheap, it's small).
2. **Broadcast** the resulting key set to the fact-table scan.
3. The broadcasted keys act as a dynamic filter — the fact-table scan now only reads the matching partitions.

Two conditions: the filter on the dimension must be on a column that's also the **partition column** of the fact table, and that column must be part of the **join key**.

## Adaptive Query Execution (AQE)

Spark 3.0+ and on by default (`spark.sql.adaptive.enabled = true`). The physical plan is no longer final — Spark collects runtime statistics after each stage and rewrites the remaining plan. Three big wins:

- **Dynamic shuffle partition coalescing.** Wide transformations default to 200 shuffle partitions. With AQE off and 6 rows of data, you get 199 empty partitions and 1 real one — pointless GC pressure and task scheduling overhead. AQE coalesces them down to what the data actually needs (often 1).
- **Dynamic join strategy switching.** A plan compiled as a sort-merge join can become a broadcast join at runtime if upstream transformations shrank one side below the broadcast threshold. No hint needed.
- **Dynamic skew handling.** If runtime stats show a partition is much larger than its siblings (Spark uses a multiplier rule, ~5× median), AQE auto-splits it into sub-partitions. Doesn't replace salting (salting is still more controllable), but a free safety net for moderate skew.

## Key takeaways

- **Lazy evaluation is the whole point.** Build the DAG, then let Catalyst optimize it before any work happens.
- **Shuffles are the cost.** Every wide transformation is a network operation. Broadcast where you can.
- **Read the DAG, not the code.** The Spark UI tells you what *actually* ran — that's what you tune.
- **Don't `.collect()` blindly.** It's the most common cause of driver OOM in production.
- **Memory tuning is downstream of understanding the model.** No amount of `spark.driver.memory=64g` saves a `.collect()` on the wrong DataFrame.
- **Execution memory wins fights with storage memory.** Cache aggressively but know it can be evicted.
- **Salt before scaling.** When a single partition OOMs, the answer is almost always salting (or upstream cleanup), not bigger executors.
- **Partition your writes on the column you filter on.** Partition pruning + DPP turn TB-scale scans into KB-scale scans.
- **Trust AQE, but understand what it's doing.** It's automatic, but knowing *why* you're suddenly seeing a broadcast join instead of a sort-merge is the difference between a senior engineer and a passenger.

## Speaker

[Ansh Lamba](https://www.youtube.com/@AnshLamba) — relaxed, conversational delivery, lots of "make sense?" check-ins and "buddy" framing. Makes a long course actually finishable.
