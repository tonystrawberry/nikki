---
title: "Gestion de compte AWS : Health Dashboard, Organizations, SCP et Control Tower"
date: "2026-03-28"
excerpt: "Notes CloudOps sur AWS Health (vues service / compte / org, automation EventBridge), AWS Organizations (OU, facturation consolidée, SCP, partage RI, PrincipalOrgID) et les landing zones Control Tower avec guardrails."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "health", "organizations", "scp", "control-tower", "multi-account", "billing", "sysops", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 10
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Contenu à fort rendement pour **SysOps** / **CloudOps** : comment **AWS Health** remonte les incidents, comment **Organizations** structure les comptes et comment les **SCP** les limitent, et comment **Control Tower** démarre un patrimoine multi-compte gouverné. Le cours place aussi la **facturation** (payeur consolidé, outils de coût) avec le **compte management** de l’org — utilisez la **console Billing** du payeur pour les factures et l’allocation ; ci-dessous l’accent est mis sur Health, Organizations et Control Tower. Pour **Service Catalog**, **alarmes de facturation CloudWatch**, **Budgets**, **Cost Explorer**, **tags d’allocation de coûts**, **CUR**, **Compute Optimizer** et **Billing Conductor**, voir **[AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools](/fr/posts/aws-service-catalog-billing-cost-management)**.

## AWS Health Dashboard (deux volets)

### Santé du service (public / « Service History »)

- Anciennement **AWS Service Health Dashboard** — statut **Région** × **service** dans le temps, flux **RSS** et incidents **ouverts** globaux touchant beaucoup de clients.
- Vue **générale** de disponibilité, pas calibrée sur **vos** ressources.

### Santé de votre compte (personnalisée)

- Anciennement **Personal Health Dashboard (PHD)** ; aujourd’hui **Health** pour **vos comptes** dans la console (**cloche** → **Event log** / Health).
- Affiche les incidents **ouverts** et **récents**, les **changements planifiés** (ex. maintenance **EBS**), les **ressources affectées**, des pistes de **remediation** et un **journal d’événements** (ouverture / résolution) pour les problèmes qui **touchent vraiment** les ressources que vous utilisez.
- Expérience **globale** : incidents pertinents pour **votre** usage (ex. **EC2** en **us-east-2**) même quand la santé publique du service semble large.

### Santé de l’organisation

- Agrège la visibilité **Health** sur **tous les comptes** d’une **AWS Organization** (à configurer dans le contexte org).
- Automatiser par-dessus avec **EventBridge** (voir ci-dessous).

## AWS Health → EventBridge

**AWS Health** émet des événements que vous pouvez faire matcher par des règles **EventBridge** vers **SNS**, **Lambda**, **SQS**, **Kinesis**, etc.

- Couvre les événements **spécifiques au compte** (ressources que vous utilisez) et les événements **publics** de service lorsque c’est utile.
- **Cas d’usage :** e-mail quand des instances **EC2** ont des **mises à jour de plateforme** planifiées ; **Lambda** sur des signalements type **clés IAM exposées** pour **désactiver** les clés ; **reboot EC2** / autres **cibles** quand des instances sont en **retirement** planifié pour que les charges se rétablissent sans attendre l’arrêt forcé.

**Remarque :** traitez l’orchestration comme **asynchrone**, comme pour les autres intégrations de plan de contrôle AWS — prévoyez **retries** et **idempotence**.

## AWS Organizations

Service **global** pour regrouper **plusieurs comptes** dans une **organization**.

- **Compte management** (payeur / « master ») — détient la **facturation consolidée** (**un** moyen de paiement pour **tous** les membres). Les comptes **membres** rejoignent par **invitation** (acceptation dans l’enfant ; les invitations **expirent**, de l’ordre de **deux semaines** dans le cours) ou sont **créés** par l’org (e-mail + nom de **rôle IAM** type **OrganizationAccountAccessRole**).
- Un compte AWS ne peut appartenir qu’à **une seule** organization à la fois.
- **Avantages tarifaires :** l’usage **agrégé** peut améliorer les remises **volume** (**EC2**, **S3**, …) ; les remises **Reserved Instances** et **Savings Plans** peuvent être **partagées** entre comptes lorsque le **partage** est **activé** des **deux** côtés (ou pour tous les comptes concernés) — on peut **désactiver** le partage par compte (y compris payeur) pour **isoler** les engagements.

### Unités d’organisation (OU)

- L’**OU racine** contient le compte **management** ; créez des OU imbriquées (**dev** / **test** / **prod**, **business unit**, **projet**, ou mixte).
- **Déplacez** les comptes membres entre OU pour aligner **SCP** et périmètres opérationnels. **Bonne pratique :** garder le compte **management** à la **racine** sauf raison forte.

### Pourquoi multi-compte (vs un compte, plusieurs VPC)

- **Isolation** de blast radius plus forte que les seuls VPC.
- **Standards de tagging** pour l’**allocation des coûts** ; **CloudTrail** à l’échelle de l’org vers un **bucket S3 central** ; compte de **logging central** pour **CloudWatch Logs** ; **rôles IAM cross-account** pour **break-glass** / automation depuis le compte **management**.

### Facturation consolidée (angle SysOps)

- Les **charges** remontent au compte **management** ; utilisez **Billing** et **Cost Management** pour **factures**, **budgets** et **allocation** (tags, **CUR**, etc.).

## Service control policies (SCP)

Les **SCP** sont des politiques d’**organization** attachées à la **racine**, aux **OU** ou aux **comptes**. Elles **restreignent** le **maximum** de permissions que les **identités IAM** des comptes **membres** peuvent jamais obtenir — elles **n’accordent** pas de permissions à elles seules.

- **Le compte management est exempt** — **aucune SCP** ne limite le compte **management** (évite de verrouiller l’org).
- Accès effectif dans un membre = **intersection** des **politiques d’identité** et de **toutes les SCP héritées** le long du chemin d’OU ; un **`Deny` explicite** dans le périmètre **l’emporte**.
- On attache en général **`FullAWSAccess`** (autoriser tous les services) en haut, puis des SCP **`Deny`** (ou des SCP **liste blanche** qui n’autorisent que certains services — beaucoup plus strict).
- **Effet montré :** une **Deny S3** sur une OU bloque **S3** même pour l’**utilisateur root du compte** d’un compte **membre**.

### Modèles de SCP (style examen)

- **Deny `ec2:RunInstances`** sauf si **`aws:RequestTag/department`** **existe** (forcer **tag au lancement**).
- **Deny `RunInstances`** sauf si le tag **`business-unit`** **commence par** `infra-` (forme du tag, pas seulement la présence).
- **Deny `RunInstances`** sauf si un tag du type **`deployment-type`** vaut uniquement **`in-region`** ou **`edge`** (énumérations autorisées).
- **Liste blanche de Régions :** **`Deny *`** sur `*/*` avec **`Condition`** **`StringNotEquals`** sur **`aws:RequestedRegion`** limitée à **`eu-central-1`**, **`eu-west-1`**, … (tout ce qui est hors de ces Régions est **refusé**).

### Autres types de politiques d’organization (à connaître)

- **Backup policies** — plans **AWS Backup** à l’échelle de l’org.
- **Tag policies** — normaliser **clés** / **valeurs** de tags pour l’**audit** et l’**allocation des coûts** ; lister les ressources **non conformes** ; réagir via **EventBridge** sur les signaux de conformité des tags.

### `aws:PrincipalOrgID`

Dans les **politiques de ressource** (ex. politique de bucket **S3**), **`aws:PrincipalOrgID`** permet d’**autoriser** des principaux de **n’importe quel** compte de l’org **sans** lister chaque **account ID**.

## AWS Control Tower

**Landing zone** structurante au-dessus d’**Organizations** : découpe **multi-compte**, **guardrails** et **tableaux de bord** avec peu de câblage manuel.

- Assistant **landing zone** : **Région d’accueil**, **Region deny** optionnelle pour les Régions non approuvées, **Régions supplémentaires** pour la portée de **gouvernance**.
- Crée des **OU** (démo du cours : **Security** + **Sandbox** ; après déploiement la console peut montrer **Core** vs **Custom** avec **audit** / **log archive** sous **Core**).
- **Comptes dédiés :** **Log archive** (logs « immuables »), **Audit** (outillage sécurité), plus les schémas **management** / **charges de travail** — **e-mails** requis par compte.
- **Accès aux comptes :** **IAM Identity Center** (successeur du **SSO**) est la voie **par défaut** pour accéder à **tous** les comptes inscrits depuis **un** portail ; l’accès **self-managed** est possible mais plus lourd.
- **CloudTrail** activé pour la **landing zone** ; livraison **S3** optionnelle et chiffrement **KMS**.
- **Guardrails :** **préventifs** (implémentés avec des **SCP** — ex. interdire la **suppression** du log archive, interdire les politiques **publiques** sur le bucket de logs, interdire la **désactivation** de **CloudTrail**) et **détectifs** (souvent règles **AWS Config**). Le cours cite de l’ordre de **~20 préventifs** et **~2 détectifs** dans un lot par défaut — les chiffres évoluent.
- **Règle d’usage :** après inscription, privilégier les flux **Control Tower** (**Account Factory**, enregistrement d’**OU**) pour les comptes et structures que vous voulez **gouvernés** par la landing zone ; éviter de **lutter** contre l’automation depuis **Organizations** brut pour ces ressources.
- **Coût / durée :** le provisionnement est **long** (cours : **~60 minutes**) et **payant** — **évitez** de lancer la configuration complète sur un compte perso sans accepter la facture.

## Points clés

- **Service Health** = ligne du temps large **Région** / **service** ; **Account Health** = **vos** ressources, **actifs affectés**, **maintenance**, **remediation** ; **Org Health** = vue agrégée ; entrées **cloche** / **Event log**.
- **Health → EventBridge** permet alertes **SNS**, remediation **Lambda**, actions **EC2**, etc., pour travaux **planifiés** et événements de **risque**.
- **Organizations** = **global**, **une org par compte**, payeur **management**, **facturation consolidée**, remises **volume** et partage **RI** / **Savings Plans** (avec bascules de **partage** par compte), **OU** imbriquées, **trails** d’org / **logs** centraux.
- Les **SCP** contraignent **uniquement les membres** ; **`Deny`** et **listes blanches** sont puissants ; conditions sur **tags** et **Région** sont des classiques d’examen ; **`aws:PrincipalOrgID`** simplifie la **confiance cross-account** dans les politiques de **ressource**.
- **Control Tower** = **landing zone** + **guardrails** (**SCP** + **Config**) + portail **Identity Center** + comptes **Security/Audit/Log** ; **coûteux** et **long** à mettre en place — il faut savoir **ce que ça crée**, pas seulement cliquer en prod les yeux fermés.

---
> 🌐 *Traduit par Claude*
