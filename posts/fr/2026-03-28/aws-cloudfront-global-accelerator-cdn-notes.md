---
title: "AWS CloudFront et Global Accelerator : CDN, cache, origines et réseau edge"
date: "2026-03-28"
excerpt: "Notes orientées examen sur CloudFront en CDN, origines (S3 OAC, VPC, HTTP personnalisé), cache et invalidation, Origin Shield, restrictions géo, journaux et rapports, sessions persistantes ALB, et Global Accelerator vs CloudFront."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "cloudfront", "cdn", "global-accelerator", "s3", "alb", "caching", "edge", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 7
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## CloudFront en CDN

**Amazon CloudFront** est le **réseau de distribution de contenu (CDN)** d’AWS. À l’examen, **CDN** → penser **CloudFront**.

- Met en cache le contenu **majoritairement en lecture** dans des **edge locations** (points de présence) dans le monde pour **réduire la latence** et améliorer l’expérience.
- Empreinte mondiale importante (cours : de l’ordre de **200+** PoP — vérifier les chiffres actuels).
- Répartir le trafic sur le edge aide aussi la résilience **DDoS** ; s’intègre à **AWS Shield** et **WAF** (section sécurité en profondeur).

**Exemple :** l’origine est un **bucket S3 en Australie** ; un utilisateur aux **États-Unis** frappe un **edge proche**. La première requête peut **aller à l’origine** ; les utilisateurs US suivants obtiennent souvent un **cache hit** au edge sans nouveau trajet vers l’Australie.

## Origines

CloudFront tire depuis une **origine** (backend) :

| Type d’origine | Notes |
|----------------|--------|
| **Amazon S3** | Distribuer et mettre en cache des objets ; peut aussi supporter des schémas **upload** via CloudFront. Accès S3 sécurisé avec **Origin Access Control (OAC)** plus **bucket policy** (remplace les schémas OAI hérités dans les setups modernes). |
| **Origine VPC** | **ALB**, **NLB** ou **EC2** **privés** dans votre VPC — pas besoin d’exposer l’app sur Internet public (préféré pour les apps privées ; certains niveaux console peuvent restreindre l’origine VPC). |
| **Origine personnalisée (HTTP)** | Tout serveur HTTP : **point de terminaison site web statique S3** (hébergement site activé), **ALB public**, on-prem, etc. |

## Flux de requête (bases du cache)

1. Client → **edge location**.
2. Le edge vérifie le **cache** pour cet objet (voir **clé de cache** / politiques ci-dessous).
3. **Cache hit** → servir depuis le edge.
4. **Cache miss** → CloudFront récupère depuis l’**origine**, **stocke** la réponse au edge (selon TTL/politique), renvoie au client.

Origines S3 : le trafic entre CloudFront et S3 utilise souvent le **réseau AWS** ; **OAC** et **bucket policy** garantissent que **seul CloudFront** (votre distribution) peut lire des objets privés — les **objets restent privés** pendant que les viewers utilisent le **domaine CloudFront**.

## CloudFront vs réplication inter-régions S3 (CRR)

| | **CloudFront** | **S3 CRR** |
|---|----------------|------------|
| **Modèle** | **Cache edge global** ; objets mis en cache aux edges pour un **TTL** | **Réplication complète du bucket** vers une autre région |
| **Couverture** | Nombreux PoP dans le monde par conception | Seulement les régions que vous configurez |
| **Fraîcheur** | Mis en cache ; rafraîchissement par **TTL** ou **invalidation** | Réplique **quasi temps réel** des objets |
| **Idéal pour** | Contenu **statique** (ou cacheable) globalement | Schémas de lecture **dynamiques** ou **fortement cohérents** multi-région, moins de régions |

## Pattern pratique : S3 privé + CloudFront

- Créer un **bucket S3**, uploader des objets (**privés** — URL objet directe **403**, **Open** console utilise une URL **pré-signée**).
- Créer une **distribution CloudFront** ; choisir un **plan** (cours : **gratuit** suffisant pour les démos ; **pay-as-you-go** / paliers supérieurs pour plus de sécurité ou de fonctionnalités produit).
- Type d’origine **S3** ; activer **accès bucket privé** / **OAC** (réglages recommandés).
- Après déploiement, la **bucket policy** S3 montre souvent des **statements autorisant CloudFront** à `GetObject` (le service peut ajouter/mettre à jour automatiquement).
- Les viewers utilisent **`https://<domaine-distribution>/<clé-objet>`** (ex. `/coffee.jpg`, `/index.html`) — **pas d’ACL S3 publique** requise.

## Cache : TTL, politiques, invalidation

- Le **cache** vit à **chaque edge**. Objectif : **taux de hit** élevé → moins de hits origine.
- **TTL :** durée de validité d’un objet dans le cache (**0** à **~1 an**). Influencé par **`Cache-Control`** (ex. `max-age`) et **`Expires`** depuis l’origine ; les paramètres de comportement peuvent imposer **min / défaut / max** TTL quand les en-têtes manquent ou pour borner les valeurs.
- **Cache policies / réglages cache hérités :** incluent **quels en-têtes, cookies et query strings** entrent dans la **clé de cache** (plus de variantes → hit ratio plus bas).
- **`CreateInvalidation` :** forcer la suppression de chemins des caches edge (ex. `/index.html`, `/images/*`, ou `/*`) pour que la **prochaine** requête récupère l’origine **avant** expiration du TTL.

## Origin Shield

Sans Shield, **de nombreux edges** peuvent chacun **manquer** et **marteler** l’origine pour le même objet.

**Origin Shield** ajoute une **couche de cache régionale** entre edges et origine (« **cache pour votre cache** ») : le premier miss edge peut remplir Shield ; **d’autres edges** tirent depuis **Shield** au lieu de toujours frapper S3/ALB — **réduit la charge origine** et peut améliorer la **disponibilité** sous charge.

## Origines VPC vs origines publiques héritées

**Préféré (moderne) :** **origine VPC** — CloudFront atteint **ALB / NLB / EC2 privés** dans le VPC.

**Pattern hérité :** l’origine devait être **publique** ; vous autorisiez les **plages IP edge CloudFront** dans les **security groups** (fastidieux, erreurs si les plages changent ou SG mal configurés). Utile à reconnaître dans d’anciennes architectures.

## Restriction géographique

Restreindre les viewers par **pays** via une base **geo-IP** :

- **Liste autorisée** (pays approuvés uniquement) ou **liste de blocage** (pays bannis).
- Usage courant : **droits d’auteur** / licences.

La disponibilité console peut dépendre du **plan de distribution** / mode **billing** (cours : parfois **pay-as-you-go** requis pour l’UI geo).

## Journaux, rapports et monitoring

### Journalisation standard (S3)

- Journaux optionnels des **requêtes viewers** vers un **bucket S3** (souvent **séparé** du bucket de **contenu** origine) ; utiliser un **préfixe** par distribution.
- Peut aussi streamer vers **CloudWatch Logs** ou **Kinesis Data Firehose** pour des pipelines temps réel.
- Analyser avec **Athena** (comme d’autres journaux d’accès).

### Rapports intégrés (console)

**Statistiques de cache**, **objets populaires**, **top referrers**, **usage**, **viewers** — télémétrie **propre** à CloudFront ; vous **n’avez pas** à activer la journalisation S3 pour eux.

### Note dépannage

CloudFront peut **mettre en cache les réponses d’erreur HTTP** (**4xx**, **5xx**) de l’origine pendant une période — un mauvais **403/404/502** peut persister jusqu’au TTL ou **invalidation**.

### Métriques

Exemples : nombre de requêtes, octets vers viewers, **cache hit/miss**, **4xx/5xx**, latence origine — pour **exploitation** et **réglage**.

## Approfondissement : ingrédients de la clé de cache

Trois leviers (modes similaires : **aucun**, **liste blanche**, **tous**) :

1. **En-têtes**  
   - **Tout transférer** → effectivement **pas de cache** (TTL souvent **0**).  
   - **Liste blanche** → le cache varie selon ces valeurs d’en-tête.  
   - **Ne rien transférer** (sauf défauts) → **meilleur hit ratio** quand l’app n’a pas besoin des en-têtes viewer à l’origine.

2. **Cookies** (en pratique les paires clé/valeur de l’en-tête `Cookie`)  
   - Lister seulement les cookies qui **doivent** faire varier la réponse (ex. **A/B** ou **langue**).

3. **Query strings**  
   - Lister seulement les paramètres qui **doivent** affecter l’objet (ex. `size`, `version`).

### En-têtes personnalisés origine vs comportement de cache

- **En-têtes personnalisés origine :** définis sur l’**origine** dans CloudFront ; nom/valeur **constants** **ajoutés à chaque requête origine** (ex. secret partagé prouvant le trafic CloudFront). **Ne** font **pas** partie de la clé de cache.
- **Liste blanche d’en-têtes du comportement de cache :** **transférés** et partie des décisions de **mise en cache**.

### Maximiser les hits cache (style examen)

- Séparer les assets **statiques** (S3, peu/pas de cookies/query strings) de l’API/HTML **dynamique** qui a besoin d’en-têtes/cookies.
- Préférer **`Cache-Control: max-age`** depuis l’origine ; ajuster **min/défaut/max** TTL sur le comportement.
- Invalider après les **déploiements** quand le TTL est long.

## CloudFront + sessions persistantes ALB

La persistance ALB utilise un cookie (ex. **`AWSALB`**). Si CloudFront **ne transfère pas** ce cookie vers l’origine, la persistance **casse**.

**Correctif :** **liste blanche** du **cookie de persistance** dans le **comportement de cache** pour qu’il atteigne l’ALB. (Le cours mentionne de garder le TTL cache **plus court** que la durée de vie cookie auth/session comme hygiène — au-delà de nombreux items d’examen.)

## AWS Global Accelerator

**Problème :** des utilisateurs dans le monde frappent un point de terminaison **régional** via **Internet public** → nombreux sauts, latence, risque de perte de paquets.

### Unicast vs Anycast

- **Unicast :** une IP → un serveur.
- **Anycast :** la **même IP** annoncée depuis **plusieurs** emplacements ; le routage envoie le client au PoP **le plus proche**.

### Fonctionnement de Global Accelerator

- Provisionne **deux adresses IPv4 Anycast statiques** (globales) pour votre accelerator.
- Le trafic client entre au **edge le plus proche**, puis emprunte le **réseau global AWS** vers les **endpoints** dans une ou plusieurs régions (ALB, NLB, EC2, **EIP** — **public ou privé**).
- **Pas de cache** — les paquets sont **proxifiés** vers votre app.
- **Health checks** + **basculement régional rapide** (cours : **sous ~1 minute** vers un endpoint sain).
- Aide **DDoS** via **Shield** ; les clients n’ont qu’à autoriser **deux IP**.

### Global Accelerator vs CloudFront

| | **CloudFront** | **Global Accelerator** |
|---|----------------|------------------------|
| **Rôle principal** | **CDN HTTP(S)** — cache au edge | **Proxy TCP/UDP** — **pas** de cache |
| **Trafic** | Souvent servi **depuis le cache edge** | Toujours transmis vers les **endpoints régionaux** |
| **Idéal pour** | Assets statiques, nombreux scénarios cache HTTP ; certaines accélérations dynamiques | **Non-HTTP** (gaming, **IoT**, **VoIP**), entrée **IP statique** mondiale, **basculement** prévisible |
| **Commun** | Réseau **edge** / global AWS, intégration **Shield** | Même histoire réseau edge/global large |

### Récap pratique (cours)

Global Accelerator est une console **globale** (pas de sélecteur de région). Configurer un **listener** (ex. **TCP 80**), des **groupes d’endpoints** par région, des **endpoints** (EC2, ALB, NLB, EIP), des **health checks** (ex. **HTTP** `/`). La même IP Anycast depuis différents points géographiques route vers l’endpoint régional **sain le plus proche** (démo avec **VPN** pour illustrer routage US vs EU). **Nettoyage :** désactiver/supprimer l’accelerator, terminer les instances de test.

## Points clés

- **CDN** à l’examen → **CloudFront** ; edges **cache** pour **latence** et **échelle** ; **OAC + bucket policy** pour origines **S3 privées**.
- **Origines :** **S3**, **VPC** (ALB/NLB/EC2 privés), **HTTP personnalisé** ; préférer **origines VPC** à **origine publique + listes IP CloudFront** quand possible.
- **Cache :** équilibrer **TTL**, **clé de cache** (en-têtes/cookies/query strings) et **invalidations** ; **Origin Shield** réduit le fan-out **origine**.
- **Restriction geo** = listes **autoriser/bloquer** pays (plan/billing peut affecter les options console).
- **Journalisation** vers **S3** (bucket séparé) et streams optionnels ; les **rapports** console sont **indépendants** de l’activation des logs S3 ; les **erreurs peuvent être mises en cache**.
- **Persistance ALB** → **liste blanche** du **cookie de session** sur CloudFront.
- **Global Accelerator** = IP statiques **Anycast**, **pas de cache**, **TCP/UDP**, **health checks** et **basculement rapide** ; contraste avec le modèle **cache edge** de **CloudFront**.

---
*Traduit par Claude*
