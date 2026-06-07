---
title: "AWS Elastic Load Balancer (ELB) expliqué"
date: "2026-03-21"
excerpt: "Vue d'ensemble des load balancers AWS : rôle, avantages, health checks, quatre types (CLB, ALB, NLB, GWLB) et règles de security group."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "load-balancer", "elb", "alb", "nlb", "gwlb", "ec2", "zcloudops", "cloud"]
---

## Aperçu

Un **load balancer** est un serveur (ou un ensemble) qui transfère le trafic entrant vers plusieurs instances EC2 backend (downstream). Les utilisateurs se connectent à un seul endpoint (le load balancer) et ne savent pas quelle instance backend traite leur requête. La charge est répartie entre les instances à mesure que les utilisateurs se connectent.

## Pourquoi utiliser un load balancer ?

- **Point d'accès unique** — les utilisateurs se connectent à un endpoint ; la topologie backend est masquée.
- **Gestion transparente des pannes** — les health checks détectent les instances en panne ; le trafic ne leur est pas envoyé.
- **Health checks** — vérifier les instances downstream avant de router le trafic.
- **SSL termination** — décodage HTTPS au niveau du load balancer.
- **Stickiness** — utiliser des cookies pour router un utilisateur vers la même instance à chaque requête.
- **Haute disponibilité multi-zones** — répartir le trafic sur les AZ.
- **Séparer trafic public et privé** — load balancers internes vs externes.

## Elastic Load Balancer (ELB) — géré par AWS

- AWS gère le load balancer : mises à jour, maintenance, haute disponibilité.
- Moins cher et plus simple qu'un load balancer auto-géré ; la scalabilité est incluse.
- **Intégrations :** EC2, Auto Scaling Groups, ECS, Certificate Manager, CloudWatch, Route 53, WAF, Global Accelerator.

## Health checks

- L'ELB vérifie la santé des instances via un **port** et une **route** (ex. HTTP sur port 4567, chemin `/health`).
- Si l'instance ne répond pas OK (généralement HTTP 200), elle est marquée **unhealthy** et ne reçoit plus de trafic.
- Les health checks sont essentiels pour éviter les instances en panne.

## Quatre types de load balancers AWS

| Type | Abrév. | Année | Protocoles | Cas d'usage |
|------|--------|-------|------------|-------------|
| **Classic** | CLB | 2009 (V1) | HTTP, HTTPS, TCP, SSL, Security CP | Déprécié ; encore dispo mais non recommandé |
| **Application** | ALB | 2016 | HTTP, HTTPS, WebSocket | Apps web, routage layer 7 |
| **Network** | NLB | 2017 | TCP, TLS, Security CP, UDP | Faible latence, layer 4, performances extrêmes |
| **Gateway** | GWLB | 2020 | IP (couche réseau) | Appliances tierces, sécurité/VA |

- Préférer **ALB** et **NLB** (et GWLB si pertinent) à Classic.
- Les load balancers peuvent être **internes** (privés) ou **externes** (publics).

## Security groups

- **SG du load balancer :** Autoriser HTTP (80) et HTTPS (443) en entrée depuis `0.0.0.0/0` pour que les utilisateurs puissent l'atteindre.
- **SG des EC2 :** Autoriser HTTP (80) et HTTPS (443) depuis le **security group du load balancer**, pas depuis des plages IP arbitraires.
- Ainsi, seul le trafic venant du load balancer atteint les instances EC2, améliorant la sécurité.

## Points clés

- Les load balancers répartissent le trafic entre instances downstream et masquent la topologie backend.
- L'ELB est entièrement géré ; l'utiliser plutôt que des solutions auto-gérées.
- Les health checks évitent d'envoyer du trafic aux instances en panne.
- Utiliser ALB pour HTTP/HTTPS et WebSocket ; NLB pour TCP/UDP et faible latence ; éviter Classic.
- Lier les security groups des EC2 au SG du load balancer pour que seul le trafic du LB atteigne les instances.

---
> 🌐 *Traduit par Claude*
