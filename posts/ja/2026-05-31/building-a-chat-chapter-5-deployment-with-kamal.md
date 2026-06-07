---
title: "チャットを作る：第5章 — Kamalでデプロイ"
date: "2026-05-31"
excerpt: "Dockerマルチステージビルド、Kamal 2でHetznerにデプロイ、シークレット管理、GitHub Actions CI/CD、本番WebSocket設定。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["kamal", "docker", "hetzner", "deployment", "github-actions"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 5
collectionTitle: "リアルタイムチャットを作る"
---

> 💬 **これは、このサイトの右下に表示されているライブチャットそのものの実装です。** このシリーズでは、それをどう作ったかを順を追って解説します。チャットの吹き出しを開いて試してから、その仕組みを読み進めてみてください。

チャットサーバーはlocalhostで動作しています。次はインターネット上で動かす必要があります。この章ではDockerビルド、Kamal 2によるHetzner VPSへのデプロイ、シークレット管理、CI/CD、そして本番環境のCORS/WebSocket設定を扱います。

## 2ホストアーキテクチャ

```
Vercel (無料枠)                       Hetzner CX22 (~3.49 EUR/月)
─────────────────                     ───────────────────────────
Next.js 16 フロントエンド               Rails 8 + Puma + Thruster
  静的ページ、管理UI                      ActionCable WebSocket
  チャットウィジェットJS                   REST API、SQLiteデータベース
                                        Solid Cable / Queue / Cache
        <── wss://nikki-chat.shirimono.fun/cable ──>
        <── https://nikki-chat.shirimono.fun/* ──>
```

[第1章](01-architecture-and-setup.md)との重要な違い：本番では`wss://`と`https://`を使用します。TLSはRails自体ではなく、Let's Encrypt経由でkamal-proxyで終端します。

## Dockerfile

`chat-server/Dockerfile` — 74行のマルチステージビルド。

| ステージ | 内容 |
|-------|-------------|
| `base` | `ruby:3.2.2-slim` + sqlite3 + jemalloc |
| `build` | build-essentialを追加、`bundle install`を実行、bootsnap をプリコンパイル |
| 最終 | buildからgemsとappをコピー、非rootで実行（uid 1000） |

baseステージで設定される重要な環境変数：

```dockerfile
ENV RAILS_ENV="production" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"
```

`LD_PRELOAD`でjemallocを強制し、4GB VPSでのメモリフラグメンテーションを軽減します。`BUNDLE_WITHOUT`で開発用gemをイメージから除外します。

エントリーポイント（`chat-server/bin/docker-entrypoint`）は起動前に`db:prepare`を実行します。CMDはPumaの前でThrusterを起動します：

```dockerfile
CMD ["./bin/thrust", "./bin/rails", "server"]
```

ThrusterはHTTP/2、gzip、X-Sendfileを処理するGoのリバースプロキシです。

## Kamal 2の設定

`chat-server/config/deploy.yml`：

```yaml
service: chat-server
image: tonystrawberry/chat-server

servers:
  web:
    - 178.104.231.154

proxy:
  ssl: true
  host: nikki-chat.shirimono.fun
```

`proxy.ssl: true`で初回デプロイ時にLet's Encrypt証明書をプロビジョニングします。nginx不要、certbot不要。

```yaml
env:
  secret:
    - RAILS_MASTER_KEY
    - ADMIN_USER
    - ADMIN_PASSWORD
    - VAPID_PUBLIC_KEY
    - VAPID_PRIVATE_KEY
    - VAPID_SUBJECT
  clear:
    SOLID_QUEUE_IN_PUMA: true
    ALLOWED_ORIGINS: "https://nikki-tony.vercel.app"
    RAILS_LOG_LEVEL: info
```

`secret`の値はデプロイ時に注入されます（イメージには含まれません）。`SOLID_QUEUE_IN_PUMA`は`config/puma.rb`の38行目でPumaプラグインを有効にします — バックグラウンドジョブがPuma内で実行され、別のワーカープロセスは不要です。

```yaml
volumes:
  - "chat_server_storage:/rails/storage"
```

重要：SQLiteデータベースは`/rails/storage`に存在します。この名前付きボリュームがないと、デプロイのたびにデータベースが消去されます。

```yaml
builder:
  arch: amd64
```

Apple Siliconでは、Docker BuildxがQEMU経由でクロスコンパイルします。

## シークレット管理

`chat-server/.kamal/secrets`はgitにコミットされていますが、変数参照のみを含みます：

```bash
KAMAL_REGISTRY_USERNAME=$KAMAL_REGISTRY_USERNAME
KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD
RAILS_MASTER_KEY=$RAILS_MASTER_KEY
ADMIN_USER=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASSWORD
```

実際の値はシェル環境から取得されます。ローカルデプロイでは`.env`（gitignore済み）からエクスポートします。CIではGitHub Actionsのsecretsから取得します。

## GitHub Actions CI/CD

`main`へのすべてのプッシュでデプロイがトリガーされます：

```yaml
on:
  push:
    branches: [main]

concurrency:
  group: deploy
  cancel-in-progress: true
```

`concurrency`で同時に1つのデプロイだけが実行されることを保証します — 素早く2回プッシュすると、最初のものがキャンセルされます。

ジョブのステップ：チェックアウト、Ruby セットアップ（キャッシュ付き）、Docker Buildxセットアップ、SSHキーのインストール、サーバーを`known_hosts`に追加、`bin/kamal deploy`の実行。必要なGitHubシークレット：`SSH_PRIVATE_KEY`、`KAMAL_REGISTRY_USERNAME`、`KAMAL_REGISTRY_PASSWORD`、`RAILS_MASTER_KEY`、`ADMIN_USER`、`ADMIN_PASSWORD`、`VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT`。

## 本番のCORSとWebSocket設定

Vercelの3つの環境変数でフロントエンドをRailsに接続します：

```
NEXT_PUBLIC_CHAT_WS_URL=wss://nikki-chat.shirimono.fun/cable
NEXT_PUBLIC_CHAT_HTTP_URL=https://nikki-chat.shirimono.fun
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<VAPIDパブリックキー>
```

Rails側では、`deploy.yml`の`ALLOWED_ORIGINS`にVercelドメインを含める必要があります。CORSイニシャライザー（`chat-server/config/initializers/cors.rb`）はカンマで分割します：

```ruby
origins(*ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",").map(&:strip))
```

デプロイフロー全体：

```
git push main -> GitHub Actions -> bin/kamal deploy
  -> Dockerビルド（amd64） -> ghcr.ioにプッシュ
  -> HetznerにSSH -> イメージをプル -> db:prepareを実行
  -> Puma + Thrusterを起動 -> kamal-proxyがSSLをプロビジョニング
  -> ヘルスチェック（GET /up）がパス -> 旧コンテナを停止
```

ゼロダウンタイムスワップ。全体のフローは約3分です。

## この先について

- **レート制限** — `VisitorChannel`にセッションごとのスロットリングを追加（最大1メッセージ/秒）。超過分は`too_fast`ブロードキャストで拒否。
- **タイピングインジケーター** — `typing`イベントをブロードキャスト、3秒後に自動クリア。[第2章](02-actioncable-backend.md)で示した別のブロードキャストタイプと同じです。
- **ファイル添付** — Active Storage + S3。チャットで画像を受け付け、ウィジェットでサムネイルをレンダリング。
- **複数管理者** — 環境変数認証を`users`テーブルとbcryptに置き換え。[第2章](02-actioncable-backend.md)の`AdminChannel`認証がデータベースレコードをチェックするようになります。

## やってみよう

### 1. 本番イメージをローカルで実行

<details>
<summary>解答</summary>

```bash
cd chat-server
docker build -t chat-server .
docker run \
  -e RAILS_MASTER_KEY=$(cat config/master.key) \
  -e ADMIN_USER=test \
  -e ADMIN_PASSWORD=test \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  -p 3100:80 \
  chat-server
```

`.env.local`で`NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3100`と`NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3100/cable`を設定してください。`wss://`ではなく`ws://`を使います — ローカルにはTLSがありません。Apple Siliconでは、bootsnap プリコンパイル中にセグフォルトが発生する場合は`--platform linux/amd64`を追加してください。

</details>

### 2. デプロイパイプラインに新しい環境変数を追加

`deploy.yml`にclear環境変数として`RATE_LIMIT_PER_MINUTE=30`を追加してください。`bin/kamal app exec 'printenv RATE_LIMIT_PER_MINUTE'`で確認してください。

<details>
<summary>解答</summary>

`chat-server/config/deploy.yml`の`clear`セクションに追加します：

```yaml
  clear:
    SOLID_QUEUE_IN_PUMA: true
    ALLOWED_ORIGINS: "https://nikki-tony.vercel.app"
    RAILS_LOG_LEVEL: info
    RATE_LIMIT_PER_MINUTE: 30
```

clear（非シークレット）の値なので、`.kamal/secrets`の更新は不要です。デプロイ後、`bin/kamal app exec 'printenv RATE_LIMIT_PER_MINUTE'`で確認してください。

</details>

### 3. サーバー上のDockerボリュームを確認

SSHで接続し、SQLiteファイルがディスク上のどこにあるか見つけてください。

<details>
<summary>解答</summary>

```bash
ssh root@178.104.231.154 "docker volume inspect chat_server_storage"
```

`Mountpoint`（例：`/var/lib/docker/volumes/chat_server_storage/_data`）に`production.sqlite3`、`production_cache.sqlite3`、`production_queue.sqlite3`、`production_cable.sqlite3`が含まれています。

</details>

### 4. ヘルスチェック失敗のシミュレーション

`config/routes.rb`で`GET /up`を`GET /health-check`にリネームしてデプロイしてください。

<details>
<summary>解答</summary>

Kamalは新しいコンテナの起動後に`GET /up`をポーリングします。ルートがリネームされたため404が返り、30秒後にタイムアウトし、コンテナを不健全と判断して停止し、旧コンテナを維持します。デプロイ出力に`Container is not healthy`と表示されます。元に戻して再デプロイすれば修正できます。

</details>

---
> 🌐 *Claudeによる翻訳*
