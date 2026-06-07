---
title: "Building a Chat: Chapter 2 — The ActionCable Backend"
date: "2026-05-31"
excerpt: "Connection authentication, visitor and admin channels, the data model, and how Solid Cable replaces Redis with SQLite."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["rails", "actioncable", "solid-cable", "sqlite", "websockets"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 2
collectionTitle: "Building a Real-Time Chat"
---

> 💬 **This is the live chat widget you can see in the bottom-right corner of this very site.** This series walks through exactly how I built it — click the chat bubble to try it, then read on to see how it works under the hood.

This chapter walks through the Rails WebSocket server: how connections are authenticated, what happens inside each channel, and how data flows through Solid Cable. You should already be familiar with the repo layout from chapter 1.

## Connection authentication

Open `chat-server/app/channels/application_cable/connection.rb`:

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

Two kinds of users share the same WebSocket endpoint:

- **Visitors** pass `?token=<UUID>` on the WebSocket URL. The token comes from `localStorage` in the browser.
- **Admin** authenticates via a Rails session cookie, set earlier by `POST /auth/login` in `AuthController`.
- Anyone else gets `reject_unauthorized_connection`, which sends HTTP 403 and closes the socket.

`identified_by` is worth understanding. It registers `:visitor_token` and `:admin` as identity attributes on every connection instance. ActionCable uses these to look up connections later -- when you call `ActionCable.server.connections`, each connection object exposes these attributes. That is how `VisitorChannel` can check whether an admin is online, and how `AdminChannel` can gate access.

## VisitorChannel

Full source: `chat-server/app/channels/visitor_channel.rb` (84 lines).

**`subscribed`** reads the token from `connection.visitor_token`, calls `stream_from "visitor_#{@session_token}"`, and transmits existing message history if a `Conversation` record already exists for that token.

**`send_message(data)`** is where the interesting work happens. Here is the flow, step by step:

```
1. Visitor sends  { action: "send_message", content: "Hello!" }
2. VisitorChannel#send_message validates content (blank check, 2000-char max)
3. Conversation.find_or_create_by!(session_token:) creates or finds the record
4. conversation.messages.create!(sender: "visitor", content: "Hello!")
5. conversation.increment!(:unread_count)
6. Broadcast to "visitor_{token}"   --> visitor sees their message confirmed
7. Broadcast to "admin_channel"     --> admin sees a new_message event
8. admin_connected? --> if false, PushNotificationService.notify
```

The validation is straightforward -- blank messages and anything over 2000 characters get rejected with a `transmit({ type: "error", ... })` back to the sender:

```ruby
content = data["content"].to_s.strip
return transmit({ type: "error", error: "Message is empty" }) if content.blank?
return transmit({ type: "error", error: "Message too long (max 2000)" }) if content.length > 2000
```

`admin_connected?` inspects live connections:

```ruby
def admin_connected?
  ActionCable.server.connections.any? { |c| c.admin == true }
rescue
  false
end
```

This works because `identified_by :admin` made `.admin` accessible on every connection object. If no admin socket is open, the channel fires a web push notification instead.

**Design decision:** messages are created through ActionCable, not via HTTP POST. The WebSocket connection _is_ the write path. Trade-off: simpler (no REST endpoint for messages), but if the socket is down you cannot send. For a personal blog chat widget, this is fine -- no message queue or retry logic needed.

## AdminChannel

Full source: `chat-server/app/channels/admin_channel.rb` (110 lines).

**`subscribed`** rejects non-admin connections, streams from `"admin_channel"`, and transmits the full conversation list via a private `serialized_conversations` method:

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

**`send_message(data)`** finds a conversation by ID, creates a message with `sender: "admin"`, and broadcasts to _two_ streams:

```ruby
ActionCable.server.broadcast("visitor_#{conversation.session_token}", { ... })
ActionCable.server.broadcast("admin_channel", { ... })
```

Notice how the admin channel reaches into the visitor's stream using `conversation.session_token`. It crosses channel boundaries through the broadcast mechanism -- channels are just subscription scopes, not isolation walls.

**`mark_read(data)`** resets `conversation.unread_count` to 0. **`get_history(data)`** transmits all messages for a given conversation. **`list_conversations`** re-sends the full conversation list on demand.

## Data model

See `chat-server/db/schema.rb`. Three tables:

| Table | Key columns | Notable indexes |
|-------|-------------|-----------------|
| `conversations` | `session_token` (unique), `visitor_name`, `unread_count` | `updated_at` for sort order |
| `messages` | `conversation_id` (FK), `sender`, `content` (text) | composite `(conversation_id, created_at)` |
| `push_subscriptions` | `endpoint` (unique), `p256dh`, `auth` | unique on `endpoint` |

The critical model detail is in `chat-server/app/models/message.rb`:

```ruby
class Message < ApplicationRecord
  belongs_to :conversation, touch: true
end
```

`touch: true` means every `messages.create!` automatically bumps `conversation.updated_at`. The admin panel sorts conversations by `updated_at DESC`, so the most recently active conversation floats to the top -- no extra query required.

## Solid Cable -- the pub/sub adapter

ActionCable needs a pub/sub backend to route broadcasts. This project uses Solid Cable, configured in `chat-server/config/cable.yml`:

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

Solid Cable stores broadcast messages in a dedicated SQLite database and polls for new entries. `polling_interval: 0.1.seconds` gives roughly 100ms latency. `message_retention: 1.day` auto-purges old broadcast rows so the table stays small.

How does it compare?

| Adapter | External dependency | Latency | Scales horizontally |
|---------|---------------------|---------|---------------------|
| `solid_cable` | None (SQLite) | ~100ms | No (single process) |
| `redis` | Redis server | ~1ms | Yes |
| `async` | None | ~0ms | No (same process only) |

This codebase chose `solid_cable` because there is no Redis to maintain, SQLite is already present for the application database, and a personal blog does not need horizontal scaling. If you later need sub-10ms delivery or multiple Rails processes, swap the adapter to `redis` -- no channel code changes required.

---

The backend is now broadcasting messages to named streams. Chapter 3 shows how the Next.js frontend subscribes to those streams using the `@rails/actioncable` npm package, and how the React components manage WebSocket lifecycle without falling into the infinite re-render trap.

## Try it out

**Exercise 1.** Open a Rails console and broadcast a test message to a visitor stream manually. If you have a visitor connected with token `abc-123`:

```ruby
ActionCable.server.broadcast("visitor_abc-123", {
  type: "message",
  message: { id: 999, sender: "admin", content: "Test from console", created_at: Time.current.iso8601 }
})
```

Observe what the frontend shows. (Note: with `solid_cable`, you must broadcast from within the Rails server process, not a separate `bin/rails console`. See the comment at the top of `cable.yml`.)

<details>
<summary>Solution</summary>

The visitor's chat widget should display "Test from console" as an admin message. It appears instantly because the frontend is already subscribed to that stream. The message is _not_ persisted in the database -- you only broadcasted raw data, skipping `Message.create!`. If the visitor refreshes, the ghost message disappears.

</details>

**Exercise 2.** Change `polling_interval` in `config/cable.yml` to `2.seconds`, restart Rails, and send a message. Notice the increased latency.

<details>
<summary>Solution</summary>

Messages now take up to two seconds to appear on the receiving end. The Solid Cable poller checks the broadcast table every two seconds instead of every 100ms. Revert to `0.1.seconds` when done.

</details>

**Exercise 3.** Add a `banned_words` check to `VisitorChannel#send_message` that rejects messages containing "spam". Transmit an error back to the visitor.

<details>
<summary>Solution</summary>

Add this after the existing validation lines in `chat-server/app/channels/visitor_channel.rb`:

```ruby
banned = %w[spam]
if banned.any? { |w| content.downcase.include?(w) }
  return transmit({ type: "error", error: "Message contains a banned word" })
end
```

Place it after the blank/length checks and before `find_or_create_by!`. The visitor receives `{ type: "error", error: "Message contains a banned word" }` and the message is never persisted.

</details>

**Exercise 4.** Open `chat-server/app/models/message.rb` and remove `touch: true` from `belongs_to :conversation`. Send a message, then check whether the conversation list still sorts correctly in the admin panel.

<details>
<summary>Solution</summary>

It will not sort correctly. Without `touch: true`, `conversation.updated_at` is not bumped when a new message is created. The admin panel queries `Conversation.order(updated_at: :desc)`, so conversations with new messages no longer float to the top. Re-add `touch: true` to restore the behavior.

</details>
