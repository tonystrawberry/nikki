---
title: "Jour 69"
date: "2026-09-02"
excerpt: "Erreurs Claude Code Action au max de turns, beaucoup de turns gaspillés sur permission denied, et show_full_output temporaire pour auditer les permissions manquantes."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "claude-code", "github-actions", "ci", "permissions"]
coverImage: ""
---

## Aujourd'hui, j'ai :

- rencontré des erreurs Claude Code Action dues au dépassement du max de turns — le compteur de permission denied était assez élevé et consommait des turns pour rien ; ajouté temporairement `show_full_output: true` pour voir quelles permissions sont refusées, je vérifierai demain et ajouterai celles manquantes si besoin ([action.yml](https://github.com/anthropics/claude-code-action/blob/main/action.yml))

---

> 🌐 *Traduit par Claude*
