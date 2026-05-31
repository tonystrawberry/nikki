---
title: "Hands-On Demo: AWS Application Load Balancer"
date: "2026-03-21"
excerpt: "Step-by-step: launch EC2 instances, create an ALB with a target group, verify load balancing and health checks (stop/start instance). Includes NLB hands-on."
author: "Tony Duong"
category: "note"
tags: ["aws", "alb", "load-balancer", "ec2", "target-group", "health-check", "nlb", "zcloudops", "cloud"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 6
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Overview

A hands-on tutorial for creating an **Application Load Balancer (ALB)** in front of two EC2 instances, with a target group and health checks. The demo shows load balancing in action and how the ALB reacts when an instance is stopped. A second section covers building and debugging an **NLB**.

## Step 1: Launch EC2 instances

- Launch **2 instances** (e.g. `My First Instance`, `My Second Instance`)
- **AMI:** Amazon Linux 2
- **Instance type:** t2.micro
- **Key pair:** None (use EC2 Instance Connect if SSH is needed)
- **Security group:** Allow HTTP (80) and SSH (22)
- **User data:** Script to start a simple HTTP server returning "hello world from my instance" (instance ID varies)

After launch, test each public IP to confirm both serve "hello world" with different instance IDs. Two instances → two IPs; the goal is one URL that balances between both.

## Step 2: Create the Application Load Balancer

- **Name:** DemoALB (or similar)
- **Scheme:** Internet-facing
- **IP:** IPv4
- **Network mapping:** Deploy in all available AZs
- **Security group:** New SG (e.g. `demo-sg-load-balancer`) allowing **HTTP (80) from 0.0.0.0/0**

### Load balancer types (reference)

| Type | Use case |
|------|----------|
| **ALB** | HTTP/HTTPS, web apps |
| **NLB** | TCP/UDP, TLS, ultra-high throughput and low latency |
| **GWLB** | Security appliances, intrusion detection, firewalls |
| **CLB** | Deprecated; avoid for new workloads |

## Step 3: Target group and listener

1. **Target group:**
   - Type: Instances
   - Name: `demo-tg-alb`
   - Protocol: HTTP, port 80
   - Register both EC2 instances on port 80

2. **Listener:** HTTP:80 → forward to `demo-tg-alb`

3. Create the load balancer.

## Step 4: Verify load balancing

- Copy the ALB DNS name and open it in a browser
- Response: "hello world"
- **Refresh several times:** the instance ID in the response changes, showing traffic is distributed between both instances (round-robin behavior)

## Step 5: Health checks in action

- Open the target group → **Targets**. Both instances are **Healthy**
- **Stop** one EC2 instance
- After ~30 s, that instance appears **Unhealthy** in the target group
- Refresh the ALB URL: traffic goes only to the still-running instance
- **Start** the stopped instance again; after boot, it becomes **Healthy**
- Refreshing the ALB URL shows responses from both instances again

## Hands-on: Build and debug an NLB

### Step 1: Create NLB

- Name: `DemoNLB`
- Scheme: internet-facing, IPv4
- Enable multiple AZs/subnets
- Observe one fixed IPv4 per enabled AZ (or attach EIPs)
- Attach NLB security group (e.g. allow inbound port 80)

### Step 2: Create NLB target group

- Target type: instances
- Protocol/port: TCP:80
- Health check protocol: HTTP (valid because backend app is HTTP)
- Register both EC2 instances

### Step 3: Initial failure and root cause

At first, targets may stay unhealthy and NLB DNS won't respond properly.

**Root cause:** EC2 security group only allowed HTTP from the ALB SG, not from the NLB SG.

### Step 4: Fix security groups

- Update EC2 SG inbound HTTP rules to also allow source = **NLB security group**
- Keep ALB SG rule if both ALB and NLB are used

After SG update: NLB target health turns healthy, NLB DNS returns app responses, and refreshing shows traffic balancing between both EC2 instances.

## Key takeaways

- ALB + target group = one URL for multiple instances
- Health checks cut traffic to unhealthy targets automatically
- Stopping an instance makes it unhealthy; the ALB bypasses that target
- Use ALB for HTTP/HTTPS; NLB for TCP/UDP and performance; GWLB for security appliances
- Correct security-group wiring (ALB/NLB → EC2) is critical for both security and architecture hygiene
