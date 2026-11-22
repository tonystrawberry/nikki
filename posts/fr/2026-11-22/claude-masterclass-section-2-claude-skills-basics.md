---
title: "Masterclass Claude · 2 : Claude Skills, les bases"
date: "2026-11-22"
excerpt: "Un skill, c'est une recette : un SKILL.md (avec scripts et références optionnels) qui apprend à Claude à faire une tâche à ta manière, à chaque fois. Comment utiliser, créer, modifier et trouver des skills."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-skills", "prompting", "udemy"]
collection: "claude-masterclass"
collectionOrder: 2
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

Claude sait déjà faire la plupart des tâches, mais pas **à ta manière**. Un **skill** est un guide d'intégration écrit en langage courant : étapes, niveau d'exigence, format, ton et expertise. Claude plus un skill, c'est un expert à la demande avec un résultat **constant**, et un skill peut être partagé avec une équipe.

## Utiliser des skills

- Aller dans **Customize → Skills** et activer les skills Anthropic voulus (canvas design, doc co-authoring, etc.).
- Pour importer un skill, cliquer sur **+ → Upload** et glisser le `.md`, le `.zip` ou le dossier.
- Le cours offre un pack de plus de 20 skills, comme un hook engineer, notes→PowerPoint, un optimiseur de CTA et un convertisseur de documents.

## Anatomie d'un skill

```text
my-skill/
├── SKILL.md        # obligatoire : rôle, logique, règles de décision, workflow
├── scripts/        # optionnel : Python pour traiter des données, appeler des API…
└── references/     # optionnel : guides, exemples, docs métier
```

Le seul élément indispensable est `SKILL.md`. C'est la `description` de son frontmatter qui indique à Claude à quoi sert le skill et quand l'utiliser.

## Trois façons d'en créer un

1. **Skill Creator** : le skill d'Anthropic pour créer des skills. On discute, on joint des références et il pose des questions. Sans code, et la voie la plus simple.
2. **Manuelle** : écrire soi-même `SKILL.md` et les dossiers, puis les uploader.
3. **Claude Code** : le construire dans le `.claude/skills/` du projet (section 3).

Modèle pour transformer un document en skill (paraphrasé) :

```text
Examine <nom du document>, que j'ai joint, et transforme-le en skill Claude
réutilisable qui <objectif>.
Avant de commencer, vérifie que tous les fichiers de marque/contexte nécessaires
sont inclus ; s'il manque des détails clés, fais une pause et pose-moi des
questions courtes et précises.
Suis strictement le processus étape par étape du document.
Utilise le skill skill-creator pour que la structure et le format soient corrects.
```

Astuce : demander à Claude de *remplir uniquement le modèle, sans créer le skill pour l'instant*. Sinon, il lui arrive d'exécuter un skill pour en fabriquer un autre.

## Modifier un skill

- Dans le chat, dire « Mets à jour mon skill `<skill-name>` avec ce fichier… ». Dans une nouvelle conversation, nommer explicitement le skill.
- Ou bien ⋯ → **Download**, modifier les fichiers et les ré-uploader.

## Exemple : un skill « actualités mondiales »

Créé via le chat. Skill Creator a posé des questions sur les sujets, le format et le nombre d'articles, puis a **lancé des évals avec et sans le skill**, avec un taux de réussite de **93 % contre 55 %**.

## Où trouver des skills

skillhub.club, skillsmp et d'autres marketplaces similaires, dont certaines payantes. Les skills trouvés sur internet doivent parfois être adaptés : demander à Claude de « rendre ce skill compatible avec Claude ».

## Exercices
1. Activer un skill intégré et l'utiliser.
2. Créer son premier skill avec la méthode de son choix.
3. En option, créer trois skills, un par méthode.

---

> 🌐 *Traduit par Claude*
