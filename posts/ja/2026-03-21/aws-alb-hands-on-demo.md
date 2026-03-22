---
title: "AWS Application Load Balancer ハンズオンデモ"
date: "2026-03-21"
excerpt: "手順通り：EC2 インスタンス起動、ALB とターゲットグループ作成、ロードバランシングとヘルスチェックの確認（インスタンス stop/start）。"
author: "Tony Duong"
category: "note"
tags: ["aws", "alb", "load-balancer", "ec2", "target-group", "health-check", "zcloudops", "cloud"]
---

## 概要

2台の EC2 インスタンスの前に **Application Load Balancer (ALB)** を置き、ターゲットグループとヘルスチェックを設定するハンズオン。デモではロードバランシングの動作と、インスタンスを停止したときの ALB の反応を確認する。

## ステップ1：EC2 インスタンスの起動

- **2インスタンス** を起動（例：`My First Instance`、`My Second Instance`）
- **AMI：** Amazon Linux 2
- **インスタンスタイプ：** t2.micro
- **キーペア：** なし（SSH が必要なら EC2 Instance Connect を使用）
- **セキュリティグループ：** HTTP (80) と SSH (22) を許可、例：Launch Wizard 1
- **ユーザーデータ：** シンプルな HTTP サーバーを起動し "hello world from my instance" を返すスクリプト（インスタンス ID は各インスタンスで異なる）

起動後、各インスタンスのパブリック IP に直接アクセスし、両方が異なるインスタンス ID 付きで "hello world" を返すことを確認。2インスタンス → 2つの IP；目標は両方に分散する1つの URL。

## ステップ2：Application Load Balancer の作成

- **名前：** DemoALB（または任意）
- **スキーム：** Internet-facing
- **IP：** IPv4
- **ネットワークマッピング：** 利用可能な全 AZ にデプロイ
- **セキュリティグループ：** 新規 SG（例：`demo-sg-load-balancer`）で **0.0.0.0/0 からの HTTP (80)** を許可

### ロードバランサー種類（参考）

| 種類 | 用途 |
|------|------|
| **ALB** | HTTP/HTTPS、Webアプリ |
| **NLB** | TCP/UDP、TLS、極めて高いスループットと低遅延 |
| **GWLB** | セキュリティアプライアンス、侵入検知、ファイアウォール |
| **CLB** | 非推奨；新規ワークロードでは避ける |

## ステップ3：ターゲットグループとリスナー

1. **ターゲットグループ：**
   - タイプ：Instances
   - 名前：`demo-tg-alb`
   - プロトコル：HTTP、ポート 80
   - 両方の EC2 インスタンスをポート 80 に登録
   - ターゲットグループを作成

2. **リスナー：**
   - HTTP:80 → `demo-tg-alb` へ転送

3. ロードバランサーを作成。

## ステップ4：ロードバランシングの確認

- ALB の DNS 名をコピーしてブラウザで開く。
- "hello world" が返る。
- **何度もリロード：** レスポンス内のインスタンス ID が変わり、2インスタンス間でトラフィックが分散されている（ラウンドロビン）ことがわかる。

## ステップ5：ヘルスチェックの実演

- ターゲットグループ → **Targets** を開く。両インスタンスは **Healthy**。
- EC2 インスタンスを **1台停止**。
- 約30秒後、そのインスタンスはターゲットグループで **Unhealthy** になる。
- ALB の URL をリロード：トラフィックは稼働中のインスタンスのみに送られる。
- 停止したインスタンスを **再起動**；起動後、再び **Healthy** になる。
- ALB の URL をリロードすると、両インスタンスからのレスポンスが再び見える。

## 要点

- ALB + ターゲットグループで複数インスタンスに1つの URL。
- ヘルスチェックが unhealthy なターゲットへのトラフィックを自動で止める。
- インスタンスを停止すると unhealthy になり、ALB はそれをルーティングから外す。
- HTTP/HTTPS には ALB；TCP/UDP とパフォーマンスには NLB；セキュリティアプライアンスには GWLB を使う。

---
*Claudeによる翻訳*
