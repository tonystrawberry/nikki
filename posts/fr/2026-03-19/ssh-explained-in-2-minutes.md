---
title: "SSH expliqué en 2 minutes !"
date: "2026-03-19"
excerpt: "Courte vidéo sur SSH (Secure Shell) : protocole d'accès distant sécurisé, canal chiffré, modèle client/serveur, et authentification par mot de passe vs clé."
author: "Tony Duong"
category: "note"
tags: ["ssh", "devops", "security", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=P0Fk-K2eZF8"
---

## Aperçu

SSH (Secure Shell) est l'un des outils essentiels pour toute personne travaillant avec des serveurs distants — surtout pour gérer sa propre infra ou déployer des applications. Cette courte vidéo explique ce qu'est SSH et comment ça fonctionne.

## Qu'est-ce que SSH ?

- **SSH** est un **protocole** pour se connecter à un ordinateur distant de façon sécurisée.
- La connexion s'établit sur un **canal chiffré**, donc toutes les données entre votre machine et le serveur distant sont protégées contre l'écoute ou l'interception.
- SSH sert à : **accès en ligne de commande distant**, **transferts de fichiers** et **tunneling de trafic**. Très utilisé par les admins et les devs pour maintenance, déploiement et dépannage.

## Composants

- **Client SSH** — la machine depuis laquelle on lance la connexion (votre machine locale).
- **Serveur SSH** — la machine distante à laquelle on se connecte.

## Authentification

Deux méthodes principales :

1. **Authentification par mot de passe** — entrer identifiant et mot de passe pour accéder au serveur distant. Méthode la plus simple mais pas la plus sûre, car les mots de passe peuvent être interceptés.

2. **Authentification par clé SSH** — utilise une **paire de clés publique/privée** :
   - Le client génère une paire de clés SSH sur sa machine (clé publique + clé privée).
   - La **clé privée** reste sur la machine du client ; la **clé publique** peut être partagée avec le serveur.
   - Lors de la connexion, le serveur vérifie si la clé publique du client est autorisée. Si oui, il envoie un **challenge chiffré** (chaîne aléatoire) au client.
   - Le client utilise sa **clé privée** pour déchiffrer le challenge et renvoie la réponse. Le serveur vérifie avec la clé publique ; si la réponse correspond, le client est authentifié.
   - Une fois authentifié, une **session SSH chiffrée** est établie — l'utilisateur peut exécuter des commandes ou transférer des fichiers en toute sécurité.

## Points clés

- SSH fournit un accès chiffré et sécurisé aux machines distantes.
- Préférer l'**authentification par clé SSH** aux mots de passe pour plus de sécurité.
- Modèle client/serveur : votre machine = client, machine distante = serveur.

---
*Traduit par Claude*
