# Deploying chat-server to Hetzner with Kamal

End-to-end guide: from a fresh Hetzner account to a live Rails 8 WebSocket server with automatic SSL.

**Total cost**: ~€3.49/month (Hetzner CX22) + free Let's Encrypt SSL.

---

## 1. Create a Hetzner Cloud server

1. Sign up at [console.hetzner.cloud](https://console.hetzner.cloud/)
2. Create a new **project** (e.g. "nikki-chat")
3. **Add Server** with these settings:
   - **Location**: Falkenstein or Helsinki (cheapest)
   - **Image**: Ubuntu 24.04
   - **Type**: **CX22** (shared vCPU, 2 CPU / 4 GB — ~€3.49/mo) or **CX32** if you want headroom
   - **SSH key**: Add your public key (`cat ~/.ssh/id_ed25519.pub`) — Kamal connects over SSH
   - **Name**: `chat-server`
4. Note the **public IPv4** address (e.g. `78.47.xxx.xxx`)

## 2. Point a domain to the server

Add a DNS **A record** for your chat subdomain:

```
nikki-chat.shirimono.fun  →  A  →  78.47.xxx.xxx
```

Kamal's built-in proxy (Thruster) provisions a Let's Encrypt certificate automatically on first deploy.

## 3. Prepare the server (one-time SSH)

SSH in and install Docker:

```bash
ssh root@178.104.231.154

curl -fsSL https://get.docker.com | sh

exit
```

That's all — Kamal handles everything else.

## 4. Set up a container registry

Kamal pushes Docker images to a registry. The config uses **GitHub Container Registry (ghcr.io)**:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Create a **Personal Access Token (classic)** with `write:packages` and `read:packages` scopes
3. Save the token — it becomes your `KAMAL_REGISTRY_PASSWORD`

## 5. Generate VAPID keys

VAPID keys are needed for browser push notifications. Run this from the `chat-server/` directory:

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts 'Public:  ' + k.public_key; puts 'Private: ' + k.private_key"
```

Save both keys — you'll need them in the next step and in the Next.js frontend config.

## 6. Configure secrets

`.kamal/secrets` is **committed to git** — it only contains `$VARIABLE` references, never raw values. The actual secrets must be exported as environment variables on your machine before deploying.

Create a local `.env` file in `chat-server/` (already gitignored):

```bash
cd chat-server
cat > .env <<'EOF'
KAMAL_REGISTRY_USERNAME=your-github-username
KAMAL_REGISTRY_PASSWORD=ghp_xxxxxxxxxxxxxxxxxxxx
RAILS_MASTER_KEY=contents-of-config-master-key
ADMIN_USER=tony
ADMIN_PASSWORD=your-secure-password
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:tony.duong.102@gmail.com
EOF
```

Then export them before deploying:

```bash
export $(cat .env | xargs)
# bin/kamal setup
```

Or add `source chat-server/.env` to your shell profile so they're always available.

> **Tip**: `RAILS_MASTER_KEY` is the contents of `config/master.key` (a single hex string). That file is already gitignored.

## 7. Update `config/deploy.yml`

Replace the placeholder values in `chat-server/config/deploy.yml`:

```yaml
servers:
  web:
    - 78.47.xxx.xxx           # your Hetzner server IP

proxy:
  ssl: true
  host: nikki-chat.shirimono.fun    # your domain
```

The rest of the file (`env`, `volumes`, `builder`) is already configured.

## 8. First deploy

From the `chat-server/` directory:

```bash
bin/kamal setup
```

This will:

1. SSH into the Hetzner server
2. Install kamal-proxy (reverse proxy with auto-SSL)
3. Build the Docker image locally (targeting `amd64`)
4. Push it to `ghcr.io`
5. Pull and start the container on the server
6. Run database migrations via the Docker entrypoint
7. Provision a Let's Encrypt SSL certificate

The process takes 3–5 minutes on first run (image build + push).

## 9. Update Next.js frontend

Set the production chat URLs in **Vercel's environment variables** dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_CHAT_WS_URL` | `wss://nikki-chat.shirimono.fun/cable` |
| `NEXT_PUBLIC_CHAT_HTTP_URL` | `https://nikki-chat.shirimono.fun` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | *(the public key from step 5)* |

> Note: production uses `wss://` (secure WebSocket), not `ws://`.

Redeploy the frontend on Vercel for the new env vars to take effect.

## 10. Verify

1. Visit your site and open the chat widget — you should see "Connecting..." then the chat input
2. Send a test message
3. Open `/admin/chats`, log in, and confirm the message appears
4. Reply from admin and verify it shows up in the visitor widget

## Subsequent deploys

After code changes, deploy with:

```bash
cd chat-server
bin/kamal deploy
```

Kamal builds, pushes, and does a rolling restart with zero downtime.

## Useful Kamal commands

```bash
bin/kamal console       # Rails console on the server
bin/kamal logs          # Tail production logs (Ctrl+C to stop)
bin/kamal shell         # SSH into the running container
bin/kamal app restart   # Restart the app
bin/kamal rollback      # Roll back to the previous version
bin/kamal details       # Show container/proxy status
bin/kamal app exec 'bin/rails db:migrate'  # Run migrations manually
```

## Troubleshooting

### SSL certificate not provisioning

- Make sure the DNS A record is propagated (`dig nikki-chat.shirimono.fun`)
- Kamal's proxy needs port 80 open for the ACME challenge
- Check logs: `bin/kamal proxy logs`

### WebSocket connections failing

- Verify `ALLOWED_ORIGINS` in `deploy.yml` includes your frontend domain
- Check browser console for CORS errors
- Confirm the server is reachable: `curl https://nikki-chat.shirimono.fun/health`

### Database issues

- The SQLite database lives in a Docker volume (`chat_server_storage:/rails/storage`)
- Migrations run automatically on boot via `bin/docker-entrypoint`
- To reset: `bin/kamal app exec 'bin/rails db:reset'`

### Viewing server resources

```bash
ssh root@78.47.xxx.xxx
docker stats    # CPU/memory usage
df -h           # Disk usage
```

A CX22 (2 CPU / 4 GB) is more than enough for a single Rails + Puma + SQLite app.
