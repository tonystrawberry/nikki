---
title: "Transactions, ACID et niveaux d'isolation — DDIA chapitre 7 (vidéo)"
date: "2026-04-13"
excerpt: "Parcours en direct du chapitre 7 de DDIA : pourquoi les transactions comptent, ACID, niveaux d'isolation et pièges de nommage, MVCC et vacuum dans Postgres, et undo logs dans MySQL/InnoDB."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "transactions", "acid", "isolation", "postgresql", "mysql", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=AiYvR8yBMaU"
collection: "ddia"
collectionOrder: 7
collectionTitle: "Designing Data-Intensive Applications"
---

## Vue d'ensemble

Une presentation **en direct** du **chapitre 7 (Transactions)** de *Designing Data-Intensive Applications*. Le presentateur (de PlanetScale) explique que les transactions sont centrales pour comprendre pourquoi les bases relationnelles sont si largement utilisees : elles aident a gerer les **lectures et ecritures concurrentes**, les **echecs pendant l'ecriture** et la comprehension de **ce qui a reellement persiste** quand du materiel ou des processus tombent en panne. Le live melange contenu du livre, schemas type tableau blanc et Q&A (par exemple vacuum dans Postgres, replicas).

## Pourquoi les transactions et ACID

- Les **transactions** regroupent des operations pour offrir l'**atomicite** (tout ou rien) et des semantiques d'echec plus claires, pas seulement pour une ligne mais aussi pour des operations multi-instructions.
- **ACID** est souvent associe aux bases relationnelles, mais certaines parties sont **informelles** ; l'intervenant souligne **atomicite, coherence, isolation, durabilite** comme des objectifs recherches dans de nombreux systemes de base de donnees, pas seulement SQL.
- La **durabilite** au sens du chapitre depend des **logs, checksums et flush-to-disk** ; au sens ops plus large, elle recoupe la **replication** (copies multiples, regions, synchrone vs asynchrone) afin que la perte d'un disque ou d'un site n'entraine pas la perte de l'unique copie des donnees.

## Niveaux d'isolation (noms vs semantique)

- SQL definit des **noms** de niveaux d'isolation — **read uncommitted**, **read committed**, **repeatable read**, **serializable** — mais le livre insiste sur le fait que les **implementations divergent** : la meme etiquette ne signifie pas toujours le meme comportement selon les moteurs.
- La discussion va vers ce qui se casse quand l'isolation est trop faible : **phantom reads**, ecrasements inattendus et incoherences quand plusieurs transactions s'entrelacent, d'ou l'importance pour les equipes applicatives de connaitre leur **niveau d'isolation par defaut** et de l'ajuster deliberement.

## Snapshot isolation et MVCC a la Postgres

- La **snapshot isolation** (souvent liee au **MVCC**) signifie qu'une transaction lit depuis un **snapshot coherent** de la base au moment du debut de la transaction (ou de sa premiere lecture), plutot que de voir immediatement chaque commit concurrent.
- Le stream explique le comportement **type Postgres** avec les **versions de lignes** et les **identifiants de transaction** (visibilite min/max) : les mises a jour creent de **nouvelles versions** pendant que d'anciennes transactions continuent de voir les anciennes versions jusqu'a leur fin.
- Les **transactions longues** sont presentees comme couteuses : le systeme peut devoir **conserver de nombreuses anciennes versions** pour un seul snapshot, ce qui augmente la pression sur le **stockage et vacuum** dans les charges OLTP.

## Vacuum, autovacuum et table bloat (Postgres)

- **VACUUM** (dont **autovacuum**) recupere les versions de lignes **obsoletes** quand aucune transaction active n'en a besoin, en marquant l'espace reutilisable sans toujours reecrire toute la table immediatement.
- Les operations type **VACUUM FULL** peuvent **reconstruire** une table pour recuperer l'espace disque de maniere plus agressive, mais peuvent exiger des verrous plus forts, important pour les grosses tables.
- Si les ecritures vont plus vite que vacuum, le **table bloat** augmente : taille disque bien superieure aux donnees "logiques" parce que de nombreuses versions obsoletes restent presentes.

## MySQL / InnoDB : mises a jour in-place et undo log

- Contrairement a Postgres qui cree souvent de nouvelles versions de lignes lors des mises a jour, **InnoDB** fait frequemment des updates **in-place** dans son stockage B-tree, avec des compromis differents concernant le bloat.
- Pour les semantiques de snapshot / **repeatable read**, InnoDB s'appuie sur un **undo log** pour reconstruire d'**anciennes images de lignes** pour les transactions demarrees plus tot ; la snapshot isolation ne depend donc pas de la conservation de duplicatas complets de lignes sur la page principale a chaque changement.

## Points cles

- **Transactions et isolation** sont des leviers concrets : de mauvaises hypotheses provoquent des bugs subtils sous concurrence.
- Les **noms des niveaux d'isolation** sont normalises en theorie, mais **pas portables en comportement** — il faut verifier la documentation de son moteur.
- **MVCC** (Postgres) et **undo logs** (InnoDB) sont deux approches pour fournir des lectures de type **snapshot** pendant que les ecritures continuent.
- Le **suivi operationnel** est essentiel : **vacuum/autovacuum**, **transactions longues** et **volume d'ecriture** interagissent avec la **croissance disque et les performances**.

---
> 🌐 *Traduit par Claude*
