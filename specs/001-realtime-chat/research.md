# Research: Realtime Visitor Chat

## 1. WebSocket Server Hosting

### Decision: Hetzner Cloud CX23 (€3.49/month)

### Rationale

The spec targets $0/month (SC-006), but no platform offers a truly free always-on WebSocket server in 2026. The Render free tier is the only $0 option, but services spin down after 15 minutes of inactivity — causing 30-60 second cold starts that kill WebSocket connections. For a personal blog where the server would be idle most of the day, every visitor's first chat attempt would face a ~45-second wait. This violates SC-001 (first message within 5 seconds).

Hetzner CX23 at €3.49/month (~$3.80) provides a full always-on VPS (2 vCPU, 4GB RAM, 40GB NVMe SSD, 20TB traffic) with no cold starts, no connection drops, and enough resources to run the chat server + SQLite on one machine.

### Alternatives Considered

| Platform | Monthly Cost | Always-On | WebSocket Support | Verdict |
|----------|-------------|-----------|-------------------|---------|
| Render Free | $0 | No (sleeps after 15min) | Yes | Cold starts break real-time UX |
| Fly.io | ~$4-6 (VM + IPv4 + volume) | Yes | Yes | Hidden costs add up (IPv4 $2/mo, volume snapshots) |
| Railway | $5 (includes $5 usage) | Yes | Yes | Viable but less transparent pricing |
| Hetzner CX23 | €3.49 (~$3.80) | Yes | Yes | Best value: full VPS, predictable cost |
| Render Starter | $7 | Yes | Yes | 2x the cost of Hetzner for less control |

## 2. WebSocket Framework

### Decision: Rails 8 with ActionCable + Solid Cable

### Rationale

Rails 8 ships with ActionCable for WebSocket support and Solid Cable as the default adapter. Solid Cable stores pub/sub messages in the database using polling (~100ms latency), eliminating Redis as an infrastructure dependency. This keeps the stack to a single server running Rails + SQLite — no external services needed.

ActionCable provides built-in channel abstraction, connection management, subscriptions, and broadcasting. The `@rails/actioncable` npm package provides the JavaScript client for the Next.js frontend.

At the spec's scale (~5-10 concurrent chats), Solid Cable's polling latency is well within the <1s delivery target (SC-002).

### Alternatives Considered

- **Node.js + ws**: Same language as frontend (TypeScript), but requires building channel/room management, reconnection, and pub/sub from scratch.
- **Socket.io**: Adds proprietary protocol layer. Overkill for this scale.
- **Rails + Redis**: Standard ActionCable setup, but Redis adds infrastructure cost and complexity for no benefit at this scale.
- **AnyCable (Go)**: Enterprise-grade WebSocket server. Overkill — handles thousands of connections when we need ~20.

## 3. Persistent Storage

### Decision: SQLite (Rails default)

### Rationale

Rails 8 embraces SQLite for single-server deployments. The "Solid" stack (Solid Cable, Solid Queue, Solid Cache) all use SQLite-backed databases. At the spec's scale (~50 visitors/day), SQLite handles millions of rows trivially. No separate database service, no network latency, no additional cost.

Rails uses separate SQLite databases for production data, cable, cache, and queue — preventing pub/sub polling from contending with application queries.

### Alternatives Considered

- **PostgreSQL**: Standard Rails choice but adds a managed DB service cost or local management overhead. Unnecessary at this scale.
- **MySQL**: Same trade-offs as PostgreSQL.

## 4. Deployment

### Decision: Kamal 2

### Rationale

Kamal 2 is Rails 8's default deployment tool. It handles Docker builds, zero-downtime deploys, SSL via Let's Encrypt (through kamal-proxy), and multi-app hosting on a single server. A single `kamal deploy` command handles the full lifecycle. No PaaS abstraction or vendor lock-in.

### Alternatives Considered

- **Docker Compose + manual SSH**: Works but lacks zero-downtime deploys and automated SSL.
- **Capistrano**: Legacy Rails deployment. Kamal is the modern successor.
- **Render/Railway/Fly.io**: PaaS options cost more and provide less control.

## 5. Admin Authentication

### Decision: Environment variable credentials + Rails session cookie

### Rationale

A simple login form verifies username/password against environment variables (`ADMIN_USER`, `ADMIN_PASSWORD`). On success, Rails sets a session cookie. ActionCable's `Connection` class validates the session on WebSocket upgrade. No OAuth provider, no user model, no Devise gem needed.

## 6. Browser Push Notifications

### Decision: Web Push API with VAPID keys via `web-push` gem

### Rationale

The `web-push` Ruby gem handles server-side push notifications with VAPID keys. Push subscriptions are stored in the database. The server sends a notification when a new visitor message arrives and the admin is not connected via WebSocket. Cost: $0 (VAPID is free).

## 7. Architecture Summary

```
┌─────────────────────────────┐     ┌──────────────────────────────────┐
│  Vercel (existing)          │     │  Hetzner CX23 (~€3.49/mo)       │
│                             │     │                                  │
│  Next.js 16 Frontend        │     │  Rails 8 API + ActionCable       │
│  ├── Chat widget (client)   │◄───►│  ├── Solid Cable (no Redis)      │
│  ├── Admin page (client)    │ WS  │  ├── SQLite (production data)    │
│  └── Static blog pages      │     │  ├── web-push gem (notifications)│
│                             │     │  ├── Puma (web server)           │
│  @rails/actioncable client  │     │  └── Kamal 2 (deployment)        │
└─────────────────────────────┘     │                                  │
                                    │  kamal-proxy (SSL + routing)      │
                                    └──────────────────────────────────┘
```

- Frontend connects to Rails ActionCable via `wss://`
- `@rails/actioncable` npm package handles subscriptions and reconnection
- SQLite on Hetzner VPS local disk
- Admin auth via Rails session cookie with cross-origin credentials
