---
title: "DDIA Chapter 3: Storage and Retrieval"
date: "2026-03-13"
excerpt: "How databases store and retrieve data — from log-structured engines (LSM-trees) to page-oriented engines (B-trees), plus indexing strategies, OLTP vs OLAP, and column-oriented storage."
author: "Tony Duong"
category: "note"
tags: ["databases", "ddia", "architecture"]
---

## Overview

This chapter explores how databases internally store data and how they find it again when asked. Understanding storage engines helps you pick the right database for your workload and tune its performance. The two main families are **log-structured** engines and **page-oriented** engines.

## Data Structures That Power Your Database

### The Simplest Database: An Append-Only Log

The simplest storage engine is an append-only file. Writing is fast (O(1)), but reading requires scanning the whole file (O(n)). To make reads efficient, we need an **index** — an additional data structure derived from the primary data that acts as a signpost.

**Key trade-off:** Indexes speed up reads but slow down writes, because the index must be updated on every write. This is why databases don't index everything by default — you choose indexes based on your query patterns.

### Hash Indexes

The simplest indexing strategy: keep an in-memory hash map where every key maps to the byte offset in the data file. This is essentially what Bitcask (the default storage engine in Riak) does.

- Works well when you have a limited number of keys with frequent updates
- All keys must fit in memory
- Range queries are not efficient (you can't scan between `kitty00000` and `kitty99999`)

**Compaction:** Since the log is append-only, it grows forever. Compaction merges log segments by throwing away duplicate keys and keeping only the most recent value.

### SSTables and LSM-Trees

**Sorted String Tables (SSTables):** Like hash-indexed segments, but key-value pairs are sorted by key.

Advantages over hash indexes:
- Merging segments is efficient (like merge sort)
- Sparse in-memory index is sufficient — you don't need every key, just some keys, and scan between them
- Blocks between index entries can be compressed

**LSM-Trees (Log-Structured Merge-Trees):** The full storage engine pattern:
1. Writes go to an in-memory balanced tree (the **memtable**)
2. When the memtable gets big enough, flush it to disk as an SSTable
3. Reads check the memtable first, then the most recent on-disk segment, then the next-older, etc.
4. Background merging and compaction keeps the number of segments manageable

Used by: LevelDB, RocksDB, Cassandra, HBase, Lucene (for its term dictionary).

**Bloom filters** are commonly used to avoid unnecessary disk reads for keys that don't exist.

### B-Trees

The most widely used indexing structure. B-trees break the database into fixed-size **pages** (typically 4 KB) and read or write one page at a time — matching the underlying hardware.

- Each page is identified by an address (like a pointer on disk)
- A page contains keys and references to child pages
- The **branching factor** is typically several hundred
- A four-level B-tree with 4 KB pages and a branching factor of 500 can store up to 256 TB

**Key difference from LSM-trees:** B-trees modify pages **in place**, while LSM-trees only append to files and never modify in place.

**Write-ahead log (WAL):** Before modifying any page, the database writes the change to an append-only log. This allows crash recovery.

### B-Trees vs. LSM-Trees

| Aspect | LSM-Trees | B-Trees |
|--------|-----------|---------|
| Write throughput | Generally higher | Lower (every write updates the tree) |
| Write amplification | Can be high due to compaction | One write to WAL + one to page |
| Read performance | Slower (check multiple structures) | Faster (one definitive location) |
| Compression | Better (no page fragmentation) | Some wasted space in pages |
| Predictability | Compaction can interfere with reads | More predictable latency |
| Transactions | Harder (key may exist in multiple segments) | Easier (key exists in exactly one place) |

## Other Indexing Structures

### Secondary Indexes

Unlike primary indexes, secondary indexes don't uniquely identify a record. They can either:
- Store the list of matching row IDs (like a postings list)
- Have each entry point to the row's location

### Storing Values Within the Index

- **Clustered index:** Stores the actual row data within the index (e.g., InnoDB primary key)
- **Non-clustered index:** Stores a reference (heap file pointer) to where the row lives
- **Covering index:** Stores some columns within the index to allow some queries to be answered by the index alone

### Multi-Column Indexes

- **Concatenated index:** Appends columns in a defined order (like a phone book: last name, then first name)
- **Multi-dimensional indexes:** For queries that need to search on multiple columns simultaneously (e.g., latitude AND longitude). R-trees are a common choice.

### Full-Text Search and Fuzzy Indexes

Lucene uses an SSTable-like structure for its term dictionary but adds a finite state automaton (similar to a trie) to support fuzzy matching within a given edit distance.

### In-Memory Databases

Keeping everything in memory (e.g., VoltDB, MemSQL, Redis):
- Faster not because of avoiding disk reads (the OS cache handles that) but because they avoid the overhead of encoding data for disk
- Can offer data structures that are hard to implement with disk-based indexes (e.g., Redis priority queues and sets)
- Durability can be achieved through WAL, snapshots, or replication

## Transaction Processing vs. Analytics (OLTP vs. OLAP)

| Property | OLTP | OLAP |
|----------|------|------|
| Read pattern | Small number of records, fetched by key | Aggregate over large number of records |
| Write pattern | Random-access, low-latency writes from user input | Bulk import (ETL) or event stream |
| Primary users | End users via web application | Internal analysts |
| Dataset size | GB to TB | TB to PB |
| Bottleneck | Disk seek time | Disk bandwidth |

### Data Warehousing

A separate read-optimized copy of the data, extracted from OLTP systems via **ETL** (Extract–Transform–Load). Uses a **star schema** (or **snowflake schema**):

- **Fact table:** Each row represents an event (e.g., a sale). Can be extremely large (billions of rows).
- **Dimension tables:** Describe the who, what, where, when, why of the event (e.g., product, customer, store, date).

## Column-Oriented Storage

In a typical data warehouse query, you access a few columns from a table with hundreds of columns. Row-oriented storage wastes I/O by loading all columns.

**Column-oriented storage** stores all values from each column together. This makes analytical queries much faster because you only read the columns you need.

### Column Compression

Columns often have many repeated values, making them very compressible:

- **Bitmap encoding:** One bitmap per distinct value in the column. Works well when the number of distinct values is small relative to the number of rows.
- **Run-length encoding:** Compress the bitmaps further.

Compressed columns also enable **vectorized processing** — operating on chunks of compressed column data directly using CPU SIMD instructions.

### Sort Order in Column Storage

Rows must be in the same order across all column files. You can choose a sort order (e.g., by date, then by product) to help common queries and improve compression of the first sort key.

**Multiple sort orders:** Store the same data sorted in different ways (like having multiple secondary indexes). Vertica uses this approach.

### Writing to Column Storage

LSM-trees work well here: writes go to an in-memory store (row-oriented), then are flushed to disk in columnar format and merged with existing column files.

### Aggregation: Materialized Views and Data Cubes

- **Materialized view:** A precomputed cache of common aggregates (e.g., `SUM(amount) GROUP BY product_id, date`). Updated when underlying data changes.
- **Data cube (OLAP cube):** A grid of aggregates along multiple dimensions. Very fast for precomputed queries but inflexible for ad-hoc analysis.

## Key Takeaways

1. **Two families of storage engines:** Log-structured (LSM-trees) append data and merge in the background; page-oriented (B-trees) update fixed-size pages in place
2. **LSM-trees** tend to have higher write throughput; **B-trees** tend to have more predictable read performance
3. **OLTP and OLAP** have fundamentally different access patterns and are best served by different storage engines
4. **Column-oriented storage** dramatically improves analytical query performance by only reading relevant columns and enabling aggressive compression
5. **Indexing is a trade-off:** every index speeds up reads but adds overhead to writes — choose based on your query patterns
6. **In-memory databases** win not by avoiding disk reads but by avoiding the overhead of disk-oriented data encoding
