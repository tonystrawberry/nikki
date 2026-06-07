---
title: "Les livres qui ont fait de moi un dev backend assermenté"
date: "2026-03-19"
excerpt: "Vidéo listant sept livres pour monter en compétence backend : Clean Code, The Pragmatic Programmer, DDIA, System Design Interview, Database Internals, Release It et Fundamentals of Software Architecture."
author: "Tony Duong"
category: "note"
categories: ["note", "tech", "work"]
tags: ["books", "backend", "career", "software-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=ReNqPp3EmYk"
---

## Aperçu

Une vidéo qui soutient que **les livres sont la ressource la plus sous-utilisée** pour apprendre l'ingénierie logicielle — quand quelque chose casse, la plupart vont sur ChatGPT ou Claude au lieu d'ouvrir un livre. L'auteur présente **sept livres** qui l'ont aidé à progresser en backend.

## Les sept livres

1. **Clean Code** de Robert C. Martin (Uncle Bob) — Focus sur le nommage, la lisibilité et l'idée qu'on passe beaucoup plus de temps à lire du code qu'à en écrire (ratio ~10:1). Un code brouillon coûte des heures chaque semaine. Un chapitre entier sur comment nommer les choses.

2. **The Pragmatic Programmer** de Hunt & Thomas — Pas de syntaxe, pas de frameworks ; un livre de 1999 qui se lit comme un manuel pour les ingénieurs modernes (version control, automatisation, CI/CD avant leur démocratisation). Introduit DRY et des pratiques intemporelles.

3. **Designing Data-Intensive Applications (DDIA)** de Martin Kleppmann — Décrit comme la « bible du backend ». Explique *pourquoi* les bases de données se comportent comme elles le font quand les choses tournent mal — pas comment utiliser PostgreSQL ou Cassandra, mais comment elles raisonnent. Après lecture, les systèmes distribués deviennent compréhensibles au lieu d'être une devinette.

4. **System Design Interview** d'Alex Xu — Prép interview qui sert aussi de playbook d'architecture système. Un chapitre (ex. architecture de fil d'actualité) peut fournir le modèle mental pour corriger de vrais goulots d'étranglement au travail.

5. **Database Internals** d'Alex Petrov — La plupart des devs backend touchent une base chaque jour sans savoir comment elle fonctionne sous le capot. Couvre B-trees, moteurs de stockage, algorithmes de consensus. Une fois qu'on comprend pourquoi PostgreSQL préfère un index B-tree au hash, on arrête d'écrire des requêtes lentes par inadvertance. Idée clé : chaque base résout trois problèmes — comment stocker, comment récupérer, comment ne pas perdre les données.

6. **Release It** de Michael Nygard — Pas sur l'écriture de code mais sur ce qui se passe quand le code tourne en prod. Pourquoi les cascades de pannes ? Introduit des patterns comme circuit breaker et bulkhead pour qu'un service cassé n'entraîne pas tout le système.

7. **Fundamentals of Software Architecture** de Mark Richards & Neil Ford — Pour quand on arrête de juste coder et qu'on se demande pourquoi le système est construit ainsi. Couvre microservices, architecture event-driven, systèmes en couches et les compromis entre eux.

## Points clés

- Les livres sont une ressource sous-utilisée et à fort levier pour le backend et les systèmes.
- Clean Code et The Pragmatic Programmer construisent des habitudes (nommage, DRY, outillage) qui se cumulent.
- DDIA et Database Internals expliquent *pourquoi* les systèmes se comportent comme ils le font, réduisant le tâtonnement.
- System Design Interview et Fundamentals of Software Architecture font le lien entre code et architecture.
- Release It traite de la résilience en prod et des modes de défaillance.

---
*Traduit par Claude*
