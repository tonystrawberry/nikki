---
title: "DDIA Chapter 6: Partitioning"
date: "2026-03-18"
excerpt: "Summary of Kleppmann's chapter on partitioning (sharding): splitting data across nodes, partition strategies, secondary indexes, rebalancing, and request routing."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "partitioning", "sharding", "distributed-systems"]
collection: "ddia"
collectionOrder: 6
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

Chapter 6 of *Designing Data-Intensive Applications* covers **partitioning** (sharding): splitting a large dataset into smaller pieces and distributing them across multiple nodes. Partitioning is used together with replication—each partition may be replicated for fault tolerance. The goal is to scale write throughput and storage beyond a single machine.

## Partitioning of Key-Value Data

- **Partitioning by key range:** Assign contiguous ranges of keys (e.g. A–M, N–Z) to nodes. Simple and supports efficient range scans. Risk: **hot spots** if access is not uniform (e.g. all traffic for keys starting with "A").
- **Partitioning by hash of key:** Hash the key and assign by hash range. Spreads data evenly and avoids hot spots from lexical key order. Downside: **range queries** are no longer efficient—you must query every partition.
- **Hybrid:** Use a compound key (e.g. hash(user_id) + timestamp) so you partition by hash but still get ordering within a partition for range scans on the second part.

## Partitioning and Secondary Indexes

Secondary indexes (e.g. "find all posts by user X") don't map neatly to partitions. Two main approaches:

- **Local (document-based) index:** Each partition maintains its own secondary index over only the data it holds. A query by secondary key must be **scatter-gather**: send the query to all partitions and merge results. Simple but expensive for reads.
- **Global index:** A single secondary index is partitioned itself (e.g. by index key). A read goes to one partition of the index; a write may need to update multiple index partitions if the document is in one partition and the index entry in another. More complex writes, but targeted reads.

## Rebalancing

When adding or removing nodes, data must move so partitions are distributed fairly.

- **Why rebalancing is hard:** Moving data is expensive; you want to minimize data moved and avoid overloading nodes or causing downtime.
- **Strategies:** (1) **Fixed number of partitions** — more partitions than nodes; when you add a node, assign it a subset of existing partitions. Simple but partition count is fixed at creation. (2) **Dynamic partitioning** — partitions split when they grow too large (like LSM/SSTables). (3) **Partition proportionally to nodes** — partition count = node count; when the cluster size changes, split/merge. Used in some systems (e.g. Cassandra).
- **Operations:** Use automatic rebalancing or manual; avoid having one node responsible for deciding (single point of failure). Can use a consensus protocol (e.g. Raft) to assign partitions.

## Request Routing

When a client wants to read or write a key, how does it know which node to talk to?

- **Allow any node to route:** The node contacted forwards the request to the correct partition. Clients can talk to any node. Nodes know the partition assignment (e.g. from a coordinator like ZooKeeper).
- **Routing tier:** A separate layer (load balancer, proxy, or cluster-aware client) knows the partition assignment and routes requests.
- **Client knows assignment:** The client learns the partition map (e.g. from a coordinator) and talks to the right node directly. Fewer hops but clients must stay up to date.

Many systems use a **directory service** (e.g. etcd, ZooKeeper) that holds the partition-to-node mapping; nodes or clients subscribe to changes.

## Key Takeaways

- **Partitioning** lets you scale storage and write throughput by spreading data across nodes; it's often combined with replication.
- **Key range** partitioning supports range queries but can create hot spots; **hash** partitioning spreads load but loses efficient range scans.
- **Secondary indexes** force a choice: local indexes (scatter-gather reads) or global indexes (targeted reads, more complex writes).
- **Rebalancing** must be done carefully (fixed partitions, dynamic partitioning, or proportional); minimize data movement and avoid single points of failure.
- **Request routing** requires a consistent view of which partition lives on which node—via a directory service, routing tier, or client-side assignment.
