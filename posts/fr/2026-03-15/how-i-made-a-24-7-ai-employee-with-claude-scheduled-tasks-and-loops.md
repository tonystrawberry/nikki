---
title: "Comment j'ai fait un employé IA 24/7 avec Claude (tâches planifiées et boucles)"
date: "2026-03-15"
excerpt: "Notes sur l'exécution de Claude 24/7 via deux méthodes : /loop dans Claude Code (par intervalle, technique) et Tâches planifiées dans le cloud desktop (sans code, set-and-forget)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ai", "claude", "agents", "automation", "scheduled-tasks", "loops"]
youtubeUrl: "https://www.youtube.com/watch?v=Mf63K5LFivI"
---

## Vue d’ensemble

Claude peut agir comme **agent IA 24/7** qui exécute des tâches pendant que vous dormez : messages du matin, surveillance, rapports de fin de journée. La vidéo présente deux façons d’exécuter Claude à horaire : les **boucles** (technique, dans Claude Code) et les **tâches planifiées** (sans code, dans l’app cloud desktop Claude).

## Méthode 1 : Boucles (Claude Code)

- **Principe :** La commande `/loop` dans Claude Code exécute une tâche à **intervalle** fixe (min. 1 minute, max. 3 jours).
- **Où ça tourne :** Dans ta **session cloud Code**. Tant que ce terminal/session est ouvert, la boucle continue.
- **Cas d’usage :**
  - Vérifier si un déploiement est terminé et faire un retour.
  - Rappels ponctuels (ex. « rappelle-moi à 15 h de pousser la branche de release »).
  - « Dans 45 minutes, vérifie si les tests d’intégration sont passés. »
  - **Surveillance récurrente :** ex. surveiller un canal Slack (ex. « competitor research »), et chaque minute récupérer les nouveaux noms d’entreprises, faire une recherche marque/produit, et afficher une courte analyse dans le chat.
- **Déroulé :** Tu donnes à `/loop` un intervalle et un prompt en langage naturel ; Claude en fait un **job style cron** qui tourne en arrière-plan et peut utiliser des outils (ex. recherche web, Slack) pendant que tu travailles sur autre chose.

## Méthode 2 : Tâches planifiées (Cloud Desktop)

- **Principe :** Tâches **set-and-forget** dans l’**app cloud desktop Claude**. Pas de terminal ni de code.
- **Cas d’usage :**
  - **Briefing matinal quotidien :** « Résume ma boîte des 24 dernières heures en un court briefing matinal avec la date en tête, ~2 min à lire. Enregistre dans le dossier où je tourne. Exécute chaque jour de semaine à 8 h 30. »
  - **Résumé de calendrier :** Lire ton calendrier et résumer les événements du jour.
  - **Mises à jour d’équipe :** Résumer ce qui s’est passé et envoyer un briefing à quelqu’un.
- **Options :** Fréquence (quotidien, jours de semaine uniquement, etc.), heure, emplacement de sortie (ex. enregistrer dans un dossier), modèle (ex. Sonnet). Tu peux « exécuter maintenant » ou attendre l’horaire.

## À retenir

- **Boucles** = co-pilote en session, par intervalle (1 min–3 jours) pour utilisateurs techniques dans Claude Code ; idéal pour déploiements, rappels et vérifications récurrentes (ex. monitoring Slack).
- **Tâches planifiées** = automatisation sans code, style calendrier, dans le cloud desktop ; idéal pour briefings quotidiens, résumés de calendrier et mises à jour d’équipe.
- **Changement de posture :** Utiliser Claude **de façon proactive** avec des plannings et des flux qui tournent 24/7, au lieu d’y aller seulement quand tu as un problème.

---
*Traduit par Claude*
