---
title: "Jour 48"
date: "2026-06-16"
excerpt: "J'ai regardé Boris Cyrulnik sur la décivilisation et corrigé l'authentification Apple de Shirimono après la migration Hetzner — retours à la ligne PEM stockés en \\n littéraux."
author: "Tony Duong"
category: "daily"
tags: ["psychology", "parenting", "education", "family", "screens", "society", "shirimono", "apple", "authentication", "hetzner", "deployment", "debugging"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- regardé [Famille, école, écrans — L'alerte de Boris Cyrulnik](/fr/posts/family-school-screens-boris-cyrulnik-warning) — sur la décivilisation, les 1000 premiers jours de l'enfance, le temps d'écran et la dépression, les ruptures familiales, et la réinvention de rituels d'empathie
- corrigé l'authentification Apple pour Shirimono — après la migration de Render vers Hetzner et la copie des variables d'environnement, `APPLE_PRIVATE_KEY` en production contenait un PEM avec des `\n` littéraux au lieu de vrais retours à la ligne ; correction simple une fois trouvé, mais le débogage a été pénible

---

> 🌐 *Traduit par Claude*
