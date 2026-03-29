---
title: "Amazon Route 53 : politiques de routage, health checks et Traffic Flow"
date: "2026-03-29"
excerpt: "Notes CloudOps sur les politiques de routage Route 53 (simple, pondérée, latence, basculement, géolocalisation, géoproximité, multi-valeur, basée sur l’IP), health checks et checks calculés, CloudWatch pour cibles privées, et politiques Traffic Flow."
author: "Tony Duong"
category: "note"
tags: ["aws", "route-53", "dns", "health-check", "failover", "latency-routing", "geolocation", "traffic-flow", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 16
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Les **politiques de routage** dans **Route 53** contrôlent **quelle réponse** le **service DNS** renvoie aux clients. Elles **ne font pas** de proxy : le **DNS ne répond qu’aux requêtes** ; le **client** ouvre ensuite des connexions **HTTP/TCP** vers les **IP ou noms d’hôte** de la réponse. Ce n’est **pas** un **Application Load Balancer** qui route vers des cibles backend.

**Prérequis :** enregistrements, **TTL** et **alias vs CNAME** → **[Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME](/fr/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases)**.

## Routage simple

- Politique **par défaut** : en général **une** cible (ex. une valeur d’enregistrement **A**).
- Vous **pouvez** mettre **plusieurs** **IPv4**/**IPv6** **dans le même** enregistrement simple ; les résolveurs peuvent renvoyer **plusieurs** adresses et le **client** en choisit une (souvent décrit comme **aléatoire** en formation).
- **Alias** + **simple :** une seule cible **AWS** (ex. un **ALB**).
- **Pas** de **health checks Route 53** sur le routage **simple** (dans le modèle du cours).

## Routage pondéré

- **Plusieurs enregistrements** avec le **même** **nom** et **type** ; chacun a un **poids** (entier relatif).
- **Part du trafic** pour chaque enregistrement ≈ **poids / somme(poids)** sur ces enregistrements — les poids **ne doivent pas** totaliser **100**.
- **Cas d’usage :** **répartir** le trafic entre Régions, **canary** d’une nouvelle version (**petit** poids), **bascule progressive**, **vider** une cible en mettant le poids à **0** (cours : si **tous** les poids sont **0**, comportement possible de **répartition égale** — confirmer la doc actuelle).
- **Health checks** **optionnels** par enregistrement pondéré (quand les health checks sont activés ailleurs dans la conception).

## Routage basé sur la latence

- Route 53 renvoie **l’unique** enregistrement dont la **Région AWS** (pour cet enregistrement) a la **latence mesurée la plus faible** depuis le **résolveur DNS** qui pose la question — **pas** « le chemin le plus court sur une carte » ; c’est la vue **latence AWS** pour l’association **Région** de cet enregistrement.
- Pour une **IP nue** (ex. IP publique **EC2**), vous **devez** **indiquer la Région** pour l’enregistrement (Route 53 **ne déduit pas** la Région depuis l’IP).
- **Health checks** **optionnels** ; les enregistrements **unhealthy** peuvent être ignorés si configuré.
- **Tests :** emplacement du **navigateur** vs **`dig`** dans **CloudShell** (résolveur dans une autre Région) vs pays de sortie **VPN** — montreront des Régions « les plus proches » **différentes** — le cache **TTL** compte lors d’un changement de VPN.

## Routage basculement (failover)

- Enregistrements **primaire** et **secondaire** (style actif/passif) pour le **même** nom.
- Le **primaire** **doit** être associé à un **health check** (obligatoire dans le flux de formation).
- Si le **primaire** est **unhealthy**, les réponses **basculent** vers le **secondaire** (qui peut optionnellement avoir son propre health check).
- **Cas d’usage :** **PRA** ou endpoint de secours quand le **primaire** échoue aux **health checks**.

## Routage géolocalisation

- Route d’après la **localisation géographique** de l’utilisateur final (**continent**, **pays**, **État U.S.** dans les cas pris en charge) — **pas** la même chose que le routage **basé sur la latence** (qui est « **Région AWS** la plus proche » du point de vue du résolveur).
- Les règles **plus précises** l’emportent (ex. **État** sur **pays** sur **continent**).
- Vous **devriez** définir un enregistrement géolocalisation **par défaut** pour les **emplacements qui ne matchent rien d’autre** (ex. « reste du monde » → site anglais).
- **Cas d’usage :** **localisation**, **conformité** / restrictions de **contenu**, **diriger** vers des stacks **régionales** appropriées.
- **Health checks** **optionnels**.

## Routage géoproximité

- Combine **géographie** utilisateur et **ressource** avec une valeur de **biais** pour **décaler** quel endpoint « gagne » pour un utilisateur donné.
- Les **ressources** peuvent être des **Régions AWS** (liste) ou des emplacements **non-AWS** via **latitude/longitude** (ex. **on-premises**).
- **Biais positif** « agrandit » la préférence vers cette ressource ; **biais négatif** la réduit — pour **orienter** le trafic (ex. **vider** ou **préférer** une Région) sans renommer le DNS.
- **Route 53 Traffic Flow** (éditeur visuel) sert à configurer la **géoproximité** avec **biais** et **cartes** dans le récit console.

## Routage multi-valeur

- **Objectif :** renvoyer des **réponses** pour **plusieurs** **ressources** sous le **même** nom DNS — **répartition côté client** : le **résolveur** renvoie **plusieurs** valeurs **A**/**AAAA** et le **client** en choisit **une** (contrairement à un **ELB** qui **proxy** le trafic — le **multi-valeur** ne **remplace pas** un **ELB**).
- Jusqu’à **huit** réponses **healthy** par requête dans le récit de formation quand des **health checks** sont attachés — les cibles **unhealthy** sont **retirées** de l’ensemble de réponses.
- **Chaque** enregistrement multi-valeur est sa **propre** ligne (même **nom**/type) avec **une** IP et un **health check** **optionnel** — différent du routage **simple** où **plusieurs IP** sont **dans un seul** enregistrement **sans** health checks (donc une réponse **simple** multi-IP **peut** inclure des backends **morts**).
- **Astuce lab :** **Invert health check status** dans la console **inverse** temporairement healthy/unhealthy pour **simuler** une panne sans changer les **security groups**.

## Routage basé sur l’IP

- Fait correspondre l’**IP source du client** (telle que vue par Route 53 pour la requête) à des blocs **CIDR** que vous définissez, et renvoie l’**endpoint** correspondant.
- **Cas d’usage :** orienter des plages **FAI** / **entreprise** **connues**, optimiser **coût** ou **performance** quand les réseaux **clients** sont **prévisibles**.

## Health checks Route 53

### À quoi ils servent

Les **health checks** permettent à Route 53 de **cesser** de renvoyer des cibles **unhealthy** dans les scénarios **pondérés**, **latence**, **basculement**, **géolocalisation**, **géoproximité** et **multi-valeur** (quand pris en charge).

### Health checks d’endpoint (public)

- Les **cibles** doivent être **joignables depuis Internet public** (ex. **ALB**, IP publique **EC2**, nom d’hôte résolvant vers des endpoints publics).
- **Nombreux** nœuds **globaux** de health check (cours **~15**) sonde l’endpoint.
- **Protocoles :** **HTTP**, **HTTPS**, **TCP** (et options console).
- **Healthy** si assez de sondeurs rapportent le succès — le cours cite **> 18 %** des sondeurs **healthy** comme seuil « endpoint healthy » (confirmer la **documentation** pour les règles exactes).
- **Intervalle :** **standard** (ex. **30** s) vs **rapide** (**10** s, **coût plus élevé**).
- **Succès :** en général **2xx** ou **3xx** pour HTTP(S) ; correspondance de **chaîne** optionnelle dans les **5 120 premiers octets** du corps de réponse.
- **Security groups / NACLs / pare-feu :** vous **devez** autoriser le **trafic entrant** depuis les **plages IP des health checkers Route 53** (publiées par AWS) vers le **port** et le **chemin** testés.

### Health checks calculés

- Un health check **parent** agrège des health checks **enfants** avec des règles **logiques** (**AND** / **OR** / **NOT**), ex. « healthy si **au moins N** sur **M** enfants passent ».
- Le cours mentionne jusqu’à **256** checks enfants — confirmer les **quotas**.

### Endpoints privés ou inaccessibles

- Les sondeurs **publics** ne peuvent **pas** joindre directement des endpoints **RFC1918** **VPC-only**.
- **Schéma :** émettre des métriques depuis la **ressource privée** (ex. agent **CloudWatch**, **métrique custom**), attacher une **alarme CloudWatch**, et créer un health check qui **suit l’état de l’alarme** — **alarme = unhealthy** bascule le DNS hors de ce chemin.

### Observabilité

- Les health checks exposent des **métriques CloudWatch** (et **alarmes** / **SNS** optionnels en cas d’échec dans la console).

## Traffic Flow (policies)

- **Éditeur** **visuel** pour des arbres **complexes** : **pondéré**, **basculement**, **latence**, **géolocalisation**, **multi-valeur**, **géoproximité**, règles imbriquées, endpoints.
- Les politiques sont **versionnées** et peuvent être **appliquées** aux **hosted zones** comme **policy records**.
- **Tarification :** le cours signale un **coût mensuel important** pour les **Traffic Flow policy records** (ex. **~50 $/mois** par policy record en démo — **vérifier** la **[tarification Route 53](https://aws.amazon.com/route53/pricing/)** actuelle) ; supprimer les politiques de test pour éviter les frais.
- Les enregistrements créés depuis Traffic Flow **renvoient** souvent vers la **politique** pour les modifications plutôt que d’être de simples lignes statiques.

## Points clés à retenir

- **« Politique de routage »** = **sélection de la réponse DNS** — **aucun** trafic ne traverse Route 53 comme un proxy.
- **Simple :** une cible (ou multi-IP **aléatoire** côté client) ; alias simple = **une** cible **AWS** ; **pas** de health checks dans l’histoire de base.
- **Pondéré :** poids **relatifs** → trafic **proportionnel** ; poids **0** pour **vider** ; health checks optionnels.
- **Latence :** **latence la plus faible** vers la **Région AWS déclarée** par enregistrement ; **définir la Région** pour les **IP** brutes ; tester avec **VPN** / emplacement du **résolveur**.
- **Basculement :** **primaire** + **secondaire** ; le **primaire** **exige** un **health check** dans le récit du lab.
- **Géolocalisation :** matcher la **localisation** **utilisateur** (pays/continent/…) ; ajouter un **défaut** ; pas la même chose que la **latence**.
- **Géoproximité :** le **biais** déplace la **préférence** entre **Régions** ou endpoints **lat/long** ; **Traffic Flow** pour les **configurations avancées**.
- **Multi-valeur :** jusqu’à **~8** **IP** **healthy** par réponse ; le **client** choisit ; **pas** un **ELB** ; bat le multi-IP **simple** sur la **prise en compte de la santé**.
- **Basé sur l’IP :** router par **CIDR** **client**.
- **Health checks :** endpoints **publics** + liste autorisée **SG** pour les IP des **checkers** ; **calculés** pour les combinaisons **booléennes** ; health checks **alarme CloudWatch** pour les charges **privées**.

*Précédent : [Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME](/fr/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases). Suivant : [Amazon Route 53: Registrar Delegation, Resolver, Logging, and Governance](/fr/posts/aws-route-53-delegation-resolver-logging-firewall-arc-profiles).*

---
*Traduit par Claude*
