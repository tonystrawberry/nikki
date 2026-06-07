---
title: "Jour 2"
date: "2026-03-12"
excerpt: "Mise en place de Keystatic CMS, correction des redirections i18n, découverte d'astuces Rails et Claude Code, et lecture du chapitre 2 de DDIA."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "keystatic", "cms", "nextjs", "i18n", "rails", "claude-code", "ddia", "databases"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- ajouté Keystatic au projet pour gérer les articles de blog. C'est un CMS headless qui permet de gérer les articles depuis un emplacement centralisé. Je ne suis pas sûr de l'utiliser car il n'y a pas encore d'intégration IA.
- corrigé un problème de redirection lors de la consultation d'un article dans une langue différente de celle dans laquelle il a été rédigé.
- appris le concept d'**ingénierie composée** — la pratique consistant à apporter de petites améliorations régulières qui s'accumulent pour produire des gains significatifs au fil du temps, comme les intérêts composés. Chaque amélioration s'appuie sur la précédente, de sorte que la valeur croît de manière exponentielle plutôt que linéaire.
- regardé [How a Meta Staff Engineer Uses Claude Code](https://www.youtube.com/watch?v=mZzhfPle9QU) par John Kim — 50 astuces pour passer du codage manuel à l'orchestration agentique avec Claude Code. J'ai rédigé [mes notes](/fr/posts/how-a-meta-staff-engineer-use-claude-code) à ce sujet.
- appris qu'en Rails, les colonnes utilisées avec `dependent: :nullify` lors de la destruction doivent avoir un index en base de données pour accélérer les requêtes qui mettent à jour ces lignes. Par exemple, si un `User` a plusieurs `comments` avec `dependent: :nullify`, la destruction d'un utilisateur exécute `UPDATE comments SET user_id = NULL WHERE user_id = ?` — sans index sur `comments.user_id`, cela déclenche un parcours complet de la table
- appris que placer des fichiers `CLAUDE.md` dans des sous-répertoires spécifiques plutôt qu'uniquement à la racine permet d'économiser des tokens — les règles qui ne s'appliquent qu'à un sous-ensemble de fichiers (par ex. `app/controllers/CLAUDE.md` pour les patterns de validation des paramètres ou la convention de commentaire spécifiant l'opération HTTP et le chemin au-dessus de chaque méthode) ne sont chargées que lorsque Claude travaille dans ce dossier
- eu une journée difficile — trop d'erreurs faciles, surtout du code qui ne correspondait pas aux spécifications. Demain ira mieux
- lu le chapitre 2 de *Designing Data-Intensive Applications* — modèles de données et langages de requêtes. J'ai rédigé [mes notes](/fr/posts/ddia-chapter-2-data-models-and-query-languages) à ce sujet

---
> 🌐 *Traduit par Claude*
