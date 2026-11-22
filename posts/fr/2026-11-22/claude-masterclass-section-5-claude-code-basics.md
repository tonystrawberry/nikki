---
title: "Masterclass Claude · 5 : Claude Code, les bases"
date: "2026-11-22"
excerpt: "Installer Claude Code, les commandes et modes du quotidien, une première application construite en Plan mode, commit et push avec Claude, et CLAUDE.md comme mémoire du projet."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "git", "github", "vscode", "udemy"]
collection: "claude-masterclass"
collectionOrder: 5
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

Claude Code est un assistant agentique **dans le terminal**. Il lit et modifie les vrais fichiers, exécute des commandes et construit des fonctionnalités à partir d'une conversation. Il nécessite Pro ou plus. La section couvre l'installation, les commandes essentielles, une première application construite en Plan mode, git et GitHub via Claude, et **CLAUDE.md** pour que les règles du projet survivent d'une session à l'autre.

## Installation et premier lancement

```bash
curl -fsSL https://claude.ai/install.sh | bash   # macOS / Linux
irm https://claude.ai/install.ps1 | iex          # Windows PowerShell

cd ~/Desktop/"Claude Code Test"   # toujours démarrer dans un dossier de projet
claude                            # faire confiance au dossier
claude update                     # s'il indique que la version est ancienne
```

Dans la session, `/login` permet de choisir entre **abonnement** (recommandé : prix mensuel fixe, limites réinitialisées toutes les quelques heures, et Claude Code on the web inclus) et **clé API Console** (paiement au token, ce qui grimpe vite).

On peut l'utiliser dans le terminal brut, dans l'**application de bureau** (onglet Code, l'option la plus douce), ou dans un IDE comme VS Code, Cursor ou Antigravity. Dans un IDE, ouvrir le terminal intégré avec `` Ctrl/Cmd+` `` et lancer `claude`, ou installer l'**extension Claude Code** d'Anthropic (vérifier le badge de certification). Dans Antigravity, fermer le panneau de l'agent Gemini par défaut et utiliser l'extension à la place.

## Commandes du quotidien

```text
/terminal-setup   Shift+Enter = nouvelle ligne au lieu d'envoyer
/context          ce qui remplit la fenêtre de 200k (système, outils, MCP, skills, messages)
/clear            nouvelle conversation
/exit · /resume   quitter, puis reprendre une conversation passée
/model            Opus (le meilleur), Sonnet (économise des tokens), Haiku, plus le niveau d'effort
/config           p. ex. thinking mode on/off (off est plus rapide mais moins bon)
/theme · /statusline
```

**Shift+Tab** fait défiler les modes :
- **Default** demande avant chaque modification ou commande.
- **Accept edits** modifie librement les fichiers mais demande encore avant les actions risquées.
- **Plan mode** ne touche pas au code. On discute du travail et on obtient un plan d'implémentation.

Quand la fenêtre de contexte est presque pleine, Claude Code fait un **auto-compact** (résume l'historique) et des détails se perdent. Garder les tâches petites et faire `/clear` souvent.

## Première application : un suivi d'habitudes

En Plan mode, décrire l'application : habitudes quotidiennes, marquer comme fait, séries, un tableau de bord. Claude pose des **questions de clarification** sur la stack (React + Vite recommandé) et le stockage (localStorage). Puis il rédige un plan ; on choisit *auto-accept edits*, et il génère la structure, installe, vérifie les types et lance le serveur de dev. Total : environ 7 minutes et 15k tokens. Ensuite, on la lance avec :

```bash
npm run dev
```

## Obtenir de meilleurs résultats

- Mauvaise entrée, mauvais résultat. Traiter Claude comme une nouvelle recrue talentueuse qui a besoin d'un vrai brief.
- Penser en **fonctionnalités, pas en produits** : « une application de réservation avec vue calendrier, confirmation par e-mail, connexion client et paiement » plutôt que « une application de réservation ». Cette liste, c'est ton PRD.
- **Tester chaque fonctionnalité** avant de passer à la suite : « Écris un test rapide pour vérifier que cette fonctionnalité marche avant qu'on continue. »

## Git et GitHub, gérés par Claude

Git est l'outil (instantanés locaux, annulation illimitée) ; GitHub est le stockage (une sauvegarde en ligne sur laquelle on peut collaborer). On configure ça une seule fois :

```bash
git --version
brew install gh        # ou l'installeur depuis cli.github.com
gh auth login          # GitHub.com → HTTPS → Y → connexion via le navigateur
```

Ensuite :

```text
Crée un dépôt GitHub pour ce projet et, à partir de maintenant, commit
toutes les modifications avec des messages clairs et push-les régulièrement.
```

Claude écrit un `.gitignore` et un README, fait le commit initial, crée le repo et pousse. GitHub crédite Claude comme co-auteur.

## CLAUDE.md, la mémoire du projet

Une nouvelle session **ne se souvient de rien** : Claude peut lire le git log, mais il ne connaît pas les règles que tu as fixées. La solution est `CLAUDE.md`, lu automatiquement au début de chaque session.

```text
/init     # analyse le repo → rédige un brouillon de CLAUDE.md (vue d'ensemble, architecture, comment lancer)
```

Puis ajouter ses propres règles :

```markdown
## Workflow Git
Après chaque modification significative, fais un commit avec un message concis et pousse sur GitHub.
Explique toujours ce que tu vas faire avant de modifier quoi que ce soit.
Demande toujours avant de supprimer des fichiers.
```

Prendre l'habitude de lancer `/init` au début de chaque projet et de mettre à jour le fichier dès que Claude doit retenir quelque chose.

---

> 🌐 *Traduit par Claude*
