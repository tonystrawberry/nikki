---
title: "DDIA Chapitre 9 : Cohérence et Consensus (en toute simplicité)"
date: "2026-05-11"
excerpt: "Une exploration accessible du chapitre le plus difficile de Designing Data-Intensive Applications — comment les systèmes distribués se mettent d'accord sur ce qui est vrai."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "consistency", "consensus"]
collection: "ddia"
collectionOrder: 9
collectionTitle: "Conception d'applications gourmandes en données"
---

Le chapitre 9 de *Designing Data-Intensive Applications* est réputé pour être le plus difficile du livre. Il s'attaque à une question trompeusement simple : **comment plusieurs ordinateurs se mettent-ils d'accord sur ce qui est vrai ?** Cet article parcourt les idées du chapitre avec des analogies de la vie quotidienne, pour que tout le monde puisse suivre.

## Le grand problème

Imaginez trois amis qui prennent des notes pendant une réunion. S'ils se passent des notes mais qu'ils sont parfois distraits, qu'ils en perdent parfois certaines et qu'ils écrivent parfois en même temps — comment arriver à une seule version partagée et acceptée de la réunion ?

C'est l'essence des systèmes distribués. Les ordinateurs (appelés **nœuds**) travaillent ensemble, mais les réseaux sont lents, les messages se perdent et les horloges dérivent. Il nous faut des règles qui leur permettent de s'accorder même quand les choses tournent mal.

## Cohérence : à quel point les données doivent-elles être « à jour » ?

Quand vous écrivez une donnée sur un nœud et que vous la lisez depuis un autre, à quoi vous attendez-vous ? Différentes garanties donnent différentes réponses.

### Cohérence à terme (la plus faible)

« Si personne n'écrit pendant un moment, tout le monde finira par voir la même chose. »

Pensez à une discussion de groupe où les messages mettent quelques secondes à se synchroniser. Si personne ne tape pendant une minute, tout le monde finit par être à jour. Mais pendant cette minute, les gens peuvent voir des choses différentes.

C'est rapide et scalable, mais déroutant. Vous pouvez écrire quelque chose, rafraîchir la page, et ne pas voir votre propre écriture !

### Linéarisabilité (la plus forte garantie sur une clé unique)

« Le système se comporte *comme si* il n'y avait qu'une seule copie des données, et que les opérations se produisaient une à la fois. »

Imaginez un seul cahier dans lequel chacun écrit à tour de rôle. L'ordre est clair, et une fois que vous y écrivez quelque chose, tous ceux qui lisent ensuite le voient.

**Pourquoi on en veut :** les verrous, les élections de leader et les contraintes d'« unicité » (comme les noms d'utilisateur) ne fonctionnent pas sans elle.

**Pourquoi c'est difficile :** cela nécessite une coordination entre les nœuds, ce qui est lent et fragile quand le réseau a des problèmes.

### Le théorème CAP (en bref)

Vous avez peut-être entendu « choisissez 2 parmi : Cohérence, Disponibilité, tolérance au Partitionnement ». DDIA soutient que c'est trompeur. Une formulation plus précise :

> Quand le réseau tombe en panne, vous devez choisir : rester cohérent (refuser certaines requêtes) ou rester disponible (au risque de servir des données obsolètes).

C'est tout. Les réseaux **vont** tomber en panne, donc vous choisissez vraiment entre **CP** (cohérent pendant les partitions) et **AP** (disponible pendant les partitions).

## Ordonnancement : qu'est-ce qui s'est passé avant quoi ?

Même sans cohérence stricte, on se soucie souvent de l'*ordre*. Est-ce qu'Alice a envoyé le message avant que Bob ne réponde, ou après ?

### Ordre causal

« Si A a causé B, alors tout le monde doit s'accorder pour dire que A s'est passé en premier. »

Si vous publiez une photo et que quelqu'un la commente, tout le monde doit voir la photo avant le commentaire — sinon le commentaire semble surgir de nulle part.

L'ordre causal est plus faible que la linéarisabilité (il n'ordonne pas les événements *sans rapport*) mais il suffit souvent.

### Ordre total

« Chaque événement a une position globale sur une seule frise chronologique. »

La linéarisabilité vous donne un ordre total. Tout comme un système avec un leader unique qui attribue des numéros de séquence (1, 2, 3, …) à chaque écriture.

### Horodatages de Lamport

Une astuce ingénieuse : chaque nœud tient un compteur. Quand il envoie un message, il l'étiquette avec ce compteur. Quand il reçoit un message, il augmente son compteur pour qu'il soit supérieur à celui reçu. Cela permet aux nœuds de s'accorder sur un ordre cohérent (mais pas forcément en temps réel) des événements — sans aucun coordinateur central.

L'inconvénient : les horodatages de Lamport vous donnent l'ordre **après** que tous les messages soient arrivés. Ils ne vous aident pas à décider de l'ordre **en temps réel** (par exemple, « ce nom d'utilisateur est-il déjà pris en ce moment ? »).

## Diffusion en ordre total (Total Order Broadcast)

C'est une primitive plus forte : **chaque nœud reçoit les mêmes messages dans le même ordre.**

Si vous l'avez, vous pouvez construire à peu près tout — une base de données, un service de verrous, une élection de leader. Mais pour la construire, il vous faut...

## Consensus : se mettre d'accord sur une seule valeur

Le consensus est le cœur du chapitre. **Définition :** plusieurs nœuds proposent des valeurs, et ils doivent tous s'accorder sur *une* de ces valeurs, même si certains nœuds tombent en panne.

Cela semble facile. Ça ne l'est pas. Imaginez les trois amis du début, mais maintenant deux d'entre eux peuvent s'endormir au milieu de la conversation, et les messages peuvent arriver dans le mauvais ordre. Comment se mettent-ils encore d'accord ?

### Two-Phase Commit (2PC) — la tentative naïve

Utilisé pour les transactions distribuées. Un nœud est le **coordinateur**, les autres sont des **participants**.

1. **Prepare :** le coordinateur demande à tout le monde « pouvez-vous valider ? »
2. **Commit :** si tout le monde dit oui, le coordinateur dit « commit ! » Si quelqu'un dit non, « abort ! »

**Le problème :** si le coordinateur tombe en panne après l'étape 1 mais avant l'étape 2, les participants sont **bloqués**. Ils ont promis de valider mais ne savent pas s'il faut vraiment le faire. Ils restent là, à tenir des verrous, à attendre indéfiniment.

Le 2PC est techniquement un protocole de consensus, mais fragile — il n'est pas tolérant aux pannes.

### Vrais algorithmes de consensus

**Paxos, Raft, Zab, Viewstamped Replication** — ce sont les célèbres algorithmes de consensus tolérants aux pannes. Ils partagent une forme commune :

- Élire un **leader** (un nœud) qui propose des valeurs.
- Le leader obtient l'accord d'une **majorité** de nœuds avant de valider.
- Si le leader tombe en panne, les autres en élisent un nouveau.

L'astuce de la « majorité » est essentielle : tant que **plus de la moitié** des nœuds sont vivants et peuvent communiquer, le système progresse. Avec 5 nœuds, vous pouvez en perdre 2 et continuer à fonctionner.

Ces algorithmes sont difficiles à implémenter correctement (Paxos a particulièrement la réputation d'être tordant pour l'esprit). La plupart des gens ne les écrivent pas eux-mêmes — ils utilisent une implémentation éprouvée.

### Les limites du consensus

Le consensus est puissant mais coûteux :

- Il a besoin d'une majorité — donc il s'arrête quand trop de nœuds sont en panne.
- Il est lent — chaque décision nécessite plusieurs allers-retours réseau.
- Il suppose que les nœuds sont honnêtes (pas de fautes byzantines). D'autres algorithmes (comme PBFT) gèrent les nœuds malveillants mais sont encore plus lents.

C'est pourquoi nous n'utilisons pas le consensus pour chaque opération. Nous l'utilisons avec parcimonie, pour les **décisions vraiment importantes**.

## Services de coordination : ZooKeeper, etcd, Consul

En pratique, vous exécutez rarement le consensus vous-même. À la place, vous utilisez un petit cluster (généralement 3 ou 5 nœuds) qui fait tourner **ZooKeeper** ou **etcd**. Ils fournissent :

- **Élection de leader :** « qui est aux commandes en ce moment ? »
- **Découverte de services :** « où puis-je trouver le service X ? »
- **Verrous distribués :** « je fais ceci — personne d'autre n'y touche. »
- **Configuration :** petits morceaux d'état partagé.

Vos serveurs applicatifs principaux peuvent être des centaines de nœuds, mais ils délèguent tous les décisions difficiles au petit cluster de consensus. C'est ainsi que des systèmes comme Kafka, Kubernetes et de nombreuses bases de données restent coordonnés.

## Points clés à retenir

- La **cohérence** est un spectre. Plus la garantie est forte, plus le système est lent et fragile.
- **Linéarisabilité** = « se comporte comme une copie unique ». Utile mais coûteux.
- La **cohérence causale** suffit souvent et coûte bien moins cher.
- Les **horodatages de Lamport** ordonnent les événements sans horloge centrale, mais seulement après coup.
- La **diffusion en ordre total** est équivalente au consensus — on peut construire l'un à partir de l'autre.
- Le **2PC** est fragile car le coordinateur est un point unique de défaillance.
- **Paxos/Raft** sont des algorithmes de consensus tolérants aux pannes qui ont besoin d'une majorité pour progresser.
- **ZooKeeper/etcd** empaquettent le consensus dans un service que vous pouvez utiliser sans l'implémenter vous-même.
- La leçon plus profonde : **un accord fort nécessite de la coordination, et la coordination a un coût.** Les ingénieurs conçoivent les systèmes en décidant quelles décisions valent ce coût.

---
*Traduit par Claude*
