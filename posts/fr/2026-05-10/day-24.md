---
title: "Jour 24"
date: "2026-05-10"
excerpt: "migré le backend de Shirimono de Render vers Hetzner avec Kamal — économisé environ 60 $/mois"
author: "Tony Duong"
category: "daily"
tags: ["devops", "rails", "kamal", "hetzner", "shirimono"]
coverImage: ""
---

## Aujourd'hui, j'ai :

- migré le backend de [Shirimono](https://shirimono.fun) de Render vers un seul VPS Hetzner CPX21 en utilisant Kamal — écrit [Saving ~$60/month by moving from Render to Hetzner with Kamal](/fr/posts/saving-60-dollars-a-month-by-moving-from-render-to-hetzner-with-kamal) sur les raisons du changement, à quoi ressemble le nouveau setup mono-host (web + Solid Queue + Postgres sur une seule machine, sans Redis), le détail des coûts, et les quatre pièges qui ont mangé l'essentiel de la fenêtre de bascule : les noms de service Kamal avec des underscores qui cassent le parsing de `DATABASE_URL`, le nouveau layout du data directory de Postgres 18, le piège du newline final lors de l'upload de `RAILS_MASTER_KEY` dans GitHub Secrets, et `HostAuthorization` de Rails qui rejette les health checks de kamal-proxy

---
*Traduit par Claude*
