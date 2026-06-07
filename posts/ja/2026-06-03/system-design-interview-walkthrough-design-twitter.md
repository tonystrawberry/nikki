---
title: "システムデザイン面接ウォークスルー：Twitter設計"
date: "2026-06-03"
excerpt: "Hello InterviewのTwitter設計メモ — マイクロサービス、ツイートCRUD用MongoDB、fan-out on writeタイムライン、グラフDB、Elasticsearch、read/write重い超低レイテンシにNoSQLが適する場面。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "twitter", "nosql", "mongodb", "microservices", "interview", "caching"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=Nfa-uUHuFHg"
---

Hello Interview（元Meta staff engineer）による**Twitter風マイクロブログサービス設計**のメモ — FAANGで最頻出のシステムデザイン面接題の一つ。

## 要件（5分以内）

### 機能要件

- アカウント作成 / ログイン
- ツイートCRUD
- フォロー
- ホームタイムライン
- いいね、返信、リツイート
- 検索

### 非機能要件

- 数億DAU
- 大量の作成・読み取り
- **99.99%可用性**
- セキュリティとプライバシー
- ツイート読み込みの**超低レイテンシ**

スコープ外：DM、広告、整合性システム — 45分、17年ではない。

## 高レベルアーキテクチャ

**クライアント** → **レイヤ7ロードバランサ**（ラウンドロビン）→ **API Gateway** → **マイクロサービス**。

### コアサービス

| サービス | 責務 |
|---------|------|
| **Tweet CRUD** | ツイート、いいね、RT |
| **Reply** | 返信（別スケール） |
| **Search** | 検索 |
| **Timeline** | ホームフィード |
| **Profile** | アカウント、フォローグラフ |
| **Auth** | 認証・認可 |

## ツイート保存 — NoSQLの理由

Twitterは内部NoSQL（Manhattan）。面接では**MongoDB**。

**NoSQLがツイートに合う理由：**

- **read/writeが重く** **超低レイテンシ**が必要
- ツイートは**自己完結JSONドキュメント** — 複雑なjoin不要
- 取得 = 1ドキュメント返却

**メディア：** **S3**にblob；ツイート文書は参照のみ。

## タイムラインサービス

### Fan-out on read（素朴）

フォロー一覧 → 全ツイート取得 → ソート。**遅い** — 低レイテンシNFRを満たせない。

### Fan-out on write（推奨）

1. ツイートを**メッセージキュー**へ
2. workerがフォロワー取得
3. 各フォロワーの**タイムラインキャッシュ**先頭に追加（Redis的）

次の読み取り = 既に準備済み → **超高速読み取り**。

### メガインフルエンサー（ハイブリッド）

数百万フォロワー：fan-out on writeはシステムを圧倒しうる。

- **一般ユーザー：** fan-out on write
- **有名人：** fan-out on read — タイムライン表示時に取得してマージ

## プロフィールとソーシャルグラフ

| データ | 保存 | 理由 |
|--------|------|------|
| ユーザープロフィール | **SQL** | 構造化、ACID、分析join |
| フォローグラフ | **Graph DB** | SNSに自然；推薦・整合性向け |

Authは別サービスでセキュリティと保守性。

## 検索

**Elasticsearch** + ツイートストアからの**CDC**。

## CDN・セキュリティ・監視

CDN、HTTPS、保存時暗号化、レート制限、入力検証。Prometheus/Grafana、ELK、アラート。

## NoSQLが適するストレージ

**read/writeが重く** **超低レイテンシ**で**単純アクセス**（IDでドキュメント取得、joinなし）なら、**NoSQLドキュメントストア**（MongoDB、Manhattan型）がしばしば正解。

**SQL**はリレーショナル整合性。**Graph DB**は関係データ。**検索エンジン+CDC**は全文検索。**キャッシュ+キュー**は最熱の読み取りパス（タイムライン）。

## 要点

- 要件を素早く確定して先へ
- Tweet CRUD → **NoSQL**
- タイムライン → **fan-out on write** + キャッシュ；メガインフルエンサーは**ハイブリッド**
- グラフ → **Graph DB**；ユーザー → **SQL**
- アクセスパターンに合わせてDBを選ぶ

---
> 🌐 *Claudeによる翻訳*
