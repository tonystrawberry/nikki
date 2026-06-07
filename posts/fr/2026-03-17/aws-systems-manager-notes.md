---
title: "Notes AWS Systems Manager (aperçu, Fleet Manager, DHMC, documents, Run Command, Session Manager, Automation, Parameter Store, Inventory, State Manager, Distributor, Patch Manager, Maintenance Windows, OpsCenter)"
date: "2026-03-17"
excerpt: "Notes condensées sur AWS Systems Manager : agent, Fleet Manager, DHMC, documents, Run Command, Session Manager, Automation, Parameter Store, Inventory, State Manager, Distributor, Patch Manager, Maintenance Windows, OpsCenter (OpsItems, runbooks)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "systems-manager", "ssm", "cloudops", "certification", "ec2", "fleet-manager", "run-command", "session-manager", "automation", "parameter-store", "inventory", "state-manager", "distributor", "patch-manager", "maintenance-windows", "opscenter"]
---

## Vue d'ensemble

**AWS Systems Manager** est une suite d'outils pour **gérer à l'échelle une flotte d'instances EC2 et de serveurs sur site**. Il revient souvent dans l'exam CloudOps. Utilisez-le pour :

- **Avoir une vue** sur l'état de votre infrastructure  
- **Détecter les problèmes** et **automatiser les correctifs**  
- La **conformité** (ex. configuration, correctifs)

Il prend en charge **Windows et Linux**, s'intègre à **CloudWatch** (métriques, tableaux de bord) et **Config**, et est **gratuit** — vous ne payez que les ressources qu'il utilise ou crée (ex. EC2 pour l'automation).

**Quand penser SSM :** Correctifs sur les instances, automation ou gestion de nombreuses instances/serveurs sur site impliquent en général Systems Manager.

## Fonctionnement de SSM

- Un **agent SSM** doit être installé sur les systèmes à gérer.  
- L'agent est **préinstallé** sur **Amazon Linux 2** et certaines AMI **Ubuntu**.  
- Si une instance n'**apparaît pas** comme gérée dans SSM, vérifier :
  1. **Agent SSM** — non démarré, non installé ou mal configuré.  
  2. **IAM** — l'instance (ou le serveur sur site) doit avoir un rôle IAM (ou des identifiants) avec les permissions pour parler à Systems Manager.  
- L'**instance (ou le serveur) appelle SSM** ; SSM n'a pas besoin d'initier la connexion. L'instance n'a donc **pas besoin** de règles entrantes SSH, HTTP ou autres pour être gérée par SSM — uniquement un accès sortant aux API AWS (et le bon rôle IAM).

## Fleet Manager

- **Fleet Manager** permet de **gérer de façon centralisée et à distance** tous les nœuds enregistrés dans Systems Manager : **instances EC2**, **serveurs ou VM sur site**, **appareils Edge** et **appareils IoT**. Prend en charge **Windows et Linux**. Chaque nœud doit avoir l'**agent SSM** installé pour communiquer avec le service SSM.
- **IAM pour EC2 :** Attacher un **profil d'instance IAM** incluant **AmazonSSMManagedInstanceCore** pour que les instances puissent s'enregistrer auprès de SSM et Fleet Manager. Sinon, utiliser la **Default Host Management Configuration** pour simplifier l'onboarding. Sans les bonnes permissions ou config, les nœuds n'apparaîtront pas comme gérés.
- **Rôle de Fleet Manager :** Voir tous les nœuds gérés en un seul endroit et appliquer des actions SSM à l'échelle. S'en servir pour **suivre l'état, la santé et les perfs des nœuds** ; exécuter des **tâches de dépannage et de gestion** ; et accéder — **RDP Windows** ou **Session Manager** pour l'accès CLI aux instances Linux. Fleet Manager est le **hub** pour utiliser les autres fonctionnalités SSM (Run Command, Patch Manager, State Manager, etc.) sur la flotte.
- **Ce qu'AmazonSSMManagedInstanceCore accorde (examen) :** La stratégie donne à l'instance la permission de : **s'enregistrer** auprès de Systems Manager / Fleet Manager ; utiliser **Session Manager** ; lire les **documents SSM** et les paramètres **Parameter Store** ; **recevoir et exécuter** des commandes (ex. Run Command) ; effectuer des opérations **Patch Manager** ; et **remonter** à **Inventory**, **Compliance** et l'état de configuration dans SSM. Attacher cette stratégie (ou équivalent) aux instances EC2 est nécessaire pour qu'elles soient pleinement gérables par SSM.
- **Enregistrement EC2 (rappel) :** Lancer avec une AMI qui a l'agent (ex. **Amazon Linux 2**), attacher le profil d'instance avec **AmazonSSMManagedInstanceCore**, et éventuellement un groupe de sécurité sans règles entrantes — l'agent s'enregistre en appelant AWS. Les nœuds apparaissent alors dans Fleet Manager (plateforme, OS, version de l'agent, statut).

## Default Host Management Configuration (DHMC)

- **Objectif :** Avec **DHMC** activé, les instances EC2 peuvent devenir **instances gérées sans profil d'instance EC2** (pas de rôle IAM attaché à l'instance). L'accès SSM est toujours requis, mais fourni par un autre mécanisme.
- **Fonctionnement :** Chaque instance EC2 a un **document d'identité d'instance** (et dans ce flux un **rôle d'identité d'instance** — rôle intégré sans permissions que vous ne contrôlez pas). Son rôle est d'**identifier l'instance** auprès des services AWS comme Systems Manager. Ce n'est **pas** un profil d'instance EC2. L'instance utilise cette identité pour s'authentifier auprès de SSM ; **Systems Manager transmet alors un rôle IAM** à l'instance pour qu'elle soit gérée (Session Manager, Run Command, Patch Manager, etc.). Tout cela **sans** attacher de profil d'instance à l'instance.
- **Prérequis :** **IMDSv2** (instance metadata service version 2) doit être activé sur l'instance (ex. **Metadata version: V2 only** dans les détails avancés EC2). L'**agent SSM** doit être au moins en **version 3.2.x** (le minimum exact est indiqué dans Fleet Manager quand vous activez DHMC) ; les anciennes AMI peuvent avoir un agent plus ancien et nécessiter une **mise à niveau manuelle** avant l'enregistrement.
- **Après onboarding :** Une fois l'instance gérée via DHMC, les fonctionnalités SSM (Session Manager, Patch Manager, Inventory, etc.) sont activées et l'**agent SSM est maintenu à jour automatiquement** par AWS.
- **Périmètre :** DHMC est **activé par région** ; l'activer dans chaque région concernée.

**Activation et utilisation de DHMC (pratique) :**

- Dans **Fleet Manager** (menu gauche), ouvrir la config **Default host management**. L'activer et créer le rôle IAM avec les paramètres **recommandés** — ce rôle est celui que SSM passera aux instances ; ne **pas** l'attacher comme profil d'instance EC2. Cliquer sur **Configure** pour enregistrer.
- **Lancer une instance de test :** Utiliser une AMI avec l'agent SSM (ex. **Amazon Linux 2023**). Ne pas attacher de profil d'instance (Sécurité → Rôle IAM = aucun). Dans **Advanced details**, mettre **Metadata** sur **V2 only** (IMDSv2). Lancer ; l'instance n'aura **aucun rôle IAM** dans la console EC2.
- Si l'instance n'**apparaît pas** dans Fleet Manager, l'agent est peut-être trop ancien. Vérifier la version minimale requise par DHMC dans l'UI Fleet Manager. **Mettre à niveau l'agent** sur l'instance : se connecter (ex. Session Manager si un autre nœud géré existe, ou temporairement EC2 Instance Connect/clé), arrêter l'agent SSM, exécuter les étapes d'installation officielles pour votre OS et architecture (ex. x86_64 « Manually installing SSM agent on EC2 instances for Linux »), puis démarrer l'agent. Après la mise à niveau (ex. 3.2.923 ou plus), rafraîchir Fleet Manager — l'instance doit apparaître comme nœud géré malgré l'absence de profil d'instance.
- Pour désactiver DHMC : Fleet Manager → Default host management → Configure → Disable. Terminer les instances de test ensuite.

## Tags et groupes de ressources

- Les **tags** sont des paires clé–valeur sur les ressources AWS (ex. EC2, S3, DynamoDB, Lambda). Utilisez-les pour le **regroupement**, l'**automation**, la **sécurité** et l'**allocation des coûts**. Clés courantes : `Environment`, `Team`. Mieux vaut plus de tags que moins.  
- Les **resource groups** permettent de grouper les ressources par **filtres de tags** (ex. `Environment = dev`). Resource Groups est **régional**. Vous pouvez limiter par type de ressource (ex. EC2 uniquement) ou plusieurs types.  
- **Pourquoi les utiliser avec SSM :** Exécuter des actions SSM **au niveau du groupe** — ex. patcher toutes les instances du groupe « dev » ou lancer une commande sur toutes les instances « finance ». Créer des resource groups (ex. par `Environment`, `Team`) est un prérequis pour les opérations SSM par groupe.

## Documents

- Les **documents** sont au cœur de SSM. Ils sont définis en **JSON ou YAML** et décrivent des **paramètres** et des **étapes** (actions). Un document est exécuté par une fonctionnalité SSM (Run Command, State Manager, Patch Manager, Automation).
- **Propriété :** Beaucoup de documents sont **fournis par Amazon** (ex. `AWS-ApplyPatchBaseline`) ; vous pouvez aussi **créer les vôtres** et les versionner. Les documents peuvent être **partagés** avec d'autres comptes.
- **Cas d'usage :** Exécuter une commande ou un script sur les instances ; utilisés par **State Manager**, **Patch Manager**, **Automation** ; les documents peuvent **lire dans Parameter Store** pour un comportement modulaire et dynamique.
- **Types de documents :** **Command/Session** (exécuter des commandes sur des cibles) ou **Automation** (runbooks qui agissent sur les ressources AWS depuis l'extérieur de l'instance). Les documents Automation sont souvent appelés **runbooks**.

## Run Command

- **Run Command** exécute un **document** (ou une commande) sur une **flotte d'instances EC2**. Les cibles peuvent être choisies par **ID d'instance**, **tags** ou **resource groups**. Pas besoin de **SSH** — l'agent SSM exécute les commandes ; l'instance n'a pas besoin du port 22 ouvert.
- **Contrôle du débit :** Exécuter sur un sous-ensemble de cibles à la fois (ex. 1, 50, ou un pourcentage) pour éviter la surcharge ou déployer progressivement.
- **Seuil d'erreur :** Arrêter l'exécution après un nombre ou un pourcentage d'échecs (ex. à la première erreur, ou si plus de 5 % échouent).
- **Sortie :** La sortie peut être vue dans la console (jusqu'à une limite), envoyée à **S3** ou **CloudWatch Logs** (ex. flux séparés stdout/stderr).
- **Notifications :** Envoyer le statut (en cours, succès, échec) à **SNS**. Les règles **EventBridge** (CloudWatch Events) peuvent **invoquer Run Command** (ex. sur planification ou événement). Intégré à **IAM** et **CloudTrail** (audit qui a exécuté quoi).
- **Exemple :** Créer un **document de commande** personnalisé (ex. YAML) avec un paramètre (ex. `message`) et des étapes (installer httpd, le démarrer, écrire un fichier HTML avec le paramètre). L'exécuter via Run Command sur plusieurs instances avec contrôle du débit (ex. une à la fois) et seuil d'erreur ; envoyer la sortie à CloudWatch Logs.

## Session Manager

- **Objectif :** Démarrer une **session shell (CLI) sécurisée** sur des instances EC2 et serveurs sur site **sans SSH** — pas de bastion, pas de clés SSH. Accès via **console**, **CLI** ou **Session Manager SDK**. Contrairement au SSH classique ou **EC2 Instance Connect** (qui utilise SSH), Session Manager utilise le **service SSM** comme intermédiaire ; l'instance n'accepte jamais de SSH entrant.
- **Fonctionnement :** L'instance exécute l'**agent SSM** et a les **permissions IAM** pour s'enregistrer auprès de SSM. L'**utilisateur** se connecte au **service Session Manager** avec des permissions IAM ; Session Manager exécute alors un **shell interactif** sur l'instance — même mécanisme que **Run Command**, mais pour un **shell en direct** au lieu d'une commande ponctuelle. Prend en charge **Linux**, **macOS** et **Windows**.
- **Journalisation et conformité :** Toutes les **connexions** et **commandes exécutées** peuvent être **journalisées** dans **S3** ou **CloudWatch Logs**, pour un audit et une meilleure sécurité/conformité que le SSH (où l'historique des commandes n'est pas centralisé). **CloudTrail** peut enregistrer les événements **StartSession** quand quelqu'un démarre une session Session Manager, pour automation, conformité et alerting.
- **IAM :** IAM contrôle **qui** peut utiliser Session Manager et **quelles instances** il peut atteindre. Vous pouvez utiliser des **tags de ressource** pour restreindre (ex. autoriser la connexion uniquement aux instances taguées `environment = dev`). L'utilisateur a besoin des permissions SSM (ex. `ssm:StartSession`) ; si vous envoyez les logs vers S3 ou CloudWatch, la stratégie doit aussi autoriser l'écriture. Optionnellement, vous pouvez **restreindre les commandes** qu'un utilisateur peut exécuter dans une session.
- **Sécurité (examen) :** Avec **SSH** vous ouvrez typiquement le **port 22 entrant** (ou un bastion) et donnez des clés ou un accès IP ; avec **Session Manager** vous n'avez **aucune règle entrante** sur l'instance — seulement l'**agent SSM**, le **rôle IAM de l'instance** (ex. AmazonSSMManagedInstanceCore) et un **utilisateur avec les permissions IAM Session Manager**. Toutes les données de session peuvent être journalisées dans S3 ou CloudWatch.

**Session Manager (console et préférences)**

- Depuis **Session Manager** dans le menu gauche, sélectionner une instance gérée et **Start session** — vous obtenez un shell interactif (exécuter toute commande : `echo`, `ls`, `sudo`, installer des paquets, etc.) même si l'instance n'a **aucune règle SSH entrante** dans son groupe de sécurité. La **session entière** est journalisée par Session Manager. Après avoir terminé la session, utiliser **Session history** dans Session Manager pour voir que la session a été enregistrée.
- **Préférences** (éditer dans Session Manager) : **Idle timeout** ; **chiffrement KMS** pour les données de session ; **exécuter la session en tant qu'utilisateur donné** (ex. `ec2-user` pour Linux) ; **journalisation CloudWatch** (toutes les sessions vers CloudWatch Logs) ; **journalisation S3** (envoyer les logs de session vers S3) ; **profil shell Linux** et **profil shell Windows**. Beaucoup d'organisations utilisent Session Manager au lieu de SSH pour l'accès EC2 car c'est plus contrôlé et offre une meilleure conformité (journalisation centralisée, pas de ports ouverts).

## SSM Automation (runbooks)

- Les **Automations** simplifient la **maintenance et le déploiement** pour EC2 et d'autres ressources AWS. Contrairement à Run Command (qui s'exécute **dans** les instances via l'agent), **Automation s'exécute de l'extérieur** — elle appelle les API AWS (ex. arrêt/démarrage d'instances, création d'AMI, snapshot EBS, mise à jour d'ASG).
- **Runbooks :** Les **documents** Automation sont des **runbooks**. Ils peuvent être **fournis par Amazon** (ex. `AWS-RestartEC2Instance`) ou **personnalisés**. Catégories : gestion d'instances, correctifs, remédiation, sauvegardes, coûts.
- **Déclencheurs :** Exécution manuelle (console, CLI, SDK), sur **planification** (ex. **Maintenance Window**), via **EventBridge** (cible de règle = SSM Automation), ou comme **remédiation AWS Config** (quand une ressource est non conforme).
- **Options d'exécution :** Simple (toutes les cibles), **contrôle du débit** (ex. une cible à la fois), **multi-compte et multi-région**, ou **étapes manuelles** (approbation entre étapes). Vous pouvez spécifier un **rôle IAM** pour l'automation. Contrôle du débit et seuil d'erreur comme pour Run Command.
- **Exemple :** Exécuter `AWS-RestartEC2Instance` avec contrôle du débit, cible = resource group (ex. groupe Dev). Étapes : arrêter les instances, puis les démarrer. Pas de SSH ni script personnalisé ; utile pour redémarrer une flotte en sécurité.

## Exemple : AMI patchée et rafraîchissement ASG (flux d'automation)

Schéma courant : une **ASG** exécute des instances à partir d'une **ancienne AMI** ; vous voulez **patcher l'AMI** et que l'ASG utilise la nouvelle AMI, puis rafraîchir les instances.

1. **Automation** (avec un rôle IAM pouvant créer des instances, exécuter des commandes, créer des AMI, mettre à jour l'ASG) :  
   - **Lancer** une instance EC2 à partir de l'**AMI source**.  
   - **Run Command** sur cette instance avec **AWS-RunPatchBaseline** (document SSM) pour installer les correctifs.  
   - **Arrêter** l'instance, **créer une AMI** à partir d'elle, puis **terminer** l'instance. Vous avez une **AMI patchée**.  
2. **Mettre à jour l'ASG** pour utiliser la nouvelle AMI : dans la même automation, exécuter un **script** (ex. Python) qui **met à jour le launch template** avec le nouvel ID d'AMI et **met à jour l'ASG** pour utiliser ce launch template. Les nouvelles instances lancées par l'ASG utiliseront l'AMI patchée.  
3. **Remplacer les instances existantes :** Les instances existantes dans l'ASG sont encore sur l'ancienne AMI. Utiliser **EC2 Instance Refresh** (fonction ASG) — qui peut être **démarré depuis l'automation** — pour les remplacer par des instances du nouveau launch template.  

Tout est orchestré dans une **seule SSM Automation** ; pas d'étape manuelle, et elle interagit avec plusieurs API AWS (EC2, SSM Run Command, ASG, launch templates).

## Parameter Store

- **Objectif :** Stockage serverless sécurisé pour la **configuration** et les **secrets**. Chiffrement optionnel avec **KMS** (SecureString). **Suivi des versions** à la mise à jour. Accès contrôlé par **IAM**. S'intègre à **EventBridge** (notifications dans certains cas) et **CloudFormation** (paramètres en entrée de stack).
- **Types :** **String** (texte brut, jusqu'à 4 Ko standard / 8 Ko advanced), **StringList**, **SecureString** (chiffré avec KMS — votre CMK ou `alias/aws/ssm` par défaut). Les applications ont besoin de la permission IAM pour lire le paramètre **et** de la permission KMS pour déchiffrer (SecureString).
- **Hiérarchie :** Utiliser des **chemins** pour organiser (ex. `/my-app/dev/db-url`, `/my-app/dev/db-password`). Cela simplifie les **stratégies IAM** : accorder l'accès par chemin (ex. toute l'app, ou une app + environnement). Les paramètres sont listés dans la console par hiérarchie.
- **Secrets Manager :** Vous pouvez **référencer** un secret Secrets Manager depuis Parameter Store (syntaxe de référence). **Paramètres publics** fournis par AWS (ex. dernier AMI ID Amazon Linux 2 par région) disponibles via l'API Parameter Store.
- **Niveaux :**
  - **Standard :** Gratuit. Jusqu'à **10 000** paramètres, **4 Ko** max par valeur. Pas de **parameter policies**. Pas de partage inter-comptes.
  - **Advanced :** **0,05 $ par paramètre et par mois**. Jusqu'à **100 000** paramètres, **8 Ko** max. **Parameter policies** disponibles. Partage avec d'autres comptes possible.
- **Parameter policies (Advanced uniquement) :** Attacher des politiques pour forcer ou encourager la rotation/mise à jour :
  - **Expiration (TTL) :** Le paramètre doit être supprimé ou mis à jour avant une date ; pour les données sensibles (ex. mots de passe). **EventBridge** peut recevoir une notification (ex. 15 jours avant expiration).
  - **Notification no-change :** Si un paramètre n'a pas été mis à jour depuis X jours, EventBridge vous notifie (ex. pour imposer une rotation périodique). Plusieurs politiques peuvent être attachées à un paramètre.
- **CLI :** `aws ssm get-parameters --names "/my-app/dev/db-url" "/my-app/dev/db-password"` retourne les valeurs ; ajouter `--with-decryption` pour déchiffrer SecureString (permission KMS). `aws ssm get-parameters-by-path --path "/my-app/dev"` retourne tous les paramètres sous ce chemin ; `--recursive` pour les sous-chemins. **Historique des versions** dans la console pour chaque paramètre.

## Inventory

- **Objectif :** Collecter des **métadonnées** depuis les **instances gérées** (EC2 et sur site) : logiciels installés, infos OS, pilotes, configs, mises à jour installées, services en cours. Construit un **inventaire** consultable de ce qui est sur chaque nœud.
- **Vue et analyse :** Voir dans la **console SSM** (ex. couverture par type d'instance, versions OS principales, applications principales). Optionnellement **synchroniser les données d'inventaire vers S3** via **Resource Data Sync** — puis requêter avec **Athena** (SQL serverless) et tableaux de bord **QuickSight**.
- **Collecte :** Vous définissez un **intervalle de collecte** (minutes, heures ou jours). L'inventaire peut être **agrégé depuis plusieurs comptes** vers un compte pour requêtes centralisées. **Types d'inventaire personnalisés** possibles (ex. statut de réplication par instance).
- **Activation :** Activer « inventory on all instances » dans la page **Inventory** crée une **association State Manager** qui met les instances dans l'état « gather software inventory ». Les cibles sont les ID d'instances gérées ; **State Manager** exécute l'association et rapporte succès/en attente par instance. Une fois l'association exécutée, les instances apparaissent comme « inventory enabled » et vous voyez les résumés (OS, applications, etc.) et les données détaillées.
- **Resource Data Sync (pratique) :** Créer un **Resource Data Sync** (ex. « DemoSync ») et choisir un **bucket S3** pour que SSM y écrive les données d'inventaire. Le bucket doit avoir une **bucket policy** autorisant le service SSM à `PutObject` (et préfixes requis) ; utiliser l'exemple de la console et remplacer le nom du bucket et l'ID de compte. Après création du sync, les données sont écrites dans S3 et vous pouvez lancer des **requêtes avancées** dans **Athena** depuis la page Inventory (ex. par type d'inventaire **AWS:Application** — nom, version, architecture, éditeur, etc.). Le premier sync peut prendre quelques minutes.

## State Manager

- **Objectif :** **Automatiser** le maintien des instances gérées dans un **état que vous définissez**. Vous créez une **association** : un **document** SSM qui décrit l'état souhaité, plus une **planification** (ex. toutes les 24 h) sur laquelle l'association est appliquée aux cibles (ID d'instance, tags ou resource groups).
- **Cas d'usage :** **Bootstrap** d'instances avec des logiciels (ex. agent CloudWatch) ; **correctifs** OS et applications sur planification ; faire respecter une config (ex. « le port 22 doit être fermé », « l'antivirus doit être installé »). **Inventory** est une association State Manager dont l'« état » est « gather software inventory ».
- **Fonctionnement :** Vous choisissez un **document** SSM (ex. AWS-ConfigureAWSPackage pour l'agent CloudWatch, ou le document d'inventaire intégré), sélectionnez les **cibles** (instances ou groupe) et définissez une **planification**. State Manager exécute le document selon la planification et rapporte le **statut d'association** et l'**historique d'exécution** (succès, en attente, échec) par instance. Si une instance dérive (ex. quelqu'un désinstalle un logiciel), la prochaine exécution peut la ramener à l'état souhaité.
- **Examen :** State Manager = **état souhaité** + **planification** + **document SSM** ; les associations sont le mécanisme pour la configuration continue et des fonctionnalités comme Inventory sur la flotte.

## Distributor

- **Objectif :** **Emballer et déployer des logiciels** sur les **instances gérées** (EC2, sur site). Vous créez un **Distributor package** (un document SSM) et le déployez sur différentes **plateformes** (ex. Windows, Linux).
- **Contenu du package (dans S3) :** Le contenu est stocké dans **Amazon S3**. Vous fournissez **un fichier zip par système d'exploitation cible** (ex. un pour Linux, un pour Windows). Chaque zip contient un **script d'installation**, un **script de désinstallation**, des **exécutables** et un **manifeste JSON** qui décrit le package. Vous pouvez créer **vos propres packages**, utiliser des **packages AWS** ou **tiers** pour installer ou mettre à jour des logiciels régulièrement.
- **Installation :** **(1) Run Command** — installation ponctuelle : exécuter une commande qui installe le package Distributor sur les instances sélectionnées. **(2) State Manager** — sur planification : utiliser le document **AWS-ConfigureAWSPackage** pour que les instances **reçoivent régulièrement** le package depuis Distributor (état souhaité = package installé/mis à jour) ; State Manager maintient le package et peut corriger la dérive (ex. si quelqu'un le désinstalle).

## Patch Manager

- **Objectif :** **Automatiser les correctifs** sur les instances gérées : **mises à jour OS**, **applications** et **sécurité**. Prend en charge **EC2** et **sur site** ; **Linux**, **macOS** et **Windows**. Exécution **à la demande** ou **planifiée** via une **Maintenance Window**.
- **Flux :** Patch Manager **scanne** les instances et produit un **rapport de conformité des correctifs** (quels correctifs manquent ou sont installés). Le rapport peut être envoyé à **S3** pour audit ou automation. Les correctifs sont ensuite appliqués (scan + installation) avec le document **AWS-RunPatchBaseline**, exécutable depuis la console, le SDK ou une Maintenance Window. L'**agent SSM** sur chaque instance **interroge Patch Manager** pour savoir quels correctifs installer selon la **patch baseline** assignée à l'instance. **Contrôle du débit** disponible (ex. via Maintenance Window).
- **Deux concepts principaux :** **(1) Patch baseline** — **(2) Patch groups.**

**Patch baseline**

- Définit **quels correctifs peuvent ou doivent être installés** (et lesquels sont rejetés) sur vos instances. Des **baselines prédéfinies** sont fournies par AWS par OS ; elles sont **gérées par AWS** et **non modifiables**. Comportement **par défaut** : n'installer que les correctifs **critiques et de sécurité**.
- **Patch baselines personnalisées :** Vous créez votre baseline : choisir les correctifs **approuvés** vs **rejetés**, **auto-approuver** dans les X jours après publication, et l'**OS**. Vous pouvez aussi spécifier un **dépôt de correctifs personnalisé ou alternatif** (ex. dépôt d'entreprise). Une baseline peut être définie comme **par défaut** pour les instances n'appartenant à aucun patch group.
- Pour **appliquer** les correctifs, exécuter le document SSM **AWS-RunPatchBaseline**, qui applique les correctifs **OS** et **application** (Linux, macOS, Windows Server).

**Patch groups**

- Les **patch groups** associent un **ensemble d'instances** à une **patch baseline** donnée. Utilisez-les quand vous avez des baselines différentes (ex. dev vs prod) et voulez des ensembles de correctifs différents.
- **Tagger les instances** avec la clé de tag **`Patch Group`** (ou la clé configurée) et une valeur (ex. `dev`, `prod`, `test`). Une instance ne peut être que dans **un seul** patch group. Chaque **patch group** est **enregistré avec une seule** patch baseline.
- **Baseline par défaut :** Les instances **sans** tag patch group utilisent la **patch baseline par défaut**. Quand vous exécutez **AWS-RunPatchBaseline** (ex. via Run Command ou Maintenance Window), l'agent de chaque instance demande à Patch Manager quelle baseline appliquer ; Patch Manager utilise le tag **Patch Group** de l'instance (ou la valeur par défaut) pour retourner la bonne liste de correctifs.

**Patch policy (console)**

- Dans Patch Manager vous pouvez **créer une patch policy** pour automatiser le scan et/ou l'installation. **Nom de la policy** (ex. DemoPolicy). **Scan only** (voir ce qui manque) ou **scan and install**. Si scan and install : définir une **planification de scan** (ex. quotidien à 1 h) et une **planification d'installation** (ex. hebdomadaire le dimanche) ; **reboot** optionnel. Choisir la **patch baseline** par OS : **recommandée par défaut** (définie par AWS pour tous les OS supportés) ou **baselines personnalisées** (une par OS). Optionnellement **écrire les logs de correctifs vers S3**. **Cibles :** région actuelle ou **toutes les régions** (une seule policy multi-région). **Cibles de déploiement :** tous les nœuds gérés ou instances spécifiques. **Contrôle du débit** (ex. 10 % des nœuds à la fois) et **seuil d'erreur** (arrêter en cas de trop d'échecs). **IAM :** profil/rôle d'instance pour appliquer les correctifs. Créer la policy pour l'appliquer.
- **Vue d'ensemble Patch Manager (UI) :** Tableaux de bord pour la gestion des instances, **conformité** et rapports ; **détails de correctifs par nœud** ; **patch baselines** par OS (voir, créer des personnalisées avec **règles d'approbation** et **exceptions**) ; liste des **patches** (par OS, date de publication, importance) ; **paramètres** (ex. intégration Security Hub) ; lien vers **Maintenance Windows** à gauche.

## Maintenance Windows

- **Objectif :** Définir une **planification** (et une durée) pendant laquelle SSM peut exécuter des **tâches** sur les instances enregistrées — ex. **correctifs OS**, **mises à jour de pilotes**, **installation de logiciels** — pour que les changements aient lieu dans une fenêtre contrôlée (ex. 3 h–5 h du matin).
- **Contenu :** Une Maintenance Window a une **planification** (cron ou rate), une **durée** (combien de temps la fenêtre reste ouverte), un ensemble de **cibles enregistrées** (instances, par ID/tag/resource group) et des **tâches** (ex. Run Command avec **AWS-RunPatchBaseline**, ou Automation) qui s'exécutent pendant la fenêtre. Vous pouvez utiliser le **contrôle du débit** pour ne patcher qu'un sous-ensemble de cibles à la fois.
- **Création d'une Maintenance Window (console) :** Créer avec un **nom** (ex. DemoMaintenanceWindow). Option pour **autoriser les cibles non enregistrées**. **Planification :** cron (ex. quotidien à 3 h) ou rate. **Durée** (ex. 2 heures). Option pour **arrêter de lancer de nouvelles tâches** X heures avant la fermeture (ex. 1 heure). Heure de début/fin optionnelle. Après création, **enregistrer des tâches** dans la fenêtre — ex. **Run Command** avec le document **AWS-RunPatchBaseline**, nommer la tâche (ex. « patch »), sélectionner les **cibles**. Définir la **concurrence** (ex. une cible à la fois) et le **seuil d'erreur** (ex. 0 pour arrêter au premier échec). Le correctif ne s'exécute que pendant la fenêtre. Vous pouvez supprimer la Maintenance Window pour nettoyer.
- **Examen :** Patch Manager sert à **patcher** les instances ; les correctifs peuvent être exécutés **dans une Maintenance Window** avec **contrôle du débit** pour ne pas impacter toute la flotte d'un coup.

## OpsCenter

- **Objectif :** **Voir, investiguer et remédier aux problèmes en un seul endroit**. Les problèmes opérationnels sont **centralisés** dans Systems Manager pour **réduire le temps moyen de résolution (MTTR)**. Prend en charge les nœuds **EC2** et **sur site**.
- **Ce qui alimente OpsCenter :** Les données sont **agrégées** depuis **CloudWatch**, **Application Insights**, **EventBridge**, **Config**, **Security Hub**, **DevOps Guru** et **SSM Incident Manager**. Exemples : **findings de sécurité** (Security Hub), **problèmes de perfs** (ex. throttling DynamoDB), **échecs** (ex. instance n'a pas pu être lancée depuis une ASG).
- **OpsItems :** Un **OpsItem** est un problème ou une interruption opérationnelle à investiguer et remédier. Il peut être créé à partir d'**événements**, de **ressources**, de **changements de config**, de logs **CloudTrail**, **EventBridge**, etc. Dans OpsCenter vous voyez tous les OpsItems et obtenez des **recommandations** — quels **runbooks** et **SSM Automations** peuvent aider à résoudre le problème.
- **Notifications et automation :** Vous pouvez configurer des **notifications** et des **automations** autour des OpsItems. Exemple : **EventBridge** (ex. quotidien) invoque une **Lambda** qui scanne EC2 pour des **volumes EBS orphelins** (ex. non attachés ou inutilisés depuis 45+ jours) et **crée des OpsItems** dans OpsCenter. Depuis OpsCenter, les recommandations peuvent inclure l'exécution d'un document SSM pour **créer un snapshot**, **supprimer un snapshot** ou **supprimer le volume** — exécuté comme **SSM Automations**.

## Features (référence)

Systems Manager offre de nombreuses capacités ; pour l'examen, les domaines pertinents incluent :

- **Nœud / flotte :** Fleet Manager, Compliance, Inventory, Hybrid Activations, **Session Manager**, **Run Command**, **State Manager**, **Patch Manager**, Distributor  
- **Gestion du changement :** **Automation**, Change Calendar, **Maintenance Windows**, **Documents**, Quick Setup  
- **Application :** Application Manager, AppConfig, **Parameter Store**  
- **Operations :** Explorer, OpsCenter, tableaux de bord CloudWatch  

---
> 🌐 *Traduit par Claude*
