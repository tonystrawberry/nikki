---
title: "Construire un Chat : Chapitre 5 — Déploiement avec Kamal"
date: "2026-05-31"
excerpt: "Build Docker multi-stage, déploiement Kamal 2 sur Hetzner, gestion des secrets, CI/CD GitHub Actions, et configuration WebSocket en production."
author: "Tony Duong"
category: "note"
tags: ["kamal", "docker", "hetzner", "deployment", "github-actions"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 5
collectionTitle: "Construire un Chat en Temps Réel"
---

Le serveur de chat fonctionne en local. Maintenant il doit fonctionner sur Internet. Ce chapitre couvre le build Docker, le déploiement Kamal 2 sur un VPS Hetzner, la gestion des secrets, le CI/CD, et la configuration CORS/WebSocket en production.

## L'architecture à deux hôtes

```
Vercel (offre gratuite)                  Hetzner CX22 (~3,49 EUR/mois)
─────────────────                     ───────────────────────────
Next.js 16 frontend                   Rails 8 + Puma + Thruster
  Pages statiques, UI admin             ActionCable WebSocket
  JS du widget de chat                  API REST, bases SQLite
                                        Solid Cable / Queue / Cache
        <── wss://nikki-chat.shirimono.fun/cable ──>
        <── https://nikki-chat.shirimono.fun/* ──>
```

Différence clé avec le [Chapitre 1](01-architecture-and-setup.md) : la production utilise `wss://` et `https://`. Le TLS se termine au niveau de kamal-proxy via Let's Encrypt, pas au niveau de Rails.

## Le Dockerfile

`chat-server/Dockerfile` — build multi-stage de 74 lignes.

| Étape | Ce qu'elle fait |
|-------|-------------|
| `base` | `ruby:3.2.2-slim` + sqlite3 + jemalloc |
| `build` | Ajoute build-essential, exécute `bundle install`, précompile bootsnap |
| finale | Copie les gems + l'app depuis build, s'exécute en non-root (uid 1000) |

Variables d'environnement importantes définies dans l'étape base :

```dockerfile
ENV RAILS_ENV="production" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"
```

`LD_PRELOAD` force jemalloc, réduisant la fragmentation mémoire sur un VPS de 4 Go. `BUNDLE_WITHOUT` exclut les gems de développement de l'image.

L'entrypoint (`chat-server/bin/docker-entrypoint`) exécute `db:prepare` avant le démarrage. Le CMD lance Thruster devant Puma :

```dockerfile
CMD ["./bin/thrust", "./bin/rails", "server"]
```

Thruster est un reverse proxy Go gérant HTTP/2, gzip et X-Sendfile.

## Configuration Kamal 2

`chat-server/config/deploy.yml` :

```yaml
service: chat-server
image: tonystrawberry/chat-server

servers:
  web:
    - 178.104.231.154

proxy:
  ssl: true
  host: nikki-chat.shirimono.fun
```

`proxy.ssl: true` provisionne un certificat Let's Encrypt au premier déploiement. Pas de nginx, pas de certbot.

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

Les valeurs `secret` sont injectées au moment du déploiement (jamais dans l'image). `SOLID_QUEUE_IN_PUMA` active le plugin Puma à la ligne 38 de `config/puma.rb` — les jobs en arrière-plan s'exécutent dans Puma, pas besoin d'un processus worker séparé.

```yaml
volumes:
  - "chat_server_storage:/rails/storage"
```

Critique : les bases de données SQLite vivent dans `/rails/storage`. Sans ce volume nommé, chaque déploiement efface la base de données.

```yaml
builder:
  arch: amd64
```

Sur Apple Silicon, Docker Buildx fait de la cross-compilation via QEMU.

## Gestion des secrets

`chat-server/.kamal/secrets` est commité dans git mais ne contient que des références de variables :

```bash
KAMAL_REGISTRY_USERNAME=$KAMAL_REGISTRY_USERNAME
KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD
RAILS_MASTER_KEY=$RAILS_MASTER_KEY
ADMIN_USER=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASSWORD
```

Les valeurs réelles proviennent de l'environnement shell. Pour les déploiements locaux, exportez depuis un `.env` (gitignored). Pour le CI, elles viennent des secrets GitHub Actions.

## CI/CD GitHub Actions

Chaque push sur `main` déclenche le déploiement :

```yaml
on:
  push:
    branches: [main]

concurrency:
  group: deploy
  cancel-in-progress: true
```

`concurrency` garantit qu'un seul déploiement s'exécute à la fois — poussez deux fois rapidement et le premier est annulé.

Les étapes du job : checkout, setup Ruby (avec cache), setup Docker Buildx, installation de la clé SSH, ajout du serveur aux `known_hosts`, exécution de `bin/kamal deploy`. Secrets GitHub requis : `SSH_PRIVATE_KEY`, `KAMAL_REGISTRY_USERNAME`, `KAMAL_REGISTRY_PASSWORD`, `RAILS_MASTER_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Configuration CORS et WebSocket en production

Trois variables d'env sur Vercel connectent le frontend à Rails :

```
NEXT_PUBLIC_CHAT_WS_URL=wss://nikki-chat.shirimono.fun/cable
NEXT_PUBLIC_CHAT_HTTP_URL=https://nikki-chat.shirimono.fun
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<la clé publique VAPID>
```

Côté Rails, `ALLOWED_ORIGINS` dans `deploy.yml` doit inclure le domaine Vercel. L'initialiseur CORS (`chat-server/config/initializers/cors.rb`) sépare par virgules :

```ruby
origins(*ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",").map(&:strip))
```

Le flux de déploiement complet :

```
git push main -> GitHub Actions -> bin/kamal deploy
  -> Docker build (amd64) -> push vers ghcr.io
  -> SSH vers Hetzner -> pull de l'image -> exécution de db:prepare
  -> Démarrage Puma + Thruster -> kamal-proxy provisionne le SSL
  -> Health check (GET /up) réussit -> ancien conteneur arrêté
```

Échange sans temps d'arrêt. Le flux complet prend environ 3 minutes.

## Pour aller plus loin

- **Rate limiting** — Ajouter un throttling par session à `VisitorChannel` (max 1 msg/sec). Rejeter l'excès avec un broadcast `too_fast`.
- **Indicateurs de frappe** — Broadcaster un événement `typing`, auto-effacement après 3 secondes. Juste un autre type de broadcast comme montré au [Chapitre 2](02-actioncable-backend.md).
- **Pièces jointes** — Active Storage + S3. Accepter les images dans le chat, afficher les miniatures dans le widget.
- **Plusieurs admins** — Remplacer l'authentification par variables d'env par une table `users` et bcrypt. L'authentification `AdminChannel` du [Chapitre 2](02-actioncable-backend.md) vérifierait un enregistrement en base de données à la place.

## A vous de jouer

### 1. Exécuter l'image de production en local

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

Définissez `NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3100` et `NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3100/cable` dans `.env.local`. Utilisez `ws://` et non `wss://` — il n'y a pas de TLS en local. Sur Apple Silicon, ajoutez `--platform linux/amd64` si le build segfault pendant la précompilation de bootsnap.

</details>

### 2. Ajouter une nouvelle variable d'env au pipeline de déploiement

Ajoutez `RATE_LIMIT_PER_MINUTE=30` comme variable d'env claire dans `deploy.yml`. Vérifiez avec `bin/kamal app exec 'printenv RATE_LIMIT_PER_MINUTE'`.

<details>
<summary>Solution</summary>

Ajoutez dans la section `clear` de `chat-server/config/deploy.yml` :

```yaml
  clear:
    SOLID_QUEUE_IN_PUMA: true
    ALLOWED_ORIGINS: "https://nikki-tony.vercel.app"
    RAILS_LOG_LEVEL: info
    RATE_LIMIT_PER_MINUTE: 30
```

Comme c'est une valeur claire (non secrète), `.kamal/secrets` n'a pas besoin de mise à jour. Déployez, puis vérifiez avec `bin/kamal app exec 'printenv RATE_LIMIT_PER_MINUTE'`.

</details>

### 3. Inspecter le volume Docker sur le serveur

Connectez-vous en SSH et trouvez où les fichiers SQLite se trouvent sur le disque.

<details>
<summary>Solution</summary>

```bash
ssh root@178.104.231.154 "docker volume inspect chat_server_storage"
```

Le `Mountpoint` (par ex., `/var/lib/docker/volumes/chat_server_storage/_data`) contient `production.sqlite3`, `production_cache.sqlite3`, `production_queue.sqlite3`, et `production_cable.sqlite3`.

</details>

### 4. Simuler un health check échoué

Renommez `GET /up` en `GET /health-check` dans `config/routes.rb` et déployez.

<details>
<summary>Solution</summary>

Kamal interroge `GET /up` après avoir démarré le nouveau conteneur. Avec la route renommée, il reçoit des 404, expire après 30 secondes, déclare le conteneur non sain, l'arrête, et garde l'ancien conteneur en fonctionnement. Vous verrez `Container is not healthy` dans la sortie du déploiement. Revertez et redéployez pour corriger.

</details>

---
*Traduit par Claude*
