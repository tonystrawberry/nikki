---
title: "Entretien de System Design : concevoir Uber avec un ex-Staff Engineer de Meta"
date: "2026-06-07"
excerpt: "Le tutoriel de Hello Interview pour concevoir Uber — le plus difficile des problèmes de recherche de proximité — couvrant l'indexation géospatiale par quad tree, la maîtrise du débit des mises à jour de position et un matching de chauffeurs cohérent."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "uber", "geospatial", "quadtree", "postgis", "dynamodb", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=lsKU38RKQSo"
---

La deuxième entrée de la série de system design de Hello Interview (après Design Ticketmaster), animée par un ex-Staff Engineer et recruteur de Meta. Concevoir Uber est présenté comme **le plus difficile des problèmes de recherche de proximité** — réussissez-le et vous saurez gérer Find My Friends, Yelp et leurs semblables — et il est très fréquemment posé chez Tesla, Google et Meta.

La vidéo suit une feuille de route réutilisable pour n'importe quel system design orienté utilisateur : **exigences → entités principales → API → conception générale → approfondissements**, en visant à atteindre la conception générale en ~15 minutes pour garder du temps pour les approfondissements à la fin.

## Exigences

- **Fonctionnelles** (les fonctionnalités) : les passagers peuvent saisir une destination et obtenir une estimation du tarif ; les passagers peuvent demander une course et être mis en relation avec un chauffeur à proximité ; les chauffeurs peuvent accepter/refuser et rejoindre le passager.
- **Non fonctionnelles** (les qualités) : matching à faible latence (idéalement sous ~1 minute), débit élevé pour les mises à jour constantes de position des chauffeurs, forte cohérence pour le matching (pas de double réservation) et haute disponibilité.

## Entités principales

Plutôt qu'un schéma complet à ce stade, esquissez les objets qui seront persistés (en gros une correspondance un pour un avec les tables/collections) :

- **Rider** (passager)
- **Driver** (chauffeur) — avec ses métadonnées (voiture, plaque d'immatriculation, photo) et un **statut** : `available`, `in_ride` ou `offline`.
- **Ride** (course)
- **Location** (position) — contient la position la plus à jour de chaque chauffeur, afin que le matching puisse faire des requêtes par proximité.

## API

Des endpoints REST dérivés des entités et des exigences fonctionnelles (estimation de tarif, demande de course, acceptation de course, mise à jour de position), avec une authentification via un token JWT/de session dans l'en-tête de la requête.

## Conception générale

Faites passer chaque API à travers le système :

- Un **Ride Matching Service** trouve les chauffeurs à proximité, filtre sur le statut `available` et leur demande un par un d'accepter.
- Un **Location Service + Location DB** ingère les pings fréquents de position des chauffeurs et répond aux requêtes de proximité.
- Un **Notification Service** (traité comme une boîte noire — c'est en soi une question d'entretien) envoie aux chauffeurs des invites « accepter cette course ? » via les notifications push natives (APNs / Firebase). À l'acceptation, l'app du chauffeur rappelle le service pour confirmer le matching.

## Approfondissements

### Indexation géospatiale (quad tree / PostGIS)

Une approche naïve « parcourir tous les chauffeurs et calculer la distance » est bien trop lente. Introduisez un **index géospatial** — un **quad tree** — qui découpe récursivement la carte en quatre régions jusqu'à ce que chaque cellule contienne moins d'un certain nombre K de chauffeurs. Cela rend les requêtes de proximité efficaces. Avec Postgres, vous obtenez cela grâce à l'extension **PostGIS**.

### Maîtriser le débit des mises à jour de position

Les pings constants de chaque chauffeur peuvent atteindre quelque chose comme **~600K TPS**, ce qui est du gaspillage. Utilisez des **mises à jour de position dynamiques** : faites en sorte que l'app du chauffeur fasse varier sa fréquence de mise à jour selon le contexte — la vitesse, le fait que la voiture soit garée (aucun mouvement → aucune mise à jour) et la proximité des demandes de course / des zones chaudes (moins de précision nécessaire en pleine cambrousse). Cela peut réduire drastiquement la charge d'écriture.

### Cohérence du matching

Deux invariants : aucun chauffeur ne reçoit plus d'une course, et aucune course n'est attribuée à plus d'un chauffeur. On résout cela avec un **verrou sur le chauffeur** pendant qu'un matching est en attente. Une option élégante est **DynamoDB** (peu de relations, haute disponibilité, bonne scalabilité) avec une **table de verrous de chauffeurs** utilisant un **TTL** sur les lignes pour que les verrous périmés expirent automatiquement — en réutilisant la même base de données comme verrou plutôt que d'ajouter une instance Redis séparée.

## Points clés à retenir

- **Suivez la feuille de route** : exigences → entités → API → conception générale → approfondissements ; gérez votre temps pour que les approfondissements reçoivent une vraie attention.
- **Modélisez une entité Location** séparée de Driver pour que le matching par proximité reste rapide.
- **Quad tree + PostGIS** est la réponse standard pour la recherche géospatiale/de proximité.
- **Les mises à jour de position dynamiques et contextuelles** sont le levier pour réduire le débit d'écriture.
- **Verrouillez le chauffeur (par exemple DynamoDB avec TTL)** pour garder un matching cohérent sans double réservation.
- Le même schéma de recherche de proximité se généralise à Find My Friends, Yelp et consorts.

---

> 🌐 *Traduit par Claude*
