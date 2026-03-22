---
title: "AWS Elastic Load Balancer (ELB) Explained"
date: "2026-03-21"
excerpt: "Overview of AWS load balancers: what they do, why use them, health checks, four types (CLB, ALB, NLB, GWLB), and security group rules."
author: "Tony Duong"
category: "note"
tags: ["aws", "load-balancer", "elb", "alb", "nlb", "gwlb", "ec2", "zcloudops", "cloud"]
---

## Overview

A **load balancer** is a server (or set of servers) that forwards incoming traffic to multiple backend or downstream EC2 instances. Users connect to a single endpoint (the load balancer) and don't know which backend instance handles their request. The load is distributed across instances as more users connect.

## Why Use a Load Balancer?

- **Single point of access** — users connect to one endpoint; backend topology is hidden.
- **Seamless failure handling** — health checks detect unhealthy instances; traffic is not sent to them.
- **Health checks** — verify downstream instances before routing traffic.
- **SSL termination** — offload HTTPS decryption at the load balancer.
- **Stickiness** — use cookies to route a user to the same instance across requests.
- **High availability across zones** — distribute traffic across AZs.
- **Separate public from private traffic** — internal vs external load balancers.

## Elastic Load Balancer (ELB) — Managed by AWS

- AWS manages the load balancer: upgrades, maintenance, high availability.
- Cheaper and easier than running your own; scalability is handled for you.
- **Integrations:** EC2, Auto Scaling Groups, ECS, Certificate Manager, CloudWatch, Route 53, WAF, Global Accelerator.

## Health Checks

- ELB checks instance health using a **port** and **route** (e.g. HTTP on port 4567, path `/health`).
- If the instance does not return an OK (typically HTTP 200), it is marked **unhealthy** and receives no traffic.
- Health checks are essential for avoiding failed instances.

## Four Types of AWS Load Balancers

| Type | Abbr | Year | Protocols | Use case |
|------|------|------|-----------|----------|
| **Classic** | CLB | 2009 (V1) | HTTP, HTTPS, TCP, SSL, Security CP | Deprecated; still available but not recommended |
| **Application** | ALB | 2016 | HTTP, HTTPS, WebSocket | Web apps, layer 7 routing |
| **Network** | NLB | 2017 | TCP, TLS, Security CP, UDP | Low latency, layer 4, extreme performance |
| **Gateway** | GWLB | 2020 | IP (network layer) | Third-party appliances, security/virtual appliances |

- Prefer **ALB** and **NLB** (and GWLB when relevant) over Classic.
- Load balancers can be **internal** (private) or **external** (public).

## Security Groups

- **Load balancer SG:** Allow inbound HTTP (80) and HTTPS (443) from `0.0.0.0/0` so users can reach it.
- **EC2 SG:** Allow HTTP (80) and HTTPS (443) from the **load balancer’s security group**, not from arbitrary IP ranges.
- This restricts EC2 to traffic originating from the load balancer only, improving security.

## Key Takeaways

- Load balancers distribute traffic across downstream instances and hide backend topology.
- ELB is fully managed; use it instead of self-managed solutions.
- Health checks keep traffic away from unhealthy instances.
- Use ALB for HTTP/HTTPS and WebSocket; NLB for TCP/UDP and low latency; avoid Classic.
- Tie EC2 security groups to the load balancer SG so only LB traffic reaches the instances.
