---
title: "Jour 64"
date: "2026-08-18"
excerpt: "Reprise du freelance chez Spacely, plongée dans le GVL et rack-mini-profiler, et prise de conscience de tout le « magic » Rails qu'il me reste à apprendre."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "spacely", "freelance", "career", "ruby", "gvl", "concurrency", "rack-mini-profiler", "performance", "rails", "learning"]
coverImage: ""
---

## Aujourd'hui, j'ai :

- repris le travail pour Spacely en freelance — j'ai bien reposé, mais il était temps de revenir
- révisé le GVL (Global VM Lock) — MRI n'exécute qu'un seul thread de code Ruby à la fois, mais libère le GVL pendant les I/O bloquants (DB, HTTP, disque), donc dans une app Rails très orientée I/O, plusieurs threads peuvent quand même attendre l'I/O en parallèle ; le travail CPU-bound reste sérialisé sauf si on scale avec des processus
- utilisé rack-mini-profiler sur un projet — vraiment utile pour le timing des requêtes, le SQL et le détail des rendus jbuilder en local Rails ; j'avais l'habitude d'aller chercher Datadog pour ce genre de données, mais c'est bien plus pratique en développement
- réalisé que je comptais trop sur le « magic » de Ruby et Ruby on Rails — des parties comme `ActiveSupport::Concern` restaient un mystère ; au travail, c'était surtout livrer des features plutôt que creuser le langage et le framework, donc j'ai décidé de passer un peu de temps chaque jour à en apprendre plus en discutant avec un LLM, en lisant des articles et le code source

---

> 🌐 *Traduit par Claude*
