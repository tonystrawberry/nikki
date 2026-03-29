---
title: "AWS Security, conformité, chiffrement et secrets pour CloudOps"
date: "2026-03-29"
excerpt: "Notes CloudOps sur WAF, Shield, Firewall Manager, Inspector, logs avec Athena, GuardDuty, Macie, Trusted Advisor, Security Hub, Audit Manager, KMS (rotation, MRK, suppression), ACM, et Secrets Manager vs Parameter Store."
author: "Tony Duong"
category: "note"
tags: ["aws", "waf", "shield", "firewall-manager", "kms", "acm", "tls", "secrets-manager", "security-hub", "guardduty", "inspector", "macie", "cloudops", "certification", "compliance", "encryption"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 13
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Synthèse **sécurité et conformité** pour la prépa **SysOps / CloudOps** : contrôles **périmètre** (**WAF**, **Shield**, **Firewall Manager**), services de **vulnérabilité** et **confidentialité des données**, posture **centralisée** (**Security Hub**, **GuardDuty**, **Trusted Advisor**, **Audit Manager**), schéma **logs → S3 → Athena**, primitives de **chiffrement** (**KMS**, **ACM**) plus **Secrets Manager** vs **Systems Manager Parameter Store**.

Pour le **mouvement de données** et les **sauvegardes** en **reprise après sinistre**, voir **[AWS DataSync and AWS Backup: Disaster Recovery Notes](/fr/posts/aws-datasync-and-backup-disaster-recovery-notes)**.

## AWS WAF (Web Application Firewall)

- Protection **couche 7 (HTTP/HTTPS)** — à opposer à la **couche 4** (**TCP/UDP**) où vit le **NLB** ; le **WAF ne s’attache pas au NLB** dans le scénario d’examen.
- **S’attache à :** **Application Load Balancer**, **API Gateway**, **CloudFront**, API GraphQL **AppSync**, pools d’utilisateurs **Cognito**.
- Les **Web ACLs** contiennent des **règles** ; les **groupes de règles** regroupent des règles réutilisables. Les **jeux d’IP** peuvent contenir jusqu’à **10 000** adresses par jeu (plusieurs règles/jeux pour aller au-delà).
- Types de règles cités en formation : **IP** allow/deny, **en-têtes HTTP** et **corps**, chaînes **URI** (ex. **injection SQL**, motifs **XSS**), **contraintes de taille**, **geo match** (pays autorisés/bloqués), règles **basées sur le débit** (ex. plafond de requêtes par IP pour abus type **DDoS**).
- Web ACLs **régionales** pour les ressources régionales ; **CloudFront** utilise des Web ACLs **globales** créées dans **us-east-1** (N. Virginia).
- **Architecture d’examen :** besoin de **WAF** + **IP statiques** → **Global Accelerator** (IP statiques Anycast) devant un **ALB**, avec **WAF** sur l’**ALB** (même Région que l’app).

## AWS Shield et AWS Firewall Manager

### Shield

- **Shield Standard :** **gratuit**, activé pour tous les clients ; atténue les attaques **L3/L4** courantes (floods **SYN/UDP**, attaques par réflexion, etc.).
- **Shield Advanced :** palier **payant** optionnel (cours de l’ordre de **~3 000 $/mois par organisation** — confirmer la tarification) ; atténuation **DDoS** plus large pour **EC2**, **ELB**, **CloudFront**, **Global Accelerator**, **Route 53** ; **équipe de réponse DDoS 24/7 (DRT)** ; **protection des coûts** lors des montées en charge sous attaque ; atténuation **couche application** **automatique** pouvant **créer et ajuster des règles WAF** pour événements **L7**.

### Firewall Manager

- **Politiques de sécurité** à l’échelle de l’**organisation** sur les **comptes membres** : règles **WAF**, paramètres **Shield Advanced**, **lignes de base** des **security groups** pour **EC2/ALB/ENI**, **Network Firewall**, **Route 53 Resolver DNS Firewall**.
- Les politiques sont définies **par Région** et **répliquées** dans l’org ; les **nouvelles** ressources (ex. nouvel **ALB**) peuvent **hériter automatiquement** des politiques — différenciateur clé par rapport au seul **WAF** ponctuel.
- **Positionnement :** **WAF** seul pour un compte **unique** / besoin **ponctuel** ; **Firewall Manager** pour **standardiser** et **automatiser** le WAF (et autres pare-feu) **multi-comptes** ; **Firewall Manager** peut aussi aider à **déployer Shield Advanced** à l’échelle de l’org.
- Les démos console signalent souvent un **coût mensuel par politique** pour Firewall Manager — éviter **Subscribe** sur des comptes personnels pendant les labs.

### Comment tout s’assemble

**WAF** + **Shield Advanced** + **Firewall Manager** sont **complémentaires** : définir les ACL dans **WAF**, les **orchestrer** avec **Firewall Manager** pour la **cohérence multi-comptes**, ajouter **Shield Advanced** pour **DRT**, **protection des coûts** et **réglage automatique L7** du WAF sous attaque.

## Amazon Inspector

- Évaluations de sécurité **continues** pour **EC2** (via agent **SSM** — les instances doivent être **managées** par **Systems Manager**), **images conteneur** poussées vers **ECR**, et **Lambda** (au déploiement) pour **CVE** / dépendances ; analyse de **reachability réseau** pour **EC2**.
- Les findings vont vers **Security Hub** et **EventBridge** ; les **scores de risque** aident à prioriser.
- **Tarification / essais :** le cours mentionne une facturation par ressource et des essais — **désactiver** en fin de lab.

## Amazon Macie

- Découverne **gérée** de **données sensibles** (ex. **PII**) dans **S3** avec **ML** et correspondance de motifs.
- Les alertes passent par **EventBridge** → **SNS**, **Lambda**, etc. Le cours présente **Macie** comme **centré S3** pour cette section.

## Journalisation d’audit et analyse

Sources de logs **sécurité et audit** courantes :

| Source | Rôle (haut niveau) |
|--------|-------------------|
| **CloudTrail** | **Audit** des **API** et de la console |
| **AWS Config** | **Configuration** et **conformité** dans le temps |
| **CloudWatch Logs** | **Logs** applicatifs et de service, rétention |
| **VPC Flow Logs** | Visibilité du **trafic IP** dans le VPC |
| **ELB access logs** | **Métadonnées** des requêtes via le load balancer |
| **CloudFront** logs | Requêtes viewers vers les distributions |
| **WAF** logs | Requêtes évaluées par le **WAF** |

**Pattern d’examen :** déposer les logs dans **S3**, analyser avec **Athena** (ex. enquêter sur les accès **ELB** quand les instances **EC2** ont disparu). Durcir les compartiments de logs : **chiffrement**, politiques **IAM/compartiment**, **MFA** ; rétention longue avec **Glacier** / **S3 Object Lock** / contrôles type **Vault Lock** quand la conformité exige l’**immuabilité**.

## Amazon GuardDuty

- **Détection de menaces** avec **ML**, **détection d’anomalies** et **renseignement sur les menaces** ; **pas d’agents** ; essai **30 jours** dans le récit du cours.
- **Sources de données principales :** **CloudTrail** (y compris APIs **management** et **data plane** **S3** inhabituels), **VPC Flow Logs**, **logs DNS** du **Route 53 Resolver** (ex. requêtes suspectes ou **encodées** suggérant un compromis).
- **Sources optionnelles** en formation (vérifier la liste produit actuelle) : logs d’audit **EKS**, activité de connexion **RDS/Aurora**, **EBS**, activité réseau **Lambda**, événements de données **S3**, surveillance **runtime**, etc.
- **Findings** → **EventBridge** → **Lambda**, **SNS**, etc.
- L’activité **crypto** / **mining** est citée comme **famille de findings** **dédiée** aux examens.

## AWS Trusted Advisor

- **Aucune installation** ; **contrôles** de haut niveau sur **optimisation des coûts**, **performance**, **sécurité**, **tolérance aux pannes**, **limites de service**, **excellence opérationnelle** (exemples : snapshots **EBS/RDS** publics, hygiène **IAM**).
- Palier **gratuit** vs support **Business/Enterprise** pour les **contrôles complets** et l’accès **API AWS Support**.
- Intégrations : **Security Hub**, **Config**, **Compute Optimizer** ; alarmes **CloudWatch** sur des métriques comme l’usage des **limites de service** → **SNS**.
- **Organizations :** vue **Trusted Advisor** **agrégée** depuis le compte **management** lorsque l’org a **toutes les fonctionnalités** et un plan de **support** éligible ; activer **trusted access** / **administrateur délégué** selon la doc.

## AWS Security Hub

- Tableau de bord **central** de posture sécurité ; **agrège** les findings de **GuardDuty**, **Inspector**, **Macie**, **IAM Access Analyzer**, **Systems Manager**, **Firewall Manager**, **Health**, **Config**, et produits **partenaires**.
- **AWS Config doit être activé** (prérequis) pour les contrôles **basés sur la configuration** de Security Hub.
- **Standards de sécurité** (ex. **CIS AWS Foundations**) et **contrôles automatisés** ; findings vers **EventBridge** ; **Amazon Detective** pour **investigation** et analyse de cause racine.
- **Multi-compte :** intégration avec **Organizations** ; **administrateur Security Hub délégué** optionnel pour une configuration centralisée (ex. lancer **CIS** sur les membres).
- **Tarification :** facturation par contrôle et par **ingestion de findings** ; le cours mentionne une **free tier** sur les premiers **10 000** événements de findings et un essai **30 jours** — confirmer la tarification actuelle.

## AWS Audit Manager

- Évaluations **continues** des **risques** et de la **conformité** pour des cadres tels que **GDPR**, **HIPAA**, **PCI DSS**, **SOC 2**.
- Sélectionner les **cadres**, définir le **périmètre** (comptes, Régions, services), collecter des **preuves automatisées** dans des **dossiers de preuves**, mener des **revues de contrôle** (avec délégation), suivre la **remédiation**, exporter des rapports **prêts pour audit**.

## AWS KMS (Key Management Service)

### Bases

- **Autorisation** intégrée à **IAM** ; **chaque utilisation** d’une clé est **auditable** via **CloudTrail** (fait très « examen »).
- **Clés symétriques :** un matériau de clé pour **chiffrer et déchiffrer** ; vous n’exportez jamais l’octet brut de la clé — uniquement les appels **API KMS**. Défaut pour la plupart des intégrations **services AWS**.
- **Clés asymétriques :** chiffrement **public** / déchiffrement **private** (ou **signature/vérification**) ; la clé **publique** peut être distribuée aux clients **hors** AWS qui ne peuvent pas appeler **KMS** ; l’usage de la clé **privée** reste via API.

### Types de clés

| Type | Notes |
|------|--------|
| **AWS owned** | Gratuit ; invisible ; utilisé en coulisse (ex. histoires de chiffrement côté serveur par défaut **SSE-S3** / **DynamoDB**). |
| **AWS managed** | Gratuit ; motif d’**alias** **`aws/<service>`** ; les **politiques de clé** restreignent souvent **ViaService** au service propriétaire (ex. **EC2** pour **EBS**). |
| **Customer managed** | Vous contrôlez la **politique de clé** ; le cours cite **~1 $/mois** par clé plus **~0,03 $ / 10 000** appels API — confirmer la tarification. |

### Politiques de clé et cross-account

- **Chaque clé KMS doit avoir une politique de clé** — sans elle, **personne** ne peut utiliser la clé (récit plus strict que l’IAM seul sur un compartiment **S3**).
- **Politique par défaut :** fait confiance au **compte** + **IAM** pour les allows fins.
- **Politiques personnalisées** pour **moindre privilège** et accès **cross-account** (ex. partager un snapshot **EBS** chiffré : la politique de la **CMK** source fait confiance à l’autre compte ; le compte cible **copie** le snapshot et **re-chiffre** avec **sa propre CMK**).

### Clés régionales et EBS

- Les clés sont **régionales**. Une **copie de snapshot EBS** **inter-Régions** = le snapshot est **re-chiffré** avec une **CMK dans la Région de destination** (la même clé logique ne couvre pas cette opération inter-Régions).

### Rotation

- **Clés KMS managées par AWS :** rotation automatique environ **tous les ans**.
- **Clés symétriques gérées par le client :** rotation **automatique** optionnelle sur une période entre **90** et **2 560** jours (souvent présentée comme ~**1 an** par défaut) ; la rotation **automatique** et **à la demande** conserve le **même key ID** tandis que le matériau de **backing key** tourne ; l’ancien texte chiffré se déchiffre toujours.
- **Rotation à la demande :** **symétriques gérées par le client** uniquement ; ne remplace pas le planning automatique ; soumise aux **quotas** de fréquence.
- **Rotation manuelle** (ex. plus rapide que ce que KMS automatise) : créer une **nouvelle** clé (**nouveau key ID**), garder l’**ancienne** clé pour **déchiffrer**, déplacer un **alias** avec **UpdateAlias** pour que les applis gardent un **nom d’alias** stable.
- **Clés asymétriques** et **importées** : schémas de rotation **manuelle** basés sur **alias** ; les clés **importées** s’appuient sur des flux de rotation **manuelle** du matériau (les alias aident).

### Clés multi-Régions (MRK)

- **Primaire** dans une Région et **répliques** dans d’autres partagent le **même key ID** et le **même matériau de clé** pour **chiffrer en Région A** et **déchiffrer en Région B** **sans re-chiffrer** le texte pour ce schéma ; la rotation sur le primaire **se réplique**.
- Chaque réplica a **sa propre** politique de clé ; les MRK ne sont **pas** un objet « global » unique.
- À utiliser quand vous avez vraiment besoin de crypto **inter-Régions** avec une clé logique unique (ex. **DynamoDB** **global**, **Aurora** **global**, chiffrement **côté client** inter-Régions). Par défaut on **préfère les clés régionales** sans cas d’usage MRK clair.

### Suppression et prudence

- Planifier la suppression de clé avec une **période d’attente** de **7 à 30 jours**. En **pending deletion**, la clé **ne peut pas** être utilisée pour des opérations **crypto** (les services dépendants **échouent**) ; la **rotation planifiée** est suspendue ; vous pouvez **annuler** la suppression pendant la fenêtre.
- Préférer **désactiver** une clé d’abord en cas de doute. **Automatisation :** **CloudTrail** enregistre les appels **KMS** **refusés** lorsque des applis référencent encore une clé **en suppression** → **filtre de métriques** **CloudWatch Logs** → **alarme** → **SNS** pour repérer les **dépendances** avant disparition de la clé.

### Changer la CMK sur un volume EBS

- Vous **ne pouvez pas** changer la **CMK** sur un volume **EBS** existant in-place : **snapshot**, créer un **nouveau** volume depuis le snapshot, et choisir une **nouvelle clé KMS** (chemin de re-chiffrement).

## AWS Certificate Manager (ACM)

- **Provisionner, gérer et déployer** des certificats **TLS** pour **HTTPS** sur **ALB/CLB/NLB**, **CloudFront**, **API Gateway** — **pas** pour exporter des certificats **publics** ACM vers des instances **EC2** arbitraires (les clés **privées** des certificats **publics** émis par ACM restent dans le périmètre de confiance **ACM**).
- Certificats **publics** ACM : **gratuits** ; **renouvellement automatique** environ **60 jours** avant expiration lorsque ACM a émis le certificat.
- **Validation :** **DNS** (préféré pour l’automatisation ; **Route 53** peut créer les enregistrements automatiquement) ou **email** aux contacts du domaine.
- Certificats **publics importés** : **pas** de renouvellement auto ACM ; **EventBridge** peut émettre des événements **quotidiens** d’**expiration** à partir de **~45** jours avant échéance (configurable) ; la règle managée **AWS Config** **`acm-certificate-expiration-check`** marque les certificats bientôt expirés **non conformes** — les deux peuvent déclencher **Lambda** / **SNS** / **SQS**.
- **ALB :** règle d’écouteur optionnelle pour **rediriger HTTP → HTTPS**.
- **Domaines personnalisés API Gateway :** **Edge-optimized** → trafic via **CloudFront** → certificat ACM doit être en **us-east-1** ; **Regional** → certificat ACM dans la **même Région** que l’étape d’API ; **Private** APIs → **endpoint d’interface VPC** + **politique de ressource**.

## AWS Secrets Manager vs Systems Manager Parameter Store

### Secrets Manager

- Conçu pour les **secrets** avec **rotation automatique** optionnelle sur planning via **Lambda** (Lambdas de rotation gérées par AWS pour **RDS**, **Redshift**, **DocumentDB**, etc., ou Lambdas **personnalisées** pour clés API et autres secrets).
- Le chiffrement **KMS** est **obligatoire** pour le matériau secret stocké.
- **Secrets multi-Régions :** **répliquer** vers d’autres Régions ; **promouvoir** une réplica après événements **DR**.
- **Tarification** (ordre de grandeur du cours) : **~0,40 $/secret/mois**, **~0,05 $ / 10 000** appels API, essai **30 jours** — vérifier la tarification.
- **CloudTrail** journalise les **appels API** et les **événements non-API** spécifiques à **Secrets Manager** (ex. **RotationStarted**, **RotationSucceeded**, **RotationFailed**, **RotationAbandoned**, cycle de vie de suppression de version de secret). **Filtres de métriques** sur **RotationFailed** → alarme **CloudWatch** → **SNS** ; déboguer les rotations en échec dans les **CloudWatch Logs** **Lambda**.

### Parameter Store

- Stockage de paramètres **plus large** ; **coût** plus bas ; chiffrement **KMS** **optionnel** (**SecureString**).
- **Pas** de rotation native — implémenter **planning** **EventBridge** → **Lambda** pour faire tourner les identifiants et **mettre à jour** le paramètre.
- Peut **référencer** des secrets **Secrets Manager** via les API **SSM** dans les scénarios d’intégration décrits en formation.

## Points clés à retenir

- **WAF** = **L7** uniquement ; **ALB**, **API Gateway**, **CloudFront**, **AppSync**, **Cognito** — **pas NLB** ; ACLs **CloudFront** **globales** en **us-east-1** ; **GA + ALB + WAF** pour **IP statiques** + **WAF**.
- **Shield Standard** vs **Advanced** ; **Firewall Manager** pour **WAF** / **Shield** / **SG** / **Network Firewall** / **DNS Firewall** **à l’échelle de l’org** avec **intégration automatique** des nouvelles ressources.
- **Inspector** = scan type **CVE** sur **ECR** / **EC2** / **Lambda** + **reachability** ; **Macie** = découverte de **PII** dans **S3**.
- Sources de **logs** → **S3** → **Athena** ; verrouiller et **conserver** les compartiments de logs pour la **conformité**.
- **GuardDuty** = **CloudTrail** + **VPC Flow** + **DNS** (+ sources optionnelles) ; findings **crypto-mining** ; automatisation **EventBridge**.
- **Trusted Advisor** = six **piliers** ; fonctionnalités **complètes** avec **Business/Enterprise** ; agrégation **Org** avec bon **support** + **trusted access**.
- **Security Hub** nécessite **Config** ; agrège les grands services de **sécurité** + **partenaires** ; **Detective** pour l’investigation ; **admin délégué** pour le **multi-compte**.
- **Audit Manager** = preuves **continues** de cadres (**GDPR**, **HIPAA**, **PCI**, **SOC 2**, etc.).
- **KMS** = **CloudTrail** sur toute utilisation de clé ; **symétrique** vs **asymétrique** ; **AWS owned** / **AWS managed** / **customer managed** ; **politiques de clé obligatoires** ; **EBS inter-Régions** = **re-chiffrement** ; snapshots chiffrés **cross-account** = **politique de clé** + **copie** + **CMK cible** ; **rotation** vs rotation **manuelle** par **alias** ; **MRK** pour certains modèles **inter-Régions** ; **pending deletion** **bloque** la crypto ; changement de **CMK EBS** via **snapshot**.
- **ACM** = **TLS** pour endpoints **managés** AWS ; validation **DNS** + **renouvellement auto** ; certificats **importés** nécessitent hygiène **EventBridge**/**Config** ; **API Gateway** **edge** = certificat **us-east-1**.
- **Secrets Manager** = **rotation** + **KMS** + **multi-Région** + riches **événements** **CloudTrail** ; **Parameter Store** = **moins cher**, **flexible**, rotation **DIY**, **KMS** optionnel.

---
*Article associé : [AWS DataSync and AWS Backup: Disaster Recovery Notes](/fr/posts/aws-datasync-and-backup-disaster-recovery-notes).*

---
*Traduit par Claude*
