---
title: "チャットを作る：第3章 — フロントエンドクライアント"
date: "2026-05-31"
excerpt: "TypeScript ActionCableクライアント、チャンネルデータの判別共用体、ReactのWebSocketライフサイクル、無限再接続を防ぐuseRefパターン。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["typescript", "react", "actioncable", "nextjs", "websockets"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 3
collectionTitle: "リアルタイムチャットを作る"
---

> 💬 **これは、このサイトの右下に表示されているライブチャットそのものの実装です。** このシリーズでは、それをどう作ったかを順を追って解説します。チャットの吹き出しを開いて試してから、その仕組みを読み進めてみてください。

第2章のRailsサーバーはWebSocketを通じてJSONをブロードキャストしています。この章では、それを消費するTypeScriptレイヤーを扱います：ActionCableクライアントラッパー、チャンネルデータの型システム、ChatWidgetのライフサイクル、そして恥ずかしい時間を費やしてようやく正しく実装できた`useRef`パターンです。

## ActionCableクライアントレイヤー

**ファイル：** `src/lib/chat-client.ts`

このモジュールはReactとRailsのWebSocketサーバーの間に位置します。2つのモジュールレベルのシングルトンが、ロールごとに正確に1つの接続を保証します：

```typescript
let visitorConsumer: Consumer | null = null;
let adminConsumer: Consumer | null = null;
```

`createConsumer`がWebSocketを開きます。訪問者はクエリパラメータで認証し（`createConsumer(\`${WS_URL}?token=${sessionToken}\`)`）、管理者はセッションCookieで認証します — トークンなし、`adminLogin`で設定されたCookieのみです。Railsサーバーへのすべての`fetch`呼び出しは`credentials: "include"`を使用しており、ブラウザがクロスオリジンでCookieを送受信するために必要です。これはREST呼び出しとWebSocketアップグレードハンドシェイクの両方に適用されます。

`subscribeVisitorChannel`と`subscribeAdminChannel`は`consumer.subscriptions.create`を型付きコールバックでラップし、適切なチャンネルデータ共用体に型付けされた`received`関数を受け取ります。

### 欠落した型宣言

`@rails/actioncable`はTypeScript宣言をまったく同梱していません。このプロジェクトでは`src/types/actioncable.d.ts`に手書きの型を含めています — `Consumer`、`Subscription`、`CreateMixin`、`createConsumer`を定義する`declare module`です。このファイルがないと`npm run build`が失敗します。型は最小限で、呼び出すものだけを宣言しています。

## 型安全なチャンネルデータ

**ファイル：** `src/lib/chat-types.ts`

チャンネルデータは`type`フィールドをキーとする判別共用体を使用します：

```typescript
export type VisitorChannelData =
  | { type: "history"; conversation: { id: number; visitor_name: string }; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "error"; error: string };
```

`switch (data.type)`の中で、TypeScriptは自動的に型を絞り込みます — `case "history":`の内部では、`data.messages`が存在し`ChatMessage[]`型であることが保証されます。`AdminChannelData`も同じパターンに従い、5つのバリアント（`conversations`、`new_message`、`history`、`conversation_deleted`、`error`）があります。

これらの型はRailsチャンネル（第2章）のJSON構造をミラーしています。コード生成はなく、手動で同期を維持し、ビルド時にコンパイラが不一致を検出します。

## ChatWidgetライフサイクル

**ファイル：** `src/components/ChatWidget.tsx`

ウィジェットには3つの状態があります：

| 状態 | `isOpen` | `hasName` | WebSocket | UI |
|-------|----------|-----------|-----------|-----|
| 閉じている | `false` | -- | なし | フローティングボタン |
| 開いている、名前なし | `true` | `false` | なし | 名前入力フォーム |
| 開いている、チャット中 | `true` | `true` | 接続済み | メッセージ付きChatPanel |

WebSocket接続は状態3でのみ存在し、サブスクリプションエフェクトの先頭のガードで強制されます：

```typescript
useEffect(() => {
  if (!isOpen || !hasName) return;
  const sub = subscribeVisitorChannel(tokenRef.current, { received, connected, disconnected });
  return () => { sub.unsubscribe(); disconnectVisitor(); };
}, [isOpen, hasName]);
```

セッションIDは`localStorage`のUUIDです：

```typescript
function getSessionToken(): string {
  let token = localStorage.getItem("chat_session_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("chat_session_token", token);
  }
  return token;
}
```

これは`find_or_create_by!(session_token:)`（第2章）を通じて`Conversation`と1対1で対応します。同じトークン＝ページリフレッシュ後も同じ会話。訪問者の名前は別途保存されるため、再訪時に名前フォームがスキップされます。

接続時にサーバーは`"history"`イベントを送信します。`"message"`ハンドラーはデデュプリケーション（`prev.some(m => m.id === data.message.id)`）を使用して、ActionCableが短時間の切断後に再送信したときの二重レンダリングを防止します。

## useRefの罠

これはこのコードベースで最も難しいバグです。修正なしの場合：

```
1. useEffectが実行 → サブスクリプションを作成
2. メッセージ到着 → received()がsetMessages()を呼ぶ
3. 再レンダリング。isOpenはまだtrueだが新しいクロージャ参照
4. エフェクトクリーンアップ実行 → エフェクト再実行 → 新しいサブスクリプション
5. サーバーが履歴を送信 → setMessages() → 再レンダリング → 4に戻る
```

Railsサーバーのログが接続/切断のペアで溢れます。修正方法：`isOpen`を依存配列に参加させずに追跡するrefを使います：

```typescript
const isOpenRef = useRef(isOpen);
useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
```

`received`コールバック内では、`isOpen`の代わりに`isOpenRef.current`を読みます。refはサブスクリプションエフェクトを再実行させることなく最新の値を取得できます。

同じパターンが`src/components/AdminChat.tsx`の`selectedIdRef`にも現れます — 管理者のコールバックは、選択された会話IDが必要ですが、ユーザーが別の会話をクリックするたびに再サブスクライブしないようにする必要があります。

ルール：`useEffect`内のコールバックが頻繁に変わる値を必要とするが、その変更でエフェクト自体を再実行すべきでない場合は、refを使ってください。

## ChatPanel — 共有メッセージコンポーネント

**ファイル：** `src/components/ChatPanel.tsx`

ChatPanelは訪問者ウィジェットと管理ダッシュボードの両方で使用されるプレゼンテーショナルコンポーネントです。props として`messages`、`onSendMessage`、`isConnected`を受け取ります。どちら側を表しているかは知りません。

自動スクロールはメッセージリストの末尾にある非表示の`<div ref={messagesEndRef} />`を使い、`messages`が変更されるたびに`useEffect`でビューにスクロールします。メッセージの配置は`msg.sender`で決まります — 訪問者のメッセージは右、管理者のメッセージは左。AdminChatでは同じロジックが反転します。親がパースペクティブを制御します。

---

訪問者側はこれでエンドツーエンドで接続されました — フローティングボタンからWebSocketサブスクリプション、メッセージレンダリングまで。第4章では管理者体験を扱います：管理ダッシュボードが単一のWebSocket上で複数の会話をどう管理するか、そしてWeb Push通知が管理者がブラウザから離れているときにどうアラートするかです。

## やってみよう

**演習1：セッション分離の確認**

2つのブラウザ（または通常＋シークレット）でチャットウィジェットを開いてください。両方からメッセージを送信します。Railsコンソールで`Conversation.last(2)`を実行し、異なる`session_token`値を持つ2つのレコードを確認してください。

<details>
<summary>解答</summary>

```ruby
Conversation.last(2).pluck(:id, :session_token, :visitor_name)
# => [[2, "a1b2c3...", "Alice"], [1, "d4e5f6...", "Bob"]]
```

各ブラウザが`crypto.randomUUID()`で独自のUUIDを生成し、それぞれの`localStorage`に保存しています。

</details>

**演習2：タイピングインジケーター型の追加**

`src/lib/chat-types.ts`で、`VisitorChannelData`に`| { type: "typing"; is_typing: boolean }`を追加してください。`ChatWidget.tsx`のswitch文で、アクティブ時に「Tony is typing...」を表示するよう処理してください。

<details>
<summary>解答</summary>

ステート（`const [isTyping, setIsTyping] = useState(false)`）とケースを追加します：

```typescript
case "typing":
  setIsTyping(data.is_typing);
  break;
```

条件付きでレンダリング：`{isTyping && <p className="text-xs text-muted-foreground px-3 py-1">Tony is typing...</p>}`。サーバー側の変更は不要です — TypeScriptは満足し、ブラウザコンソールからテストできます。

</details>

**演習3：useRefパターンを壊す**

`ChatWidget.tsx`から`isOpenRef`宣言とその同期エフェクトを削除してください。receivedコールバック内の`isOpenRef.current`を`isOpen`に置き換えてください。ウィジェットを開いてメッセージを送信し、Railsサーバーのログが接続/切断のペアで溢れるのを確認してください。その後元に戻してください。

<details>
<summary>解答</summary>

refとその同期エフェクトを削除し、コールバックが`isOpen`を直接読むように変更します。`chat-server/log/development.log`に高速な循環が表示されます：

```
VisitorChannel is transmitting the subscription confirmation
VisitorChannel stopped streaming
```

各サイクルでサブスクリプションの作成、履歴送信、ステート更新、再レンダリング、破棄、再作成が繰り返されます。元に戻して停止してください。

</details>

**演習4：sessionStorage vs localStorage**

`getSessionToken`で`sessionStorage`を使うように変更してください。チャットを開き、メッセージを送信し、タブを閉じて再度開いてください。会話履歴が消えています。

<details>
<summary>解答</summary>

`getItem`と`setItem`の両方の呼び出しで`localStorage`を`sessionStorage`に置き換えてください。`sessionStorage`はタブにスコープされています — タブを閉じるとトークンが破棄されます。再度開くと新しいUUIDが生成され、メッセージのない新しい`Conversation`が作成されます。オリジナルが`localStorage`を使うのは、タブ間やブラウザ再起動後も永続するからです。

</details>

---
> 🌐 *Claudeによる翻訳*
