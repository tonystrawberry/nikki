---
title: "Les devs ne peuvent plus ignorer git worktree"
date: "2026-03-19"
excerpt: "Vidéo sur l’importance de git worktree : plusieurs répertoires de travail par repo pour le context switching, hotfixes, relecture de PR, et surtout exécuter une IA agentic dans un worktree séparé."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["git", "worktree", "workflow", "ai", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=S8_AsOuAwLo"
---

## Aperçu

Une vidéo qui affirme que **git worktree** n'est plus optionnel pour les développeurs. L'intervenant (inspiré du workflow de Chiao Tran) avait repoussé son apprentissage car ça semblait compliqué et les cas d'usage étaient évitables — jusqu'à ce que **l'IA agentic** rende le problème beaucoup plus difficile à contourner.

## Ce que les worktrees résolvent

- **Context switching** sans stash ni commit de WIP : par ex. en pleine feature, besoin de faire un hotfix, relire une PR, ou basculer sur une autre branche dans le même dépôt.
- **Workflows IA agentic :** Quand un agent IA travaille 15–30+ min dans le même repo (ex. une tâche multi-phases qui ouvre une PR à la fin), on ne peut pas travailler dans le même répertoire — l'agent modifie les mêmes fichiers. Sans worktree : attendre (ex. regarder YouTube en attendant la PR) ou risquer des conflits.

## Qu'est-ce qu'un git worktree ?

- Un **worktree** est un répertoire de travail séparé rattaché au même dépôt Git, généralement sur une autre branche.
- On peut avoir **plusieurs worktrees** : ex. main dans `./my-project`, branche feature dans `./my-project-feature`, branche agent dans `./my-project-agent`. Chacun a ses fichiers sur disque ; quand c'est fini on merge comme d'habitude.
- **Créer un :** `git worktree add <path> [branch]` (ex. `git worktree add ../my-project-hotfix main`). Des outils comme **lazygit** gèrent aussi les worktrees.

## Pourquoi c'est plus difficile d'y échapper maintenant

- L'**IA agentic** tourne souvent longtemps et modifie le code. Pour continuer à travailler dans le même repo (ex. sur autre chose) pendant que l'agent s'exécute, il faut un second répertoire — c'est ce qu'apporte un worktree. Même repo, même historique, arbre de travail différent et souvent une autre branche.

## Points clés

- Git worktree = plusieurs répertoires de travail pour un seul repo (branches différentes, même historique .git).
- Cas d'usage : hotfixes, relecture de PR, et **exécuter des agents IA dans un worktree dédié** pour garder la main sur le code ailleurs.
- Création via `git worktree add` ou lazygit ; merge des branches quand c'est prêt.

---
> 🌐 *Traduit par Claude*
