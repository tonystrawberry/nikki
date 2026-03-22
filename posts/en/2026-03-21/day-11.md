---
title: "Day 11"
date: "2026-03-21"
excerpt: "Continued AWS Certified ZCloudOps prep: scalability, HA, ELB types, ALB (target groups, routing, X-Forwarded), hands-on ALB demo with health checks."
author: "Tony Duong"
category: "daily"
tags: ["aws", "zcloudops", "scalability", "high-availability", "load-balancer", "elb", "alb", "ecs", "cloud"]
---

## Today, I:

- continued studying for AWS Certified ZCloudOps: watched [Scalability and High Availability Explained](/en/posts/aws-scalability-and-high-availability) — vertical vs horizontal scaling (scale up vs scale out), high availability across AZs, call center analogy and AWS examples (EC2, RDS Multi AZ)
- watched [AWS Elastic Load Balancer Explained](/en/posts/aws-elastic-load-balancer-explained) — what load balancers do, ELB types (CLB, ALB, NLB, GWLB), health checks, SSL termination, security groups (EC2 only accepts traffic from LB SG)
- watched [AWS Application Load Balancer Deep Dive](/en/posts/aws-application-load-balancer-alb) — layer 7 HTTP, target groups (EC2, ECS, Lambda, private IPs), routing by path/host/query/headers, X-Forwarded-For/Port/Proto, one ALB for many apps vs one CLB per app
- practiced [ALB hands-on demo](/en/posts/aws-alb-hands-on-demo) — launched 2 EC2 instances, created ALB with target group, verified round-robin load balancing and health checks (stop instance → unhealthy → traffic stops; start → healthy again)
