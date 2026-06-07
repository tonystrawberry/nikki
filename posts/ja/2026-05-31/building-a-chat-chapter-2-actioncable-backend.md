---
title: "チャットを作る：第2章 — ActionCableバックエンド"
date: "2026-05-31"
excerpt: "コネクション認証、ビジターとアドミンのチャンネル、データモデル、Solid CableがRedisの代わりにSQLiteを使う仕組み。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["rails", "actioncable", "solid-cable", "sqlite", "websockets"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 2
collectionTitle: "リアルタイムチャットを作る"
---

> 💬 **これは、このサイトの右下に表示されているライブチャットそのものの実装です。** このシリーズでは、それをどう作ったかを順を追って解説します。チャットの吹き出しを開いて試してから、その仕組みを読み進めてみてください。

この章では、RailsのWebSocketサーバーを解説します。接続がどのように認証されるか、各チャンネルの内部で何が起こるか、そしてデータがSolid Cableを通じてどう流れるかを見ていきます。第1章のリポジトリ構成を理解していることが前提です。

## コネクション認証

`chat-server/app/channels/application_cable/connection.rb`を開いてください：

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :visitor_token, :admin

    def connect
      if request.params[:token].present?
        self.visitor_token = request.params[:token]
        self.admin = false
      elsif request.session[:admin] == true
        self.visitor_token = nil
        self.admin = true
      else
        reject_unauthorized_connection
      end
    end
  end
end
```

同じWebSocketエンドポイントを2種類のユーザーが共有します：

- **訪問者**はWebSocket URLに`?token=<UUID>`を渡します。トークンはブラウザの`localStorage`から取得されます。
- **管理者**は`POST /auth/login`の`AuthController`で設定されたRailsセッションCookieで認証します。
- それ以外は`reject_unauthorized_connection`で、HTTP 403を送信しソケットを閉じます。

`identified_by`は理解する価値があります。`:visitor_token`と`:admin`を各接続インスタンスのID属性として登録します。ActionCableはこれらを使って後から接続を検索します。`ActionCable.server.connections`を呼び出すと、各接続オブジェクトがこれらの属性を公開します。これにより`VisitorChannel`が管理者のオンライン状態を確認でき、`AdminChannel`がアクセスを制限できます。

## VisitorChannel

完全なソース：`chat-server/app/channels/visitor_channel.rb`（84行）。

**`subscribed`**は`connection.visitor_token`からトークンを読み取り、`stream_from "visitor_#{@session_token}"`を呼び出し、そのトークンの`Conversation`レコードが既に存在する場合は既存のメッセージ履歴を送信します。

**`send_message(data)`**が主要なロジックです。フローをステップごとに見ていきます：

```
1. 訪問者が  { action: "send_message", content: "Hello!" } を送信
2. VisitorChannel#send_message がcontentを検証（空チェック、2000文字上限）
3. Conversation.find_or_create_by!(session_token:) でレコードを作成または検索
4. conversation.messages.create!(sender: "visitor", content: "Hello!")
5. conversation.increment!(:unread_count)
6. "visitor_{token}" にブロードキャスト   --> 訪問者にメッセージ確認が届く
7. "admin_channel" にブロードキャスト     --> 管理者にnew_messageイベントが届く
8. admin_connected? --> falseなら PushNotificationService.notify
```

バリデーションはシンプルで、空メッセージと2000文字を超えるメッセージは`transmit({ type: "error", ... })`で送信者に返却されます：

```ruby
content = data["content"].to_s.strip
return transmit({ type: "error", error: "Message is empty" }) if content.blank?
return transmit({ type: "error", error: "Message too long (max 2000)" }) if content.length > 2000
```

`admin_connected?`はライブ接続を検査します：

```ruby
def admin_connected?
  ActionCable.server.connections.any? { |c| c.admin == true }
rescue
  false
end
```

これが機能するのは、`identified_by :admin`が`.admin`をすべての接続オブジェクトでアクセス可能にしたからです。管理者ソケットが開いていない場合、チャンネルは代わりにWeb Push通知を送信します。

**設計上の判断：** メッセージはHTTP POSTではなく、ActionCableを通じて作成されます。WebSocket接続が書き込みパスそのものです。トレードオフ：シンプル（メッセージ用のRESTエンドポイントが不要）ですが、ソケットがダウンしていると送信できません。個人ブログのチャットウィジェットなら、メッセージキューやリトライロジックは不要です。

## AdminChannel

完全なソース：`chat-server/app/channels/admin_channel.rb`（110行）。

**`subscribed`**は管理者でない接続を拒否し、`"admin_channel"`からストリームし、プライベートな`serialized_conversations`メソッドで会話リスト全体を送信します：

```ruby
def subscribed
  unless connection.admin
    reject
    return
  end

  stream_from "admin_channel"

  transmit({
    type: "conversations",
    conversations: serialized_conversations
  })
end
```

**`send_message(data)`**はIDで会話を検索し、`sender: "admin"`でメッセージを作成し、_2つの_ストリームにブロードキャストします：

```ruby
ActionCable.server.broadcast("visitor_#{conversation.session_token}", { ... })
ActionCable.server.broadcast("admin_channel", { ... })
```

管理者チャンネルが`conversation.session_token`を使って訪問者のストリームにアクセスしている点に注目してください。ブロードキャストメカニズムを通じてチャンネルの境界を越えています — チャンネルはサブスクリプションのスコープであり、分離の壁ではありません。

**`mark_read(data)`**は`conversation.unread_count`を0にリセットします。**`get_history(data)`**は指定された会話のすべてのメッセージを送信します。**`list_conversations`**はオンデマンドで会話リスト全体を再送信します。

## データモデル

`chat-server/db/schema.rb`を参照してください。3つのテーブルがあります：

| テーブル | 主要カラム | 注目すべきインデックス |
|-------|-------------|-----------------|
| `conversations` | `session_token`（ユニーク）、`visitor_name`、`unread_count` | ソート用の`updated_at` |
| `messages` | `conversation_id`（FK）、`sender`、`content`（text） | 複合`(conversation_id, created_at)` |
| `push_subscriptions` | `endpoint`（ユニーク）、`p256dh`、`auth` | `endpoint`にユニーク |

重要なモデルの詳細は`chat-server/app/models/message.rb`にあります：

```ruby
class Message < ApplicationRecord
  belongs_to :conversation, touch: true
end
```

`touch: true`は、すべての`messages.create!`が自動的に`conversation.updated_at`を更新することを意味します。管理パネルは会話を`updated_at DESC`でソートするため、最近アクティブな会話が自動的に一番上に表示されます — 追加のクエリは不要です。

## Solid Cable — pub/subアダプター

ActionCableにはブロードキャストをルーティングするpub/subバックエンドが必要です。このプロジェクトではSolid Cableを使用しており、`chat-server/config/cable.yml`で設定されています：

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

Solid Cableはブロードキャストメッセージを専用のSQLiteデータベースに保存し、新しいエントリをポーリングします。`polling_interval: 0.1.seconds`で約100msのレイテンシーになります。`message_retention: 1.day`は古いブロードキャスト行を自動削除し、テーブルを小さく保ちます。

他のアダプターとの比較：

| アダプター | 外部依存 | レイテンシー | 水平スケーリング |
|---------|---------------------|---------|---------------------|
| `solid_cable` | なし（SQLite） | 〜100ms | 不可（シングルプロセス） |
| `redis` | Redisサーバー | 〜1ms | 可 |
| `async` | なし | 〜0ms | 不可（同一プロセスのみ） |

このコードベースが`solid_cable`を選んだ理由は、管理するRedisがなく、SQLiteがアプリケーションデータベースとして既にあり、個人ブログに水平スケーリングは不要だからです。後にサブ10msの配信や複数のRailsプロセスが必要になったら、アダプターを`redis`に切り替えるだけで済みます — チャンネルのコード変更は不要です。

---

バックエンドはこれで名前付きストリームにメッセージをブロードキャストしています。第3章では、Next.jsフロントエンドが`@rails/actioncable` npmパッケージを使ってこれらのストリームをサブスクライブする方法と、ReactコンポーネントがWebSocketライフサイクルを無限再レンダリングの罠に陥ることなく管理する方法を示します。

## やってみよう

**演習1.** Railsコンソールを開き、訪問者ストリームに手動でテストメッセージをブロードキャストしてください。トークン`abc-123`で接続中の訪問者がいる場合：

```ruby
ActionCable.server.broadcast("visitor_abc-123", {
  type: "message",
  message: { id: 999, sender: "admin", content: "Test from console", created_at: Time.current.iso8601 }
})
```

フロントエンドの表示を確認してください。（注意：`solid_cable`では、別の`bin/rails console`からではなく、Railsサーバープロセス内からブロードキャストする必要があります。`cable.yml`の先頭のコメントを参照してください。）

<details>
<summary>解答</summary>

訪問者のチャットウィジェットに「Test from console」が管理者メッセージとして表示されるはずです。フロントエンドが既にそのストリームをサブスクライブしているため、即座に表示されます。このメッセージはデータベースに永続化されません — `Message.create!`をスキップして生データをブロードキャストしただけです。訪問者がリフレッシュすると、このゴーストメッセージは消えます。

</details>

**演習2.** `config/cable.yml`の`polling_interval`を`2.seconds`に変更し、Railsを再起動してメッセージを送信してください。レイテンシーの増加に注目してください。

<details>
<summary>解答</summary>

メッセージの受信側での表示に最大2秒かかるようになります。Solid Cableのポーラーが100msごとではなく2秒ごとにブロードキャストテーブルをチェックするためです。終わったら`0.1.seconds`に戻してください。

</details>

**演習3.** `VisitorChannel#send_message`に、「spam」を含むメッセージを拒否する`banned_words`チェックを追加してください。訪問者にエラーを返してください。

<details>
<summary>解答</summary>

`chat-server/app/channels/visitor_channel.rb`の既存のバリデーション行の後に以下を追加してください：

```ruby
banned = %w[spam]
if banned.any? { |w| content.downcase.include?(w) }
  return transmit({ type: "error", error: "Message contains a banned word" })
end
```

空チェック/長さチェックの後、`find_or_create_by!`の前に配置してください。訪問者は`{ type: "error", error: "Message contains a banned word" }`を受け取り、メッセージは永続化されません。

</details>

**演習4.** `chat-server/app/models/message.rb`を開き、`belongs_to :conversation`から`touch: true`を削除してください。メッセージを送信して、管理パネルで会話リストが正しくソートされるか確認してください。

<details>
<summary>解答</summary>

正しくソートされなくなります。`touch: true`がないと、新しいメッセージが作成されても`conversation.updated_at`が更新されません。管理パネルは`Conversation.order(updated_at: :desc)`でクエリするため、新しいメッセージのある会話が上に浮かんでこなくなります。動作を元に戻すには`touch: true`を再追加してください。

</details>

---
*Claudeによる翻訳*
