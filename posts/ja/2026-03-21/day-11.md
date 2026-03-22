---
title: "11日目"
date: "2026-03-21"
excerpt: "AWS Certified ZCloudOps の勉強継続：スケーラビリティ、HA、ELB種類、ALB（ターゲットグループ、ルーティング、X-Forwarded）、ALBハンズオン。"
author: "Tony Duong"
category: "daily"
tags: ["aws", "zcloudops", "scalability", "high-availability", "load-balancer", "elb", "alb", "ecs", "cloud"]
---

## 今日やったこと：

- AWS Certified ZCloudOps の勉強を継続：[スケーラビリティと高可用性](/ja/posts/aws-scalability-and-high-availability) を視聴 — 垂直 vs 水平スケーリング（scale up vs scale out）、AZ 間の HA、コールセンターの比喩と AWS 例（EC2、RDS Multi AZ）
- [AWS Elastic Load Balancer 解説](/ja/posts/aws-elastic-load-balancer-explained) を視聴 — ロードバランサーの役割、ELB 種類（CLB、ALB、NLB、GWLB）、ヘルスチェック、SSL終端、セキュリティグループ（EC2 は LB の SG からのトラフィックのみ受付）
- [AWS Application Load Balancer Deep Dive](/ja/posts/aws-application-load-balancer-alb) を視聴 — レイヤ7 HTTP、ターゲットグループ（EC2、ECS、Lambda、プライベートIP）、path/host/query/headers でのルーティング、X-Forwarded-For/Port/Proto、1 ALB で複数アプリ vs 1 CLB  per アプリ
- [ALB ハンズオンデモ](/ja/posts/aws-alb-hands-on-demo) を実践 — EC2 インスタンス2台起動、ALB とターゲットグループ作成、ラウンドロビン負荷分散とヘルスチェック確認（インスタンス停止→unhealthy→トラフィック停止；起動→再び healthy）

---
*Claudeによる翻訳*
