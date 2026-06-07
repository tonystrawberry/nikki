---
title: "Construire un Chat : Chapitre 2 — Le backend ActionCable"
date: "2026-05-31"
excerpt: "Authentification des connexions, channels visiteur et admin, le modèle de données, et comment Solid Cable remplace Redis par SQLite."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["rails", "actioncable", "solid-cable", "sqlite", "websockets"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 2
collectionTitle: "Construire un Chat en Temps Réel"
---

> 💬 **C'est le module de chat en direct que tu vois en bas à droite de ce site.** Cette série détaille précisément comment je l'ai construit — clique sur la bulle de chat pour l'essayer, puis lis la suite pour découvrir comment ça fonctionne en coulisses.

Ce chapitre parcourt le serveur WebSocket Rails : comment les connexions sont authentifiées, ce qui se passe dans chaque channel, et comment les données circulent via Solid Cable. Vous devriez déjà connaître l'organisation du dépôt grâce au chapitre 1.

## Authentification de la connexion

Ouvrez `chat-server/app/channels/application_cable/connection.rb` :

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :visitor_token, :admin

    def connect
      if request.params[:token].present?
        self.visitor_token = request.params[:token]
        self.admin = false
      elsif request.session[:admin] == true
        self.visitor_token = nil
        self.admin = true
      else
        reject_unauthorized_connection
      end
    end
  end
end
```

Deux types d'utilisateurs partagent le même endpoint WebSocket :

- **Les visiteurs** passent `?token=<UUID>` dans l'URL WebSocket. Le token provient du `localStorage` dans le navigateur.
- **L'admin** s'authentifie via un cookie de session Rails, défini auparavant par `POST /auth/login` dans `AuthController`.
- Toute autre personne reçoit `reject_unauthorized_connection`, qui envoie un HTTP 403 et ferme le socket.

`identified_by` mérite d'être compris. Il enregistre `:visitor_token` et `:admin` comme attributs d'identité sur chaque instance de connexion. ActionCable les utilise pour retrouver les connexions plus tard — quand vous appelez `ActionCable.server.connections`, chaque objet de connexion expose ces attributs. C'est ainsi que `VisitorChannel` peut vérifier si un admin est en ligne, et comment `AdminChannel` peut contrôler l'accès.

## VisitorChannel

Source complète : `chat-server/app/channels/visitor_channel.rb` (84 lignes).

**`subscribed`** lit le token depuis `connection.visitor_token`, appelle `stream_from "visitor_#{@session_token}"`, et transmet l'historique des messages existants si un enregistrement `Conversation` existe déjà pour ce token.

**`send_message(data)`** est l'endroit où le travail intéressant se fait. Voici le flux, étape par étape :

```
1. Le visiteur envoie  { action: "send_message", content: "Bonjour !" }
2. VisitorChannel#send_message valide le contenu (vérification du vide, max 2000 caractères)
3. Conversation.find_or_create_by!(session_token:) crée ou trouve l'enregistrement
4. conversation.messages.create!(sender: "visitor", content: "Bonjour !")
5. conversation.increment!(:unread_count)
6. Broadcast vers "visitor_{token}"   --> le visiteur voit son message confirmé
7. Broadcast vers "admin_channel"     --> l'admin voit un événement new_message
8. admin_connected? --> si false, PushNotificationService.notify
```

La validation est directe — les messages vides et ceux dépassant 2000 caractères sont rejetés avec un `transmit({ type: "error", ... })` renvoyé à l'expéditeur :

```ruby
content = data["content"].to_s.strip
return transmit({ type: "error", error: "Message is empty" }) if content.blank?
return transmit({ type: "error", error: "Message too long (max 2000)" }) if content.length > 2000
```

`admin_connected?` inspecte les connexions actives :

```ruby
def admin_connected?
  ActionCable.server.connections.any? { |c| c.admin == true }
rescue
  false
end
```

Cela fonctionne parce que `identified_by :admin` a rendu `.admin` accessible sur chaque objet de connexion. Si aucun socket admin n'est ouvert, le channel envoie une notification push web à la place.

**Décision de conception :** les messages sont créés via ActionCable, pas via HTTP POST. La connexion WebSocket _est_ le chemin d'écriture. Compromis : plus simple (pas d'endpoint REST pour les messages), mais si le socket est coupé vous ne pouvez pas envoyer. Pour un widget de chat de blog personnel, c'est suffisant — pas besoin de file d'attente de messages ni de logique de retry.

## AdminChannel

Source complète : `chat-server/app/channels/admin_channel.rb` (110 lignes).

**`subscribed`** rejette les connexions non-admin, écoute `"admin_channel"`, et transmet la liste complète des conversations via une méthode privée `serialized_conversations` :

```ruby
def subscribed
  unless connection.admin
    reject
    return
  end

  stream_from "admin_channel"

  transmit({
    type: "conversations",
    conversations: serialized_conversations
  })
end
```

**`send_message(data)`** trouve une conversation par ID, crée un message avec `sender: "admin"`, et broadcast vers _deux_ flux :

```ruby
ActionCable.server.broadcast("visitor_#{conversation.session_token}", { ... })
ActionCable.server.broadcast("admin_channel", { ... })
```

Remarquez comment le channel admin accède au flux du visiteur en utilisant `conversation.session_token`. Il traverse les frontières de channel via le mécanisme de broadcast — les channels ne sont que des scopes d'abonnement, pas des murs d'isolation.

**`mark_read(data)`** remet `conversation.unread_count` à 0. **`get_history(data)`** transmet tous les messages d'une conversation donnée. **`list_conversations`** renvoie la liste complète des conversations à la demande.

## Modèle de données

Voir `chat-server/db/schema.rb`. Trois tables :

| Table | Colonnes clés | Index notables |
|-------|-------------|-----------------|
| `conversations` | `session_token` (unique), `visitor_name`, `unread_count` | `updated_at` pour l'ordre de tri |
| `messages` | `conversation_id` (FK), `sender`, `content` (text) | composite `(conversation_id, created_at)` |
| `push_subscriptions` | `endpoint` (unique), `p256dh`, `auth` | unique sur `endpoint` |

Le détail critique du modèle se trouve dans `chat-server/app/models/message.rb` :

```ruby
class Message < ApplicationRecord
  belongs_to :conversation, touch: true
end
```

`touch: true` signifie que chaque `messages.create!` met automatiquement à jour `conversation.updated_at`. Le panneau admin trie les conversations par `updated_at DESC`, donc la conversation la plus récemment active remonte en haut — aucune requête supplémentaire nécessaire.

## Solid Cable — l'adaptateur pub/sub

ActionCable a besoin d'un backend pub/sub pour router les broadcasts. Ce projet utilise Solid Cable, configuré dans `chat-server/config/cable.yml` :

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

Solid Cable stocke les messages de broadcast dans une base de données SQLite dédiée et interroge les nouvelles entrées par polling. `polling_interval: 0.1.seconds` donne environ 100ms de latence. `message_retention: 1.day` purge automatiquement les anciennes lignes de broadcast pour garder la table compacte.

Comment se compare-t-il ?

| Adaptateur | Dépendance externe | Latence | Mise à l'échelle horizontale |
|---------|---------------------|---------|---------------------|
| `solid_cable` | Aucune (SQLite) | ~100ms | Non (processus unique) |
| `redis` | Serveur Redis | ~1ms | Oui |
| `async` | Aucune | ~0ms | Non (même processus uniquement) |

Cette base de code a choisi `solid_cable` parce qu'il n'y a pas de Redis à maintenir, SQLite est déjà présent pour la base de données applicative, et un blog personnel n'a pas besoin de mise à l'échelle horizontale. Si vous avez plus tard besoin d'une livraison sous 10ms ou de plusieurs processus Rails, changez l'adaptateur pour `redis` — aucune modification du code des channels n'est requise.

---

Le backend broadcast maintenant les messages vers des flux nommés. Le chapitre 3 montre comment le frontend Next.js s'abonne à ces flux en utilisant le package npm `@rails/actioncable`, et comment les composants React gèrent le cycle de vie WebSocket sans tomber dans le piège de la boucle de re-render infinie.

## A vous de jouer

**Exercice 1.** Ouvrez une console Rails et broadcastez manuellement un message de test vers un flux visiteur. Si vous avez un visiteur connecté avec le token `abc-123` :

```ruby
ActionCable.server.broadcast("visitor_abc-123", {
  type: "message",
  message: { id: 999, sender: "admin", content: "Test from console", created_at: Time.current.iso8601 }
})
```

Observez ce que le frontend affiche. (Note : avec `solid_cable`, vous devez broadcaster depuis le processus du serveur Rails, pas depuis un `bin/rails console` séparé. Voir le commentaire en haut de `cable.yml`.)

<details>
<summary>Solution</summary>

Le widget de chat du visiteur devrait afficher "Test from console" comme message admin. Il apparaît instantanément car le frontend est déjà abonné à ce flux. Le message n'est _pas_ persisté dans la base de données — vous n'avez broadcasté que des données brutes, en sautant `Message.create!`. Si le visiteur rafraîchit, le message fantôme disparaît.

</details>

**Exercice 2.** Changez `polling_interval` dans `config/cable.yml` à `2.seconds`, redémarrez Rails, et envoyez un message. Remarquez l'augmentation de la latence.

<details>
<summary>Solution</summary>

Les messages prennent maintenant jusqu'à deux secondes pour apparaître chez le destinataire. Le poller Solid Cable vérifie la table de broadcast toutes les deux secondes au lieu de toutes les 100ms. Revenez à `0.1.seconds` quand vous avez terminé.

</details>

**Exercice 3.** Ajoutez une vérification `banned_words` à `VisitorChannel#send_message` qui rejette les messages contenant "spam". Transmettez une erreur au visiteur.

<details>
<summary>Solution</summary>

Ajoutez ceci après les lignes de validation existantes dans `chat-server/app/channels/visitor_channel.rb` :

```ruby
banned = %w[spam]
if banned.any? { |w| content.downcase.include?(w) }
  return transmit({ type: "error", error: "Message contains a banned word" })
end
```

Placez-le après les vérifications de vide/longueur et avant `find_or_create_by!`. Le visiteur reçoit `{ type: "error", error: "Message contains a banned word" }` et le message n'est jamais persisté.

</details>

**Exercice 4.** Ouvrez `chat-server/app/models/message.rb` et supprimez `touch: true` de `belongs_to :conversation`. Envoyez un message, puis vérifiez si la liste de conversations se trie toujours correctement dans le panneau admin.

<details>
<summary>Solution</summary>

Le tri ne sera plus correct. Sans `touch: true`, `conversation.updated_at` n'est pas mis à jour quand un nouveau message est créé. Le panneau admin fait la requête `Conversation.order(updated_at: :desc)`, donc les conversations avec de nouveaux messages ne remontent plus en haut. Rajoutez `touch: true` pour restaurer le comportement.

</details>

---
*Traduit par Claude*
