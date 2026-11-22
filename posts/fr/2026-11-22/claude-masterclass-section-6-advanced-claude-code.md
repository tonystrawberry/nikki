---
title: "Masterclass Claude · 6 : Claude Code avancé"
date: "2026-11-22"
excerpt: "Le Plan mode d'abord, des subagents pour garder le contexte principal propre, les skills dans Claude Code, le déploiement sur Vercel, et un projet final complet : un site de café avec un assistant IA n8n et des réservations."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "subagents", "vercel", "n8n", "udemy"]
collection: "claude-masterclass"
collectionOrder: 6
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

Planifier avant de construire. Déléguer à des **subagents** pour que la conversation principale reste propre. Ajouter des **skills** pour le savoir-faire répétable. Livrer en poussant sur GitHub puis en important le repo dans **Vercel**.

*Note : les sous-titres Udemy sont cassés pour les vidéos Plan mode, Skills et projet final, donc ces parties viennent des fiches d'exercices.*

## Bien utiliser le Plan mode

La démo construit un **suivi de finances** (qui reçoit plus tard une fonction de limite de budget). La boucle : décrire l'app → **répondre aux questions de clarification de Claude** → relire le plan → seulement ensuite construire. Garder le fichier de plan et le réutiliser. « Dix minutes de planification font gagner des heures. »

## Subagents

L'agent principal est un **manager**. Les subagents font le gros du travail dans **leur propre fenêtre de contexte** et ne renvoient qu'un **court résumé**, quelques centaines de tokens au lieu d'environ 70k.

Agents intégrés :

| Agent | Rôle |
|---|---|
| `general-purpose` | Tous les outils, recherches larges en plusieurs étapes |
| `Explore` | Trouver des fichiers et répondre aux questions sur le code (lecture seule) |
| `Plan` | Architecte : plans d'implémentation, fichiers critiques (lecture seule) |
| `statusline-setup` | Configure la barre de statut |
| `claude-code-guide` | Répond aux questions sur Claude Code et l'API (recherche web) |

```text
@claude-code-guide peux-tu m'expliquer ce que sont les skills ?      # parler à un agent

Utilise deux agents Explore pour résumer la stack technique
et les fonctionnalités principales de ce projet.                     # laisser l'agent principal déléguer

Ctrl+B        → envoyer les agents en cours en arrière-plan
Ctrl+B, ↓     → panneau des tâches en arrière-plan
```

Mesuré dans la démo : l'agent principal seul a utilisé **15 %** du contexte, et deux agents Explore en parallèle **10 %**, avec de **meilleurs** résultats car chacun avait une consigne plus ciblée. Les subagents n'utilisent pas moins de tokens au total ; ils **protègent le fil principal** de la saturation et de la compaction.

### Agent personnalisé

`/agents` → Create → portée **Project** (`.claude/agents/`) ou portée User → *Generate with Claude* → choisir les outils, le modèle (Sonnet est moins cher pour les revues de routine), la couleur et la mémoire.

```markdown
---
name: design-reviewer
description: Senior UI/UX reviewer. Use to check and improve layout, spacing,
  colours, typography, usability and responsiveness.
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---
Review the app visually and for UX. If something can be improved, fix it.
```

```text
Utilise l'agent design-reviewer pour vérifier le design et apporter les améliorations nécessaires.
Ne modifie rien toi-même ; laisse le reviewer s'en charger.
```

## Skills dans Claude Code

Les skills vivent dans `.claude/skills/<name>/SKILL.md` et sont chargées quand leur description correspond à la tâche. On les trouve sur **skills.sh**, dans le repo de skills d'Anthropic ou dans l'annuaire de plugins. Recommandée : **frontend-design** pour des UI d'aspect professionnel. Astuce pratique : installer d'abord **find-skills**, puis laisser Claude trouver et installer ce dont on a besoin.

## Déployer sur Vercel

Construire, c'est pour soi ; déployer, c'est pour tout le monde.

```text
Commite toutes les modifications en attente avec un message clair et pousse sur GitHub.
# pas encore un repo ? →
Fais les deux : initialise git et crée un nouveau repository GitHub public.
```

Ensuite, aller sur vercel.com, se connecter avec GitHub, **Add New Project**, importer le repo et cliquer sur **Deploy**. Le framework est détecté automatiquement et ça prend moins d'une minute. On peut ajouter un domaine personnalisé sous *Domains*. **Chaque push redéploie**, donc commiter en local et pousser par lots (le formateur dit que l'offre gratuite limite les redéploiements). Netlify fonctionne de la même façon.

## Projet final : site de café et assistant n8n

1. Planifier → construire → tester. Installer des skills (frontend-design), écrire **sa propre skill**, et ajouter **deux subagents** : un pour le design, un pour la revue du contenu ou du code.
2. Auto-héberger **n8n** (sur un VPS Hostinger dans le cours). Construire un **chatbot avec une vraie base de connaissances** et un **formulaire de réservation** dont les envois arrivent dans n8n via un webhook.
3. Relire avec les subagents, pousser, déployer. Activer l'**authentification du webhook** et définir ses **variables d'environnement dans Vercel**.

---

> 🌐 *Traduit par Claude*
