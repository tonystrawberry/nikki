---
title: "Construire un Chat : Chapitre 4 — Dashboard admin et notifications push"
date: "2026-05-31"
excerpt: "Authentification admin, gestion de plusieurs conversations sur un seul WebSocket, et le pipeline complet de notifications Web Push."
author: "Tony Duong"
category: "note"
tags: ["rails", "web-push", "vapid", "service-worker", "react"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 4
collectionTitle: "Construire un Chat en Temps Réel"
---

Le chat côté visiteur des chapitres 2 et 3 n'est que la moitié de l'histoire. Ce chapitre couvre l'autre moitié : comment l'admin s'authentifie, comment `AdminChat.tsx` multiplex plusieurs conversations sur un seul WebSocket, et comment les notifications Web Push atteignent l'admin même après qu'il a fermé l'onglet du navigateur.

## Flux d'authentification admin

Les pages admin se trouvent dans `src/app/admin/` — en dehors de l'arborescence de routes `[locale]`. Elles ont besoin de leur propre layout racine (`src/app/admin/layout.tsx`) car le App Router de Next.js exige que chaque arborescence de routes fournisse les balises `<html>` et `<body>`. Le blog les obtient depuis `src/app/[locale]/layout.tsx`, donc `/admin/*` est une arborescence séparée.

La séquence de connexion :

```
1. L'admin visite /admin/login
2. AdminLoginPage affiche un formulaire          (src/app/admin/login/page.tsx)
3. Soumission du formulaire -> adminLogin(user, pass)  (src/lib/chat-client.ts)
4. fetch POST /auth/login                        (credentials: "include")
5. AuthController vérifie les variables d'env    (chat-server/app/controllers/auth_controller.rb)
6. Correspondance -> session[:admin] = true, retourne { ok: true }
7. Le navigateur stocke le cookie _chat_server_session
8. Le routeur redirige vers /admin/chats
9. AdminChat connecte le WebSocket -- Connection#connect lit session[:admin]
```

Le contrôleur (`chat-server/app/controllers/auth_controller.rb`) compare avec deux variables d'environnement :

```ruby
if username == ENV["ADMIN_USER"] && password == ENV["ADMIN_PASSWORD"]
  session[:admin] = true
  render json: { ok: true }
end
```

Pas de table d'utilisateurs, pas de hachage de mot de passe, pas de procédure de récupération. Pour un blog personnel avec un seul admin : zéro flexibilité, mais zéro surface d'attaque au-delà des variables d'environnement. La connexion WebSocket lit cette même session pour définir `self.admin = true` (chapitre 2).

## AdminChat.tsx — gérer plusieurs conversations sur un seul WebSocket

Le `ChatWidget` visiteur du chapitre 3 gère une seule conversation. `AdminChat` les gère toutes sur un seul abonnement `AdminChannel`, avec deux niveaux d'état :

```typescript
// src/components/AdminChat.tsx
const [conversations, setConversations] = useState<ChatConversation[]>([]);  // liste
const [selectedId, setSelectedId] = useState<number | null>(null);           // détail
const [messages, setMessages] = useState<ChatMessage[]>([]);                 // détail
```

Le callback `received` fait un switch sur quatre types d'événements :

| Type d'événement       | Effet                                                                       |
|------------------------|------------------------------------------------------------------------------|
| `conversations`        | Remplace la liste complète des conversations (envoyée à la connexion)        |
| `new_message`          | Met à jour `last_message` / `unread_count` ; ajoute le message si sélectionné |
| `history`              | Remplace la liste de messages pour la conversation sélectionnée              |
| `conversation_deleted` | Supprime de la liste ; efface la sélection si c'était la conversation supprimée |

Le handler `new_message` a un cas limite subtil. Quand un message arrive pour une conversation pas encore dans la liste (nouveau visiteur), le composant demande au serveur de rafraîchir plutôt que de construire un objet partiel :

```typescript
const exists = prev.some((c) => c.id === data.conversation_id);
if (!exists) {
  subscriptionRef.current?.perform("list_conversations");
  return prev;
}
```

Le pattern `selectedIdRef` du chapitre 3 apparaît aussi ici — le callback lit `selectedIdRef.current` pour décider s'il faut ajouter un message, sans recréer l'abonnement à chaque changement de conversation.

La sélection d'une conversation déclenche deux actions serveur via le même WebSocket :

```typescript
subscriptionRef.current?.perform("get_history", { conversation_id: id });
subscriptionRef.current?.perform("mark_read", { conversation_id: id });
```

Le compteur de non-lus est mis à zéro de manière optimiste côté client pendant que le serveur persiste le changement.

## Le pipeline Web Push

Les notifications push impliquent quatre parties : le navigateur admin, le frontend Next.js, le backend Rails, et un service push (Google FCM, Mozilla autopush). Vous ne vous inscrivez jamais auprès de ces services — les clés VAPID gèrent l'authentification.

### Enregistrement

Quand `AdminChat` se connecte, il s'inscrit aux notifications push. `registerPushNotifications` dans `src/components/AdminChat.tsx` fait quatre choses :

1. Enregistre le service worker (`/sw-chat.js`)
2. Demande la permission de notification
3. S'abonne au service push avec la clé publique VAPID
4. Envoie `{ endpoint, p256dh, auth }` à Rails par POST

```typescript
// src/components/AdminChat.tsx
const registration = await navigator.serviceWorker.register("/sw-chat.js");
const permission = await Notification.requestPermission();
if (permission !== "granted") return;

const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
});

const json = subscription.toJSON();
await fetch(`${getChatHttpUrl()}/push_subscriptions`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  }),
});
```

Rails sauvegarde ces trois champs dans la table `push_subscriptions` — tout ce dont il a besoin pour envoyer des payloads chiffrés plus tard.

### Envoi d'une notification

Le déclencheur est dans `VisitorChannel#send_message` (chapitre 2). Après avoir broadcasté vers les deux flux, il vérifie la présence d'un WebSocket admin actif :

```ruby
# chat-server/app/channels/visitor_channel.rb
unless admin_connected?
  PushNotificationService.notify(conversation.visitor_name, content) rescue nil
end
```

`PushNotificationService` (`chat-server/app/services/push_notification_service.rb`) itère sur tous les abonnements sauvegardés et appelle `WebPush.payload_send` avec les identifiants VAPID. Si un abonnement retourne 410 Gone, il attrape `WebPush::ExpiredSubscription` et détruit l'enregistrement périmé.

### Clés VAPID

Une paire de clés publique/privée identifiant votre serveur auprès du service push. Générez-les avec :

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts k.public_key; puts k.private_key"
```

La clé publique va dans `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) et `chat-server/.env` (`VAPID_PUBLIC_KEY`). La clé privée reste uniquement côté backend.

## Le service worker

`public/sw-chat.js` fait 30 lignes avec deux écouteurs d'événements. `push` analyse le payload chiffré et appelle `showNotification`. `notificationclick` ferme la notification, essaie de donner le focus à un onglet `/admin/chats` existant, ou en ouvre un nouveau.

La propriété critique : un service worker s'exécute dans un thread séparé et persiste après la fermeture de l'onglet. C'est la raison fondamentale pour laquelle les notifications push fonctionnent quand l'admin n'est pas sur la page.

## La suite

La fonctionnalité fonctionne en local. Le chapitre 5 couvre le déploiement — comment Kamal 2 empaquète l'application Rails dans un conteneur Docker, l'envoie sur un VPS Hetzner, et configure le SSL, les secrets d'environnement et le CI GitHub Actions.

## A vous de jouer

### 1. Inspecter l'abonnement push

Ouvrez `/admin/chats` avec l'onglet Application des DevTools. Vérifiez les Service Workers pour `sw-chat.js` et Push Messaging pour les détails de l'abonnement.

<details>
<summary>Solution</summary>

Dans Chrome : DevTools > Application > Service Workers affiche `sw-chat.js` avec le statut "activated and is running". Sous Application > Storage > Push Messaging, l'abonnement affiche l'URL `endpoint` (pointant vers `fcm.googleapis.com` sur Chrome), plus les clés `p256dh` et `auth` correspondant à ce qui a été envoyé par POST à `/push_subscriptions`.

</details>

### 2. Renouveler les clés VAPID

Générez de nouvelles clés avec la commande Rails runner. Remplacez-les dans `.env.local` et `chat-server/.env`. Redémarrez les deux serveurs et vérifiez que le push fonctionne toujours. (Si vous ne mettez à jour qu'un seul côté, l'abonnement échoue avec une erreur de clé incompatible.)

<details>
<summary>Solution</summary>

```bash
cd chat-server
bundle exec rails runner "k = WebPush.generate_key; puts k.public_key; puts k.private_key"
```

Copiez la ligne 1 dans `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (`.env.local`) et `VAPID_PUBLIC_KEY` (`chat-server/.env`). Copiez la ligne 2 dans `VAPID_PRIVATE_KEY` (`chat-server/.env`). Redémarrez les deux serveurs. Le navigateur crée un nouvel abonnement push à la connexion car l'`applicationServerKey` a changé.

</details>

### 3. Inclure le nombre de messages dans les notifications

Modifiez `PushNotificationService` pour que le corps affiche le nombre de messages de la conversation.

<details>
<summary>Solution</summary>

Dans `chat-server/app/channels/visitor_channel.rb`, passez l'objet conversation :

```ruby
PushNotificationService.notify(conversation, content) rescue nil
```

Dans `chat-server/app/services/push_notification_service.rb` :

```ruby
def self.notify(conversation, message_content)
  payload = {
    title: "New message from #{conversation.visitor_name}",
    body: "#{message_content.truncate(100)} (#{conversation.messages.count} messages)",
    url: "/admin/chats"
  }.to_json
  # ... le reste inchangé
end
```

</details>

### 4. Ajouter un son de notification

Modifiez `public/sw-chat.js` pour que la notification push joue le son système.

<details>
<summary>Solution</summary>

Ajoutez `silent: false` aux options de notification dans l'écouteur `push` :

```javascript
self.registration.showNotification(data.title || "New message", {
  body: data.body || "",
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  data: { url: data.url || "/admin/chats" },
  silent: false,
})
```

`silent: false` est la valeur par défaut sur la plupart des plateformes — les notifications jouent déjà le son système sauf si `silent: true` est défini. Les sons personnalisés via la propriété `sound` ont un support navigateur inconsistant.

</details>

---
*Traduit par Claude*
