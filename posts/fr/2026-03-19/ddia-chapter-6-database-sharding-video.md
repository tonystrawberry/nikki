---
title: "Database Sharding ! Designing Data-Intensive Applications Chapitre 6"
date: "2026-03-19"
excerpt: "Vidéo sur DDIA Chapitre 6 (partitionnement/sharding) : explications et schémas sur key-range vs hash, index secondaires, rebalancing et routage des requêtes."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "partitioning", "sharding", "distributed-systems", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=iR07_nnzvQg"
collection: "ddia"
collectionOrder: 6
collectionTitle: "Designing Data-Intensive Applications"
---

## Aperçu

Une vidéo sur le **chapitre 6 (Partitionnement)** de *Designing Data-Intensive Applications*. L'auteur utilise des schémas pour expliquer le partitionnement (souvent appelé sharding) : répartir les données sur plusieurs machines. Le livre parle de « partitioning » pour la distribution ; en pratique on parle souvent de « sharding ».

## Sujets abordés

- **Partitionnement vs sharding :** Même concept — le partitionnement peut signifier diviser des tables sur un disque ou distribuer les données ; ici c'est la distribution.
- **Stratégies de partitionnement :** Key-range (ex. A–M, N–Z) vs hash ; compromis entre requêtes par plage et charge équilibrée.
- **Index secondaires :** Index locaux (scatter-gather) vs globaux avec données partitionnées.
- **Rebalancing :** Déplacer les partitions lors de l'ajout/suppression de nœuds ; partitions fixes, partitionnement dynamique, proportionnel.
- **Routage des requêtes :** Comment les clients trouvent le bon nœud pour une clé (tier de routage, gossip, ou métadonnées côté client).

## Points clés

- Le partitionnement (sharding) fait monter le débit d'écriture et le stockage au-delà d'une machine ; il est utilisé avec la réplication.
- Le partitionnement par hash évite les hot spots mais perd les scans par plage efficaces ; le key-range fait l'inverse.
- Les index secondaires avec partitionnement nécessitent soit scatter-gather (index local) soit des écritures plus complexes (index global).
- Le rebalancing doit limiter le déplacement de données et éviter les points de défaillance uniques.

---
*Traduit par Claude*
