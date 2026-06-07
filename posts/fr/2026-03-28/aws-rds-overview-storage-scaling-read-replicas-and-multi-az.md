---
title: "AWS RDS, Aurora, RDS Proxy et ElastiCache"
date: "2026-03-28"
excerpt: "SQL géré et cache pour CloudOps : RDS/Aurora (dont Serverless et Global Database), RDS Proxy, et mise à l’échelle Redis/Memcached ElastiCache, patterns et métriques."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "rds", "aurora", "elasticache", "redis", "rds-proxy", "mysql", "postgresql", "sql", "cloudwatch", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 8
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Ce qu’est RDS

**Amazon RDS (Relational Database Service)** est un service **géré** de bases relationnelles pour des moteurs qui utilisent le **SQL**. AWS provisionne et exploite la couche base ; vous **ne** vous connectez **pas** en SSH sur l’hôte sous-jacent (frontière du service géré).

### Moteurs pris en charge (connaître la liste)

- **PostgreSQL**, **MySQL**, **MariaDB**
- **Oracle**, **Microsoft SQL Server**, **IBM Db2**
- **Amazon Aurora** (propriétaire AWS ; pilotes **compatibles MySQL** ou **PostgreSQL** — voir section Aurora ci-dessous)

## RDS vs auto-géré sur EC2

RDS inclut le travail opérationnel que vous auriez sur EC2 :

- **provisionnement** et **patch OS** automatisés (pour la pile DB gérée par AWS)
- **sauvegardes continues** et **restauration point dans le temps (PITR)**
- tableaux de bord et **métriques** de **monitoring**
- **read replicas** pour la montée en charge en lecture
- **Multi-AZ** pour haute disponibilité / reprise après sinistre
- **fenêtres de maintenance** pour les mises à niveau
- **montée en charge verticale** (classe d’instance plus grande) et **horizontale en lecture** (réplicas)
- stockage sur **EBS** (modèle perf/coût familier)

Compromis : **pas d’accès shell** à l’instance DB — utiliser les fonctionnalités RDS, Parameter Groups et le monitoring.

## Autoscaling du stockage RDS

Évite les augmentations manuelles de stockage quand la base se remplit.

**Comportement (règles du cours — confirmer dans la doc actuelle) :**

- Vous définissez un plafond **maximum** d’espace alloué.
- L’autoscaling peut se déclencher quand :
  - **espace libre < 10 %** de l’espace actuellement alloué, **et**
  - la condition de faible espace dure **> 5 minutes**, **et**
  - **≥ 6 heures** depuis la **dernière** modification de stockage.

**Cas d’usage :** charges à croissance imprévisible. Pris en charge sur les **moteurs RDS** (selon la formation).

## Read replicas

**Objectif :** faire monter les **lectures** hors du primaire (writer).

- Jusqu’à **15** read replicas par source (chiffre d’examen).
- Placement : **même AZ**, **inter-AZ**, ou **inter-régions**.
- Réplication **asynchrone** → les réplicas sont **éventuellement cohérents** (read-your-writes **non** garanti immédiatement).
- Les réplicas acceptent du SQL **lecture seule** (ex. `SELECT`) ; pas pour `INSERT` / `UPDATE` / `DELETE`.
- **Promouvoir** un réplica en primaire **autonome** (il quitte la topologie de réplication et devient sa propre DB lecture/écriture).

**Changement applicatif :** les lecteurs doivent utiliser les **endpoints réplica** (chaînes de connexion / couche de routage) — le DNS primaire seul ne répartit pas les lectures automatiquement.

### Cas d’usage classique : reporting

Exécuter **analytics/reporting** sur un **réplica** pour protéger le trafic **OLTP** sur le primaire.

### Coût de transfert de données

- **Même région**, AZ différente : le trafic de réplication est typiquement **gratuit** (exception service géré dans le matériel de cours).
- **Réplica inter-régions** : la réplication entraîne des **frais de transfert inter-régions**.

## Multi-AZ (haute disponibilité / DR)

**Objectif :** **disponibilité** et **basculement**, **pas** la montée en charge en lecture.

- **Un nom DNS** pour l’application.
- Réplication **synchrone** du **primaire** en **AZ A** vers un **standby** en **AZ B**.
- Le standby **n’est pas** interrogé en lecture ou écriture en fonctionnement normal — il existe pour le **basculement**.
- En cas de panne primaire (panne AZ, instance, stockage, partition réseau vers le primaire, etc.), le **basculement automatique** promeut le standby → nouveau primaire. Les apps qui **réessayent** le même endpoint récupèrent souvent sans changement DNS manuel.

### Read replica + Multi-AZ

**Oui :** une **read replica** peut elle-même être déployée **Multi-AZ** pour la DR sur ce réplica (torsion d’examen courante).

## Single-AZ → Multi-AZ (examen)

- Opération **sans interruption** du point de vue utilisateur : **modifier** l’instance et **activer Multi-AZ** (pas d’arrêt/redémarrage app requis pour ce seul basculement — suivre la doc AWS pour exceptions).

**En coulisses (conceptuel) :** RDS prend un **snapshot** du primaire, **restaure** un **standby**, puis établit la réplication **sync** jusqu’à rattrapage.

### Déclencheurs de basculement Multi-AZ (à mémoriser pour l’examen)

Le basculement du primaire vers le standby peut survenir quand :

- **Panne de l’instance DB primaire** ou **panne du stockage sous-jacent**
- **OS primaire** en **patch logiciel** (maintenance gérée)
- **Perte de connectivité réseau** vers le primaire
- **Opérations manuelles** qui forcent un remplacement : ex. **changement de type d’instance**, primaire **occupé / sans réponse**
- **Panne AZ** affectant l’AZ primaire
- **Basculement manuel :** **Reboot with failover** dans la console/CLI

## Sauvegardes automatisées vs snapshots (RDS)

### Sauvegardes automatisées (continues + PITR)

- Flux de sauvegarde **continu** avec **restauration point dans le temps (PITR)** dans la fenêtre de rétention.
- **Rétention :** **0–35 jours** (`0` = sauvegardes automatisées **désactivées**).
- S’exécutent pendant une **fenêtre de sauvegarde** configurable (sous-ensemble du planning **maintenance**).
- À la **suppression d’instance**, vous pouvez choisir de **conserver** les sauvegardes automatisées pendant une période (options console).
- La **restauration** crée toujours une **nouvelle** instance DB — **pas** de restauration sur place sur le même ID d’instance.

### Snapshots manuels

- **Impact IO :** le snapshot peut provoquer une brève pause (**secondes à minutes**) en **Single-AZ** ; avec **Multi-AZ**, le snapshot est pris depuis le **standby** pour réduire l’impact sur le primaire.
- Le **premier** snapshot est **complet** ; les suivants sont **incrémentaux** (idée proche d’EBS).
- Les **snapshots manuels n’expirent pas** tant que vous ne les supprimez pas.
- **Snapshot final** optionnel à la suppression d’instance.
- **Partager** des snapshots **inter-comptes** (comme EBS) : seulement snapshots **manuels** (ou **copier** un snapshot auto en manuel d’abord). Les **sauvegardes automatisées** elles-mêmes **ne** se partagent **pas** telles quelles.
- **Snapshots chiffrés :** le partage exige que l’autre compte ait des permissions **KMS** sur la **CMK** utilisée pour le snapshot (même schéma qu’EBS).

## Événements RDS, abonnements et journaux base

### Événements

RDS enregistre des **événements** pour instances, snapshots, parameter groups, security groups, etc. (ex. état **pending → running**, sauvegarde démarrée, modifications).

- **Abonnements aux événements** → topic **SNS** ; filtrer par **type de source** (instance DB, snapshot, parameter group, **cluster**, etc.) et **catégorie**.
- Les mêmes événements peuvent s’intégrer à **EventBridge** pour l’automatisation par règles.

### Fichiers journaux → CloudWatch Logs

Les moteurs DB exposent des journaux (ex. **error**, **slow query**, **general**, **audit** — dépend du moteur). Activer les **exports de journaux** sur l’instance pour publier vers **CloudWatch Logs**, puis utiliser des **metric filters** (ex. compter `ERROR`) et des **alarmes** → **SNS** pour les alertes opérateurs.

**Console :** onglet **Events** (historique récent), **Logs & events** sur l’instance, **Modify** → cases d’export de journaux.

## Métriques CloudWatch pour RDS

### Standard (niveau hyperviseur)

Exemples : `DatabaseConnections`, `SwapUsage`, `ReadIOPS` / `WriteIOPS`, `ReadLatency` / `WriteLatency`, `ReadThroughput` / `WriteThroughput`, `DiskQueueDepth`, `FreeStorageSpace`, **CPU**.

**Intuition dépannage :** **latence** élevée ou **DiskQueueDepth** → goulot d’étranglement stockage ; **ReadIOPS** saturés → peut nécessiter plus d’**IOPS**/volume plus grand ; **CPU** élevé → classe plus grande ou tuning de requêtes.

### Enhanced Monitoring

- Agent sur l’**instance DB** (pas seulement l’hyperviseur) : **50+** métriques OS — CPU **process/thread**, mémoire, **filesystem**, I/O disque.
- Granularité jusqu’à **1 seconde** (le cours a montré **60 s** par défaut) ; nécessite un **rôle IAM** pour l’agent de monitoring.

**Console :** vue Monitoring → liste déroulante **CloudWatch** vs **Enhanced monitoring** vs **OS process list**.

## RDS Performance Insights

Charge **base de données** visuelle dans le temps ; découper par :

- **Waits** — quelle ressource domine (**CPU**, **I/O**, **locks**, etc.) → oriente scale **compute** vs **stockage/IOPS**.
- **SQL** — requêtes coûteuses à optimiser avec les propriétaires app.
- **Hosts** — quels serveurs app martèlent la DB (peut-être besoin de **read replica** ou throttling).
- **Users** — quels logins DB poussent la charge.

La **charge** est présentée comme **sessions actives** (spécifique au moteur). Palier **payant** optionnel : **recommandations proactives**.

**Prise en charge :** pas sur toutes les classes d’instance (cours : **`db.t2.*`** souvent **non pris en charge**) ; activer sur **Modify** pour les classes prises en charge avec une période de **rétention** pour l’historique.

## Amazon Aurora (haut niveau)

Moteur **propriétaire** AWS ; **compatible fil** avec **PostgreSQL** ou **MySQL** (utiliser ces pilotes/clients).

### Pourquoi Aurora (cadrage examen)

- Stockage et réplication **optimisés cloud** — le cours cite de grands multiples de perf vs **RDS** même moteur (les chiffres varient selon la charge ; traiter comme histoire **plus rapide / plus scalable**).
- Stockage **auto-croissant** de **10 GiB** jusqu’à **128 TiB** (le cours disait **256 TiB** — vérifier les limites Aurora actuelles).
- Jusqu’à **15** read replicas avec **faible lag réplica** (cours : **sous 10 ms** typique).
- **Basculement** beaucoup plus rapide que RDS Multi-AZ classique (cours : **&lt; ~30 secondes** en moyenne pour basculement writer).
- **Prix catalogue** plus élevé que RDS mais souvent **meilleure efficacité à l’échelle** (questions trade-off coût/perf).

### Topologie stockage (conceptuelle)

- **Six** copies des données sur **trois** AZ ; **quorum** pour écritures (**4/6**) et lectures (**3/6**) — survit à une perte **AZ** et supporte **auto-réparation** / réparation par les pairs.
- Volume de **cluster** logique **partagé** qui **strip** sur de nombreux petits volumes (vous ne gérez pas les segments).

### Endpoints cluster (critiques pour les examens)

- **Writer endpoint** — résout toujours vers le **primaire actuel** (lecture/écriture). Survit au **basculement** sans reconfiguration app.
- **Reader endpoint** — équilibrage de charge au **niveau connexion** sur les **réplicas Aurora** (pas par requête). Pour la montée en charge en lecture.
- Les instances individuelles ont aussi des **instance endpoints** pour connexions ciblées.

**Réplicas :** jusqu’à **15** ; **n’importe quel** réplica peut être promu si le writer tombe. Réplicas **inter-régions** pris en charge. Politique **auto scaling** peut ajouter/supprimer des réplicas selon **CPU** ou **connexions** (bornes min/max).

### Récap pratique Aurora (console)

- **Standard create** → **Aurora MySQL** ou **PostgreSQL** ; filtrer versions moteur pour les fonctionnalités (**Global Database**, **Parallel Query**, **Serverless v2**).
- **Cluster storage :** **Standard** vs **IO-Optimized** (charges I/O élevées).
- **Instances :** classes burstable/provisionnées, ou **Serverless v2** (**ACU** min/max au lieu d’une classe fixe).
- **Disponibilité :** ajouter un **reader** dans une autre AZ pour HA + capacité lecture.
- **Endpoints :** **writer** + **reader** sur le **cluster** ; security group sur **3306** (MySQL) etc.
- Options : **IAM DB auth**, **Kerberos**, **Enhanced Monitoring**, **chiffrement**, **backtrack**, exports journaux, **deletion protection**, **Local write forwarding** (écritures sur un reader transférées au writer — simplifie certains patterns app).
- **Global Database :** **Add AWS Region** (tailles moteur/instance compatibles selon console).
- **Ordre suppression :** retirer les **readers** d’abord, puis **writer**, puis **cluster**.

### Aurora Serverless

**Aurora Serverless** (v2 dans les produits actuels — le cours cadre l’idée) met à l’échelle la **capacité avec la charge** via des **unités de capacité Aurora (ACUs)** au lieu de choisir une classe d’instance fixe.

- Convient aux charges **intermittentes**, **en pics**, ou **imprévisibles** avec moins de **planification de capacité**.
- **Payer** la capacité **utilisée** (souvent facturation **à la seconde** en marketing — confirmer la tarification).
- Utilise toujours le modèle de stockage **Aurora partagé** ; une **flotte proxy / routeur gérée** est devant la capacité DB pour que la montée en charge du **compute** soit **opaque** pour l’app (vous vous connectez au **cluster** comme d’habitude).

### Aurora Global Database

**Global Database** étend Aurora sur les régions :

- **Une région primaire** — **toutes les écritures** y vont.
- Jusqu’à **10** régions **secondaires** (copies lecture seule pour lectures locales — vérifier la limite actuelle dans la doc).
- Lag réplication primaire → secondaire typiquement **&lt; ~1 seconde** (chiffre cours).
- Jusqu’à **16** read replicas **par** région secondaire (chiffre cours).
- **Reprise après sinistre :** promouvoir une région secondaire peut atteindre un **RTO** sous **~1 minute** dans les exemples de formation.

**Règle applicative :** les secondaires servent les **lectures** ; les **écritures** doivent cibler la région **primaire**.

### Métriques CloudWatch Aurora (exemples)

- **`AuroraReplicaLag`** — lag pour une instance réplica donnée.
- **Replica lag min/max** — extrêmes sur les instances du cluster ; **lag élevé** → les readers peuvent servir des données **périmées** (**cohérence éventuelle** entre réplicas).
- **`DatabaseConnections`** — connexions courantes par instance.
- **Insert latency** (et similaires) — temps moyen pour opérations **INSERT** (dépannage perf).

### Sauvegardes Aurora, backtrack et clonage

| Fonctionnalité | Comportement |
|----------------|--------------|
| **Sauvegardes automatisées** | Rétention **1–35 jours** ; **impossible** de désactiver sur Aurora (selon cours). **PITR** vers **nouveau cluster** (comme RDS). |
| **Backtrack** | Rembobinage **sur place** du **cluster** (pas de nouveau cluster) dans une fenêtre (cours : jusqu’à **72 heures**). **Aurora MySQL** seulement dans le matériel de formation — confirmer le support moteur dans la doc. |
| **Clonage de base** | **Nouveau cluster** qui **partage** initialement le **volume de stockage cluster** de la source ; **copy-on-write** quand les changements divergent — moyen **rapide** de monter du **staging** depuis la **prod**. |

## Sécurité RDS et Aurora

### Chiffrement au repos

- Utilise des CMK **KMS** ; le **choix de chiffrement est fixé au premier lancement** de l’instance primaire.
- **Read replicas :** si le primaire **n’est pas chiffré**, vous **ne pouvez pas** créer directement un réplica **chiffré** — **snapshot** DB non chiffrée → **restaurer** en **chiffré** (nouvelle instance).
- Pour chiffrer une DB **non chiffrée** existante : **snapshot → restaurer chiffré**.

### Chiffrement en transit (TLS)

Les clients devraient utiliser **TLS** avec les certificats CA **RDS** d’AWS (téléchargeables depuis la documentation AWS).

### Authentification

- **Nom d’utilisateur / mot de passe** (par défaut).
- **Authentification base IAM** — ex. le **rôle d’instance EC2** obtient un jeton d’auth au lieu d’embarquer des mots de passe (contrôle IAM central).

### Réseau

Les **security groups** contrôlent l’accès **port**/IP source / SG source — frontière réseau principale pour RDS/Aurora dans un VPC.

### Modèle d’accès

- **Pas de SSH** vers les instances RDS/Aurora gérées — **sauf** **RDS Custom** (produit spécial avec plus d’accès OS).

### Audit

Activer les **journaux d’audit** moteur ; pour longue rétention et recherche, envoyer vers **CloudWatch Logs** (puis S3/Athena/OpenSearch selon besoin).

## Amazon RDS Proxy

**RDS Proxy** est un **proxy base de données** **entièrement géré**, **hautement disponible** (multi-AZ), à **mise à l’échelle serverless** dans votre **VPC**.

### Pourquoi l’utiliser

- **Connection pooling :** de nombreux workers app (ou exécutions **Lambda** concurrentes) ouvrent des connexions **courtes** ; le proxy les **multiplexe** sur un **plus petit** ensemble de **connexions DB réelles** → moins de stress **CPU/RAM** sur RDS/Aurora, moins de **timeouts** et d’**orages de connexions**.
- **Basculement plus rapide :** le cours cite jusqu’à **~66 %** de réduction de perturbation de basculement pour **RDS Multi-AZ** ou basculements **Aurora** — les apps parlent toujours à l’**endpoint proxy** ; le proxy **recible** vers le nouveau writer.
- **Authentification IAM** + **Secrets Manager** pour les **identifiants** (pattern fort optionnel) : indice d’examen « imposer IAM DB auth + secrets » → **RDS Proxy**.

### Compatibilité et connectivité

- Moteurs : **MySQL**, **PostgreSQL**, **MariaDB**, **SQL Server**, **Aurora** (compatible MySQL et PostgreSQL).
- **Pas** de réécriture logique app au-delà d’utiliser l’**endpoint proxy** au lieu de l’endpoint DB (même protocole fil SQL).
- **Pas accessible publiquement** — seulement depuis **dans le VPC** (et réseaux connectés).

### Lambda + RDS

**Lambda** monte en charge vers **nombreuses exécutions concurrentes** ; sans proxy, chaque fonction peut ouvrir une **nouvelle connexion DB** → épuisement de la **limite de connexions**. Pointer les Lambdas vers **RDS Proxy** pour que le **pool** absorbe le fan-out.

## Amazon ElastiCache

**ElastiCache** est le service géré pour les moteurs **compatibles Redis** (**Redis OSS**, **Valkey** comme alternative Redis dans la console) et **Memcached** — stockages **en mémoire** à **très faible latence**.

### Pourquoi mettre en cache

- **Décharger les lectures** de **RDS** : vérifier le cache → **cache hit** retour ; **cache miss** → lire **RDS**, puis **remplir** le cache pour les hits suivants.
- **Stockage de session** pour apps **stateless** : toute instance app peut lire les données de session depuis le cache après login.

**Réalité :** la mise en cache exige des **changements applicatifs** (stratégie de lookup, **TTL**, **invalidation** quand les données source changent — la partie difficile).

### Redis vs Memcached (niveau examen)

| | **Redis** | **Memcached** |
|---|-----------|----------------|
| **Réplication / HA** | **Multi-AZ** avec **basculement auto** ; **read replicas** (jusqu’à **5** en histoire cluster-mode-disabled) | Modèle classique : **pas** de réplication ; partition **multi-nœuds shardée** ; **plus simple** mais **volatile** |
| **Durabilité** | Persistance **AOF**, **backup/restore** (dépend du moteur) | Souvent **purement éphémère** ; nuances backup/restore selon mode de déploiement (ex. **serverless** vs auto-géré dans le cours) |
| **Structures de données** | **Sets**, **sorted sets** (ex. **classements**) | Simple **clé/valeur** |
| **Threading** | Simplifié : surtout mono-thread par processus | Architecture **multi-thread** peut aider le débit |

### Créer un cluster (récap console)

- Moteur : **Valkey** (compatible Redis), **Redis OSS**, ou **Memcached** ; cluster **Serverless** vs **basé sur nœuds**.
- **Cluster mode disabled** — un **shard**, un **primary**, **0–5** réplicas ; **cluster mode enabled** — **plusieurs shards** pour scale-out horizontal.
- **Multi-AZ** + **basculement auto** (Redis) pour HA (coût supplémentaire).
- **Subnet group**, **security groups**, **chiffrement au repos** (KMS), **chiffrement en transit** (active **Redis AUTH** token ou **ACL user groups**).
- Journaux vers **CloudWatch Logs** (slow log, engine log). Option **Outposts** pour empreinte on-prem.

**Endpoints :** **primary** et **reader** (Redis avec réplicas) pour connexion app.

### Mise à l’échelle Redis (SysOps / examen)

**Cluster mode disabled**

- **Horizontal :** ajouter/supprimer des **read replicas** (max **5**).
- **Vertical :** changer le **type de nœud** — en coulisses ElastiCache provisionne un **nouveau node group**, **réplique** les données, met à jour le **DNS** → **transparent** pour les apps.

**Cluster mode enabled**

- **Online scaling :** le cluster reste **up** ; **baisse de perf** possible pendant le changement.
- **Offline scaling :** cluster **indisponible** pendant le changement ; permet des mouvements structurels plus gros (ex. certaines **mises à niveau moteur**).
- **Horizontal :** **resharding** — ajouter/supprimer des **shards** ; **rééquilibrer** l’espace de clés entre shards.
- **Vertical :** changer le **type de nœud** du shard — souvent **online** dans de nombreux cas.

**Métriques :** **Evictions** (clés non expirées supprimées faute de place) → ajuster **politique d’éviction**, nœuds **plus gros**, ou **plus** de shards/réplicas ; **CPUUtilization** ; **SwapUsage** (garder bas, ex. **&lt; ~50 Mo** dans le cours) ; **CurrConnections** (churn connexions / problèmes pool) ; **DatabaseMemoryUsagePercentage** ; **ReplicationLag** / **BytesUsedForReplication** (on veut un **lag faible**).

### Mise à l’échelle Memcached

- **Cluster :** **1–40** nœuds (limite souple — demander une augmentation pour plus).
- **Horizontal :** ajouter/supprimer des **nœuds** ; les clients utilisent **configuration endpoint** + **Auto Discovery** pour apprendre **toutes** les IPs des nœuds **sans** coder chaque nœud en dur.
- **Vertical :** créer un **nouveau** cluster avec des nœuds plus gros → **pointer l’app** vers les **nouveaux** endpoints → **supprimer** l’ancien cluster (**basculement manuel**). Le nouveau cluster démarre **vide** — l’app doit **repeupler** (pas de déplacement auto des données comme backup/restore Redis simple dans l’histoire Memcached).

**Auto Discovery :** le client frappe le **config endpoint** → le premier nœud renvoie des **métadonnées** listant **toutes** les IPs des nœuds → le client se connecte au nœud approprié pour les clés.

**Métriques :** thèmes similaires — **Evictions**, **CPUUtilization**, **SwapUsage**, **CurrConnections**, **FreeableMemory**.

## Créer et exploiter une instance RDS (récap pratique)

**Console :** RDS → **Databases** → **Create database**.

- **Easy create** vs **configuration complète** — la complète expose les modèles Multi-AZ (ex. instance DB Multi-AZ deux instances, cluster trois instances) pour setups type prod ; **free tier** souvent **single-AZ** seulement.
- **Engine** (ex. MySQL), **version**, **instance class** (ex. `db.t4g.micro` en free tier).
- **Identifiants :** mot de passe auto-géré ou **Secrets Manager** (plus sécurisé, **coût supplémentaire**).
- **Auth :** mot de passe et option **IAM DB authentication**.
- **Stockage :** taille (ex. 20 GiB) + **storage autoscaling** optionnel avec plafond **max**.
- **Connectivité :** VPC, subnet group, **public access** (oui/non), **security group** nouveau ou existant (entrant **3306** pour MySQL depuis votre IP en démos).
- **Port** (défaut **3306** pour MySQL).
- **Monitoring :** Standard vs **Enhanced Monitoring** ; export **journal** optionnel vers CloudWatch.

**Client :** se connecter avec n’importe quel client SQL en utilisant **endpoint**, **port**, **user**, **password**, **nom de base**.

**Opérations montrées :** métriques CloudWatch (CPU, connexions), **snapshots manuels**, **restauration PITR**, **copie snapshot inter-régions**, **créer read replica**, **modifier** Multi-AZ sur un réplica.

**Nettoyage :** désactiver **deletion protection** (modify → apply), puis **delete** (snapshot final optionnel).

## Points clés

- RDS = **SQL géré** ; moteurs incluant **Aurora**, Postgres, MySQL, MariaDB, Oracle, SQL Server, Db2.
- **Storage Autoscaling** utilise **seuils d’espace libre**, **durée**, **cooldown**, et un plafond **max** de taille.
- **Read replicas** = **async**, **cohérence éventuelle**, **scale lecture** / reporting / **promotion** ; réplication **même région inter-AZ** **gratuite**, **inter-régions** transfert **payante**.
- **Multi-AZ** = standby **sync**, **un endpoint**, **basculement auto** ; **pas** un pool de lecture ; peut combiner avec **Multi-AZ sur réplicas**. Connaître les **déclencheurs de basculement** (panne, patch, réseau, changement de classe, sans réponse, panne stockage, panne AZ, **reboot with failover**).
- **Activer Multi-AZ** sur une DB existante est **en ligne** ; implémentation interne **snapshot + restore + sync**.
- **Sauvegardes auto :** rétention **0–35** jours, **PITR**, restauration → **nouvelle** instance. **Snapshots :** **manuels** persistants, **partageables** (chiffré nécessite **KMS**), snapshots **Multi-AZ** depuis le **standby**.
- **Événements** → abonnements **SNS** ou **EventBridge** ; **journaux** → **CloudWatch Logs** + **metric filters** / **alarmes**.
- **CloudWatch** standard vs **Enhanced Monitoring** (niveau OS) ; **Performance Insights** pour **Waits/SQL/users/hosts** (pas sur toutes les familles d’instance).
- **Aurora :** compatible **MySQL/Postgres**, stockage partagé **auto-croissant**, histoire quorum **6/3 AZ**, endpoints **writer** + **reader**, **basculement rapide**, **backtrack** (sur place, MySQL dans le cours), **clone** (COW), réplicas **inter-régions** / **Global Database** (**écritures primaires**, réplication **&lt;~1 s**, histoire **DR RTO**).
- **Aurora Serverless :** mise à l’échelle style **ACU**, **pay-per-use**, bon pour charges **en pics** ; couche **proxy** abstrait le scaling compute.
- **RDS Proxy :** **pooling**, adapté **Lambda**, **~66 %** d’amélioration basculement (cours), **IAM** + **Secrets Manager**, endpoint **VPC uniquement**.
- **ElastiCache :** tradeoffs **Redis** vs **Memcached** ; **cache-aside** + **sessions** ; patterns scaling **cluster mode** on/off ; Memcached vertical = **nouveau cluster** + **repointage** ; **Auto Discovery** pour clients Memcached.
- **Sécurité :** **KMS** au repos à la **création** ; **snapshot-restore** pour chiffrer ; **TLS** en transit ; **IAM DB auth** ; **SGs** ; pas de SSH sauf **RDS Custom** ; **journaux d’audit** → **CloudWatch Logs** pour rétention/analyse.

---
> 🌐 *Traduit par Claude*
