---
title: "System Design Interview Chapter 6: Design a Key-Value Store"
date: "2026-08-02"
excerpt: "Notes from Alex Xu — CAP, data partitioning, quorum replication, consistency models, vector clocks, gossip failure detection, and Merkle trees for anti-entropy."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "interview", "key-value", "cap", "vector-clocks", "dynamo", "quorum"]
coverImage: ""
youtubeUrl: ""
collection: "system-design-interview"
collectionOrder: 6
collectionTitle: "System Design Interview"
---

Notes from *System Design Interview*, Chapter 6 — design a distributed **key-value store** (Dynamo-inspired): `put(key, value)` / `get(key)` at massive scale with high availability.

Deeper dive on conflict detection: [Vector Clocks and Inconsistency Resolution](/en/posts/vector-clocks-and-inconsistency-resolution). Related data-model context: [NoSQL in Four Categories](/en/posts/nosql-four-categories-key-value-document-column-graph).

## Requirements (typical)

- Put / get by key
- Millions of keys, high QPS
- Highly available (AP-leaning in the classic Dynamo telling)
- Tunable consistency
- Handle node failure and network partitions

## CAP theorem (interview framing)

Under a **network partition**, you choose:

| Choice | Meaning |
|--------|---------|
| **CP** | Refuse some requests to keep a single up-to-date value |
| **AP** | Keep serving; replicas may diverge temporarily |

**CA** without partition tolerance is not a real option for distributed stores — partitions happen. Design for them.

```mermaid
flowchart TB
  P{Network partition?}
  P -->|yes| Choice{Prefer?}
  Choice -->|consistency| CP[CP: refuse some requests]
  Choice -->|availability| AP[AP: serve, may diverge]
  P -->|no| Happy[C + A both feasible locally]
```

This chapter leans **AP + eventual consistency**, with knobs (quorum) to trade latency vs freshness.

## Building blocks

### 1. Data layout

Keys hashed onto a ring ([consistent hashing](/en/posts/system-design-interview-chapter-5-design-consistent-hashing)), often with **virtual nodes**. Each key lives on a **preference list** of N replicas (the next N distinct nodes clockwise).

```mermaid
flowchart LR
  subgraph pref["Preference list N=3"]
    K["key X"] --> A[Node A]
    A --> B[Node B]
    B --> C[Node C]
  end
```

### 2. Replication

Write to multiple replicas for durability/availability. Replication factor `N` is a config (commonly 3 in examples).

### 3. Quorum

```text
N = replica count
W = write quorum (acks needed for a successful write)
R = read quorum (responses needed for a successful read)
```

Rule of thumb:

```text
W + R > N  →  read and write quorums overlap → strong-ish consistency for that key
W + R ≤ N  →  possible stale reads; higher availability / lower latency
```

Classic example: `N=3, W=2, R=2`.

```mermaid
flowchart TB
  Coord[Coordinator] -->|write| A[(A)]
  Coord -->|write| B[(B)]
  Coord -->|write| C[(C)]
  A -->|ack| Coord
  B -->|ack| Coord
  C -.->|slow / down| Coord
  Coord -->|"W=2 acks → success"| OK[Write OK]
```

### 4. Consistency models

| Model | Meaning |
|-------|---------|
| Strong | After a successful write, every subsequent read sees it |
| Weak | No hard guarantee on when readers see updates |
| Eventual | If writes stop, replicas converge to the same value |

AP stores usually target **eventual** consistency and let clients reconcile conflicts.

## Handling conflicts: versioning

Concurrent writes to different replicas create **siblings**. Wall-clock “last write wins” can **silently drop data** when clocks skew.

**Vector clocks** track causal history per node (`[A:2, B:1]`). On read:

- One version’s clock dominates → safe to keep that version
- Clocks diverge → return **both** versions to the client to merge (e.g. shopping-cart union)

See the [vector clocks note](/en/posts/vector-clocks-and-inconsistency-resolution) for the full cart walkthrough.

```mermaid
flowchart TB
  V1["Version A\n[A:2] eggs"] --> Cmp{Compare clocks}
  V2["Version B\n[A:1,B:1] bacon"] --> Cmp
  Cmp -->|one dominates| Keep[Keep winner]
  Cmp -->|diverge| Sib[Return siblings]
  Sib --> App[Client merges]
  App --> V3["Merged\n[A:2,B:1,C:1]"]
```

## Membership and failure detection

- Nodes learn about each other via **gossip**
- Failure detection via heartbeats / suspicion (not always perfect — distinguish temporary slowdown from death)
- Preference lists and hinted handoff keep writes available when a target replica is down

```mermaid
flowchart LR
  N1[Node 1] <-->|gossip| N2[Node 2]
  N2 <-->|gossip| N3[Node 3]
  N3 <-->|gossip| N1
```

## Anti-entropy: Merkle trees

Gossip catches “who is alive.” **Merkle trees** catch “whose data drifted.”

- Each replica builds a tree of hashes over key ranges
- Compare roots → only walk mismatched branches
- Sync only the divergent ranges instead of scanning everything

```mermaid
flowchart TB
  R1["Root hash A"] --> L1[Left]
  R1 --> Rgt1[Right]
  R2["Root hash B"] --> L2[Left]
  R2 --> Rgt2[Right]
  R1 -.->|roots differ| Walk[Walk mismatched branch only]
  Walk --> Sync[Sync divergent keys]
```

Used for background repair after partitions or prolonged isolation.

## Read/write path (sketch)

**Write** (`N=3`, `W=2`)

```mermaid
sequenceDiagram
  participant Client
  participant Coord as Coordinator
  participant A
  participant B
  participant C
  Client->>Coord: put(key, value)
  par Replicate
    Coord->>A: write
    Coord->>B: write
    Coord->>C: write
  end
  A-->>Coord: ack
  B-->>Coord: ack
  Note over Coord: W=2 reached
  Coord-->>Client: success
```

**Read** (`R=2`)

```mermaid
sequenceDiagram
  participant Client
  participant Coord as Coordinator
  participant A
  participant B
  Client->>Coord: get(key)
  Coord->>A: read
  Coord->>B: read
  A-->>Coord: version v1
  B-->>Coord: version v2
  alt clocks agree / one dominates
    Coord-->>Client: value
  else diverge
    Coord-->>Client: siblings to merge
  end
```

## Other pieces worth naming

- **Sloppy quorum + hinted handoff** — write to healthy nodes temporarily; hand hints back when the intended replica returns
- **Tunable consistency** — clients or APIs choose `R`/`W` per call
- **Local persistence** — commit log + memtable / SSTable-style storage on each node (implementation detail; mention briefly)

## Interview takeaway

A Dynamo-style KV store is a **stack of techniques**, not one trick:

```text
consistent hashing
  + N-way replication
  + quorum (R, W)
  + vector clocks for concurrency
  + gossip for membership
  + Merkle trees for repair
```

Lead with CAP and API, then deepen on quorum + conflict resolution — that is where most interview discussion lands.
