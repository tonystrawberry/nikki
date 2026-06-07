---
title: "チャットを作る：第4章 — 管理画面とプッシュ通知"
date: "2026-05-31"
excerpt: "管理者認証、1つのWebSocketで複数の会話を管理する方法、VAPIDキーからService Workerまでの完全なWeb Pushパイプライン。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["rails", "web-push", "vapid", "service-worker", "react"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 4
collectionTitle: "リアルタイムチャットを作る"
---

> 💬 **これは、このサイトの右下に表示されているライブチャットそのものの実装です。** このシリーズでは、それをどう作ったかを順を追って解説します。チャットの吹き出しを開いて試してから、その仕組みを読み進めてみてください。

第2章と第3章の訪問者側チャットは物語の半分です。この章ではもう半分を扱います：管理者がどう認証するか、`AdminChat.tsx`が1つのWebSocketで多数の会話をどう多重化するか、そしてWeb Push通知がブラウザタブを閉じた後も管理者にどう届くかです。

## 管理者認証フロー

管理ページは`src/app/admin/`に配置されています — `[locale]`ルートツリーの外です。Next.js App Routerはすべてのルートツリーが`<html>`タグと`<body>`タグを提供することを要求するため、独自のルートレイアウト（`src/app/admin/layout.tsx`）が必要です。ブログは`src/app/[locale]/layout.tsx`からそれらを取得するため、`/admin/*`は別ツリーになります。

ログインシーケンス：

```
1. 管理者が /admin/login にアクセス
2. AdminLoginPage がフォームをレンダリング            (src/app/admin/login/page.tsx)
3. フォーム送信 -> adminLogin(user, pass)             (src/lib/chat-client.ts)
4. fetch POST /auth/login                             (credentials: "include")
5. AuthController が ENV変数をチェック                 (chat-server/app/controllers/auth_controller.rb)
6. 一致 -> session[:admin] = true、{ ok: true }を返す
7. ブラウザが _chat_server_session Cookie を保存
8. ルーターが /admin/chats に遷移
9. AdminChat がWebSocket接続 -- Connection#connect がsession[:admin]を読む
```

コントローラー（`chat-server/app/controllers/auth_controller.rb`）は2つの環境変数と比較します：

```ruby
if username == ENV["ADMIN_USER"] && password == ENV["ADMIN_PASSWORD"]
  session[:admin] = true
  render json: { ok: true }
end
```

ユーザーテーブルなし、パスワードハッシュなし、リカバリーフローなし。単一管理者の個人ブログ向け：柔軟性ゼロですが、環境変数以外の攻撃面もゼロです。WebSocket接続は同じセッションを読み取って`self.admin = true`を設定します（第2章）。

## AdminChat.tsx — 1つのWebSocketで多数の会話を管理

第3章の訪問者`ChatWidget`は1つの会話を処理します。`AdminChat`は単一の`AdminChannel`サブスクリプションですべての会話を処理し、2段階のステートを持ちます：

```typescript
// src/components/AdminChat.tsx
const [conversations, setConversations] = useState<ChatConversation[]>([]);  // 一覧
const [selectedId, setSelectedId] = useState<number | null>(null);           // 詳細
const [messages, setMessages] = useState<ChatMessage[]>([]);                 // 詳細
```

`received`コールバックは4つのイベントタイプで分岐します：

| イベントタイプ             | 効果                                                                       |
|------------------------|------------------------------------------------------------------------------|
| `conversations`        | 会話リスト全体を置換（接続時に送信）                                          |
| `new_message`          | `last_message` / `unread_count`を更新；選択中ならメッセージを追加             |
| `history`              | 選択された会話のメッセージリストを置換                                         |
| `conversation_deleted` | リストから削除；削除されたものが選択中なら選択をクリア                          |

`new_message`ハンドラーには微妙なエッジケースがあります。まだリストにない会話（新しい訪問者）のメッセージが到着した場合、部分的なオブジェクトを構築するのではなく、サーバーにリフレッシュを要求します：

```typescript
const exists = prev.some((c) => c.id === data.conversation_id);
if (!exists) {
  subscriptionRef.current?.perform("list_conversations");
  return prev;
}
```

第3章の`selectedIdRef`パターンがここにも現れます — コールバックは`selectedIdRef.current`を読んでメッセージを追加するか判断しますが、会話を切り替えるたびにサブスクリプションを再作成することはありません。

会話を選択すると、同じWebSocketを通じて2つのサーバーアクションが発火します：

```typescript
subscriptionRef.current?.perform("get_history", { conversation_id: id });
subscriptionRef.current?.perform("mark_read", { conversation_id: id });
```

未読カウントはクライアント側で楽観的にゼロにされ、サーバーが変更を永続化します。

## Web Pushパイプライン

プッシュ通知には4者が関わります：管理者のブラウザ、Next.jsフロントエンド、Railsバックエンド、プッシュサービス（Google FCM、Mozilla autopush）。これらのサービスへの登録は不要です — VAPIDキーが認証を処理します。

### 登録

`AdminChat`が接続すると、プッシュに登録します。`src/components/AdminChat.tsx`の`registerPushNotifications`は4つのことを行います：

1. Service Worker（`/sw-chat.js`）を登録
2. 通知の許可をリクエスト
3. VAPIDパブリックキーでプッシュサービスにサブスクライブ
4. `{ endpoint, p256dh, auth }`をRailsにPOST

```typescript
// src/components/AdminChat.tsx
const registration = await navigator.serviceWorker.register("/sw-chat.js");
const permission = await Notification.requestPermission();
if (permission !== "granted") return;

const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
});

const json = subscription.toJSON();
await fetch(`${getChatHttpUrl()}/push_subscriptions`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  }),
});
```

Railsはこの3つのフィールドを`push_subscriptions`テーブルに保存します — 後で暗号化ペイロードを送信するために必要なすべてです。

### 通知の送信

トリガーは`VisitorChannel#send_message`（第2章）にあります。両方のストリームにブロードキャスト後、アクティブな管理者WebSocketを確認します：

```ruby
# chat-server/app/channels/visitor_channel.rb
unless admin_connected?
  PushNotificationService.notify(conversation.visitor_name, content) rescue nil
end
```

`PushNotificationService`（`chat-server/app/services/push_notification_service.rb`）は保存されたすべてのサブスクリプションを反復し、VAPID認証情報を使って`WebPush.payload_send`を呼びます。サブスクリプションが410 Goneを返した場合、`WebPush::ExpiredSubscription`をキャッチして古いレコードを削除します。

### VAPIDキー

プッシュサービスに対してサーバーを識別する公開鍵/秘密鍵ペアです。以下で生成します：

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts k.public_key; puts k.private_key"
```

パブリックキーは`.env.local`（`NEXT_PUBLIC_VAPID_PUBLIC_KEY`）と`chat-server/.env`（`VAPID_PUBLIC_KEY`）に配置します。プライベートキーはバックエンド側のみに保持します。

## Service Worker

`public/sw-chat.js`は2つのイベントリスナーを持つ30行のファイルです。`push`は暗号化ペイロードをパースして`showNotification`を呼びます。`notificationclick`は通知を閉じ、既存の`/admin/chats`タブにフォーカスを試み、なければ新しいタブを開きます。

重要な特性：Service Workerは別スレッドで動作し、タブを閉じた後も永続します。プッシュ通知が管理者がページにいないときでも機能するのは、まさにこれが理由です。

## 次のステップ

機能はローカルで動作しています。第5章ではデプロイを扱います — Kamal 2がRailsアプリをDockerコンテナにパッケージし、Hetzner VPSに配送し、SSL、環境シークレット、GitHub Actions CIを接続する方法です。

## やってみよう

### 1. プッシュサブスクリプションの確認

DevToolsのApplicationタブで`/admin/chats`を開いてください。Service Workersで`sw-chat.js`を、Push Messagingでサブスクリプションの詳細を確認してください。

<details>
<summary>解答</summary>

Chromeの場合：DevTools > Application > Service Workersに`sw-chat.js`がステータス「activated and is running」で表示されます。Application > Storage > Push Messagingで、サブスクリプションの`endpoint` URL（Chromeでは`fcm.googleapis.com`を指す）と、`/push_subscriptions`にPOSTされた内容と一致する`p256dh`および`auth`キーが表示されます。

</details>

### 2. VAPIDキーのローテーション

Rails runnerコマンドで新しいキーを生成してください。`.env.local`と`chat-server/.env`の両方で置き換えてください。両方のサーバーを再起動し、プッシュが引き続き動作することを確認してください。（片方だけ更新すると、キーの不一致でサブスクリプションが失敗します。）

<details>
<summary>解答</summary>

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts k.public_key; puts k.private_key"
```

1行目を`NEXT_PUBLIC_VAPID_PUBLIC_KEY`（`.env.local`）と`VAPID_PUBLIC_KEY`（`chat-server/.env`）にコピーします。2行目を`VAPID_PRIVATE_KEY`（`chat-server/.env`）にコピーします。両方のサーバーを再起動します。`applicationServerKey`が変わったため、ブラウザは接続時に新しいプッシュサブスクリプションを作成します。

</details>

### 3. 通知にメッセージ数を含める

通知の本文に会話のメッセージ数を表示するよう、`PushNotificationService`を修正してください。

<details>
<summary>解答</summary>

`chat-server/app/channels/visitor_channel.rb`で、conversationオブジェクトを渡します：

```ruby
PushNotificationService.notify(conversation, content) rescue nil
```

`chat-server/app/services/push_notification_service.rb`で：

```ruby
def self.notify(conversation, message_content)
  payload = {
    title: "New message from #{conversation.visitor_name}",
    body: "#{message_content.truncate(100)} (#{conversation.messages.count} messages)",
    url: "/admin/chats"
  }.to_json
  # ... rest unchanged
end
```

</details>

### 4. 通知サウンドの追加

プッシュ通知がシステムサウンドを再生するよう、`public/sw-chat.js`を修正してください。

<details>
<summary>解答</summary>

`push`リスナーの通知オプションに`silent: false`を追加します：

```javascript
self.registration.showNotification(data.title || "New message", {
  body: data.body || "",
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  data: { url: data.url || "/admin/chats" },
  silent: false,
})
```

`silent: false`はほとんどのプラットフォームでデフォルトです — `silent: true`が設定されていない限り、通知は既にシステムサウンドを再生します。`sound`プロパティによるカスタムサウンドはブラウザのサポートが一貫していません。

</details>

---
> 🌐 *Claudeによる翻訳*
