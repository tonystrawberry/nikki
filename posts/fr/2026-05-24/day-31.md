---
title: "Jour 31"
date: "2026-05-24"
excerpt: "Un skill Claude Code pour les mises à niveau Rails, la première moitié d'une formation de 6 heures sur Apache Spark, et un chat en streaming propulsé par Claude sur /fr/chat."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "spark", "big-data", "ai", "claude", "nextjs"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- découvert [ombulabs/claude-code_rails-upgrade-skill](https://github.com/ombulabs/claude-code_rails-upgrade-skill) via Ruby Weekly — devrait être vraiment utile pour la mise à niveau Rails 7.2 → 8.1 qu'on prépare chez Spacely
- regardé [Apache Spark — The Ultimate Guide](/fr/posts/apache-spark-the-ultimate-guide-from-zero-to-pro) jusqu'à 3:50:46 — la présentation d'Ansh Lamba est drôle et conversationnelle, comme un pote qui te guide, ce qui rend un cours de 6 heures réellement finissable ; j'ai déjà beaucoup appris sur Spark et je terminerai le reste demain
- livré une fonctionnalité de chat sur [/fr/chat](/fr/chat) — une route API Next.js en streaming qui envoie les deltas de Claude Sonnet 4.6 directement au navigateur via un `ReadableStream`, avec le prompt système reconstruit à chaque requête à partir d'un fichier Markdown de persona soigné plus un digest de chaque article dans la locale active (titre, date, catégorie, tags, extrait), le tout enveloppé dans `cache_control: ephemeral` pour que les tours suivants tapent le cache de prompt ; les messages utilisateurs sont validés par Zod et react-markdown rend les bulles streamées ; pas vraiment un *clone numérique* — plutôt un LLM augmenté avec le contenu de ce site — et la même UI est livrée en en et ja aussi

---
> 🌐 *Traduit par Claude*
