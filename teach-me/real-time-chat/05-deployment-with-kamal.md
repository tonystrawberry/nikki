# Chapter 5: Deployment with Kamal

The chat server works on localhost. Now it needs to work on the internet. This chapter covers the Docker build, Kamal 2 deployment to a Hetzner VPS, secrets management, CI/CD, and production CORS/WebSocket wiring.

## The two-host architecture

```
Vercel (free tier)                    Hetzner CX22 (~3.49 EUR/mo)
─────────────────                     ───────────────────────────
Next.js 16 frontend                   Rails 8 + Puma + Thruster
  Static pages, admin UI                ActionCable WebSocket
  Chat widget JS                        REST API, SQLite databases
                                        Solid Cable / Queue / Cache
        <── wss://chat.journal.tonystrawberry.fun/cable ──>
        <── https://chat.journal.tonystrawberry.fun/* ──>
```

Key difference from [Chapter 1](01-architecture-and-setup.md): production uses `wss://` and `https://`. TLS terminates at kamal-proxy via Let's Encrypt, not at Rails itself.

## The Dockerfile

`chat-server/Dockerfile` — 74-line multi-stage build.

| Stage | What it does |
|-------|-------------|
| `base` | `ruby:3.2.2-slim` + sqlite3 + jemalloc |
| `build` | Adds build-essential, runs `bundle install`, precompiles bootsnap |
| final | Copies gems + app from build, runs as non-root (uid 1000) |

Important environment variables set in the base stage:

```dockerfile
ENV RAILS_ENV="production" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"
```

`LD_PRELOAD` forces jemalloc, reducing memory fragmentation on a 4 GB VPS. `BUNDLE_WITHOUT` strips dev gems from the image.

The entrypoint (`chat-server/bin/docker-entrypoint`) runs `db:prepare` before boot. The CMD starts Thruster in front of Puma:

```dockerfile
CMD ["./bin/thrust", "./bin/rails", "server"]
```

Thruster is a Go reverse proxy handling HTTP/2, gzip, and X-Sendfile.

## Kamal 2 configuration

`chat-server/config/deploy.yml`:

```yaml
service: chat-server
image: tonystrawberry/chat-server

servers:
  web:
    - 178.104.231.154

proxy:
  ssl: true
  host: chat.journal.tonystrawberry.fun
```

`proxy.ssl: true` provisions a Let's Encrypt cert on first deploy. No nginx, no certbot.

```yaml
env:
  secret:
    - RAILS_MASTER_KEY
    - ADMIN_USER
    - ADMIN_PASSWORD
    - VAPID_PUBLIC_KEY
    - VAPID_PRIVATE_KEY
    - VAPID_SUBJECT
  clear:
    SOLID_QUEUE_IN_PUMA: true
    ALLOWED_ORIGINS: "https://nikki-tony.vercel.app"
    RAILS_LOG_LEVEL: info
```

`secret` values are injected at deploy time (never in the image). `SOLID_QUEUE_IN_PUMA` activates the Puma plugin at `config/puma.rb` line 38 — background jobs run inside Puma, no separate worker process needed.

```yaml
volumes:
  - "chat_server_storage:/rails/storage"
```

Critical: SQLite databases live in `/rails/storage`. Without this named volume, every deploy wipes the database.

```yaml
builder:
  arch: amd64
```

On Apple Silicon, Docker Buildx cross-compiles via QEMU.

## Secrets management

`chat-server/.kamal/secrets` is committed to git but contains only variable references:

```bash
KAMAL_REGISTRY_USERNAME=$KAMAL_REGISTRY_USERNAME
KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD
RAILS_MASTER_KEY=$RAILS_MASTER_KEY
ADMIN_USER=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASSWORD
```

Actual values come from the shell environment. For local deploys, export from a `.env` (gitignored). For CI, they come from GitHub Actions secrets.

## GitHub Actions CI/CD

Every push to `main` triggers deployment:

```yaml
on:
  push:
    branches: [main]

concurrency:
  group: deploy
  cancel-in-progress: true
```

`concurrency` ensures only one deploy runs at a time — push twice quickly and the first is cancelled.

The job steps: checkout, setup Ruby (with cache), setup Docker Buildx, install SSH key, add server to `known_hosts`, run `bin/kamal deploy`. Required GitHub secrets: `SSH_PRIVATE_KEY`, `KAMAL_REGISTRY_USERNAME`, `KAMAL_REGISTRY_PASSWORD`, `RAILS_MASTER_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Production CORS and WebSocket wiring

Three env vars on Vercel connect the frontend to Rails:

```
NEXT_PUBLIC_CHAT_WS_URL=wss://chat.journal.tonystrawberry.fun/cable
NEXT_PUBLIC_CHAT_HTTP_URL=https://chat.journal.tonystrawberry.fun
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<the VAPID public key>
```

On Rails, `ALLOWED_ORIGINS` in `deploy.yml` must include the Vercel domain. The CORS initializer (`chat-server/config/initializers/cors.rb`) splits on commas:

```ruby
origins(*ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",").map(&:strip))
```

The full deploy flow:

```
git push main -> GitHub Actions -> bin/kamal deploy
  -> Docker build (amd64) -> push to ghcr.io
  -> SSH to Hetzner -> pull image -> run db:prepare
  -> Start Puma + Thruster -> kamal-proxy provisions SSL
  -> Health check (GET /up) passes -> old container stopped
```

Zero-downtime swap. The whole flow takes about 3 minutes.

## Where to go from here

- **Rate limiting** — Add per-session throttling to `VisitorChannel` (max 1 msg/sec). Reject excess with a `too_fast` broadcast.
- **Typing indicators** — Broadcast a `typing` event, auto-clear after 3 seconds. Just another broadcast type as shown in [Chapter 2](02-actioncable-backend.md).
- **File attachments** — Active Storage + S3. Accept images in chat, render thumbnails in the widget.
- **Multiple admins** — Replace env var auth with a `users` table and bcrypt. The `AdminChannel` auth from [Chapter 2](02-actioncable-backend.md) would check a database record instead.

## Try it out

### 1. Run the production image locally

<details>
<summary>Solution</summary>

```bash
cd chat-server
docker build -t chat-server .
docker run \
  -e RAILS_MASTER_KEY=$(cat config/master.key) \
  -e ADMIN_USER=test \
  -e ADMIN_PASSWORD=test \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  -p 3100:80 \
  chat-server
```

Set `NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3100` and `NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3100/cable` in `.env.local`. Use `ws://` not `wss://` — there's no TLS locally. On Apple Silicon, add `--platform linux/amd64` if the build segfaults during bootsnap precompile.

</details>

### 2. Add a new env var to the deploy pipeline

Add `RATE_LIMIT_PER_MINUTE=30` as a clear env var in `deploy.yml`. Verify with `bin/kamal app exec 'printenv RATE_LIMIT_PER_MINUTE'`.

<details>
<summary>Solution</summary>

Add to the `clear` section in `chat-server/config/deploy.yml`:

```yaml
  clear:
    SOLID_QUEUE_IN_PUMA: true
    ALLOWED_ORIGINS: "https://nikki-tony.vercel.app"
    RAILS_LOG_LEVEL: info
    RATE_LIMIT_PER_MINUTE: 30
```

Since it's a clear (non-secret) value, `.kamal/secrets` doesn't need updating. Deploy, then verify with `bin/kamal app exec 'printenv RATE_LIMIT_PER_MINUTE'`.

</details>

### 3. Inspect the Docker volume on the server

SSH in and find where SQLite files live on disk.

<details>
<summary>Solution</summary>

```bash
ssh root@178.104.231.154 "docker volume inspect chat_server_storage"
```

The `Mountpoint` (e.g., `/var/lib/docker/volumes/chat_server_storage/_data`) contains `production.sqlite3`, `production_cache.sqlite3`, `production_queue.sqlite3`, and `production_cable.sqlite3`.

</details>

### 4. Simulate a failed health check

Rename `GET /up` to `GET /health-check` in `config/routes.rb` and deploy.

<details>
<summary>Solution</summary>

Kamal polls `GET /up` after starting the new container. With the route renamed, it gets 404s, times out after 30 seconds, declares the container unhealthy, stops it, and keeps the old container running. You'll see `Container is not healthy` in the deploy output. Revert and redeploy to fix.

</details>
