---
title: "AWS Application Load Balancer (ALB) Deep Dive"
date: "2026-03-21"
excerpt: "Layer 7 HTTP load balancer: target groups, routing rules (path, host, query string, headers), X-Forwarded-* headers, and support for EC2, ECS, Lambda, private IPs."
author: "Tony Duong"
category: "note"
tags: ["aws", "alb", "load-balancer", "ec2", "ecs", "lambda", "microservices", "zcloudops", "cloud"]
---

## Overview

The **Application Load Balancer (ALB)** is a **layer 7** load balancer that works only with HTTP. It routes traffic to multiple HTTP applications across machines grouped in **target groups**. One ALB can front many applications—unlike the Classic Load Balancer, which requires one CLB per application.

## ALB Features

- **HTTP/2 and WebSocket** support
- **Redirects** — e.g. HTTP → HTTPS at the load balancer
- **Routing rules** — route to different target groups based on:
  - **Path** — `example.com/users` vs `example.com/posts` → different target groups
  - **Host name** — `one.example.com` vs `other.example.com` → different target groups
  - **Query strings** — `?Platform=Mobile` vs `?Platform=Desktop`
  - **Headers**
- **Port mapping** — redirect to dynamic ports on ECS (useful for containers)
- **Multiple apps per ALB** — ideal for microservices and container-based workloads

## Target Groups

Target groups are the backends an ALB routes to. Supported targets:

| Target type | Use case |
|-------------|----------|
| **EC2 instances** | Often managed by Auto Scaling Groups |
| **ECS tasks** | Container-based apps |
| **Lambda functions** | Serverless backend |
| **Private IP addresses** | On-premises servers in your data center |

Health checks are configured **per target group**.

## Routing Example

- One ALB with two target groups:
  - Target group 1: user app (route `/user`)
  - Target group 2: search app (route `/search`)
- Rules: path-based routing sends `/user` → group 1, `/search` → group 2.

Another example: query-string routing — `?Platform=Mobile` → EC2 target group, `?Platform=Desktop` → on-prem private-IP target group.

## X-Forwarded-* Headers

The ALB performs **connection termination**. The EC2 instance sees the load balancer’s private IP, not the client’s. Client information is passed in headers:

- **X-Forwarded-For** — client IP (e.g. `12.34.56.78`)
- **X-Forwarded-Port** — port used by the client
- **X-Forwarded-Proto** — protocol (HTTP or HTTPS)

The application must read these headers to obtain the original client IP, port, and protocol.

## ALB vs Classic Load Balancer

| | ALB | Classic (CLB) |
|---|-----|----------------|
| Apps per LB | Many (via target groups) | One per CLB |
| Routing | Path, host, query, headers | Limited |
| HTTP/2, WebSocket | Yes | No |
| Dynamic port mapping | Yes (ECS) | No |

## Key Takeaways

- ALB is layer 7 only (HTTP); use it for web apps, microservices, and containers.
- Target groups group backends; health checks are per target group.
- Routing rules: path, host, query string, headers.
- Use **X-Forwarded-For**, **X-Forwarded-Port**, **X-Forwarded-Proto** to get client info in apps.
- ALB can route to EC2, ECS, Lambda, and private IPs (on-prem).
