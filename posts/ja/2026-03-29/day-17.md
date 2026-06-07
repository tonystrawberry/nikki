---
title: "17 日目"
date: "2026-03-29"
excerpt: "CloudOps の DR、セキュリティ／コンプライアンス、IAM アイデンティティ、Route 53 を三部構成（DNS 基礎、ルーティングポリシーとヘルスチェック、デリゲーション・リゾルバ・ログ・ファイアウォール・ARC・プロファイル）で学び、コレクション用ノートを六本書いた一日"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "disaster-recovery", "cloudops", "certification", "security", "kms", "waf", "compliance", "iam", "sts", "federation", "route-53", "dns"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- 災害復旧パートの aws 認定対策を続け、[AWS DataSync and AWS Backup: Disaster Recovery Notes](/ja/posts/aws-datasync-and-backup-disaster-recovery-notes) を cloudops コレクション用に書いた
- セキュリティとコンプライアンス（境界、検知コントロール、ログ、ガバナンス、暗号化、tls、シークレット）を続け、[AWS Security, Compliance, Encryption, and Secrets for CloudOps](/ja/posts/aws-security-compliance-encryption-and-secrets-notes) を同じコレクション用に書いた
- aws のアイデンティティ（permission boundary と scp、クレデンシャルレポート、access advisor、iam access analyzer、sts とクロスアカウント assume role、saml とカスタムブローカーと cognito フェデレーション、iam ポリシーシミュレータ）を学び、[AWS IAM Identity: Permission Boundaries, Federation, STS, and Access Tools](/ja/posts/aws-iam-identity-permission-boundaries-federation-sts-notes) を cloudops コレクション用に書いた
- route 53（dns の解決と用語、ホストゾーン、a/aaaa/cname/ns、ttl とキャッシュ、メール用 mx と txt、alias と cname とゾーン apex）で一日を締め、[Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME](/ja/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases) を cloudops コレクション用に書いた
- route 53 を続け、ルーティングポリシー（simple、weighted、latency、failover、geolocation、geoproximity、multi-value、ip-based）、ヘルスチェック、traffic flow について [Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow](/ja/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow) を cloudops コレクション用に書いた
- multi-value と simple の違い、レジストラと dns デリゲーション、s3 ウェブサイトの alias、ハイブリッド resolver、クエリログ、dns ファイアウォール、arc、profiles までまとめ、[Amazon Route 53: Registrar Delegation, Resolver, Logging, and Governance](/ja/posts/aws-route-53-delegation-resolver-logging-firewall-arc-profiles) を cloudops コレクション用に書いた

---
> 🌐 *Claudeによる翻訳*
