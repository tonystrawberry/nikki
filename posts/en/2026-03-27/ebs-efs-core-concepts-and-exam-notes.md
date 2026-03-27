---
title: "EBS and EFS Core Concepts and Exam Notes"
date: "2026-03-27"
excerpt: "A practical exam-focused summary of EBS volumes, snapshots, EFS file systems, and when to choose each for AWS workloads."
author: "Tony Duong"
category: "note"
tags: ["aws", "ec2", "ebs", "efs", "storage", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 5
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Why This Topic Matters

EC2 storage questions appear frequently in AWS exams and real operations work. The key is understanding when to use block storage (`EBS`) versus shared file storage (`EFS`), plus how snapshots, lifecycle features, and pricing tradeoffs affect architecture decisions.

## EBS Fundamentals

Amazon EBS (Elastic Block Store) is a **network-attached block volume** for EC2.

- attachable to EC2 instances while running
- persists data independently from instance lifecycle
- usually attached to one instance at a time (except specific multi-attach cases)
- scoped to one Availability Zone (AZ)

Think of EBS as a network USB drive: detachable and re-attachable, but AZ-bound.

## EBS Attachment and AZ Constraints

Important operational behavior:

- an EBS volume created in `eu-west-1b` can only attach to instances in `eu-west-1b`
- to use data in another AZ, create a snapshot and restore a new volume in the target AZ
- one EC2 instance can have multiple EBS volumes
- volumes can exist unattached and be attached later on demand

This AZ boundary is a common exam trap.

## Delete-on-Termination Behavior

When launching EC2, each attached EBS volume has `DeleteOnTermination`.

- root volume: commonly `true` by default
- additional data volumes: commonly `false` by default

Implication: terminating an instance usually deletes root storage but keeps non-root data volumes unless configured otherwise.

## EBS Volume Types (Exam-Relevant View)

### General Purpose SSD

- `gp3`: baseline performance with independently configurable IOPS and throughput
- `gp2`: older model where performance and volume size are more coupled

Use for general workloads, boot volumes, dev/test, and balanced price/performance.

### Provisioned IOPS SSD

- `io1` / `io2` (including io2 Block Express)
- for low-latency, high-consistency, mission-critical workloads (often databases)
- supports very high IOPS and advanced performance guarantees

### HDD Options

- `st1` (throughput optimized HDD): large sequential throughput workloads
- `sc1` (cold HDD): lowest-cost infrequent access workloads

`st1` and `sc1` are not for boot volumes.

## EBS Snapshots: Backup and Mobility

Snapshots capture EBS volume state and are the base mechanism for:

- backup and restore
- cross-AZ migration (restore snapshot in another AZ)
- cross-Region copy for disaster recovery
- creating encrypted copies/volumes using KMS during copy/restore workflows

Best practice: snapshots are safer when write activity is minimized to avoid consistency issues.

## Snapshot Operations and Cost Features

### Data Lifecycle Manager (DLM)

Automates snapshot/AMI creation, retention, and cleanup through tag-based policies.

- schedule recurring backups
- retain a fixed number of snapshots
- support cross-account/cross-Region copy policies

### Fast Snapshot Restore (FSR)

Reduces first-read latency on restored volumes by pre-initializing blocks.

- useful when immediate high performance is required after restore
- expensive if left enabled continuously
- practical pattern: enable temporarily, restore volume, then disable

### Snapshot Archive Tier

Move snapshots to archive tier for lower storage cost (often significant savings), with slower restore times (hours, not immediate).

### Recycle Bin for Snapshots

Protects against accidental deletion through retention rules (e.g., days to months before permanent deletion).

## EFS Fundamentals

Amazon EFS (Elastic File System) is a **managed NFS file system**.

- mountable from many EC2 instances simultaneously
- works across multiple AZs in a region
- ideal for shared-file workloads (CMS, web content, shared app data)
- Linux-focused (NFS/POSIX semantics)
- pay-per-use, automatically scales capacity

Compared to EBS, EFS is generally more expensive but offers shared, multi-AZ file access.

## EFS Performance and Throughput Modes

### Performance modes

- `General Purpose`: lower latency, default for many apps
- `Max I/O`: higher throughput and parallelism, higher latency

### Throughput modes

- `Bursting`: throughput scales with stored data
- `Provisioned`: explicitly set throughput target
- `Elastic`: auto-adjust throughput based on demand (good for unpredictable traffic)

## EFS Storage Classes and Lifecycle

EFS can move files between tiers using lifecycle policies:

- `Standard` for frequently accessed data
- `EFS-IA` for infrequent access
- `Archive` for rarely accessed data

Correct lifecycle tuning can significantly reduce storage costs while preserving shared-file architecture.

## Hands-On Insights to Remember

- EBS appears under EC2 block devices; attach/detach actions are straightforward
- AZ mismatch prevents EBS attachment to target instance
- terminating EC2 demonstrates `DeleteOnTermination` impact immediately
- EFS mount targets/security groups are critical for cross-AZ access
- two instances in different AZs can read/write the same EFS-mounted file path

## EBS vs EFS Quick Decision Guide

Use **EBS** when you need:

- block storage for a single instance
- boot volumes
- predictable performance per volume

Use **EFS** when you need:

- shared file system for many Linux instances
- multi-AZ concurrent access
- elastic capacity without pre-provisioning size

## Key Takeaways

- EBS is AZ-scoped block storage, ideal for EC2-centric disks and boot volumes
- snapshots are central for backup, migration, and DR workflows
- EFS is shared, scalable NFS storage across AZs for Linux workloads
- cost/performance tuning depends on selecting the right volume class, throughput mode, and lifecycle policy
- exam questions usually test **scope (single instance vs shared)**, **AZ behavior**, and **cost/performance tradeoffs**

