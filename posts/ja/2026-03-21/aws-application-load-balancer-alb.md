---
title: "AWS Application Load Balancer (ALB) 詳細"
date: "2026-03-21"
excerpt: "レイヤ7 HTTP ロードバランサー：ターゲットグループ、ルーティング（path、host、query string、headers）、X-Forwarded-* ヘッダー、EC2/ECS/Lambda/プライベートIP 対応。"
author: "Tony Duong"
category: "note"
tags: ["aws", "alb", "load-balancer", "ec2", "ecs", "lambda", "microservices", "zcloudops", "cloud"]
---

## 概要

**Application Load Balancer (ALB)** は **レイヤ7** のロードバランサーで、HTTP 専用。**ターゲットグループ** にまとめられた複数マシン上の HTTP アプリへトラフィックをルーティングする。1つの ALB で複数アプリをフロントできる — Classic Load Balancer は1アプリあたり1つの CLB が必要。

## ALB の機能

- **HTTP/2 と WebSocket** 対応
- **リダイレクト** — 例：ロードバランサーで HTTP → HTTPS
- **ルーティングルール** — 以下に基づき異なるターゲットグループへルーティング：
  - **Path** — `example.com/users` vs `example.com/posts` → 別のターゲットグループ
  - **Host 名** — `one.example.com` vs `other.example.com` → 別のターゲットグループ
  - **クエリ文字列** — `?Platform=Mobile` vs `?Platform=Desktop`
  - **ヘッダー**
- **ポートマッピング** — ECS 上の動的ポートへリダイレクト（コンテナに便利）
- **1 ALB で複数アプリ** — マイクロサービスやコンテナワークロードに適している

## ターゲットグループ

ターゲットグループは ALB がルーティング先とするバックエンド。対応ターゲット：

| ターゲット種類 | 用途 |
|---------------|------|
| **EC2 インスタンス** | しばしば Auto Scaling Groups で管理 |
| **ECS タスク** | コンテナアプリ |
| **Lambda 関数** | サーバーレスバックエンド |
| **プライベート IP** | オンプレのデータセンター内サーバー |

ヘルスチェックは **ターゲットグループごと** に設定。

## ルーティング例

- 1つの ALB と2つのターゲットグループ：
  - ターゲットグループ1：ユーザーアプリ（ルート `/user`）
  - ターゲットグループ2：検索アプリ（ルート `/search`）
- ルール：path ベースで `/user` → グループ1、`/search` → グループ2。

別例：クエリ文字列ルーティング — `?Platform=Mobile` → EC2 ターゲットグループ、`?Platform=Desktop` → オンプレのプライベートIP ターゲットグループ。

## X-Forwarded-* ヘッダー

ALB は **コネクション終端** を行う。EC2 インスタンスにはクライアントの IP ではなく LB のプライベート IP が見える。クライアント情報はヘッダーで渡される：

- **X-Forwarded-For** — クライアント IP（例：`12.34.56.78`）
- **X-Forwarded-Port** — クライアントが使用したポート
- **X-Forwarded-Proto** — プロトコル（HTTP または HTTPS）

アプリはこれらのヘッダーを読んで元のクライアント IP・ポート・プロトコルを取得する必要がある。

## ALB vs Classic Load Balancer

| | ALB | Classic (CLB) |
|---|-----|----------------|
| LB あたりのアプリ数 | 複数（ターゲットグループ経由） | 1アプリ per CLB |
| ルーティング | path、host、query、headers | 限定的 |
| HTTP/2、WebSocket | あり | なし |
| 動的ポートマッピング | あり（ECS） | なし |

## 要点

- ALB はレイヤ7 HTTP 専用；Webアプリ、マイクロサービス、コンテナ向け。
- ターゲットグループでバックエンドをまとめる；ヘルスチェックはグループごと。
- ルーティングルール：path、host、query string、headers。
- アプリでクライアント情報を得るには **X-Forwarded-For**、**X-Forwarded-Port**、**X-Forwarded-Proto** を参照。
- ALB は EC2、ECS、Lambda、プライベート IP（オンプレ）へルーティング可能。

---
*Claudeによる翻訳*
