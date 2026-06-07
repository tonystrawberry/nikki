---
title: "Économiser environ 60 $/mois en passant de Render à Hetzner avec Kamal"
date: "2026-05-10"
excerpt: "Migration du backend Rails 8 de Shirimono de Render vers un seul Hetzner CPX21 avec Kamal. La facture est passée d'environ 70 $ à environ 9 $ par mois. Le setup, le calcul des coûts et les quatre pièges qui ont mangé l'essentiel de la fenêtre de bascule."
author: "Tony Duong"
category: "tech"
categories: ["tech", "work"]
tags: ["devops", "rails", "kamal", "hetzner", "render", "shirimono"]
---

J'héberge [Shirimono](https://shirimono.fun) — une app d'apprentissage du japonais que je développe et maintiens en solo. Jusqu'à la semaine dernière, le backend Rails tournait sur Render : un service web, un worker, et une base Postgres managée. Ce setup est super pour démarrer, mais la facture grimpait plus vite que ne le justifiait la base d'utilisateurs. Donc je l'ai déménagé.

Aujourd'hui le même backend tourne sur un seul VPS **Hetzner Cloud CPX21**, déployé avec **Kamal 2**. La facture mensuelle d'hébergement est passée d'environ **70 $ à ~9 $**, et l'histoire opérationnelle est en fait *plus simple*, pas plus compliquée. Voici le détail et ce que ça a demandé.

---

## Le « avant » sur Render

Render me facturait trois choses :

| Service | Plan | Mensuel |
| --- | --- | --- |
| Web | Starter | ~25 $ |
| Worker (Solid Queue) | Starter | ~25 $ |
| Postgres | Standard | ~15 $+ |
| **Total** | | **~65–70 $** |

Ce n'est pas un mauvais deal pour une plateforme managée — Render gère les déploiements, le SSL, l'agrégation des logs, les redémarrages automatiques, les backups. Mais pour une app à l'échelle hobby/SaaS où je suis le seul opérateur, je payais ~60 $/mois pour une commodité dont je n'avais pas pleinement besoin.

Ce qui est intéressant avec la stack de Shirimono, c'est que **Rails 8 ship avec Solid Queue, Solid Cache et Solid Cable** — tous backed par la base de données. Pas de dépendance à Redis. Cela rend un déploiement mono-host étonnamment viable, parce qu'il n'y a pas besoin de faire tourner (ou gérer, ou payer) un service de cache/queue séparé.

---

## Le « après » sur Hetzner

Un seul Hetzner CPX21 (3 vCPU AMD / 4 Go RAM / 80 Go SSD / 20 To d'egress) fait tourner :

- **Conteneur web** — Rails 8 avec Solid Queue tournant in-Puma (topologie mono-host)
- **Accessoire Postgres 18** — même host, données sur un volume nommé Docker
- **kamal-proxy** — termine le TLS via Let's Encrypt pour `backend.shirimono.fun`

Active Storage reste sur AWS S3 (facture séparée, inchangée). Le frontend (Nuxt) est inchangé sur son propre host.

| Élément | Coût |
| --- | --- |
| Hetzner CPX21 | 7,59 €/mois |
| Adresse IPv4 | 0,50 €/mois |
| Backups Postgres → S3 (~50 Mo/nuit) | ~0,30 $/mois |
| **Total** | **≈ 9 $/mois** |

Même charge de travail. Environ **8× moins cher**.

---

## Pourquoi Kamal a rendu ça facile

Kamal 2 est l'outil de déploiement de Basecamp, et c'est la pièce qui fait que « retour à un VPS » ne ressemble pas à une régression. Depuis le laptop :

```bash
bin/kamal deploy
```

…build l'image localement, push sur GHCR, SSH dans le host, pull l'image, lance les migrations, et fait un rollover zéro-downtime derrière kamal-proxy. Le fichier `config/deploy.yml` liste l'IP du host, les variables d'environnement, et l'accessoire Postgres. C'est tout.

Toute la stack est décrite dans **deux fichiers** : `config/deploy.yml` et `.kamal/secrets`. Pas de chart Helm, pas de module Terraform, pas de dialecte YAML spécifique à la plateforme.

Le CD à chaque push sur `master` est un seul job GitHub Actions qui lance `bin/kamal deploy` après que la suite de tests passe. ~50 lignes de YAML.

---

## Les quatre pièges qui ont mangé l'essentiel de la fenêtre de bascule

La migration n'a pas été toute lisse. Quatre problèmes ont pris l'essentiel de mon temps, et ce sont tous le genre de choses qui *ne* surfacent qu'en production :

### 1. Les noms de service avec des underscores cassent `DATABASE_URL`

J'avais nommé le service Kamal `shirimono_backend`. Kamal dérive automatiquement le hostname de l'accessoire en `<service>-<accessory>`, donc le conteneur Postgres s'est retrouvé à `shirimono_backend-db` sur le réseau Docker interne. Puis Rails a crashé au boot :

```
URI::InvalidURIError: the scheme postgresql does not accept registry part:
  shirimono:****@shirimono_backend-db:5432 (or bad hostname?)
```

La librairie `URI` de Ruby suit la RFC 2396, qui **n'autorise pas les underscores dans les hostnames**. La RFC 3986 est plus permissive mais Ruby a choisi la stricte. Renommer le service en `shirimono-backend` (tiret) a réglé ça instantanément. Leçon : **n'utilisez jamais d'underscores dans les noms de service Kamal.**

### 2. Le layout du data directory de Postgres 18 a changé

J'avais épinglé l'accessoire à `postgres:18-alpine` pour matcher la version de Render (afin que `pg_dump` / `pg_restore` soient binary-compatibles pendant la migration). Le conteneur restart-loopait avec :

> in 18+, these Docker images are configured to store database data in a format which is compatible with `pg_ctlcluster` (specifically, using major-version-specific directory names). The suggested container configuration for 18+ is to place a single mount at `/var/lib/postgresql`…

La convention pré-18 était de monter le volume sur `/var/lib/postgresql/data`. L'image 18+ stocke les données dans `/var/lib/postgresql/<MAJOR>/docker/` à la place et refuse d'utiliser l'ancien chemin. Fix : changer le mount du volume dans `deploy.yml` de `data:/var/lib/postgresql/data` à `data:/var/lib/postgresql`.

### 3. `RAILS_MASTER_KEY` et le newline final

J'ai uploadé la master key sur GitHub Secrets avec `gh secret set RAILS_MASTER_KEY < config/master.key`. CI a déployé. Conteneur a booté. Conteneur a crashé :

```
ArgumentError: key must be 16 bytes
```

`config/master.key` est un fichier texte — il finit par un newline. `gh secret set` lit stdin verbatim et stocke `abcdef…32-hex-chars\n`. Quand Rails hex-décode ça pour construire une clé AES-128, le `\n` final fait que le compte d'octets est faux (17 octets, pas 16).

Fix à deux endroits — réuploader le secret avec le newline trimmé, *et* trimmer défensivement dans `.kamal/secrets` :

```bash
RAILS_MASTER_KEY=$(printf '%s' "${RAILS_MASTER_KEY:-$(cat config/master.key 2>/dev/null)}" | tr -d '[:space:]')
```

Ainsi, que la clé arrive via env var (CI) ou fichier (laptop), les whitespaces sont strippés avant que Rails les voie.

### 4. `HostAuthorization` de Rails rejette le health check de kamal-proxy

Conteneur booté, app prête. Le déploiement échoue toujours avec `target failed to become healthy within configured timeout (30s)`. Les logs :

```
[ActionDispatch::HostAuthorization::DefaultResponseApp]
  Blocked hosts: ed30fb987044:80, ed30fb987044:80
```

kamal-proxy probe `/up` en utilisant le hostname Docker interne du conteneur (`ed30fb987044:80`). L'allowlist `config.hosts` de Rails contient `shirimono.fun` et `*.shirimono.fun` — ni l'un ni l'autre ne match un ID de conteneur Docker. Donc `HostAuthorization` retourne 403, kamal-proxy marque le conteneur comme unhealthy, et le déploiement abort.

Rails embarque en fait un one-liner pour exactement ce cas (commenté par défaut dans `config/environments/production.rb`) :

```ruby
config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
```

Le décommenter a réglé le health check tout en gardant la validation d'host enforcée pour tous les autres paths. La frontière de sécurité publique est inchangée ; le probe interne au conteneur passe.

---

## Ce que j'ai abandonné

Ce n'est pas gratuit. Passer d'une plateforme managée à un VPS unique veut dire que je suis maintenant responsable de :

- **Updates OS** — `unattended-upgrades` est installé, mais le suivi kernel/sécurité est à moi.
- **Backups** — `pg_dump` nocturne vers S3 via cron + une rétention de 14 jours. Pas de point-in-time recovery managé.
- **Monitoring** — Honeybadger attrape les erreurs applicatives mais je n'ai pas de métriques VPS détaillées ; si la machine meurt, je l'apprends par les utilisateurs.
- **Single point of failure** — un seul VPS, pas de HA. Acceptable pour l'échelle de Shirimono.

Pour une app avec des clients enterprise payants et des SLOs, ces quatre points sont rédhibitoires. Pour un SaaS solo où l'alternative est de payer ~60 $/mois pour que quelqu'un d'autre les gère — totalement OK.

---

## Devriez-vous faire ça ?

Ça vaut le coup si :

- Vous payez 50 $+/mois sur une plateforme managée pour quelque chose que Kamal peut faire tourner sur un seul VPS.
- Votre stack n'*exige* pas Redis. (Rails 8 + Solid Stack est le sweet spot. Sidekiq + Redis marche aussi mais ajoute un accessoire.)
- Vous êtes à l'aise pour faire votre propre patching OS et vos backups via cron.
- Vous voulez un setup que vous pouvez pleinement comprendre sans lire la doc spécifique à une plateforme.

Pas la peine si :

- Vous avez des clients qui partiraient pour une coupure de 30 minutes pendant un déploiement raté.
- Vous n'avez pas la bande passante pour investiguer une page « pourquoi la box est down » à 3h du matin.
- Votre facture plateforme est déjà triviale.

Pour moi, le calcul était simple : ~60 $ par mois, ça achète beaucoup de crédits Anthropic et de frais Stripe, et le trafic de Shirimono tient absolument sur un CPX21. La migration a pris un après-midi plus quelques soirées de cleanup. Le surcoût opérationnel depuis la bascule a été nul.

Si vous envisagez le même move, les quatre pièges ci-dessus sont ceux qui m'ont coûté le plus de temps. Les connaître à l'avance vous fera, on l'espère, gagner les vôtres.

---
> 🌐 *Traduit par Claude*
