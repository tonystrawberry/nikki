---
title: "Amazon S3 : buckets, objets, sécurité et versioning"
date: "2026-03-28"
excerpt: "Notes S3 section 10 jusqu’aux sujets avancés : MFA delete, access logs, Object Lock et Glacier Vault Lock, VPC endpoints, Access Analyzer, plus réplication, lifecycle, événements, performance, batch, inventory et Athena."
author: "Tony Duong"
category: "note"
tags: ["aws", "s3", "storage", "iam", "security", "versioning", "replication", "lifecycle", "object-lock", "vpc", "athena", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 6
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Pourquoi S3 compte

Amazon S3 est un bloc de construction AWS central, souvent décrit comme un **stockage objet infiniment scalable**. Une grande partie du web et de nombreux services AWS s’intègrent à S3.

Cas d’usage courants :

- sauvegarde et stockage de fichiers général
- reprise après sinistre (ex. répliquer ou copier des données vers une autre région)
- archivage (paliers moins chers tels que les classes Glacier)
- extension cloud hybride depuis le stockage on-premises
- hébergement d’assets statiques (médias, images, vidéos)
- data lakes et analytique
- livraison de logiciels et hébergement de site statique

Des exemples réels cités dans le matériel incluent la rétention réglementaire long terme (ex. schémas d’archivage type Nasdaq) et l’analytique pour insights métier sur les données dans S3.

## Buckets et régions

- Les données vivent dans des **buckets** (conteneurs de plus haut niveau).
- Un nom de bucket doit être **globalement unique sur tous les comptes AWS et régions** — piège d’examen fréquent.
- Les buckets sont **créés dans une région spécifique** même si la console liste les buckets de toutes les régions en une liste. S3 semble global, mais **le bucket est régional**.

## Règles de nommage des buckets

À retenir en résumé :

- lettres minuscules, chiffres, tirets uniquement (pas de majuscules, pas d’underscores)
- longueur entre 3 et 63 caractères
- ne doit pas ressembler à une adresse IP
- doit commencer par une lettre ou un chiffre
- éviter les préfixes interdits (suivre la doc AWS actuelle pour la liste complète)

## Objets et clés

- Les fichiers dans S3 sont des **objets**.
- Chaque objet a une **clé** : la chaîne de **chemin complet** (ex. `myfile.txt` ou `folder1/subfolder/myfile.txt`).
- La console montre des « dossiers », mais S3 **n’a pas de hiérarchie de répertoires réelle** — tout est une **clé** ; les slashes ne sont que des caractères dans la clé.
- Une clé se divise conceptuellement en **préfixe** (partie type chemin) et **nom d’objet** (segment final).

### Taille et upload

- Taille max d’objet : **5 To**.
- Pour les objets **plus grands que 5 Go**, vous devez utiliser **multipart upload** (découpage en parties).

### Métadonnées, tags, versioning

- **Métadonnées :** paires clé-valeur système ou utilisateur décrivant l’objet.
- **Tags :** jusqu’à 10 paires clé-valeur ; utiles pour lifecycle, sécurité et répartition des coûts.
- **Version ID :** présent quand le **versioning** est activé sur le bucket.

## Bases console : créer un bucket et uploader

Flux typique :

1. Choisir une **région** avant de créer le bucket.
2. Si un **type de bucket** est proposé, choisir **General purpose** pour les charges type examen standard (les directory buckets sont un cas spécialisé).
3. Choisir un nom de bucket **globalement unique**.
4. **Object Ownership :** ACLs désactivées est la **défaut recommandé**.
5. **Block Public Access :** laisser **activé** sauf si vous avez besoin intentionnellement de lectures publiques (voir sécurité ci-dessous).
6. **Versioning :** souvent commencer **désactivé**, puis activer pour mises à jour sûres et récupération.
7. **Chiffrement par défaut :** ex. **SSE-S3** avec **bucket key** optionnel pour coût/perf sur de nombreuses charges.

Après upload, **Open** dans la console peut fonctionner via un flux authentifié, alors que l’**URL objet brute** peut renvoyer **Access Denied** tant que l’objet/bucket n’est pas public ou que le demandeur n’est pas autorisé — contraster avec une **URL pré-signée**, qui embarque une autorisation temporaire et fonctionne pour le principal prévu.

Vous pouvez créer des « dossiers » **préfixe** dans l’UI pour l’organisation ; supprimer un « dossier » supprime les objets sous ce préfixe.

## Modèle de sécurité S3

### Basé sur l’utilisateur (IAM)

- Attacher des **politiques IAM** aux utilisateurs, groupes ou rôles pour autoriser ou refuser des **actions API S3** (ex. `GetObject`, `PutObject`).

### Basé sur la ressource

- **Bucket policies :** politiques JSON sur le bucket (et souvent objets via `bucket/*`). Courantes pour **lecture publique**, **forcer le chiffrement à l’upload**, **restrictions VPC/source**, patterns **CloudFront OAC/OAI**, conditions **MFA**, accès **inter-comptes**.
- **ACLs :** plus fines mais **moins courantes** maintenant ; **Object ACL** et **Bucket ACL** peuvent souvent être **désactivées** au profit des bucket policies et IAM.

### Quand l’accès est autorisé

Un principal IAM peut effectuer une action si **IAM l’autorise** ou une **resource policy l’autorise**, et qu’il n’y a **pas de Deny explicite** (Deny gagne).

### EC2 et inter-comptes

- Préférer les **rôles IAM** pour EC2 (pas d’utilisateurs IAM à long terme) pour accorder l’accès S3.
- L’accès **inter-comptes** à votre bucket se fait typiquement avec une **bucket policy** faisant confiance aux principaux de l’autre compte.

### Block Public Access

**Block Public Access** au niveau compte ou bucket est une barrière supplémentaire : même une **bucket policy publique** erronée peut **ne pas** prendre effet tant que Block Public Access reste activé. Ne le désactivez que si vous voulez **intentionnellement** des objets publics et comprenez le risque.

## Rendre des objets publics (pattern pratique)

1. **Modifier Block Public Access** sur le bucket pour autoriser les politiques publiques (seulement si nécessaire).
2. Ajouter une **bucket policy** qui autorise `s3:GetObject` pour le principal `"*"` (ou un principal plus étroit) sur la ressource `arn:aws:s3:::bucket-name/*`.

**Rappel générateur de politique :** `GetObject` s’applique aux **objets**, donc l’ARN ressource est typiquement **`bucket-arn/*`**. **`ListBucket`** s’applique à la **ressource bucket** elle-même (ARN **sans** `/*`).

## Idées avancées de bucket policy (prise de conscience)

Vous n’avez pas besoin de mémoriser chaque exemple JSON pour l’examen, mais vous devez savoir **ce que les bucket policies peuvent exprimer**, par exemple :

- restreindre l’accès aux principaux d’une **AWS Organization** (condition `aws:PrincipalOrgID`)
- **refuser les uploads** sauf si des en-têtes de chiffrement sont présents (forcer le chiffrement à l’upload)
- restreindre par **IP source** (plages IP publiques/elastic ; pas les IP privées comme décrit)
- conditions **VPC / VPC endpoint** (avec usage d’endpoint)
- **MFA** présente pour des lectures sensibles
- patterns d’accès origine **CloudFront** pour que seul CloudFront puisse lire les objets origine

## Versioning

- Activer le **versioning au niveau bucket**.
- Chaque écrasement de la même clé crée un **nouvel ID de version** au lieu de perdre silencieusement les anciens octets.
- Les objets uploadés **avant** l’activation du versioning montrent souvent la version **`null`** pour cet objet hérité.
- **Suspendre** le versioning **ne** supprime **pas** les versions existantes — il arrête la création de nouvelles versions.

### Première activation du versioning : délai de propagation (note examen)

Quand vous **activez le versioning pour la première fois** sur un bucket, la documentation AWS indique que le changement peut prendre un **court moment** pour se propager complètement (souvent cité comme **environ 15 minutes** dans le matériel de cours).

Pendant une propagation incomplète, **lectures ou écritures sur des objets nouvellement créés ou mis à jour** peuvent échouer avec **`404 NoSuchKey`** (ou un comportement « introuvable » similaire). **Recommandation :** attendre que le versioning soit pleinement effectif avant de compter sur des opérations d’**écriture** critiques. Vérifier la documentation AWS actuelle — si cette guidance change, les questions d’examen peuvent évoluer.

### Suppressions : delete marker vs suppression définitive

- Supprimer l’objet « courant » dans la console (sans cibler une version) ajoute en général un **delete marker** : l’objet **semble** parti mais les **anciennes versions** restent ; retirer le **delete marker** peut **restaurer** la dernière version non supprimée.
- Supprimer un **ID de version spécifique** est une **suppression définitive** — destructive et non annulable.

### Rollback

Pour revenir en arrière sur le contenu (ex. un `index.html` statique), vous pouvez supprimer définitivement l’**ID de version plus récent** que vous ne voulez plus comme courant, laissant une version plus ancienne comme dernière.

## Réplication S3

La réplication copie des objets d’un bucket **source** vers un bucket **destination** de façon **asynchrone** (AWS l’exécute en arrière-plan).

### CRR vs SRR

- **CRR (Cross-Region Replication) :** buckets source et destination dans des **régions différentes**.
- **SRR (Same-Region Replication) :** source et destination dans la **même** région.

Les buckets peuvent être dans le **même ou des comptes AWS différents**.

### Prérequis

- Le **versioning doit être activé** sur les buckets **source et destination**.
- Un **rôle IAM** (ou permissions service équivalentes) doit permettre à la réplication S3 de **lire** la source et **écrire** la destination (et opérations connexes dont AWS a besoin).

### Pourquoi utiliser la réplication

- **CRR :** conformité, **latence plus faible** pour des utilisateurs dans une autre région, copies **inter-comptes**, schémas type DR.
- **SRR :** **agrégation de logs** de nombreux buckets vers un seul, garder une **copie live** entre environnements (ex. patterns prod vs test décrits dans la formation).

### Ce qui est répliqué (défaut vs optionnel)

- Après création d’une règle de réplication, **seuls les objets uploadés (ou modifiés) à partir de ce moment** sont répliqués — les **objets existants ne** sont **pas** backfillés automatiquement.
- Pour répliquer des objets **déjà existants** (ou **corriger** des réplications en échec), utiliser **S3 Batch Replication** (opérations batch), séparément de la règle de réplication live.
- La **réplication des delete markers** est **optionnelle**. Si activée, les delete markers peuvent se copier vers la destination ; si désactivée, elles restent sur la source seulement.
- Les **suppressions définitives** (supprimer un **ID de version spécifique**) **ne** sont **pas** répliquées — une suppression définitive malveillante ou erronée dans la source n’efface pas automatiquement la version réplique (par conception).

### Pas de chaînage

Si le bucket **A** réplique vers **B**, et **B** réplique vers **C**, les objets créés dans **A** **ne** se retrouvent **pas** automatiquement dans **C** via cette chaîne. Il **n’y a pas** de chaînage de réplication via des buckets intermédiaires.

### Replication Time Control (RTC)

**RTC** est une option pour la réplication S3 qui fournit une **garantie de type SLA** sur la rapidité de réplication des nouveaux objets (le matériel de formation cite **99,99 % des nouveaux objets répliqués sous 15 minutes** quand RTC est activé).

Pourquoi c’est important :

- **Latence de réplication prévisible et auditable** pour conformité ou exigences métier strictes
- **Métriques CloudWatch** (et alertes) pour **surveiller** la réplication et détecter quand elle **prend du retard**
- Fonctionne avec la réplication **dans la même région ou entre régions** (mêmes bases CRR/SRR)

**Coût :** activer RTC ajoute des **frais supplémentaires** (tarification **par Go** liée aux données répliquées — confirmer la tarification S3 actuelle). Utilisez-le quand les parties prenantes ont besoin de cette **fenêtre de réplication garantie**, pas pour chaque charge.

### Patterns pratiques à retenir

- Créer buckets **origin** et **replica**, tous deux avec **versioning activé**.
- Sous **Management → Replication rules**, créer une règle (portée bucket entier ou préfixe), choisir bucket/Region destination (CRR si régions différentes), créer/assigner le **rôle IAM**.
- Question sur **répliquer les objets existants** → typiquement **Batch Operations** si vous avez besoin de données historiques ; « non » signifie que seuls les objets **nouveaux** répliquent.
- Les **IDs de version** sur la réplique **correspondent** souvent à la source pour les versions répliquées (utile pour corréler les copies).
- **Delete marker** sur la source → peut apparaître sur la destination **seulement si** la réplication des delete markers est activée.
- **Suppression définitive** d’une version sur la source → **ne** supprime **pas** cette version sur la réplique.

## Réplication inter-comptes et propriété des objets

Pour la réplication **vers le bucket d’un autre compte** :

1. La **bucket policy de destination** doit **faire confiance au rôle IAM de réplication** du compte source — autoriser des actions telles que répliquer des objets, réplication des suppressions le cas échéant, et APIs **versioning au niveau bucket** dont le rôle a besoin (`GetBucketVersioning`, `PutBucketVersioning`, etc., selon votre configuration).

### Propriété par défaut des objets répliqués

Par défaut, le **propriétaire d’objet** dans le bucket destination peut rester le **compte source** (propriétaire de l’objet tel qu’écrit). Ça peut aller pour des backups mais casse les attentes si le compte B doit **posséder entièrement** et **lire** les objets sous ses propres politiques.

### Override propriétaire (la destination possède les objets)

Pour que le **compte destination** soit propriétaire des objets répliqués :

- Activer l’**override de propriétaire** approprié (bucket-owner-enforced / propriétaire destination) sur la **règle de réplication** (libellé console peut varier).
- Accorder au rôle de réplication source **`s3:ObjectOwnerOverrideToBucketOwner`** (ou nom de permission IAM actuel équivalent).
- La **bucket policy de destination** doit aussi autoriser ce rôle à effectuer l’**override de propriété** pour que les nouveaux objets soient possédés par le compte du bucket destination.

**Angle examen :** la réplication « fonctionne » (les objets apparaissent) mais le **compte B ne peut pas lire** si propriété et permissions sont incorrectes — corriger avec **owner override** plus permissions **IAM + bucket policy** assorties.

## Classes de stockage et règles lifecycle

Les objets peuvent **transitionner** entre classes de stockage dans le temps (les diagrammes de cours montrent des chemins entre **S3 Standard**, **Standard-IA**, **Intelligent-Tiering**, **S3 One Zone-IA**, et paliers **Glacier** tels que **Instant Retrieval**, **Flexible Retrieval** et **Deep Archive** — confirmer la [matrice de transition](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-availability.html) actuelle dans la doc AWS).

- **Accès peu fréquent** → considérer **Standard-IA** (ou paliers IA adaptés aux besoins de durabilité).
- **Archive** → aller vers les classes **Glacier** quand compromis temps de récupération et coût conviennent.

### Automatiser avec une configuration lifecycle

Les **lifecycle rules** combinent :

1. **Transition actions** — déplacer les objets vers une autre classe après N jours (ex. vers Standard-IA après 60 jours, vers Glacier après 180 jours).
2. **Expiration actions** — supprimer les objets après une période (ex. access logs après 365 jours), **expirer les versions non courantes** quand le versioning est actif, ou **abandonner les multipart uploads incomplets** après N jours (ex. 7–14 jours si les uploads devaient être terminés).

Les règles peuvent cibler le **bucket entier**, un **préfixe**, ou des **tags d’objet** (ex. seulement `department=finance`).

### Scénario type examen : miniatures vs originaux

- **Images de profil source :** garder sur **Standard** au début ; lifecycle transition vers **Glacier** (ex. après 60 jours) si les utilisateurs tolèrent une récupération plus lente (ex. jusqu’à des heures pour les paliers flexibles — aligner avec le SLA de la question).
- **Miniatures :** palier moins cher acceptable (**One Zone-IA** si recréables et durabilité moindre OK) ; **expirer** après 60 jours si régénérables depuis l’original. Utiliser des **préfixes différents** (ex. `originals/` vs `thumbnails/`) pour attacher des règles différentes.

### Scénario type examen : rétention d’objets supprimés avec versioning

- Activer le **versioning** pour que les suppressions créent des **delete markers** et que les anciennes versions restent récupérables.
- Transitionner les **versions non courantes** vers **Standard-IA** pour une fenêtre de récupération quasi immédiate, puis plus tard vers **Glacier Deep Archive** pour longue rétention avec récupération lente/moins chère — selon une politique du type « récupération immédiate 30 jours » / « sous 48 h jusqu’à un an » énoncée dans l’énoncé.

### Actions des règles lifecycle (console)

Sous **Management → Lifecycle rules**, les actions incluent :

- transitionner les versions **courantes** entre classes de stockage (plusieurs étapes dans le temps supportées)
- transitionner les versions **non courantes** vers des classes moins chères/archive
- **expirer** les versions courantes après N jours
- **supprimer définitivement les versions non courantes** après N jours
- supprimer les **delete markers d’objets expirés** et/ou **abandonner les multipart uploads incomplets**

La console peut montrer une **timeline** de transitions et expirations pour versions courantes vs non courantes.

### Analytique S3 (recommandations de classe de stockage)

**S3 Storage Class Analysis** (souvent appelée analytique S3 dans les cours) génère des recommandations (rapport CSV) pour choisir les jours de transition — le matériel de formation note qu’elle cible **Standard** et **Standard-IA** (pas One Zone-IA ni Glacier). Les rapports se mettent à jour **quotidiennement** ; attendre environ **24–48 heures** avant une analyse utile. Utiliser le CSV pour ajuster les règles lifecycle.

## Notifications d’événements S3

S3 peut **émettre des événements** pour **objet créé**, **supprimé**, **restauré**, **réplication**, etc. Vous pouvez **filtrer** par préfixe/suffixe (ex. `*.jpg`).

**Destinations (classiques) :**

- topic **SNS**
- file **SQS**
- fonction **Lambda**

La livraison est en général **sous quelques secondes**, mais peut prendir **une minute ou plus**.

### Pattern de permissions

S3 **n’utilise pas** de rôle IAM sur le bucket pour ces cibles. À la place, la **destination** porte une **resource policy** (politique de topic SNS, politique de file SQS, ou **politique de ressource Lambda**) qui **autorise le service S3** à publier ou invoquer. Cela reflète l’idée des **bucket policies** mais sur la ressource **cible**.

**Rappel pratique :** configurer SQS sans mettre à jour la politique de file échoue souvent à la validation tant que **SendMessage** (ou équivalent) n’est pas autorisé pour S3 ; S3 peut envoyer un **message de test** à l’enregistrement. La charge utile d’événement inclut des champs tels que **`eventName`** (ex. `ObjectCreated:Put`) et la **clé** d’objet.

### Intégration Amazon EventBridge

Vous pouvez activer **EventBridge** pour le bucket pour que **les événements aillent aussi vers EventBridge**, puis utiliser des **règles** pour fan-out vers **de nombreux services AWS** (le matériel de formation cite **18+** destinations). Avantages : **filtrage plus riche** (métadonnées, taille, nom), **cibles multiples**, **archive/replay**, et souvent des schémas de livraison **plus fiables** que les notifications héritées seules.

## Performance S3 : base et optimisations

### Base

- S3 monte à des taux de requête très élevés avec faible latence (ordre de grandeur cours : **~100–200 ms** time to first byte pour de nombreuses charges).
- Le débit est souvent discuté **par préfixe** : de l’ordre de **3 500 PUT/COPY/POST/DELETE** et **5 500 GET/HEAD** requêtes par seconde **par préfixe** (vérifier quotas/docs actuels). Les **préfixes** sont les segments de chemin « au-dessus » du nom d’objet ; des **préfixes différents** obtiennent des partitions de scaling séparées — étaler les clés sur plusieurs préfixes augmente le débit agrégé (ex. quatre préfixes → multiplier la capacité GET en parallèle dans les conceptions).

### Multipart upload

- **Recommandé** au-dessus de **~100 Mo** ; **obligatoire** au-dessus de **5 Go**.
- Découper l’objet en parties (jusqu’à **10 000** parties), uploader les parties **en parallèle** (meilleure bande passante, **retry** seulement des parties en échec), puis **`CompleteMultipartUpload`** avec la liste **ETag** pour que S3 assemble l’objet final. Les uploads **incomplets** peuvent traîner ; nettoyer avec une **lifecycle rule** qui **abandonne les multipart uploads incomplets** après N jours.
- **CLI :** `aws s3 mb` pour créer un bucket ; le flux multipart utilise **`aws s3api`** (`create-multipart-upload`, `upload-part`, `list-parts`, `complete-multipart-upload`, `list-multipart-uploads`). Jusqu’au **complete**, les parties n’apparaissent pas comme objet normal dans la console.

### Transfer Acceleration

Accélère les transferts en envoyant les données vers une **edge proche**, puis en déplaçant sur le **backbone AWS** vers la région du bucket. Fonctionne avec **multipart**. Utile sur de longues distances géographiques (ex. client US → bucket AU).

### Byte-range GETs

Les clients demandent des **plages** de l’objet **en parallèle** pour accélérer les téléchargements ou **lire seulement un en-tête** (ex. premiers N octets). Les plages en échec peuvent être retentées en morceaux plus petits.

### KMS (prise de conscience examen)

Les objets chiffrés peuvent être soumis aux **limites API KMS** ; des taux de requête très élevés peuvent nécessiter une conscience du throttling en plus de S3 (confirmer les limites dans la doc actuelle).

## S3 Batch Operations

Exécuter des **jobs en masse** sur de nombreux objets existants avec **une définition de job** : remplacer métadonnées/tags, **copier** entre buckets, **chiffrer** des objets auparavant non chiffrés, changer ACLs, **restaurer** depuis Glacier, **invoquer Lambda** par objet pour logique custom, etc.

**Pourquoi Batch Operations vs un script :** **retries** intégrés, **suivi de progression**, **rapports de complétion**, et reporting.

**Manifest :** lister les objets via **CSV** (bucket, clé, version optionnelle) ou rapport **S3 Inventory**. **Athena** peut interroger les sorties d’inventory pour **filtrer** quelles clés vont dans le manifest (ex. trouver objets non chiffrés, puis batch-chiffrer).

**Permissions :** rôle **IAM** auquel **S3 Batch Operations** fait confiance avec moindre privilège (lire manifest, lire/écrire objets cibles, écrire rapports).

## S3 Inventory

**Inventory** liste les objets et **métadonnées** (mieux que d’appeler répétitivement les APIs **List** pour de gros buckets).

**Usages :** audits **chiffrement** et statut de **réplication**, nombre d’objets, stockage par classe, taille des **versions non courantes**, reporting conformité.

**Sortie :** **CSV**, **ORC**, ou **Apache Parquet** ; planning **quotidien** ou **hebdomadaire**. La première livraison peut prendre jusqu’à **~48 heures**. Interroger les sorties avec **Athena**, **Redshift**, **Spark**, **Hive**, **Presto**, etc.

Le **bucket destination** des rapports doit être dans la **même région** que la configuration du bucket source (erreur fréquente en démo).

**Nettoyage :** désactiver ou supprimer les configurations d’inventory quand plus nécessaire pour éviter la génération continue de rapports.

**Fichiers manifest :** `manifest.json` + checksum décrivent les parties CSV/Parquet et le schéma.

## Amazon Athena

**Athena** est un service **SQL** **serverless** sur des données **dans S3** (lignée moteur : classe **Presto/Trino**). **Pas** de serveurs ou d’entrepôt à provisionner ; vous payez pour les **données scannées** (par To).

**Formats :** CSV, JSON, **ORC**, **Avro**, **Parquet**, et autres.

**Usages typiques :** analytique ad hoc, BI, reporting, requêter des **logs** (ALB, **CloudTrail**, **VPC Flow Logs**, **S3 access logs**).

**Indice examen :** « SQL serverless sur données dans S3 » → **Athena**.

### Performance et coût

- Préférer les formats **colonnaires** (**Parquet**, **ORC**) pour scanner **moins de colonnes** ; souvent convertir via **Glue** ETL depuis CSV.
- **Compresser** les données pour réduire les octets scannés.
- **Partitionner** les clés S3 (ex. `year=1991/month=01/day=01/`) pour que les prédicats élaguent les partitions et scannent moins de données.
- Préférer **moins de fichiers, plus gros** (ex. balle **≥ ~128 Mo**) à d’énormes nombres de minuscules fichiers pour réduire l’overhead.

### Requête fédérée

Athena peut interroger des **sources externes** via **connecteurs de source de données** (implémentés avec **Lambda**) : ex. **DynamoDB**, **RDS/Aurora**, **CloudWatch Logs**, **Redshift**, DB on-premises. Les résultats peuvent être réécrits vers **S3**.

### Pattern pratique (S3 access logs)

1. Définir **query result location** dans S3 dans les paramètres Athena.
2. `CREATE DATABASE`, puis **`CREATE TABLE`** pointant vers le **préfixe** du bucket de logs (la doc fournit des modèles — souvent seuls **nom de bucket** et **préfixe** à éditer ; le **`/`** final compte).
3. Exécuter SQL : **aperçu**, agrégats (ex. comptes par **statut HTTP**), investiguer motifs **403** / **404**.

## MFA Delete

**MFA Delete** ajoute un contrôle supplémentaire pour les opérations destructrices liées au versioning : les appelants doivent fournir un **code MFA valide** (app MFA virtuelle, jeton matériel, etc.) en plus des identifiants normaux.

### Quand MFA est requis (une fois activé)

- **Supprimer définitivement une version d’objet spécifique** (vraie suppression de version, pas seulement un delete marker).
- **Suspendre le versioning** sur le bucket.

### Quand MFA n’est pas requis

- **Activer** le versioning.
- **Lister** les versions d’objet (y compris versions « supprimées » / non courantes).

### Exigences et opérations

- Le **versioning doit être activé** sur le bucket d’abord (MFA Delete est un contrôle lié au versioning).
- **Seul l’utilisateur root propriétaire du bucket** peut **activer ou désactiver MFA Delete** (selon le matériel de cours — confirmer la doc AWS actuelle ; workflow étroit et sensible).
- La **console AWS Management** **ne peut souvent pas** basculer MFA Delete ; vous utilisez typiquement **AWS CLI** (ex. `put-bucket-versioning` avec ARN du périphérique MFA + **série + code TOTP courant** dans les paramètres API).

**Avertissement opérationnel :** les démos utilisent des **clés d’accès root** pour la CLI — **évitez** de laisser des clés d’accès root actives longtemps ; désactivez/supprimez-les après la tâche.

## Journalisation d’accès serveur S3

La **journalisation d’accès serveur** écrit un enregistrement de journal pour les **requêtes** contre un bucket (autorisées ou refusées) dans un **bucket cible séparé** sous forme de fichiers journaux. Utilisez-la pour **audit** et analyse ultérieure (ex. **Athena**).

- Le **bucket de journalisation (destination)** doit être dans la **même région** que la configuration du bucket source (selon le cours).
- **Ne jamais** définir le **bucket de journalisation comme le même bucket** que celui que vous surveillez : chaque `PUT` d’un objet journal génère plus d’accès, qui génère plus de journaux → **croissance infinie** et **coût incontrôlé**.

Activer la journalisation dans la console met en général à jour la **bucket policy de la cible** pour que le **service de journalisation S3** puisse `PUT` les objets journaux. La **livraison des journaux peut être en retard** (minutes à heures en pratique).

Le **format de ligne** de journal est documenté par AWS (disposition des champs pour parsing). Un **préfixe** optionnel dans la destination organise les clés (ex. `logs/`).

## WORM : Glacier Vault Lock vs S3 Object Lock

### S3 Glacier Vault Lock (vaults Glacier classiques)

Pour les workflows type **vault Glacier** (cadrage cours) : appliquer une **Vault Lock policy**, puis **verrouiller** cette policy pour qu’elle **ne puisse pas être modifiée ou supprimée**. Ça supporte un modèle **WORM** (**write once, read many**) : les objets sous cette policy sont **immutables** pour conformité/rétention. Traiter comme **immutabilité forte** pour archives réglementées (formulation formation : même admins/AWS ne peuvent contourner la policy verrouillée).

### S3 Object Lock (sur buckets S3)

**Object Lock** permet aussi **WORM**, mais à la granularité **par objet / par version** sur des buckets **versionnés**.

**Prérequis :** **Versioning activé** (Object Lock se configure à la création du bucket ou avec contraintes spécifiques — suivre console/doc actuelles).

**Modes de rétention :**

| Mode | Strictesse |
|------|------------|
| **Compliance** | **Personne** (y compris **root**) ne peut raccourcir la rétention, supprimer tôt des versions protégées, ou affaiblir le mode — immutabilité maximale pour une période de rétention définie. |
| **Governance** | La plupart des utilisateurs ne peuvent pas contourner ; les principaux **privilégiés** avec les bonnes permissions **IAM** (ex. `s3:BypassGovernanceRetention`) peuvent **ajuster la rétention** ou **supprimer** là où autorisé. |

Vous définissez une **période de rétention** (souvent **extensible** ; le mode compliance ne peut pas être **raccourci**).

**Legal hold :** indépendant de la rétention — marque un objet comme **gelé indéfiniment** jusqu’à retrait (ex. litige). Tout utilisateur avec **`s3:PutObjectLegalHold`** (et associés) peut **poser ou lever** le legal hold quand votre gouvernance le permet.

**Focus examen :** connaître **compliance vs governance**, **période de rétention vs legal hold**, et qu’**Object Lock est par objet/version**, alors que **Vault Lock** est au **niveau policy de vault** pour les vaults style Glacier.

## Accès privé à S3 depuis un VPC

### Gateway endpoint (S3) — réponse d’examen par défaut pour sous-réseaux privés

- **Pas de frais horaires** pour l’endpoint **gateway** S3.
- Utilisé par les ressources **dans ce VPC** via **route tables** (prefix list cible S3 dans la région).
- Le **support DNS VPC** doit être activé pour que les instances résolvent et routent correctement ; vous utilisez toujours les **noms DNS S3 standard** (le trafic reste sur le **réseau AWS** vers S3 plutôt que sur le chemin Internet public).
- Les **security groups** doivent autoriser le trafic **sortant** qui atteint le chemin endpoint selon votre conception.

Adapté aux **EC2 dans sous-réseaux privés** atteignant S3 sans chemin public via NAT.

### Interface endpoint (PrivateLink) pour S3

- Crée des **ENIs** dans les sous-réseaux avec coût **par AZ** (ordre de grandeur cours : **~0,01 $/heure par AZ** — vérifier la tarification).
- Peut supporter l’accès **on-premises** via **VPN** ou **Direct Connect** dans le VPC, puis vers l’endpoint.
- Nécessite **DNS support** et **DNS hostnames** sur le VPC pour que les noms privés fonctionnent comme attendu.

**Examen :** préférer **gateway endpoint** pour **EC2 privé → S3** quand la question porte sur l’accès **gratuit, interne au VPC** ; savoir que les **interface endpoints** existent pour les schémas **PrivateLink** et **hybrides**.

## IAM Access Analyzer pour Amazon S3

**IAM Access Analyzer** (appliqué à S3) **évalue** les politiques de ressources et contrôles associés — **bucket policies**, **ACLs**, **access point policies**, etc. — et **signale** quels buckets sont accessibles **publiquement** ou **partagés avec des comptes AWS externes** (exposition non voulue).

Utilisez-le pour **examiner les findings** : accès attendu vs **accidentel** inter-comptes ou public, puis **resserrer** les politiques. C’est une fonctionnalité de **monitoring / audit continu** qui peut apparaître comme **une question d’examen** sur le partage non voulu.

## Points clés

- S3 = buckets **régionaux** avec **unicité globale** des noms ; les objets sont des **clés**, pas de vrais dossiers.
- Gros objets nécessitent **multipart upload** au-dessus de **5 Go** (recommandé **> ~100 Mo**) ; taille max d’objet **5 To** ; jusqu’à **10 k** parties ; **lifecycle** peut abandonner les **MPU** périmés ; **`aws s3api`** pour multipart bas niveau.
- La sécurité combine **IAM**, **bucket policies**, ACLs optionnelles, **chiffrement**, et **Block Public Access**.
- Les **URL pré-signées** accordent un accès limité dans le temps sans rendre le bucket public.
- Le **versioning** plus la compréhension des **delete markers** vs **suppressions de version** est essentiel pour mises à jour sûres et récupération.
- Après **première activation du versioning**, laisser le temps à la **propagation** avant écritures critiques ; **`NoSuchKey`** peut apparaître pendant cette fenêtre (confirmer dans la doc actuelle).
- La **réplication** exige **versioning des deux côtés**, un **rôle IAM**, copie **async** des objets **nouveaux** par défaut, **Batch Replication** pour backfill, sync optionnelle des **delete markers**, **pas** de réplication des **suppressions définitives de version**, et **pas de chaînage** ; **RTC** optionnel pour une fenêtre de réplication de type SLA **15 minutes** (selon conditions produit), visibilité **CloudWatch**, et **coût par Go** supplémentaire.
- La réplication **inter-comptes** nécessite souvent une **bucket policy de destination** plus planification de **propriété des objets** (**owner override** quand le compte destination doit posséder et lire les objets).
- Le **lifecycle** automatise **transitions** et **expirations** (versions courantes/non courantes, delete markers, MPU incomplets) ; portée par **préfixe** ou **tags** ; **S3 Analytics** aide à ajuster Standard → IA.
- Les **notifications d’événements** → **SNS / SQS / Lambda** via **resource policies** sur les cibles ; **EventBridge** permet un routage plus riche ; livraison en général rapide mais pas strictement temps réel.
- **Performance :** RPS baseline très élevé **par préfixe** ; optimiser avec **multipart**, **Transfer Acceleration**, **byte-range GETs**, et **répartition des préfixes**.
- **Batch Operations** + **Inventory** (+ **Athena** pour filtrer les manifests) pour corrections à grande échelle (ex. chiffrer tous les objets non chiffrés).
- **Athena** = **SQL** serverless sur S3 ; minimiser le scan avec **Parquet/ORC**, **compression**, **partitioning**, et fichiers bien dimensionnés ; requêtes **fédérées** optionnelles via connecteurs.
- **MFA Delete** (buckets versionnés) : workflow **CLI/root owner** ; MFA pour **suppression définitive de version** et **suspendre le versioning** — pas pour activer le versioning ou lister les versions.
- **Access logging :** bucket **destination séparé**, **même région** ; **ne jamais** journaliser dans le **bucket source** (éviter **boucles de rétroaction**) ; analyser avec **Athena**.
- **WORM :** **Glacier Vault Lock** (policy de vault verrouillée) vs **S3 Object Lock** (**compliance** vs **governance**, **rétention** vs **legal hold**, **`s3:PutObjectLegalHold`**).
- **S3 privé depuis VPC :** **gateway endpoint** (gratuit, route tables) ; **interface endpoint** (coût ENI, **PrivateLink**, chemins on-prem) ; les réglages **DNS** comptent.
- **Access Analyzer** met en évidence l’accès S3 **public** et **inter-comptes** à partir des policies/ACLs/access points.

---
*Traduit par Claude*
