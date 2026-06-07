---
title: "Scalabilité et haute disponibilité expliquées"
date: "2026-03-21"
excerpt: "Aperçu accessible du scaling vertical vs horizontal et de la haute disponibilité, avec une analogie de centre d'appels et des exemples AWS (EC2, RDS Multi AZ, Auto Scaling)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "scalability", "high-availability", "ec2", "rds", "zcloudops", "cloud"]
---

## Aperçu

Un court exposé sur la **scalabilité** et la **haute disponibilité** — notions essentielles pour les architectures cloud et les certifications. Le contenu utilise une analogie de centre d'appels et des exemples AWS pour expliquer les différences entre scaling vertical et horizontal, et le rôle de la haute disponibilité.

## Scalabilité vs haute disponibilité

**Scalabilité** signifie que l'application ou le système peut absorber une charge plus importante en s'adaptant. C'est différent de (mais lié à) la **haute disponibilité**.

**Haute disponibilité** signifie que l'application tourne dans au moins deux datacenters ou zones de disponibilité pour survivre à la perte d'un datacenter.

## Scalabilité verticale (scale up)

- **Définition :** Augmenter la **taille** de l'instance (scale up ou down).
- **Analogie centre d'appels :** Un opérateur junior gère 5 appels/min ; un senior 10 appels/min. Scalabilité verticale = rendre un opérateur plus capable.
- **Exemple AWS :** EC2 — passer de `t2.micro` à `t2.large`. Tailles d'instances de `t2.nano` (0,5 Go RAM, 1 vCPU) à `u-12tb1.metal` (12,3 To RAM, 450 vCPUs).
- **Cas d'usage :** Courant pour les **systèmes non distribués** comme les bases (RDS, ElastiCache), où on scale en augmentant le type d'instance. Les limites hardware plafonnent le scaling vertical.

## Scalabilité horizontale (scale out / élasticité)

- **Définition :** Augmenter le **nombre** d'instances ou de systèmes.
- **Analogie centre d'appels :** Un opérateur est surchargé → embaucher un deuxième, puis un troisième, puis six. Capacité augmentée en ajoutant des opérateurs.
- **Termes AWS :** **Scale out** = ajouter des instances ; **scale in** = en retirer. Utilisé avec Auto Scaling Groups et load balancers.
- **Contrainte :** Implique des **systèmes distribués**. Toutes les applications ne peuvent pas être distribuées.
- **Usage typique :** Web apps et applications modernes. Le cloud (ex. EC2) facilite le scaling horizontal — lancer de nouvelles instances à la demande.

## Haute disponibilité (HA)

- **Définition :** Faire tourner la même application dans **au moins deux datacenters ou zones de disponibilité** pour survivre à une panne de datacenter.
- **Analogie centre d'appels :** Trois opérateurs à New York, trois à San Francisco. Si New York perd la connexion, San Francisco continue de prendre les appels.
- **HA passive :** Un actif, un standby (ex. RDS Multi AZ).
- **HA active :** Toutes les instances servent le trafic (ex. scaling horizontal sur plusieurs AZ).
- **AWS :** Auto Scaling Group ou load balancer avec **multi-AZ** activé.

## Points clés

- **Scaling vertical** = instance plus grande ; adapté aux systèmes non distribués comme les bases.
- **Scaling horizontal** = plus d'instances ; adapté aux systèmes distribués comme les web apps. Scale out = ajouter, scale in = retirer.
- **Haute disponibilité** = même charge sur plusieurs AZ (ou datacenters) pour survivre aux pannes.
- HA peut être passive (standby) ou active (tous les nœuds servent le trafic).

---
> 🌐 *Traduit par Claude*
