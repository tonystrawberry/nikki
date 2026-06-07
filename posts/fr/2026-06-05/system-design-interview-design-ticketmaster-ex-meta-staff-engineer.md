---
title: "Entretien system design : concevoir Ticketmaster avec un ex Meta Staff Engineer"
date: "2026-06-05"
excerpt: "Notes Hello Interview sur la conception de Ticketmaster — pas de double réservation, réserve/confirm en deux phases, verrous Redis TTL, Elasticsearch + CDC, file d'attente virtuelle pour les pics, et compromis CAP par chemin."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "ticketmaster", "interview", "consistency", "elasticsearch", "redis"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=fhdPyoO6aXI"
---

Notes Hello Interview (ex Meta staff engineer) sur la **conception d'un service de réservation de billets type Ticketmaster** — une question phare chez Meta (entretiens product design et system design).

## Feuille de route de l'entretien

1. **Exigences** (fonctionnelles + non-fonctionnelles)
2. **Entités principales** + **APIs**
3. **Design de haut niveau** (satisfaire les exigences fonctionnelles)
4. **Deep dives** (satisfaire les exigences non-fonctionnelles)

Garder les exigences sous ~5 minutes.

## Exigences fonctionnelles

- Les utilisateurs peuvent **rechercher** des événements
- Les utilisateurs peuvent **consulter** un événement (détails, plan de salle, billets disponibles)
- Les utilisateurs peuvent **réserver** des billets

## Exigences non-fonctionnelles (spécifiques au contexte)

Ne pas se contenter de lister « scalabilité » et « disponibilité » — expliquer **ce qui rend ce système difficile**.

| Préoccupation | Cadrage spécifique Ticketmaster |
|---------|-------------------------------|
| **Cohérence vs disponibilité (CAP)** | **Cohérence forte pour la réservation** — pas de double réservation (un siège, un utilisateur). **Haute disponibilité pour la recherche/consultation** — OK si un nouvel événement apparaît avec quelques secondes de retard |
| **Ratio lecture/écriture** | ~100:1 (beaucoup de navigation, peu d'achats ; ~1 % de conversion) |
| **Scaling** | Pas un scale générique — **pics liés aux événements populaires** (Taylor Swift, Super Bowl, Coupe du monde) |
| **Recherche à faible latence** | Un full table scan ne fonctionnera pas |

Hors scope (noter sous la ligne) : GDPR, détails génériques de tolérance aux pannes, etc. — vérifier les priorités avec l'interviewer.

## Entités principales

- **Event** (venue, performer, métadonnées, relation aux tickets)
- **Venue** (localisation, plan de salle)
- **Performer**
- **Ticket** (siège, prix, statut, FK event)

Commencer par les noms d'entités ; détailler les champs au fil de l'évolution du design.

## APIs

### Consulter un événement

`GET /events/{eventId}` → event, venue, performer, liste de tickets (pour le plan de salle)

### Recherche

`GET /search?term=&location=&type=&date=...` → liste d'événements **partiels** (suffisant pour les résultats ; détail complet via l'endpoint view)

### Réserver (deux phases — comme le vrai Ticketmaster)

1. **Reserve :** `POST /booking/reserve` — body : `ticketId` uniquement ; **utilisateur depuis JWT/header**, pas le body (sécurité)
2. **Confirm :** `PUT/PATCH /booking/confirm` — `ticketId` + détails de paiement → **Stripe** (callback webhook en cas de succès)

Reserve bloque le siège ~10 minutes pendant que l'utilisateur paie.

## Architecture de haut niveau

**Client** → **API Gateway** (auth, rate limiting, routing) → **microservices** :

| Service | Rôle |
|---------|------|
| **Event CRUD** | Consulter un événement, charger les données du plan de salle |
| **Search** | Découverte d'événements |
| **Booking** | Reserve + confirm |

**PostgreSQL** pour le stockage principal — relations (event → tickets), **transactions ACID** pour la justesse des réservations. SQL vs NoSQL est un débat faible en entretien ; se concentrer sur les **qualités requises** (transactions, cohérence sur les tickets). Postgres ou DynamoDB avec transactions peuvent convenir.

**Statut du ticket :** `available` | `reserved` | `booked` (+ user ID quand booked)

**Stripe** pour les paiements (async ; webhook confirme le succès avant de passer en `booked`).

## Expiration des réservations — la décision de design clé

**Problème :** l'utilisateur réserve, abandonne le paiement — le siège reste `reserved` indéfiniment.

### Niveau intermédiaire : timestamp + requête ou cron

- Ajouter `reserved_timestamp` ; la requête traite les `reserved` de plus de 10 min comme disponibles
- Ou cron toutes les ~10 min pour réinitialiser les réservations périmées

**Inconvénient (écart senior) :** le cron introduit un délai **n** — le siège peut rester verrouillé jusqu'à l'intervalle du cron après les 10 minutes (ex. 19 minutes au total).

### Senior : verrou distribué Redis avec TTL

- À la reserve : **ne pas** mettre à jour le statut Postgres — placer `ticketId` dans Redis avec **TTL = 10 minutes**
- Sur le plan de salle : requêter les tickets `available`, puis **filtrer** les IDs présents dans le verrou Redis
- Le TTL expire → siège automatiquement disponible (pas de lag cron)
- Redis séparé car **plusieurs instances du service booking** ont besoin d'une vue de verrou cohérente

**Si Redis tombe :** brève fenêtre où des tentatives de double réservation sont possibles ; l'ACID Postgres garantit toujours **un gagnant** au confirm — mauvaise UX pour les perdants, compromis acceptable à discuter avec le product.

## Deep dives

### Recherche à faible latence — Elasticsearch + CDC

Design initial : SQL `LIKE` wildcard → full table scan — trop lent.

**Elasticsearch** avec index inversé pour la recherche textuelle ; support géospatial pour la localisation.

**Ne pas utiliser ES comme store principal** (durabilité, transactions). Synchroniser depuis Postgres :

- Dual-write dans le code applicatif (gérer les échecs partiels), ou
- **CDC** → stream → mise à jour ES (réponse courante en entretien ; events/venues changent rarement — pas besoin de queue)

**Cache des recherches populaires :**

- OpenSearch node query cache
- Redis clé par terme de recherche
- **CDN** cache `GET /search` pendant ~30–60s (fonctionne quand mêmes query params ; casse avec ranking personnalisé ou params haute cardinalité comme lat/long exact)

### Plan de salle temps réel + gestion des pics

**Plan de salle obsolète :** l'utilisateur charge la page ; les sièges partent en quelques secondes → les clics affichent une erreur.

**Options :**

- **Long polling** — peu coûteux, adapté aux sessions courtes sur la page
- **SSE (Server-Sent Events)** — le serveur pousse les mises à jour de sièges au client (unidirectionnel ; suffisant ici). WebSockets possibles mais overkill.

**Événements populaires :** chargement de page, les sièges disparaissent instantanément — mauvaise UX.

**File d'attente virtuelle** (Redis sorted set par heure d'arrivée, ou aléatoire pour l'équité) :

- Des millions arrivent en même temps → message de file d'attente au lieu de la page événement
- Libérer les utilisateurs par lots selon la capacité (ex. par sièges réservés)
- Notifier via SSE à l'admission → puis réserver

Simple, point d'étranglement créatif — pas toujours la tech la plus complexe.

### Scaling des lectures

- API Gateway + services scale horizontalement (LB managé)
- **Cache** event/venue/performer dans Redis (changent rarement) — l'API view ne touche la DB que pour les **tickets dynamiques**
- Sharder Postgres si le calcul le justifie (discussion shard key : `eventId` vs `venueId` pour la géo)

**Astuce calcul :** ne faire des estimations back-of-envelope que quand les résultats **changent le design** — pas comme case à cocher au départ.

## Liens avec DDIA

Patterns qui font écho à *Designing Data-Intensive Applications* :

- **Données dérivées** — index Elasticsearch maintenu depuis la source de vérité (Ch. 11 CDC, intégration de données)
- **Logs/streams** — CDC comme change stream depuis la DB OLTP
- **Cohérence** — garanties fortes là où le business l'exige (booking), assouplies là où c'est OK (search)
- **Caching** — compromis fraîcheur vs latence de lecture sur les chemins chauds

## Points clés

- **Pas de double réservation** impose une **cohérence forte sur le chemin booking** ; search/view peut favoriser la disponibilité
- **Réservation en deux phases** (reserve → pay → confirm) est standard ; modéliser les APIs en conséquence
- **Verrou Redis TTL** bat le cron pour les holds de 10 minutes — différenciateur senior
- **Elasticsearch + CDC** pour la recherche ; pas de dual-primary avec Postgres
- **File d'attente virtuelle** pour les pics d'événements célébrités
- **SSE + caching** pour la fraîcheur du plan de salle et le trafic read-heavy
- Spécifier les NFR **dans le contexte du problème**, pas comme buzzwords génériques

---
> 🌐 *Traduit par Claude*
