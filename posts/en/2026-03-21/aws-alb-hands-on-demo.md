---
title: "AWS Application Load Balancer Hands-On Demo"
date: "2026-03-21"
excerpt: "Step-by-step: launch EC2 instances, create ALB with target group, verify load balancing and health checks (stop/start instance)."
author: "Tony Duong"
category: "note"
tags: ["aws", "alb", "load-balancer", "ec2", "target-group", "health-check", "zcloudops", "cloud"]
---

## Overview

A hands-on walkthrough of creating an **Application Load Balancer (ALB)** in front of two EC2 instances, with a target group and health checks. The demo shows load balancing in action and how the ALB reacts when an instance is stopped.

## Step 1: Launch EC2 Instances

- Launch **2 instances** (e.g. `My First Instance`, `My Second Instance`)
- **AMI:** Amazon Linux 2
- **Instance type:** t2.micro
- **Key pair:** None (use EC2 Instance Connect if SSH needed)
- **Security group:** Allow HTTP (80) and SSH (22), e.g. Launch Wizard 1
- **User data:** Script to run a simple HTTP server returning "hello world from my instance" (instance ID varies per instance)

After launch, hit each instance’s public IP directly to confirm both serve "hello world" with different instance identifiers. Two instances → two different IPs; the goal is one URL that balances across both.

## Step 2: Create Application Load Balancer

- **Name:** DemoALB (or similar)
- **Scheme:** Internet-facing
- **IP:** IPv4
- **Network mapping:** Deploy in all available AZs
- **Security group:** New SG (e.g. `demo-sg-load-balancer`) allowing **HTTP (80) from 0.0.0.0/0**

### Load Balancer Types (Quick Reference)

| Type | Use case |
|------|----------|
| **ALB** | HTTP/HTTPS, web apps |
| **NLB** | TCP/UDP, TLS, very high throughput and low latency |
| **GWLB** | Security appliances, intrusion detection, firewalls |
| **CLB** | Deprecated; avoid for new workloads |

## Step 3: Target Group and Listener

1. **Target group:**
   - Type: Instances
   - Name: `demo-tg-alb`
   - Protocol: HTTP, port 80
   - Register both EC2 instances on port 80
   - Create target group

2. **Listener:**
   - HTTP:80 → forward to `demo-tg-alb`

3. Create the load balancer.

## Step 4: Verify Load Balancing

- Copy the ALB DNS name and open it in a browser.
- You get a "hello world" response.
- **Refresh repeatedly:** the instance ID in the response changes, showing traffic is distributed between the two instances (round-robin behavior).

## Step 5: Health Checks in Action

- Open the target group → **Targets**. Both instances show as **Healthy**.
- **Stop** one EC2 instance.
- After ~30 seconds, that instance appears **Unhealthy** in the target group.
- Refresh the ALB URL: traffic goes only to the instance that is still running.
- **Start** the stopped instance again; after it boots, it becomes **Healthy** again.
- Refreshing the ALB URL shows responses from both instances again.

## Key Takeaways

- ALB + target group gives one URL for multiple instances.
- Health checks stop traffic to unhealthy targets automatically.
- Stopping an instance makes it unhealthy; the ALB routes around it.
- Use ALB for HTTP/HTTPS; NLB for TCP/UDP and performance; GWLB for security appliances.
