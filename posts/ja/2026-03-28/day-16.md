---
title: "16 日目"
date: "2026-03-28"
excerpt: "AWS CloudOps のメモ、Vertex AI 評価の小さな実験、Shirimono のフランス語ローカライズを混ぜた一日"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "s3", "storage", "cloudfront", "cdn", "global-accelerator", "rds", "databases", "cloudwatch", "eventbridge", "cloudtrail", "aws-config", "service-quotas", "health", "organizations", "control-tower", "service-catalog", "budgets", "cost-explorer", "logs", "alarms", "synthetics", "monitoring", "cloudops", "certification", "gcp", "vertex-ai", "ruby", "prompts", "llm", "shirimono", "i18n", "french", "translation"]
---

## 今日やったこと：

- aws cloudops engineer associate 向けにセクション 10 の amazon s3（イントロ）を見て、[Amazon S3 Introduction: Buckets, Objects, Security, and Versioning](/ja/posts/amazon-s3-introduction-buckets-objects-security-versioning) のノートを書いた
- 初回有効化時のバージョニング伝播、crr/srr レプリケーション、既存オブジェクトのバッチレプリケーション、削除マーカーと完全削除の違い、チェーンなし、クロスアカウントの所有者オーバーライドを同じ記事に追記した（[同じ記事](/ja/posts/amazon-s3-introduction-buckets-objects-security-versioning)）
- cloudfront 全セクション（同トラックの global accelerator を含む）の認定対策を続け、[AWS CloudFront and Global Accelerator: CDN, Caching, Origins, and Edge Networking](/ja/posts/aws-cloudfront-global-accelerator-cdn-notes) を書いた
- aws データベースの章に進み、複数ブロックで [AWS RDS, Aurora, RDS Proxy, and ElastiCache](/ja/posts/aws-rds-overview-storage-scaling-read-replicas-and-multi-az) をまとめた
- 同じ cloudwatch 記事に異常検知、クロスリージョンダッシュボード、ログとメトリクスフィルタ、insights と live tail、エクスポートとサブスクリプションフィルタ、データ保護、アラームと複合アラーム、ec2 リカバリ、vpc 内 synthetics canary、container insights を足した（[同じ記事](/ja/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics)）
- その記事に internet monitor、direct connect と vpn 経路の network synthetic monitor、eventbridge（default/partner/custom バス、ルールとスケジュール、アーカイブとリプレイ、スキーマレジストリ、クロスアカウントバスポリシー、コンテンツフィルタ、input transformers、pipes と api destinations）を続けて書いた（[同じ記事](/ja/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics)）
- eventbridge pipes とエンリッチメント、リトライと sqs dlq、ssm automation ターゲット、双方向クロスアカウント権限、service quotas アラームと trusted advisor、cloudtrail の management と data イベントと insights の整理を追加した（[同じ記事](/ja/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics)）
- cloudtrail の api 名に対する eventbridge ルール、ログダイジェストと sha-256 整合性、組織トレイルとメンバー制限、aws config レコーダーとルール、ルール展開の aggregators と stacksets、ssm 修復例、cloudwatch と cloudtrail と config の比較を追加した（[同じ記事](/ja/posts/aws-cloudwatch-metrics-namespaces-and-custom-metrics)）
- aws アカウント管理に入り、[AWS Account Management: Health Dashboard, Organizations, SCPs, and Control Tower](/ja/posts/aws-health-dashboard-organizations-control-tower) でサービス／アカウント／組織のヘルス、health から eventbridge 自動化、組織への ou 招待、一括請求、ri 共有、scp と試験で出る deny、principalorgid とタグポリシー、control tower のランディングゾーンと guardrails と identity center をまとめた
- [AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools](/ja/posts/aws-service-catalog-billing-cost-management) を追加し、service catalog のポートフォリオ共有と tagoptions、us-east-1 の請求メトリクスと sns アラーム、cost explorer の予測と savings plan のヒント、budgets のテンプレートとフィルタと sns chatbot と ec2 rds iam scp 上のアクション、コスト配分タグと cur を s3 athena へ、usage レポート csv、compute optimizer の対象リソースと ec2 30 時間の注意、billing conductor の showback を書いた
- vertex ai 向けに [Gen AI evaluation service overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview) を読み（ルーブリック、データセット、コンソールと sdk）、プロンプト評価の学習用に [tonystrawberry/ruby-vertex-eval](https://github.com/tonystrawberry/ruby-vertex-eval) を用意し、yaml 駆動の generate と evaluateinstances とマネージドメトリクスを合わせ、[Vertex AI Gen AI evaluation in the Google Cloud console](/ja/posts/vertex-ai-gen-ai-evaluation-console) に gemini-1.5-flash の general quality 採点とレシピ→買い物リストデータセットのスクリーンショットを載せた
- アプリがフランス語ロケールを出したので、shirimono のリソースをフランス語に翻訳し始め、アプリ内文言と学習コンテンツを揃えた

---
*Claudeによる翻訳*
