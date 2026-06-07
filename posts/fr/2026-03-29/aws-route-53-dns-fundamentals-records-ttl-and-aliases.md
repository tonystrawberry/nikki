---
title: "Amazon Route 53 : fondamentaux DNS, enregistrements, TTL et alias vs CNAME"
date: "2026-03-29"
excerpt: "Notes CloudOps sur la résolution DNS et la terminologie, Route 53 en DNS faisant autorité et bureau d’enregistrement, enregistrements A/AAAA/CNAME/NS, email (MX, TXT/SPF/DKIM/DMARC), compromis TTL, et enregistrements alias Route 53 pour ALB et apex de zone."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "route-53", "dns", "alias", "cname", "ttl", "mx", "spf", "dkim", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 15
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Le **DNS** et **Amazon Route 53** sont au cœur du **routage des utilisateurs** vers les **applications** sur AWS. Cette note couvre le **fonctionnement du DNS** à haut niveau, les capacités de **Route 53** (y compris la revendication de **SLA 100 %**), les **types d’enregistrements** à connaître, le comportement du **TTL**, les enregistrements **mail**, et la distinction critique **CNAME vs alias Route 53** pour les **load balancers** et l’**apex de zone**.

## Fondamentaux DNS

### Rôle du DNS

Le **Domain Name System (DNS)** associe des **noms d’hôte lisibles** (ex. `www.example.com`) à des **adresses IP** (ou autres cibles) pour que navigateurs et API atteignent les serveurs. C’est l’**épine dorsale mondiale** de la résolution de noms sur Internet.

### Terminologie

| Terme | Signification |
|------|--------|
| **Bureau d’enregistrement (registrar)** | Où vous **achetez/enregistrez** un domaine (ex. **Route 53**, **GoDaddy**, autres). |
| **Enregistrements DNS** | Lignes individuelles dans une zone (types **A**, **AAAA**, **CNAME**, **NS**, **MX**, **TXT**, …). |
| **Fichier de zone** | Ensemble des **enregistrements** d’une zone DNS (**source de vérité** pour cette zone sur les serveurs faisant autorité). |
| **Serveurs de noms** | Serveurs qui **répondent** aux **requêtes** DNS (résolveurs récursifs parcourent l’arbre ; les serveurs **faisant autorité** détiennent les données de zone). |
| **TLD** (domaine de premier niveau) | **`.com`**, **`.org`**, **`.gov`**, codes pays, etc. |
| **Domaine de second niveau** | ex. **`example.com`** (deux étiquettes avant le suffixe public dans l’exemple pédagogique courant). |
| **Sous-domaine** | ex. **`www.example.com`**, **`api.example.com`**. |
| **FQDN** | Nom d’hôte complet tel que **`api.www.example.com`**. |
| **URL** | Combine le **schéma** (**`https://`**), l’**hôte**, le **chemin**, etc. |

La **racine** de l’arbre DNS est **implicite** (souvent représentée par un **`.`** final dans les schémas techniques).

### Résolution récursive (conceptuelle)

Quand un client demande **`example.com`** :

1. Le **stub resolver** (souvent via un serveur DNS **récursif** **local / FAI / entreprise**) interroge les serveurs DNS **racine**.
2. La **racine** pointe vers les serveurs de noms **TLD** pour **`.com`** (enregistrements **NS**).
3. Les serveurs **TLD** pointent vers les serveurs **faisant autorité** pour **`example.com`** (**NS** chez le registrar / hébergeur DNS).
4. Le serveur **faisant autorité** renvoie la réponse finale (ex. enregistrement **A** → **IPv4**).

Les **résolveurs mettent en cache** les réponses pour la durée du **TTL** (voir ci-dessous) afin de ne pas interroger toute la chaîne faisant autorité à chaque fois.

## Vue d’ensemble Amazon Route 53

- Service DNS **hautement disponible**, **évolutif**, **entièrement managé**.
- **DNS faisant autorité :** **vous** définissez les **hosted zones** et les **enregistrements** ; Route 53 répond **en faisant autorité** pour ces zones.
- **Bureau d’enregistrement :** vous pouvez **enregistrer** des domaines dans Route 53 (frais annuels, **renouvellement auto** recommandé si vous gardez le nom).
- Les **health checks** peuvent être liés au routage (sujets Route 53 plus avancés).
- **Nom :** **Route 53** fait référence au **port UDP/TCP 53**, port **DNS** traditionnel.
- **SLA :** le cours indique que Route 53 est le **seul** service AWS avec un **SLA de disponibilité à 100 %** — vérifier les **contrats de niveau de service** AWS actuels pour la formulation exacte.

### Hosted zone et flux d’enregistrement

Après **enregistrement** d’un domaine (ou **délégation** des **NS** vers Route 53), vous obtenez une **hosted zone** contenant au minimum :

- Enregistrements **NS** — **quels serveurs de noms** font autorité (les serveurs de noms **Route 53** pour votre zone).
- **SOA** (start of authority) — **métadonnées** de zone (serial, timers de rafraîchissement, etc.).

La **source de vérité** pour vos **enregistrements** est ce que vous configurez **dans cette hosted zone** dans Route 53.

### Anatomie d’un enregistrement (Route 53)

Chaque enregistrement inclut typiquement :

- **Nom** (nom d’hôte / sous-domaine dans la zone, ou **apex** / racine de la zone).
- **Type** (**A**, **AAAA**, **CNAME**, …).
- **Valeur** (IP, nom d’hôte ou texte structuré selon le type).
- **Politique de routage** (simple, pondérée, latence, basculement, géolocalisation, etc. — sujets avancés).
- **TTL** — durée de vie pour le **cache** (sauf enregistrements **alias**, ci-dessous).

## Types d’enregistrements essentiels (examen)

- **A** — nom d’hôte → adresse **IPv4**.
- **AAAA** — nom d’hôte → adresse **IPv6**.
- **CNAME** — nom d’hôte → **un autre** nom d’hôte (nom canonique). **Ne peut pas** être utilisé à l’**apex de zone** pour un CNAME standard (contrainte DNS RFC — **CNAME à l’apex** invalide en DNS classique).
- **NS** — délègue des **sous-domaines** ou pointe vers les serveurs **faisant autorité** pour la zone.
- **SOA** — métadonnées d’**autorité** de zone (présent dans les hosted zones).

D’autres types **avancés** existent (**SRV**, **PTR**, **CAA**, etc.) — au niveau associate, rester sur la liste ci-dessus plus le mail.

## Enregistrements liés au mail (MX et TXT)

Pas besoin de **mémoriser** toute la stack mail, mais il faut les **reconnaître** à l’examen :

| Enregistrement | Rôle |
|--------|--------|
| **MX** | **Échange mail** — où livrer le courrier **entrant** pour le domaine (priorité + hôte cible). |
| **TXT** | Texte arbitraire ; utilisé pour **vérification**, **SPF**, publication **DKIM**, **DMARC**, etc. |

Schémas courants :

- **SPF** (Sender Policy Framework) — publié en **TXT** ; liste les **serveurs** autorisés à **envoyer** du mail pour votre domaine.
- **DKIM** — souvent publié en **CNAME** (ex. **SES** fournit **trois** **CNAME** pour les clés **sélecteur**) pour la signature **cryptographique** ; certains setups utilisent **TXT**.
- **DMARC** — **TXT** sous **`_dmarc.domain`** définissant la **politique** en cas d’échec **SPF**/**DKIM**.

Flux **Amazon SES** (haut niveau) : **vérifier** le domaine → ajouter **TXT** de **vérification** → ajouter les **CNAME** **DKIM** → **SPF** (et **MX** si réception via SES) → attendre la **propagation DNS** → domaine **vérifié**. La console peut **créer les enregistrements dans Route 53** pour vous.

**Pattern d’examen :** **MX** = **réception** ; **SPF**/**DKIM**/**DMARC** pour l’**envoi** et la **confiance** — le contenu **SPF**/**DKIM** vit souvent en **TXT** (et les clés **DKIM** en **CNAME** dans le modèle SES).

## TTL (time to live)

- Le **TTL** indique aux **résolveurs et clients** combien de temps ils **peuvent mettre en cache** la **réponse** (ex. **300** secondes).
- **TTL élevé** (ex. **24 h**) : **moins** de requêtes → **coût** Route 53 **plus bas**, mais **convergence** plus **lente** après changement d’enregistrement (anciennes IP **restent** en cache jusqu’à **expiration** du TTL).
- **TTL faible** (ex. **60** s) : mises à jour **plus rapides** après changement, mais **plus** de requêtes et **coût par requête** **plus élevé**.

**Stratégie de migration :** avant un changement **planifié** d’IP ou d’endpoint, **abaisser** le TTL **à l’avance** (ex. **24 h** avant) pour que la plupart des caches adoptent le **court** TTL ; effectuer la **bascule** ; puis **remonter** le TTL une fois stable.

Le **TTL est obligatoire** sur les enregistrements normaux. Les enregistrements **alias Route 53** ne permettent **pas** de régler le TTL manuellement — **Route 53** l’assigne (voir ci-dessous).

Vérifier la sortie **`dig`** / **`nslookup`** en lab : le **TTL** **décompte** sur les réponses **mises en cache**.

## CNAME vs enregistrements alias Route 53

### CNAME

- Associe **un nom d’hôte** à **un autre** nom d’hôte (cible **FQDN** quelconque, pas seulement AWS).
- **Valide** pour des **sous-domaines** comme **`app.example.com`**.
- **Invalide** à l’**apex de zone** **`example.com`** en DNS standard — l’erreur console **« CNAME not permitted at apex »** reflète cela.

### Alias (extension Route 53)

- Extension **spécifique AWS** : alias **A** ou **AAAA** ciblant des **ressources AWS prises en charge** par **nom d’hôte** (ex. nom DNS **ELB**, distribution **CloudFront**, **API Gateway**, **Elastic Beanstalk**, endpoint **site web S3**, endpoint d’**interface VPC**, **Global Accelerator**, autre **enregistrement** dans la même zone, …).
- Fonctionne pour l’**apex** **et** les **sous-domaines** — **résout** le routage **apex** vers **ALB**/**CloudFront** là où le **CNAME** ne peut pas.
- **Pas de frais de requête séparés** pour les requêtes vers les alias **A/AAAA** pointant vers des cibles **AWS** dans le **scénario tarifaire** standard (confirmer [Route 53 pricing](https://aws.amazon.com/route53/pricing/) pour les règles actuelles).
- **Évaluation de santé :** alias vers **ELB** peut être lié à la **santé des cibles** (ex. **evaluate target health** dans la console).
- **Changement d’IP sous-jacent** (ex. nœuds de **load balancer**) : l’alias **suit** l’**endpoint** **AWS** — vous ne mettez **pas** les IP à jour manuellement.

**Limite importante :** vous **ne pouvez pas** créer un **alias** vers le **nom DNS public EC2** comme cible alias de première classe comme pour un **ELB** — utiliser un **A** vers **IP**, ou mettre un **ALB**/**CloudFront** devant, etc.

### Pattern d’examen

- Nom **convivial** → **ALB**/**CloudFront** → préférer **alias** **A**/**AAAA** pour l’**apex** **`example.com`** et l’intégration **AWS** native.
- **Sous-domaine** → nom d’hôte **externe** : **CNAME** convient.

## Contexte de lab optionnel (EC2 multi-Région + ALB)

En formation on déploie souvent des instances **EC2** dans **plusieurs Régions** avec un petit serveur **user-data**, plus un **Application Load Balancer** dans **une** Région, puis des enregistrements Route 53 **A**/**CNAME**/**alias** vers des **IP d’instance** ou le nom DNS de l’**ALB** pour **observer** **TTL** et comportement de **routage**.

## Points clés à retenir

- Le **DNS** résout **noms** → **IP** via un système **hiérarchique** (**racine** → **TLD** → **faisant autorité**) ; les **résolveurs mettent en cache** avec le **TTL**.
- **Route 53** = DNS **faisant autorité** + **registrar** + options de routage **sensibles à la santé** ; le **nom** évoque le **port 53** ; connaître la revendication **SLA 100 %** du cours.
- **A**/**AAAA** = mappage **IP** direct ; **CNAME** = chaîne de **noms d’hôte** ; **NS**/**SOA** = **délégation** et métadonnées de **zone**.
- **MX** = courrier **entrant** ; **TXT**/**SPF**/**DKIM**/**DMARC** = **envoi** et schémas de **vérification** de domaine.
- Le **TTL** arbitre **coût**/**volume de requêtes** vs **rapidité de propagation** après changement ; **abaisser** le TTL **avant** les **migrations**.
- Le **CNAME** **ne peut pas** être à l’**apex de zone** ; l’**alias Route 53** **A**/**AAAA** **peut**, cible des **ressources** **AWS**, **pas** de TTL manuel, **suit** les endpoints **ELB**/**CloudFront**, **pas** un alias générique vers le **nom DNS EC2**.

*Suivant : [Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow](/fr/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow).*

---
*Traduit par Claude*
