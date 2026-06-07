---
title: "AWS Application Load Balancer (ALB) — Deep Dive"
date: "2026-03-21"
excerpt: "Layer 7 HTTP load balancer: target groups, routing rules (path, host, query string, headers), X-Forwarded-* headers, health checks, metrics, and weighted target groups."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "alb", "load-balancer", "ec2", "ecs", "lambda", "microservices", "zcloudops", "cloud"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 5
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Overview

The **Application Load Balancer (ALB)** is a **layer 7** load balancer that works with HTTP only. It routes traffic to multiple HTTP applications grouped into **target groups**. One ALB can serve multiple applications — unlike the Classic Load Balancer, which typically requires one CLB per application.

## ALB capabilities

- **HTTP/2 and WebSocket** support
- **Redirects** — e.g. HTTP → HTTPS at the load balancer
- **Rule-based routing** by:
  - **Path** — `/users` vs `/posts` → different target groups
  - **Host** — `api.example.com` vs `app.example.com`
  - **Query string** — `?Platform=Mobile` vs `?Platform=Desktop`
  - **Headers**
- **Dynamic port mapping** for ECS containers
- **Multiple apps per ALB** — suited to microservices and containerized workloads

## Target groups

ALB routes requests to target groups. Supported target types:

| Target type | Use case |
|-------------|----------|
| **EC2 instances** | Often managed by Auto Scaling Groups |
| **ECS tasks** | Containerized apps |
| **Lambda functions** | Serverless backend |
| **Private IP addresses** | On-prem servers in your data center |

Health checks are configured **per target group**.

## X-Forwarded-* headers

ALB terminates connections. The EC2 instance sees the load balancer's private IP, not the client's. Original client context is passed via:

- **X-Forwarded-For** — client IP
- **X-Forwarded-Port** — port used by the client
- **X-Forwarded-Proto** — protocol (HTTP or HTTPS)

Your application should read these headers when it needs original client details.

## Security group hardening

A common pattern: prevent direct public access to EC2 instances and only allow traffic through the ALB.

- Remove EC2 inbound HTTP from `0.0.0.0/0`
- Add EC2 inbound HTTP with **source = ALB security group**
- Direct EC2 public-IP access times out; ALB endpoint still works

## ALB listener rules

ALB listeners support rule-based request handling with **conditions + actions + priority**.

- Example condition: path pattern `/error`
- Example action: return fixed response (status `404`, body `"not found"`)
- Priority determines which rule wins (lower number = higher priority)

Rule actions: forward to target group(s), redirect, or return fixed response. Rule conditions: host header, HTTP method, path pattern, source IP, HTTP headers, query string.

## Weighted forwarding (blue/green / canary)

A single forwarding rule can send traffic to multiple target groups with weights. Example: Target Group A weight `8`, Target Group B weight `2` → ~80/20 traffic split.

## ALB health checks

Health checks are configured on target groups:

- **Protocol:** HTTP or HTTPS
- **Path:** `/` or dedicated endpoint like `/health`
- **Timeout, interval, healthy/unhealthy thresholds**
- **Success codes:** HTTP response codes considered healthy

Target health states: `initial`, `healthy`, `unhealthy`, `unused`, `draining`, `unavailable`.

If all targets are unhealthy, ELB may still try routing to unhealthy targets as a best-effort fallback.

## ALB errors, metrics, and logs

### Error families

- **4XX** → client-side issues
- **5XX** → server-side/backend/LB issues (`503` = no healthy targets; `504` = gateway timeout)

### Key CloudWatch metrics

- `HealthyHostCount` / `UnHealthyHostCount`
- `RequestCount` / `RequestCountPerTarget`
- `HTTPCode_Target_2XX/3XX/4XX/5XX`
- `SurgeQueueLength`, `SpilloverCount`

ALB access logs can be delivered to S3. ALB injects `X-Amzn-Trace-Id` for request correlation.

## Target group advanced attributes

- **Deregistration delay** (connection draining window)
- **Slow start duration** — gradually ramp traffic to newly healthy targets
- **Routing algorithm** — round robin or least outstanding requests
- **Stickiness** — type, cookie settings, duration

## ALB vs Classic Load Balancer

| | ALB | Classic (CLB) |
|---|-----|----------------|
| Apps per LB | Multiple (via target groups) | One per CLB |
| Routing | Path, host, query, headers | Limited |
| HTTP/2, WebSocket | Yes | No |
| Dynamic port mapping | Yes (ECS) | No |

## Key takeaways

- ALB is layer 7 only (HTTP); use it for web apps, microservices, and containers
- Target groups group backends; health checks are per target group
- Routing rules: path, host, query string, headers
- Use **X-Forwarded-For**, **X-Forwarded-Port**, **X-Forwarded-Proto** for client info
- ALB can route to EC2, ECS, Lambda, and private IPs (on-prem)
- Weighted rules enable safer blue/green or canary migrations
