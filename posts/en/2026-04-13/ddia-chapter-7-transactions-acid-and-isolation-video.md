---
title: "Transactions, ACID, and Isolation Levels — DDIA Chapter 7 (Video)"
date: "2026-04-13"
excerpt: "Live stream walkthrough of DDIA Chapter 7: why transactions matter, ACID, isolation levels and naming pitfalls, Postgres MVCC and vacuum, and MySQL/InnoDB undo logs."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "transactions", "acid", "isolation", "postgresql", "mysql", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=AiYvR8yBMaU"
collection: "ddia"
collectionOrder: 7
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

A **live stream** walkthrough of **Chapter 7 (Transactions)** from *Designing Data-Intensive Applications*. The presenter (from PlanetScale) frames transactions as central to why relational databases are widely used: they help with **concurrent reads and writes**, **failure on write**, and reasoning about **what actually persisted** when hardware or processes fail. The stream mixes book content with whiteboard-style diagrams and Q&A (e.g. Postgres vacuum, replicas).

## Why transactions and ACID

- **Transactions** group work so the database can offer **atomicity** (all-or-nothing) and clearer failure semantics—not only for single rows but for multi-statement operations.
- **ACID** is often cited for relational databases but parts of it are **informal**; the speaker highlights **atomicity, consistency, isolation, durability** as goals people want from many database systems, not only SQL.
- **Durability** in the chapter’s sense ties to **logs, checksums, and flush-to-disk**; in a broader ops sense it overlaps **replication** (many copies, regions, synchronous vs asynchronous) so that losing one disk or site does not mean losing the only copy of data.

## Isolation levels (names vs semantics)

- SQL defines **names** for isolation levels—**read uncommitted**, **read committed**, **repeatable read**, **serializable**—but the book stresses that **implementations differ**: the same label does not always mean identical behavior across engines.
- The discussion moves toward **what breaks** if isolation is too weak: **phantom reads**, unexpected overwrites, and inconsistencies when multiple transactions interleave—motivating why application teams must know their **default isolation level** and tune it deliberately.

## Snapshot isolation and Postgres-style MVCC

- **Snapshot isolation** (often tied to **MVCC**) means a transaction reads from a **consistent snapshot** of the database as of when the transaction started (or first read), rather than seeing every concurrent commit immediately.
- The stream explains **Postgres-style** behavior with **row versions** and **transaction IDs** (min/max visibility): updates can create **new row versions** while older transactions still see older versions until they finish.
- **Long-running transactions** are called out as costly: the system may need to **retain many old row versions** for that one snapshot, which hurts **storage and vacuum** pressure in OLTP workloads.

## Vacuum, autovacuum, and table bloat (Postgres)

- **VACUUM** (including **autovacuum**) reclaims **dead** row versions once no active transaction needs them—marking space reusable without always rewriting the whole table immediately.
- **VACUUM FULL**-style operations can **rebuild** a table to reclaim disk more aggressively but may require stronger locking—relevant for large tables.
- If writes outpace vacuum, **table bloat** can grow: on-disk size much larger than “logical” data because many obsolete versions remain.

## MySQL / InnoDB: in-place updates and the undo log

- Contrasted with Postgres creating new row versions on many updates, **InnoDB** often **updates rows in place** in its B-tree storage, with different trade-offs for bloat.
- For **repeatable read** / snapshot semantics, InnoDB relies on an **undo log** to reconstruct **older row images** for transactions that started earlier—so snapshot isolation does not require keeping full duplicate rows on the main page for every change.

## Key takeaways

- **Transactions and isolation** are practical knobs: wrong assumptions cause subtle bugs under concurrency.
- **Isolation level names** are standardized in theory but **not portable in behavior**—check your engine’s docs.
- **MVCC** (Postgres) and **undo logs** (InnoDB) are two ways to implement **snapshot-style** reads while writes continue.
- **Operational follow-through** matters: **vacuum/autovacuum**, **long transactions**, and **write volume** interact with **disk growth and performance**.
