---
title: "DDIA Chapter 10: Batch Processing (Made Simple)"
date: "2026-05-23"
excerpt: "A friendly walkthrough of batch processing in Designing Data-Intensive Applications — Unix pipes, MapReduce, and the rise of Apache Spark."
author: "Tony Duong"
category: "note"
tags: ["distributed-systems", "ddia", "batch-processing", "spark", "mapreduce"]
collection: "ddia"
collectionOrder: 10
collectionTitle: "Designing Data-Intensive Applications"
---

Chapter 10 of *Designing Data-Intensive Applications* zooms out from the database-of-the-moment and asks a different question: **how do you process huge amounts of data — gigabytes, terabytes — when you don't need an answer in real time?** That's the world of batch processing. This article walks through the chapter's big ideas with simple analogies.

## Three Kinds of Systems

Before diving in, the chapter sets up a useful mental model:

- **Services (online):** respond to requests as they arrive. Latency matters. Think: a web server.
- **Batch processing (offline):** chew through a fixed, large input and produce an output. Throughput matters; latency is measured in minutes or hours. Think: nightly reports.
- **Stream processing (near-real-time):** in between — process events as they arrive but don't need to answer a user instantly. (That's the next chapter.)

The rest of the chapter is about the second one.

## Starting Small: Unix Pipes

DDIA opens with a delightful observation: a few lines of Unix shell can do a lot.

```bash
cat access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head
```

That pipeline finds the top URLs in a log file. Each tool does one thing, reads from stdin, writes to stdout, and the shell glues them together. Files are the universal interface.

This is the **philosophy** that batch processing inherits: small composable tools, immutable inputs, deterministic outputs. If something goes wrong, you re-run it. The input file didn't change.

The catch: a single machine isn't big enough when your "log file" is 100 TB.

## MapReduce: Unix Pipes for a Thousand Computers

**MapReduce** (popularized by Google, then by open-source Hadoop) is essentially the same idea, scaled out across a cluster.

You write two functions:

- **Mapper:** takes one record at a time, emits zero or more `(key, value)` pairs.
- **Reducer:** receives all values for a given key, produces an output.

In between, the framework does the magic: it **shuffles** all the `(key, value)` pairs across the network so that everything with the same key ends up at the same reducer. That shuffle is the expensive part.

### A Concrete Example: Counting Words

- Mapper reads a line, emits `(word, 1)` for each word.
- Shuffle groups all the `1`s for `"the"` together, all the `1`s for `"cat"` together, etc.
- Reducer sums the values for each key.

The same shape works for log analysis, building search indexes, computing recommendations — anything where you can frame the problem as "group by something, then aggregate."

### Joins in MapReduce

Joining two datasets (say, users and clicks) without random database lookups is a recurring theme:

- **Sort-merge join:** both sides emit the same key (e.g., `user_id`); the reducer sees all clicks and the user record together.
- **Broadcast hash join:** the small side is loaded into memory on every mapper, the big side streams through.
- **Partitioned hash join:** both sides are pre-partitioned by the join key.

These names sound fancy, but the idea is the same one you'd use on a laptop — just distributed.

### Why People Stopped Loving MapReduce

MapReduce was revolutionary, but writing it is painful:

- Every job is **just** map + reduce. Anything more complex becomes a chain of jobs.
- Intermediate results between jobs are **written to disk** (HDFS) — slow.
- A workflow with 10 stages reads and writes the dataset 10 times.

This is where Apache Spark enters.

## Apache Spark: Same Ideas, Smarter Execution

Spark keeps the same mental model — partition data, apply functions, shuffle when needed — but fixes the painful parts:

- **In-memory execution:** intermediate data stays in RAM across stages when possible. Big speedup.
- **Richer operators:** not just map/reduce. You get `filter`, `join`, `groupBy`, `reduceByKey`, `aggregate`, etc., as a fluent API.
- **DAG planner:** Spark builds a graph of all the transformations you've described, then optimizes the whole plan before executing. It can fuse stages, decide join strategies, and avoid unnecessary shuffles.
- **Resilient Distributed Datasets (RDDs):** the core abstraction — a partitioned collection that knows how it was derived. If a partition is lost, Spark recomputes it from the lineage. No replication needed.

The user-facing experience is closer to writing Python or SQL than writing MapReduce jobs. A pipeline like "read CSV, filter, join, group, write Parquet" reads as a single program — Spark figures out how to distribute it.

I built a small repo to walk through these ideas hands-on: [learn-apache-spark](https://github.com/tonystrawberry/learn-apache-spark).

## Dataflow Engines and Higher-Level APIs

Spark is one example of a broader category the chapter calls **dataflow engines** (others: Flink, Tez). They generalize the MapReduce idea into arbitrary DAGs of operators.

On top of these engines sit **higher-level APIs** that compile down to dataflow plans:

- **SQL on big data** (Hive, Spark SQL, Presto)
- **DataFrame APIs** (Spark DataFrames, pandas-on-Spark)
- **Graph processing** (Pregel-style: GraphX, Giraph)
- **Machine learning** (MLlib)

The lesson: most people don't write map/reduce by hand anymore. They write SQL or DataFrame code, and the engine handles the distributed plumbing.

## Designing for Batch: Some Recurring Principles

A few ideas come up over and over in the chapter:

- **Immutable inputs.** You never mutate the source data. You produce a new output. If the job is wrong, fix the code and re-run — the input is still there.
- **Deterministic functions.** Mappers and reducers should produce the same output for the same input. This is what makes retries safe.
- **Fault tolerance via re-execution.** If a node dies, the framework just re-runs that piece of work somewhere else. Possible only because of the two points above.
- **Separation of storage and compute.** Data lives in HDFS / S3 / object storage; compute clusters spin up and down on top.

## Batch vs. Real-Time Databases

Why use batch at all when we have fancy databases?

- **Cost:** batch jobs use cheap, slow storage and burst compute. Much cheaper per byte than serving from a transactional DB.
- **Throughput:** scanning 100 TB sequentially is fast. Doing the same as 100 TB of individual queries against a DB is not.
- **Decoupling:** the batch output (e.g., a search index, a recommendation file) is then loaded into a serving system. Build offline, serve online — the failure of the batch pipeline doesn't crash the website.

## Key Takeaways

- **Unix pipes** are the philosophical ancestor: small tools, immutable files, composability.
- **MapReduce** is that idea distributed across a cluster, with a shuffle in the middle.
- **MapReduce is painful** because everything goes through disk between stages and only map+reduce is offered.
- **Apache Spark** keeps the model but executes in memory, supports rich operators, and plans the whole DAG before running it.
- **RDDs** make Spark fault-tolerant via lineage instead of replication.
- **Dataflow engines + SQL/DataFrame APIs** are how most batch work happens today — you rarely write raw map/reduce anymore.
- **Immutability and determinism** are what make distributed batch processing safe to retry.
- **Batch and online systems are partners:** batch builds the artifact (index, model, report); online systems serve it.
