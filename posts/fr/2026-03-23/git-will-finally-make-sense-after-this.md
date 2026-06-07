---
title: "Git va enfin devenir clair"
date: "2026-03-23"
excerpt: "Vidéo expliquant les fondamentaux de Git depuis les bases : commits comme snapshots, structure DAG, branches comme pointeurs, HEAD, detached HEAD, trois zones (working/staging/repo), et commandes d'annulation."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["git", "version-control", "video", "fundamentals"]
youtubeUrl: "https://www.youtube.com/watch?v=Ala6PHlYjmw"
---

## Aperçu

Une vidéo qui démystifie Git en repartant de zéro. Beaucoup de développeurs mémorisent des commandes sans comprendre ce qui se passe dessous ; ici, l'objectif est d'acquérir le modèle mental pour ne plus craindre Git.

## Git comme base de données

- **Git est une base de données** dont l'unité fondamentale est le **commit**.
- Un commit est un **snapshot** complet du projet à un instant T.
- Ce n'est pas seulement "les changements", c'est l'état complet de chaque fichier au moment du commit.

## Ce qu'un commit contient

Chaque commit contient :

1. un pointeur vers le snapshot complet,
2. des métadonnées (auteur, date, message),
3. un pointeur vers le parent.

Les commits pointent vers le passé. Le premier commit n'a pas de parent. Un merge commit a généralement deux parents.

## DAG (Directed Acyclic Graph)

L'historique Git forme un **DAG** :

- **Directed** : liens dans un seul sens (enfant -> parent)
- **Acyclic** : aucune boucle
- **Graph** : nœuds (commits) + liens

Comme chaque commit est un snapshot complet, on peut revenir à n'importe quel point sans reconstruire l'historique pas à pas.

## Les branches sont des pointeurs

- Une branche n'est pas une copie du code, c'est un pointeur vers un hash de commit.
- `git branch feature` crée un label qui pointe vers un commit.
- Faire un commit sur une branche crée un nouveau commit puis déplace le pointeur de branche.
- `main` n'est pas "magique" : c'est juste une convention.

## HEAD

- `HEAD` indique votre position actuelle.
- Le plus souvent : `HEAD -> branche -> commit`.
- En checkout d'un hash brut : `HEAD` pointe directement vers le commit (**detached HEAD**).
- En detached HEAD, on peut commit, mais si aucun branchement ne référence ces commits, ils deviennent orphelins puis nettoyés par le garbage collector.

## Les trois zones Git

1. **Working directory** : fichiers sur disque
2. **Staging area (index)** : zone de préparation
3. **Repository** : historique permanent

Flux : modifier fichier -> `git add` -> `git commit`.

## Commandes d'annulation

- **checkout** : déplace HEAD
- **reset** : déplace la branche (et potentiellement index/working tree selon `--soft/--mixed/--hard`)
- **revert** : crée un nouveau commit inverse (sûr pour historique partagé)

## Points clés

- Git = base de snapshots immuables chaînés
- Branches = pointeurs, pas copies
- HEAD = position courante
- Detached HEAD = attention aux commits orphelins
- Comprendre ce modèle rend checkout/reset/revert/merge/rebase beaucoup plus simples

---
> 🌐 *Traduit par Claude*
