---
title: "DDIA Chapitre 5 : Réplication"
date: "2026-03-15"
excerpt: "Résumé du chapitre de Kleppmann sur la réplication : pourquoi répliquer, réplication single-leader, multi-leader et leaderless, et les compromis de cohérence."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "replication", "distributed-systems", "consistency"]
---

## Vue d’ensemble

Le chapitre 5 de *Designing Data-Intensive Applications* traite de la **réplication** : garder des copies des mêmes données sur plusieurs nœuds pour la redondance, une latence plus faible (données proches des utilisateurs) et un débit de lecture plus élevé. Le chapitre compare trois approches principales — réplication single-leader, multi-leader et leaderless — et les compromis de cohérence associés.

## Pourquoi répliquer ?

- **Redondance :** si un nœud tombe, les autres peuvent servir les données.
- **Latence plus faible :** placer des réplicas dans plusieurs régions pour que les utilisateurs lisent depuis un nœud proche.
- **Scaler le débit de lecture :** répartir la charge de lecture sur les réplicas ; les écritures sont souvent plus difficiles à scaler.

## Réplication single-leader (à leader)

Un nœud est le **leader** (primaire) ; les écritures vont au leader. Les réplicas (followers / secondaires) reçoivent un flux de changements et les appliquent dans le même ordre.

- **Synchrone vs asynchrone :** la réplication synchrone attend au moins un réplica avant d’accuser réception de l’écriture — cohérence plus forte, latence plus élevée et risque si un réplica est lent ou down. La réplication asynchrone accuse réception tout de suite et réplique en arrière-plan — latence plus faible mais risque de perdre des écritures récentes si le leader tombe.
- **Décalage de réplication :** avec la réplication asynchrone, les followers peuvent retarder. Cela mène à une **cohérence à terme** et à des problèmes observables :
  - **Cohérence lecture-après-écriture :** un utilisateur écrit puis lit et peut voir des données périmées si la lecture va sur un réplica en retard. Solutions : lire ses propres écritures depuis le leader, ou router par une clé qui n’est que sur le leader jusqu’à réplication.
  - **Lectures monotones :** un utilisateur peut voir les données « reculer dans le temps » si des lectures successives touchent des réplicas avec des retards différents. Solution : router toutes les lectures d’un utilisateur vers le même réplica (ex. par user ID).
  - **Lectures à préfixe cohérent :** dans un système partitionné, différentes parties d’une conversation peuvent être répliquées dans un ordre différent ; un lecteur peut voir une réponse avant la question. Solution : s’assurer que les écritures causalement liées vont dans la même partition ou utiliser des garanties d’ordre.

**Mise en place de nouveaux réplicas :** en général, prendre un snapshot du leader, le copier sur le nouveau nœud, puis rejouer le journal de réplication depuis l’instant du snapshot pour que le nouveau réplica rattrape.

## Réplication multi-leader

Plusieurs leaders peuvent accepter des écritures (ex. un par datacenter). Chaque leader réplique vers les autres. Cas d’usage : déploiements multi-datacenter (écriture locale, réplication entre DC) et applications hors ligne (chaque appareil est un « leader » qui se synchronise en ligne).

- **Détection et résolution de conflits :** deux leaders peuvent accepter des écritures concurrentes sur la même clé ; les conflits doivent être détectés et résolus. Options : last-write-wins (LWW) par timestamp (peut perdre des écritures), fusion des valeurs (ex. CRDT), ou enregistrer les conflits pour une résolution au niveau application. Une logique de résolution personnalisée peut s’exécuter à la lecture ou à l’écriture.

## Réplication leaderless

Pas de leader unique ; les clients envoient les écritures à plusieurs nœuds (ou un coordinateur le fait), et lisent depuis plusieurs nœuds. Utilisée dans les systèmes style Dynamo (ex. DynamoDB, Cassandra, Voldemort).

- **Quorum :** avec *n* réplicas, si vous écrivez sur *w* nœuds et lisez depuis *r* nœuds, et *w* + *r* > *n*, vous voyez en général la dernière écriture (en supposant pas d’écritures concurrentes et pas de nœuds défaillants). Choix courant : *w* = *r* = ⌈(*n*+1)/2⌉.
- **Quorum approximatif et hinted handoff :** quand des nœuds sont down ou injoignables, vous pouvez accepter des écritures sur d’autres nœuds qui les transmettront plus tard au réplica prévu (« hinted handoff »). Les lectures peuvent alors manquer ces écritures jusqu’à application — le quorum n’est pas strict et la cohérence est affaiblie.
- **Résolution de conflits :** des écritures concurrentes sur la même clé peuvent créer plusieurs versions. La résolution est souvent par **last-write-wins (LWW)** avec des timestamps, ou par **version vectors** / **dotted version vectors** pour suivre la causalité et fusionner ou présenter plusieurs versions à l’application.

## À retenir

- La réplication **single-leader** est simple et très utilisée ; le décalage de réplication oblige à penser lecture-après-écriture, lectures monotones et préfixe cohérent.
- La réplication **multi-leader** convient aux scénarios multi-datacenter et hors ligne mais introduit des conflits d’écriture et une résolution plus complexe.
- La réplication **leaderless** privilégie la disponibilité et la basse latence par rapport à la cohérence forte ; le quorum aide mais les quorums approximatifs et les écritures concurrentes compliquent la situation.
- Il n’y a pas de repas gratuit : la réplication améliore la disponibilité et les perfs en lecture mais ajoute de la complexité autour de la cohérence, des conflits et des modes de défaillance.

---
*Traduit par Claude*
