---
title: "Démo pratique : AWS Application Load Balancer"
date: "2026-03-21"
excerpt: "Pas à pas : lancer des instances EC2, créer un ALB avec target group, vérifier le load balancing et les health checks (stop/start d'instance)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "alb", "load-balancer", "ec2", "target-group", "health-check", "zcloudops", "cloud"]
---

## Aperçu

Un tutoriel pratique pour créer un **Application Load Balancer (ALB)** devant deux instances EC2, avec une target group et des health checks. La démo montre le load balancing en action et la réaction de l'ALB quand une instance est arrêtée.

## Étape 1 : Lancer les instances EC2

- Lancer **2 instances** (ex. `My First Instance`, `My Second Instance`)
- **AMI :** Amazon Linux 2
- **Type d'instance :** t2.micro
- **Paire de clés :** Aucune (utiliser EC2 Instance Connect si SSH nécessaire)
- **Security group :** Autoriser HTTP (80) et SSH (22), ex. Launch Wizard 1
- **User data :** Script pour lancer un serveur HTTP simple qui renvoie « hello world from my instance » (l'ID d'instance varie)

Après le lancement, tester chaque IP publique pour confirmer que les deux servent « hello world » avec des identifiants d'instance différents. Deux instances → deux IPs ; l'objectif est une seule URL qui équilibre entre les deux.

## Étape 2 : Créer l'Application Load Balancer

- **Nom :** DemoALB (ou similaire)
- **Schéma :** Internet-facing
- **IP :** IPv4
- **Network mapping :** Déployer dans toutes les AZ disponibles
- **Security group :** Nouveau SG (ex. `demo-sg-load-balancer`) autorisant **HTTP (80) depuis 0.0.0.0/0**

### Types de load balancers (référence)

| Type | Cas d'usage |
|------|-------------|
| **ALB** | HTTP/HTTPS, web apps |
| **NLB** | TCP/UDP, TLS, très haut débit et faible latence |
| **GWLB** | Appliances de sécurité, intrusion detection, firewalls |
| **CLB** | Déprécié ; éviter pour les nouvelles charges |

## Étape 3 : Target group et listener

1. **Target group :**
   - Type : Instances
   - Nom : `demo-tg-alb`
   - Protocole : HTTP, port 80
   - Enregistrer les deux instances EC2 sur le port 80
   - Créer la target group

2. **Listener :**
   - HTTP:80 → forward vers `demo-tg-alb`

3. Créer le load balancer.

## Étape 4 : Vérifier le load balancing

- Copier le nom DNS de l'ALB et l'ouvrir dans un navigateur.
- Réponse « hello world ».
- **Rafraîchir plusieurs fois :** l'ID d'instance dans la réponse change, montrant que le trafic est réparti entre les deux instances (comportement round-robin).

## Étape 5 : Health checks en pratique

- Ouvrir la target group → **Targets**. Les deux instances sont **Healthy**.
- **Arrêter** une instance EC2.
- Après ~30 s, cette instance apparaît **Unhealthy** dans la target group.
- Rafraîchir l'URL de l'ALB : le trafic ne va plus que vers l'instance encore en marche.
- **Démarrer** à nouveau l'instance arrêtée ; après le boot, elle redevient **Healthy**.
- En rafraîchissant l'URL de l'ALB, on voit à nouveau les réponses des deux instances.

## Points clés

- ALB + target group = une URL pour plusieurs instances.
- Les health checks coupent le trafic vers les cibles unhealthy automatiquement.
- Arrêter une instance la rend unhealthy ; l'ALB contourne cette cible.
- Utiliser ALB pour HTTP/HTTPS ; NLB pour TCP/UDP et performance ; GWLB pour appliances de sécurité.

---
*Traduit par Claude*
