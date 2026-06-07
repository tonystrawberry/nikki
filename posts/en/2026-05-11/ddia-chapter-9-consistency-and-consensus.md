---
title: "DDIA Chapter 9: Consistency and Consensus (Made Simple)"
date: "2026-05-11"
excerpt: "An easy-to-understand walkthrough of the hardest chapter in Designing Data-Intensive Applications — how distributed systems agree on what's true."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "consistency", "consensus"]
collection: "ddia"
collectionOrder: 9
collectionTitle: "Designing Data-Intensive Applications"
---

Chapter 9 of *Designing Data-Intensive Applications* is famously the hardest in the book. It tackles a deceptively simple question: **how do multiple computers agree on what's true?** This article walks through the chapter's ideas with everyday analogies, so anyone can follow along.

## The Big Problem

Imagine three friends taking notes during a meeting. If they pass notes to each other but sometimes get distracted, sometimes drop notes, and sometimes write at the same time — how do you end up with one shared, agreed-upon version of the meeting?

That's the core of distributed systems. Computers (called **nodes**) work together, but networks are slow, messages get lost, and clocks drift. We need rules that let them agree even when things go wrong.

## Consistency: How "Up-to-Date" Should Data Look?

When you write data on one node and read it from another, what do you expect to see? Different guarantees give different answers.

### Eventual Consistency (the weakest)

"If no one writes for a while, eventually everyone will see the same thing."

Think of a group chat where messages take a few seconds to sync. If nobody types for a minute, everyone catches up. But during that minute, people might see different things.

This is fast and scalable but confusing. You might write something, refresh the page, and not see your own write!

### Linearizability (the strongest single-key guarantee)

"The system behaves *as if* there's only one copy of the data, and operations happen one at a time."

Imagine a single notebook that everyone takes turns writing in. The order is clear, and once you write something, everyone who reads next sees it.

**Why we want it:** locks, leader elections, and "uniqueness" constraints (like usernames) all break without it.

**Why it's hard:** it requires coordination across nodes, which is slow and fragile when the network has problems.

### The CAP Theorem (briefly)

You may have heard "pick 2 of: Consistency, Availability, Partition tolerance." DDIA argues this is misleading. A more accurate framing:

> When the network breaks, you must choose: stay consistent (refuse some requests) or stay available (risk serving stale data).

That's it. Networks **will** break, so you're really choosing between **CP** (consistent during partitions) and **AP** (available during partitions).

## Ordering: What Happened Before What?

Even without strict consistency, we often care about *order*. Did Alice send the message before Bob replied, or after?

### Causal Order

"If A caused B, then everyone should agree A happened first."

If you post a photo and then someone comments on it, everyone should see the photo before the comment — otherwise the comment looks like it appeared out of nowhere.

Causal order is weaker than linearizability (it doesn't order *unrelated* events) but it's often enough.

### Total Order

"Every event has a global position in a single timeline."

Linearizability gives you total order. So does a system with a single leader that assigns sequence numbers (1, 2, 3, …) to every write.

### Lamport Timestamps

A clever trick: every node keeps a counter. When it sends a message, it tags it with the counter. When it receives a message, it bumps its counter to be higher than the one received. This lets nodes agree on a consistent (though not necessarily real-time) order of events — without any central coordinator.

The catch: Lamport timestamps tell you the order **after** all messages arrive. They don't help you decide order **in real time** (e.g., "is this username already taken right now?").

## Total Order Broadcast

This is a stronger primitive: **every node receives the same messages in the same order.**

If you have it, you can build basically anything — a database, a lock service, a leader election. But to build it, you need...

## Consensus: Agreeing on a Single Value

Consensus is the heart of the chapter. **Definition:** several nodes propose values, and they must all agree on *one* of those values, even if some nodes crash.

This sounds easy. It is not. Imagine the three friends from the start, but now two of them might fall asleep mid-conversation, and messages might arrive in the wrong order. How do they still agree?

### Two-Phase Commit (2PC) — The Naive Attempt

Used for distributed transactions. One node is the **coordinator**, others are **participants**.

1. **Prepare:** coordinator asks everyone "can you commit?"
2. **Commit:** if everyone says yes, coordinator says "commit!" If anyone says no, "abort!"

**The problem:** if the coordinator crashes after step 1 but before step 2, participants are **stuck**. They've promised to commit but don't know whether to actually do it. They sit there holding locks, waiting forever.

2PC is technically a consensus protocol, but a fragile one — it's not fault-tolerant.

### Real Consensus Algorithms

**Paxos, Raft, Zab, Viewstamped Replication** — these are the famous fault-tolerant consensus algorithms. They share a common shape:

- Elect a **leader** (one node) who proposes values.
- The leader gets a **majority** of nodes to agree before committing.
- If the leader crashes, the others elect a new one.

The "majority" trick is key: as long as **more than half** the nodes are alive and can talk, the system makes progress. With 5 nodes, you can lose 2 and still function.

These algorithms are hard to implement correctly (Paxos especially has a reputation for being mind-bending). Most people don't write them from scratch — they use a tested implementation.

### The Limits of Consensus

Consensus is powerful but expensive:

- It needs a majority — so it stops when too many nodes are down.
- It's slow — every decision requires multiple network round-trips.
- It assumes nodes are honest (no Byzantine faults). Different algorithms (like PBFT) handle malicious nodes but are even slower.

That's why we don't use consensus for every operation. We use it sparingly, for the **really important decisions**.

## Coordination Services: ZooKeeper, etcd, Consul

In practice, you rarely run consensus yourself. Instead, you use a small cluster (usually 3 or 5 nodes) running **ZooKeeper** or **etcd**. These provide:

- **Leader election:** "who's in charge right now?"
- **Service discovery:** "where can I find service X?"
- **Distributed locks:** "I'm doing this — nobody else touch it."
- **Configuration:** small bits of shared state.

Your main application servers can be hundreds of nodes, but they all defer the hard decisions to the small consensus cluster. This is how systems like Kafka, Kubernetes, and many databases stay coordinated.

## Key Takeaways

- **Consistency** is a spectrum. The stronger the guarantee, the slower and more fragile the system.
- **Linearizability** = "behaves like a single copy." Useful but expensive.
- **Causal consistency** is often enough and much cheaper.
- **Lamport timestamps** order events without a central clock, but only after the fact.
- **Total order broadcast** is equivalent to consensus — they can be built from each other.
- **2PC** is fragile because the coordinator is a single point of failure.
- **Paxos/Raft** are fault-tolerant consensus algorithms that need a majority to make progress.
- **ZooKeeper/etcd** package consensus into a service you can use without implementing it yourself.
- The deeper lesson: **strong agreement requires coordination, and coordination has a cost.** Engineers design systems by deciding which decisions are worth that cost.
