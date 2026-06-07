---
title: "Jour 43"
date: "2026-06-07"
excerpt: "J'ai organisé ~120 monitors Datadog, terminé le dernier chapitre de DDIA, regardé une analyse de system design sur Uber ainsi que des vidéos sur la réussite et le minimalisme — et pris une grande décision : rentrer à Toulouse après 8 ans au Japon."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "learning", "productivity", "minimalism", "philosophy", "datadog", "monitoring", "observability", "ddia", "reading", "distributed-systems", "personal", "toulouse", "japan", "relocation", "career", "system-design", "uber"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- regardé [Success Is Not About Trying Hard](/fr/posts/success-is-not-about-trying-hard) — une réflexion sur la manière dont la réussite vient d'une régularité délibérée mêlée de hasard, d'intuition et de recul, plutôt que d'un effort brut, avec des exemples concrets (réussir des QCM en s'entraînant sur les questions, les jeux vidéo, et gérer une chaîne YouTube)
- regardé [Why I Live a Simple Minimalist Life](/fr/posts/why-i-live-a-simple-minimalist-life) — Theo, un ancien bijoutier qui possède désormais 9,6 kg d'affaires et vit en faisant du bénévolat dans des jardins en échange du gîte et du couvert, raconte comment se débarrasser de ses possessions (et de son lourd trousseau de clés) lui a apporté espoir, joie et la paix d'être en accord avec sa propre intégrité
- au travail, organisé l'ensemble des quelque 120 monitors Datadog existants — corrigé les incohérences de nommage (mélange d'anglais et de japonais, certains trop verbeux), ajouté des tags pour signaler ceux que l'équipe BE doit surveiller, et introduit des catégories (ANOMALY, LATENCY, etc.) ; aussi ajouté de nouveaux monitors, dont un qui alerte lorsque le nombre d'erreurs *par job* dépasse un seuil, afin que l'on puisse immédiatement identifier le job défaillant — beaucoup appris sur le monitoring Datadog au passage
- enfin terminé la lecture du dernier chapitre de *Designing Data-Intensive Applications* — [DDIA Chapter 12: The Future of Data Systems](/fr/posts/ddia-chapter-12-the-future-of-data-systems) — qui conclut tout le livre ; une énorme étape après des mois passés à le parcourir
- pris une grande décision : après 8 ans au Japon, ma compagne et moi allons rentrer à Toulouse pour voir si la vie y est meilleure pour nous — je continuerai à travailler pour Spacely à temps partiel, mais il me faudra peut-être trouver un emploi en télétravail en Europe
- regardé [System Design Interview: Design Uber w/ a Ex-Meta Staff Engineer](/fr/posts/system-design-interview-design-uber-ex-meta-staff-engineer) — l'approche de Hello Interview du problème de recherche de proximité le plus ardu : l'indexation géospatiale par quad-tree (PostGIS), la maîtrise d'environ 600K TPS de mises à jour de position grâce à des mises à jour dynamiques, et le verrouillage des chauffeurs (DynamoDB TTL) pour garantir la cohérence du matching

---

> 🌐 *Traduit par Claude*
