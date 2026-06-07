---
title: "DDIA Chapter 7: Transactions"
date: "2026-04-13"
excerpt: "Summary of Kleppmann's chapter on transactions: ACID, isolation anomalies, snapshot isolation, two-phase locking, and serializable snapshot isolation."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "transactions", "acid", "isolation", "distributed-systems", "mvcc"]
collection: "ddia"
collectionOrder: 7
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

Chapter 7 of *Designing Data-Intensive Applications* is about **transactions**: grouping reads and writes into a logical unit so the database can provide **safety guarantees** (often summarized as **ACID**) despite crashes and concurrent access. Much of the chapter is about **isolation**: what anomalies can appear when transactions run concurrently, and which **isolation levels** trade off performance against how “serial-like” execution looks.

## Why Transactions Matter

- **All-or-nothing:** Either the whole transaction commits or it has no effect (**atomicity**), which simplifies error handling when a write touches several rows or indexes.
- **Crash recovery:** The database uses **logs** (e.g. WAL) so committed work survives restarts; aborted transactions are rolled back.
- **Concurrent access:** Without clear rules, interleaved reads/writes produce **race conditions** that are hard for application code to reason about.

**ACID** is a useful label but not standardized: “consistency” often mixes database constraints with application invariants.

## Anomalies and Isolation Levels

Weak isolation exists because **true serial execution** (one transaction at a time) is often too slow. Weaker levels allow schedules that are not equivalent to *any* serial order of the same transactions. Common problems:

| Phenomenon | Idea |
|------------|------|
| **Dirty read** | Reading data another transaction wrote but has not committed. |
| **Dirty write** | Overwriting uncommitted data from another transaction. |
| **Read skew (non-repeatable read)** | In one transaction, the same query twice sees different committed snapshots because another transaction committed in between. |
| **Lost update** | Two transactions read-modify-write the same state; one update clobbers the other. |
| **Write skew** | Two transactions each read overlapping rows and make consistent *local* decisions, but together they violate an invariant (classic example: two on-call doctors both going off duty). |
| **Phantom read** | A transaction re-runs a range query and sees new rows that match (another transaction inserted them). |

**Snapshot isolation** gives each transaction a **consistent snapshot** of the database as of the start of the transaction (or first read), avoiding many read-skew issues for reads, but **does not automatically prevent write skew**—you may need **explicit constraints** or **serializable** behavior.

## Read Committed

A common default: you only ever read **committed** data, and **short write locks** prevent dirty writes. It does **not** promise a stable snapshot across a transaction—non-repeatable reads are allowed.

## Snapshot Isolation and Multi-Version Concurrency Control (MVCC)

Snapshot isolation is often implemented with **MVCC**: the database keeps several versions of rows; a transaction sees versions visible at its snapshot timestamp. Writers create new versions; readers typically do not block writers and vice versa, subject to rules for **first-writer-wins** or **abort on conflict**.

## Serializable Isolation

Serializable execution means the result is **as if** transactions ran one after another in some order—no lost updates, write skew, or phantoms (for the guarantees the system claims).

Implementation strategies discussed in the chapter include:

- **Actual serial execution:** Run transactions on a single thread (or partition) when the workload fits; can be very fast for in-memory systems with short transactions.
- **Two-phase locking (2PL):** Classic strong locking; **predicate / index-range locks** address phantoms by locking access paths, not only existing rows.
- **Serializable snapshot isolation (SSI):** Optimistic approach on top of snapshot isolation—track **dependencies** between concurrent transactions and **abort** when a dangerous pattern appears (e.g. serialization graph cycles). Aims for snapshot-like performance with serializable semantics.

## Generic Rails/RSpec Example: Testing a Lost Update

Here is a simplified pattern for testing concurrent writes in a Rails app. Two workers update different keys in the same JSON state, and the test verifies both updates persist.

```ruby
# spec/models/job_concurrency_spec.rb
require "rails_helper"

RSpec.describe "concurrent updates", type: :model do
  it "keeps both updates without lost update" do
    job = Job.create!(
      state: {
        "node_a" => { "status" => "pending" },
        "node_b" => { "status" => "pending" }
      }
    )

    ready = Queue.new
    go = Queue.new

    threads = %w[node_a node_b].map do |node_key|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          local = Job.find(job.id)
          ready << true
          go.pop
          local.update_node_status!(node_key, "succeeded")
        end
      end
    end

    2.times { ready.pop } # both workers prepared
    2.times { go << true } # release at nearly same time
    threads.each(&:join)

    reloaded = Job.find(job.id)
    expect(reloaded.state.dig("node_a", "status")).to eq("succeeded")
    expect(reloaded.state.dig("node_b", "status")).to eq("succeeded")
  end
end
```

```ruby
# app/models/job.rb
class Job < ApplicationRecord
  # Example column: state :jsonb
  def update_node_status!(node_key, new_status)
    with_lock do
      data = state.deep_dup
      data[node_key] ||= {}
      data[node_key]["status"] = new_status
      update!(state: data)
    end
  end
end
```

`with_lock` makes the read-modify-write atomic at the row level, so one worker does not accidentally overwrite the other worker's change.

## Key Takeaways

- **Transactions** bundle work for atomicity and clearer failure semantics; **isolation** defines which concurrent interleavings are allowed.
- Weaker isolation improves throughput but introduces specific **anomalies**; understand **read skew**, **lost updates**, **write skew**, and **phantoms** when choosing a level.
- **Snapshot isolation + MVCC** is widely used for read-heavy workloads; it is **not** the same as full serializability for all write patterns.
- **Serializable** behavior can be achieved via **serial execution**, **2PL** (with predicate locking for phantoms), or **SSI**—each with different operational trade-offs.
