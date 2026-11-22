---
title: "Masterclass Claude · 10 : Claude et les autres outils"
date: "2026-11-22"
excerpt: "Brancher Claude sur Excalidraw, Higgsfield, Canva, NotebookLM, ElevenLabs, Firecrawl, Notion et Google Stitch, surtout via des serveurs MCP, des connecteurs et des skills installés par Claude Code."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "mcp", "integrations", "udemy"]
collection: "claude-masterclass"
collectionOrder: 10
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

La plupart des intégrations suivent l'un de ces trois schémas :
1. Activer un **connecteur intégré** (Canva, Notion).
2. Pointer **Claude Code** vers un repo avec « lis le README, installe et lance-le en local », ce qui met en place un serveur MCP local ou une CLI.
3. Ajouter une **skill** qui apprend à Claude à bien rédiger les prompts pour l'autre outil.

```text
Va sur <repo URL> et installe <tool> pour moi. Lis d'abord le README,
puis fais toute l'installation en local : clone, installe les dépendances, build, lance,
et connecte-le à Claude.
```

## Les intégrations

| Outil | Ce qu'on obtient | Comment |
|---|---|---|
| **Excalidraw** | Des diagrammes complexes en quelques secondes, à partir d'une description, d'un texte structuré ou d'une capture d'écran | MCP Excalidraw open source installé en local par Claude Code. Il en fait plus que le connecteur officiel |
| **Higgsfield** | Images et vidéo (GPT Image, Nano Banana, Seedance, Veo 3.1) | Le connecter, puis ajouter la **skill de rédaction de prompts** du cours : Claude écrit les prompts et les réglages, Higgsfield fait le rendu |
| **Canva** | Posts pour les réseaux sociaux, logos, miniatures, infographies aux couleurs de sa marque | Customize → Connectors → Canva |
| **NotebookLM** | Sources, présentations, cartes mentales et vidéos générées en pilote automatique | Skill + scripts d'un repo communautaire dans Claude Code. Il peut être nécessaire d'autoriser *bypass permissions* dans Settings → Claude Code et de se connecter à Google |
| **ElevenLabs** | Un **agent de support vocal** entraîné sur sa FAQ, intégré à son site | Construit avec Claude Code : prompt système + base de connaissances + outils (MCP personnalisé possible) |
| **Firecrawl** | Scraping intensif : scrape, map, crawl multi-pages vers Markdown, automatisation de navigateur | Claude Code installe la CLI et s'authentifie. Ajoute environ 29 skills. La recherche web intégrée ne suffit que pour des recherches légères |
| **Notion** | Créer des pages et des bases de données, et les remplir à partir de recherches web | Le connecteur Notion. Contrairement aux agents de Notion, il est inclus dans l'offre Claude, sans limites Notion AI supplémentaires |
| **Google Stitch 2.0** | Design d'UI par IA → écrans haute fidélité + HTML/CSS, export Figma, refonte de sites existants | Ajouter le **serveur MCP Stitch** pour que Claude Code puisse piloter Stitch |

## À retenir

- **Les outils intégrés couvrent les cas légers** (recherche web, connecteurs officiels). Pour un travail lourd ou spécialisé, un outil dédié avec un serveur MCP ou une skill fait bien mieux.
- **Claude Code est l'installateur** : un seul prompt avec l'URL d'un repo remplace une installation manuelle.
- **Les skills portent l'expertise**, comme savoir écrire un excellent prompt d'image ou de vidéo, pour que l'intégration reste bonne à chaque fois.

---

> 🌐 *Traduit par Claude*
