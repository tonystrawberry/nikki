# ActionCable Protocol: Realtime Visitor Chat

## Connection

ActionCable connections go through a single WebSocket endpoint. The Rails server distinguishes visitor vs admin connections via parameters.

### WebSocket Endpoint

```
wss://<chat-server-host>/cable
```

The `@rails/actioncable` client handles the protocol (subscription, ping/pong, reconnection) automatically.

### Visitor Connection

```javascript
import { createConsumer } from "@rails/actioncable"

const consumer = createConsumer("wss://<chat-server-host>/cable?token=<session_token>")
```

- `session_token`: UUID v4 stored in the visitor's browser localStorage.
- Passed as a query parameter; validated in `ApplicationCable::Connection#connect`.
- No cookie-based auth required for visitors.

### Admin Connection

```javascript
const consumer = createConsumer("wss://<chat-server-host>/cable")
// Cookie-based auth — browser sends session cookie automatically
```

- Requires a valid Rails session cookie (obtained via the HTTP login endpoint).
- `ApplicationCable::Connection#connect` checks the session for admin status.

## HTTP REST Endpoints

### POST /auth/login

Admin login. Sets a Rails session cookie.

**Request**:
```json
{ "username": "string", "password": "string" }
```

**Response (200)**:
```json
{ "ok": true }
```

**Response (401)**:
```json
{ "error": "Invalid credentials" }
```

### DELETE /auth/logout

Clears the admin session.

**Response (200)**:
```json
{ "ok": true }
```

### GET /health

Health check.

**Response (200)**:
```json
{ "status": "ok", "uptime": 12345 }
```

### GET /conversations

List all conversations (admin only, requires session cookie).

**Response (200)**:
```json
{
  "conversations": [
    {
      "id": 1,
      "session_token": "uuid",
      "visitor_name": "Visitor #1",
      "unread_count": 3,
      "last_message": "Hello!",
      "updated_at": "2026-05-29T22:00:00Z",
      "created_at": "2026-05-29T21:00:00Z"
    }
  ]
}
```

### GET /conversations/:id/messages

Get messages for a conversation (admin only).

**Response (200)**:
```json
{
  "messages": [
    {
      "id": 1,
      "sender": "visitor",
      "content": "Hello!",
      "created_at": "2026-05-29T21:00:00Z"
    }
  ]
}
```

### DELETE /conversations/:id

Delete a conversation and all its messages (admin only).

**Response (200)**:
```json
{ "ok": true }
```

### POST /push_subscriptions

Register a push subscription (admin only).

**Request**:
```json
{
  "endpoint": "string",
  "p256dh": "string",
  "auth": "string"
}
```

**Response (201)**:
```json
{ "ok": true }
```

### DELETE /push_subscriptions

Remove a push subscription (admin only).

**Request**:
```json
{ "endpoint": "string" }
```

**Response (200)**:
```json
{ "ok": true }
```

## ActionCable Channels

### VisitorChannel

Subscribed by the chat widget. Scoped to one conversation per visitor session.

**Subscribe**:
```javascript
consumer.subscriptions.create("VisitorChannel", {
  received(data) { /* handle incoming messages */ }
})
```

**Server→Client messages**:

```json
// History on connect
{ "type": "history", "conversation": { "id": 1, "visitor_name": "Visitor #1" }, "messages": [...] }

// New message (from admin reply or echo of own)
{ "type": "message", "message": { "id": 1, "sender": "admin", "content": "Hi!", "created_at": "..." } }

// Error
{ "type": "error", "error": "Message too long" }
```

**Client→Server actions**:

```javascript
// Send a message
channel.perform("send_message", { content: "Hello!" })
```

### AdminChannel

Subscribed by the admin page. Receives events from all conversations.

**Subscribe**:
```javascript
consumer.subscriptions.create("AdminChannel", {
  received(data) { /* handle events */ }
})
```

**Server→Client messages**:

```json
// Full conversation list
{ "type": "conversations", "conversations": [...] }

// New message from any visitor
{ "type": "new_message", "conversation_id": 1, "visitor_name": "Visitor #1", "message": { ... } }

// Conversation deleted confirmation
{ "type": "conversation_deleted", "conversation_id": 1 }
```

**Client→Server actions**:

```javascript
// Send a reply
channel.perform("send_message", { conversation_id: 1, content: "Thanks!" })

// Mark conversation as read
channel.perform("mark_read", { conversation_id: 1 })

// Request conversation list refresh
channel.perform("list_conversations")

// Request message history
channel.perform("get_history", { conversation_id: 1 })
```

## Reconnection

Handled automatically by `@rails/actioncable`. The client:
1. Detects disconnection.
2. Attempts reconnection with exponential backoff.
3. Re-subscribes to channels on successful reconnect.
4. Server re-sends history/state on subscription.

No custom reconnection logic needed.

## CORS

Rails must be configured to accept requests from:
- `https://nikki-tony.vercel.app`
- `http://localhost:3000` (development)

ActionCable allowed origins must include both. Session cookies require `SameSite=None; Secure` for cross-origin.
