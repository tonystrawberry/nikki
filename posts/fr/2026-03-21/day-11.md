---
title: "Jour 11"
date: "2026-03-21"
excerpt: "Suite prep AWS Certified ZCloudOps : scalabilité, HA, types ELB, ALB (target groups, routage, X-Forwarded), démo pratique ALB avec health checks."
author: "Tony Duong"
category: "daily"
tags: ["aws", "zcloudops", "scalability", "high-availability", "load-balancer", "elb", "alb", "ecs", "cloud"]
---

## Aujourd'hui, j'ai :

- poursuivi la prep AWS Certified ZCloudOps : visionné [Scalabilité et haute disponibilité expliquées](/fr/posts/aws-scalability-and-high-availability) — scaling vertical vs horizontal (scale up vs scale out), HA multi-ZA, analogie du centre d'appels et exemples AWS (EC2, RDS Multi AZ)
- visionné [AWS Elastic Load Balancer expliqué](/fr/posts/aws-elastic-load-balancer-explained) — rôle des load balancers, types ELB (CLB, ALB, NLB, GWLB), health checks, SSL termination, security groups (EC2 n'accepte que le trafic venant du SG du LB)
- visionné [AWS Application Load Balancer Deep Dive](/fr/posts/aws-application-load-balancer-alb) — HTTP layer 7, target groups (EC2, ECS, Lambda, IPs privées), routage path/host/query/headers, X-Forwarded-For/Port/Proto, un ALB pour plusieurs apps vs un CLB par app
- pratiqué [démo ALB pratique](/fr/posts/aws-alb-hands-on-demo) — lancé 2 instances EC2, créé ALB avec target group, vérifié load balancing round-robin et health checks (arrêt instance → unhealthy → plus de trafic ; démarrage → healthy à nouveau)

---
*Traduit par Claude*
