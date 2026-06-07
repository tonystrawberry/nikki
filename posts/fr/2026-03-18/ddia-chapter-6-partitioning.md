---
title: "DDIA Chapitre 6 : Partitionnement"
date: "2026-03-18"
excerpt: "Résumé du chapitre de Kleppmann sur le partitionnement (sharding) : répartition des données, stratégies, index secondaires, rééquilibrage et routage des requêtes."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "partitioning", "sharding", "distributed-systems"]
collection: "ddia"
collectionOrder: 6
collectionTitle: "Designing Data-Intensive Applications"
---

## Vue d'ensemble

Le chapitre 6 de *Designing Data-Intensive Applications* traite du **partitionnement** (sharding) : découper un jeu de données en morceaux plus petits et les répartir sur plusieurs nœuds. Le partitionnement s'utilise avec la réplication — chaque partition peut être répliquée pour la tolérance aux pannes. L'objectif est de faire évoluer le débit d'écriture et le stockage au-delà d'une seule machine.

## Partitionnement des données clé-valeur

- **Partitionnement par plage de clés :** affecter des plages contiguës de clés (ex. A–M, N–Z) aux nœuds. Simple et permet des scans de plage efficaces. Risque : **points chauds** si l'accès n'est pas uniforme (ex. tout le trafic sur les clés commençant par « A »).
- **Partitionnement par hash de la clé :** hasher la clé et affecter par plage de hash. Répartit bien les données et évite les points chauds liés à l'ordre lexicographique. Inconvénient : les **requêtes de plage** ne sont plus efficaces — il faut interroger chaque partition.
- **Hybride :** utiliser une clé composée (ex. hash(user_id) + timestamp) pour partitionner par hash tout en gardant un ordre dans la partition pour les scans de plage sur la deuxième partie.

## Partitionnement et index secondaires

Les index secondaires (ex. « trouver tous les posts par utilisateur X ») ne se mappent pas proprement aux partitions. Deux approches principales :

- **Index local (document) :** chaque partition maintient son propre index secondaire sur ses données uniquement. Une requête par clé secondaire doit faire du **scatter-gather** : envoyer la requête à toutes les partitions et fusionner les résultats. Simple mais coûteux en lecture.
- **Index global :** un seul index secondaire est lui-même partitionné (ex. par clé d'index). Une lecture va vers une partition de l'index ; une écriture peut devoir mettre à jour plusieurs partitions d'index si le document est dans une partition et l'entrée d'index dans une autre. Écritures plus complexes, lectures ciblées.

## Rééquilibrage

Lorsqu'on ajoute ou retire des nœuds, les données doivent être déplacées pour répartir les partitions.

- **Pourquoi c'est difficile :** déplacer des données est coûteux ; on veut minimiser le volume déplacé et éviter de surcharger les nœuds ou provoquer des indisponibilités.
- **Stratégies :** (1) **Nombre fixe de partitions** — plus de partitions que de nœuds ; à l'ajout d'un nœud, lui affecter un sous-ensemble de partitions existantes. Simple mais le nombre de partitions est fixé à la création. (2) **Partitionnement dynamique** — les partitions se divisent quand elles deviennent trop grandes (comme LSM/SSTables). (3) **Partition proportionnelle aux nœuds** — nombre de partitions = nombre de nœuds ; quand la taille du cluster change, split/merge. Utilisé dans certains systèmes (ex. Cassandra).
- **Opérations :** rééquilibrage automatique ou manuel ; éviter qu'un seul nœud décide (point de défaillance unique). On peut utiliser un protocole de consensus (ex. Raft) pour affecter les partitions.

## Routage des requêtes

Quand un client veut lire ou écrire une clé, comment sait-il à quel nœud s'adresser ?

- **N'importe quel nœud peut router :** le nœud contacté transfère la requête vers la bonne partition. Les clients peuvent parler à n'importe quel nœud. Les nœuds connaissent l'affectation (ex. via un coordinateur comme ZooKeeper).
- **Couche de routage :** une couche séparée (load balancer, proxy ou client cluster-aware) connaît l'affectation des partitions et route les requêtes.
- **Le client connaît l'affectation :** le client apprend la carte des partitions (ex. depuis un coordinateur) et parle directement au bon nœud. Moins de sauts mais les clients doivent rester à jour.

Beaucoup de systèmes utilisent un **service d'annuaire** (ex. etcd, ZooKeeper) qui stocke le mapping partition → nœud ; les nœuds ou clients s'abonnent aux changements.

## Points clés

- Le **partitionnement** permet de faire évoluer le stockage et le débit d'écriture en répartissant les données ; il est souvent combiné à la réplication.
- Le partitionnement par **plage de clés** permet les requêtes de plage mais peut créer des points chauds ; le partitionnement par **hash** répartit la charge mais perd les scans de plage efficaces.
- Les **index secondaires** imposent un choix : index locaux (lectures scatter-gather) ou index globaux (lectures ciblées, écritures plus complexes).
- Le **rééquilibrage** doit être fait avec soin (partitions fixes, dynamiques ou proportionnelles) ; minimiser le déplacement de données et éviter les points de défaillance uniques.
- Le **routage des requêtes** nécessite une vue cohérente de quelle partition est sur quel nœud — via un annuaire, une couche de routage ou une affectation côté client.

---
> 🌐 *Traduit par Claude*
