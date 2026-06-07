---
title: "AWS Service Catalog, alarmes de facturation, Cost Explorer, Budgets et outils de coût"
date: "2026-03-28"
excerpt: "Notes CloudOps sur AWS Service Catalog (produits, portfolios, partage, TagOptions), métriques de facturation CloudWatch dans us-east-1, Cost Explorer, Budgets avec actions, tags de répartition des coûts, CUR, Compute Optimizer et Billing Conductor."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "service-catalog", "billing", "cost-explorer", "budgets", "cur", "compute-optimizer", "cloudformation", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 11
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Compagnon de **[Gestion de compte AWS : tableau de bord Health, Organizations, SCP et Control Tower](/fr/posts/aws-health-dashboard-organizations-control-tower)** — centré sur le **provisionnement en libre-service**, la **visibilité des dépenses**, les **budgets** et les outils d’**optimisation**.

## AWS Service Catalog

**Problème :** les builders veulent de la **rapidité**, mais des **CloudFormation** ad hoc ou des clics console créent des ressources **non standard** ou **non conformes**.

**Modèle :**

- Les **admins** publient des **produits** — enveloppes autour d’**artefacts de provisionnement** (le plus souvent des modèles **CloudFormation** ; des options style **Terraform** existent en console mais hors périmètre du récit d’examen principal).
- Les **portfolios** regroupent des produits (ex. uniquement les modèles « **WebDev** »).
- **Accès :** les principaux **IAM** (**utilisateurs** / **groupes** / **rôles**) du **même** compte reçoivent l’accès au portfolio ; pour le partage **inter-comptes**, utiliser des droits style **ARN de principal** comme documenté.
- Les **utilisateurs finaux** voient une liste de produits **sur liste blanche** et **lancent** un **produit provisionné** ; en coulisses Service Catalog exécute **CloudFormation** (nom de pile souvent préfixé ex. **`SC-`**). Les utilisateurs peuvent **n’avoir aucun accès AWS large** — seulement **Service Catalog**.

**Avancé (prise de conscience) :** les **contraintes** réduisent les paramètres que les utilisateurs peuvent choisir (garde-fous au lancement). Champs **support** sur les produits pour router vers l’helpdesk interne.

**Image de marque console :** les **préférences** peuvent personnaliser **logo**, **couleur d’accent** et **nom de marque** pour le portail dans les **régions prises en charge** ; ailleurs une demande **AWS Support** peut être nécessaire.

### Partager des portfolios

| Mode | Comportement |
| --- | --- |
| **Référence partagée / import** | Le destinataire **importe** un lien de **portfolio partagé** ; reste **synchronisé** avec le compte **propriétaire** quand des produits sont ajoutés ou mis à jour. |
| **Déployer une copie** | Copie type **instantané** chez le destinataire ; les **mises à jour** de la source **ne** se propagent **pas** automatiquement — recopier ou republier si besoin. |

Les portfolios importés peuvent alimenter des portfolios / produits **locaux** du compte destinataire selon le processus org.

### TagOptions

Paires **clé/valeur** centralisées gérées par Service Catalog. Associer une **TagOption** à un **portfolio** (et/ou un **produit**) pour que chaque pile **provisionnée** **hérite** de ces tags (ex. `Environment=prod`) pour la **répartition des coûts** et la discipline des **tags autorisés**. Les **TagOptions** peuvent être **partagées** vers d’autres comptes ou l’**organisation** comme les portfolios.

## Alarmes de facturation CloudWatch

**Les métriques de facturation ne vivent que dans `us-east-1` (N. Virginia)** dans **CloudWatch**, même si elles représentent les **dépenses** **à l’échelle du compte** (globales) — pas la facture d’infra d’une seule région.

1. **Console Billing** → **Billing preferences** → activer **Receive billing alerts** (frais d’usage et honoraires). Attendre l’apparition des métriques (cours : **~15 minutes** minimum ; parfois plus long).
2. **CloudWatch** (dans **`us-east-1`**) → **Alarms** → **Billing** (cette section **n’apparaît** **que** là).
3. Choisir les **métriques :** **Total Estimated Charge** pour les dépenses **compte entier**, ou détailler **By Service** (ex. **EC2**, **S3**, **Config**).
4. Définir un **seuil statique** (ex. **> 10 $**) et router vers **SNS**.

**Limite :** charges **facturées réelles** — pas un substitut d’une compta **par tag** ou **par projet** (**Budgets** / **CUR** sont plus adaptés).

## AWS Cost Explorer

Analytique interactive **coût et usage** : graphiques, **rapports personnalisés**, vues **enregistrées**.

- **Granularité :** des totaux **compte** jusqu’aux ventilations **mensuelles**, **horaires** ou **par ressource** (là où les données existent).
- **Savings Plans :** recommandations basées sur l’usage historique (dépense mensuelle estimée, suggestions d’engagement).
- **Prévisions :** projeter les dépenses sur **des mois** (cours : **jusqu’à ~18 mois** avec bandes de confiance — vérifier l’UI).
- Souvent le **principal** « service billing » cité aux examens de type associate en plus de **Budgets** / **CUR**.

## AWS Budgets

Créer des **budgets** sur le **coût**, l’**usage**, l’utilisation / couverture **Reservation**, ou l’utilisation / couverture **Savings Plans**.

- **Modèles :** ex. **zero spend** (surveillance free tier), **monthly cost**, **daily Savings Plan coverage** — configuration rapide avec moins de réglages.
- **Avancé :** mêmes **dimensions** que Cost Explorer — **service**, **compte lié**, **tag**, **région**, **type d’instance**, **AZ**, **purchase option**, **charge type** (**unblended**, **blended**, **amortized**), inclure **remboursements** / **crédits**, etc.
- **Notifications :** jusqu’à **~5** par budget (vérifier le quota) ; seuils sur dépense **réelle** (ex. **80 %** du budget mensuel) et/ou dépense **prévisionnelle** (alerte précoce).
- **Canaux :** **email**, **SNS**, **AWS Chatbot** (Slack / Chime / Teams).
- **Actions (optionnelles) :** nécessitent un **rôle de service IAM** pour **Budgets**. Quand un seuil se déclenche, optionnellement **attacher une politique IAM** à utilisateurs/groupes/rôles, **attacher une SCP** à la **racine** org / **OU**, **arrêter des instances EC2**, ou **arrêter des instances RDS** (portée régionale) — chemins de **remédiation** ou de **gel** des dépenses.
- **Tarification :** les **deux** premiers budgets **gratuits**, puis frais **par budget et par jour** (cours : **0,02 $**/jour — confirmer la tarification).

**vs alarmes billing :** Budgets sont **plus riches** (filtres, prévision, RI/SP, actions).

## Tags de répartition des coûts

Ventiler les coûts dans **CUR**, **Cost Explorer** et les **rapports d’usage** par **tag**.

- Les tags **définis par l’utilisateur** apparaissent avec le préfixe **`user:`** dans les rapports (ex. `user:Environment`) une fois **activés** sous **Cost Management** → **Cost allocation tags**.
- Les tags **générés par AWS** utilisent l’espace de noms **`aws:`** (ex. **`aws:createdBy`**, **`aws:cloudformation:stack-id`**) — activer ceux dont vous avez besoin de la même façon.
- Les tags doivent exister sur les **ressources** en production ; l’activation **expose** seulement la lignée **billing** (comportement rétroactif selon la doc AWS).

## Cost and Usage Report (CUR)

L’export de coût le **plus détaillé** : **lignes** **horaires** ou **quotidiennes**, **tarification**, métadonnées **RI**/SP, **ID de ressources** (optionnel) et tags de répartition **activés**.

- Livré vers **S3** selon un planning (ex. **quotidien**) ; la **bucket policy** par défaut aide la livraison.
- Intégrations **Athena** / **Redshift** / **QuickSight** disponibles depuis l’assistant ; **compression** et **versionnement du rapport** (ajouter des fichiers vs écraser) configurables.
- L’**activation** peut prendre **jusqu’à ~24 heures** avant que les données soient exploitables.

## AWS Usage Reports

Depuis **Billing** / **Cost Management**, télécharger des rapports **CSV** d’**usage** par **service** (ex. **types d’usage EC2** par **jour** pour une **période de facturation**). Pratique pour des tableurs **ad hoc** ; **CUR** est la **référence** pour l’analytique lourde.

## AWS Compute Optimizer

Guidage de **rightsizing** via **ML** sur la **configuration** + utilisation **CloudWatch**.

- **Pris en charge (haut niveau) :** instances **EC2**, groupes **EC2 Auto Scaling**, volumes **EBS**, **Lambda**, **ECS sur Fargate**, **Aurora** / **RDS**, **licences logicielles commerciales** (là où proposé).
- Classifications du type **sur-dimensionné**, **sous-dimensionné**, **optimisé** ; le cours indique **jusqu’à ~25 %** de gains potentiels — traiter comme **ordre de grandeur marketing**.
- **Exporter** les recommandations vers **S3**.
- **IAM :** les lecteurs ont typiquement besoin de **`ComputeOptimizerReadOnlyAccess`** (politique gérée).
- **Piège d’examen :** les **nouvelles instances EC2** peuvent **ne pas** apparaître tant qu’il n’y a **pas assez** de métriques — ligne directrice cours **~30 heures** d’exécution pour la **collecte de données**.

## AWS Billing Conductor

**Ne change pas** ce qu’AWS vous **facture** — il change la façon dont les **factures** **internes** ou **client** sont **présentées** et **réparties**.

- Factures **pro forma**, **majoration** / **remises**, **regroupement de comptes** pour **départements** / **centres de coûts**, vues tarifaires **MSP** **client**, **refacturation** / **showback**.
- Cible les **entreprises** et la **comptabilité complexe** ; excessif pour les petites équipes.

## Points clés

- **Service Catalog** = **CFN** approuvé (±) en **produits** dans des **portfolios** + accès **IAM** ; portfolio partagé **importé** **synchronisé** ; la **copie** ne l’est pas ; **TagOptions** imposent des **tags** sur les ressources **provisionnées**.
- **Alarmes billing** = **CloudWatch** **`us-east-1`** uniquement ; activer d’abord **billing alerts** ; métriques **total** ou **par service** → **SNS**.
- **Cost Explorer** = explorer, **prévoir**, recommandations **SP** ; **Budgets** = seuils, alertes **prévisionnelles**, actions optionnelles **stop/SCP/IAM**, filtres **granulaires** ; **2** budgets **gratuits** puis **payant**.
- Les **tags de répartition** doivent être **sur les ressources** et **activés** ; **CUR** = export **détaillé** **autoritaire** vers **S3** + **Athena**/BI ; **Usage reports** = extractions **CSV** plus légères.
- **Compute Optimizer** = **rightsizing** sur plusieurs services ; politique **lecture seule** ; caveat **~30 h** d’historique **EC2**.
- **Billing Conductor** = **représentation** de refacturation / **showback**, pas la **réalité** du **prix catalogue** AWS.

---
> 🌐 *Traduit par Claude*
