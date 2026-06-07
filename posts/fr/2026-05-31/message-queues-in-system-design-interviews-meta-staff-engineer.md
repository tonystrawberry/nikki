---
title: "Message Queues en entretien de system design avec un Meta Staff Engineer"
date: "2026-05-31"
excerpt: "Notes de Hello Interview sur les files de messages pour les entretiens de system design — exemple motivant, acks, garanties de livraison, scaling, back pressure, ordre, poison messages, DLQ, et Kafka vs SQS vs RabbitMQ."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "message-queue", "kafka", "sqs", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=1ISRd0bS714"
---

Notes d'Evan (ex Meta staff engineer, Hello Interview) sur les **files de messages en entretien de system design** — quand les utiliser, comment elles fonctionnent sous le capot, et les sujets de deep dive que les interviewers explorent dès que vous en dessinez une au tableau.

## Exemple motivant : app de partage de photos

Imaginez des uploads façon Instagram nécessitant redimensionnement, filtres et modération de contenu — chaque étape prend quelques secondes.

**Problèmes d'une architecture synchrone :**

- **Latence** — l'utilisateur attend 6+ secondes devant un spinner
- **Fragilité** — si le service de filtres plante en cours de traitement, tout l'upload échoue et le travail déjà fait est perdu
- **Trafic en rafales** — un pic de 50 à 5 000 uploads/s submerge des serveurs limités à ~200/s ; les requêtes timeout ou échouent

**Correction avec une queue :** le serveur sauvegarde le fichier, écrit un message (« photo 456 à traiter ») dans une queue, et répond immédiatement au client. Un pool de workers consommateurs tire les messages et traite en parallèle.

- Les uploads deviennent rapides (sauvegarde + enqueue seulement)
- Les échecs sont isolés (message redistribué à un autre worker)
- Les pics de trafic approfondissent la queue au lieu de perdre du travail — au pire, le traitement est retardé

## Qu'est-ce qu'une message queue ?

Un **tampon entre producteur et consommateur** :

- **Producteur** crée le travail (serveur d'upload)
- **Consommateur** exécute le travail (pool de workers)
- Le producteur envoie un message et passe à autre chose ; le consommateur traite à son rythme

**Propriété clé : le découplage** — producteur et consommateur ne se connaissent pas. Chaque côté peut scaler indépendamment.

**Analogie de cuisine :** le serveur pose la commande sur le rail, le cuisinier la prend quand il est prêt. Le rail découple la salle du back-office.

## Fonctionnement sous le capot

### Accusés de réception (acks)

Quand un consommateur tire un message, la queue ne le supprime pas immédiatement. Le consommateur doit envoyer un **ack** une fois terminé. Si le worker plante avant l'ack, le message est redistribué — rien n'est perdu.

### Éviter le double traitement

Pendant qu'un worker traite (avant l'ack), le message est toujours « dans la queue ». Les systèmes gèrent la visibilité différemment :

- **SQS :** le message devient **invisible** aux autres consommateurs pendant une fenêtre configurable (ex. 30 s)
- **Kafka :** assigne chaque partition à exactement un consommateur dans un groupe
- **RabbitMQ :** limites de prefetch au niveau canal et timeouts d'ack

### Garanties de livraison

| Garantie | Signification | Quand l'utiliser |
|----------|---------------|------------------|
| **At least once** (la plus courante) | Chaque message livré ≥1 fois ; doublons possibles | Réponse par défaut en entretien — rendre les consommateurs **idempotents** |
| **At most once** | Fire-and-forget ; message supprimé à la prise | Analytics/métriques où perdre quelques événements est acceptable |
| **Exactly once** | Traité exactement une fois | Difficile en systèmes distribués ; ne promettez pas sans pouvoir défendre le mécanisme |

**Exemple d'idempotence :** « définir la photo de profil de l'utilisateur 123 à photo 5 » est sûr à exécuter deux fois. « incrémenter le compteur de posts de 1 » ne l'est pas — préférez « définir le compteur de posts à 54 ».

## Quand utiliser une queue (quatre signaux)

1. **Travail asynchrone** — l'utilisateur n'a pas besoin du résultat immédiatement (email, rapports, uploads)
2. **Trafic en rafales** — absorber les pics sans rejeter de requêtes
3. **Découplage** — producteur et consommateur ont des besoins de scaling/matériel différents (serveurs d'upload légers vs workers GPU)
4. **Fiabilité** — downstream temporairement indisponible ; la queue retient les messages jusqu'au retour en ligne

**Piège :** n'ajoutez pas une queue à une charge **synchrone** avec des SLA de latence stricts (ex. sub-500 ms). Les queues ajoutent de la complexité et cassent les contraintes de latence.

## Deep dives que les interviewers adorent

### Scaling via partitionnement

Une seule queue a des limites de débit. **Partitionner** en sous-queues indépendantes pour que différents workers traitent en parallèle.

**Compromis sur la clé de partition :** partitionner par `user_id` pour l'ordre par utilisateur, mais la partition d'une célébrité devient hot. Partitionner par `ride_id` pour une distribution uniforme mais perdre l'ordre par utilisateur. Choisir la clé de partition est une décision de design délibérée.

### Back pressure

Si les producteurs dépassent les consommateurs, la queue grandit indéfiniment — une queue **retarde** les problèmes de capacité, elle ne les résout pas. À 300 msg/s en entrée et 200 msg/s en sortie, vous prenez 100 msg/s de retard pour toujours.

**Réponses :**

- Autoscaler les consommateurs selon la profondeur de la queue
- Appliquer du **back pressure** — rejeter ou ralentir les producteurs (« réessayez dans une minute »)
- Monitorer et alerter sur la profondeur de la queue

### Poison messages et dead letter queues (DLQ)

Une image corrompue qui échoue toujours devient un **poison message** — retenter indéfiniment bloque le consommateur.

**Correction :** configurer un nombre max de retries (ex. 5). Après épuisement, déplacer vers une **dead letter queue (DLQ)** pour inspection. La queue principale continue. Mentionner les DLQ de manière proactive signale de la seniorité.

### Durabilité et tolérance aux pannes

Les queues modernes (surtout **Kafka**) persistent les messages sur disque et les répliquent entre brokers. Si un broker tombe, les réplicas conservent les données — même concept que les read replicas en base de données.

Kafka conserve les messages pendant une fenêtre configurable (jour, semaine, indéfiniment), permettant le **replay** — retraiter depuis une heure en arrière si les consommateurs étaient cassés ou offline.

## Technologies courantes

| Système | Idéal pour |
|---------|------------|
| **Kafka** | Haut débit, durabilité, partitions, replay, consumer groups — **choix par défaut en entretien** |
| **SQS** | AWS fully managed, simple — standard (haut débit, ordre best-effort) ou FIFO (ordre strict, débit plus faible) ; visibility timeout |
| **RabbitMQ** | Broker traditionnel avec exchanges/bindings pour routage complexe — moins courant en entretien de system design |

## Points clés

- Les message queues **découplent** producteurs et consommateurs, **tamponnent** le trafic en rafales, et **distribuent** le travail entre pools de workers
- Par défaut : **at least once delivery** avec des consommateurs **idempotents**
- Maîtrisez acks, visibilité/invisibilité, partitionnement, back pressure, poison messages et DLQ avant l'entretien
- N'introduisez pas une queue dans un chemin synchrone à faible latence
- Si vous ne devez connaître qu'une technologie : **Kafka**

---
*Traduit par Claude*
