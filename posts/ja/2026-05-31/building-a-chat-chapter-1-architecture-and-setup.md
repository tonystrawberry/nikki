---
title: "チャットを作る：第1章 — アーキテクチャとセットアップ"
date: "2026-05-31"
excerpt: "2つのアプリケーション、4つの基本概念、Rails ActionCableとNext.jsをWebSocketで接続する方法。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["rails", "nextjs", "actioncable", "websockets", "architecture"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 1
collectionTitle: "リアルタイムチャットを作る"
---

> 💬 **これは、このサイトの右下に表示されているライブチャットそのものの実装です。** このシリーズでは、それをどう作ったかを順を追って解説します。チャットの吹き出しを開いて試してから、その仕組みを読み進めてみてください。

このチュートリアルでは、Next.jsブログ向けに構築されたリアルタイムチャット機能を解説します。訪問者はチャットウィジェットを開いてサイト管理者と会話します。管理者はダッシュボードですべての会話を確認できます。メッセージは双方向にリアルタイムで届きます。

興味深いポイントは、フロントエンドがNext.js 16アプリ、バックエンドがRails 8 APIという構成です。それぞれ別プロセス、別ポートで動作し、WebSocketで接続されています。この章では各パーツがどのように組み合わさるかを説明し、両方のサーバーをローカルマシンで起動するところまで進めます。

## 2つの独立したアプリ

プロジェクトは2つのコードベースで構成されています：

| | フロントエンド | バックエンド |
|---|---|---|
| **フレームワーク** | Next.js 16 (App Router) | Rails 8 (APIオンリー) |
| **パス** | `/` (リポジトリルート) | `chat-server/` (gitサブモジュール) |
| **ポート** | 3000 | 3100 |
| **デプロイ先** | Vercel | Kamal 2 (Docker) |
| **通信手段** | `@rails/actioncable` (WebSocket) + `fetch` (HTTP) | ActionCable + RESTコントローラー |

フロントエンドは訪問者が目にするすべてを担当します：ブログ、フローティングチャットバブル、管理ダッシュボード。バックエンドはリアルタイム処理をすべて担当します：WebSocket接続、メッセージの永続化、プッシュ通知。

## 4つの基本概念

### 1. WebSocket vs HTTP

HTTPはリクエスト-レスポンス方式です。クライアントが要求し、サーバーが応答し、接続が閉じます。WebSocketは永続的な双方向パイプで、どちらの側からでも相手の要求なしにいつでもデータを送信できます。

このプロジェクトでは、双方向のすべてのメッセージングにWebSocketを使用します。HTTPは3つの用途にのみ使用されます：管理者ログイン、会話の一覧取得・削除、プッシュサブスクリプションの登録です。

### 2. ActionCable

ActionCableはRails組み込みのWebSocketフレームワークです。3つのレイヤーがあります：

- **Connection** — WebSocketアップグレードリクエストを認証します。`chat-server/app/channels/application_cable/connection.rb`に配置されています。このコードベースでは`identified_by`を使って2種類の接続を識別します：

```ruby
identified_by :visitor_token, :admin
```

- **Channel** — 接続ができることの範囲を定義します。このコードベースには2つあります：`VisitorChannel`（ブラウザセッションごとに1つ）と`AdminChannel`（全会話用に1つ）。
- **Consumer** — クライアント側の対応物で、`@rails/actioncable` npmパッケージが提供します。`createConsumer(url)`関数がWebSocketを開き、`subscriptions.create()`を呼び出すためのオブジェクトを返します。

### 3. Solid Cable

従来のActionCableデプロイにはpub/sub用のRedisが必要でした。Rails 8ではSolid Cableがデフォルトアダプターとして搭載されており、pub/subメッセージをRedisの代わりにSQLiteに保存します。

設定は最小限です。`chat-server/config/cable.yml`より：

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

トレードオフ：Redisプロセスの管理は不要になりますが、水平スケーリングはできません。1つのPumaプロセス、1つのSQLiteファイル。個人ブログにはこれが正しい選択です。

### 4. クロスオリジン認証

フロントエンドは`localhost:3000`、バックエンドは`localhost:3100`で動作します。ブラウザはデフォルトでクロスオリジンCookieをブロックするため、2つの設定が必要です：

**サーバー側** — `chat-server/config/initializers/cors.rb`がフロントエンドオリジンを`credentials: true`で許可します：

```ruby
origins(*ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",").map(&:strip))
resource "*", headers: :any, methods: [...], credentials: true
```

**クライアント側** — `src/lib/chat-client.ts`のすべての`fetch`呼び出しで`credentials: "include"`を設定し、ブラウザがクロスオリジンでCookieを送信するようにします。

管理者認証にはRailsセッションCookieを使用します。訪問者認証はよりシンプルで、WebSocket URLにクエリパラメータとしてUUIDトークンを渡します：

```typescript
visitorConsumer = createConsumer(`${WS_URL}?token=${sessionToken}`);
```

## リポジトリ構成

```
src/
  components/
    ChatWidget.tsx           # 訪問者用のフローティングバブル
    ChatPanel.tsx            # 共有メッセージ表示コンポーネント
    AdminChat.tsx            # 会話一覧付きの管理ダッシュボード
  lib/
    chat-client.ts           # ActionCable Consumerファクトリー + HTTPヘルパー
    chat-types.ts            # チャンネルデータ用TypeScript判別共用体
  types/
    actioncable.d.ts         # @rails/actioncable用の手書き型宣言
  app/
    admin/
      login/page.tsx         # 認証フォーム -> POST /auth/login
      chats/page.tsx         # AdminChatコンポーネントをレンダリング

chat-server/
  app/
    channels/
      application_cable/
        connection.rb        # デュアル認証: 訪問者トークン OR 管理者セッション
      visitor_channel.rb     # ブラウザセッションごとに1チャンネル
      admin_channel.rb       # 全会話用に1チャンネル
    controllers/
      auth_controller.rb     # ENV変数ベースのログイン、session[:admin]を設定
      conversations_controller.rb
      push_subscriptions_controller.rb
    models/
      conversation.rb        # session_token + visitor_name + unread_count
      message.rb             # sender (visitor|admin) + content
      push_subscription.rb   # Web Pushサブスクリプションデータ
    services/
      push_notification_service.rb
  config/
    cable.yml                # Solid Cableアダプター設定
    puma.rb                  # ポート3100、シングルモード
    routes.rb                # ActionCableを/cableにマウント
```

`src/app/admin/`の管理セクションはi18nの`[locale]`ルートグループの外に配置されています。独自の`layout.tsx`に`<html>`タグと`<body>`タグを持ちます。ブログとは完全に別のページシェルです。

## アプリ実行時の動作

**ターミナル1** — フロントエンドを起動：

```bash
npm run dev
```

Next.jsがポート3000で起動します。重要な2つの環境変数は`.env.local`にあります：

```
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3100/cable
NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3100
```

**ターミナル2** — バックエンドを起動：

```bash
cd chat-server
ADMIN_USER=tony ADMIN_PASSWORD=secret bin/rails server -p 3100
```

Pumaがポート3100で起動します（`config/puma.rb`の`port ENV.fetch("PORT", 3100)`で設定）。ActionCableは`config/routes.rb`で`/cable`にマウントされています：

```ruby
mount ActionCable.server => "/cable"
```

RailsはAPIオンリーモードで設定されており（`config/application.rb`の`config.api_only = true`）、セッションミドルウェアが除外されています。しかし管理者認証にはセッションが必要なため、2行で追加し直しています：

```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore, key: "_chat_server_session"
```

訪問者がチャットウィジェットを開くと、フロントエンドは`src/lib/chat-client.ts`の`getVisitorConsumer(sessionToken)`を呼び出します。この関数はWebSocket URLに`?token=`クエリパラメータを付けて`createConsumer()`を呼びます。ブラウザが`ws://localhost:3100/cable?token=<uuid>`へのWebSocketを開きます。Railsの`Connection#connect`メソッドが`request.params[:token]`をチェックし、存在を確認して接続を受け入れます。

## セットアップ

前提条件：Node.js 18以上、Ruby 3.2以上、SQLite3。

```bash
# フロントエンドの依存関係
npm install

# バックエンドの依存関係
cd chat-server
bundle install
bin/rails db:prepare

# 環境ファイル
cd ..
cp .env.example .env
cp .env.local.example .env.local
```

`.env.local`を編集して、デフォルト値がお使いの環境と合わない場合は`NEXT_PUBLIC_CHAT_WS_URL`と`NEXT_PUBLIC_CHAT_HTTP_URL`を設定してください。その後、別々のターミナルで両方のサーバーを起動します。

---

2つの半分が動作するのを確認できたので、第2章ではRailsバックエンドに踏み込みます。ActionCableが接続をどう認証するか、`VisitorChannel`と`AdminChannel`の中で何が起こるか、そしてメッセージがSolid Cableを通じてあるブラウザから別のブラウザにどう流れるかを見ていきます。

## やってみよう

**演習1.** 両方のサーバーを起動してください。ブラウザのDevToolsを開き、Networkタブで「WS」でフィルタリングします。ブログのチャットウィジェットを開いてください。`ws://localhost:3100/cable?token=...`へのWebSocket接続が表示されるはずです。フレームを確認してください — ハンドシェイク後にサーバーが送信する最初のメッセージは何ですか？

<details>
<summary>解答</summary>

最初のメッセージは`{"type":"welcome"}`というJSONオブジェクトです。これはActionCableのハンドシェイク確認です。その後、クライアントが`VisitorChannel`に対する`subscribe`コマンドを送信し、サーバーが`{"type":"confirm_subscription",...}`で応答します。

</details>

**演習2.** `chat-server/config/puma.rb`でデフォルトポートを`3100`から`3200`に変更してください。Railsサーバーを再起動します。何が壊れますか？どう修正しますか？

<details>
<summary>解答</summary>

チャットウィジェットが接続できなくなります。フロントエンドはまだ`ws://localhost:3100/cable`を指しています。修正するには、`.env.local`の両方の環境変数を更新します：

```
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3200/cable
NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3200
```

Rails側の`ALLOWED_ORIGINS`も更新する必要があります（ただし、フロントエンドのオリジンが変わっていないため、デフォルトの`http://localhost:3000`はそのまま機能します — バックエンドのポートだけが移動しました）。両方のサーバーを再起動してください。

</details>

**演習3.** `chat-server/config/application.rb`で、`Cookies`と`Session::CookieStore`を追加する2行の`config.middleware.use`をコメントアウトしてください。Railsを再起動します。`/admin/login`で管理者ログインを試してください。何が起こりますか？なぜですか？

<details>
<summary>解答</summary>

`/auth/login`へのログインPOSTは成功します（`{ "ok": true }`を返します）が、CookieミドルウェアがなくなったためセッションCookieが設定されません。その後フロントエンドが管理者用のWebSocketを開くとき、`Connection#connect`が`request.session[:admin]`をチェックしますが、セッションが存在しないため`nil`です。接続は拒否されます。管理ダッシュボードは切断状態を表示します。行のコメントアウトを元に戻して再起動すれば修正できます。

</details>

**演習4.** `src/lib/chat-types.ts`の`VisitorChannelData`型を読んでください。`type`フィールドによる判別共用体です。仮想的な4番目のバリアント`{ type: "typing"; is_typing: boolean }`を共用体に追加してください。フロントエンドコードのどこでこの新しいバリアントを処理する必要がありますか？

<details>
<summary>解答</summary>

この型は`src/lib/chat-client.ts`の`subscribeVisitorChannel()`に渡される`received`コールバックで使用されます。この関数を呼び出すすべてのコンポーネントが`received`コールバックでデータを処理します — 主に`ChatWidget.tsx`です。受信メッセージを処理するswitch文/条件分岐に`case "typing":`ブランチ（または`if (data.type === "typing")`）を追加し、タイピングインジケーターを表示するようUIを更新します。

</details>

---
*Claudeによる翻訳*
