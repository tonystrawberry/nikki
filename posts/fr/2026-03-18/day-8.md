---
title: "Jour 8"
date: "2026-03-18"
excerpt: "Vu MIT/Anthropic sur les limites du codage IA ; lu DDIA chapitre 6 sur le partitionnement."
author: "Tony Duong"
category: "daily"
tags: ["ai", "coding", "benchmarks", "mit", "anthropic", "ddia", "databases", "partitioning"]
---

**Vu :** [MIT, Anthropic, and New Benchmarks Just Revealed AI's Biggest Coding Limits](https://www.youtube.com/watch?v=BAlSzHFmmwU) (à partir de ~3:26).

Les travaux du MIT et d'Anthropic montrent où le codage IA pêche encore : les benchmarks comme SWE-Bench peuvent être contournés, et les modèles qui performent bien échouent souvent sur d'autres langages ou en conditions réelles. L'évaluation automatique tend à surestimer les performances — les agents produisent du code qui passe les tests mais avec des problèmes de formatage, de lint ou de couverture que les humains repèrent. Malgré les promesses du secteur, les limites réelles du codage IA et les gains de productivité restent flous.

## Aujourd'hui, j'ai :

- lu [DDIA Chapitre 6 : Partitionnement](/fr/posts/2026-03-18/ddia-chapter-6-partitioning) — stratégies de partition (plage de clés vs hash), index secondaires (locaux vs globaux), rééquilibrage et routage des requêtes

---
*Traduit par Claude*
