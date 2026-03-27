---
title: "Fondamentaux d'AWS Lambda, intégrations et tarification"
date: "2026-03-27"
excerpt: "Un résumé pratique des concepts clés d'AWS Lambda, de son modèle de tarification et de ses intégrations courantes comme EventBridge et S3."
author: "Tony Duong"
category: "note"
tags: ["aws", "lambda", "serverless", "eventbridge", "s3", "cloudwatch", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 4
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Ce qu'est AWS Lambda et pourquoi c'est important

AWS Lambda est un service de calcul serverless dans lequel vous téléversez du code sous forme de fonctions et AWS l'exécute à la demande. Contrairement à EC2, vous ne gérez ni les serveurs, ni la capacité, ni les groupes d'auto scaling.

Pourquoi c'est utile :

- aucun provisionnement ni patching de serveurs
- vous payez uniquement lorsque le code s'exécute
- mise à l'échelle horizontale automatique avec la concurrence
- l'architecture orientée événements devient beaucoup plus simple

Lambda est surtout adapté aux charges de travail réactives et de courte durée. Chaque invocation peut s'exécuter jusqu'à 15 minutes.

## Lambda vs EC2 : différences essentielles

Avec EC2 :

- vous choisissez à l'avance un CPU et une mémoire fixes
- les instances peuvent tourner en continu même lorsqu'elles sont inactives
- la mise à l'échelle nécessite des ASG et un travail opérationnel supplémentaire

Avec Lambda :

- vous déployez uniquement le code de la fonction
- l'exécution se produit uniquement lors d'une invocation
- AWS gère la mise à l'échelle automatiquement
- la facturation s'aligne étroitement sur l'usage réel

Ce changement est la principale raison de la popularité de Lambda dans les architectures cloud modernes.

## Modèle de tarification à retenir

La tarification de Lambda comporte deux dimensions :

- **Requêtes (invocations) :** le premier million de requêtes par mois est gratuit, puis une tarification faible par million s'applique
- **Durée de calcul :** facturation à la milliseconde en GB-secondes

Point clé orienté examen :

- le choix de la mémoire influence les performances CPU et réseau
- augmenter la mémoire peut réduire la durée d'exécution et parfois diminuer le coût total

Le free tier est généreux, ce qui fait de Lambda un choix par défaut économique pour de nombreuses tâches orientées événements.

## Options de runtime et de packaging

Les runtimes couramment utilisés incluent :

- Node.js
- Python
- Java
- C#/.NET
- Ruby

Vous pouvez aussi utiliser des runtimes personnalisés et des images conteneur via la Lambda Runtime API. Pour les décisions d'examen, les charges de travail fortement orientées conteneur sont souvent mieux placées sur ECS/Fargate, tandis que Lambda reste idéal pour le traitement événementiel de type fonction.

## Intégrations à forte valeur

Lambda s'intègre profondément avec les services AWS, notamment :

- API Gateway (backend pour APIs REST)
- EventBridge/CloudWatch Events (planification et routage d'événements)
- S3 (déclencheurs de création d'objet)
- DynamoDB (déclencheurs de stream/changements)
- SQS et SNS (traitement de messages et de notifications)
- CloudWatch Logs (visibilité opérationnelle)
- Cognito (hooks de cycle de vie d'authentification)

Cet écosystème est un avantage majeur de Lambda.

## Hands-On 1 : invocation planifiée avec EventBridge

Scénario :

- créer la fonction `lambda-demo-eventbridge`
- créer une règle EventBridge avec `rate(1 minute)`
- définir Lambda comme cible de la règle

Ce qu'il faut vérifier :

- Lambda affiche le déclencheur EventBridge dans sa configuration
- la policy resource-based de Lambda inclut l'autorisation pour `events.amazonaws.com`
- la condition limite l'invocation à l'ARN de la règle EventBridge spécifique
- les logs CloudWatch confirment les invocations périodiques
- la payload de l'événement inclut des champs comme `source`, `detail-type`, `time` et `resources`

Conseil opérationnel : désactivez la règle planifiée après les tests pour éviter des invocations inutiles.

## Hands-On 2 : déclencheur S3 sur création d'objet

Scénario :

- créer une fonction Lambda et un bucket S3 dans la même région
- ajouter une S3 Event Notification pour les événements de création d'objet
- définir Lambda comme destination

Ce qu'il faut vérifier :

- S3 apparaît comme déclencheur dans Lambda
- la policy resource-based de Lambda accorde l'autorisation d'invocation au principal de service S3
- le téléversement d'un objet génère un nouveau flux de logs CloudWatch
- la payload de l'événement inclut le nom du bucket, la clé de l'objet, sa taille, la région et les métadonnées

Ce modèle constitue la base de nombreux workflows serverless comme la génération de miniatures d'images, l'extraction de métadonnées et les pipelines de validation de fichiers.

## Modèles serverless typiques

### 1) Pipeline de fichiers réactif

- téléverser un fichier dans S3
- un événement S3 invoque Lambda
- Lambda transforme les données et stocke la sortie (S3/DynamoDB)

### 2) Cron serverless

- un planning EventBridge déclenche Lambda toutes les X minutes/heures
- Lambda exécute des tâches périodiques sans maintenir d'instances EC2

Ces deux modèles réduisent le coût d'inactivité et simplifient les opérations.

## Notes orientées examen

- durée d'exécution maximale de Lambda : 15 minutes
- paiement par invocation et par durée
- la mémoire influence l'allocation CPU/réseau
- EventBridge et S3 invoquent Lambda via des autorisations resource-based
- privilégier ECS/Fargate pour des charges de travail conteneur plus larges
- Lambda excelle quand le travail est orienté événements et en pics de charge

## Points clés à retenir

- Lambda représente un changement majeur du calcul basé sur des serveurs vers des fonctions orientées événements
- le modèle de coût est simple et généralement efficace, surtout avec le free tier
- les intégrations avec EventBridge, S3 et d'autres services AWS sont centrales
- les policies resource-based expliquent qui peut invoquer une fonction
- comprendre les payloads des déclencheurs dans CloudWatch est essentiel pour le débogage

---
*Traduit par Claude*
