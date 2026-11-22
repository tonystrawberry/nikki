---
title: "Masterclass Claude · 3 : Claude Skills avancés"
date: "2026-11-22"
excerpt: "Bien concevoir ses skills : pourquoi ils surpassent projets et automatisations, comment rédiger la description et les instructions, les trois tests, la structure des dossiers, et en créer un à la main dans Claude Code."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-skills", "claude-code", "prompting", "udemy"]
collection: "claude-masterclass"
collectionOrder: 3
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

La section 2 portait sur l'utilisation de Skill Creator. Celle-ci porte sur la **conception** de skills par soi-même : un bon frontmatter, des instructions claires, une structure de dossiers propre et de vrais tests. Elle s'appuie sur le guide des skills d'Anthropic, long de 33 pages.

## Pourquoi des skills ?

- Les **projets et GPTs personnalisés** sont liés à un seul contexte et un seul projet.
- Les automatisations **n8n et Make** sont déterministes et codées en dur.
- Les **skills** sont flexibles, et un agent peut en charger des **milliers**, chacun n'étant chargé qu'en cas de besoin. Ils peuvent aussi **s'améliorer eux-mêmes** : chaque résultat validé est enregistré comme bon exemple.

## Le frontmatter décide quand le skill se déclenche

Claude garde en permanence en mémoire uniquement `name` et `description` : c'est la première impression que donne le skill.

```yaml
---
name: csv-data-pipeline          # kebab-case
description: Cleans, validates and transforms CSV files. Use when the
  user uploads a .csv or asks to clean, dedupe or reformat tabular data.
---
```

- ❌ `Helps with projects.` correspond à tout.
- ✅ Dire **ce qu'il fait** et **quand l'utiliser**, avec des mots déclencheurs et des types de fichiers : « Analyse des fichiers Figma et génère des docs de passation pour les devs. À utiliser quand l'utilisateur uploade un .fig ou demande des spécifications de design. »

Les instructions doivent être des étapes précises, avec des règles explicites et le format de sortie, pas des conseils vagues.

## Le tester de trois façons

| Test | Question | Comment |
|---|---|---|
| Déclenchement | S'active-t-il quand il le faut ? | **Nouvelle session**, avec des prompts qui doivent et ne doivent pas le déclencher |
| Fonctionnel | Le résultat est-il correct et constant ? | Le lancer 4 à 5 fois avec des entrées légèrement différentes |
| Valeur | Mérite-t-il d'être un skill ? | Peser complexité et bénéfice ; tout n'a pas besoin d'être un skill |

S'il **se déclenche trop peu**, ajouter des mots déclencheurs. S'il **se déclenche trop**, resserrer la description.

## Structure des dossiers

```text
❌ my-skill/
   └── SKILL.md            # tout entassé dans un seul fichier

✅ csv-data-pipeline/
   ├── SKILL.md            # toujours chargé en premier
   ├── references/
   │   └── column-types.md # chargé à la demande
   └── scripts/
       └── clean.py        # exécuté seulement si nécessaire
```

Séparer les fichiers garde `SKILL.md` ciblé et **économise du contexte**, car les références ne sont lues que lorsque Claude en a besoin.

## En créer un à la main dans Claude Code

La démo construit un **rédacteur de brouillons d'e-mails** dans VS Code, sans Skill Creator :

```text
.claude/
└── skills/
    └── email-draft-writer/
        ├── SKILL.md
        └── references/
            ├── examples.md
            └── tone-guidelines.md
```

- Attention au point au début de `.claude`.
- Ce skill ne contient que des instructions, donc pas de `scripts/`.
- Pour le modifier, ouvrir directement `SKILL.md` ; c'est juste du Markdown. Ajouter des mots déclencheurs à la description est la correction la plus courante.
- Pour ajouter un ton ou un modèle, créer un nouveau fichier de référence et **le lier depuis SKILL.md**.

## Exercice

Créer un skill pour une vraie corvée quotidienne, comme notes de réunion → résumé avec actions à mener, ou chiffres bruts → rapport hebdomadaire. Choisir un design pattern, créer `SKILL.md` + `references/` avec au moins une référence, puis **essayer de le casser**.

---

> 🌐 *Traduit par Claude*
