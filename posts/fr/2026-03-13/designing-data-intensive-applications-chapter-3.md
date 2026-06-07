---
title: "Designing Data-Intensive Applications : Chapitre 3"
date: "2026-03-13"
excerpt: "Parcours en livestream du chapitre 3 de DDIA -- explications visuelles du stockage en lignes vs en colonnes, B-trees vs LSM trees, et pourquoi les bases de donnees OLTP et OLAP sont concues differemment."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["databases", "ddia", "storage-engines", "b-trees", "lsm-trees"]
youtubeUrl: "https://www.youtube.com/watch?v=LHWgQn8F7tU"
collection: "ddia"
collectionOrder: 3
collectionTitle: "Designing Data-Intensive Applications"
---

## Vue d'ensemble

Un parcours en livestream du chapitre 3 de DDIA : Storage and Retrieval. Le presentateur dessine des diagrammes et explique comment les bases de donnees stockent et recuperent les donnees au niveau du disque, en se concentrant sur deux themes principaux : les bases OLTP vs OLAP et comment leurs differents modeles d'acces menent a des organisations de stockage fondamentalement differentes.

## OLTP vs OLAP : deux mondes differents

**OLTP (Online Transaction Processing) :**
- Alimente les applications web -- MySQL, Postgres, SQLite, Oracle
- Transactions courtes et rapides (sous la milliseconde)
- Principalement des lectures (80-90 %), moins d'ecritures (10-20 %)
- Les requetes recuperent un petit nombre de lignes par cle (par ex. `SELECT * FROM users WHERE id = 2`)
- Bases de donnees : MySQL, Postgres, SQLite

**OLAP (Online Analytical Processing) :**
- Alimente la business intelligence et l'analytique
- Parcourt de grandes quantites de donnees ("tous les produits vendus cette annee", "tendances utilisateurs sur 6 mois")
- Les requetes prennent plus de temps, et c'est acceptable -- elles ne sont pas exposees aux utilisateurs
- Les donnees sont extraites des bases OLTP via ETL (Extract-Transform-Load) vers un entrepot de donnees dedie

**Pourquoi les separer ?** Executer de lourds parcours analytiques sur une base OLTP provoquerait du cache thrashing et ralentirait l'application pour les utilisateurs finaux.

## Stockage oriente lignes (OLTP)

Dans les bases OLTP, les donnees sont stockees **par ligne** sur le disque :

```
[ID:1, Ben, ben@hi.com, 1234 Fifth St] [ID:2, Zed, zed@mail.com, 5678 Oak Ave] [ID:3, Ally, ...]
```

Cette organisation est optimale lorsque les requetes typiquement :
- Selectionnent une seule ligne ou un petit ensemble de lignes
- Ont besoin de toutes ou de la plupart des colonnes de ces lignes
- Accedent aux donnees par cle primaire

Puisque toutes les colonnes d'une ligne sont physiquement adjacentes sur le disque, une seule lecture de page vous donne tout ce dont vous avez besoin pour cette ligne.

## B-Trees : l'index OLTP

Les B-trees sont la structure d'indexation dominante dans les bases OLTP :
- Les noeuds sont dimensionnes pour correspondre a la taille des pages disque (generalement 4 Ko)
- Chaque noeud contient plusieurs paires cle-valeur -- efficace pour les E/S disque puisque les lectures se font par blocs de la taille d'une page
- La recherche traverse de la racine a la feuille, en lisant une page par niveau

**Implementation MySQL vs Postgres :**
- MySQL (InnoDB) : stocke les donnees reelles des lignes dans les noeuds feuilles du B-tree (clustered index)
- Postgres : stocke les donnees des lignes dans un "heap file" (un grand tableau de pages), et les index B-tree contiennent des pointeurs vers ce heap file
- Les deux supportent des index B-tree secondaires

**Compromis :** les B-trees laissent de l'espace vide dans les noeuds pour les insertions futures, et les ecritures aleatoires necessitent de traverser les noeuds parents. Excellent pour les charges de travail generalistes, mais pas optimal pour les ecritures sequentielles a haut volume.

## Stockage oriente colonnes (OLAP)

Dans les bases OLAP, les donnees sont stockees **par colonne** :

```
Names:     [Ben, Zed, Ally, ...]
Emails:    [ben@hi.com, zed@mail.com, ally@x.com, ...]
Addresses: [1234 Fifth St, 5678 Oak Ave, ...]
```

**Pourquoi c'est important pour l'analytique :**
- Les requetes analytiques parcourent generalement de nombreuses lignes mais n'ont besoin que de quelques colonnes (par ex. `SELECT AVG(price) FROM sales WHERE date > '2025-01-01'`)
- Avec le stockage en lignes, vous chargeriez chaque colonne de chaque ligne -- des E/S gaspillees
- Avec le stockage en colonnes, vous ne lisez que les colonnes dont la requete a reellement besoin

**Ordre des colonnes :** les lignes doivent etre dans le meme ordre dans tous les fichiers de colonnes afin de pouvoir reconstituer quelles valeurs vont ensemble.

## Compression de colonnes

Les colonnes sont hautement compressibles car elles contiennent des donnees repetitives :
- Des milliers d'utilisateurs partagent le meme nom
- Les emails partagent des sous-chaines communes (`@gmail.com` apparait des millions de fois)
- Les dates se repetent frequemment (de nombreux evenements le meme jour)

Les techniques incluent le bitmap encoding et le run-length encoding. La compression reduit la taille du stockage et accelere les requetes en reduisant les E/S -- particulierement important puisque les bases OLAP peuvent atteindre des petaoctets de donnees historiques.

## LSM Trees : optimisees pour l'ecriture

Les LSM trees (Log-Structured Merge Trees) sont concues pour les charges de travail a haut debit d'ecriture :
- Flux d'evenements de clics, ingestion de logs, collecte de metriques
- Donnees sequentielles continues a rythme eleve

**En quoi elles different des B-trees :**
- Les B-trees mettent a jour les pages en place et laissent de l'espace vide pour les ecritures futures -- adapte aux charges en lecture
- Les LSM trees mettent les ecritures en tampon en memoire et ecrivent des segments tries sur le disque, puis les fusionnent en arriere-plan -- bien meilleur debit d'ecriture

**Utilisees par :** Cassandra, ClickHouse, RocksDB, LevelDB

**Compromis :** les B-trees offrent une latence de lecture plus previsible ; les LSM trees offrent un meilleur debit d'ecriture mais les lectures peuvent necessiter de verifier plusieurs structures.

## La base de donnees la plus simple

Le chapitre commence par une experience de pensee amusante : on peut construire une base de donnees cle-valeur fonctionnelle en 6 lignes de bash -- ajouter des paires cle-valeur dans un fichier en ecriture, faire un grep pour la lecture. Ca fonctionne, mais cela illustre pourquoi les vraies bases de donnees font des millions de lignes de code : cette approche a des lectures en O(n), pas de support transactionnel, pas de gestion de la concurrence, et aucune garantie de durabilite.

## Points cles a retenir

- Les bases OLTP et OLAP existent parce que leurs modeles d'acces sont fondamentalement differents -- n'executez pas d'analytique sur votre base de production
- Le stockage en lignes regroupe toutes les colonnes d'une ligne ensemble -- optimal pour recuperer des enregistrements individuels
- Le stockage en colonnes regroupe toutes les valeurs d'une colonne ensemble -- optimal pour parcourir et agreger de grands ensembles de donnees
- Les B-trees sont le pilier de l'indexation OLTP, dimensionnes pour correspondre aux pages disque pour des E/S efficaces
- Les LSM trees echangent la latence de lecture contre le debit d'ecriture, ce qui les rend ideales pour les charges a forte ingestion
- La compression de colonnes (bitmap encoding, run-length encoding) est essentielle pour les bases OLAP qui peuvent atteindre l'echelle du petaoctet

---
*Traduit par Claude*
