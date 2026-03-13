---
title: "DDIA Chapitre 3 : Stockage et récupération des données"
date: "2026-03-13"
excerpt: "Comment les bases de données stockent et récupèrent les données — des moteurs à structure de journal (LSM-trees) aux moteurs orientés pages (B-trees), en passant par les stratégies d'indexation, OLTP vs OLAP et le stockage orienté colonnes."
author: "Tony Duong"
category: "note"
tags: ["databases", "ddia", "architecture"]
---

## Vue d'ensemble

Ce chapitre explore comment les bases de données stockent les données en interne et comment elles les retrouvent lorsqu'on les interroge. Comprendre les moteurs de stockage vous aide à choisir la bonne base de données pour votre charge de travail et à en optimiser les performances. Les deux grandes familles sont les moteurs **à structure de journal** et les moteurs **orientés pages**.

## Les structures de données au cœur de votre base de données

### La base de données la plus simple : un journal en ajout seul

Le moteur de stockage le plus simple est un fichier en ajout seul (append-only). L'écriture est rapide (O(1)), mais la lecture nécessite de parcourir l'intégralité du fichier (O(n)). Pour rendre les lectures efficaces, il faut un **index** — une structure de données supplémentaire dérivée des données primaires qui sert de repère.

**Compromis clé :** Les index accélèrent les lectures mais ralentissent les écritures, car l'index doit être mis à jour à chaque écriture. C'est pourquoi les bases de données n'indexent pas tout par défaut — vous choisissez les index en fonction de vos schémas de requêtes.

### Hash Indexes

La stratégie d'indexation la plus simple : maintenir une table de hachage en mémoire où chaque clé correspond à l'offset en octets dans le fichier de données. C'est essentiellement ce que fait Bitcask (le moteur de stockage par défaut de Riak).

- Fonctionne bien quand vous avez un nombre limité de clés avec des mises à jour fréquentes
- Toutes les clés doivent tenir en mémoire
- Les requêtes par plage ne sont pas efficaces (impossible de balayer entre `kitty00000` et `kitty99999`)

**Compaction :** Puisque le journal est en ajout seul, il croît indéfiniment. La compaction fusionne les segments du journal en éliminant les clés dupliquées et en ne conservant que la valeur la plus récente.

### SSTables et LSM-Trees

**Sorted String Tables (SSTables) :** Comme les segments indexés par hachage, mais les paires clé-valeur sont triées par clé.

Avantages par rapport aux hash indexes :
- La fusion de segments est efficace (similaire au tri par fusion)
- Un index clairsemé en mémoire suffit — pas besoin de chaque clé, juste quelques-unes, et on balaye entre elles
- Les blocs entre les entrées de l'index peuvent être compressés

**LSM-Trees (Log-Structured Merge-Trees) :** Le schéma complet du moteur de stockage :
1. Les écritures vont dans un arbre équilibré en mémoire (la **memtable**)
2. Quand la memtable atteint une taille suffisante, elle est vidée sur disque sous forme de SSTable
3. Les lectures vérifient d'abord la memtable, puis le segment le plus récent sur disque, puis le suivant plus ancien, etc.
4. La fusion et la compaction en arrière-plan maintiennent un nombre de segments gérable

Utilisé par : LevelDB, RocksDB, Cassandra, HBase, Lucene (pour son dictionnaire de termes).

Les **Bloom filters** sont couramment utilisés pour éviter des lectures disque inutiles pour des clés qui n'existent pas.

### B-Trees

La structure d'indexation la plus largement utilisée. Les B-trees divisent la base de données en **pages** de taille fixe (typiquement 4 Ko) et lisent ou écrivent une page à la fois — correspondant au matériel sous-jacent.

- Chaque page est identifiée par une adresse (comme un pointeur sur disque)
- Une page contient des clés et des références vers des pages enfants
- Le **facteur de branchement** est typiquement de plusieurs centaines
- Un B-tree à quatre niveaux avec des pages de 4 Ko et un facteur de branchement de 500 peut stocker jusqu'à 256 To

**Différence clé avec les LSM-trees :** Les B-trees modifient les pages **sur place**, tandis que les LSM-trees ne font qu'ajouter aux fichiers et ne modifient jamais sur place.

**Write-ahead log (WAL) :** Avant de modifier une page, la base de données écrit le changement dans un journal en ajout seul. Cela permet la récupération après crash.

### B-Trees vs. LSM-Trees

| Aspect | LSM-Trees | B-Trees |
|--------|-----------|---------|
| Débit en écriture | Généralement plus élevé | Plus faible (chaque écriture met à jour l'arbre) |
| Amplification d'écriture | Peut être élevée à cause de la compaction | Une écriture dans le WAL + une dans la page |
| Performance en lecture | Plus lente (vérification de plusieurs structures) | Plus rapide (un seul emplacement définitif) |
| Compression | Meilleure (pas de fragmentation de pages) | Un certain gaspillage d'espace dans les pages |
| Prévisibilité | La compaction peut interférer avec les lectures | Latence plus prévisible |
| Transactions | Plus difficile (une clé peut exister dans plusieurs segments) | Plus facile (une clé existe à un seul endroit) |

## Autres structures d'indexation

### Index secondaires

Contrairement aux index primaires, les index secondaires n'identifient pas de manière unique un enregistrement. Ils peuvent soit :
- Stocker la liste des identifiants de lignes correspondants (comme une liste de postings)
- Avoir chaque entrée pointant vers l'emplacement de la ligne

### Stocker les valeurs dans l'index

- **Clustered index :** Stocke les données réelles de la ligne dans l'index (par ex. clé primaire InnoDB)
- **Non-clustered index :** Stocke une référence (pointeur vers le heap file) vers l'emplacement de la ligne
- **Covering index :** Stocke certaines colonnes dans l'index pour permettre à certaines requêtes d'être résolues par l'index seul

### Index multi-colonnes

- **Concatenated index :** Concatène les colonnes dans un ordre défini (comme un annuaire : nom de famille, puis prénom)
- **Index multidimensionnels :** Pour les requêtes qui doivent chercher sur plusieurs colonnes simultanément (par ex. latitude ET longitude). Les R-trees sont un choix courant.

### Recherche plein texte et index flous

Lucene utilise une structure similaire aux SSTables pour son dictionnaire de termes, mais y ajoute un automate à états finis (similaire à un trie) pour permettre la correspondance approximative dans une distance d'édition donnée.

### Bases de données en mémoire

Tout garder en mémoire (par ex. VoltDB, MemSQL, Redis) :
- Plus rapide non pas parce qu'on évite les lectures disque (le cache du système d'exploitation s'en charge) mais parce qu'on évite le surcoût d'encodage des données pour le disque
- Peut offrir des structures de données difficiles à implémenter avec des index sur disque (par ex. les files de priorité et ensembles de Redis)
- La durabilité peut être assurée par le WAL, les snapshots ou la réplication

## Traitement transactionnel vs. analytique (OLTP vs. OLAP)

| Propriété | OLTP | OLAP |
|-----------|------|------|
| Schéma de lecture | Petit nombre d'enregistrements, récupérés par clé | Agrégation sur un grand nombre d'enregistrements |
| Schéma d'écriture | Accès aléatoire, écritures à faible latence depuis l'entrée utilisateur | Import en masse (ETL) ou flux d'événements |
| Utilisateurs principaux | Utilisateurs finaux via application web | Analystes internes |
| Taille du jeu de données | Go à To | To à Po |
| Goulot d'étranglement | Temps de recherche disque | Bande passante disque |

### Entrepôts de données (Data Warehousing)

Une copie séparée des données optimisée pour la lecture, extraite des systèmes OLTP via **ETL** (Extract–Transform–Load). Utilise un **schéma en étoile** (ou **schéma en flocon de neige**) :

- **Table de faits :** Chaque ligne représente un événement (par ex. une vente). Peut être extrêmement grande (des milliards de lignes).
- **Tables de dimensions :** Décrivent le qui, quoi, où, quand, pourquoi de l'événement (par ex. produit, client, magasin, date).

## Stockage orienté colonnes

Dans une requête analytique typique, on accède à quelques colonnes d'une table qui en contient des centaines. Le stockage orienté lignes gaspille des E/S en chargeant toutes les colonnes.

Le **stockage orienté colonnes** stocke toutes les valeurs de chaque colonne ensemble. Cela rend les requêtes analytiques beaucoup plus rapides car on ne lit que les colonnes nécessaires.

### Compression de colonnes

Les colonnes contiennent souvent de nombreuses valeurs répétées, ce qui les rend très compressibles :

- **Encodage bitmap :** Un bitmap par valeur distincte dans la colonne. Fonctionne bien lorsque le nombre de valeurs distinctes est petit par rapport au nombre de lignes.
- **Encodage par plages (run-length encoding) :** Compresse davantage les bitmaps.

Les colonnes compressées permettent également le **traitement vectorisé** — opérer sur des blocs de données de colonnes compressées directement à l'aide des instructions SIMD du processeur.

### Ordre de tri dans le stockage en colonnes

Les lignes doivent être dans le même ordre dans tous les fichiers de colonnes. On peut choisir un ordre de tri (par ex. par date, puis par produit) pour faciliter les requêtes courantes et améliorer la compression de la première clé de tri.

**Ordres de tri multiples :** Stocker les mêmes données triées de différentes manières (comme avoir plusieurs index secondaires). Vertica utilise cette approche.

### Écriture dans le stockage en colonnes

Les LSM-trees fonctionnent bien ici : les écritures vont dans un store en mémoire (orienté lignes), puis sont vidées sur disque en format colonnaire et fusionnées avec les fichiers de colonnes existants.

### Agrégation : vues matérialisées et cubes de données

- **Vue matérialisée :** Un cache précalculé d'agrégats courants (par ex. `SUM(amount) GROUP BY product_id, date`). Mise à jour lorsque les données sous-jacentes changent.
- **Cube de données (OLAP cube) :** Une grille d'agrégats selon plusieurs dimensions. Très rapide pour les requêtes précalculées mais peu flexible pour l'analyse ad-hoc.

## Points clés à retenir

1. **Deux familles de moteurs de stockage :** Les moteurs à structure de journal (LSM-trees) ajoutent les données et fusionnent en arrière-plan ; les moteurs orientés pages (B-trees) mettent à jour des pages de taille fixe sur place
2. **Les LSM-trees** tendent à avoir un débit d'écriture plus élevé ; les **B-trees** tendent à avoir des performances de lecture plus prévisibles
3. **OLTP et OLAP** ont des schémas d'accès fondamentalement différents et sont mieux servis par des moteurs de stockage différents
4. **Le stockage orienté colonnes** améliore considérablement les performances des requêtes analytiques en ne lisant que les colonnes pertinentes et en permettant une compression agressive
5. **L'indexation est un compromis :** chaque index accélère les lectures mais ajoute du surcoût aux écritures — choisissez en fonction de vos schémas de requêtes
6. **Les bases de données en mémoire** gagnent non pas en évitant les lectures disque mais en évitant le surcoût de l'encodage des données orienté disque

---
*Traduit par Claude*
