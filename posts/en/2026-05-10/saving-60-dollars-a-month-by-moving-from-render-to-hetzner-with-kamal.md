---
title: "Saving ~$60/month by moving from Render to Hetzner with Kamal"
date: "2026-05-10"
excerpt: "Migrated Shirimono's Rails 8 backend from Render to a single Hetzner CPX21 with Kamal. Bill dropped from ~$70 to ~$9 per month. The setup, the cost math, and the four gotchas that ate most of the cutover window."
author: "Tony Duong"
category: "tech"
tags: ["devops", "rails", "kamal", "hetzner", "render", "shirimono"]
---

I host [Shirimono](https://shirimono.fun) — a Japanese learning app I build and maintain solo. Until last week, the Rails backend ran on Render: one web service, one worker, and a managed Postgres database. That setup is great for getting started, but the bill was creeping up faster than the user base was justifying. So I moved it.

Today the same backend runs on a single **Hetzner Cloud CPX21** VPS, deployed with **Kamal 2**. The monthly hosting bill went from roughly **$70 to ~$9**, and the operational story is actually *simpler*, not more complex. Here's the breakdown and what it took.

---

## The "before" picture on Render

Render charged me for three things:

| Service | Plan | Monthly |
| --- | --- | --- |
| Web | Starter | ~$25 |
| Worker (Solid Queue) | Starter | ~$25 |
| Postgres | Standard | ~$15+ |
| **Total** | | **~$65–70** |

That's not a bad deal for a managed platform — Render handles deploys, SSL, log aggregation, automatic restarts, backups. But for a hobby/SaaS-scale app where I'm the only operator, I was paying ~$60/month for convenience I didn't fully need.

The interesting thing about Shirimono's stack is that **Rails 8 ships with Solid Queue, Solid Cache, and Solid Cable** — all database-backed. There's no Redis dependency. That makes a single-host deployment surprisingly viable, because you don't need to run (or manage, or pay for) a separate cache/queue service.

---

## The "after" picture on Hetzner

One Hetzner CPX21 (3 vCPU AMD / 4 GB RAM / 80 GB SSD / 20 TB egress) runs:

- **Web container** — Rails 8 with Solid Queue running in-Puma (single-host topology)
- **Postgres 18 accessory** — same host, data on a Docker named volume
- **kamal-proxy** — terminates TLS via Let's Encrypt for `backend.shirimono.fun`

Active Storage stays on AWS S3 (separate bill, unchanged). The frontend (Nuxt) is unchanged on its own host.

| Item | Cost |
| --- | --- |
| Hetzner CPX21 | €7.59/mo |
| IPv4 address | €0.50/mo |
| Postgres backups → S3 (~50 MB nightly) | ~$0.30/mo |
| **Total** | **≈ $9/mo** |

Same workload. Roughly **8× cheaper**.

---

## Why Kamal made this easy

Kamal 2 is Basecamp's deploy tool, and it's the part that makes "back to a VPS" not feel like a regression. From the laptop:

```bash
bin/kamal deploy
```

…builds the image locally, pushes to GHCR, SSHs into the host, pulls the image, runs migrations, and does a zero-downtime rollover behind kamal-proxy. The `config/deploy.yml` file lists the host IP, the env vars, and the Postgres accessory. That's it.

The whole stack is described in **two files**: `config/deploy.yml` and `.kamal/secrets`. No Helm chart, no Terraform module, no platform-specific YAML dialect.

CD on every push to `master` is one GitHub Actions job that runs `bin/kamal deploy` after the test suite passes. ~50 lines of YAML.

---

## The four gotchas that ate most of the cutover window

The migration wasn't all smooth. Four issues took most of my time, and they're all the kind of thing that *only* surface in production:

### 1. Service names with underscores break `DATABASE_URL`

I named the Kamal service `shirimono_backend`. Kamal auto-derives the accessory hostname as `<service>-<accessory>`, so the Postgres container ended up at `shirimono_backend-db` on the internal Docker network. Then Rails crashed on boot:

```
URI::InvalidURIError: the scheme postgresql does not accept registry part:
  shirimono:****@shirimono_backend-db:5432 (or bad hostname?)
```

Ruby's `URI` library follows RFC 2396, which **doesn't allow underscores in hostnames**. RFC 3986 is more lenient but Ruby chose strictness. Renaming the service to `shirimono-backend` (hyphen) fixed it instantly. Lesson: **never use underscores in Kamal service names.**

### 2. Postgres 18's data layout changed

I pinned the accessory to `postgres:18-alpine` to match Render's version (so `pg_dump` / `pg_restore` would be binary-compatible during the migration). The container kept restart-looping with:

> in 18+, these Docker images are configured to store database data in a format which is compatible with `pg_ctlcluster` (specifically, using major-version-specific directory names). The suggested container configuration for 18+ is to place a single mount at `/var/lib/postgresql`…

The pre-18 convention was to mount the volume at `/var/lib/postgresql/data`. The 18+ image stores data in `/var/lib/postgresql/<MAJOR>/docker/` instead and refuses to use the old path. Fix: change the volume mount in `deploy.yml` from `data:/var/lib/postgresql/data` to `data:/var/lib/postgresql`.

### 3. `RAILS_MASTER_KEY` and the trailing newline

I uploaded the master key to GitHub Secrets with `gh secret set RAILS_MASTER_KEY < config/master.key`. CI deployed. Container booted. Container crashed:

```
ArgumentError: key must be 16 bytes
```

`config/master.key` is a text file — it ends with a newline. `gh secret set` reads stdin verbatim and stores `abcdef…32-hex-chars\n`. When Rails hex-decodes that on the way to building an AES-128 key, the trailing `\n` makes the byte count wrong (17 bytes, not 16).

Fix in two places — re-upload the secret with the newline trimmed, *and* defensively trim in `.kamal/secrets`:

```bash
RAILS_MASTER_KEY=$(printf '%s' "${RAILS_MASTER_KEY:-$(cat config/master.key 2>/dev/null)}" | tr -d '[:space:]')
```

So whether the key arrives via env var (CI) or file (laptop), whitespace gets stripped before Rails sees it.

### 4. Rails `HostAuthorization` rejecting kamal-proxy's health check

Container booted, app ready. Deploy still failed with `target failed to become healthy within configured timeout (30s)`. The logs:

```
[ActionDispatch::HostAuthorization::DefaultResponseApp]
  Blocked hosts: ed30fb987044:80, ed30fb987044:80
```

kamal-proxy probes `/up` using the container's internal Docker hostname (`ed30fb987044:80`). Rails' `config.hosts` allowlist contains `shirimono.fun` and `*.shirimono.fun` — neither matches a Docker container ID. So `HostAuthorization` returns 403, kamal-proxy marks the container unhealthy, and the deploy aborts.

Rails actually ships a one-liner for exactly this case (commented out by default in `config/environments/production.rb`):

```ruby
config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
```

Uncommenting it fixed the health check while keeping host validation enforced for every other path. Public-facing security boundary unchanged; container-internal probe goes through.

---

## What I gave up

This isn't free. Going from a managed platform to a single VPS means I now own:

- **OS updates** — `unattended-upgrades` is installed, but kernel/security tracking is on me.
- **Backups** — nightly `pg_dump` to S3 via cron + a 14-day retention prune. No managed point-in-time recovery.
- **Monitoring** — Honeybadger catches application errors but I don't have detailed VPS metrics; if the box dies, I find out from users.
- **Single point of failure** — one VPS, no HA. Acceptable for Shirimono's scale.

For an app with paying enterprise customers and SLOs, all four of these are dealbreakers. For a solo SaaS where the alternative is paying ~$60/month for someone else to handle them — totally fine.

---

## Should you do this?

Worth it if:

- You're paying $50+/month on a managed platform for something Kamal can run on one VPS.
- Your stack doesn't *require* Redis. (Rails 8 + Solid Stack is the sweet spot. Sidekiq + Redis works too but adds an accessory.)
- You're comfortable doing your own OS patching and cron-based backups.
- You want a setup you can fully understand without reading platform-specific documentation.

Not worth it if:

- You have customers who'll churn over a 30-minute outage during a botched deploy.
- You don't have the bandwidth to investigate a "why is the box down" page at 3am.
- Your platform bill is already trivial.

For me, the math was easy: ~$60 a month buys a lot of Anthropic credits and Stripe fees, and Shirimono's traffic absolutely fits on one CPX21. The migration took an afternoon plus a few evenings of cleanup. The operational overhead since the cutover has been zero.

If you're considering the same move, the four gotchas above are the ones that cost me the most time. Hopefully knowing them up front saves you yours.
