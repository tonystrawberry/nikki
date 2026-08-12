---
title: "System Design Interview Chapitre 5 : concevoir le consistent hashing"
date: "2026-08-02"
excerpt: "Notes d'Alex Xu — pourquoi le hash modulo reshuffle tout au scale-out, comment le hash ring + virtual nodes limitent le remapping à ~K/N, et où le consistent hashing apparaît."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "interview", "consistent-hashing", "sharding", "distributed-systems"]
coverImage: ""
youtubeUrl: ""
collection: "system-design-interview"
collectionOrder: 5
collectionTitle: "System Design Interview"
---

Notes tirées de *System Design Interview*, chapitre 5 — **consistent hashing** : mapper les clés vers les serveurs de sorte qu'ajouter/supprimer un nœud ne déplace qu'une petite fraction des clés.

## L'approche naïve : `hash(key) % N`

```text
server = hash(key) % N
```

Fonctionne jusqu'à ce que `N` change.

Quand on passe de 3 serveurs à 4, **presque chaque clé** est remappée. Le cache hit ratio s'effondre ; les bases de données reshufflent presque toutes les partitions. C'est la douleur que le consistent hashing corrige.

```mermaid
flowchart LR
  subgraph before["N = 3"]
    K1[key] --> M1["hash % 3"]
  end
  subgraph after["N = 4"]
    K2[key] --> M2["hash % 4"]
  end
  before -.->|most keys remap| after
```

## Objectif

Quand les nœuds changent :

```text
keys remapped ≈ K / N
```

- `K` = nombre de clés
- `N` = nombre de nœuds (après le changement)

Seulement environ **1/N** des clés devraient bouger — pas la plupart.

## Le hash ring

1. Hasher **serveurs** et **clés** sur un anneau fixe (ex. `0 … 2^32-1`)
2. Pour placer une clé : la hasher, parcourir dans le sens horaire, assigner au **premier serveur** rencontré
3. Ajouter un serveur : il prend les clés de la plage de son voisin horaire — seule cette tranche bouge
4. Supprimer un serveur : ses clés tombent sur le serveur horaire suivant

```mermaid
flowchart TB
  subgraph ring["Hash ring (clockwise)"]
    direction LR
    A["Server A"] --> B["Server B"]
    B --> C["Server C"]
    C --> A
  end
  Key["key user:42\n(hash lands here)"] -->|walk clockwise| A
```

```text
Ring positions (simplified):

  0 ── A ──────── B ──────── C ── 2^32
           ↑
      hash(user:42)  →  next clockwise server = A
```

Quand **Server D** est ajouté entre A et B, seulement les clés dans `(A → D]` migrent vers D. Tout le reste reste en place.

```mermaid
flowchart LR
  subgraph before["Before: 3 servers"]
    A1[A] --> B1[B]
    B1 --> C1[C]
    C1 --> A1
  end
  subgraph after["After: add D"]
    A2[A] --> D2[D]
    D2 --> B2[B]
    B2 --> C2[C]
    C2 --> A2
  end
  before -->|only slice A→D moves| after
```

## Virtual nodes (la partie qui le rend production-ready)

Un serveur physique → plusieurs positions sur l'anneau (« virtual nodes » / vnodes).

Pourquoi :

- Avec peu de nœuds physiques, une seule position sur l'anneau crée des plages de clés **inégales**
- Beaucoup de vnodes par serveur → la charge se répartit plus uniformément
- Matériel hétérogène : donner plus de vnodes aux grosses machines

```mermaid
flowchart TB
  PA["Physical A"] --> VA1[A-v1]
  PA --> VA2[A-v2]
  PA --> VA3[A-v3]
  PB["Physical B"] --> VB1[B-v1]
  PB --> VB2[B-v2]
  PB --> VB3[B-v3]
  VA1 --> Ring["Hash ring"]
  VA2 --> Ring
  VA3 --> Ring
  VB1 --> Ring
  VB2 --> Ring
  VB3 --> Ring
```

Trade-off : plus de métadonnées à stocker/répliquer sur l'appartenance à l'anneau.

## Intuition de rebalancing

Exemple du récit pédagogique habituel :

- 300 clés, 3 nœuds, ajout d'un 4e
- **Sans** consistent hashing : une grande fraction des clés reshuffle sur plusieurs nœuds
- **Avec** consistent hashing : environ `300/4 ≈ 75` clés migrent vers le nouveau nœud

```mermaid
flowchart TB
  subgraph bad["Modulo hashing"]
    BadMove["~ most of K keys remap"]
  end
  subgraph good["Consistent hashing"]
    GoodMove["≈ K / N keys remap\n(300/4 ≈ 75)"]
  end
```

Cette borne `K/N` est le punchline de l'entretien.

## Où ça apparaît

- Caches distribués (clients Memcached, certains modes Redis cluster conceptuellement)
- Stores partitionnés style Dynamo
- Load balancing avec affinité sticky (parfois)
- Variantes d'assignation CDN / edge

Partout où on partitionne par clé et où on attend une appartenance **élastique**.

## Problèmes à mentionner

| Problème | Atténuation |
|----------|-------------|
| Hot keys | Traitement séparé ; pas résolu par le hashing seul |
| Charge inégale | Virtual nodes ; monitorer les tailles de plages |
| Changements d'appartenance à l'anneau | Gossip / coordination pour que tous les clients voient le même anneau |
| Requête pendant rebalance | Souvent dual-read / copier les plages avec soin |

## À retenir pour l'entretien

Contraster **`% N` (tout bouge)** avec **anneau + virtual nodes (~K/N bougent)**. Dessiner l'anneau, placer une clé horaire, puis montrer l'ajout d'un nœud qui vole une tranche. Ce diagramme fait généralement la différence.
