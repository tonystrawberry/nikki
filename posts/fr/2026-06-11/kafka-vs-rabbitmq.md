---
title: "Kafka vs RabbitMQ"
date: "2026-06-11"
excerpt: "Hello Interview sur le choix entre Kafka et RabbitMQ — broker intelligent vs consommateur intelligent, file d'attente vs log en ajout seul, et les compromis d'ordonnancement, de débit, de livraison et d'exploitation qui doivent guider la décision."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "kafka", "rabbitmq", "message-queue", "streaming", "distributed-systems", "interview"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=1HOVtQ-_fcE"
---

Kafka et RabbitMQ ne sont pas interchangeables — choisir le mauvais peut entraîner une refonte importante plus tard. Mais ils existent pour résoudre le **même problème fondamental** : lorsqu'un service en appelle un autre directement (service de commandes → service d'inventaire via HTTP), l'appelant se retrouve bloqué à attendre, atteint un timeout, ou perd des requêtes dès que l'appelé est lent ou indisponible. Une file de messages ajoute un **tampon** entre les services : le producteur dépose un message et reprend immédiatement la main, et le consommateur le traite quand il est prêt. Lors d'un pic de vente flash, la file absorbe la charge et laisse les services en aval travailler à leur propre rythme.

Tous deux offrent ce découplage — des producteurs, des consommateurs, un broker au milieu. Mais **leur fonctionnement sous le capot est fondamentalement différent**, et c'est cela qui doit guider le choix.

## RabbitMQ : un broker intelligent avec des consommateurs simples

RabbitMQ est un broker de messages traditionnel doté d'un modèle mental de file d'attente intuitif :

- Un producteur envoie un message au broker.
- Le broker applique les **règles de routage** que vous avez configurées pour décider à quelle file il appartient.
- Un consommateur retire les messages de la file, les traite, et envoie un **accusé de réception** (acknowledgement).
- À la réception de l'ack, RabbitMQ **supprime** le message. Les livraisons échouées sont retentées, et après plusieurs échecs le message est automatiquement déplacé vers une **dead-letter queue** (file de messages morts).

Le broker fait le gros du travail — routage, suivi des livraisons, nouvelles tentatives, dead-lettering — tandis que le consommateur se contente de s'abonner, traiter, et accuser réception. Cela correspond parfaitement aux **charges orientées tâches** : envoi d'e-mails, traitement de paiements, redimensionnement d'images. Une unité de travail entre, quelque chose la réalise, le message disparaît. (Avec Kafka, vous devriez construire vous-même la gestion des dead-letters.)

## Kafka : un broker simple avec des consommateurs intelligents

Kafka est essentiellement un **log distribué en ajout seul** (append-only). Un producteur ajoute un message à un **topic**, et celui-ci **ne disparaît pas à la lecture** — il reste dans le log pendant des heures, des jours, des semaines, ou indéfiniment selon la rétention.

- Les consommateurs suivent eux-mêmes leur position, appelée **offset**. Lire le message 500 → se souvenir qu'on est à 500. Plantage et redémarrage → retrouver où on s'était arrêté et reprendre.
- Besoin de retraiter ce qui s'est passé il y a une heure ? Il suffit de **rembobiner l'offset**.
- Les messages sont **durables et rejouables**, de sorte que plusieurs consumer groups lisent le même flux indépendamment — l'analytique et les notifications en temps réel consomment les mêmes événements, et un service mis en ligne six mois plus tard peut lire tout l'historique depuis le premier jour.

Donc : **RabbitMQ est un broker de messages — les messages le traversent ; Kafka est un log — les messages y vivent.** Dans RabbitMQ, un message consommé est perdu ; dans Kafka, les messages persistent et n'importe quel nombre de consommateurs peut les lire depuis n'importe quel point de l'historique. Cette unique différence détermine presque tous les autres compromis — c'est pourquoi de nombreuses équipes utilisent **les deux** : Kafka comme flux d'événements durable, RabbitMQ comme file de tâches traitant le travail que ces événements déclenchent.

## Les compromis techniques

### Ordonnancement

- Les files **RabbitMQ** sont strictement ordonnées — un consommateur unique obtient un ordre parfait. Ajoutez plusieurs consommateurs pour le débit et vous sacrifiez cet ordre.
- **Kafka** découpe chaque topic en **partitions** ; l'ordre n'est garanti qu'**à l'intérieur d'une partition**. Une **clé de partition** (partition key) achemine ensemble les messages liés (toutes les commandes du client 12345 → même partition, traitées dans l'ordre) — vous obtenez donc un **ordre par entité avec parallélisme**, mais pas d'ordre global.
- Compromis : RabbitMQ = ordre global avec un seul consommateur ; Kafka = ordre par entité avec parallélisme.

### Débit et latence

- **RabbitMQ** : ~4 000–10 000 msgs/sec, latence de ~1–5 ms à faible volume. Le broker **pousse** (push) les messages mais effectue beaucoup de travail par message (état de livraison, acks, routage), donc le débit chute à mesure que cette surcharge s'accumule.
- **Kafka** : 1 000 000+ msgs/sec (~100×), mais une latence de base plus élevée (~5–50 ms) parce que les consommateurs **tirent par lots** (pull in batches). Le broker se contente d'ajouter à un log séquentiel, donc la latence reste constante même quand le volume croît.

### Garanties de livraison

Lorsqu'un consommateur échoue à traiter un message, soit vous le perdez, soit vous le redélivrez (au risque de doublons) :

- **At-most-once** (au plus une fois) : le broker envoie une seule fois, sans nouvelle tentative — rapide, mais les messages peuvent être perdus à jamais.
- **At-least-once** (au moins une fois) : le broker retente jusqu'à l'ack — pas de perte de données, mais les consommateurs peuvent voir un message deux fois. **Les deux** systèmes le supportent ; c'est le défaut standard de l'industrie.
- **Exactly-once** (exactement une fois) : Kafka le supporte, mais c'est **bien plus restreint qu'il n'y paraît** — uniquement lorsque l'entrée et la sortie sont des topics Kafka dans le **même cluster** sous transactions Kafka. Dès que vous écrivez dans une base de données, appelez une API externe, ou traversez des clusters, vous revenez à at-least-once. Ne choisissez pas Kafka uniquement pour l'« exactly-once » — en pratique, vous avez quand même besoin de **consommateurs idempotents**.

### Complexité opérationnelle

- **RabbitMQ** est plus simple : un binaire unique, un clustering direct, une interface de gestion intégrée — accessible pour une petite équipe gérant quelques files.
- **Kafka** est plus difficile : il a historiquement nécessité Zookeeper (les versions plus récentes utilisent **Raft** à la place), plus le rééquilibrage des partitions, les pannes de brokers, les configurations de topics, et la coordination des consumer groups. Les **services managés** (Confluent Cloud, Amazon MSK, Azure Event Hubs) absorbent l'essentiel de tout cela — envisagez sérieusement d'en utiliser un, sauf si vous disposez déjà d'une expertise infrastructure.

## Quand utiliser lequel

**Optez pour RabbitMQ** quand vous avez besoin de files de tâches / jobs d'arrière-plan (e-mails, paiements, redimensionnement d'images — le travail entre, est fait, disparaît), d'un routage intelligent basé sur le contenu, d'une faible latence à échelle modérée, et d'une exploitation simple. *Dans le monde réel : Instagram traite les téléversements de photos (redimensionnement/filtres) via des workers RabbitMQ ; Reddit l'utilise pour les fils de commentaires et le karma.*

**Optez pour Kafka** quand vous avez besoin que plusieurs systèmes lisent les mêmes événements indépendamment (analytique, détection de fraude, facturation, journalisation d'audit), du replay de données historiques, d'une échelle massive (des millions d'événements/sec avec une latence constante), ou d'un historique d'événements durable et permanent. *Dans le monde réel : Netflix traite des pétaoctets/jour pour les recommandations et la facturation ; Uber l'utilise pour la tarification en temps réel et la détection de fraude ; LinkedIn a inventé Kafka et l'utilise pour alimenter son fil et sa messagerie.*

## Points clés à retenir

- **Broker intelligent + consommateurs simples (RabbitMQ)** vs **broker simple + consommateurs intelligents (Kafka)** — c'est la distinction fondamentale.
- **File vs log** : RabbitMQ supprime à l'ack ; Kafka conserve et laisse n'importe quel consommateur rejouer par offset.
- **Ordonnancement** : RabbitMQ global (consommateur unique) vs Kafka par partition (parallèle) — choisissez votre clé de partition délibérément.
- **Débit/latence** : RabbitMQ ~4 000–10 000 msgs/sec à 1–5 ms ; Kafka 1M+/sec à 5–50 ms.
- **Ne courez pas après l'exactly-once** — il est interne au cluster Kafka uniquement ; construisez des consommateurs idempotents quoi qu'il arrive.
- Si votre cas d'usage est une file de tâches contrainte, choisissez **RabbitMQ** pour la simplicité ; pour des flux d'événements durables, rejouables et à grande échelle, penchez vers **Kafka** (probablement managé). Ou utilisez **les deux**.

---

> 🌐 *Traduit par Claude*
