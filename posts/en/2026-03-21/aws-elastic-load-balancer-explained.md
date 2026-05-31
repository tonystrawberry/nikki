---
title: "AWS Elastic Load Balancer (ELB) Explained"
date: "2026-03-21"
excerpt: "Overview of AWS load balancers: role, benefits, health checks, four types (CLB, ALB, NLB, GWLB), security groups, sticky sessions, and TLS."
author: "Tony Duong"
category: "note"
tags: ["aws", "load-balancer", "elb", "alb", "nlb", "gwlb", "ec2", "zcloudops", "cloud"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 4
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Overview

A **load balancer** is a server (or cluster) that forwards incoming traffic to multiple downstream EC2 instances. Users connect to a single endpoint (the load balancer) and do not know which backend instance handles their request. Load is distributed across instances as users connect.

## Why use a load balancer?

- **Single access point** — users connect to one endpoint; backend topology is hidden
- **Transparent failure handling** — health checks detect failed instances; traffic is not sent to them
- **Health checks** — verify downstream instances before routing traffic
- **SSL termination** — decode HTTPS at the load balancer
- **Stickiness** — use cookies to route a user to the same instance across requests
- **Multi-AZ high availability** — distribute traffic across Availability Zones
- **Separate public and private traffic** — internal vs internet-facing load balancers

## Elastic Load Balancer (ELB) — managed by AWS

- AWS manages the load balancer: updates, maintenance, high availability
- Cheaper and simpler than self-managed load balancers; scalability is included
- **Integrations:** EC2, Auto Scaling Groups, ECS, Certificate Manager, CloudWatch, Route 53, WAF, Global Accelerator

## Health checks

- ELB checks instance health via a **port** and **path** (e.g. HTTP on port 80, path `/health`)
- If the instance does not respond OK (typically HTTP 200), it is marked **unhealthy** and receives no traffic
- Health checks are essential for avoiding failed instances

## Four types of AWS load balancers

| Type | Abbr. | Layer / protocols | Typical use |
|------|-------|-------------------|-------------|
| **Classic** | CLB | HTTP, HTTPS, TCP, SSL (legacy) | Deprecated; avoid for new workloads |
| **Application** | ALB | Layer 7, HTTP/HTTPS/WebSocket | Web apps and HTTP routing |
| **Network** | NLB | Layer 4, TCP/TLS/UDP | Ultra-high performance, low latency |
| **Gateway** | GWLB | Layer 3 (IP) | Security appliances / traffic inspection |

Prefer **ALB** and **NLB** (and GWLB when relevant) over Classic. Load balancers can be **internal** (private) or **internet-facing** (public).

## Network Load Balancer (NLB)

The **Network Load Balancer** operates at **Layer 4** and is designed for TCP/UDP workloads.

### When to choose NLB

- Need **TCP/UDP** (or TLS over TCP) handling
- Need **ultra-high performance** (millions of requests/sec) with low latency
- Need **static IPs** per AZ (including optional Elastic IP assignment)

NLB target groups can route to EC2 instances, private IP addresses (on-prem), or even an ALB (NLB in front of ALB). Health checks can use TCP, HTTP, or HTTPS.

## Gateway Load Balancer (GWLB)

The **Gateway Load Balancer** is built for security and traffic-inspection use cases.

Use GWLB when all network traffic should pass through third-party virtual appliances (firewalls, IDS/IPS, deep packet inspection) before reaching apps. GWLB operates at **Layer 3** (IP packet level). Exam signal: **GENEVE on port 6081** → think GWLB.

## Security groups

- **Load balancer SG:** Allow HTTP (80) and HTTPS (443) inbound from `0.0.0.0/0` so users can reach it
- **EC2 SG:** Allow HTTP (80) and HTTPS (443) from the **load balancer security group**, not from arbitrary IP ranges
- This ensures only traffic from the load balancer reaches EC2 instances

## Sticky sessions (session affinity)

Sticky sessions ensure repeated requests from the same client route to the same backend target for a period of time.

- **Why:** Preserve session-bound state on a specific backend instance
- **Trade-off:** Can create traffic imbalance if some users are much more active
- **Supported on:** CLB, ALB, NLB
- **Cookie models (ALB):** application-based cookie or duration-based cookie (`AWSALB`)

## Cross-zone load balancing

Cross-zone controls whether each load balancer node distributes only within its own AZ or across all registered targets in all AZs.

| Type | Default | Inter-AZ cost when enabled |
|------|---------|----------------------------|
| **ALB** | On (effectively) | No inter-AZ LB data-transfer charge |
| **NLB** | Off | May incur inter-AZ data charges |
| **GWLB** | Off | May incur inter-AZ data charges |
| **CLB** | Off | Legacy behavior |

## SSL/TLS and SNI

SSL/TLS certificates provide **in-transit encryption** between clients and the load balancer. Typical pattern: client → LB over HTTPS, LB terminates TLS, LB → backend over HTTP or HTTPS. Certificates are typically managed in **ACM**.

**SNI (Server Name Indication)** enables serving multiple HTTPS hostnames from one load balancer endpoint. **ALB** and **NLB** support multiple certificates via SNI; **CLB** does not.

## Connection draining / deregistration delay

When a target is deregistered or becomes unhealthy, the load balancer stops sending **new** requests but allows **in-flight** requests to finish (default delay: 300 seconds, range 0–3600).

## Key takeaways

- Load balancers distribute traffic across downstream instances and hide backend topology
- ELB is fully managed; use it instead of self-managed solutions
- Health checks prevent sending traffic to failed instances
- Use ALB for HTTP/HTTPS and WebSocket; NLB for TCP/UDP and low latency; GWLB for security appliances
- Link EC2 security groups to the load balancer SG so only LB traffic reaches instances
