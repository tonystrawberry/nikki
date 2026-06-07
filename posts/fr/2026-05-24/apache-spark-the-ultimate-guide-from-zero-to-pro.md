---
title: "Apache Spark — Le guide ultime (notes)"
date: "2026-05-24"
excerpt: "Notes d'un cours de 6 heures sur Apache Spark par Ansh Lamba — fondamentaux du calcul distribué, architecture, DataFrames, joins, gestion mémoire, caching, partition pruning et AQE."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["spark", "big-data", "data-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=FNJze2Ea780"
---

Notes de la master class Apache Spark de 6 heures d'Ansh Lamba. Visionnée du début à la fin — la première moitié (jusqu'aux broadcast joins) et la seconde moitié (gestion mémoire → AQE) sont toutes deux résumées ci-dessous.

## Pourquoi le calcul distribué

Le cours s'ouvre en opposant la scalabilité verticale (mettre à niveau une seule machine) à la scalabilité horizontale (ajouter plus de machines).

- Le vertical atteint vite ses plafonds : limites matérielles, point de défaillance unique, faible disponibilité.
- L'horizontal : plus de machines = plus de compute + redondance. C'est autour de cela que Spark est construit.

Le modèle mental : le **driver** est le chef d'équipe, les **executors** sont les ouvriers. Tu déclares combien tu en veux et leur taille ; le cluster manager (YARN, standalone, ou dans Databricks la plateforme elle-même) les provisionne.

## Architecture de Spark

- Le **driver** contient le code applicatif, construit le plan logique, planifie le travail.
- Les **executors** exécutent les tasks sur des partitions de données.
- Le driver communique avec le cluster manager pour demander des ressources, puis envoie les tasks aux executors.
- Spark est écrit en Scala/Java ; **PySpark** est un wrapper Python posé au-dessus de l'API Java via Py4J, principalement parce que la communauté data vit en Python.

## DataFrames vs RDDs

- Les **RDDs** sont l'abstraction d'origine — une liste distribuée avec des partitions logiques par-dessus, immuable, évaluée paresseusement. La « spécialité » est que les données sont réparties entre les machines.
- Les **DataFrames** sont une API structurée de plus haut niveau. En interne ils se compilent toujours vers des opérations RDD, mais avec l'optimiseur Catalyst entre les deux.
- Le cours montre la création d'un DataFrame dans Databricks et démontre qu'aucun job ne tourne tant qu'une **action** (comme `.show()` ou `.collect()`) n'est pas déclenchée.

## Lazy evaluation, transformations, actions

- Les **transformations** (filter, select, groupBy, join) construisent le DAG mais n'exécutent rien.
- Les **actions** (show, collect, count, write) déclenchent l'exécution.
- Cela permet à Spark de voir tout le pipeline et de l'optimiser avant de lancer quoi que ce soit — predicate pushdown, column pruning, etc.

## Narrow vs wide transformations

- **Narrow** : chaque partition de sortie dépend d'une seule partition d'entrée (`filter`, `map`, `select`). Aucun déplacement de données sur le réseau.
- **Wide** : la partition de sortie dépend de plusieurs partitions d'entrée (`groupBy`, `join`, `distinct`). Nécessite un **shuffle** — les données se déplacent entre executors sur le réseau. Les wide transformations sont l'endroit où les performances meurent si tu n'es pas prudent.

## Jobs, stages, tasks

- Une **action** = un **job**.
- Un job est découpé en **stages** à chaque frontière de shuffle (wide transformation).
- Chaque stage est un ensemble de **tasks**, une par partition.
- La vue DAG de la Spark UI correspond exactement à cette hiérarchie ; bien la lire est la différence entre deviner et savoir où passe le temps.

## Joins

- **Shuffle join (sort-merge)** : les deux côtés sont shuffled par la clé de jointure pour que les lignes correspondantes atterrissent sur le même executor. Par défaut pour large + large.
- **Broadcast join** : le côté le plus petit est envoyé en entier à chaque executor ; pas de shuffle. Beaucoup plus rapide, mais seulement sûr quand le côté broadcasté tient en mémoire driver/executor (seuil par défaut autour de 10 MB ; ajustable).
- L'optimiseur Spark auto-broadcastera parfois selon les stats ; tu peux aussi le forcer avec `broadcast(df)` en PySpark.
- Règle martelée par l'orateur : **toujours vérifier si un join peut être un broadcast join avant d'accepter un shuffle**.

## Mémoire du driver et `.collect()`

- `.collect()` rapatrie toutes les partitions vers le driver. Si la taille totale dépasse le heap JVM du driver → driver OOM, l'application meurt.
- Le correctif est rarement « rendre le driver plus gros ». Le correctif est « n'appelle pas `.collect()` sur un DataFrame de 100 GB ». Utilise `.show(N)`, `.take(N)`, ou écris vers du stockage à la place.

## Disposition de la mémoire executor

Le heap JVM de l'executor (`spark.executor.memory`) plus un overhead d'environ 10 % est ce que tu obtiens réellement quand tu demandes de la mémoire. Le cours mentionne aussi la off-heap memory et la PySpark memory — toutes deux à zéro par défaut et rarement utilisées. Le heap lui-même se divise en trois :

- **Reserved memory** — 300 MB fixes pour le moteur Spark. Non négociable.
- **Spark memory pool** — 60 % de `(heap − 300 MB)` par défaut (`spark.memory.fraction`). C'est là que le vrai travail se passe.
- **User memory** — les 40 % restants. Contient l'état des UDF et les structures de données définies par l'utilisateur.

## Unified memory pool : storage vs execution

Le Spark memory pool est divisé 50/50 par défaut (`spark.memory.storageFraction`) en :

- **Storage memory** — long terme, contient les DataFrames mis en cache.
- **Execution memory** — court terme, exécute joins, agrégations, transformations.

Le partage est **flexible, pas rigide** :

- **Execution > storage.** Si execution a besoin de plus d'espace et que storage a de la place libre, elle l'emprunte librement. Si storage est plein de blocs cachés, execution peut les **évincer** en utilisant LRU. Execution a la priorité.
- **Storage > execution.** Storage peut emprunter de l'espace execution libre, mais **ne peut pas évincer** execution. Si execution a plus tard besoin de récupérer cet espace, storage est expulsé via LRU. Autorité à sens unique.

Quand storage déborde elle-même, elle évince ses propres blocs cachés les moins utilisés — jamais ceux d'execution.

## Executor OOM et data spill

Chaque wide transformation (par exemple `groupBy`) envoie les lignes pour la même clé vers une seule partition. Chaque task traite une partition à la fois dans l'execution memory.

- Si une partition ne tient pas, Spark **spille** les résultats intermédiaires sur disque pour libérer de l'espace — les partitions sont spillées en entier ; tu ne peux pas déplacer « la moitié d'une partition ».
- Spiller est OK. Le vrai OOM survient quand **une seule partition à elle seule est plus grosse que l'execution memory** — un problème de skew. Tu ne peux pas t'en sortir en spillant parce que Spark doit finalement matérialiser cette partition en mémoire pour la traiter.
- Augmenter `spark.executor.memory` marche une fois, puis casse à nouveau quand le skew grandit. Le bon correctif est de **tuer le skew**, pas d'acheter plus de RAM.

## Salting

Le remède standard au skew. Si une clé (disons `food`) accapare 80 % des lignes :

1. Ajouter une colonne `salt` avec des valeurs aléatoires sur une petite plage (ex. `0..3` → 4 buckets).
2. Grouper par `(key, salt)` au lieu de `key` seul.
3. La clé skewed est maintenant répartie sur N partitions indépendantes qui tiennent chacune en mémoire.

Tu choisis la cardinalité du salt selon le degré de découpe nécessaire pour la clé chaude. Le salting échange un group-by propre contre une étape d'agrégation supplémentaire, mais transforme un OOM en un job qui marche.

## Caching : `cache()` vs `persist()`

Sans caching, chaque action recalcule tout le DAG. Si `df1` est réutilisé pour construire `df2`, `df3`, `df4`, Spark reconstruit `df1` depuis la source à chaque fois — l'execution memory est court terme et est récupérée entre les actions.

- `df.cache()` gare le DataFrame dans la **storage memory** pour que les usages suivants deviennent un scan de table en mémoire (visible dans `.explain()` comme `InMemoryTableScan` au lieu de projections recalculées).
- `cache()` est juste `persist(StorageLevel.MEMORY_AND_DISK)` pour l'API DataFrame. Pour l'API RDD, `cache()` est `MEMORY_ONLY` à la place — source de confusion fréquente.
- Autres storage levels : `MEMORY_ONLY` (recalculer plutôt que spiller, pas de disque), `DISK_ONLY` (lent mais sûr), `MEMORY_ONLY_2` (répliqué pour la tolérance aux pannes), `OFF_HEAP` (expérimental, nécessite une activation explicite).
- Ne cache que les DataFrames qui sont (a) assez petits pour tenir et (b) réutilisés plusieurs fois. Il n'y a pas d'`uncache()` — appelle `df.unpersist()`.

## Edge node, client mode vs cluster mode

Tu ne parles pas directement au cluster manager. Une machine passerelle — le **edge node** — détient les credentials du cluster, et les développeurs s'y connectent en SSH pour soumettre des jobs.

Deux modes de déploiement, selon l'endroit où tourne le driver :

- **Client mode** : le driver tourne sur la machine qui soumet (ton laptop / l'edge node). Les logs streament en local, pratique pour le développement — mais si tu fermes le laptop le driver meurt et tout le job meurt. Le trafic réseau entre driver et executors ajoute de la latence. Dev uniquement.
- **Cluster mode** : le driver tourne sur l'un des nœuds du cluster aux côtés des executors. Résilient à la déconnexion du soumetteur, trafic driver↔executor à faible latence. Standard pour la production.

## Partition pruning

Quand tu fais `df.write.partitionBy("department").parquet(path)`, Spark écrit un dossier par valeur distincte : `department=HR/`, `department=IT/`, …

À la lecture, si ta requête a un filtre sur la colonne de partition (`.filter(col("department") == "HR")`), Spark ne scanne que le dossier correspondant. Les métriques *number of files read* et *number of partitions read* de la Spark UI le prouvent : avec partitioning + filtre sur la colonne de partition, tu scannes quelques KB au lieu de toute la table. À l'échelle du TB c'est le levier le plus important.

## Dynamic partition pruning (DPP)

Le cas malin : tu joins une **table de faits partitionnée** à une **petite table de dimension** qui a un filtre sur une colonne partagée avec la clé de partition, mais aucun filtre sur la table de faits elle-même.

Naïvement Spark scannerait toutes les partitions de la table de faits. DPP réécrit ça :

1. Scanner et filtrer la table de dimension (bon marché, elle est petite).
2. **Broadcaster** l'ensemble des clés résultant vers le scan de la table de faits.
3. Les clés broadcastées agissent comme un filtre dynamique — le scan de la table de faits ne lit plus que les partitions correspondantes.

Deux conditions : le filtre sur la dimension doit porter sur une colonne qui est aussi la **colonne de partition** de la table de faits, et cette colonne doit faire partie de la **clé de jointure**.

## Adaptive Query Execution (AQE)

Spark 3.0+ et activé par défaut (`spark.sql.adaptive.enabled = true`). Le plan physique n'est plus final — Spark collecte des statistiques à l'exécution après chaque stage et réécrit le plan restant. Trois gros gains :

- **Dynamic shuffle partition coalescing.** Les wide transformations par défaut à 200 shuffle partitions. Avec AQE désactivé et 6 lignes de données, tu obtiens 199 partitions vides et 1 vraie — pression GC inutile et overhead d'ordonnancement des tasks. AQE les coalesce vers ce dont les données ont réellement besoin (souvent 1).
- **Dynamic join strategy switching.** Un plan compilé en sort-merge join peut devenir un broadcast join à l'exécution si des transformations amont ont rétréci un côté en dessous du seuil de broadcast. Aucun hint nécessaire.
- **Dynamic skew handling.** Si les stats runtime montrent qu'une partition est bien plus grosse que ses voisines (Spark utilise une règle de multiplicateur, ~5× la médiane), AQE la découpe automatiquement en sous-partitions. Ne remplace pas le salting (le salting reste plus contrôlable), mais c'est un filet de sécurité gratuit pour un skew modéré.

## Points clés à retenir

- **La lazy evaluation est tout l'intérêt.** Construis le DAG, puis laisse Catalyst l'optimiser avant qu'un seul travail ne démarre.
- **Les shuffles sont le coût.** Chaque wide transformation est une opération réseau. Broadcaste quand tu peux.
- **Lis le DAG, pas le code.** La Spark UI te dit ce qui a *réellement* tourné — c'est ça que tu tunes.
- **N'appelle pas `.collect()` à l'aveugle.** C'est la cause la plus fréquente de driver OOM en production.
- **Le tuning mémoire est en aval de la compréhension du modèle.** Aucune valeur de `spark.driver.memory=64g` ne sauve un `.collect()` sur le mauvais DataFrame.
- **L'execution memory gagne contre la storage memory.** Cache agressivement mais sache que ça peut être évincé.
- **Salt avant de scaler.** Quand une seule partition OOM, la réponse est presque toujours le salting (ou du nettoyage amont), pas des executors plus gros.
- **Partitionne tes écritures sur la colonne sur laquelle tu filtres.** Partition pruning + DPP transforment des scans à l'échelle du TB en scans à l'échelle du KB.
- **Fais confiance à AQE, mais comprends ce qu'il fait.** C'est automatique, mais savoir *pourquoi* tu vois soudain un broadcast join au lieu d'un sort-merge est la différence entre un ingénieur senior et un passager.

## Orateur

[Ansh Lamba](https://www.youtube.com/@AnshLamba) — débit détendu, ton conversationnel, beaucoup de « make sense? » pour vérifier et de « buddy » comme cadrage. Rend un long cours réellement finissable.


---
*Traduit par Claude*
