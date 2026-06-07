---
title: "Jour 16"
date: "2026-03-28"
excerpt: "J’ai mélangé des notes AWS CloudOps, un side project d’évaluation Vertex AI et la localisation française de Shirimono"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "s3", "storage", "cloudfront", "cdn", "global-accelerator", "rds", "databases", "cloudwatch", "eventbridge", "cloudtrail", "aws-config", "service-quotas", "health", "organizations", "control-tower", "service-catalog", "budgets", "cost-explorer", "logs", "alarms", "synthetics", "monitoring", "cloudops", "certification", "gcp", "vertex-ai", "ruby", "prompts", "llm", "shirimono", "i18n", "french", "translation"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- regardé la section 10 sur amazon s3 (introduction) et rédigé cette note [Amazon S3 Introduction: Buckets, Objects, Security, and Versioning](/fr/posts/amazon-s3-introduction-buckets-objects-security-versioning) pour ma prépa aws cloudops engineer associate
- complété cette note avec la propagation du versioning à la première activation, la réplication crr/srr, la réplication par lots pour les objets existants, le marqueur de suppression vs suppression définitive, l’absence de chaînage et le override du propriétaire cross-account ([même article](/fr/posts/amazon-s3-introduction-buckets-objects-security-versioning))
- poursuivi la prépa certification aws en suivant toute la section cloudfront (plus global accelerator dans ce parcours) et rédigé [AWS CloudFront and Global Accelerator: CDN, Caching, Origins, and Edge Networking](/fr/posts/aws-cloudfront-global-accelerator-cdn-notes)
- enchaîné avec la section bases de données aws et structuré [AWS RDS, Aurora, RDS Proxy, and ElastiCache](/fr/posts/aws-rds-overview-storage-scaling-read-replicas-and-multi-az) sur plusieurs blocs d’étude
- enrichi le même article cloudwatch avec la détection d’anomalies, les tableaux de bord multi-régions, les logs et filtres de métriques, insights vs live tail, export vs filtres d’abonnement, la protection des données, les alarmes et alarmes composites, la récupération ec2, les canaries synthetics en vpc et container insights dans [AWS Observability and Governance: CloudWatch, EventBridge, CloudTrail, and Config](/fr/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics)
- poursuivi cette note avec internet monitor, network synthetic monitor pour direct connect et chemins vpn, et eventbridge (bus default/partner/custom, règles et plannings, archive et replay, registre de schémas, politiques de bus cross-account, filtrage de contenu, input transformers, pipes et api destinations) ([même article](/fr/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics))
- ajouté les pipes eventbridge et l’enrichissement, les retries et la dlq sqs, les cibles ssm automation, les permissions cross-account bilatérales, les alarmes service quotas vs trusted advisor, et la gestion des trails cloudtrail événements management vs data et insights ([même article](/fr/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics))
- ajouté les règles eventbridge sur les noms d’api cloudtrail, le digest de logs cloudtrail et l’intégrité sha-256, les trails d’org et restrictions pour les membres, l’enregistreur aws config et les règles, les agrégateurs vs stacksets pour le déploiement des règles, des exemples de remédiation ssm et une comparaison cloudwatch vs cloudtrail vs config ([même article](/fr/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics))
- attaqué la gestion de compte aws et rédigé [AWS Account Management: Health Dashboard, Organizations, SCPs, and Control Tower](/fr/posts/aws-health-dashboard-organizations-control-tower) pour la santé service vs compte vs org, health vers automations eventbridge, invitations ou dans les orgs, facturation consolidée, partage ri, scps et denies façon examen, principalorgid et politiques de tags, et landing zones control tower avec guardrails et identity center
- ajouté [AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools](/fr/posts/aws-service-catalog-billing-cost-management) pour les portfolios service catalog partage et tagoptions, les métriques de facturation us-east-1 et alarmes sns, les prévisions cost explorer et indices savings plan, les modèles de budgets filtres sns chatbot actions sur ec2 rds iam et scp, les tags d’allocation de coûts et cur vers s3 athena, les rapports d’usage csv, compute optimizer ressources supportées et la contrainte 30h ec2, et billing conductor showback
- lu [Gen AI evaluation service overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview) sur vertex ai (rubriques, jeux de données, console vs flux sdk) pour apprendre à évaluer des prompts, publié un petit squelette ruby [tonystrawberry/ruby-vertex-eval](https://github.com/tonystrawberry/ruby-vertex-eval) qui reflète yaml puis generate puis evaluateinstances avec métriques managées, et rédigé [Vertex AI Gen AI evaluation in the Google Cloud console](/fr/posts/vertex-ai-gen-ai-evaluation-console) avec une capture du scoring general quality sur gemini-1.5-flash pour un jeu recette→liste de courses
- commencé à traduire les ressources shirimono en français pour aligner le copy in-app et le contenu pédagogique maintenant que l’app propose une locale française

---
> 🌐 *Traduit par Claude*
