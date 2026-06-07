---
title: "Render から Hetzner へ Kamal で移行して月およそ60ドル節約する"
date: "2026-05-10"
excerpt: "Shirimono の Rails 8 バックエンドを Render から Hetzner CPX21 1 台に Kamal で移行。月額が約 70 ドルから約 9 ドルへ。構成、コスト計算、そしてカットオーバー時間の大半を消費した 4 つの落とし穴。"
author: "Tony Duong"
category: "tech"
categories: ["tech", "work"]
tags: ["devops", "rails", "kamal", "hetzner", "render", "shirimono"]
---

私は [Shirimono](https://shirimono.fun) — 一人で開発・運用している日本語学習アプリ — をホストしています。先週まで、Rails バックエンドは Render 上で動いていました：web サービス 1 つ、worker 1 つ、マネージド Postgres データベース 1 つ。スタートには素晴らしい構成ですが、ユーザーベースが正当化するスピードよりも請求が膨らんでいたので、移行することにしました。

今日、同じバックエンドが **Hetzner Cloud CPX21** という VPS 1 台の上で、**Kamal 2** でデプロイされて動いています。月のホスティング料金は約 **70 ドルから ~9 ドル** になり、運用面のストーリーも実は *より複雑* ではなく *よりシンプル* になりました。以下、内訳と必要だった作業を説明します。

---

## Render での「ビフォー」

Render が私に請求していたのは 3 つでした：

| サービス | プラン | 月額 |
| --- | --- | --- |
| Web | Starter | ~25 ドル |
| Worker (Solid Queue) | Starter | ~25 ドル |
| Postgres | Standard | ~15 ドル+ |
| **合計** | | **~65–70 ドル** |

マネージドプラットフォームとしては悪くない取引です — Render はデプロイ、SSL、ログ集約、自動再起動、バックアップを面倒見てくれます。しかし、私一人でオペレーターしているホビー/SaaS スケールのアプリには、必ずしも必要ないコンビニエンスのために月 ~60 ドル払っていました。

Shirimono のスタックで興味深いのは、**Rails 8 が Solid Queue、Solid Cache、Solid Cable を同梱している** ことです — すべて DB ベース。Redis 依存はありません。これは、別のキャッシュ/キューサービスを動かす（管理する、料金を払う）必要がなくなるため、シングルホスト運用を意外なほど現実的にしてくれます。

---

## Hetzner での「アフター」

Hetzner CPX21 1 台（3 vCPU AMD / 4 GB RAM / 80 GB SSD / 20 TB egress）で動いているもの：

- **Web コンテナ** — Solid Queue を Puma 内で動かす Rails 8（シングルホストトポロジー）
- **Postgres 18 アクセサリ** — 同じホスト、データは Docker named volume 上
- **kamal-proxy** — `backend.shirimono.fun` 用に Let's Encrypt で TLS をターミネート

Active Storage は AWS S3 のままです（請求は別、変更なし）。フロントエンド（Nuxt）も独自ホストで変更ありません。

| 項目 | コスト |
| --- | --- |
| Hetzner CPX21 | 7.59 €/月 |
| IPv4 アドレス | 0.50 €/月 |
| Postgres バックアップ → S3（夜間 ~50 MB） | ~0.30 ドル/月 |
| **合計** | **≈ 9 ドル/月** |

同じワークロードでおよそ **8 倍安い** 計算です。

---

## なぜ Kamal がこれを楽にしたか

Kamal 2 は Basecamp のデプロイツールで、「VPS に戻る」が後退に感じられない理由のほぼすべてです。ノートパソコンから：

```bash
bin/kamal deploy
```

…ローカルでイメージをビルドし、GHCR にプッシュし、ホストに SSH してイメージを pull、マイグレーションを実行し、kamal-proxy 越しにゼロダウンタイムで切り替えます。`config/deploy.yml` ファイルにはホスト IP、env 変数、Postgres アクセサリが書かれています。それだけです。

スタック全体が **2 ファイル** で記述されます：`config/deploy.yml` と `.kamal/secrets`。Helm chart も、Terraform module も、プラットフォーム固有の YAML 方言もありません。

`master` への push ごとの CD は GitHub Actions の job 1 つで、テストスイートが通ったあと `bin/kamal deploy` を実行するだけ。YAML ~50 行です。

---

## カットオーバー時間の大半を消費した 4 つの落とし穴

移行はすべてスムーズだったわけではありません。4 つの問題で時間の大半を取られましたが、これらはどれも本番でしか *表に出ない* タイプのものでした：

### 1. アンダースコア入りのサービス名が `DATABASE_URL` を壊す

Kamal のサービス名を `shirimono_backend` にしました。Kamal はアクセサリのホスト名を自動で `<service>-<accessory>` と導出するので、Postgres コンテナは内部 Docker ネットワーク上で `shirimono_backend-db` になりました。すると Rails が起動時にクラッシュしました：

```
URI::InvalidURIError: the scheme postgresql does not accept registry part:
  shirimono:****@shirimono_backend-db:5432 (or bad hostname?)
```

Ruby の `URI` ライブラリは RFC 2396 に従っていて、これは **ホスト名にアンダースコアを許しません**。RFC 3986 はもっと寛容ですが、Ruby は厳しい方を選びました。サービス名を `shirimono-backend`（ハイフン）にリネームしたら一発で直りました。教訓：**Kamal のサービス名にアンダースコアを使ってはいけない。**

### 2. Postgres 18 のデータレイアウトが変わった

アクセサリを `postgres:18-alpine` に固定しました（Render のバージョンに合わせて、移行中の `pg_dump` / `pg_restore` をバイナリ互換にするため）。コンテナは次のメッセージとともに再起動ループに入りました：

> in 18+, these Docker images are configured to store database data in a format which is compatible with `pg_ctlcluster` (specifically, using major-version-specific directory names). The suggested container configuration for 18+ is to place a single mount at `/var/lib/postgresql`…

18 以前の慣習はボリュームを `/var/lib/postgresql/data` にマウントすることでした。18 以降のイメージは `/var/lib/postgresql/<MAJOR>/docker/` にデータを保存し、古いパスの使用を拒否します。修正：`deploy.yml` のボリュームマウントを `data:/var/lib/postgresql/data` から `data:/var/lib/postgresql` に変更する。

### 3. `RAILS_MASTER_KEY` と末尾改行

`gh secret set RAILS_MASTER_KEY < config/master.key` で master key を GitHub Secrets にアップロードしました。CI がデプロイし、コンテナがブートし、コンテナがクラッシュ：

```
ArgumentError: key must be 16 bytes
```

`config/master.key` はテキストファイル — 末尾に改行があります。`gh secret set` は stdin をそのまま読んで `abcdef…32-hex-chars\n` として保存します。Rails が AES-128 鍵を作るために hex デコードするとき、末尾の `\n` のせいでバイト数が合わなくなります（16 ではなく 17 バイト）。

2 か所で修正 — 改行を取り除いた状態でシークレットを再アップロードし、*さらに* `.kamal/secrets` 側でも防御的にトリムします：

```bash
RAILS_MASTER_KEY=$(printf '%s' "${RAILS_MASTER_KEY:-$(cat config/master.key 2>/dev/null)}" | tr -d '[:space:]')
```

これで、key が env var 経由（CI）でもファイル経由（ノート PC）でも、Rails が見る前に空白文字が剥がされます。

### 4. Rails の `HostAuthorization` が kamal-proxy のヘルスチェックを拒否

コンテナはブートし、アプリは ready。なのにデプロイは `target failed to become healthy within configured timeout (30s)` で失敗しました。ログ：

```
[ActionDispatch::HostAuthorization::DefaultResponseApp]
  Blocked hosts: ed30fb987044:80, ed30fb987044:80
```

kamal-proxy はコンテナの内部 Docker ホスト名（`ed30fb987044:80`）で `/up` をプローブします。Rails の `config.hosts` 許可リストには `shirimono.fun` と `*.shirimono.fun` が入っていて、どちらも Docker コンテナ ID にマッチしません。だから `HostAuthorization` が 403 を返し、kamal-proxy がコンテナを unhealthy 判定し、デプロイが abort します。

Rails にはまさにこのケース用の one-liner が同梱されています（`config/environments/production.rb` でデフォルトコメントアウト）：

```ruby
config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
```

これをアンコメントすれば、他のすべてのパスでホスト検証を効かせたままヘルスチェックが通ります。公開向けのセキュリティ境界は変わらず、コンテナ内部のプローブだけが通り抜けます。

---

## 諦めたもの

これはタダではありません。マネージドプラットフォームから VPS 1 台に行くということは、いまや次のものを自分で持つということです：

- **OS アップデート** — `unattended-upgrades` は入れていますが、kernel／セキュリティのトラッキングは私の責任。
- **バックアップ** — cron で `pg_dump` を毎晩 S3 へ + 14 日リテンション。マネージドな point-in-time recovery はなし。
- **モニタリング** — Honeybadger でアプリエラーは拾えるが、詳細な VPS メトリクスはない。マシンが死んだら、ユーザーから知らされる。
- **単一障害点** — VPS 1 台、HA なし。Shirimono の規模では許容範囲。

エンタープライズの有料顧客と SLO のあるアプリでは、この 4 つはどれも譲れません。代替が「他人にやってもらうために月 ~60 ドル払う」だけのソロ SaaS なら、まったく問題ありません。

---

## あなたもやるべきか？

価値あり：

- マネージドプラットフォームに月 50 ドル+ 払っているが、Kamal なら VPS 1 台で動かせる。
- スタックが Redis を *必要としない*。（Rails 8 + Solid Stack がスイートスポット。Sidekiq + Redis でも動くが、アクセサリが 1 つ増える。）
- 自分で OS パッチや cron バックアップをやることに抵抗がない。
- プラットフォーム固有のドキュメントを読まずに完全に理解できる構成が欲しい。

価値なし：

- デプロイ失敗の 30 分のダウンタイムで離脱するような顧客がいる。
- 深夜 3 時に「マシンが落ちている」ページを調査する余裕がない。
- プラットフォームの請求がすでに些細な額。

私にとっては計算は簡単でした：月 ~60 ドルあれば Anthropic クレジットや Stripe 手数料がたくさん買えますし、Shirimono のトラフィックは CPX21 1 台に余裕で乗ります。移行には午後 1 回 + 後片付けの夜数回。カットオーバー以来の運用オーバーヘッドはゼロです。

同じ移行を考えているなら、上の 4 つの落とし穴が私が一番時間を取られたものです。事前に知っておけば、皆さんの時間が浮くことを願っています。

---
*Claudeによる翻訳*
