---
title: "Construire un Chat : Chapitre 1 — Architecture et mise en place"
date: "2026-05-31"
excerpt: "Deux applications distinctes, quatre concepts fondamentaux, et comment faire communiquer Rails ActionCable avec Next.js via WebSockets."
author: "Tony Duong"
category: "note"
tags: ["rails", "nextjs", "actioncable", "websockets", "architecture"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 1
collectionTitle: "Construire un Chat en Temps Réel"
---

Ce tutoriel parcourt la fonctionnalité de chat en temps réel construite pour un blog Next.js. Les visiteurs ouvrent un widget de chat et parlent à l'administrateur du site. L'administrateur voit toutes les conversations dans un tableau de bord. Les messages arrivent instantanément dans les deux sens.

La partie intéressante : le frontend est une application Next.js 16, le backend est une API Rails 8. Ils vivent dans des processus séparés, sur des ports différents, connectés par WebSockets. Ce chapitre explique comment les pièces s'assemblent et comment lancer les deux serveurs sur votre machine.

## Deux applications distinctes

Le projet a deux bases de code :

| | Frontend | Backend |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Rails 8 (API-only) |
| **Chemin** | `/` (racine du dépôt) | `chat-server/` (sous-module git) |
| **Port** | 3000 | 3100 |
| **Déploiement** | Vercel | Kamal 2 (Docker) |
| **Communication** | `@rails/actioncable` (WebSocket) + `fetch` (HTTP) | ActionCable + contrôleurs REST |

Le frontend gère tout ce que le visiteur voit : le blog, la bulle de chat flottante, le tableau de bord admin. Le backend gère tout ce qui est temps réel : les connexions WebSocket, la persistance des messages, les notifications push.

## Quatre concepts à connaître

### 1. WebSocket vs HTTP

HTTP fonctionne en requête-réponse : le client demande, le serveur répond, la connexion se ferme. WebSocket est un canal bidirectionnel persistant — chaque côté peut envoyer des données à tout moment sans que l'autre ne le demande.

Ce projet utilise WebSocket pour toute la messagerie dans les deux sens. HTTP n'est utilisé que pour trois choses : la connexion admin, le listage/suppression de conversations et l'enregistrement des abonnements push.

### 2. ActionCable

ActionCable est le framework WebSocket intégré à Rails. Il comporte trois couches :

- **Connection** — authentifie la requête d'upgrade WebSocket. Se trouve dans `chat-server/app/channels/application_cable/connection.rb`. Cette base de code identifie deux types de connexions avec `identified_by` :

```ruby
identified_by :visitor_token, :admin
```

- **Channel** — définit ce qu'une connexion peut faire. Cette base de code en a deux : `VisitorChannel` (un par session navigateur) et `AdminChannel` (un pour toutes les conversations).
- **Consumer** — la contrepartie côté client, fournie par le package npm `@rails/actioncable`. La fonction `createConsumer(url)` ouvre le WebSocket et retourne un objet sur lequel on appelle `subscriptions.create()`.

### 3. Solid Cable

Les déploiements ActionCable traditionnels nécessitent Redis pour le pub/sub. Rails 8 embarque Solid Cable comme adaptateur par défaut — il stocke les messages pub/sub dans SQLite à la place.

La configuration est minimale. Depuis `chat-server/config/cable.yml` :

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

Le compromis : pas de processus Redis à gérer, mais pas de mise à l'échelle horizontale non plus. Un seul processus Puma, un seul fichier SQLite. Pour un blog personnel, c'est le bon choix.

### 4. Authentification cross-origin

Le frontend tourne sur `localhost:3000`, le backend sur `localhost:3100`. Les navigateurs bloquent les cookies cross-origin par défaut, donc deux choses sont configurées :

**Côté serveur** — `chat-server/config/initializers/cors.rb` autorise l'origine du frontend avec `credentials: true` :

```ruby
origins(*ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",").map(&:strip))
resource "*", headers: :any, methods: [...], credentials: true
```

**Côté client** — chaque appel `fetch` dans `src/lib/chat-client.ts` utilise `credentials: "include"` pour que le navigateur envoie les cookies en cross-origin.

L'authentification admin utilise les cookies de session Rails. L'authentification visiteur est plus simple — un token UUID passé en paramètre de requête dans l'URL WebSocket :

```typescript
visitorConsumer = createConsumer(`${WS_URL}?token=${sessionToken}`);
```

## Organisation du dépôt

```
src/
  components/
    ChatWidget.tsx           # Bulle flottante pour les visiteurs
    ChatPanel.tsx            # Composant d'affichage des messages partagé
    AdminChat.tsx            # Tableau de bord admin avec liste de conversations
  lib/
    chat-client.ts           # Factory de consumer ActionCable + helpers HTTP
    chat-types.ts            # Unions discriminées TypeScript pour les données de channel
  types/
    actioncable.d.ts         # Déclarations de types écrites à la main pour @rails/actioncable
  app/
    admin/
      login/page.tsx         # Formulaire d'identifiants -> POST /auth/login
      chats/page.tsx         # Affiche le composant AdminChat

chat-server/
  app/
    channels/
      application_cable/
        connection.rb        # Double authentification : token visiteur OU session admin
      visitor_channel.rb     # Un channel par session navigateur
      admin_channel.rb       # Un channel pour toutes les conversations
    controllers/
      auth_controller.rb     # Login basé sur les variables d'env, définit session[:admin]
      conversations_controller.rb
      push_subscriptions_controller.rb
    models/
      conversation.rb        # session_token + visitor_name + unread_count
      message.rb             # sender (visitor|admin) + content
      push_subscription.rb   # Données d'abonnement Web Push
    services/
      push_notification_service.rb
  config/
    cable.yml                # Configuration de l'adaptateur Solid Cable
    puma.rb                  # Port 3100, mode unique
    routes.rb                # ActionCable monté sur /cable
```

La section admin dans `src/app/admin/` se situe en dehors du groupe de routes i18n `[locale]`. Elle possède son propre `layout.tsx` avec les balises `<html>` et `<body>` — c'est un shell de page complètement séparé du blog.

## Ce qui se passe au lancement

**Terminal 1** — démarrer le frontend :

```bash
npm run dev
```

Next.js démarre sur le port 3000. Les deux variables d'environnement importantes sont dans `.env.local` :

```
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3100/cable
NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3100
```

**Terminal 2** — démarrer le backend :

```bash
cd chat-server
ADMIN_USER=tony ADMIN_PASSWORD=secret bin/rails server -p 3100
```

Puma démarre sur le port 3100 (configuré dans `config/puma.rb` via `port ENV.fetch("PORT", 3100)`). ActionCable est monté sur `/cable` dans `config/routes.rb` :

```ruby
mount ActionCable.server => "/cable"
```

Rails est configuré en API-only (`config.api_only = true` dans `config/application.rb`), ce qui retire les middlewares de session. Mais l'authentification admin a besoin des sessions, donc deux lignes les réajoutent :

```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore, key: "_chat_server_session"
```

Quand un visiteur ouvre le widget de chat, le frontend appelle `getVisitorConsumer(sessionToken)` dans `src/lib/chat-client.ts`, qui appelle `createConsumer()` avec l'URL WebSocket plus un paramètre `?token=`. Le navigateur ouvre un WebSocket vers `ws://localhost:3100/cable?token=<uuid>`. La méthode `Connection#connect` de Rails vérifie `request.params[:token]`, le trouve présent, et accepte la connexion.

## Installation

Prérequis : Node.js 18+, Ruby 3.2+, SQLite3.

```bash
# Dépendances frontend
npm install

# Dépendances backend
cd chat-server
bundle install
bin/rails db:prepare

# Fichiers d'environnement
cd ..
cp .env.example .env
cp .env.local.example .env.local
```

Éditez `.env.local` pour définir `NEXT_PUBLIC_CHAT_WS_URL` et `NEXT_PUBLIC_CHAT_HTTP_URL` si les valeurs par défaut ne correspondent pas à votre configuration. Puis lancez les deux serveurs dans des terminaux séparés.

---

Maintenant que vous pouvez voir les deux moitiés fonctionner, le chapitre 2 plonge dans le backend Rails — comment ActionCable authentifie les connexions, ce qui se passe dans `VisitorChannel` et `AdminChannel`, et comment les messages circulent d'un navigateur à l'autre via Solid Cable.

## A vous de jouer

**Exercice 1.** Démarrez les deux serveurs. Ouvrez les DevTools de votre navigateur, allez dans l'onglet Réseau et filtrez par "WS". Ouvrez le widget de chat sur le blog. Vous devriez voir une connexion WebSocket vers `ws://localhost:3100/cable?token=...`. Inspectez les frames — quel est le premier message que le serveur envoie après le handshake ?

<details>
<summary>Solution</summary>

Le premier message est un objet JSON avec `{"type":"welcome"}`. C'est la confirmation du handshake ActionCable. Ensuite, le client envoie une commande `subscribe` pour `VisitorChannel`, et le serveur répond avec `{"type":"confirm_subscription",...}`.

</details>

**Exercice 2.** Dans `chat-server/config/puma.rb`, changez le port par défaut de `3100` à `3200`. Redémarrez le serveur Rails. Qu'est-ce qui casse, et comment le réparer ?

<details>
<summary>Solution</summary>

Le widget de chat ne se connecte plus. Le frontend pointe toujours vers `ws://localhost:3100/cable`. Pour corriger, mettez à jour les deux variables d'env dans `.env.local` :

```
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:3200/cable
NEXT_PUBLIC_CHAT_HTTP_URL=http://localhost:3200
```

Vous devez aussi mettre à jour `ALLOWED_ORIGINS` côté Rails (ou sa valeur par défaut `http://localhost:3000` fonctionne toujours puisque l'origine du frontend n'a pas changé — seul le port du backend a bougé). Redémarrez les deux serveurs.

</details>

**Exercice 3.** Dans `chat-server/config/application.rb`, commentez les deux lignes `config.middleware.use` qui ajoutent `Cookies` et `Session::CookieStore`. Redémarrez Rails. Essayez de vous connecter en tant qu'admin sur `/admin/login`. Que se passe-t-il et pourquoi ?

<details>
<summary>Solution</summary>

Le POST de login vers `/auth/login` réussit (retourne `{ "ok": true }`), mais le cookie de session n'est jamais défini car le middleware de cookies a disparu. Quand le frontend ouvre ensuite un WebSocket pour l'admin, `Connection#connect` vérifie `request.session[:admin]` — qui est `nil` car aucune session n'existe. La connexion est rejetée. Le tableau de bord admin affiche un état déconnecté. Décommentez les lignes et redémarrez pour corriger.

</details>

**Exercice 4.** Lisez le type `VisitorChannelData` dans `src/lib/chat-types.ts`. C'est une union discriminée sur le champ `type`. Ajoutez un quatrième variant hypothétique `{ type: "typing"; is_typing: boolean }` à l'union. Où dans le code frontend faudrait-il gérer ce nouveau variant ?

<details>
<summary>Solution</summary>

Le type est consommé dans le callback `received` passé à `subscribeVisitorChannel()` dans `src/lib/chat-client.ts`. Chaque composant qui appelle cette fonction traite les données dans son callback `received` — principalement `ChatWidget.tsx`. Vous ajouteriez une branche `case "typing":` (ou `if (data.type === "typing")`) dans le switch/conditionnel qui traite les messages entrants, et mettriez à jour l'interface pour afficher un indicateur de frappe.

</details>

---
*Traduit par Claude*
