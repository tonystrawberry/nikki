---
title: "DDIA Chapitre 12 : L'avenir des systèmes de données"
date: "2026-06-04"
excerpt: "Notes sur le chapitre final de DDIA — intégration du batch et du stream processing, découplage des bases de données, exactitude de bout en bout, et l'éthique des systèmes data-intensive. Lecture en cours."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "data-integration", "ethics"]
collection: "ddia"
collectionOrder: 12
collectionTitle: "Designing Data-Intensive Applications"
---

*Lecture en cours — commencée le 2026-06-04, à reprendre.*

Le chapitre 12 de *Designing Data-Intensive Applications* est le chapitre de clôture. Après dix chapitres sur les fondations et deux sur le batch et le stream processing, il prend du recul et se demande : **comment toutes ces pièces s'assemblent-elles, et où vont les systèmes data-intensive ?**

## Intégration des données : combiner des outils spécialisés

Les systèmes modernes utilisent rarement une seule base de données pour tout. Les équipes combinent des bases OLTP, des index de recherche, des caches, des entrepôts de données, des stream processors et des pipelines ML — chacun optimisé pour un rôle.

Le problème difficile est de **maintenir la cohérence des datasets dérivés** lorsque la source de vérité change. Les patterns des chapitres précédents réapparaissent :

- **Change Data Capture (CDC)** du ch. 11
- **Event sourcing** et logs immuables
- **Pipelines batch** pour le backfill et l'analytics
- **Stream processing** pour des mises à jour quasi temps réel

Le chapitre plaide pour penser en termes de **dataflows** — comment les données se déplacent et se transforment à travers les systèmes — plutôt qu'en composants isolés.

## Découpler la base de données

Les bases de données traditionnelles regroupent stockage, indexation, langage de requête, réplication et traitement transactionnel dans un seul produit.

La tendance est au **découplage (unbundling)** : utiliser le store spécialisé adapté à chaque pattern d'accès (documents, graphes, séries temporelles, recherche) et les connecter via des streams et des jobs batch.

Compromis :

- Plus de flexibilité et de meilleures performances par cas d'usage
- Plus de complexité opérationnelle — vous possédez la couche d'intégration
- Besoin de conventions solides pour les schémas, la lineage et l'exactitude

## Batch et stream processing : deux faces d'une même pièce

Les ch. 10 (batch) et 11 (stream) semblaient différents. Le ch. 12 les unifie :

- Les deux traitent des **données dérivées** à partir d'un log ou dataset immuable
- **Stream** = faible latence, continu ; **batch** = haut débit, replay depuis l'historique
- Les moteurs modernes (Flink, Spark Structured Streaming, Kafka) estompent la frontière — même log, modes de consommation différents

**Kappa** vs **Lambda** revisités : l'objectif est un pipeline logique unique lorsque c'est possible, pas deux codebases divergentes.

## Concevoir pour l'exactitude

Les systèmes distribués rendent l'**exactitude** subtile. Idées clés :

### Intégrité de bout en bout

Les composants individuels peuvent être corrects, mais le **système dans son ensemble** peut quand même perdre ou dupliquer des données. Les corrections exigent de penser sur l'ensemble du pipeline :

- **Écritures idempotentes** (ch. 11, message queues)
- **Sémantique exactly-once** là où c'est réalisable (souvent via idempotence + déduplication, pas par magie)
- **Transactional outbox** et **CDC** pour une propagation fiable

### Contraintes et coordination

Quand vous avez besoin de garanties plus fortes (unicité, clés étrangères entre services), vous avez besoin de **coordination** — locks, leases ou consensus (renvoie au ch. 9 sur la cohérence et le consensus).

Le chapitre met en garde : la coordination a un **coût** (latence, disponibilité). Ne l'utilisez que là où le métier en a réellement besoin.

### Actualité et intégrité

**Intégrité** = pas de corruption, pas de perte de données. **Actualité (timeliness)** = les données sont suffisamment fraîches pour le cas d'usage.

Ce sont des dimensions indépendantes — vous pouvez avoir des données correctes mais obsolètes, ou fraîches mais fausses. Concevez explicitement pour les deux.

## Données dérivées et conception applicative

Les applications devraient traiter leur base de données comme un **cache d'état dérivé** à partir d'un event log ou d'une source de vérité en amont — pas toujours comme l'autorité ultime.

Cette mentalité aide quand :

- Reconstruire des index après des bugs
- Ajouter de nouveaux read models (style CQRS)
- Migrer des systèmes de stockage

## Charge et coordination des dataflows

Les pipelines complexes ont besoin de **scheduling**, **backpressure** et **monitoring** à travers les étapes. Une panne à l'étape 7 sur 10 ne devrait pas corrompre silencieusement les consommateurs en aval.

Préoccupations opérationnelles : évolution de schéma entre les étapes du pipeline, replay après corrections, et tests des sorties dérivées contre les événements source.

## Éthique et avenir

Les dernières sections se tournent vers les **conséquences humaines** :

- **Analytics prédictifs** et données comportementales — boucles de rétroaction qui façonnent le comportement des utilisateurs
- **Vie privée** — consentement, minimisation des données, droit à l'effacement vs logs immuables
- **Responsabilité algorithmique** — qui est responsable quand des systèmes automatisés nuisent aux utilisateurs ?
- **Données comme fossé concurrentiel** — concentration du pouvoir des données entre quelques plateformes

Kleppmann conclut en rappelant : les ingénieurs construisent des systèmes qui affectent de vraies personnes. L'excellence technique sans réflexion éthique est incomplète.

## Points clés (brouillon — lecture en cours)

- **L'intégration des données** est le défi central des architectures modernes — pas le choix d'une seule base
- **Découpler** stockage/requête/indexation ; **intégrer** via logs, CDC, batch et stream
- Batch et stream sont des **modes complémentaires** sur les mêmes données immuables
- **L'exactitude de bout en bout** exige idempotence, livraison fiable et une vision pipeline entier
- **Intégrité** et **actualité** sont des dimensions séparées — concevez explicitement pour les deux
- **L'avenir** inclut plus d'outils spécialisés *et* plus de responsabilité sur l'usage des données

---

*À mettre à jour après la fin du chapitre.*

---
*Traduit par Claude*
