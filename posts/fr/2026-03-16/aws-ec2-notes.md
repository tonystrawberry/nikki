---
title: "Notes AWS EC2 (lancement, redimensionnement, placement, SSH, CloudWatch Agent, status checks, hibernate, Instance Scheduler, AMI, Image Builder)"
date: "2026-03-16"
excerpt: "Notes condensées sur EC2 : lancement, redimensionnement, placement groups, SSH/Instance Connect, CloudWatch et agent, status checks, Hibernate, Instance Scheduler, AMI (création, No-Reboot, cross-account), EC2 Image Builder, AMI en production."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "ec2", "cloudops", "certification", "cloudwatch", "security", "ssm", "ami", "image-builder"]
---

## Lancer une instance

- **Nom**, **AMI** (ex. Amazon Linux), **type d'instance** (ex. t2.micro pour le free tier).
- **Paire de clés :** Créer ou sélectionner ; RSA PEM pour SSH. Conserver le fichier `.pem` (ex. dans Téléchargements).
- **Paramètres réseau :** Créer ou modifier le security group ; autoriser SSH (port 22) depuis ton IP ou depuis partout pour les démos.
- **Stockage :** Par défaut en général suffisant (EBS-backed).
- **Connexion :** Copier l’**IPv4 publique** de l’instance, puis en terminal :
  - `chmod 400 YourKey.pem` (obligatoire — de mauvaises permissions donnent « unprotected private key file »).
  - `ssh -i YourKey.pem ec2-user@<public-ip>` (le nom d’utilisateur dépend de l’AMI : `ec2-user` pour Amazon Linux, `ubuntu` pour Ubuntu).
- **EC2 Instance Connect :** Dans la console, ouvrir « EC2 Instance Connect » ; le nom d’utilisateur est proposé et un shell dans le navigateur s’ouvre. Pas besoin de fournir ta clé — AWS pousse une **clé publique SSH à usage unique** (valide 60 s) et se connecte depuis la plage d’IP du service EC2 Instance Connect.

## Changer le type d’instance (redimensionnement)

- **Uniquement pour les instances EBS-backed.** Étapes : **stop** l’instance → **changer le type** (ex. t2.micro → t2.small) → **start** l’instance.
- Après stop/start, l’instance peut tourner sur un **hôte physique différent** ; le **stockage EBS est conservé** (données, fichiers, OS identiques). L’instance store ne persiste pas.
- **EBS-optimized :** Les générations récentes (ex. t3) supportent EBS-optimized par défaut (meilleur débit vers EBS). Les types plus anciens comme t2.small peuvent ne pas.
- t2.small (et la plupart des types hors t2.micro) **ne sont pas free tier** — tu seras facturé. Préférer t2.micro pour la pratique si tu restes en free tier.

## Placement groups

Contrôlent la façon dont les instances EC2 sont placées les unes par rapport aux autres (pas de choix matériel direct, mais une stratégie).

| Stratégie | Description | Cas d’usage |
|-----------|-------------|-------------|
| **Cluster** | Instances dans la même AZ, faible latence / même « cluster » matériel. ~10 Gbps entre instances avec enhanced networking. | Haute perf, big data, apps à faible latence. **Risque :** si l’AZ tombe, tout tombe. |
| **Spread** | Chaque instance sur **un matériel différent** ; peut couvrir plusieurs AZ. **Max 7 instances par AZ** par placement group spread. | Maximiser la HA ; apps critiques où les pannes d’instances doivent être isolées. |
| **Partition** | Instances réparties en **partitions** (chaque partition ≈ un rack). Jusqu’à **7 partitions par AZ** ; les partitions peuvent couvrir plusieurs AZ. Beaucoup d’instances par partition ; **centaines par groupe**. | Apps partition-aware : HDFS, HBase, Cassandra, Kafka. Une panne de partition n’entraîne pas les autres. |

## SSH et dépannage de connexion

- **« Unprotected private key file » :** Corriger les permissions du PEM, ex. `chmod 400 YourKey.pem`.
- **« Permission denied » / « Host key not found » / « Connection closed » :** Mauvais **nom d’utilisateur** pour l’AMI (ex. `ubuntu` sur Amazon Linux). Utiliser l’utilisateur correct pour ton AMI.
- **Délai de connexion (timeout) :** En général **réseau/sécurité** — vérifier :
  - **Security group :** SSH entrant (port 22) depuis ton IP (ou depuis la plage EC2 Instance Connect si tu l’utilises).
  - **Route tables** et **NACLs** du sous-réseau de l’instance.
  - L’instance a une **IPv4 publique** si tu veux l’atteindre depuis internet.
  - L’instance n’est pas **surchargée** (ex. CPU 100 %) pour accepter de nouvelles connexions.

**EC2 Instance Connect vs SSH :**

- **SSH :** Ton IP doit être autorisée dans le security group (entrée port 22). Tu utilises ta paire de clés.
- **EC2 Instance Connect :** Tu n’utilises pas ta clé. AWS pousse une clé à courte durée et se connecte **depuis la plage d’IP du service EC2 Instance Connect**. Le security group doit autoriser **SSH (22) depuis cette plage**, pas seulement « My IP ». Récupérer la plage dans le JSON [AWS IP address ranges](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html) (filtrer par service « EC2 Instance Connect » et ta région).

## Endpoint EC2 Instance Connect (instances privées)

Pour les **instances EC2 dans des sous-réseaux privés** (sans accès internet direct) :

- Créer un **endpoint EC2 Instance Connect** (VPC endpoint pour le service).
- Attacher un **security group** à l’endpoint qui autorise le **trafic SSH sortant** vers les instances cibles.
- Les security groups des instances cibles doivent autoriser le **SSH entrant depuis le security group de l’endpoint**.
- Pas besoin d’**internet gateway**, **NAT gateway** ni IP publique sur les instances ; tu te connectes via l’endpoint puis utilises EC2 Instance Connect vers l’instance privée.

## CloudWatch et EC2 (pour l’examen)

- **Monitoring basique :** Métriques en **5 minutes** (sans coût supplémentaire).
- **Monitoring détaillé :** Métriques en **1 minute** (coût supplémentaire).
- **Métriques EC2 intégrées** (poussées par AWS) : **CPU** (utilisation ; pour T2/T3 burstable : crédits et solde), **réseau** (in/out, paquets), **status checks** (instance = santé VM, system = matériel sous-jacent, EBS = volumes attachés), **disque** lecture/écriture **uniquement pour les instances instance store–backed** (pour EBS-backed, les métriques disque sont sur le **volume EBS** dans CloudWatch, pas sur l’instance EC2).
- **La RAM n’est pas incluse** dans les métriques EC2 par défaut — point fréquent à l’examen. Tu dois pousser des **métriques personnalisées** (ex. RAM, niveau app) depuis l’instance ; résolution 1 minute ou, en haute résolution, jusqu’à **1 seconde**. L’instance doit avoir un **rôle IAM** avec permission de publier des métriques vers CloudWatch.

## Unified CloudWatch Agent

- Pour les serveurs **EC2 ou on-premises** : collecter des **métriques système supplémentaires** (RAM, disque, processus, etc.) et **envoyer les logs** vers CloudWatch Logs. Par défaut, aucun log ni métrique custom n’est envoyé depuis une instance EC2 sans agent.
- **Configuration :** SSM Parameter Store (central, recommandé pour plusieurs instances) ou fichier de config local. L’instance (ou le serveur on-prem) doit avoir les **permissions IAM** pour CloudWatch (métriques + logs) et, si usage de SSM, pour Parameter Store.
- **Namespace :** Les métriques poussées par l’agent utilisent le namespace **CWAgent** par défaut (configurable).
- **Plugin procstat (examen) :** La seule façon d’obtenir des métriques **par processus** (CPU, mémoire par processus) sur Linux ou Windows est l’**Unified CloudWatch Agent** avec le plugin **procstat**. Tu sélectionnes les processus par **fichier PID**, **nom de processus** ou **pattern**. Les métriques ont le préfixe **procstat_** (ex. `procstat_cpu_usage`, `procstat_time`).

## Installer et configurer l’agent CloudWatch

- **Rôle IAM :** Créer un rôle EC2 avec **CloudWatchAgentServerPolicy** (pousser métriques, envoyer logs, lire paramètres SSM). Pour **stocker** la config de l’agent dans SSM lors du setup, il faut aussi **CloudWatchAgentAdminPolicy** (put parameter) ; après le setup tu peux retirer la policy admin et garder seulement la server. Attacher le rôle à l’instance.
- **Installation :** `sudo yum install -y amazon-cloudwatch-agent` (Amazon Linux 2). Puis lancer le **wizard** : `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard` — choisir Linux, EC2, utilisateur root ; optionnellement StatsD/CollectD (si tu actives CollectD sans l’avoir installé, l’agent ne démarrera pas) ; activer les métriques hôte (CPU, **memory**) ; ajouter les dimensions EC2 ; définir la résolution (1s à 60s) ; optionnellement ajouter des chemins de logs (ex. `/var/log/httpd/access_log`, `error_log`) avec noms de log group et rétention. Le wizard produit un JSON ; le stocker dans **SSM Parameter Store** (ex. `AmazonCloudWatch-Linux`) pour que d’autres instances puissent le récupérer.
- **Démarrer depuis SSM :** `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-Linux`. Ou démarrer depuis un fichier local avec `-c file:path/to/config.json`. Les log groups et streams apparaissent dans CloudWatch Logs ; les métriques (ex. `mem_used_percent`, disque, CPU, réseau, processus, swap) apparaissent dans le namespace **CWAgent**.

## Status checks et récupération

- **System status check :** AWS surveille l’**hôte physique** (alimentation, matériel). En cas d’échec, faire **stop** puis **start** (pas reboot) pour **migrer** l’instance vers un autre hôte (nouvelle IP publique ; mêmes données EBS). Consulter le **Personal Health Dashboard** pour la maintenance planifiée affectant ton instance.
- **Instance status check :** Logiciel et config réseau sur l’instance (ex. mémoire épuisée, config réseau invalide). Corriger en **redémarrant** ou en modifiant la config de l’instance.
- **EBS status check :** Volumes EBS attachés accessibles et capables d’I/O. En cas d’échec, **reboot** ou **remplacer** le volume concerné.
- **Métriques CloudWatch :** `StatusCheckFailed_System`, `StatusCheckFailed_Instance`, `StatusCheckFailed_AttachedEBS`, et `StatusCheckFailed` (n’importe lequel des trois). S’en servir pour des alarmes.
- **Options de récupération :**
  1. **Alarme CloudWatch avec action « Recover » :** Sur échec de status check (ex. system), l’alarme se déclenche et AWS **récupère** l’instance (migration vers un nouvel hôte). Conserve **même IP privée, IP publique, EIP, métadonnées, placement group**. Peut aussi envoyer une notification SNS. Action **« Reboot »** pour les problèmes au niveau instance (logiciel).
  2. **ASG avec min = max = desired = 1 :** Health check basé sur le status EC2. L’instance unhealthy est terminée ; l’ASG en lance une nouvelle. Tu perds la même IP/attachement EBS ; à utiliser si tu peux accepter le remplacement et as de l’automatisation pour restaurer l’état.

## EC2 Hibernate

- **Stop** conserve les données EBS ; **terminate** peut supprimer ou garder les volumes. **Start** = boot OS complet + user data + démarrage app (lent).
- **Hibernate :** La RAM est **écrite sur le volume EBS root**, puis l’instance s’arrête. Au start, la RAM est **chargée depuis le disque** — du point de vue de l’OS l’instance n’a jamais été arrêtée (ex. `uptime` continue). Redémarrage **plus rapide** ; pas de ré-init des apps/caches.
- **Exigences :** Le volume root doit être **EBS**, **chiffré**, et **assez grand** pour contenir la RAM de l’instance. Limite actuelle de RAM pour l’hibernation &lt; 150 GB (à vérifier dans la doc). Pas pour le bare metal. Pris en charge pour on-demand, reserved, spot. Durée d’hibernation typiquement limitée (ex. 60 jours).
- **Activer :** À la création, définir le comportement **Stop - Hibernate** et s’assurer que le volume root est chiffré et dimensionné pour la RAM (ex. 8 Go root pour 1 Go RAM). Après hibernate → start, `uptime` ne se réinitialise pas.

## Instance Scheduler (AWS Solution)

- **Ce n’est pas un service** — une **AWS Solution** déployée via **CloudFormation**. **Démarre et arrête** automatiquement des instances EC2, des instances RDS et des EC2 Auto Scaling groups selon un planning pour **réduire les coûts** (ex. hors heures de bureau).
- **Fonctionnement :** Les plannings sont dans une table **DynamoDB**. Une **Lambda** (déclenchée sur un schedule, ex. toutes les 5 min) lit la table et déclenche d’autres Lambdas pour démarrer ou arrêter les ressources. Support **cross-account** et **cross-region**. Tagger les ressources avec la clé de schedule (ex. `Schedule`) pour que la solution sache quoi cibler.
- **Déploiement :** Chercher « Instance Scheduler AWS » → page de la solution → **Launch solution** → CloudFormation s’ouvre avec l’URL du template. Paramètres : clé de tag, timezone par défaut, activé/désactivé, services (EC2, RDS, Neptune, DocumentDB, ASG), optionnel snapshot RDS à l’arrêt, etc. Après déploiement, configurer les plannings dans la table DynamoDB de config (ex. heures de bureau, jours ouvrés). L’examen peut demander le **but** de cette solution (réduction des coûts par start/stop planifié).

## AMI (Amazon Machine Image)

- **Définition :** Une personnalisation d’une instance EC2 — OS, logiciels, outils de monitoring. **Boot et config plus rapides** quand tu lances depuis une AMI custom car tout est pré-packagé. Les AMI sont **spécifiques à une région** ; tu peux les copier entre régions.
- **Sources :** **Publiques** (AWS, ex. Amazon Linux 2), **les tiennes** (créer et maintenir ; des outils automatisent), **AWS Marketplace** (AMI tierces, souvent payantes).
- **Créer depuis une instance :** Personnaliser une instance → l’**arrêter** (pour l’intégrité du FS) → clic droit → **Image and templates** → **Create image**. Des snapshots EBS sont créés en arrière-plan. Lancer de nouvelles instances depuis **AMIs** → **My AMIs** (ou « From AMI » dans le flux de lancement). Les instances depuis ton AMI démarrent plus vite (pas besoin de re-exécuter tout le user data).
- **Migrer entre AZ :** Créer une AMI depuis une instance en AZ A, puis **lancer** depuis cette AMI en choisissant un **subnet en AZ B** — mêmes données et apps dans une autre AZ.

## AMI : option No-Reboot

- **Par défaut :** La création d’une AMI **arrête** d’abord l’instance, puis snapshot le volume EBS → **intégrité du système de fichiers**.
- **No-Reboot activé :** Le snapshot est pris sur l’instance **en cours d’exécution**. **Risque :** Pas de garantie de cohérence du FS ; les buffers OS peuvent ne pas être flush. À utiliser seulement si tu acceptes ce compromis.
- **AWS Backup :** Quand Backup crée des AMI d’EC2, il **ne redémarre pas** l’instance (comportement no-reboot). Donc Backup **ne garantit pas** l’intégrité du FS. Pour des **sauvegardes AMI planifiées avec intégrité**, utiliser ex. **EventBridge** (schedule) → **Lambda** → créer l’AMI **avec** reboot (arrêter l’instance, créer l’image, puis démarrer).

## AMI : partage et copie cross-account

- **Partage :** Tu partages une AMI avec un autre compte ; **tu restes propriétaire**. AMI **non chiffrée** : partager avec des comptes spécifiques ou rendre publique. **Chiffrée** (clé managée client, CMK) : tu dois aussi **partager la clé KMS** avec le compte cible (ex. describe, decrypt, re-encrypt) pour qu’il puisse lancer depuis l’AMI.
- **Copie (cross-account) :** Le compte cible **copie** l’AMI partagée dans son compte → il **possède** la nouvelle AMI. La source doit accorder la **lecture** des **snapshots EBS sous-jacents**. Si chiffré, la source partage la CMK ; le cible peut **re-chiffrer** le snapshot avec sa propre CMK lors de la copie.
- **Console :** **Actions** → **Edit AMI permissions** → ajouter des IDs de compte ou des ARN org/OU ; optionnellement **ajouter la permission create volume aux snapshots associés** pour que l’autre compte puisse utiliser l’AMI.

## EC2 Image Builder

- **But :** Automatiser la **création, maintenance, validation et tests** d’AMI (et d’images conteneur). Utile pour l’examen.
- **Flux :** Image Builder lance une **instance EC2 builder** → exécute des **composants de build** (installer Java, AWS CLI v2, app, mises à jour, etc.) → crée une **AMI** → lance une **instance de test** depuis cette AMI → exécute des **tests** (optionnel ; ex. sécurité, app) → **distribue** l’AMI (ex. vers plusieurs régions). Tout automatisé.
- **Recipe :** Définit l’**image source** (ex. Amazon Linux 2, x86) et les **composants** (gérés AWS ou custom). L’ordre des composants est configurable. Utiliser une source **x86** si tu build sur ex. t2.micro (pas d’ARM64).
- **Configuration d’infrastructure :** Type d’instance pour build/test, **instance profile IAM** avec : **EC2InstanceProfileForImageBuilder**, **ECRContainerBuilds** (pour Docker), **AmazonSSMManagedInstanceCore**.
- **Distribution :** Quelles régions reçoivent l’AMI. Possibilité de distribuer vers plusieurs régions automatiquement.
- **Schedule :** Manuel, ou ex. hebdo / quand les dépendances sont mises à jour (CRON). **Service gratuit** — tu paies uniquement l’EC2 et le stockage utilisés pendant le build et pour l’AMI/snapshots.
- **Nettoyage :** Désinscrire l’AMI, puis **supprimer** les **snapshots EBS sous-jacents**.

## AMI en production

- **AMI pré-approuvées :** Tagger les AMI (ex. `environment=prod`). **Policy IAM** avec une **condition** qui autorise `ec2:RunInstances` seulement quand l’AMI a ce tag → les utilisateurs ne peuvent lancer qu’à partir d’AMI approuvées. Restreindre qui peut ajouter des tags aux AMI.
- **AWS Config :** Définir une règle qui vérifie les instances EC2 ; signaler les instances **non conformes** (lancées depuis une AMI non approuvée/taggée). Les instances conformes restent vertes ; agir sur les non conformes.

---
> 🌐 *Traduit par Claude*
