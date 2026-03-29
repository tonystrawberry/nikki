---
title: "Observabilité et gouvernance AWS : CloudWatch, EventBridge, CloudTrail et Config"
date: "2026-03-28"
excerpt: "Notes CloudOps sur CloudWatch, EventBridge (patterns API CloudTrail, Pipes, DLQ), Service Quotas, CloudTrail (intégrité des digests, trails org, latence EventBridge) et AWS Config (règles, agrégateurs, remédiation SSM, vs CloudWatch et CloudTrail)."
author: "Tony Duong"
category: "note"
tags: ["aws", "cloudwatch", "eventbridge", "cloudtrail", "aws-config", "service-quotas", "monitoring", "logs", "alarms", "synthetics", "containers", "ec2", "observability", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 9
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## À quoi servent les métriques CloudWatch

**Amazon CloudWatch** collecte des **métriques** pour les services AWS (et des sources personnalisées). Chaque métrique a un **nom** (souvent explicite : `CPUUtilization`, `NetworkIn`, …). Les **tendances** des métriques aident au **dépannage** et aux décisions de **capacité**.

### Structure

- **Namespace** — regroupe les métriques (ex. `AWS/EC2`, `AWS/EBS`, namespaces par service).
- **Dimensions** — attributs qui identifient la série (ex. **`InstanceId`**, `AutoScalingGroupName`, tags d’environnement). Jusqu’à **30** dimensions par métrique (selon le cours).
- **Timestamp** — chaque point est horodaté.

**Console :** **CloudWatch** → **Metrics** → **All metrics** → parcourir par **namespace** et filtrer par **région**, **ressource**, **dimension**.

## Détection d’anomalies

CloudWatch peut apprendre une **ligne de base** à partir de l’historique des métriques via du **machine learning**, puis signaler des **anomalies** quand les valeurs sortent de la bande attendue.

- Créer des **alarmes** sur la **détection d’anomalies** au lieu de seulement des seuils **statiques**.
- Vous pouvez **exclure** des plages horaires ou événements de l’**entraînement** si les premières données n’étaient pas représentatives (fenêtres de maintenance, incidents).

## EC2 : monitoring basique vs détaillé

- **Par défaut (basique) :** métriques hyperviseur pour EC2 à granularité **5 minutes** (gratuit).
- **Monitoring détaillé (option payante) :** granularité **1 minute** pour l’instance.

**Pourquoi activer le détaillé :** réagir plus vite aux changements ; peut aider les **groupes Auto Scaling** à décider du **scale-out / scale-in** plus tôt quand les politiques s’appuient sur ces métriques.

**Lacune :** l’usage **mémoire (RAM)** **n’est pas** fourni par les métriques EC2 par défaut — le publier comme **métrique personnalisée** (ou utiliser l’**agent CloudWatch** / scripts).

## Métriques personnalisées (`PutMetricData`)

Utiliser l’API **`PutMetricData`** (CLI, SDK, ou **agent unifié CloudWatch** en interne) pour publier votre propre **namespace**, **noms de métriques**, **valeurs**, **unités** et **dimensions** (ex. `InstanceId`, `InstanceType`, `Environment`).

### Résolution (résolution de stockage)

- **Résolution standard :** points aussi fins que **1 minute** (60 secondes).
- **Haute résolution :** soumissions possibles toutes les **1, 5, 10 ou 30 secondes** (charges en pics ou fines — confirmer les noms de paramètres dans l’API actuelle).

### Timestamps (détail à fort rendement examen)

CloudWatch **accepte** des timestamps de métriques **jusqu’à deux semaines dans le passé** ou **jusqu’à deux heures dans le futur** **sans rejeter** l’appel.

**Conséquence :** une **heure machine incorrecte** (NTP décalé) peut faire apparaître les métriques **décalées** dans les graphiques. Gardez les instances **synchronisées** si la chronologie exacte compte.

### Pattern de flux

1. Un traitement sur EC2 (ou Lambda, etc.) mesure RAM, disque, KPI métier, comptes de connexion, …
2. Appeler **`PutMetricData`** selon un planning (cron, timer systemd, agent).
3. Les nouvelles métriques apparaissent sous un **namespace personnalisé** dans **All metrics** avec vos **dimensions**.

L’**agent unifié CloudWatch** utilise **`PutMetricData`** (et API associées) pour pousser régulièrement métriques standard et personnalisées.

## Tableaux de bord

- **Multi-régions et multi-comptes :** un tableau de bord peut afficher des widgets dont les métriques viennent de **plusieurs régions** et **plusieurs comptes AWS** (point fort examen).
- **Fuseau horaire**, **plage temporelle** et **rafraîchissement auto** configurables ; tableaux de bord **partageables** avec des utilisateurs **sans** compte AWS (liens de partage / vues intégrées — suivre les options console actuelles).
- **Tarification (cadrage cours) :** **3** tableaux de bord incluant jusqu’à **50** métriques **gratuits** ; tableaux de bord supplémentaires facturés par mois (vérifier la tarification).
- **Tableaux de bord automatiques :** AWS peut générer un tableau de démarrage pour un service (ex. **Auto Scaling**) filtré par **resource group**.
- **Tableaux de bord personnalisés :** ajouter des widgets — **ligne**, **aire empilée**, **nombre**, **texte**, **statut d’alarme**, tableaux de résultats **Logs Insights**, etc. Tous les widgets partagent la **même** plage temporelle globale pour corréler.
- En ajoutant un widget métrique, choisir explicitement la **région** pour afficher côte à côte des séries **Francfort** et **us-east-1**.

## CloudWatch Logs

### Modèle

- **Log group** — souvent un par **application** ou intégration.
- **Log stream** — instances de cette app : **conteneurs**, **hôtes**, invocations **Lambda**, paires **stdout/stderr**, etc.
- **Rétention** — **jamais expirer**, ou **1 jour** jusqu’à **10 ans** (le cours a aussi montré **120 mois** en console — même idée).

### Sources d’ingestion (exemples)

**SDK**, **Unified Agent** (préféré ; ancien **Logs Agent** déprécié), **Elastic Beanstalk**, définitions de tâches **ECS**, **Lambda** (par défaut), **VPC Flow Logs**, **API Gateway**, **CloudTrail** (via configuration), journalisation des requêtes **Route 53**, exports **RDS** / **Aurora**, etc.

### Chiffrement

Les journaux sont **chiffrés** par défaut ; **KMS** CMK optionnelle par log group.

### Metric filters

Définir un **motif** (ex. compter les lignes contenant `installing` ou `ERROR`). À la correspondance, **incrémenter une métrique CloudWatch** dans un namespace de votre choix → graphique et **alarme** sur cette métrique (ex. trop de lignes `error` → **SNS**).

### Subscription filters (temps réel)

Streamer les événements de journal correspondants vers **Kinesis Data Streams**, **Kinesis Data Firehose** ou **Lambda**. Utiliser des **filter patterns** pour sélectionner quels événements quittent le groupe. Permet analytique **quasi temps réel**, archivage **S3** via Firehose, ingestion **OpenSearch**, processeurs personnalisés.

**Limite (cours) :** jusqu’à **deux** subscription filters par **log group** — confirmer les quotas actuels.

### Export par lots vers S3

**`CreateExportTask`** exporte une plage temporelle de journaux vers **S3** — **par lots**, peut prendre **jusqu’à ~12 heures** ; **pas** temps réel.

### Agrégation de journaux inter-comptes (pattern)

Compte **émetteur** : subscription filter sur un log group → **destination** représentant le stream **destinataire**. **Destinataire :** **resource policy** sur la destination + **rôle IAM** assumable par l’émetteur pouvant **PutRecord** vers **Kinesis**. Permet de centraliser les journaux de nombreux comptes/régions dans un pipeline (ex. Kinesis → Firehose → S3).

## CloudWatch Logs Insights

- **Langage de requête dédié** sur les données de journal **historiques** — **pas** un moteur de suivi en direct ; s’exécute quand vous **lancez** une requête.
- Découverte auto des **champs** ; supporte **filter**, **stats**, **sort**, **limit**, **parse**.
- Enregistrer des requêtes, ajouter des **visualisations** aux **tableaux de bord**, exporter les résultats.
- Peut interroger **plusieurs log groups** à la fois, y compris **inter-comptes** (là où configuré).

La console fournit des **requêtes d’exemple** (ex. stats de latence Lambda, top IP des **VPC Flow Logs**).

## Live Tail

**Live Tail** diffuse des événements correspondants **quasi temps réel** dans la console pour le **débogage** (filtre de log stream optionnel + motif). **Tarification :** heures **gratuites** limitées par jour dans le cours — **arrêter** les sessions terminées pour éviter les frais.

## Protection des données des journaux

Les **data protection policies** sur un log group **détectent** et **masquent** les données sensibles (**100+** identifiants intégrés : email, carte bancaire, SSN, identifiants, …) via du **ML** ; identifiants **personnalisés** pris en charge.

- Masqué dans **Insights**, **metric filters** et livraisons **subscription** sauf si le principal a **`logs:Unmask`** (ou permission d’unmask équivalente).
- Livraison d’**audit** optionnelle vers un autre log group, **S3** ou **Firehose** ; métrique **`LogEventsWithFindings`** → **alarme** → **SNS** quand des données sensibles sont détectées.

## Alarmes

### États

- **OK** — condition non violée.
- **ALARM** — seuil ou règle déclenché ; les **actions** s’exécutent.
- **INSUFFICIENT_DATA** — pas assez d’échantillons pour évaluer.

### Évaluation

La **period** définit la fenêtre ; statistiques (**Average**, **Maximum**, **SampleCount**, …). Fonctionne avec les **métriques personnalisées haute résolution** (ex. **10 s**, **30 s**, ou multiples de **60 s** — aligner avec la résolution métrique).

**Types de seuil :** **statique** ou bande de **détection d’anomalies**.

### Actions

- **EC2 :** **Stop**, **Terminate**, **Reboot**, **Recover**.
- **Auto Scaling :** scale **in** / **out**.
- **SNS** → email, chat, automatisation **Lambda**, etc.

### Alarmes composites

Combiner **d’autres alarmes** avec une logique **AND** / **OR** pour réduire le **bruit** (ex. alerter seulement quand **CPU élevé** **et** **réseau bas**).

### Alarmes sur health check EC2 → recovery

Alarmes sur **instance status**, **system status** ou santé **EBS** attaché. **Recovery** déplace l’instance vers un **nouveau** matériel en préservant **IP primaire/secondaire/elastic**, **métadonnées instance**, **placement group** (types d’instance pris en charge seulement).

### Log metric filter → alarme

Chaîne : **journaux** → **metric filter** → **métrique** → **alarme** → **SNS**.

### Tester les alarmes

**`set-alarm-state`** (CLI/API) force **OK** / **ALARM** / **INSUFFICIENT_DATA** pour valider les actions **SNS** ou **EC2** sans attendre la charge réelle (démo cours : **terminer** l’instance sur **ALARM** forcé).

## CloudWatch Synthetics (Canaries)

Scripts **headless** (**Node.js** ou **Python**) qui imitent les **parcours clients** (vérifications **HTTP/API**, flux **UI** avec **Chrome headless**).

- Exécution **une fois** ou sur un **planning** ; capture **latence**, **HAR**, **captures d’écran**.
- **Blueprints :** URL heartbeat, **REST API** CRUD, crawler **liens cassés**, **diff visuel** vs baseline, **Canary Recorder** (enregistrement navigateur → script généré), constructeur **GUI workflow**.
- En cas d’échec → **alarme** → automatisation (ex. cours : **Lambda** met à jour **Route 53** vers une région saine).

### Canaries dans un VPC

Pour atteindre des cibles **privées** : activer **DNS resolution** et **DNS hostnames** sur le VPC. Les résultats des canaries vont toujours vers CloudWatch :

- **Chemin public :** sous-réseau privé + **NAT gateway** pour les appels API sortants vers CloudWatch.
- **Chemin AWS privé :** **interface endpoints** VPC pour **CloudWatch** (et souvent **endpoint gateway S3** pour les artefacts) pour garder le trafic sur le réseau AWS.

## CloudWatch Container Insights

Collecte des **métriques** et **journaux** pour **ECS**, **Fargate**, **EKS** et **ROSA** (OpenShift sur AWS) sans **sidecar** personnalisé pour l’activation de base.

- Métriques au niveau **cluster** et **service** par défaut.
- La visibilité **enhanced** ajoute la granularité **tâche** / **pod** / **conteneur** pour un dépannage plus profond **CPU**, **mémoire**, **réseau** et **throttling**.

Activer au niveau **compte** ou à la création d’un **cluster**.

## CloudWatch Internet Monitor

**Internet Monitor** est un **service plus tableau de bord** qui utilise la **télémétrie réseau globale** d’AWS pour montrer comment les conditions **Internet** (villes, **ASN**, santé **edge / PoP** AWS) peuvent affecter **vos** charges de travail et **utilisateurs finaux**.

- Schémas de trafic **mondiaux** et **événements de santé** ; **recommandations** visant à améliorer la **latence** et l’expérience quand c’est possible.
- La télémétrie apparaît dans **CloudWatch Metrics** et **CloudWatch Logs** ; les **événements de santé globaux** peuvent aller vers **EventBridge** pour **alerting** et automatisation.

## CloudWatch Network Synthetic Monitor

Pour les liens **hybrides** (**Direct Connect** ou **VPN site-à-site**) entre **on-premises** et **AWS**, **Network Synthetic Monitor** sonde les chemins **IPv4** avec **ICMP** ou **TCP** — **aucune** installation d’**agent** de votre côté.

- Expose **perte de paquets**, **latence** et **gigue** pour détecter la **dégradation** sur le chemin **entreprise ↔ cloud**.
- Les résultats sont publiés dans **CloudWatch Metrics** pour **tableaux de bord** et **alarmes**.

## Amazon EventBridge (anciennement CloudWatch Events)

**EventBridge** est le nom moderne de ce qui s’appelait **CloudWatch Events** — attendez **EventBridge** aux examens et dans la doc récente.

### Modèle central

1. Les **sources** émettent des **événements** (documents JSON : `detail-type`, `source`, `account`, `time`, `region`, `resources`, `detail`, …).
2. Les **règles** sur un **event bus** correspondent soit à un **event pattern**, soit à un **planning** (**cron** / **rate**).
3. Les événements correspondants invoquent des **cibles** (souvent plusieurs par règle, avec IAM).

**Exemples de patterns :** changement d’état EC2 (ex. `shutting-down`, `terminated`), **objet créé** S3, **connexion console IAM root**, résultats **Trusted Advisor**.

**Exemples de cibles :** **Lambda**, **SQS**, **SNS**, **Kinesis Data Streams**, **Step Functions**, tâches **ECS**, jobs **AWS Batch**, **CodePipeline** / **CodeBuild**, **SSM Automation**, actions API **EC2** (start/stop/reboot), **API Gateway**, **CloudWatch Logs** (comme cible de **journal**), et plus.

### CloudTrail → EventBridge : réagir à presque tout appel API

Les appels **API** de gestion (et configurés) enregistrés par **CloudTrail** apparaissent aussi comme événements sur le **bus d’événements par défaut**, vous pouvez donc faire correspondre des **API spécifiques** avec des **event patterns** et envoyer vers **SNS**, **Lambda**, etc.

**Exemples (cours) :**

| Objectif | API / service | Idée de pattern |
| --- | --- | --- |
| Alerter sur **suppression de table DynamoDB** | **`DeleteTable`** (DynamoDB) | Faire correspondre **`eventName`** / **`eventSource`** pour cet appel → **SNS**. |
| Alerter sur **assumption de rôle** | **`AssumeRole`** (**STS**) | Faire correspondre **`eventName`** / **`eventSource`** pour **sts.amazonaws.com** → **SNS**. |
| Alerter sur **changements d’ingress security group** | **`AuthorizeSecurityGroupIngress`** (EC2) | Faire correspondre cette API **EC2** → **SNS**. |

**Mise en garde :** la livraison via **CloudTrail → EventBridge** **n’est pas** une automatisation temps réel — voir section **CloudTrail** pour la **latence** typique (cours : de l’ordre de **~15 minutes** vers **EventBridge** et **~5 minutes** pour les **fichiers journaux** dans **S3** ; **vérifier** la doc actuelle).

### Event buses

| Bus | Rôle |
| --- | --- |
| **Default** | Les services AWS publient les **événements de service** ici (un par compte par région). |
| **Partner** | Intégrations **SaaS** (ex. **Auth0**, **Zendesk**, **Datadog** — voir la liste partenaires actuelle) envoient des événements vers un bus **partner**. |
| **Custom** | Vos applications appellent **`PutEvents`** vers **votre** bus ; mêmes **règles** et **cibles** que le modèle par défaut. |

**Inter-comptes (confiance bidirectionnelle) :**

- **Bus → bus :** Sur le bus du compte **source**, une **resource policy** doit autoriser **`events:PutEvents`** (ou équivalent) vers le bus **destination**. Sur le bus du compte **destination**, une **resource policy** doit autoriser le **compte source** (ex. principal **root** de ce compte) à **`PutEvents`** **vers ce** bus. **Les deux** côtés doivent explicitement autoriser envoi et réception.
- **Bus → SQS / SNS / Lambda / API Gateway / Kinesis** (cibles avec **resource policies**) : le côté **émetteur** utilise typiquement un **rôle IAM** pouvant **`SendMessage`**, **`Publish`**, **`Invoke`**, etc. La **resource policy** de la **destination** doit autoriser l’**autre compte** (ou ce rôle) à effectuer l’action. Même idée de **double** permission : **émetteur** peut agir + **récepteur** accepte.

### Archives et replay

**Archiver** tous les événements ou un **sous-ensemble filtré** depuis un bus ; rétention **indéfinie** ou **bornée dans le temps**. **Rejouer** les événements archivés dans le bus (ex. après correction d’un consommateur **Lambda** défectueux) pour **débogage** et **retraitement** sûr.

### Schema Registry

EventBridge peut **découvrir** / enregistrer des **schémas** pour les événements d’un bus afin de connaître les **formes de champs** ; supporte le **versioning** et la **génération de code** (bindings) à partir d’un schéma.

### EventBridge Pipes

Les **Pipes** connectent des **sources** de streaming / file **prises en charge** à des cibles de type **EventBridge** avec étapes optionnelles de **filtre** et **enrichissement** — **sans code consommateur** personnalisé pour tirer de la source ou pousser vers de nombreuses cibles.

**Sources (exemples) :** **DynamoDB Streams**, **Kinesis Data Streams**, **Amazon MQ**, **Amazon MSK**, **SQS**, **Apache Kafka auto-géré**.

**Cibles (exemples) :** **Kinesis Data Firehose**, **Kinesis Data Streams**, **event bus EventBridge**, **Amazon Redshift** (là où l’intégration est proposée), **SQS**, **SNS**, **API Gateway**, tâches **ECS**, et autres cibles **EventBridge** que la console supporte.

**Flux :** source → (optionnel) **filtre** → (optionnel) **enrichissement** → cible.

L’**enrichissement** adapte ou augmente la charge utile avec **Lambda**, **Step Functions**, **API Gateway** ou une **API destination EventBridge** — puis l’événement **enrichi** va vers la **cible**.

### Retries et dead-letter queues (DLQ)

Si la livraison vers une **cible** échoue (cible indisponible, timeouts, throttling, …), EventBridge **réessaie** avec une **retry policy** : le cours cite par défaut une fenêtre max d’environ **24 heures** et environ **185** tentatives — **vérifier** les défauts et limites actuels dans la doc.

Après épuisement des retries, les invocations en échec peuvent aller vers une **dead-letter queue** implémentée avec **SQS** pour **inspecter** et **retraiter** plus tard.

### SSM Automation comme cible

Les documents **Systems Manager Automation** peuvent être **cibles** de règles — ex. **EC2 Instance State-change** → exécuter une automatisation **bootstrap** qui installe du logiciel sur une instance **nouvellement démarrée**. Comme les autres cas EventBridge : déclencher sur des **événements** ou sur un **planning** pour l’automatisation **routinière**.

### Disposition console (haut niveau)

- **Rules** — **event pattern** vs **schedule** (la console met aussi en avant **EventBridge Scheduler** comme chemin **préféré** pour de nombreux **plannings récurrents**).
- **Pipes** — **source → filtre → enrichir → cible** géré (voir ci-dessus).
- **Event buses** — défaut, **custom**, association partenaire.
- **Partner event sources** — tiers → bus partner.
- **API destinations** — invoquer des APIs **HTTPS externes** avec OAuth/clés API depuis les règles.
- **Schemas** — parcourir schémas d’événements **AWS** ou registres **custom**.

### Filtrage par pattern d’événement (filtrage de contenu)

Au-delà de l’égalité simple, les patterns supportent **prefix** / **suffix**, **anything-but**, comparaisons **numériques** (ex. `> 0`), correspondance **IP** (**CIDR**), **`exists`** (champ doit être présent), **equals-ignore-case**, et combinaisons imbriquées sur `detail` (ex. S3 **`detail-type` : Object Created** + **`detail.bucket.name`** + **`detail.object.key`** **suffix** `.png` + **IP source**).

Utiliser des **événements d’exemple** dans la console (ou la doc) pour copier les **noms de champs exacts** (`instance-id`, `state`, …).

### Input transformers

Pour chaque cible, optionnellement **remodeler** l’événement :

1. **Input path** — carte type JSONPath depuis l’événement vers jusqu’à **~100** **variables** (ex. `<timestamp>` ← `$.time`, `<instance>` ← `$.detail.instance-id`, `<state>` ← `$.detail.state`, `<arn>` ← `$.resources[0]`).
2. **Input template** — chaîne ou corps JSON envoyé à la cible, référençant ces variables.

**Cas d’usage :** le downstream veut un **petit JSON fixe** (ex. pour la cible **CloudWatch Logs**) au lieu de l’enveloppe EventBridge complète. **Tester** avec des **événements d’exemple** dans l’assistant de règle avant d’enregistrer.

### Patterns pratiques (cours)

- **Règle** sur **EC2 Instance State-change Notification** où `detail.state` est **`shutting-down`** ou **`terminated`** → topic **SNS** (la console peut créer le **rôle d’invocation**).
- **Schedule** (ou **Scheduler**) **rate** **1 heure** → **invoquer Lambda** (ou ECS, Firehose, …).
- **Custom bus** pour événements **application** ; **désactiver** les règles quand inutile pour arrêter frais et bruit.

## Service Quotas

**Service Quotas** liste les **limites par service** pour le compte (et si chaque quota est **ajustable**). La console montre la valeur **appliquée**, l’**usage** (là où disponible), et des graphiques pour des métriques comme les **exécutions concurrentes Lambda**.

- **Demander des augmentations de quota** — petits bumps peuvent **auto-approuver** ; demandes plus grandes passent par **Support** avec **attente**.
- **Alarmes CloudWatch sur les quotas** — ex. alerter quand l’usage atteint **80 %** du **quota appliqué** pour les **exécutions concurrentes Lambda** afin que les opérateurs **lèvent** la limite avant le **throttling**. Configurer des **actions** (ex. **SNS**) depuis l’alarme.

**vs Trusted Advisor :** **Trusted Advisor** expose des contrôles **service limit** (de l’ordre de **~50** dans le récit du cours) et peut alimenter **CloudWatch** pour alarmes, mais **Service Quotas** est l’endroit **dédié** pour **parcourir** et **surveiller** **tous** les quotas — préférer les alarmes **natives quota** pour l’**ampleur**.

## AWS CloudTrail

**CloudTrail** enregistre l’activité **API** et les actions **console** pour la **gouvernance**, la **conformité** et l’**audit**. Il est **activé** par défaut au niveau compte (avec le comportement **Event history** console comme documenté).

### Ce qui est journalisé

- Appels depuis la **console**, **CLI**, **SDKs**, et **services AWS** agissant en votre nom.
- **Event history** dans la console montre l’activité récente (cours : **~90 jours** d’événements de **gestion** dans la vue **Event history** — confirmer le comportement actuel).

### Trails et stockage long terme

Créer un **trail** pour livrer les événements vers **S3** (et optionnellement **CloudWatch Logs**). Les trails peuvent être **single-Region** ou **multi-Region** pour **centraliser** l’historique (ex. un **bucket** pour l’org). **Au-delà** de la fenêtre de rétention console par défaut, **S3** (souvent interrogé avec **Athena**) est le magasin **durable**.

**Exemple forensics :** qui a **terminé** une instance EC2 — chercher l’enregistrement **`TerminateInstances`** (ou équivalent) dans **CloudTrail** pour **principal**, **heure**, **région**, et **paramètres de requête**.

### Catégories d’événements

| Type | Qu’est-ce que c’est | Par défaut dans les trails |
| --- | --- | --- |
| **Management events** | Changements et lectures control-plane sur les ressources (**CreateSubnet**, **AttachRolePolicy**, **DescribeInstances**, …). Souvent séparés **read** vs **write** pour coût / bruit. | **Journalisés** par défaut dans les trails (options read/write configurables). |
| **Data events** | Activité **data plane** à fort volume — ex. APIs **objet S3** (**GetObject**, **PutObject**, **DeleteObject**), **`Invoke` Lambda**. | **Désactivés** par défaut (coûteux / bruyants) ; activer **sélectivement** par bucket/fonction avec filtres read/write. |
| **Insight events** | Sortie de **CloudTrail Insights** (voir ci-dessous). | Seulement quand **Insights** est activé et facturé. |

### CloudTrail Insights (option payante)

**Insights** analyse l’activité **management** pour apprendre des patterns **normaux**, puis émet des **Insight events** quand il détecte des **anomalies** (ex. **provisioning** inhabituel, rafales **IAM**, pression **service limit**, trous dans les changements **routiniers**).

Livraisons : **console CloudTrail**, livraison vers **S3** (le long du trail), et événements **EventBridge** pour **automatisation** (ex. email **SNS** sur activité suspecte).

### Intégrité des fichiers journaux (digest)

Pour les trails écrivant vers **S3**, activer **log file validation**. CloudTrail écrit périodiquement un fichier **digest** (cours : environ **toutes les heures**) qui **liste** les fichiers journaux de cette fenêtre et inclut un hash **SHA-256** de chaque objet. Les digests vivent dans le **même bucket** sous un **préfixe séparé** des journaux bruts.

**Usage :** recalculer le hash d’un fichier journal livré et le comparer au digest — s’ils **correspondent**, le fichier **n’a pas** été altéré ou remplacé après livraison (forte histoire **conformité**).

**Protéger le bucket :** **bucket policy**, **versioning**, **MFA Delete** (là où applicable), **chiffrement**, **S3 Object Lock** (immutabilité) — défense en profondeur pour que les données d’audit ne puissent pas être modifiées silencieusement. Verrouiller aussi **CloudTrail** et la configuration du **trail** avec **IAM** pour que la journalisation ne puisse pas être désactivée ou redirigée par des principaux non autorisés.

### Latence EventBridge et livraison S3

Traiter l’automatisation **pilotée CloudTrail** comme **quasi temps réel**, pas **synchrone** : ordre de grandeur cours **~15 minutes** de l’appel API à **EventBridge**, et **~5 minutes** pour la livraison du **fichier journal** vers **S3** — **confirmer** la documentation AWS actuelle.

### Trails AWS Organizations

Un **organization trail** (créé depuis le **compte management**) peut journaliser l’activité **API** pour **tous les comptes membres** dans un **bucket S3 central** (et **Logs** optionnels). Le **même nom de trail** apparaît dans chaque compte ; les **comptes membres** peuvent **voir** que le trail existe mais **ne peuvent pas supprimer ou modifier** le trail **organization** — bon pour **audit centralisé** et **résistance à la falsification** au niveau membre.

### Note pratique

**Event history** console peut avoir quelques **minutes** de retard sur l’action (ex. **TerminateInstances** apparaît peu après **refresh**).

## AWS Config

**AWS Config** enregistre en continu la **configuration** des **ressources** prises en charge et les **évalue** par rapport à des **règles** pour la **conformité** et la visibilité du **dérive**. Il répond à : « **SSH** ouvert sur **0.0.0.0/0** sur un **security group** ? », « Des buckets **S3** sont-ils **publics** ? », « Comment ce **listener** **ALB** / **certificat** a-t-il **changé** dans le temps ? »

- Service **par région** — activer et payer **par région** ; utiliser l’**agrégation** (voir ci-dessous) pour une vue **multi-régions / multi-comptes**.
- **Ne bloque pas** les actions — Config est **détectif**, pas un substitut à **IAM**, **SCPs**, ou contrôles **préventifs**.
- **Timeline historique** par ressource : versions de **configuration**, **conformité** dans le temps, et liens vers **CloudTrail** pour **qui** a invoqué **quelle API** (ex. **`AuthorizeSecurityGroupIngress`**, **`RevokeSecurityGroupIngress`**).

### Enregistreur et livraison

- **Périmètre :** enregistrer **tous** les types pris en charge dans la région ou **seulement** des **types de ressources** sélectionnés (moins cher).
- **Ressources globales :** optionnellement inclure utilisateurs **IAM**, **groupes**, **rôles**, et **customer managed policies** (stockés dans **une** région désignée — implications **coût**).
- Utilise un **service-linked role** ; **historique de configuration** livré vers **S3** (**préfixe** optionnel). Topic **SNS** optionnel pour **toutes** les notifications de configuration et conformité (flux large — coupler avec **subscription filters** si vous ne voulez que des sous-ensembles).
- La **tarification** est à l’usage (par **configuration item** enregistré et par **évaluation de règle** dans la région) — les coûts peuvent monter vite avec un enregistrement **large** ; **vérifier** la tarification actuelle.

### Règles

- **Règles gérées AWS** — large catalogue (cours **75+** ; le nombre évolue).
- **Règles custom** — implémenter l’évaluation dans **Lambda** (ex. « chaque volume **EBS** est **gp2** », « chaque **EC2** en **dev** est **t2.micro** »).
- **Déclencheurs :** sur **changement de configuration** et/ou sur un **planning périodique** (ex. re-scan toutes les **N** heures).

### Remédiation (SSM Automation)

La non-conformité **ne** se corrige **pas** automatiquement sauf si vous attachez une **remédiation** : souvent un document **SSM Automation** (**AWS-managed** ou **custom**, y compris des docs qui **invoquent Lambda**).

- **Exemples (cours) :** **`AWS-DisableIncomingSSHOnPort22`** sur un **security group** non conforme ; **`AWS-ConfigureS3BucketLogging`** quand la journalisation du bucket est désactivée.
- Remédiation **manuelle** vs **automatique** ; **retries** configurables (ex. jusqu’à **~5** tentatives si toujours non conforme après une exécution).

### Notifications

- Règles **EventBridge** sur événements Config de non-conformité ou de changement pour **automatisation sélective**.
- **SNS** directement depuis Config pour notifications larges ; affiner avec **filter policies** / abonnements **SNS**.

### Agrégateurs

Créer un **aggregator** seulement dans un **compte central « aggregator »** — pas dans chaque compte **source**. L’aggregator **tire** **l’inventaire** et la **conformité** depuis des comptes et **régions** **autorisés** vers **une** vue console.

- **Avec AWS Organizations :** créer depuis le compte **management** — **autorisation** sur l’org est **simplifiée** (cours : chemin de confiance automatique).
- **Sans Organizations :** chaque compte **source** doit **autoriser** le compte **aggregator** à **collecter** les données.
- Le **déploiement des règles** reste **par compte / région** — l’aggregator **ne** centralise **pas** les **définitions de règles** ; utiliser **CloudFormation StackSets** (ou similaire) pour déployer les **mêmes** règles partout.

### Intégrations Settings

La console **Settings** peut connecter **SNS** et règles **EventBridge**/**CloudWatch Events** pour que seules des règles **spécifiques** ou transitions de conformité notifient les systèmes downstream.

## CloudWatch vs CloudTrail vs Config

| Angle | **CloudWatch** | **CloudTrail** | **Config** |
| --- | --- | --- | --- |
| **Rôle principal** | **Performance** et **exploitabilité** — **métriques**, **alarmes**, **journaux**, **tableaux de bord**. | **Qui a fait quoi** — **audit** des **API** et de la **console**. | **Quoi est configuré** — **forme** de la ressource vs **règles** **souhaitées** ; **timeline** de **conformité**. |
| **Exemple ELB** | **Nombre de requêtes**, erreurs **HTTP**, **latence**, tableaux de bord **multi-régions**. | **`ModifyListener`**, **`AuthorizeSecurityGroupIngress`**, changements de **certificat** — **acteur** et **heure**. | Politique **TLS** du **listener**, attachement **certificat**, attachements **security group** — **conforme** ou non, **historique** des changements. |

Les trois sont **complémentaires** : **CloudWatch** pour la **santé** et la **capacité**, **Config** pour la **gouvernance** de **configuration**, **CloudTrail** pour la **responsabilité**.

## Points clés

- Métriques : **namespaces**, **dimensions** (≤ **30**), tableaux de bord optionnels ; EC2 **5 min** vs **1 min** détaillé ; **RAM** = **personnalisé** ; **`PutMetricData`** + bizarreries de **timestamp** (**2 semaines** / **2 heures**).
- **Détection d’anomalies** = bande **ML** + alarmes optionnelles ; exclure les mauvaises fenêtres d’entraînement.
- **Tableaux de bord** = **multi-régions**, **multi-comptes**, plage temporelle **partagée**, widgets **auto** ou **personnalisés** ; limites **gratuites** puis coût par tableau de bord.
- **Logs :** **groups** / **streams**, **rétention**, **KMS** ; ingestion depuis **Lambda**, **VPC Flow Logs**, **API GW**, **CloudTrail**, etc. ; **metric filters** → métriques → **alarmes** ; **Insights** = **requêter** journaux historiques ; **Live Tail** pour debug live ; **data protection** = **masquer** + **audit** + **`LogEventsWithFindings`**.
- **Export** (`CreateExportTask`) = **lot** vers **S3** (lent) ; **subscription filters** = **temps réel** vers **Kinesis** / **Firehose** / **Lambda** ; **inter-comptes** nécessite **destination** + **policies** + **IAM**.
- **Alarmes :** **OK** / **ALARM** / **INSUFFICIENT_DATA** ; cibles **EC2**, **ASG**, **SNS** ; **composite** pour **AND/OR** ; **status check** + **recovery** ; **`set-alarm-state`** pour tester.
- **Synthetics :** **Node/Python** planifiés + canaries **Chrome** ; **VPC** + **NAT** ou **interface endpoints** pour monitoring privé + télémétrie privée.
- **Container Insights** pour **ECS/EKS/Fargate/ROSA** ; mode **enhanced** pour détail **tâche/conteneur**.
- **Internet Monitor** — santé **Internet** globale vs **vos** apps ; **métriques** / **journaux** + événements de santé **EventBridge** ; recommandations **UX**.
- **Network Synthetic Monitor** — liens **DX** / **VPN** ; **ICMP**/**TCP** **IPv4**, **sans agent** ; **perte** / **latence** / **gigue** → **métriques**.
- **EventBridge** (ex-**CloudWatch Events**) : bus **default** / **partner** / **custom** ; **rules** (**pattern** ou **schedule**) ; **cibles** incluent **SSM Automation** ; patterns **API** dérivés **CloudTrail** (**DeleteTable**, **STS AssumeRole**, **AuthorizeSecurityGroupIngress**, …) → **SNS**/Lambda (**pas** temps réel) ; **archives** + **replay** ; **Schema Registry** ; **inter-comptes** = **policies** **émetteur** et **récepteur** (bus↔bus) ou **rôle IAM** + **resource policy** (SQS/SNS/Lambda/API GW/Kinesis) ; **filtrage** ; **input transformers** ; **Pipes** = **source** sans code (DynamoDB streams, Kinesis, MQ, MSK, SQS, Kafka) → **filtre** / **enrichir** (Lambda, Step Functions, API GW, API destination) optionnels → **cible** ; **retries** + **DLQ SQS** pour livraisons en échec (vérifier défauts).
- **Service Quotas** — parcourir limites, **demander augmentations**, alarmes **CloudWatch** sur **% du quota** (ex. concurrence Lambda) ; plus large que les seuls contrôles **Trusted Advisor**.
- **CloudTrail** — audit **API**/**console** ; **Event history** ~**90j** **management** ; **trails** → **S3** / **Logs** (**multi-Region** / **org** trails) ; **management** vs **data** (objets S3, **Lambda Invoke**) vs **Insights** ; **digest** + **SHA-256** pour **intégrité** des journaux ; protéger **bucket** + **trail** avec **IAM**/**Object Lock**/versioning ; **long terme** → **S3** + **Athena** ; **Insights** → **S3** + **EventBridge** ; **org trail** — **membres** **lecture seule** sur le trail ; latence **EventBridge** **~minutes** (pas synchrone).
- **Config** — **enregistreur** **par région** + **règles** (gérées + **Lambda** custom) ; évaluation sur **changement** ou **périodique** ; **timeline** + lien **CloudTrail** ; historique **S3** + **Athena** ; **remédiation** via docs **SSM** (ex. **désactiver SSH**, **activer logging bucket**) ; **aggregators** dans **un** compte central (**Org** vs **auth** manuelle) ; **StackSets** pour déploiement des **règles** ; notifications **EventBridge**/ **SNS** ; **n’interdit pas** les appels API.
- **CloudWatch** vs **CloudTrail** vs **Config** — **métriques**/ops vs **audit** vs **conformité de configuration** (voir tableau comparatif).

---
*Traduit par Claude*
