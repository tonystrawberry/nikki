---
title: "Développement piloté par les spécifications avec Kiro : fonctionnalités et capacités"
date: "2026-04-14"
excerpt: "Notes de mon premier cours AWS Skill Builder, résumant le workflow spec-driven de Kiro, ses fonctionnalités clés et des cas d'usage pratiques."
author: "Tony Duong"
category: "note"
tags: ["aws", "skillbuilder", "kiro", "spec-driven-development", "ai", "engineering"]
---

## Vue d'ensemble

J'ai terminé mon premier cours AWS Skill Builder, **Spec-Driven Development with Kiro**, et cette note résume les capacités principales qui m'ont marqué.

L'idée centrale est simple : au lieu de démarrer avec des prompts ad hoc, Kiro pousse un flux structuré où l'on définit d'abord l'intention, les contraintes et les résultats attendus, puis on itère avec l'IA en gardant la spec comme source de vérité.

## Ce que signifie "spec-driven" en pratique

Le développement spec-driven avec Kiro met l'accent sur :

- rédiger des exigences claires avant l'implémentation
- rendre explicites les critères d'acceptation
- utiliser la spec comme contexte partagé entre le développeur et l'IA
- valider l'implémentation par rapport au contrat initial

Cela réduit l'écart entre "ce qu'on a demandé" et "ce qu'on a livré".

## Fonctionnalités de Kiro que j'ai trouvées les plus utiles

## 1) Structuration des exigences

Kiro aide à découper une tâche en :

- objectif
- périmètre
- contraintes
- résultats attendus

Ce cadrage améliore la qualité des prompts et réduit les réponses IA ambiguës.

## 2) Raffinement itératif de la spec

Plutôt qu'une génération en un seul shot, le workflow encourage à affiner la spec en plusieurs passes :

- resserrer les exigences floues
- ajouter les cas limites manquants
- clarifier les non-objectifs

Chaque raffinement rend l'implémentation en aval plus fiable.

## 3) Traçabilité entre spec et résultat

Un bénéfice majeur est de garder un lien clair entre :

- les exigences
- l'implémentation générée
- le feedback de validation

Cela facilite fortement la revue et le handoff, surtout en équipe.

## 4) Meilleur état d'esprit de validation

Le cours renforce l'idée de valider le comportement, pas seulement le volume de code généré :

- vérifier contre les critères d'acceptation
- tester explicitement les cas limites
- traiter la sortie IA comme un brouillon jusqu'à preuve du contraire

## Capacités à appliquer dans le travail d'ingénierie quotidien

- utiliser des templates de spec style Kiro pour les tickets feature
- inclure contraintes et non-objectifs dans chaque demande de code à l'IA
- définir les critères de "done" avant de demander l'implémentation
- faire des boucles de revue rapides qui relient chaque changement à la spec

## Points clés

- la qualité de la spec détermine fortement la qualité de la sortie IA
- des contraintes explicites améliorent la justesse et réduisent le rework
- le raffinement itératif est plus efficace que le prompting one-shot pour les tâches non triviales
- l'approche de Kiro est utile non seulement pour les outils IA, mais aussi pour une communication d'ingénierie plus claire

---
*Traduit par Claude*
