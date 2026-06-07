---
title: "AWS DataSync et AWS Backup : notes sur la reprise après sinistre"
date: "2026-03-29"
excerpt: "Notes d’examen CloudOps sur AWS DataSync (agents, NFS/SMB/HDFS, cibles S3/EFS/FSx, planifications, métadonnées, Snowcone) et AWS Backup (plans de sauvegarde, inter-région / inter-compte, vault lock WORM, parcours console)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "datasync", "aws-backup", "disaster-recovery", "snowcone", "s3", "efs", "fsx", "worm", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 12
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Contenu orienté examen sur la **reprise après sinistre** et le **mouvement de données** : **AWS DataSync** pour les transferts de gros jeux de données avec préservation optionnelle des métadonnées, et **AWS Backup** pour des sauvegardes centralisées pilotées par politique, y compris des politiques de coffre immuables.

## AWS DataSync

**AWS DataSync** déplace et **synchronise** de **gros volumes** de données **vers et depuis** AWS. Souvent cité au niveau associate : il faut savoir **quand un agent est requis**, **avec quoi il peut parler**, et que la réplication est **planifiée**, pas en flux continu.

### Où DataSync s’exécute

- **On-premises ou autre cloud :** connexion aux sources fichier ou objet via **NFS**, **SMB**, **HDFS** ou protocoles similaires. Un **agent DataSync** doit tourner **côté source** (VM/appliance on-prem ou équivalent dans l’autre cloud).
- **AWS vers AWS :** copie entre **Amazon S3**, **Amazon EFS** et **Amazon FSx** (et variantes FSx du cours) via le **service DataSync** **sans** déployer d’agent.

### Destinations et classes de stockage

DataSync peut écrire vers :

- **Amazon S3**, y compris les niveaux **froids** et destinations de type **Glacier** présentées en formation.
- **Amazon EFS**
- **Amazon FSx** (famille adaptée aux charges fichiers)

### Planification et comportement

- Les tâches de transfert **ne sont pas continues**. Vous **planifiez** les exécutions (ex. **horaire**, **quotidien**, **hebdomadaire**). Attendez un **délai** entre les changements à la source et la fenêtre de synchro suivante.
- DataSync peut **préserver permissions et métadonnées** de fichiers, aligné sur la sémantique **POSIX NFS** et les **ACL SMB**. Souvent cité comme option qui **conserve les métadonnées** lors des migrations — bon **différenciateur** en scénario d’examen.

### Performance et direction

- Une seule tâche peut monter jusqu’à environ **10 Gbit/s** de débit ; vous pouvez **limiter la bande passante** pour ne pas saturer le WAN.
- La synchro peut aller **d’on-premises vers AWS** et **d’AWS vers on-premises** (bidirectionnel).

### Faible bande passante : Snowcone

Si le scénario d’examen veut **DataSync** mais que le **WAN** est insuffisant, **AWS Snowcone** est l’appareil mis en avant : **agent DataSync préinstallé**. Flux : placer **Snowcone** on-prem, ingérer avec l’agent, **expédier** l’appareil vers AWS, puis finaliser la synchro vers **S3**, **EFS** ou **FSx** dans la Région.

## AWS Backup

**AWS Backup** est un service **entièrement managé** pour **centraliser et automatiser** les sauvegardes sur de nombreuses ressources AWS, sans scripts ad hoc ni tâches manuelles par service.

### Ressources prises en charge (vue d’ensemble)

La liste évolue ; le cours insiste sur le **modèle** et des services représentatifs, par exemple :

- **Calcul et bloc :** **EC2**, **EBS**
- **Objet :** **Amazon S3**
- **Bases :** **RDS** (moteurs pris en charge par Backup), **Aurora**, **DynamoDB**, **DocumentDB**, **Neptune**
- **Fichier :** **EFS**, **FSx** (dont **Lustre** et **Windows File Server**)
- **Hybride :** **AWS Storage Gateway** (ex. **Volume Gateway**)

Vérifiez la liste à jour dans la documentation AWS avant la prod.

### Inter-Région, inter-compte et style de récupération

- **Copies de sauvegarde inter-régions** pour les stratégies **DR** (rétention secondaire depuis une même console / flux).
- **Sauvegardes inter-comptes** pour les modèles multi-compte.
- **Point-in-time recovery (PITR)** pour les **services compatibles** (ex. **Aurora** au cours — confirmer par produit).

### Plans et politiques de sauvegarde

- Sauvegardes **à la demande** et **planifiées**.
- Sélection par **tags** (ex. ressources taguées `environment=production`).
- Les **plans de sauvegarde** encodent :
  - **Fréquence** (ex. toutes les 12 h, quotidien, hebdo, ou expressions **cron** quand proposé)
  - **Fenêtre de sauvegarde** (heure de début et durée / fenêtre de fin)
  - Transition optionnelle du stockage de sauvegarde vers le **froid** après un délai
  - **Rétention** des points de récupération

Les points de récupération sont stockés dans un stockage **géré par AWS** (en interne **S3** dans l’explication du cours) — vous manipulez **coffres** et **jobs**, pas votre propre bucket pour le stockage principal de sauvegarde.

### Backup vault lock (WORM)

**Vault Lock** applique une politique de type **WORM** (**write once, read many**) sur un **coffre de sauvegarde** :

- Les points de récupération verrouillés **ne peuvent pas être supprimés** en violation de la politique.
- Protège contre suppressions **accidentelles ou malveillantes** et contre les changements qui **réduisent ou affaiblissent** la rétention.
- Le cours indique que **même le compte root** ne peut pas supprimer les sauvegardes protégées quand les règles de lock s’appliquent — fort angle **conformité** et **résilience ransomware** à l’examen.

## Parcours console (récap)

Flux de lab typique :

1. **Créer un plan de sauvegarde** — à partir d’un **modèle**, **construire** dans l’assistant, ou définir du **JSON**.
2. **Règles de sauvegarde** — un plan peut contenir **plusieurs** règles (ex. **quotidien** et **mensuel**). Chaque règle définit le **coffre** (défaut ou personnalisé), la **fréquence**, la **fenêtre**, la **transition vers le froid**, la **rétention**, et une copie optionnelle **vers une autre Région** pour la DR.
3. **Affecter des ressources** — rôle de service **par défaut** (ou rôle personnalisé) avec les bonnes permissions. Modes : **tous les types pris en charge** (souvent combiné aux **tags**), ou **types / instances** précis (ex. une table **DynamoDB** ou toutes les tables).
4. **Exemple de tag** — un volume tagué `environment=production` est **inclus automatiquement** quand l’affectation du plan correspond à ce tag.
5. **Exploitation** — surveiller les jobs de **sauvegarde**, **restauration** et **copie** ; examiner les paramètres pour les politiques à l’échelle de l’org, la supervision inter-compte, etc.
6. **Nettoyage** — retirer les **affectations**, puis les **règles** / **plan** ; supprimer les volumes **EBS** de test si besoin.

## Points clés à retenir

- **DataSync** = **gros mouvements / synchro** ; **agent** pour **NFS/SMB/HDFS** (on-prem ou autre cloud) ; **pas d’agent** pour **S3 ↔ EFS ↔ FSx** dans AWS.
- Cibles **S3** (histoire **Glacier** au cours), **EFS**, **FSx** ; tâches **planifiées** (horaire/quotidien/hebdo), **pas** continues.
- La **préservation des métadonnées et permissions POSIX/SMB** est un **détail d’examen** à forte valeur.
- Débit jusqu’à **~10 Gbit/s** par tâche avec **limitation** optionnelle ; **bidirectionnel** ; **Snowcone** + **agent préinstallé** pour **bande passante limitée**.
- **AWS Backup** = sauvegardes **centralisées** automatiques sur un **large** périmètre de services ; **inter-Région** et **inter-compte** ; **plans** avec **fréquence**, **fenêtre**, **transition froid**, **rétention** ; affectation par **tags**.
- Les points de récupération vivent dans un stockage **managé** (S3 sous-jacent selon le cours) ; **Vault Lock** = sauvegardes **WORM** / **immuables**, le **root** ne contourne pas la suppression dans le cadre enseigné.
- Parcours console : **modèle de plan** → **plusieurs règles** → **affecter des ressources** (tags + rôle par défaut) → **jobs** → **démontage** ordonné.

---
*Traduit par Claude*
