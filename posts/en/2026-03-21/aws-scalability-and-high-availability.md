---
title: "Scalability and High Availability Explained"
date: "2026-03-21"
excerpt: "Accessible overview of vertical vs horizontal scaling and high availability, with a call-center analogy and AWS examples (EC2, RDS Multi-AZ, Auto Scaling)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "scalability", "high-availability", "ec2", "rds", "asg", "zcloudops", "cloud"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 3
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Overview

A short primer on **scalability** and **high availability** — core concepts for cloud architecture and certifications. The content uses a call-center analogy and AWS examples to explain vertical vs horizontal scaling and the role of high availability.

## Scalability vs high availability

**Scalability** means your application or system can handle more load by adapting. This is related to, but distinct from, **high availability**.

**High availability** means running the same application in at least two data centers or Availability Zones so you survive the loss of one data center.

## Vertical scaling (scale up)

- **Definition:** Increase **instance size** (scale up or down).
- **Call-center analogy:** A junior operator handles 5 calls/min; a senior handles 10. Vertical scaling = make one operator more capable.
- **AWS example:** EC2 — move from `t2.micro` to `t2.large`. Instance sizes range from `t2.nano` (0.5 GB RAM, 1 vCPU) to `u-12tb1.metal` (12.3 TB RAM, 450 vCPUs).
- **Use case:** Common for **non-distributed systems** like databases (RDS, ElastiCache), where you scale by increasing instance type. Hardware limits cap vertical scaling.

## Horizontal scaling (scale out / elasticity)

- **Definition:** Increase the **number** of instances or systems.
- **Call-center analogy:** One operator is overloaded → hire a second, then a third, then six. Capacity grows by adding operators.
- **AWS terms:** **Scale out** = add instances; **scale in** = remove them. Used with Auto Scaling Groups and load balancers.
- **Constraint:** Requires **distributed systems**. Not every application can be distributed.
- **Typical usage:** Web apps and modern cloud workloads. EC2 makes horizontal scaling straightforward — launch new instances on demand.

## High availability (HA)

- **Definition:** Run the same application in **at least two data centers or Availability Zones** to survive a data-center failure.
- **Call-center analogy:** Three operators in New York, three in San Francisco. If New York loses connectivity, San Francisco keeps taking calls.
- **Passive HA:** One active, one standby (e.g. RDS Multi-AZ).
- **Active HA:** All instances serve traffic (e.g. horizontal scaling across multiple AZs).
- **AWS:** Auto Scaling Group or a load balancer with **multi-AZ** enabled.

## Auto Scaling Groups (ASG)

An **Auto Scaling Group** automates EC2 fleet size to match load:

- **Scale out:** add instances when load rises
- **Scale in:** remove instances when load drops

### Core capacity settings

- **Minimum capacity:** floor
- **Desired capacity:** target running count
- **Maximum capacity:** ceiling

ASG continuously tries to keep actual instance count at desired capacity (within min/max bounds).

### Why ASG + ELB is powerful

- New ASG instances auto-register into LB target groups
- Unhealthy instances can be terminated/replaced automatically
- Traffic distribution updates automatically as capacity changes

ASG itself has no direct cost; you pay for underlying resources (EC2, EBS, etc.).

## Launch templates + ASG integration

ASG launches instances using a **Launch Template** (launch configurations are legacy/deprecated).

Typical launch template data includes AMI, instance type, user data, security groups, EBS config, IAM role, SSH key pair, and network/subnet parameters.

In practice:

1. Create ASG from launch template
2. Select VPC/AZ spread
3. Attach target group(s) for ALB/NLB integration
4. Enable EC2 and ELB health checks
5. Set desired/min/max capacity

## ASG scaling policies

### Dynamic scaling

- **Target tracking:** keep metric near a target (e.g. CPU ~40%)
- **Simple scaling:** one alarm → fixed add/remove action
- **Step scaling:** different scale amounts by alarm magnitude

### Scheduled and predictive scaling

- **Scheduled:** used when demand timing is known in advance
- **Predictive:** uses historical patterns to forecast demand and scale ahead of time

## Instance refresh and warm pools

**Instance Refresh** is ASG-native rolling replacement for updating fleets to a new launch template version (for example, a new AMI). Set minimum healthy percentage and optionally apply warm-up time.

**Warm pools** reduce scale-out latency by keeping pre-initialized instances ready. On scale-out, ASG can move an instance from the warm pool into service faster than a full cold start.

## ASG lifecycle hooks and health checks

Lifecycle hooks pause instance transitions to run custom logic at launch or termination time. Hook events can be sent to EventBridge/SNS/SQS.

ASG health check types:

- **EC2 status checks** (default)
- **ELB health checks** (application-level via target group)
- **Custom health checks** via API/CLI

If an instance is unhealthy, ASG replaces it rather than relying on reboot-only recovery.

## AWS Auto Scaling service and scaling plans

Beyond EC2 ASGs, the **AWS Auto Scaling** service provides centralized scaling management across EC2 ASGs, ECS, DynamoDB, Aurora, and Spot Fleet.

Scaling plans can combine **dynamic scaling** (target tracking) and **predictive scaling** (forecast-based). Optimization presets include availability-focused, balanced, cost-focused, and custom.

## Key takeaways

- **Vertical scaling** = bigger instance; suited to non-distributed systems like databases.
- **Horizontal scaling** = more instances; suited to distributed systems like web apps. Scale out = add, scale in = remove.
- **High availability** = same workload across multiple AZs to survive failures.
- **ASG** keeps fleet size aligned with demand using min/desired/max + scaling policies.
- **Launch templates** are the foundation for reproducible ASG instance configuration.
