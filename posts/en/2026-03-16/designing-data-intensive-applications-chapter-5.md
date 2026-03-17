---
title: "Designing Data-Intensive Applications: Chapter 5"
date: "2026-03-16"
excerpt: "Notes from a live stream walking through DDIA Chapter 5 (Replication): single-leader setup, primary and read replicas, scaling reads, and high availability across availability zones."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "replication", "distributed-systems", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=lYCFreB8w_w"
---

## Overview

A live stream that walks through **Chapter 5 (Replication)** of *Designing Data-Intensive Applications*. The host uses diagrams (e.g. in Excalidraw) to explain single-leader replication, why you use it, and how it fits into cloud deployments. The book is recommended as a high-level reference for data systems; you can jump to a chapter (e.g. replication) when you need it.

## Single-Leader (Primary–Replica) Replication

- **Setup:** One **primary** node accepts all writes; one or more **replicas** (followers) receive a stream of changes and stay in sync. Terminology varies (primary/replica, master/slave, etc.).
- **Traffic flow:** All writes go to the primary. Replicas are **read-only**; read traffic can be sent to them from app servers. This matches many workloads where the majority of queries are reads (e.g. loading a profile, a timeline).
- **Scaling reads:** As traffic grows, you can add more replicas without taking down the primary or disrupting existing replica traffic. This scales read capacity well until you need to distribute data (sharding/partitioning).

## Why Replicate?

- **Read capacity:** Spread read load across replicas so the primary isn’t the bottleneck for reads.
- **Availability (often more important):** In the cloud, instances are ephemeral—they can fail, be decommissioned, or lose network connectivity. A single node going away for even 60 seconds can be unacceptable. With a primary and at least one replica (two is better), you can fail over if the primary is lost.
- **Placement:** Primary and replicas are typically spread across **availability zones** (AZs) within a region (e.g. US East 1, US West 1). Each AZ is in the same region but in a separate building with some geographic separation; providers try to make it unlikely that multiple AZs fail at once (different power, network links, etc.). Spreading nodes across AZs improves fault tolerance.

## Key Takeaways

- Single-leader replication is the standard pattern before you need sharding/partitioning; it’s what many managed DBs (e.g. PlanetScale) offer by default (e.g. primary + two replicas).
- Replication gives you both **read scaling** and **high availability**; the latter is often the more critical reason in production.
- Understanding regions and availability zones helps when placing your primary and replicas in the cloud.
