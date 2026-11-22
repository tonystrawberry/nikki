---
title: "Masterclass Claude · 1 : Claude Cowork"
date: "2026-11-22"
excerpt: "Cowork est un chatbot qui agit sur ton ordinateur : il travaille sur tes fichiers, pilote ton navigateur, exécute des tâches récurrentes et utilise des connecteurs, et on peut le joindre depuis son téléphone avec Dispatch."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-cowork", "automation", "mcp", "udemy"]
collection: "claude-masterclass"
collectionOrder: 1
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

**Claude Cowork** se trouve dans l'application de bureau Claude. Un chatbot classique ne fait que donner des conseils ; Cowork **agit** : il renomme et trie les fichiers, rédige des rapports, pilote le navigateur et rejoue des workflows selon un planning. Il a la même capacité d'exécution que Claude Code, mais dans une application visuelle, sans terminal ni code.

| | Claude Code | Claude Cowork |
|---|---|---|
| Interface | CLI / IDE | Application de bureau (visuelle) |
| Public | Développeurs | Toute personne qui travaille avec des fichiers et des applications |
| Travaille sur | Codebases, git, terminal | Dossiers, documents, navigateur, applications |

## Installation

- Télécharger l'application de bureau sur claude.com/download et se connecter. Cowork nécessite un forfait payant.
- Passer l'application de **Chat** à **Cowork**.

## Travailler avec des dossiers

On donne accès à un dossier, puis on décrit la tâche en langage courant :

```text
Renomme tous les fichiers de mon dossier de factures en ajoutant la date
de la facture au début de chaque nom de fichier (AAAA-MM-JJ_...).
```

Claude parcourt les fichiers, extrait chaque date du contenu, renomme le tout et vérifie le résultat. Il s'en sort avec des conventions de nommage et des formats hétérogènes.

Autres exemples du cours :
- Extraire un **timelapse de 10 secondes** d'une longue vidéo.
- Transformer un dossier de reçus en récapitulatif.
- Transformer un dossier d'éléments de marque en **PPTX** téléchargeable.
- Mettre plusieurs tâches **en file d'attente** et continuer à travailler pendant qu'elles tournent.

> Cowork n'est rentable que pour les grosses tâches. Renommer trois fichiers n'en vaut pas la peine ; trois cents, si.

## Tâches dans le navigateur (Claude in Chrome)

- Installer l'extension **Claude in Chrome** et se connecter avec le même compte.
- Lancer une tâche avec « fais-le dans le navigateur » depuis l'application de bureau ou l'extension.
- Chaque tâche a son propre **groupe d'onglets Chrome**, qu'on peut fermer et rouvrir en un clic (la section 9 y revient).

## Teach Claude, puis planifier

**Teach Claude** n'existe que dans l'extension Chrome. On clique sur *Start recording*, on effectue la tâche en la commentant au micro, et Claude l'enregistre comme **raccourci**.

- La relancer avec `/shortcut-name`.
- La modifier dans ⋯ → Settings → Shortcuts.
- La **planifier**, par exemple chaque lundi : lire la feuille « LinkedIn Posting » et publier le post.

## Connecteurs (MCP)

Ils se trouvent dans Customize → **Connectors** (à côté de Skills et Plugins). Il en existe des prêts à l'emploi pour Gmail, Notion, Slack, Canva, Figma, HubSpot et Google Calendar. Pour le reste, utiliser **Add custom connector** avec l'URL du serveur MCP de l'application.

```text
Va dans Gmail, récupère les 10 derniers e-mails que j'ai envoyés et crée
un PDF qui décrit mon style d'écriture et mon ton.
```

Ce PDF devient ensuite un **skill** pour rédiger des e-mails avec ta propre voix. Claude choisit seul le bon connecteur, et on peut lui dire « utilise le connecteur Gmail » s'il ne le fait pas.

## Computer use et Dispatch

- **Computer use** : Claude contrôle toute la machine (applications, souris, clavier), pas seulement un dossier autorisé ou le navigateur.
- **Dispatch** : envoyer des tâches au Cowork de l'ordinateur **depuis son téléphone**. Activer l'accès aux fichiers et « garder l'ordinateur éveillé », sinon les tâches ne s'exécutent pas pendant la mise en veille. Le formateur conseille de ne pas garder de fichiers sensibles sur cette machine.

## Bonus : créer un site web dans Cowork

Créer un **Project**, qui partage fichiers, instructions et un dossier local entre les conversations. Coller un modèle de cahier des charges de site, répondre aux questions de Claude, et il génère toute la structure du site. Ensuite, l'héberger.

## Exercices
1. Ranger un dossier en désordre (par date, par type, en supprimant les doublons) et comparer avant/après.
2. Réaliser une vraie tâche avec l'agent navigateur.
3. Apprendre à Claude un workflow répétitif, puis déclencher le raccourci.

---

> 🌐 *Traduit par Claude*
