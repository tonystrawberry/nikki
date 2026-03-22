---
title: "Database Sharding! Designing Data-Intensive Applications Chapter 6"
date: "2026-03-19"
excerpt: "Video walkthrough of DDIA Chapter 6 on partitioning (sharding): diagrams and explanations of key-range vs hash partitioning, secondary indexes, rebalancing, and request routing."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "partitioning", "sharding", "distributed-systems", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=iR07_nnzvQg"
collection: "ddia"
collectionOrder: 6
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

A video walkthrough of **Chapter 6 (Partitioning)** from *Designing Data-Intensive Applications*. The presenter uses diagrams to explain partitioning (often called sharding): splitting data across many machines. The book uses the term "partitioning" for distributing data across nodes; the same idea is commonly called "sharding" in practice.

## Key topics covered

- **Partitioning vs sharding:** Same concept—partitioning can mean splitting tables on one disk or distributing data across machines; here it's the latter.
- **Partitioning strategies:** Key-range partitioning (e.g. A–M, N–Z) vs hash-based partitioning; trade-offs between range queries and even load.
- **Secondary indexes:** Local (scatter-gather) vs global indexes when data is partitioned.
- **Rebalancing:** Moving partitions when adding or removing nodes; fixed partitions, dynamic partitioning, proportional partitioning.
- **Request routing:** How clients find the right node for a key (routing tier, gossip, or metadata on the client).

## Key takeaways

- Partitioning (sharding) scales write throughput and storage beyond a single machine; it's used together with replication.
- Hash partitioning avoids hot spots but loses efficient range scans; key-range partitioning is the opposite.
- Secondary indexes with partitioning require either scatter-gather (local index) or more complex writes (global index).
- Rebalancing should minimize data movement and avoid single points of failure.

