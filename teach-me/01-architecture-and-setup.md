# Chapter 1: Architecture and Setup

This tutorial walks through a real-time chat feature built for a Next.js blog. Visitors open a chat widget and talk to the site admin. The admin sees every conversation in a dashboard. Messages arrive instantly in both directions.

The interesting part: the frontend is a Next.js 16 app, the backend is a Rails 8 API. They live in separate processes, on separate ports, connected by WebSockets. This chapter explains how the pieces fit together and gets both servers running on your machine.

## Two separate apps

The project has two codebases:

| | Frontend | Backend |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Rails 8 (API-only) |
| **Path** | `/` (repo root) | `chat-server/` (git submodule) |
| **Port** | 3000 | 3100 |
| **Deploys to** | Vercel | Kamal 2 (Docker) |
| **Talks via** | `@rails/actioncable` (WebSocket) + `fetch` (HTTP) | ActionCable + REST controllers |

The frontend handles everything the visitor sees: the blog, the floating chat bubble, the admin dashboard. The backend handles everything real-time: WebSocket connections, message persistence, push notifications.

## Four concepts you need

### 1. WebSocket vs HTTP

HTTP is request-response: the client asks, the server answers, the connection closes. WebSocket is a persistent bidirectional pipe -- either side can send data at any time without the other asking.

This project uses WebSocket for all messaging in both directions. HTTP is only used for three things: admin login, listing/deleting conversations, and registering push subscriptions.

### 2. ActionCable

ActionCable is Rails' built-in WebSocket framework. It has three layers:

- **Connection** -- authenticates the WebSocket upgrade request. Lives in `chat-server/app/channels/application_cable/connection.rb`. This codebase identifies two kinds of connections using `identified_by`:

```ruby
identified_by :visitor_token, :admin
```

- **Channel** -- scopes what a connection can do. This codebase has two: `VisitorChannel` (one per browser session) and `AdminChannel` (one for all conversations).
- **Consumer** -- the client-side counterpart, provided by the `@rails/actioncable` npm package. The function `createConsumer(url)` opens the WebSocket and returns an object you call `subscriptions.create()` on.

### 3. Solid Cable

Traditional ActionCable deployments need Redis for pub/sub. Rails 8 ships Solid Cable as the default adapter -- it stores pub/sub messages in SQLite instead.

The config is minimal. From `chat-server/config/cable.yml`:

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

The trade-off: no Redis process to manage, but no horizontal scaling either. One Puma process, one SQLite file. For a personal blog this is the right call.

### 4. Cross-origin authentication

The frontend runs on `localhost:3000`, the backend on `localhost:3100`. Browsers block cross-origin cookies by default, so two things are configured:

**Server side** -- `chat-server/config/initializers/cors.rb` allows the frontend origin with `credentials: true`:

```ruby
origins(*ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",").map(&:strip))
resource "*", headers: :any, methods: [...], credentials: true
```

**Client side** -- every `fetch` call in `src/lib/chat-client.ts` sets `credentials: "include"` so the browser sends cookies cross-origin.

Admin auth uses Rails session cookies. Visitor auth is simpler -- a UUID token passed as a query parameter on the WebSocket URL:

```typescript
visitorConsumer = createConsumer(`${WS_URL}?token=${sessionToken}`);
```

## Repo layout

```
src/
  components/
    ChatWidget.tsx           # Floating bubble for visitors
    ChatPanel.tsx            # Shared message display component
    AdminChat.tsx            # Admin dashboard with conversation list
  lib/
    chat-client.ts           # ActionCable consumer factory + HTTP helpers
    chat-types.ts            # TypeScript discriminated unions for channel data
  types/
    actioncable.d.ts         # Hand-written type declarations for @rails/actioncable
  app/
    admin/
      login/page.tsx         # Credential form -> POST /auth/login
      chats/page.tsx         # Renders AdminChat component

chat-server/
  app/
    channels/
      application_cable/
        connection.rb        # Dual auth: visitor token OR admin session
      visitor_channel.rb     # One channel per browser session
      admin_channel.rb       # One channel for all conversations
    controllers/
      auth_controller.rb     # ENV-based login, sets session[:admin]
      conversations_controller.rb
      push_subscriptions_controller.rb
    models/
      conversation.rb        # session_token + visitor_name + unread_count
      message.rb             # sender (visitor|admin) + content
      push_subscription.rb   # Web Push subscription data
    services/
      push_notification_service.rb
  config/
    cable.yml                # Solid Cable adapter config
    puma.rb                  # Port 3100, single mode
    routes.rb                # ActionCable mounted at /cable
```

The admin section at `src/app/admin/` sits outside the i18n `[locale]` route group. It has its own `layout.tsx` with `<html>` and `<body>` tags -- it is a completely separate page shell from the blog.

## What happens when the app runs

**Terminal 1** -- start the frontend:

```bash
npm run dev
```

Next.js starts on port 3000. The two environment variables that matter are in `.env.local`:

```
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3100/cable
NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3100
```

**Terminal 2** -- start the backend:

```bash
cd chat-server
ADMIN_USER=tony ADMIN_PASSWORD=secret bin/rails server -p 3100
```

Puma starts on port 3100 (configured in `config/puma.rb` via `port ENV.fetch("PORT", 3100)`). ActionCable is mounted at `/cable` in `config/routes.rb`:

```ruby
mount ActionCable.server => "/cable"
```

Rails is configured as API-only (`config.api_only = true` in `config/application.rb`), which strips session middleware. But admin auth needs sessions, so two lines add it back:

```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore, key: "_chat_server_session"
```

When a visitor opens the chat widget, the frontend calls `getVisitorConsumer(sessionToken)` in `src/lib/chat-client.ts`, which calls `createConsumer()` with the WebSocket URL plus a `?token=` query parameter. The browser opens a WebSocket to `ws://localhost:3100/cable?token=<uuid>`. Rails' `Connection#connect` method checks `request.params[:token]`, finds it present, and accepts the connection.

## Setup

Prerequisites: Node.js 18+, Ruby 3.2+, SQLite3.

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd chat-server
bundle install
bin/rails db:prepare

# Environment files
cd ..
cp .env.example .env
cp .env.local.example .env.local
```

Edit `.env.local` to set `NEXT_PUBLIC_CHAT_WS_URL` and `NEXT_PUBLIC_CHAT_HTTP_URL` if the defaults don't match your setup. Then start both servers in separate terminals.

---

Now that you can see the two halves running, chapter 2 dives into the Rails backend -- how ActionCable authenticates connections, what happens inside `VisitorChannel` and `AdminChannel`, and how messages flow from one browser to another through Solid Cable.

## Try it out

**Exercise 1.** Start both servers. Open your browser's DevTools, go to the Network tab, and filter by "WS". Open the chat widget on the blog. You should see a WebSocket connection to `ws://localhost:3100/cable?token=...`. Inspect the frames -- what is the first message the server sends after the handshake?

<details>
<summary>Solution</summary>

The first message is a JSON object with `{"type":"welcome"}`. This is ActionCable's handshake confirmation. After that, the client sends a `subscribe` command for `VisitorChannel`, and the server responds with `{"type":"confirm_subscription",...}`.

</details>

**Exercise 2.** In `chat-server/config/puma.rb`, change the default port from `3100` to `3200`. Restart the Rails server. What breaks, and how do you fix it?

<details>
<summary>Solution</summary>

The chat widget stops connecting. The frontend is still pointing at `ws://localhost:3100/cable`. To fix it, update both env vars in `.env.local`:

```
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3200/cable
NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3200
```

You also need to update `ALLOWED_ORIGINS` on the Rails side (or its default of `http://localhost:3000` still works since the frontend origin hasn't changed -- only the backend port moved). Restart both servers.

</details>

**Exercise 3.** In `chat-server/config/application.rb`, comment out the two `config.middleware.use` lines that add `Cookies` and `Session::CookieStore`. Restart Rails. Try logging in as admin at `/admin/login`. What happens and why?

<details>
<summary>Solution</summary>

The login POST to `/auth/login` succeeds (returns `{ "ok": true }`), but the session cookie is never set because the cookie middleware is gone. When the frontend then opens a WebSocket for the admin, `Connection#connect` checks `request.session[:admin]` -- which is `nil` because no session exists. The connection is rejected. The admin dashboard shows a disconnected state. Uncomment the lines and restart to fix it.

</details>

**Exercise 4.** Read the `VisitorChannelData` type in `src/lib/chat-types.ts`. It is a discriminated union on the `type` field. Add a hypothetical fourth variant `{ type: "typing"; is_typing: boolean }` to the union. Where in the frontend code would you need to handle this new variant?

<details>
<summary>Solution</summary>

The type is consumed in the `received` callback passed to `subscribeVisitorChannel()` in `src/lib/chat-client.ts`. Every component that calls this function handles the data in its `received` callback -- primarily `ChatWidget.tsx`. You would add a `case "typing":` branch (or `if (data.type === "typing")`) in the switch/conditional that processes incoming messages, and update the UI to show a typing indicator.

</details>
