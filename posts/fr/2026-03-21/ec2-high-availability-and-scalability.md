---
title: "Haute disponibilité et scalabilité EC2"
date: "2026-03-21"
excerpt: "Notes consolidées AWS sur la scalabilité EC2, la haute disponibilité, ELB/ALB/NLB/GWLB, TLS, health checks, métriques, réglages target group, et opérations d'Auto Scaling."
author: "Tony Duong"
category: "note"
tags: ["aws", "ec2", "scalability", "high-availability", "load-balancer", "elb", "alb", "nlb", "gwlb", "zcloudops", "cloud"]
---

## Aperçu

Article consolidé pour le parcours AWS CloudOps : scalabilité, haute disponibilité, load balancers, health checks, sécurité réseau, TLS, Auto Scaling Group (ASG), warm pools, lifecycle hooks et scaling plans.

## 1) Scalabilité et haute disponibilité

- **Scale up/down (vertical)** : changer la taille d'instance.
- **Scale out/in (horizontal)** : ajouter/retirer des instances.
- **HA** : déployer sur plusieurs AZ pour survivre à la perte d'une zone.
- **Passive HA** : actif + standby.
- **Active HA** : plusieurs nœuds actifs.

## 2) ELB (Elastic Load Balancing)

Un load balancer expose un point d'entrée unique, répartit la charge, applique des health checks et permet SSL termination, stickiness, et architecture multi-AZ.

Types :

- **ALB** (L7 HTTP/HTTPS/WebSocket)
- **NLB** (L4 TCP/TLS/UDP, très haute perf)
- **GWLB** (L3/IP pour inspection sécurité)
- **CLB** (legacy)

## 3) ALB en profondeur

Fonctions principales :

- Routage par path / host / query / headers
- Target groups (EC2, ECS, Lambda, private IP)
- Health checks par target group
- Headers `X-Forwarded-For`, `X-Forwarded-Port`, `X-Forwarded-Proto`

Pattern sécurité recommandé :

- SG ALB : entrée publique 80/443
- SG EC2 : entrée depuis SG ALB uniquement

## 4) ALB hands-on (résumé)

- Lancer 2 instances EC2
- Créer ALB + target group + listener
- Vérifier round-robin via DNS ALB
- Stopper une instance -> unhealthy -> plus de trafic
- Redémarrer -> healthy -> trafic rétabli

## 5) Concepts ALB avancés

- Restreindre l'accès EC2 direct (uniquement via SG ALB)
- Listener rules avec conditions/actions/priorités
- Exemple : `/error` -> fixed response `404`

## 6) NLB (théorie)

Choisir NLB pour :

- TCP/UDP/TLS
- latence très faible et très haut débit
- IP statiques par AZ (option Elastic IP)

Cibles possibles : EC2, private IP, et NLB devant ALB (IP statiques + logique L7 derrière).

## 7) NLB hands-on (résumé)

- Créer NLB et target group TCP
- Health checks HTTP/HTTPS/TCP possibles
- Erreur fréquente : SG EC2 autorise ALB mais pas NLB
- Ajouter SG NLB dans SG EC2 -> targets healthy

## 8) GWLB

GWLB sert à faire passer tout le trafic via des appliances réseau (firewall, IDS/IPS, deep packet inspection).

- Couche 3 (IP)
- Mot-clé examen : **GENEVE 6081**
- Cibles : EC2 ou private IP (on-prem possible)

## 9) Sticky sessions

Session affinity via cookie (ALB/NLB/CLB), utile pour conserver l'état de session mais peut déséquilibrer la charge.

- Cookie applicatif ou cookie géré LB
- Expiration configurable

## 10) Cross-zone load balancing

- **ON** : un nœud LB distribue vers toutes les AZ
- **OFF** : nœud LB reste dans son AZ

Par défaut :

- ALB : activé
- NLB/GWLB : désactivé (activer peut coûter inter-AZ)

## 11) TLS/SSL et SNI

- TLS chiffre le trafic client -> LB (in-flight encryption)
- Certificats gérés via ACM (ou import)
- SNI permet plusieurs certificats/hostnames sur un même ALB/NLB

## 12) Connection Draining / Deregistration Delay

- CLB : connection draining
- ALB/NLB : deregistration delay

Permet de finir les requêtes en vol avant suppression d'une cible (`0` à `3600`, défaut `300`).

## 13) Health checks approfondis

Paramètres clés : protocole, port, path, timeout, interval, seuil healthy/unhealthy, success codes.

États : initial, healthy, unhealthy, unused, draining, unavailable.

## 14) Erreurs, métriques, logs, tracing

- `4XX` : côté client
- `5XX` : côté serveur/backend/LB

Métriques importantes :

- `HealthyHostCount`, `UnHealthyHostCount`
- `RequestCount`, `RequestCountPerTarget`
- latence, `HTTPCode_Target_*`
- `SurgeQueueLength`, `SpilloverCount`

Access logs ALB vers S3 pour audit/debug, et `X-Amzn-Trace-Id` pour corrélation des requêtes.

## 15) Attributs avancés target group

- deregistration delay
- slow start
- routing algorithm
- stickiness

Algorithmes : round robin, least outstanding requests (ALB/CLB), flow hash (NLB).

## 16) Règles ALB et target groups pondérés

Une règle peut répartir le trafic vers plusieurs target groups avec des poids (ex. 80/20) pour blue/green/canary.

## 17) ASG fondamentaux

ASG ajuste la taille du fleet EC2 via min/desired/max, remplace les instances unhealthy et s'intègre naturellement aux target groups des load balancers.

## 18) Launch template + ASG

Le launch template définit AMI, type, user-data, SG, IAM, volume, etc. C'est la base standard pour déployer des instances ASG de façon reproductible.

## 19) Politiques de scaling ASG

- Dynamic : target tracking / simple / step
- Scheduled : actions planifiées
- Predictive : forecast ML sur charge historique

## 20) Cooldown et métriques ASG

- Métriques utiles : CPU, request per target, network, custom metrics
- Cooldown (souvent ~300s) évite les oscillations

## 21) Instance Refresh

Rolling replacement natif ASG pour basculer vers une nouvelle version de launch template/AMI avec minimum healthy percentage + warm-up.

## 22) Warm Pools

Instances pré-initialisées pour accélérer le scale-out et réduire la latence de bootstrap.

## 23) Lifecycle hooks

Hooks au lancement/à la terminaison pour exécuter scripts de setup, extraction de logs, snapshots, cleanup (intégration EventBridge/SNS/SQS/Lambda).

## 24) Launch configuration vs launch template

Launch configuration = legacy. Launch template = versionné, flexible, recommandé.

## 25) Pattern SQS -> ASG

Utiliser la profondeur de file SQS (CloudWatch alarm) pour scale out/in des workers EC2 automatiquement.

## 26) Health checks ASG

Sources de santé : EC2 checks, ELB checks, custom checks (`set-instance-health`). Une instance unhealthy est remplacée.

## 27) Troubleshooting ASG

Vérifier : max capacity atteinte, capacité AZ insuffisante, ressources launch template supprimées (SG/key pair), activity history.

## 28) CloudWatch metrics ASG

Group metrics (opt-in) : `GroupDesiredCapacity`, `GroupInServiceInstances`, etc.

EC2 metrics : CPU/network/status checks (basic vs detailed monitoring).

## 29) AWS Auto Scaling Service / Scaling Plans

Plan centralisé multi-services (EC2/ECS/DynamoDB/Aurora/Spot Fleet) avec modes :

- dynamic scaling
- predictive scaling

Profils : disponibilité, équilibré, coût, custom.

## Points clés

- ALB + ASG est la base des architectures web résilientes sur AWS.
- Bien régler SG, health checks, et délais de drainage évite beaucoup d'incidents.
- NLB/GWLB répondent à des besoins réseau/sécurité spécifiques.
- Scaling plans et métriques CloudWatch donnent une gouvernance centralisée et prévisible du capacity management.

## Next updates

Ce post consolidé est prévu pour recevoir les prochaines notes du cours AWS CloudOps.

---
> 🌐 *Traduit par Claude*
