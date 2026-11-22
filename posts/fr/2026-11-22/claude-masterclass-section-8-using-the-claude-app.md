---
title: "Masterclass Claude · 8 : Utiliser l'app Claude"
date: "2026-11-22"
excerpt: "Le chapitre optionnel sur les bases : offres, quel modèle utiliser et quand, fonctionnement des LLM, instructions personnalisées, Projects, mémoire, artifacts, la formule de prompt, et comment Claude lit les fichiers et les images."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "prompting", "llm", "artifacts", "udemy"]
collection: "claude-masterclass"
collectionOrder: 8
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

Le cours indique que ce chapitre est optionnel : c'est un tour de claude.ai lui-même. Les parties utiles : choisir le bon modèle, mettre du contexte dans les **Projects** et les **instructions personnalisées**, activer la **mémoire**, construire des **artifacts** et utiliser une formule de prompt simple.

## Offres

| Offre | Prix | Pour |
|---|---|---|
| Free | 0 $ | Essayer : limites serrées, pas de Projects |
| **Pro** | 20 $/mois (17 $/mois en annuel) | La plupart des utilisateurs quotidiens : Projects illimités, Claude Code, Cowork |
| Max | à partir de 100 $/mois | Gros utilisateurs : limites plus hautes, nouveautés en avance, priorité |
| Team / Enterprise / API | — | Organisations et développeurs |

## Quel modèle ?

- **Haiku** : le plus rapide et le moins cher. Questions-réponses rapides, tâches à gros volume ou en temps réel.
- **Sonnet** : le modèle par défaut, avec le meilleur équilibre. Rédaction, recherche, code et documents ; environ 90 % des tâches.
- **Opus** : raisonnement approfondi, quand le résultat compte vraiment.

## Fonctionnement d'un LLM, en bref

Un réseau de neurones entraîné sur d'énormes quantités de texte. Il **prédit les tokens suivants les plus utiles** ; il ne « comprend » pas et ne cherche rien. Tout ce qu'on envoie, y compris les fichiers, devient des tokens dans une **fenêtre de contexte** limitée.

## Instructions personnalisées

**Settings → General → instructions/preferences** s'appliquent à chaque chat. Par exemple : « Donne des réponses claires et structurées. Concentre-toi sur les cas d'usage pratiques. »

## Projects

Un Project est un dossier de chats avec des **fichiers**, des **instructions** et une **mémoire** partagés : par exemple un projet « Marketing » qui contient ses guides. On peut déplacer un chat existant dans un projet via ⋯ → *Add to project*.

Test rapide pour vérifier que les instructions sont appliquées : ajouter « termine chaque réponse par `[test]` ».

## Mémoire

**Settings → Capabilities → Memory** propose deux options : *search and reference past chats* et *generate memory from chat history*. Les deux couvrent les chats et les projets. Ça fonctionne comme de la récupération (RAG), un carnet que Claude consulte. Démarrer un nouveau chat quand on veut repartir de zéro.

## Artifacts

Des éléments interactifs que Claude construit directement dans le chat : dashboards, apps web, jeux, flashcards, convertisseurs. Les démos : un dashboard de KPI SaaS (revenus, croissance, funnel) et une app « générateur de prompts », chacun fait en environ deux prompts puis affiné.

## La formule de prompt

**Rôle + Tâche + Contexte + Format = résultat**

```text
Agis comme un content marketer senior.                              # rôle
Écris un article de blog de 1 200 mots sur <topic>, étape par étape : # tâche
plan, intro, 3 sections, CTA.
Voici 3 anciens articles pour que tu reprennes mon ton : <files>.   # contexte
Rends-le sous forme d'artifact document avec des titres H2.         # format
```

Pour les contenus longs, demander d'abord le plan, puis développer chaque partie. Pour tout ce qu'on répète, en faire plutôt une **skill**.

## Fichiers, vision et voix

Les PDF, CSV et DOCX envoyés sont **convertis en texte et tokenisés** dans le contexte, comme un long message. Les PDF scannés sont des images, et les très gros fichiers peuvent être **tronqués** s'ils dépassent la fenêtre de contexte. Claude lit aussi les images et prend en charge la saisie vocale.

---

> 🌐 *Traduit par Claude*
