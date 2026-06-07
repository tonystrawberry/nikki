---
title: "AWS Application Load Balancer (ALB) — approche approfondie"
date: "2026-03-21"
excerpt: "Load balancer HTTP layer 7 : target groups, règles de routage (path, host, query string, headers), headers X-Forwarded-*, support EC2, ECS, Lambda, IPs privées."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "alb", "load-balancer", "ec2", "ecs", "lambda", "microservices", "zcloudops", "cloud"]
---

## Aperçu

L'**Application Load Balancer (ALB)** est un load balancer **layer 7** qui ne fonctionne qu'avec HTTP. Il route le trafic vers plusieurs applications HTTP sur des machines regroupées en **target groups**. Un seul ALB peut servir plusieurs applications — contrairement au Classic Load Balancer, qui nécessite un CLB par application.

## Fonctionnalités de l'ALB

- Support **HTTP/2 et WebSocket**
- **Redirects** — ex. HTTP → HTTPS au niveau du load balancer
- **Règles de routage** — router vers différentes target groups selon :
  - **Path** — `example.com/users` vs `example.com/posts` → target groups différentes
  - **Host name** — `one.example.com` vs `other.example.com` → target groups différentes
  - **Query strings** — `?Platform=Mobile` vs `?Platform=Desktop`
  - **Headers**
- **Port mapping** — redirection vers des ports dynamiques sur ECS (utile pour les conteneurs)
- **Plusieurs apps par ALB** — adapté aux microservices et workloads containerisés

## Target groups

Les target groups sont les backends vers lesquels l'ALB route. Types supportés :

| Type de cible | Cas d'usage |
|---------------|-------------|
| **Instances EC2** | Souvent gérées par Auto Scaling Groups |
| **Tâches ECS** | Apps containerisées |
| **Fonctions Lambda** | Backend serverless |
| **Adresses IP privées** | Serveurs on-prem dans votre datacenter |

Les health checks sont configurés **par target group**.

## Exemple de routage

- Un ALB avec deux target groups :
  - Target group 1 : app user (route `/user`)
  - Target group 2 : app search (route `/search`)
- Règles : routage par path → `/user` → groupe 1, `/search` → groupe 2.

Autre exemple : routage par query string — `?Platform=Mobile` → target group EC2, `?Platform=Desktop` → target group IP privée on-prem.

## Headers X-Forwarded-*

L'ALB effectue la **terminaison de connexion**. L'instance EC2 voit l'IP privée du load balancer, pas celle du client. Les infos client sont transmises dans des headers :

- **X-Forwarded-For** — IP du client (ex. `12.34.56.78`)
- **X-Forwarded-Port** — port utilisé par le client
- **X-Forwarded-Proto** — protocole (HTTP ou HTTPS)

L'application doit lire ces headers pour obtenir l'IP, le port et le protocole d'origine du client.

## ALB vs Classic Load Balancer

| | ALB | Classic (CLB) |
|---|-----|----------------|
| Apps par LB | Plusieurs (via target groups) | Une par CLB |
| Routage | Path, host, query, headers | Limité |
| HTTP/2, WebSocket | Oui | Non |
| Port mapping dynamique | Oui (ECS) | Non |

## Points clés

- L'ALB est layer 7 uniquement (HTTP) ; l'utiliser pour web apps, microservices et conteneurs.
- Les target groups regroupent les backends ; les health checks sont par target group.
- Règles de routage : path, host, query string, headers.
- Utiliser **X-Forwarded-For**, **X-Forwarded-Port**, **X-Forwarded-Proto** pour récupérer les infos client côté app.
- L'ALB peut router vers EC2, ECS, Lambda et IPs privées (on-prem).

---
*Traduit par Claude*
