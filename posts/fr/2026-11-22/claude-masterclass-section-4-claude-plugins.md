---
title: "Masterclass Claude · 4 : Claude Plugins"
date: "2026-11-22"
excerpt: "Si un skill est une recette, un plugin est le chef : un paquet de skills, de commandes et de connecteurs MCP pour un métier, installé en un clic. Comment utiliser, personnaliser, importer et créer des plugins."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-plugins", "claude-skills", "mcp", "udemy"]
collection: "claude-masterclass"
collectionOrder: 4
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

Un **plugin** regroupe tout ce dont Claude a besoin pour un workflow (skills, commandes slash, connecteurs MCP et configuration) et s'installe en un clic. L'analogie du cours : **un skill est une recette, un plugin est le chef** qui connaît de nombreuses recettes et dispose des bons outils connectés.

| | Skill | Plugin |
|---|---|---|
| Quoi | Instructions pas à pas pour une tâche | Paquet installable pour tout un domaine |
| Contient | `SKILL.md` (+ références, scripts) | Skills + commandes + serveurs MCP + config |
| Données externes | Aucune nécessaire | Connexions en direct aux applications |
| Partage | Uploader un fichier | Marketplace, versionné, déployable en équipe, permissions limitées |

« Le skill est le cerveau, le plugin est le corps. »

## Utiliser un plugin

Aller dans **Customize → Plugins**, en choisir un (par exemple *Customer support*) et lire sa description et ses exemples **« Try asking »**. Le déclencher avec ses **commandes**. Le panneau latéral indique quelle commande et quel connecteur ont été utilisés.

## Personnaliser un plugin

1. ⋯ → **Show in folder** ouvre les dossiers `commands/` et `skills/` du plugin, où l'on modifie, ajoute ou supprime des fichiers. Il faut **redémarrer Claude** après toute suppression.
2. Le bouton **Customize** ouvre un chat. Commencer par « liste d'abord toutes les commandes et tous les skills de ce plugin », puis l'adapter à son entreprise.

## Importer des plugins

Utiliser **Add plugin** et choisir parmi :
- **Browse plugins** (ceux d'Anthropic), y compris l'onglet **Personal**.
- **Upload plugin** (glisser-déposer un fichier).
- **Add marketplace from GitHub or URL** : coller l'URL d'un repo ou un JSON de marketplace, puis **Sync**. Exemple : un plugin d'analyse financière depuis un repo public.

## En créer un

Le plus simple est de dire « Crée-moi un plugin » et Claude guide à travers les skills et les commandes. Le cours fournit aussi un assistant sous forme de formulaire qui rédige le prompt : nom, objectif, utilisateurs, catégorie, et 2 à 3 skills, chacun avec un déclencheur, des instructions et un format de sortie.

## Plugins Anthropic à découvrir

**Data** (tableaux de bord HTML interactifs et questions-réponses sur les données), **Marketing**, **Customer support**, **HR**, **Engineering**, **Operations** et **Sales**.

## Exercice

Concevoir un plugin autour d'un **thème**, pas d'une seule tâche. Par exemple, un plugin de contenu avec des skills de rédaction d'article, de recyclage de contenu et d'écriture d'accroches. Expliquer pourquoi ces skills vont ensemble.

---

> 🌐 *Traduit par Claude*
