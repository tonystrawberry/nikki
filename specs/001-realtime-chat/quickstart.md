# Quickstart: Realtime Visitor Chat

## Prerequisites

- Ruby 3.3+ (install via `rbenv` or `mise`)
- Node.js 22+ (for the Next.js frontend)
- SQLite3 development headers (`brew install sqlite3` on macOS)
- Docker (for Kamal deployment)

## Local Development

### 1. Set up the Rails chat server

```bash
cd chat-server
bundle install
bin/rails db:setup

# Set environment variables
export ADMIN_USER=tony
export ADMIN_PASSWORD=devpassword
export COOKIE_SECRET=$(bin/rails secret)
export VAPID_PUBLIC_KEY=<generate>
export VAPID_PRIVATE_KEY=<generate>
export ALLOWED_ORIGINS=http://localhost:3000

# Start the server (default port 3000 — use -p to change)
bin/rails server -p 8080
```

The Rails server runs at `http://localhost:8080`.

### 2. Generate VAPID keys

```bash
cd chat-server
bin/rails runner "
  require 'web-push'
  vapid = WebPush.generate_key
  puts \"VAPID_PUBLIC_KEY=#{vapid.public_key}\"
  puts \"VAPID_PRIVATE_KEY=#{vapid.private_key}\"
"
```

### 3. Start the Next.js frontend

```bash
# From repo root — set env vars
export NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:8080/cable
export NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:8080

npm run dev
```

### 4. Test the chat

1. Open `http://localhost:3000/fr` — chat widget appears in the bottom-right.
2. Click it, send a message.
3. Open `http://localhost:3000/admin/login` in another tab.
4. Log in with `tony` / `devpassword`.
5. You should see the conversation at `/admin/chats`. Reply and verify real-time delivery.

## Environment Variables

### Rails Chat Server

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ADMIN_USER` | Yes | Admin login username | `tony` |
| `ADMIN_PASSWORD` | Yes | Admin login password | `a-strong-password` |
| `SECRET_KEY_BASE` | Yes (prod) | Rails secret key | `bin/rails secret` |
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key for web push | (generated) |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for web push | (generated) |
| `VAPID_SUBJECT` | Yes | Contact email for VAPID | `mailto:tony@example.com` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins | `https://nikki-tony.vercel.app` |
| `RAILS_ENV` | No | Environment (default: development) | `production` |

### Next.js Frontend (`.env.local`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CHAT_WS_URL` | Yes | ActionCable WebSocket URL | `wss://chat.nikki-tony.com/cable` |
| `NEXT_PUBLIC_CHAT_HTTP_URL` | Yes | Chat server HTTP URL (auth, REST) | `https://chat.nikki-tony.com` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | Same VAPID public key as server | (same as server) |

## Production Deployment (Hetzner + Kamal 2)

### 1. Provision the VPS

1. Create a Hetzner Cloud CX23 instance (€3.49/month).
2. Choose Ubuntu 24.04 LTS.
3. Add your SSH key.

### 2. Configure Kamal

Edit `chat-server/config/deploy.yml`:

```yaml
service: tonysekai-chat
image: tonyduong/tonysekai-chat

servers:
  web:
    hosts:
      - <your-vps-ip>

proxy:
  ssl: true
  host: chat.nikki-tony.com

env:
  clear:
    RAILS_ENV: production
    ALLOWED_ORIGINS: https://nikki-tony.vercel.app
    VAPID_SUBJECT: mailto:tony@example.com
  secret:
    - SECRET_KEY_BASE
    - ADMIN_USER
    - ADMIN_PASSWORD
    - VAPID_PUBLIC_KEY
    - VAPID_PRIVATE_KEY

volumes:
  - "tonysekai_chat_storage:/rails/storage"
```

### 3. Set secrets and deploy

```bash
cd chat-server
kamal secrets set SECRET_KEY_BASE=$(bin/rails secret)
kamal secrets set ADMIN_USER=tony
kamal secrets set ADMIN_PASSWORD=your-strong-password
kamal secrets set VAPID_PUBLIC_KEY=<your-key>
kamal secrets set VAPID_PRIVATE_KEY=<your-key>

kamal setup    # First deploy
kamal deploy   # Subsequent deploys
```

### 4. Update frontend env vars

Set `NEXT_PUBLIC_CHAT_WS_URL=wss://chat.nikki-tony.com/cable` and `NEXT_PUBLIC_CHAT_HTTP_URL=https://chat.nikki-tony.com` in Vercel environment variables. Redeploy.

### 5. Verify

```bash
curl https://chat.nikki-tony.com/health
# {"status":"ok","uptime":...}
```

## SQLite Backup

The SQLite databases live in `/rails/storage/` inside the Docker volume. Back up with:

```bash
kamal app exec "sqlite3 /rails/storage/production.sqlite3 '.backup /rails/storage/backup.sqlite3'"
```
