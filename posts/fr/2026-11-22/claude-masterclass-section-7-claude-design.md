---
title: "Masterclass Claude · 7 : Claude Design"
date: "2026-11-22"
excerpt: "Le produit design d'Anthropic : prototypes, présentations, design system réutilisable, templates et visuels 3D. Il consomme vite les crédits, d'où les astuces sur les tokens, le passage du design au code et une alternative open source."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-design", "design-systems", "prototyping", "udemy"]
collection: "claude-masterclass"
collectionOrder: 7
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

**Claude Design** est un produit Anthropic à part, accessible depuis la barre latérale de claude.ai, pour générer des designs professionnels en langage naturel : landing pages, contenus pour les réseaux sociaux, prototypes d'app, présentations et visuels 3D. Ses points forts : la **cohérence grâce à un design system** et l'itération rapide. Son point faible : une **limite d'usage hebdomadaire séparée** qui s'épuise vite.

## Créer un projet

Démarrer un projet et choisir un type : **Prototype** (celui qu'on utilise le plus), **Slide deck**, **From template** ou **Other**. Les prototypes existent en deux niveaux de fidélité :
- **Wireframe** pour une structure rapide.
- **High fidelity** pour un rendu prêt pour la production.

L'interface : le chat à gauche et un aperçu en direct à droite. On peut joindre des fichiers, et **Sketch** permet de dessiner la mise en page voulue.

## Design system : à configurer en premier

Un design system, ce sont les règles de sa marque : logo, polices, couleurs, boutons, mise en page et composants. On le construit une fois et on le sélectionne dans chaque nouveau projet, pour que chaque présentation et chaque page se ressemblent, sans avoir à réexpliquer son style. On peut l'exporter en ZIP depuis **Share**.

La marque de démo était un objet connecté fictif appelé « Knight Firm ». Le même système a produit une **présentation** (matériaux, batterie, étanchéité, prix) et une **landing page** avec un bouton de commande.

## Templates

- **Share → Duplicate as template** le publie pour son organisation ; ensuite **New from this template**.
- L'onglet **Examples** contient des templates prêts à l'emploi.

## Cas d'usage du cours

- Recréer un simple Google Doc sous forme de **PDF** soigné.
- Transformer le HTML d'un site en **vidéo promo** ou en **graphique animé** (faire d'abord écrire un prompt détaillé par Claude, car les prompts détaillés marchent bien mieux).
- Construire un système solaire **3D interactif** avec orbites, étiquettes au survol et contrôle de l'échelle de temps. C'était le défi de la section.
- Projet final : un **site complet construit de zéro et déployé sur Vercel**.
- **Prototype d'app mobile** : le concevoir dans Claude Design, exporter le ZIP, puis laisser **Claude Code** dans VS Code câbler chaque bouton et onglet. D'abord designer, ensuite développeur.

## Tokens, limites et astuces

- Consulter **Settings → Usage**. Claude Design a sa **propre limite hebdomadaire**, et Pro en reçoit beaucoup moins que Max. Une seule app complexe peut en consommer 40 à 50 %.
- **Ne pas faire de brainstorming dans Claude Design.** Réfléchir dans un chat normal, puis arriver avec un prompt précis.
- **Mettre l'instruction en dernier**, après tout le contexte.
- Utiliser l'icône ⚙️ pour choisir le modèle par projet : Haiku 4.5, Sonnet 4.6 ou Opus 4.7.
- On peut faire tourner **plusieurs projets en parallèle** dans différents onglets.

## Alternative gratuite : Open Design

**Open Design** est un clone open source en local avec plus de 40k étoiles, des dizaines de skills et de design systems, et des prototypes web, mobile, slides, images et vidéo. On l'installe avec un seul prompt dans Claude Code et on **apporte sa propre clé API** (OpenAI, etc.), donc la seule limite est sa propre consommation du modèle.

---

> 🌐 *Traduit par Claude*
