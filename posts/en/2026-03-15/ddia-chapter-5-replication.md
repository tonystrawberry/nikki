---
title: "DDIA Chapter 5: Replication"
date: "2026-03-15"
excerpt: "Summary of Kleppmann's chapter on replication in data systems: why replicate, single-leader, multi-leader, and leaderless replication, plus consistency trade-offs."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "replication", "distributed-systems", "consistency"]
collection: "ddia"
collectionOrder: 5
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

Chapter 5 of *Designing Data-Intensive Applications* covers **replication**: keeping copies of the same data on multiple nodes for redundancy, lower latency (data closer to users), and higher read throughput. The chapter compares three main approaches—single-leader, multi-leader, and leaderless replication—and the consistency trade-offs that come with each.

## Why Replicate?

- **Redundancy:** If one node fails, others can serve data.
- **Lower latency:** Place replicas in multiple regions so users read from a nearby node.
- **Scale read throughput:** Distribute read traffic across replicas; writes are often harder to scale.

## Single-Leader (Leader-Based) Replication

One node is the **leader** (primary); writes go to the leader. Replicas (followers/secondaries) receive a stream of changes and apply them in the same order.

- **Synchronous vs asynchronous:** Sync replication waits for at least one replica before acknowledging the write—stronger consistency, higher latency and risk if a replica is slow or down. Async replication acknowledges immediately and replicates in the background—lower latency but risk of losing recent writes if the leader fails.
- **Replication lag:** With async replication, followers can lag. This leads to **eventual consistency** and observable issues:
  - **Read-after-write consistency:** A user writes then reads and might see stale data if the read goes to a lagging replica. Fixes: read your own writes from the leader, or route by a key that’s only on the leader until replicated.
  - **Monotonic reads:** A user might see data go “backward in time” if successive reads hit different replicas with different lag. Fix: route all reads for a user to the same replica (e.g. by user ID).
  - **Consistent prefix reads:** In a partitioned system, different parts of a conversation might be replicated in different order; a reader might see an answer before the question. Fix: ensure causally related writes go to the same partition or use ordering guarantees.

**Setting up new replicas:** Typically take a snapshot of the leader, copy it to the new node, then replay the replication log from the snapshot time so the new replica catches up.

## Multi-Leader Replication

Multiple leaders can accept writes (e.g. one per datacenter). Each leader replicates to the others. Use cases: multi-datacenter deployments (write locally, replicate across DCs) and offline-capable apps (each device is a “leader” that syncs when online).

- **Conflict detection and resolution:** Two leaders can accept concurrent writes to the same key; conflicts must be detected and resolved. Options: last-write-wins (LWW) by timestamp (can drop writes), merge values (e.g. CRDTs), or record conflicts for application-level resolution. Custom conflict resolution logic can run on read or on write.

## Leaderless Replication

No single leader; clients send writes to multiple nodes (or a coordinator does), and reads from multiple nodes. Used in Dynamo-style systems (e.g. DynamoDB, Cassandra, Voldemort).

- **Quorum:** With *n* replicas, if you write to *w* nodes and read from *r* nodes, and *w* + *r* > *n*, you typically see the latest write (assuming no concurrent writes and no faulty nodes). Common choice: *w* = *r* = ⌈(*n*+1)/2⌉.
- **Sloppy quorum and hinted handoff:** When nodes are down or unreachable, you might accept writes to other nodes that will hand off to the intended replica later (“hinted handoff”). Reads might then miss those writes until they’re applied—so quorum is not strict and consistency is weakened.
- **Conflict resolution:** Concurrent writes to the same key can create multiple versions. Resolution is often by **last-write-wins (LWW)** using timestamps, or by **version vectors** / **dotted version vectors** to track causality and merge or present multiple versions to the application.

## Key Takeaways

- **Single-leader** replication is simple and widely used; replication lag forces you to think about read-after-write, monotonic reads, and consistent prefix.
- **Multi-leader** suits multi-datacenter and offline scenarios but introduces write conflicts and more complex resolution.
- **Leaderless** replication favors availability and low latency over strong consistency; quorum helps but sloppy quorums and concurrent writes complicate the picture.
- There is no free lunch: replication improves availability and read performance but adds complexity around consistency, conflict handling, and failure modes.
