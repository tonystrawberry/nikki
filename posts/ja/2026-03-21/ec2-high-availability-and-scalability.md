---
title: "EC2 高可用性とスケーラビリティ"
date: "2026-03-21"
excerpt: "EC2 のスケーラビリティ/高可用性、ELB/ALB/NLB/GWLB、TLS、ヘルスチェック、メトリクス、target group 調整、ASG 運用をまとめた統合ノート。"
author: "Tony Duong"
category: "note"
tags: ["aws", "ec2", "scalability", "high-availability", "load-balancer", "elb", "alb", "nlb", "gwlb", "zcloudops", "cloud"]
---

## 概要

AWS CloudOps 学習内容を1本に統合した記事。スケーリング、高可用性、各種ロードバランサー、TLS、ヘルスチェック、ASG、warm pools、lifecycle hooks、scaling plans までを横断して整理。

## 1) スケーラビリティと高可用性

- **垂直スケール（scale up/down）**：インスタンスサイズ変更
- **水平スケール（scale out/in）**：台数増減
- **HA**：複数 AZ 配置で障害耐性を確保
- **Passive HA**：active + standby
- **Active HA**：複数ノードが同時にトラフィック処理

## 2) ELB 基礎

ロードバランサーは単一エンドポイントを公開し、バックエンドへ負荷分散。ヘルスチェック、SSL終端、sticky session、AZ 分散を提供。

種類：

- **ALB**（L7、HTTP/HTTPS/WebSocket）
- **NLB**（L4、TCP/TLS/UDP、高性能）
- **GWLB**（L3/IP、セキュリティ検査）
- **CLB**（旧世代）

## 3) ALB 詳細

- path/host/query/header でルーティング
- target group（EC2/ECS/Lambda/private IP）
- target group 単位のヘルスチェック
- `X-Forwarded-For` などで元クライアント情報を伝搬

推奨 SG パターン：

- ALB SG：80/443 公開
- EC2 SG：ALB SG からのみ受信

## 4) ALB ハンズオン（要約）

- EC2 を2台起動
- ALB + target group + listener 作成
- DNS リロードで round-robin 確認
- 1台停止 -> unhealthy -> 迂回
- 再起動 -> healthy 復帰

## 5) ALB 応用

- EC2 直アクセスを閉じ、ALB 経由のみに制限
- listener rules（条件 + アクション + 優先度）
- 例：`/error` に fixed response `404`

## 6) NLB 理論

NLB を選ぶ場面：

- TCP/UDP/TLS
- 超低遅延・超高スループット
- AZ ごとの固定 IP（Elastic IP も可）

ターゲット：EC2、private IP、NLB の背後に ALB を置く構成も可能。

## 7) NLB ハンズオン（要約）

- NLB + TCP target group 作成
- health check は TCP/HTTP/HTTPS が利用可能
- 典型エラー：EC2 SG が ALB のみ許可で NLB を許可していない
- EC2 SG に NLB SG を追加すると healthy 化

## 8) GWLB

GWLB は firewall / IDS/IPS / DPI などの仮想アプライアンスへトラフィックを透過的に通すための LB。

- レイヤ3（IP）
- 試験キーワード：**GENEVE 6081**
- ターゲット：EC2 または private IP

## 9) Sticky Sessions

同一クライアントの連続リクエストを同一バックエンドへ固定。セッション保持に有効だが負荷偏りのリスクあり。

- app cookie / LB cookie
- 有効期限を設定

## 10) Cross-Zone Load Balancing

- **ON**：LB ノードが全 AZ のターゲットへ配分
- **OFF**：同一 AZ 内へ配分

既定：

- ALB：有効
- NLB/GWLB：無効（有効化で inter-AZ コスト発生の可能性）

## 11) TLS/SSL と SNI

- TLS で client -> LB を暗号化
- ACM で証明書管理（または import）
- SNI で1つの ALB/NLB に複数証明書/ホスト名を載せられる

## 12) Connection Draining / Deregistration Delay

ターゲット削除時に in-flight リクエスト完了を待つ仕組み。

- CLB：Connection Draining
- ALB/NLB：Deregistration Delay
- 範囲 `0`〜`3600`、既定 `300`

## 13) Health Checks 深掘り

主要設定：protocol、port、path、timeout、interval、healthy/unhealthy threshold、success codes。

状態：initial / healthy / unhealthy / unused / draining / unavailable。

## 14) エラー・メトリクス・ログ・トレーシング

- `4XX`：クライアント側
- `5XX`：サーバー側

重要メトリクス：

- `HealthyHostCount` / `UnHealthyHostCount`
- `RequestCount` / `RequestCountPerTarget`
- `HTTPCode_Target_*`
- `SurgeQueueLength` / `SpilloverCount`

ALB access logs は S3 保存可能。`X-Amzn-Trace-Id` で相関追跡に使える。

## 15) Target Group 応用属性

- deregistration delay
- slow start
- routing algorithm
- stickiness

アルゴリズム：round robin / least outstanding requests / NLB flow hash。

## 16) ALB Rules と weighted forwarding

1つのルールで複数 target group へ重み付き配分（例 80/20）。blue/green・canary に有効。

## 17) ASG 基礎

ASG は min/desired/max で台数を管理し、需要に応じて自動で scale out/in。unhealthy インスタンスは置き換え。

## 18) Launch Template + ASG

AMI、instance type、user-data、SG、IAM、volume などをテンプレート化して再現性ある起動を実現。

## 19) ASG Scaling Policies

- Dynamic（target tracking / simple / step）
- Scheduled
- Predictive

## 20) Cooldown とメトリクス設計

- 指標：CPU、request per target、network、custom metrics
- cooldown（既定 ~300s）で過剰な揺れを防止

## 21) Instance Refresh

新しい launch template/AMI へ安全に置き換えるローリング更新機能。

## 22) Warm Pools

事前初期化済みインスタンスを保持し、scale-out 時の起動遅延を短縮。

## 23) Lifecycle Hooks

起動/終了の遷移を一時停止して setup、ログ退避、cleanup、snapshot などを実行（EventBridge/SNS/SQS/Lambda 連携）。

## 24) Launch Configuration vs Launch Template

Launch Configuration は legacy。Launch Template が推奨（バージョン管理・柔軟性）。

## 25) SQS 連携スケーリング

SQS キュー深度（CloudWatch alarm）で worker ASG を自動スケール。

## 26) ASG Health Check 種類

- EC2 checks
- ELB checks
- custom checks（`set-instance-health`）

不健康なインスタンスは terminate + relaunch で置換。

## 27) ASG Troubleshooting

確認ポイント：max capacity 上限、AZ 容量不足、テンプレート参照切れ（SG/key pair）、activity history。

## 28) ASG CloudWatch Metrics

Group metrics（opt-in）：`GroupDesiredCapacity` など。

EC2 metrics：CPU/network/status checks（basic vs detailed）。

## 29) AWS Auto Scaling Service / Scaling Plans

EC2/ECS/DynamoDB/Aurora/Spot Fleet を横断して scaling を一元管理。

- dynamic scaling
- predictive scaling

モード：availability / balanced / cost / custom。

## 要点

- ALB + ASG は AWS 上の高可用 Web 基盤の中心。
- SG、health checks、draining 設定が運用安定性を大きく左右する。
- NLB/GWLB はネットワーク/セキュリティ要件に応じて使い分ける。
- CloudWatch と scaling plans により容量管理を中央集約できる。

## Next updates

この統合記事は、今後の AWS CloudOps 講義サマリーを継続追記する前提で構成。

---
*Claudeによる翻訳*
