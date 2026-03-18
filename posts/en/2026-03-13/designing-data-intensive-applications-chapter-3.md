---
title: "Designing Data-Intensive Applications: Chapter 3"
date: "2026-03-13"
excerpt: "Livestream walkthrough of DDIA Chapter 3 — visual explanations of row vs column storage, B-trees vs LSM trees, and why OLTP and OLAP databases are engineered differently."
author: "Tony Duong"
category: "note"
tags: ["databases", "ddia", "storage-engines", "b-trees", "lsm-trees"]
youtubeUrl: "https://www.youtube.com/watch?v=LHWgQn8F7tU"
collection: "ddia"
collectionOrder: 3
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

A livestream walkthrough of DDIA Chapter 3: Storage and Retrieval. The presenter draws diagrams and explains how databases store and retrieve data at the disk level, focusing on two main themes: OLTP vs OLAP databases and how their different access patterns lead to fundamentally different storage layouts.

## OLTP vs OLAP: Two Different Worlds

**OLTP (Online Transaction Processing):**
- Powers web apps — MySQL, Postgres, SQLite, Oracle
- Short, fast transactions (sub-millisecond)
- Mostly reads (80-90%), fewer writes (10-20%)
- Queries fetch small numbers of rows by key (e.g., `SELECT * FROM users WHERE id = 2`)
- Databases: MySQL, Postgres, SQLite

**OLAP (Online Analytical Processing):**
- Powers business intelligence and analytics
- Scans over large amounts of data ("all products sold this year", "user trends over 6 months")
- Queries take longer, and that's fine — not user-facing
- Data is extracted from OLTP databases via ETL (Extract–Transform–Load) into a dedicated data warehouse

**Why separate them?** Running heavy analytical scans on an OLTP database would cause cache thrashing and slow down the application for end users.

## Row-Oriented Storage (OLTP)

In OLTP databases, data is stored **by row** on disk:

```
[ID:1, Ben, ben@hi.com, 1234 Fifth St] [ID:2, Zed, zed@mail.com, 5678 Oak Ave] [ID:3, Ally, ...]
```

This layout is optimal when queries typically:
- Select a single row or a small set of rows
- Need all or most columns from those rows
- Access data by primary key

Since all columns for a row are physically adjacent on disk, a single page read gives you everything you need for that row.

## B-Trees: The OLTP Index

B-trees are the dominant indexing structure in OLTP databases:
- Nodes are sized to match disk page size (typically 4 KB)
- Each node contains multiple key-value pairs — efficient for disk I/O since reads happen in page-sized chunks
- Search traverses from root to leaf, reading one page per level

**MySQL vs Postgres implementation:**
- MySQL (InnoDB): stores actual row data in the B-tree leaf nodes (clustered index)
- Postgres: stores row data in a "heap file" (a big array of pages), and B-tree indexes contain pointers into that heap file
- Both support secondary B-tree indexes

**Trade-offs:** B-trees leave empty space in nodes for future insertions, and random writes require traversing parent nodes. Great for general-purpose workloads, but not optimal for high-volume sequential writes.

## Column-Oriented Storage (OLAP)

In OLAP databases, data is stored **by column**:

```
Names:     [Ben, Zed, Ally, ...]
Emails:    [ben@hi.com, zed@mail.com, ally@x.com, ...]
Addresses: [1234 Fifth St, 5678 Oak Ave, ...]
```

**Why this matters for analytics:**
- Analytical queries typically scan many rows but only need a few columns (e.g., `SELECT AVG(price) FROM sales WHERE date > '2025-01-01'`)
- With row storage, you'd load every column for every row — wasted I/O
- With column storage, you only read the columns the query actually needs

**Column ordering:** rows must be in the same order across all column files so you can reconstruct which values belong together.

## Column Compression

Columns are highly compressible because they contain repetitive data:
- Thousands of users share the same name
- Emails share common substrings (`@gmail.com` appears millions of times)
- Dates repeat frequently (many events on the same day)

Techniques include bitmap encoding and run-length encoding. Compression reduces storage size and speeds up queries by reducing I/O — especially important since OLAP databases can reach petabytes of historical data.

## LSM Trees: Optimized for Writes

LSM trees (Log-Structured Merge Trees) are designed for workloads with high write throughput:
- Click event streams, log ingestion, metrics collection
- Continuous, high-pace sequential data

**How they differ from B-trees:**
- B-trees update pages in place and leave empty space for future writes — good for read-heavy workloads
- LSM trees buffer writes in memory and flush sorted segments to disk, then merge in the background — much better write throughput

**Used by:** Cassandra, ClickHouse, RocksDB, LevelDB

**Trade-off:** B-trees give more predictable read latency; LSM trees give higher write throughput but reads may need to check multiple structures.

## The Simplest Database

The chapter starts with a fun thought experiment: you can build a functional key-value database in 6 lines of bash — append key-value pairs to a file on write, grep through it on read. It works, but illustrates why real databases are millions of lines of code: this approach has O(n) reads, no transaction support, no concurrency handling, and no durability guarantees.

## Key Takeaways

- OLTP and OLAP databases exist because their access patterns are fundamentally different — don't run analytics on your production database
- Row storage groups all columns for a row together — optimal for fetching individual records
- Column storage groups all values for a column together — optimal for scanning and aggregating large datasets
- B-trees are the workhorse of OLTP indexing, sized to match disk pages for efficient I/O
- LSM trees trade read latency for write throughput, making them ideal for high-ingestion workloads
- Column compression (bitmap encoding, run-length encoding) is critical for OLAP databases that can reach petabyte scale
