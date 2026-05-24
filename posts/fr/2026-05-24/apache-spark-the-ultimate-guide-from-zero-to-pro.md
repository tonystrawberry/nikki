---
title: "Apache Spark — Le guide ultime (notes)"
date: "2026-05-24"
excerpt: "Notes tirées d'une plongée de 6 heures dans Apache Spark par Ansh Lamba — fondamentaux du calcul distribué, architecture, DataFrames, jointures et gestion de la mémoire."
author: "Tony Duong"
category: "note"
tags: ["spark", "big-data", "data-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=FNJze2Ea780"
---

Notes tirées de la master class de 6 heures d'Ansh Lamba sur Apache Spark. J'ai regardé jusqu'à **3:50:46** (juste après les broadcast joins, avant la gestion unifiée de la mémoire) — les sections ci-dessous reflètent ce que j'ai couvert. Je reviendrai pour le reste.

## Pourquoi le calcul distribué

Le cours commence en opposant la mise à l'échelle verticale (améliorer une machine) à la mise à l'échelle horizontale (ajouter des machines).

- La verticale atteint vite ses limites : plafond matériel, point unique de défaillance, faible disponibilité.
- L'horizontale : plus de machines = plus de puissance de calcul + redondance. C'est sur ce principe que Spark est construit.

Le modèle mental : le **driver** est le chef d'équipe, les **executors** sont les ouvriers. Tu déclares combien tu en veux et leur taille ; le cluster manager (YARN, standalone, ou la plateforme elle-même dans Databricks) les provisionne.

## Architecture de Spark

- Le **driver** contient le code de l'application, construit le plan logique, planifie le travail.
- Les **executors** exécutent les tâches sur les partitions de données.
- Le driver communique avec le cluster manager pour demander des ressources, puis envoie les tâches aux executors.
- Spark est écrit en Scala/Java ; **PySpark** est un wrapper Python posé par-dessus l'API Java via Py4J, principalement parce que la communauté data vit en Python.

## DataFrames vs RDDs

- Les **RDD** sont l'abstraction d'origine — une liste distribuée avec des partitions logiques par-dessus, immuable, évaluée paresseusement. La "spécialité", c'est que les données sont réparties entre les machines.
- Les **DataFrames** sont une API structurée de plus haut niveau. En interne, ils se compilent toujours vers des opérations RDD, mais avec l'optimiseur Catalyst entre les deux.
- Le cours montre comment créer un DataFrame dans Databricks et démontre qu'aucun job ne tourne tant qu'une **action** (comme `.show()` ou `.collect()`) n'est pas déclenchée.

## Évaluation paresseuse, transformations, actions

- Les **transformations** (filter, select, groupBy, join) construisent le DAG mais ne s'exécutent pas.
- Les **actions** (show, collect, count, write) déclenchent l'exécution.
- Ça permet à Spark de voir tout le pipeline et de l'optimiser avant de lancer quoi que ce soit — predicate pushdown, column pruning, etc.

## Transformations narrow vs wide

- **Narrow** : chaque partition de sortie dépend d'une seule partition d'entrée (`filter`, `map`, `select`). Aucun mouvement de données sur le réseau.
- **Wide** : la partition de sortie dépend de plusieurs partitions d'entrée (`groupBy`, `join`, `distinct`). Nécessite un **shuffle** — les données circulent entre les executors via le réseau. Les wide transformations, c'est là que les perfs partent en fumée si tu ne fais pas attention.

## Jobs, stages, tasks

- Une **action** = un **job**.
- Un job est découpé en **stages** à chaque frontière de shuffle (wide transformation).
- Chaque stage est un ensemble de **tasks**, une par partition.
- La vue DAG du Spark UI est exactement cette hiérarchie ; bien la lire, c'est la différence entre deviner et savoir où le temps passe.

## Jointures

- **Shuffle join (sort-merge)** : les deux côtés sont shufflés sur la clé de jointure pour que les lignes correspondantes atterrissent sur le même executor. Par défaut pour large + large.
- **Broadcast join** : le côté le plus petit est envoyé en entier à chaque executor ; pas de shuffle. Beaucoup plus rapide, mais sûr uniquement quand le côté broadcasté tient en mémoire driver/executor (seuil par défaut autour de 10 Mo ; configurable).
- L'optimiseur de Spark déclenche parfois un auto-broadcast sur la base des stats ; tu peux aussi le forcer avec `broadcast(df)` en PySpark.
- La règle d'or que le speaker martèle : **toujours vérifier si une jointure peut être un broadcast join avant d'accepter un shuffle**.

## Mémoire du driver et `.collect()`

- `.collect()` rapatrie toutes les partitions vers le driver. Si la taille totale dépasse le heap JVM du driver → OOM du driver, l'application meurt.
- La solution est rarement "agrandir le driver". La solution est "ne pas appeler `.collect()` sur un DataFrame de 100 Go". Utilise `.show(N)`, `.take(N)`, ou écris vers du stockage à la place.

## Ce que je n'ai pas encore couvert

Les ~2 heures restantes traitent de :

- La gestion unifiée de la mémoire (pool execution vs storage)
- Les patterns d'OOM côté executor et le garbage collection
- Les niveaux de stockage, `cache()` vs `persist()`
- Le dynamic partition pruning
- Les edge nodes, les modes de déploiement (client vs cluster)
- Les internals du moteur Spark SQL et les plans de requêtes

À suivre.

## À retenir

- **L'évaluation paresseuse est tout l'intérêt.** Construire le DAG, puis laisser Catalyst l'optimiser avant que le moindre travail ne démarre.
- **Les shuffles sont le coût.** Chaque wide transformation est une opération réseau. Broadcast quand tu peux.
- **Lis le DAG, pas le code.** Le Spark UI te dit ce qui a *réellement* tourné — c'est ça que tu tunes.
- **Ne fais pas `.collect()` à l'aveugle.** C'est la cause la plus fréquente d'OOM driver en prod.
- **Le tuning mémoire vient après la compréhension du modèle.** Aucune dose de `spark.driver.memory=64g` ne sauve un `.collect()` sur le mauvais DataFrame.

## Intervenant

[Ansh Lamba](https://www.youtube.com/@AnshLamba) — débit décontracté, ton conversationnel, plein de "make sense?" pour vérifier la compréhension et de "buddy" pour cadrer. Rend un cours long effectivement finissable.

---
*Traduit par Claude*
