---
title: "DDIA Chapitre 11 : Stream Processing"
date: "2026-06-02"
excerpt: "Notes sur le stream processing dans Designing Data-Intensive Applications — flux d'événements, brokers, CDC, event sourcing, sémantique du temps, stream joins et tolérance aux pannes."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "stream-processing", "kafka", "event-sourcing"]
collection: "ddia"
collectionOrder: 11
collectionTitle: "Designing Data-Intensive Applications"
---

Le chapitre 11 de *Designing Data-Intensive Applications* fait suite au batch. Si le batch répond à « que s'est-il passé sur ce gigantesque dataset ? », le **stream processing** demande « que se passe-t-il *maintenant*, au fil des événements ? »

## Où se situe le stream processing

Modèle à trois systèmes du chapitre 10 :

- **Services (online) :** latence en millisecondes
- **Batch (offline) :** latence en minutes ou heures
- **Stream (near-real-time) :** latence en secondes

Le stream processing relie « quelque chose s'est passé » et « réagir bientôt ».

## Événements et flux d'événements

Un **événement** est un petit enregistrement immuable d'un fait passé — page vue, capteur, paiement.

Les événements diffèrent des **commandes** et de l'**état**. Un **flux d'événements** est une séquence non bornée, généralement ordonnée dans le temps.

L'encodage compte : JSON est simple ; Avro, Protobuf et les schema registries aident l'évolution.

## Message brokers et logs

**Message brokers** (RabbitMQ, Kafka, Pulsar) découplent producteurs et consommateurs.

| Modèle | Comportement | Exemples |
|--------|--------------|----------|
| **Queue (AMQP/JMS)** | Message supprimé après ack ; load-balancing | RabbitMQ, SQS |
| **Log (Kafka)** | Messages conservés ; offset ; replay | Kafka, Pulsar |

**Logs partitionnés** pour le débit. Astuces : batching, écritures séquentielles append-only, zero-copy.

Patterns : load balancing vs fan-out. At-least-once courant ; consommateurs idempotents.

## Bases de données et streams

**Le WAL d'une base est déjà un flux d'événements.**

### Change Data Capture (CDC)

**CDC** transforme les changements de lignes en flux d'événements. Debezium tail le log de transactions.

Cas d'usage : invalidation de cache, index de recherche, réplicas, analytics.

### Event sourcing

Stocker la **séquence d'événements** plutôt que l'état courant. L'état se dérive par replay.

Avantages : audit, requêtes temporelles, évolution, immutabilité.

Inconvénients : évolution de schéma difficile, replay lent sans snapshots, suppression awkward.

## Usages du stream processing

- **CEP :** détecter des motifs
- **Analytics sur flux :** comptages glissants, percentiles
- **Vues matérialisées** incrémentales
- **Mise à jour d'index** (Elasticsearch)
- **Alertes** en secondes

## Raisonner sur le temps

- **Event time :** quand l'événement s'est produit
- **Processing time :** quand le processeur le voit

Événements **hors ordre** à gérer.

### Fenêtres

| Type | Description |
|------|-------------|
| **Tumbling** | fixes, non chevauchantes |
| **Hopping** | taille fixe, chevauchement |
| **Sliding** | derniers N minutes par événement |
| **Session** | basée sur les pauses |

**Watermarks** : estimation de la progression du event time pour fermer les fenêtres.

## Stream joins

- **Stream–stream :** fenêtre commune
- **Stream–table :** enrichissement via changelog (CDC)
- **Table–table :** deux changelog streams

## Tolérance aux pannes

- **Microbatching** (Spark Streaming legacy)
- **Checkpointing** (Flink, Kafka Streams)
- **Écritures idempotentes + at-least-once**

## Batch vs stream

- **Lambda :** batch + speed layer — lourd opérationnellement
- **Kappa :** tout est stream ; le batch = replay du log
- Systèmes modernes : **un moteur, deux modes**

## Points clés

- **Événements** immuables ; **streams** non bornés
- **Kafka** ajoute replay et fan-out
- **CDC** et **event sourcing** relient DB et streams
- **Event time**, **watermarks**, **stream joins**
- Batch et stream sont partenaires, pas opposés

---
> 🌐 *Traduit par Claude*
