---
title: "Entretien de System Design : concevoir un agrégateur de clics publicitaires avec un ancien Staff Engineer de Meta"
date: "2026-06-13"
excerpt: "Le déroulé de Hello Interview sur la conception d'un agrégateur de clics publicitaires — flux de conception d'infrastructure, agrégation de flux Kinesis + Flink, chemin de requête Cassandra/OLAP, atténuation des hot shards et réconciliation périodique."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "ad-tech", "kinesis", "flink", "streaming", "cassandra", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=Zcv_899yqhI"
---

Notes de Hello Interview (Evan, ancien staff engineer de Meta) sur la **conception d'un agrégateur de clics publicitaires** — une question de system design courante dans les grandes entreprises, et qu'il a lui-même posée à de nombreuses reprises.

Contrairement aux conceptions de produit (Ticketmaster, Uber, Dropbox), il s'agit ici d'une question de **conception d'infrastructure** : moins centrée sur les API et les entités exposées aux utilisateurs, et davantage sur les pipelines de données et l'analytique.

## Feuille de route de l'entretien

1. **Exigences** (fonctionnelles + non fonctionnelles)
2. **Interface du système et flux de données** (au lieu des entités principales + API)
3. **Conception de haut niveau** (satisfaire les exigences fonctionnelles)
4. **Approfondissements** (satisfaire les exigences non fonctionnelles)

## Ce que fait le système

Les utilisateurs cliquent sur des publicités → sont redirigés vers l'annonceur → les clics sont enregistrés → **les annonceurs interrogent les métriques de clics dans le temps** (efficacité des campagnes, nombre de clics par période, etc.).

Granularité minimale des requêtes : **1 minute** (par ex. la semaine dernière à une résolution horaire, la veille à une résolution à la minute).

## Hypothèses d'échelle

- ~**10 millions de publicités** sur la plateforme à tout instant
- ~**10 000 clics publicitaires/seconde** en pointe

Ces chiffres comptent car ils orientent la scalabilité et la conception de l'agrégation.

## Exigences fonctionnelles

- L'utilisateur clique sur une publicité → **redirigé vers le site web de l'annonceur**
- **Les annonceurs peuvent interroger les métriques de clics dans le temps** pour leurs campagnes

## Exigences non fonctionnelles (spécifiques au contexte)

| Préoccupation | Cadrage pour l'agrégateur de clics publicitaires |
|---------|----------------------------|
| **Scalabilité** | Gérer une pointe de **10K clics/s** |
| **Analytique à faible latence** | Les requêtes des annonceurs renvoient en **< 1 seconde** |
| **Haute intégrité des données** | Ne pas perdre de clics — l'exactitude de la facturation/des paiements en dépend |
| **Quasi temps réel** | Des métriques aussi fraîches que possible dans une **granularité d'1 minute** |
| **Idempotence / sécurité** | Empêcher le spam de clics / le gonflement frauduleux des métriques publicitaires |

## Interface du système et flux de données

**Entrée :** événements de clic depuis les navigateurs des utilisateurs  
**Sortie :** métriques de clics agrégées interrogeables par les annonceurs

Pipeline de haut niveau :

1. L'utilisateur clique sur une publicité → atteint le **service de traitement des clics**
2. **Validation** des données de clic (idempotence / anti-fraude)
3. **Journalisation** des données brutes de clic
4. **Agrégation** sous une forme optimisée pour la lecture
5. Le **service de requête** alimente les tableaux de bord des annonceurs

## Conception de haut niveau (v1 — naïve)

```
Browser → Click Processor → Click DB (Cassandra) → Query Service → Advertiser browser
```

- **Cassandra** est un choix courant en entretien — les écritures de style LSM (memtable en mémoire, flush périodique sur disque) gèrent bien un fort débit d'écriture
- Cassandra est optimisé pour les **recherches par clé (point lookups)**, et non pour les **requêtes par plage et les agrégations** — ce qui est précisément le besoin des annonceurs

**Problème :** interroger les clics bruts sur une semaine à la granularité de la minute implique de scanner/agréger des millions de lignes — trop lent pour respecter l'exigence non fonctionnelle de **< 1 seconde**, même sur Postgres ou DynamoDB.

## Approfondissement : pré-agrégation par batch (Spark)

Ajouter une couche **batch Spark** :

- Un job **map-reduce** périodique lit tous les shards Cassandra
- Agrège les clics par **intervalles d'une minute**
- Écrit les comptes pré-agrégés dans une **base OLAP optimisée pour la lecture** (ou DynamoDB / Postgres pour cette forme de requête plus simple)

Le service de requête lit désormais des seaux (buckets) à la minute pré-agrégés → suffisamment rapide pour les annonceurs.

**Compromis :** l'intervalle du batch ajoute de la latence (par ex. un délai de 5 minutes avant que les métriques n'apparaissent).

## Approfondissement : traitement de flux (Kinesis + Flink)

Remplacer (ou compléter) le chemin d'écriture naïf par un **flux** :

```
Click Processor → Kinesis (click event stream) → Flink (stream aggregator) → Aggregated store → Query Service
```

- **Kinesis** (ou Kafka) contient le flux d'événements de clic
- **Flink** consomme les événements en temps réel et maintient des agrégats en mémoire par fenêtre temporelle (par ex. minute 45, compte = 12)
- Écrit des agrégats glissants dans le magasin de lecture → analytique **quasi temps réel** sans attendre les jobs batch

On peut supposer en entretien que Kinesis/Kafka managés sont toujours disponibles.

## Le problème du hot shard

Une publicité virale (par ex. Nike + LeBron) peut créer un **hot shard** dans Kinesis — une partition submergée par les écritures → latence accrue, voire perte de données.

**Atténuation :** partitionner davantage les données au-delà de la clé par défaut (par ex. clé de partition composite, salting) afin qu'aucun shard ne doive absorber tout le trafic.

## Idempotence et validation des clics

**Problème :** les utilisateurs avec un bloqueur de publicités peuvent extraire l'URL de redirection et éviter d'envoyer l'événement de clic ; les attaquants peuvent spammer de faux clics.

**Approche :**

- Générer un **ID d'impression publicitaire** lorsque la publicité est affichée (reciblage : la même publicité le lundi et le jeudi est suivie séparément)
- Transmettre l'ID d'impression jusqu'au traitement du clic
- Un **cache Redis** stocke les IDs d'impression déjà vus — rejeter les doublons / valider la légitimité du clic avant de le comptabiliser

## Réconciliation périodique

Le chemin flux + Flink n'est ni purement **Lambda** ni purement **Kappa** :

- **Kappa :** tout passe par le traitement de flux en temps réel
- **Lambda :** couche batch + couche temps réel séparée (le temps réel peut être approximatif)

La conception finale ajoute une **réconciliation périodique** :

- Activer Kinesis pour **déverser les événements de clic bruts dans S3**
- Un job batch horaire/quotidien (Spark) retraite les événements bruts
- Corrige toute dérive ou perte du chemin temps réel → garantit l'**intégrité des données** pour la facturation

## Subtilité du flux de redirection

Deux façons de gérer le clic → redirection :

1. **Simple :** rediriger immédiatement, envoyer l'événement de clic en parallèle — les bloqueurs de publicités peuvent contourner l'événement
2. **Mieux :** redirection côté serveur via le service de traitement des clics — garantit que le clic est enregistré avant la redirection (discuter des compromis avec l'examinateur)

## Points clés à retenir

- Les questions de **conception d'infrastructure** utilisent **l'interface du système + le flux de données** au lieu des entités/API
- Le stockage brut des clics seul ne suffit pas à satisfaire des **requêtes analytiques < 1s** à 10K CPS — il faut une **pré-agrégation**
- **Chemin flux :** Kinesis → Flink pour des agrégats à la minute en temps réel
- **Chemin batch :** Spark sur Cassandra/S3 pour le backfill et la réconciliation
- Les **hot shards** dans Kinesis nécessitent une stratégie de partitionnement explicite pour les publicités virales
- L'**idempotence** via des IDs d'impression + déduplication Redis protège l'intégrité des métriques
- Spécifiez les exigences non fonctionnelles avec des **chiffres et un contexte** (10K CPS, granularité d'1 minute, latence de requête < 1s) — pas des buzzwords génériques

---

> 🌐 *Traduit par Claude*
