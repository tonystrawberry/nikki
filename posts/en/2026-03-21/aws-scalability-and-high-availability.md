---
title: "Scalability and High Availability Explained"
date: "2026-03-21"
excerpt: "Beginner-friendly overview of vertical vs horizontal scaling and high availability, with a call center analogy and AWS examples (EC2, RDS Multi AZ, Auto Scaling)."
author: "Tony Duong"
category: "note"
tags: ["aws", "scalability", "high-availability", "ec2", "rds", "zcloudops", "cloud"]
---

## Overview

A short lecture on **scalability** and **high availability**—essential concepts for cloud architectures and certification exams. The content uses a call center analogy and AWS examples to explain the differences between vertical and horizontal scaling, and how high availability fits in.

## Scalability vs High Availability

**Scalability** means your application or system can handle a greater load by adapting. It is different from (but linked to) **high availability**.

**High availability** means your application runs in at least two data centers or availability zones so it can survive a data center loss.

## Vertical Scalability (Scale Up)

- **Definition:** Increase the **size** of your instance (scale up or down).
- **Call center analogy:** A junior operator handles 5 calls/min; a senior operator handles 10 calls/min. Scaling up = making one operator more capable.
- **AWS example:** EC2—upgrade from `t2.micro` to `t2.large`. Instance sizes range from `t2.nano` (0.5 GB RAM, 1 vCPU) to `u-12tb1.metal` (12.3 TB RAM, 450 vCPUs).
- **When to use:** Common for **non-distributed systems** such as databases (RDS, ElastiCache), where you scale by upgrading the underlying instance type. Hardware limits cap how far you can scale vertically.

## Horizontal Scalability (Scale Out / Elasticity)

- **Definition:** Increase the **number** of instances or systems.
- **Call center analogy:** One operator is overloaded → hire a second, then a third, then six. Capacity grows by adding more operators.
- **AWS terms:** **Scale out** = increase instances; **scale in** = decrease instances. Used with Auto Scaling Groups and load balancers.
- **Requirement:** Implies **distributed systems**. Not every application can be distributed.
- **Typical use:** Web apps and modern applications. Cloud offerings (e.g. EC2) make horizontal scaling easy—spin up new instances as needed.

## High Availability (HA)

- **Definition:** Run the same application in **at least two data centers or availability zones** to survive a data center outage.
- **Call center analogy:** Three operators in New York, three in San Francisco. If New York loses connectivity, San Francisco still handles calls.
- **Passive HA:** One active, one standby (e.g. RDS Multi AZ).
- **Active HA:** All instances actively serve traffic (e.g. horizontal scaling across multiple AZs).
- **AWS:** Auto Scaling Group or load balancer with **multi-AZ** enabled.

## Key Takeaways

- **Vertical scaling** = bigger instance; good for non-distributed systems like databases.
- **Horizontal scaling** = more instances; good for distributed systems like web apps. Scale out = add, scale in = remove.
- **High availability** = same workload across multiple AZs (or data centers) to survive outages.
- HA can be passive (standby) or active (all nodes serving traffic).
