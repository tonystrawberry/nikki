---
title: "Building a Chat: Chapter 4 — Admin Dashboard and Push Notifications"
date: "2026-05-31"
excerpt: "Admin authentication, managing multiple conversations over one WebSocket, and the full Web Push notification pipeline from VAPID keys to the service worker."
author: "Tony Duong"
category: "note"
tags: ["rails", "web-push", "vapid", "service-worker", "react"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 4
collectionTitle: "Building a Real-Time Chat"
---

The visitor-side chat from chapters 2 and 3 is half the story. This chapter covers the other half: how the admin authenticates, how `AdminChat.tsx` multiplexes many conversations over one WebSocket, and how Web Push notifications reach the admin even after they close the browser tab.

## Admin authentication flow

The admin pages live at `src/app/admin/` -- outside the `[locale]` route tree. They need their own root layout (`src/app/admin/layout.tsx`) because Next.js App Router requires every route tree to provide `<html>` and `<body>` tags. The blog gets those from `src/app/[locale]/layout.tsx`, so `/admin/*` is a separate tree.

The login sequence:

```
1. Admin visits /admin/login
2. AdminLoginPage renders a form            (src/app/admin/login/page.tsx)
3. Form submits -> adminLogin(user, pass)    (src/lib/chat-client.ts)
4. fetch POST /auth/login                    (credentials: "include")
5. AuthController checks ENV vars            (chat-server/app/controllers/auth_controller.rb)
6. Match -> session[:admin] = true, returns { ok: true }
7. Browser stores _chat_server_session cookie
8. Router pushes to /admin/chats
9. AdminChat connects WebSocket -- Connection#connect reads session[:admin]
```

The controller (`chat-server/app/controllers/auth_controller.rb`) compares against two env vars:

```ruby
if username == ENV["ADMIN_USER"] && password == ENV["ADMIN_PASSWORD"]
  session[:admin] = true
  render json: { ok: true }
end
```

No users table, no password hashing, no recovery flow. For a single-admin personal blog: zero flexibility, but zero attack surface beyond the env vars. The WebSocket connection reads that same session to set `self.admin = true` (chapter 2).

## AdminChat.tsx -- managing many conversations on one WebSocket

The visitor `ChatWidget` from chapter 3 handles one conversation. `AdminChat` handles all of them over a single `AdminChannel` subscription, with two levels of state:

```typescript
// src/components/AdminChat.tsx
const [conversations, setConversations] = useState<ChatConversation[]>([]);  // list
const [selectedId, setSelectedId] = useState<number | null>(null);           // detail
const [messages, setMessages] = useState<ChatMessage[]>([]);                 // detail
```

The `received` callback switches on four event types:

| Event type             | Effect                                                                       |
|------------------------|------------------------------------------------------------------------------|
| `conversations`        | Replaces the full conversation list (sent on connect)                        |
| `new_message`          | Updates `last_message` / `unread_count`; appends message if selected         |
| `history`              | Replaces message list for the selected conversation                          |
| `conversation_deleted` | Removes from list; clears selection if it was the deleted one                |

The `new_message` handler has a subtle edge case. When a message arrives for a conversation not yet in the list (brand-new visitor), the component asks the server to refresh rather than constructing a partial object:

```typescript
const exists = prev.some((c) => c.id === data.conversation_id);
if (!exists) {
  subscriptionRef.current?.perform("list_conversations");
  return prev;
}
```

The `selectedIdRef` pattern from chapter 3 appears here too -- the callback reads `selectedIdRef.current` to decide whether to append a message, without re-creating the subscription on every conversation switch.

Selecting a conversation fires two server actions through the same WebSocket:

```typescript
subscriptionRef.current?.perform("get_history", { conversation_id: id });
subscriptionRef.current?.perform("mark_read", { conversation_id: id });
```

The unread count is optimistically zeroed client-side while the server persists the change.

## The Web Push pipeline

Push notifications involve four parties: the admin browser, the Next.js frontend, the Rails backend, and a push service (Google FCM, Mozilla autopush). You never register with these services -- VAPID keys handle authentication.

### Registration

When `AdminChat` connects, it registers for push. `registerPushNotifications` in `src/components/AdminChat.tsx` does four things:

1. Registers the service worker (`/sw-chat.js`)
2. Requests notification permission
3. Subscribes to the push service with the VAPID public key
4. POSTs `{ endpoint, p256dh, auth }` to Rails

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

Rails saves these three fields to the `push_subscriptions` table -- everything it needs to send encrypted payloads later.

### Sending a notification

The trigger is in `VisitorChannel#send_message` (chapter 2). After broadcasting to both streams, it checks for an active admin WebSocket:

```ruby
# chat-server/app/channels/visitor_channel.rb
unless admin_connected?
  PushNotificationService.notify(conversation.visitor_name, content) rescue nil
end
```

`PushNotificationService` (`chat-server/app/services/push_notification_service.rb`) iterates all saved subscriptions and calls `WebPush.payload_send` with the VAPID credentials. If a subscription returns 410 Gone, it catches `WebPush::ExpiredSubscription` and destroys the stale record.

### VAPID keys

A public/private keypair identifying your server to the push service. Generate with:

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts k.public_key; puts k.private_key"
```

The public key goes in `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) and `chat-server/.env` (`VAPID_PUBLIC_KEY`). The private key stays backend-only.

## The service worker

`public/sw-chat.js` is 30 lines with two event listeners. `push` parses the encrypted payload and calls `showNotification`. `notificationclick` closes the notification, tries to focus an existing `/admin/chats` tab, or opens a new one.

The critical property: a service worker runs in a separate thread and persists after the tab closes. That is the entire reason push notifications work when the admin is not on the page.

## What's next

The feature works locally. Chapter 5 covers deployment -- how Kamal 2 packages the Rails app into a Docker container, ships it to a Hetzner VPS, and wires up SSL, environment secrets, and GitHub Actions CI.

## Try it out

### 1. Inspect the push subscription

Open `/admin/chats` with devtools Application tab. Check Service Workers for `sw-chat.js` and Push Messaging for the subscription details.

<details>
<summary>Solution</summary>

In Chrome: DevTools > Application > Service Workers shows `sw-chat.js` with status "activated and is running". Under Application > Storage > Push Messaging, the subscription displays the `endpoint` URL (pointing to `fcm.googleapis.com` on Chrome), plus `p256dh` and `auth` keys matching what was POSTed to `/push_subscriptions`.

</details>

### 2. Rotate VAPID keys

Generate fresh keys with the Rails runner command. Replace them in both `.env.local` and `chat-server/.env`. Restart both servers and verify push still works. (If you only update one side, the subscription fails with a key mismatch.)

<details>
<summary>Solution</summary>

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts k.public_key; puts k.private_key"
```

Copy line 1 into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (`.env.local`) and `VAPID_PUBLIC_KEY` (`chat-server/.env`). Copy line 2 into `VAPID_PRIVATE_KEY` (`chat-server/.env`). Restart both servers. The browser creates a new push subscription on connect because the `applicationServerKey` changed.

</details>

### 3. Include message count in notifications

Modify `PushNotificationService` so the body shows how many messages the conversation has.

<details>
<summary>Solution</summary>

In `chat-server/app/channels/visitor_channel.rb`, pass the conversation object:

```ruby
PushNotificationService.notify(conversation, content) rescue nil
```

In `chat-server/app/services/push_notification_service.rb`:

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

### 4. Add a notification sound

Modify `public/sw-chat.js` so the push notification plays the system sound.

<details>
<summary>Solution</summary>

Add `silent: false` to the notification options in the `push` listener:

```javascript
self.registration.showNotification(data.title || "New message", {
  body: data.body || "",
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  data: { url: data.url || "/admin/chats" },
  silent: false,
})
```

`silent: false` is the default on most platforms -- notifications already play the system sound unless `silent: true` is set. Custom sounds via the `sound` property have inconsistent browser support.

</details>
