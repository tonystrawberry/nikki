---
title: "Designing Data-Intensive Applications: Chapter 5"
date: "2026-03-16"
excerpt: "Notes d'un live stream sur le chapitre 5 de DDIA (Réplication) : single-leader, primary et read replicas, scaling des lectures, haute disponibilité et availability zones."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "replication", "distributed-systems", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=lYCFreB8w_w"
---

## Vue d'ensemble

Un live qui parcourt le **chapitre 5 (Réplication)** de *Designing Data-Intensive Applications*. L'animateur utilise des schémas (ex. Excalidraw) pour expliquer la réplication single-leader, pourquoi l'utiliser et comment elle s'intègre dans le cloud. Le livre est recommandé comme référence de haut niveau pour les systèmes de données ; on peut aller directement au chapitre utile (ex. réplication).

## Réplication single-leader (primary–replica)

- **Setup :** Un nœud **primary** accepte toutes les écritures ; un ou plusieurs **replicas** (followers) reçoivent un flux de changements et restent à jour. La terminologie varie (primary/replica, master/slave, etc.).
- **Trafic :** Toutes les écritures vont au primary. Les replicas sont **read-only** ; le trafic de lecture peut leur être envoyé depuis les serveurs d'app. Cela correspond à beaucoup de charges où la majorité des requêtes sont des lectures (ex. chargement de profil, timeline).
- **Scaling des lectures :** Quand le trafic augmente, on peut ajouter des replicas sans arrêter le primary ni perturber les replicas existants. Cela scale bien la capacité de lecture jusqu'à devoir distribuer les données (sharding/partitioning).

## Pourquoi répliquer ?

- **Capacité de lecture :** Répartir la charge de lecture sur les replicas pour que le primary ne soit pas le goulot d'étranglement.
- **Disponibilité (souvent prioritaire) :** Dans le cloud, les instances sont éphémères — elles peuvent tomber, être décommissionnées ou perdre la connectivité réseau. Perdre un nœud ne serait-ce que 60 secondes peut être inacceptable. Avec un primary et au moins un replica (deux c'est mieux), on peut basculer si le primary est perdu.
- **Placement :** Primary et replicas sont en général répartis sur plusieurs **availability zones** (AZ) dans une région (ex. US East 1, US West 1). Chaque AZ est dans la même région mais dans un bâtiment séparé ; les fournisseurs visent à ce que plusieurs AZ ne tombent pas en même temps (alimentation, liens réseau différents, etc.). Répartir les nœuds sur les AZ améliore la tolérance aux pannes.

## À retenir

- La réplication single-leader est le schéma standard avant d'avoir besoin de sharding/partitioning ; c'est ce que beaucoup de BDD managées (ex. PlanetScale) proposent par défaut (ex. primary + deux replicas).
- La réplication apporte à la fois **scaling des lectures** et **haute disponibilité** ; la seconde est souvent la plus critique en production.
- Comprendre régions et availability zones aide pour placer primary et replicas dans le cloud.

---
*Traduit par Claude*
