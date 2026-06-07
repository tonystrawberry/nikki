---
title: "DDIA Chapitre 10 : Traitement par lots (expliqué simplement)"
date: "2026-05-23"
excerpt: "Une visite guidée et accessible du traitement par lots dans Designing Data-Intensive Applications — les pipes Unix, MapReduce et l'essor d'Apache Spark."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "batch-processing", "spark", "mapreduce"]
collection: "ddia"
collectionOrder: 10
collectionTitle: "Designing Data-Intensive Applications"
---

Le chapitre 10 de *Designing Data-Intensive Applications* prend du recul par rapport à la base de données du moment et pose une autre question : **comment traiter d'énormes quantités de données — des gigaoctets, des téraoctets — quand on n'a pas besoin d'une réponse en temps réel ?** C'est le monde du traitement par lots (batch processing). Cet article parcourt les grandes idées du chapitre avec des analogies simples.

## Trois types de systèmes

Avant de plonger, le chapitre pose un modèle mental utile :

- **Services (en ligne) :** répondent aux requêtes au fur et à mesure. La latence compte. Pensez : un serveur web.
- **Traitement par lots (hors ligne) :** digère une grande entrée fixe et produit une sortie. Le débit compte ; la latence se mesure en minutes ou en heures. Pensez : les rapports de nuit.
- **Traitement de flux (quasi temps réel) :** entre les deux — traite les événements à mesure qu'ils arrivent, mais sans devoir répondre instantanément à un utilisateur. (C'est le chapitre suivant.)

Le reste du chapitre porte sur le deuxième.

## Commencer petit : les pipes Unix

DDIA commence par une observation savoureuse : quelques lignes de shell Unix peuvent accomplir beaucoup.

```bash
cat access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head
```

Ce pipeline trouve les URLs les plus visitées dans un fichier de log. Chaque outil fait une seule chose, lit depuis stdin, écrit sur stdout, et le shell les assemble. Les fichiers sont l'interface universelle.

C'est la **philosophie** dont hérite le traitement par lots : de petits outils composables, des entrées immuables, des sorties déterministes. Si quelque chose tourne mal, on relance. Le fichier d'entrée n'a pas changé.

Le hic : une seule machine ne suffit plus quand votre « fichier de log » fait 100 To.

## MapReduce : des pipes Unix pour mille ordinateurs

**MapReduce** (popularisé par Google, puis par Hadoop en open source) est essentiellement la même idée, mais étalée sur un cluster.

Vous écrivez deux fonctions :

- **Mapper :** prend un enregistrement à la fois, émet zéro ou plusieurs paires `(clé, valeur)`.
- **Reducer :** reçoit toutes les valeurs pour une clé donnée, produit une sortie.

Entre les deux, le framework fait la magie : il **shuffle** (redistribue) toutes les paires `(clé, valeur)` à travers le réseau pour que tout ce qui partage la même clé atterrisse sur le même reducer. Ce shuffle est la partie coûteuse.

### Un exemple concret : compter les mots

- Le mapper lit une ligne et émet `(mot, 1)` pour chaque mot.
- Le shuffle regroupe tous les `1` de `"the"` ensemble, tous les `1` de `"cat"` ensemble, etc.
- Le reducer somme les valeurs pour chaque clé.

La même forme fonctionne pour l'analyse de logs, la construction d'index de recherche, le calcul de recommandations — tout ce que l'on peut formuler comme « grouper par quelque chose, puis agréger ».

### Les jointures en MapReduce

Joindre deux jeux de données (par exemple, les utilisateurs et les clics) sans faire de lookups aléatoires en base est un thème récurrent :

- **Sort-merge join :** les deux côtés émettent la même clé (par ex. `user_id`) ; le reducer voit tous les clics et l'enregistrement utilisateur ensemble.
- **Broadcast hash join :** le petit côté est chargé en mémoire sur chaque mapper, le gros côté défile en streaming.
- **Partitioned hash join :** les deux côtés sont pré-partitionnés sur la clé de jointure.

Ces noms sonnent sophistiqués, mais l'idée est la même que celle qu'on utiliserait sur un laptop — simplement distribuée.

### Pourquoi on a cessé d'aimer MapReduce

MapReduce était révolutionnaire, mais l'écrire est pénible :

- Chaque job est **uniquement** map + reduce. Tout ce qui est plus complexe devient une chaîne de jobs.
- Les résultats intermédiaires entre les jobs sont **écrits sur disque** (HDFS) — lent.
- Un workflow de 10 étapes lit et écrit le dataset 10 fois.

C'est là qu'entre en scène Apache Spark.

## Apache Spark : les mêmes idées, une exécution plus intelligente

Spark conserve le même modèle mental — partitionner les données, appliquer des fonctions, shuffle quand nécessaire — mais corrige les parties pénibles :

- **Exécution en mémoire :** les données intermédiaires restent en RAM entre les étapes quand c'est possible. Énorme gain de vitesse.
- **Opérateurs plus riches :** pas seulement map/reduce. Vous disposez de `filter`, `join`, `groupBy`, `reduceByKey`, `aggregate`, etc., via une API fluide.
- **Planificateur DAG :** Spark construit un graphe (DAG, graphe acyclique dirigé) de toutes les transformations que vous avez décrites, puis optimise le plan complet avant de l'exécuter. Il peut fusionner des étapes, choisir des stratégies de jointure et éviter les shuffles inutiles.
- **Resilient Distributed Datasets (RDDs) :** l'abstraction centrale — une collection partitionnée qui connaît sa propre dérivation (lineage). Si une partition est perdue, Spark la recalcule à partir de son lineage. Pas besoin de réplication.

L'expérience côté utilisateur ressemble davantage à écrire du Python ou du SQL qu'à écrire des jobs MapReduce. Un pipeline du type « lire un CSV, filtrer, joindre, grouper, écrire en Parquet » se lit comme un seul programme — Spark se charge de le distribuer.

J'ai construit un petit dépôt pour parcourir ces idées de manière pratique : [learn-apache-spark](https://github.com/tonystrawberry/learn-apache-spark).

## Dataflow engines et APIs de plus haut niveau

Spark est un exemple d'une catégorie plus large que le chapitre appelle les **dataflow engines** (moteurs de flux de données) — d'autres : Flink, Tez. Ils généralisent l'idée de MapReduce en DAGs arbitraires d'opérateurs.

Au-dessus de ces moteurs reposent des **APIs de plus haut niveau** qui se compilent en plans dataflow :

- **SQL sur big data** (Hive, Spark SQL, Presto)
- **APIs DataFrame** (Spark DataFrames, pandas-on-Spark)
- **Traitement de graphes** (style Pregel : GraphX, Giraph)
- **Machine learning** (MLlib)

La leçon : la plupart des gens n'écrivent plus de map/reduce à la main. Ils écrivent du SQL ou du code DataFrame, et le moteur s'occupe de la plomberie distribuée.

## Concevoir pour le batch : quelques principes récurrents

Quelques idées reviennent sans cesse dans le chapitre :

- **Entrées immuables.** On ne modifie jamais les données source. On produit une nouvelle sortie. Si le job est faux, on corrige le code et on relance — l'entrée est toujours là.
- **Fonctions déterministes.** Les mappers et reducers doivent produire la même sortie pour la même entrée. C'est ce qui rend les retries sûrs.
- **Tolérance aux pannes par ré-exécution.** Si un nœud meurt, le framework relance simplement ce morceau de travail ailleurs. Possible uniquement grâce aux deux points précédents.
- **Séparation du stockage et du calcul.** Les données vivent dans HDFS / S3 / object storage ; les clusters de calcul se montent et se démontent par-dessus.

## Batch vs. bases de données temps réel

Pourquoi utiliser le batch quand on a des bases de données sophistiquées ?

- **Coût :** les jobs batch utilisent un stockage lent et bon marché et du compute à la demande. Bien moins cher par octet que de servir depuis une base transactionnelle.
- **Débit :** scanner 100 To séquentiellement est rapide. Faire la même chose sous forme de 100 To de requêtes individuelles contre une base, non.
- **Découplage :** la sortie batch (par ex. un index de recherche, un fichier de recommandations) est ensuite chargée dans un système de service. Construire hors ligne, servir en ligne — la défaillance du pipeline batch ne fait pas tomber le site.

## Points clés à retenir

- **Les pipes Unix** sont l'ancêtre philosophique : petits outils, fichiers immuables, composabilité.
- **MapReduce** est cette idée distribuée sur un cluster, avec un shuffle au milieu.
- **MapReduce est pénible** parce que tout passe par le disque entre les étapes et que seul map+reduce est proposé.
- **Apache Spark** conserve le modèle mais exécute en mémoire, propose des opérateurs riches et planifie l'ensemble du DAG avant de l'exécuter.
- **Les RDDs** rendent Spark tolérant aux pannes via le lineage plutôt que la réplication.
- **Les dataflow engines + APIs SQL/DataFrame** sont la façon dont la majorité du travail batch se fait aujourd'hui — on écrit rarement du map/reduce brut.
- **Immuabilité et déterminisme** sont ce qui rend le traitement par lots distribué sûr à relancer.
- **Batch et systèmes en ligne sont partenaires :** le batch construit l'artefact (index, modèle, rapport) ; les systèmes en ligne le servent.

---
> 🌐 *Traduit par Claude*
