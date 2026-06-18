---
title: "Entretien System Design débutant : Design Bitly w/ a Ex-Meta Staff Engineer"
date: "2026-06-17"
excerpt: "Walkthrough débutant Hello Interview pour concevoir Bitly — exigences, entités, API, compteur vs hash pour les codes courts, base62, redirections 301 vs 302, séparation read/write, cache Redis et CAP."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "bitly", "url-shortener", "interview", "distributed-systems", "redis", "caching"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=iUU4O1sWtJA"
---

Notes de Hello Interview (Evan, ex-staff engineer Meta) sur **la conception d'un raccourcisseur d'URL type Bitly** — présenté comme la question classique de **system design pour débutants**, avec des concepts expliqués plus lentement que dans leurs vidéos avancées.

## Roadmap de l'entretien

1. **Exigences** (fonctionnelles + non fonctionnelles)
2. **Entités principales**
3. **API**
4. **Design de haut niveau** (satisfaire les exigences fonctionnelles)
5. **Deep dives** (satisfaire les exigences non fonctionnelles)

Ignorer le **data flow** pour les designs produit orientés utilisateur (réserver ça aux questions infra comme rate limiter ou message queue).

Les calculs back-of-envelope en amont sont optionnels — estimer seulement quand les chiffres **changent le design**.

## Ce que fait le système

Un raccourcisseur d'URL convertit les URLs longues en courtes ; visiter l'URL courte **redirige** vers l'originale.

## Exigences fonctionnelles

- Les utilisateurs peuvent **créer une URL courte** à partir d'une URL longue
- Les utilisateurs peuvent être **redirigés** vers l'URL originale depuis l'URL courte

Extensions optionnelles courantes en entretien :

- **Alias personnalisé** — l'utilisateur fournit son propre code court (ex. `bit.ly/Evan`) s'il n'est pas pris
- **Date d'expiration** — URL courte valide seulement pour une période (ex. lien de conférence pour une semaine)

## Exigences non fonctionnelles

Échelle typique qu'Evan donne aux candidats :

- **100 millions de DAU**
- **~1 milliard d'URLs** raccourcies au total

Autres NFR à contextualiser :

| Préoccupation | Cadrage raccourcisseur d'URL |
|---------|----------------------|
| **Redirections basse latence** | Le chemin de redirection doit être rapide — les utilisateurs ressentent la latence immédiatement |
| **Codes courts uniques** | Les collisions redirigent vers de mauvais sites — garantir l'unicité |
| **Scalabilité** | Supporter 100M DAU et 1B de mappings stockés |
| **CAP** | Favoriser **disponibilité + tolérance aux partitions** plutôt que la cohérence forte (voir ci-dessous) |

## Entités principales

- **User** — possède les URLs courtes (email, hash de mot de passe, etc. sont auxiliaires ; ne pas sur-détailler en entretien)
- **URL mapping** — code court ↔ URL longue (la table centrale)

## API

- `POST /urls` — body : URL longue (+ alias personnalisé optionnel, expiration optionnelle) → retourne l'URL courte
- `GET /{shortCode}` — redirection vers l'URL longue (302 dans le design de haut niveau)

## Design de haut niveau (v1)

```
Client → Load balancer → URL Service → Database (URL mappings)
```

- **Création :** insérer `(shortCode, longUrl)` → retourner l'URL courte
- **Redirection :** lookup `shortCode` → retourner une **redirection 302** vers l'URL longue

### Redirections 301 vs 302

| Code | Comportement | Quand l'utiliser |
|------|----------|-------------|
| **302** | Temporaire — le navigateur passe toujours par votre serveur | Par défaut sans analytics, ou quand on veut logger chaque redirection |
| **301** | Permanent — navigateurs/CDN peuvent mettre en cache ; peut contourner votre serveur | Quand les redirections sont vraiment permanentes et qu'on n'a pas besoin de logging par clic |

Pour Bitly **sans analytics**, le 302 convient. Avec analytics, le 302 garantit que les redirections atteignent toujours votre serveur pour compter les clics.

## Deep dive : génération des codes courts

Mauvaises approches :

1. **Préfixe de l'URL longue** — beaucoup d'URLs partagent des préfixes (`twitter.com/...`) → mapping un-à-plusieurs, collisions
2. **Hasher uniquement l'URL longue** — déterministe, même URL longue → même code court (OK pour dédup), mais collisions de hash à gérer ; ajouter du sel/rehasher en cas de collision

Bonnes approches :

### Compteur + base62 (recommandé dans la vidéo)

- Maintenir un **compteur auto-incrémenté** par nouvelle URL
- **Encoder en base62** le compteur (0–9, A–Z, a–z) pour des chaînes compactes
- **6 caractères** → 62⁶ ≈ **56 milliards** de combinaisons
- **Pas de collisions** — les IDs séquentiels sont uniques par construction

### Nombre aléatoire + base62

- Choisir un entier aléatoire dans [0, 56B), encoder en base62
- **Paradoxe des anniversaires :** la probabilité de collision monte plus vite que l'intuition — avec ~1B d'URLs, les collisions deviennent un vrai problème
- Il faut **vérifier la DB et réessayer** en cas de collision

### Hash URL longue + tranche base62

- Hash (MD5, Murmur, SHA-256) → base62 → prendre les 6 premiers caractères
- Dédup déterministe pour la même URL longue
- En cas de collision, ajouter du sel et rehasher

## Deep dive : CAP et cohérence

Un raccourcisseur d'URL n'a **pas besoin** de cohérence forte **read-after-write** (contrairement à la banque ou la billetterie).

Si un utilisateur crée une URL courte et la partage instantanément, la **cohérence éventuelle** est acceptable — une brève erreur « réessayez dans une minute » est tolérable. Favoriser **AP** plutôt que **CP**.

## Deep dive : scaler les lectures (redirect-heavy)

Les redirections dominent le trafic — charge **read-heavy**.

### Séparation read/write service

- **Write service** — crée les URLs courtes
- **Read service** — gère les redirections
- **API Gateway** route `POST /urls` → write service, `GET /{shortCode}` → read service

Scaler chaque tier horizontalement (auto-scaling groups derrière load balancer).

### Cache Redis (read-through LRU)

- À la redirection : vérifier **Redis** pour `shortCode → longUrl`
- **Cache miss :** lire la DB, remplir le cache, retourner
- **Read-through + LRU** pour l'éviction des URLs courtes chaudes

Le lookup par clé primaire sur Postgres (B-tree) est déjà rapide, mais le cache retire la charge DB à l'échelle.

QPS de redirection au pic (approx.) : 100M DAU × quelques redirections/jour → ~1K req/s en moyenne, **10–100K req/s** au pic avec multiplicateur de burst.

## Points clés

- Bitly est la question **classique d'entrée** en system design — exigences → entités → API → design → deep dives
- **Compteur + base62** est la stratégie la plus propre sans collision ; l'aléatoire exige le calcul du paradoxe des anniversaires
- **Ne jamais utiliser le préfixe d'URL** comme code court — les préfixes partagés cassent le mapping un-à-un
- **302 vs 301** dépend de la nécessité de logger les redirections côté serveur (analytics)
- **Séparation read/write + cache Redis read-through** pour scaler un trafic redirect-heavy
- **La cohérence éventuelle est OK** — tous les systèmes n'ont pas besoin de read-after-write fort
- Ne faire des estimations back-of-envelope que quand elles **changent les décisions d'architecture**

---

> 🌐 *Traduit par Claude*
