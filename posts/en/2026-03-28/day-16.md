---
title: "Day 16"
date: "2026-03-28"
excerpt: "I covered S3 through observability and account management, including service catalog, budgets, and cost tooling for CloudOps prep"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "s3", "storage", "cloudfront", "cdn", "global-accelerator", "rds", "databases", "cloudwatch", "eventbridge", "cloudtrail", "aws-config", "service-quotas", "health", "organizations", "control-tower", "service-catalog", "budgets", "cost-explorer", "logs", "alarms", "synthetics", "monitoring", "cloudops", "certification"]
---

## Today, I:

- watched section 10 on amazon s3 (introduction) and wrote this [Amazon S3 Introduction: Buckets, Objects, Security, and Versioning](/en/posts/amazon-s3-introduction-buckets-objects-security-versioning) note for my aws cloudops engineer associate prep
- extended that note with versioning propagation on first enable, crr/srr replication, batch replication for existing objects, delete marker vs permanent-delete behavior, no chaining, and cross-account owner override ([same post](/en/posts/amazon-s3-introduction-buckets-objects-security-versioning))
- continued aws certification prep by watching the full cloudfront section (plus global accelerator in that track) and wrote [AWS CloudFront and Global Accelerator: CDN, Caching, Origins, and Edge Networking](/en/posts/aws-cloudfront-global-accelerator-cdn-notes)
- moved on to the aws databases section and built out [AWS RDS, Aurora, RDS Proxy, and ElastiCache](/en/posts/aws-rds-overview-storage-scaling-read-replicas-and-multi-az) over several study blocks
- expanded the same cloudwatch post with anomaly detection, cross-region dashboards, logs and metric filters, insights vs live tail, export vs subscription filters, data protection, alarms and composite alarms, ec2 recovery, synthetics canaries in vpc, and container insights in [AWS Observability and Governance: CloudWatch, EventBridge, CloudTrail, and Config](/en/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics)
- continued that note with internet monitor, network synthetic monitor for direct connect and vpn paths, and eventbridge (default/partner/custom buses, rules and schedules, archive and replay, schema registry, cross-account bus policies, content filtering, input transformers, pipes, and api destinations) ([same post](/en/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics))
- added eventbridge pipes and enrichment, retries and sqs dlq, ssm automation targets, two-way cross-account permissions, service quotas alarms vs trusted advisor, and cloudtrail trails management vs data events and insights ([same post](/en/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics))
- added eventbridge rules on cloudtrail api names, cloudtrail log digest and sha-256 integrity, org trails and member restrictions, aws config recorder and rules, aggregators vs stacksets for rule rollout, ssm remediation examples, and a cloudwatch vs cloudtrail vs config comparison ([same post](/en/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics))
- moved into aws account management and wrote [AWS Account Management: Health Dashboard, Organizations, SCPs, and Control Tower](/en/posts/aws-health-dashboard-organizations-control-tower) for service vs account vs org health, health to eventbridge automations, organizations ou invites consolidated billing ri sharing scps and exam-style denies, principalorgid and tag policies, and control tower landing zones guardrails and identity center
- added [AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools](/en/posts/aws-service-catalog-billing-cost-management) for service catalog portfolios sharing and tagoptions, us-east-1 billing metrics and sns alarms, cost explorer forecasts and savings plan hints, budgets templates filters sns chatbot actions on ec2 rds iam and scp, cost allocation tags and cur to s3 athena, usage reports csv, compute optimizer supported resources and 30 hour ec2 caveat, and billing conductor showback
