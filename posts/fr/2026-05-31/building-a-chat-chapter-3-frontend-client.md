---
title: "Construire un Chat : Chapitre 3 — Le client frontend"
date: "2026-05-31"
excerpt: "Client ActionCable en TypeScript, unions discriminées pour les données des channels, cycle de vie WebSocket en React, et le piège useRef qui empêche les reconnexions infinies."
author: "Tony Duong"
category: "note"
tags: ["typescript", "react", "actioncable", "nextjs", "websockets"]
coverImage: ""
collection: "building-a-chat"
collectionOrder: 3
collectionTitle: "Construire un Chat en Temps Réel"
---

Le serveur Rails du chapitre 2 broadcast du JSON via WebSockets. Ce chapitre couvre la couche TypeScript qui le consomme : le wrapper du client ActionCable, le système de types pour les données de channel, le cycle de vie du ChatWidget, et un pattern `useRef` qui a pris un nombre embarrassant d'heures à résoudre.

## La couche client ActionCable

**Fichier :** `src/lib/chat-client.ts`

Ce module se situe entre React et le serveur WebSocket Rails. Deux singletons au niveau du module garantissent exactement une connexion par rôle :

```typescript
let visitorConsumer: Consumer | null = null;
let adminConsumer: Consumer | null = null;
```

`createConsumer` ouvre le WebSocket. Le visiteur s'authentifie via un paramètre de requête (`createConsumer(\`${WS_URL}?token=${sessionToken}\`)`), tandis que l'admin s'authentifie via un cookie de session — pas de token, juste le cookie défini par `adminLogin`. Chaque appel `fetch` vers le serveur Rails utilise `credentials: "include"`, ce qui est requis pour que le navigateur envoie et reçoive les cookies en cross-origin. Cela s'applique à la fois aux appels REST et au handshake d'upgrade WebSocket.

`subscribeVisitorChannel` et `subscribeAdminChannel` encapsulent `consumer.subscriptions.create` avec des callbacks typés, acceptant une fonction `received` typée selon l'union de données du channel approprié.

### Les déclarations de types manquantes

`@rails/actioncable` est livré avec zéro déclaration TypeScript. Le projet inclut des types écrits à la main dans `src/types/actioncable.d.ts` — un `declare module` définissant `Consumer`, `Subscription`, `CreateMixin`, et `createConsumer`. Sans ce fichier, `npm run build` échoue. Les types sont minimaux : nous ne déclarons que ce que nous appelons.

## Données de channel type-safe

**Fichier :** `src/lib/chat-types.ts`

Les données de channel utilisent des unions discriminées basées sur un champ `type` :

```typescript
export type VisitorChannelData =
  | { type: "history"; conversation: { id: number; visitor_name: string }; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "error"; error: string };
```

Dans un `switch (data.type)`, TypeScript rétrécit le type automatiquement — dans `case "history":`, `data.messages` existe et est de type `ChatMessage[]`. `AdminChannelData` suit le même pattern avec cinq variants (`conversations`, `new_message`, `history`, `conversation_deleted`, `error`).

Ces types reflètent les structures JSON des channels Rails (chapitre 2). Pas de génération de code — vous les maintenez synchronisés manuellement, et le compilateur détecte les incohérences au moment du build.

## Cycle de vie du ChatWidget

**Fichier :** `src/components/ChatWidget.tsx`

Le widget a trois états :

| État | `isOpen` | `hasName` | WebSocket | Interface |
|-------|----------|-----------|-----------|-----|
| Fermé | `false` | -- | Aucun | Bouton flottant |
| Ouvert, sans nom | `true` | `false` | Aucun | Formulaire de saisie du nom |
| Ouvert, en conversation | `true` | `true` | Connecté | ChatPanel avec les messages |

La connexion WebSocket n'existe qu'à l'état 3, garantie par la condition en haut de l'effet d'abonnement :

```typescript
useEffect(() => {
  if (!isOpen || !hasName) return;
  const sub = subscribeVisitorChannel(tokenRef.current, { received, connected, disconnected });
  return () => { sub.unsubscribe(); disconnectVisitor(); };
}, [isOpen, hasName]);
```

L'identité de session est un UUID dans le `localStorage` :

```typescript
function getSessionToken(): string {
  let token = localStorage.getItem("chat_session_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("chat_session_token", token);
  }
  return token;
}
```

Cela correspond 1:1 à une `Conversation` via `find_or_create_by!(session_token:)` (chapitre 2). Même token = même conversation entre les rafraîchissements de page. Le nom du visiteur est persisté séparément pour que le formulaire de nom soit sauté lors des visites suivantes.

À la connexion, le serveur transmet un événement `"history"`. Le handler `"message"` utilise la déduplication (`prev.some(m => m.id === data.message.id)`) pour empêcher le double rendu quand ActionCable retransmet après une brève déconnexion.

## Le piège useRef

C'est le bug le plus difficile de la base de code. Sans le correctif :

```
1. useEffect s'exécute → crée l'abonnement
2. Un message arrive → received() appelle setMessages()
3. Re-render. isOpen est toujours true mais c'est une nouvelle référence de closure
4. Le cleanup de l'effet s'exécute → l'effet se relance → nouvel abonnement
5. Le serveur envoie l'historique → setMessages() → re-render → retour à 4
```

Les logs du serveur Rails se remplissent de paires connect/disconnect. Le correctif : une ref qui suit `isOpen` sans participer au tableau de dépendances :

```typescript
const isOpenRef = useRef(isOpen);
useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
```

Dans le callback `received`, lisez `isOpenRef.current` au lieu de `isOpen`. La ref vous donne la dernière valeur sans forcer l'effet d'abonnement à se relancer.

Le même pattern apparaît dans `src/components/AdminChat.tsx` avec `selectedIdRef` — le callback de l'admin a besoin de l'ID de conversation sélectionnée pour décider s'il faut ajouter un message à la liste visible, sans recréer l'abonnement chaque fois que l'utilisateur clique sur une conversation différente.

La règle : si un callback dans `useEffect` a besoin d'une valeur qui change fréquemment, mais que l'effet lui-même ne doit pas se relancer sur ce changement, utilisez une ref.

## ChatPanel — le composant de messages partagé

**Fichier :** `src/components/ChatPanel.tsx`

ChatPanel est un composant de présentation utilisé à la fois par le widget visiteur et le tableau de bord admin. Il reçoit `messages`, `onSendMessage`, et `isConnected` en props. Il n'a aucune idée du côté qu'il représente.

Le défilement automatique utilise un `<div ref={messagesEndRef} />` caché en bas de la liste de messages, scrollé dans la vue via `useEffect` chaque fois que `messages` change. L'alignement des messages est déterminé par `msg.sender` — les messages du visiteur vont à droite, les messages de l'admin à gauche. Dans AdminChat, la même logique est inversée. Le parent contrôle la perspective.

---

Le côté visiteur est maintenant câblé de bout en bout — du bouton flottant à travers l'abonnement WebSocket jusqu'au rendu des messages. Le chapitre 4 couvre l'expérience admin : comment le tableau de bord admin gère plusieurs conversations sur un seul WebSocket, et comment les notifications Web Push alertent l'admin quand il est absent du navigateur.

## A vous de jouer

**Exercice 1 : Vérifier l'isolation des sessions**

Ouvrez le widget de chat dans deux navigateurs (ou normal + navigation privée). Envoyez des messages depuis les deux. Dans une console Rails, exécutez `Conversation.last(2)` et confirmez que deux enregistrements ont des valeurs `session_token` différentes.

<details>
<summary>Solution</summary>

```ruby
Conversation.last(2).pluck(:id, :session_token, :visitor_name)
# => [[2, "a1b2c3...", "Alice"], [1, "d4e5f6...", "Bob"]]
```

Chaque navigateur a généré son propre UUID via `crypto.randomUUID()`, stocké dans son propre `localStorage`.

</details>

**Exercice 2 : Ajouter un type d'indicateur de frappe**

Dans `src/lib/chat-types.ts`, ajoutez `| { type: "typing"; is_typing: boolean }` à `VisitorChannelData`. Gérez-le dans le switch de `ChatWidget.tsx` en affichant "Tony est en train d'écrire..." quand c'est actif.

<details>
<summary>Solution</summary>

Ajoutez un état (`const [isTyping, setIsTyping] = useState(false)`) et un case :

```typescript
case "typing":
  setIsTyping(data.is_typing);
  break;
```

Affichez conditionnellement : `{isTyping && <p className="text-xs text-muted-foreground px-3 py-1">Tony est en train d'écrire...</p>}`. Aucune modification serveur nécessaire — TypeScript est satisfait et vous pouvez tester via la console du navigateur.

</details>

**Exercice 3 : Casser le pattern useRef**

Supprimez la déclaration `isOpenRef` et son effet de synchronisation de `ChatWidget.tsx`. Remplacez `isOpenRef.current` par `isOpen` dans le callback received. Ouvrez le widget, envoyez un message, et observez les logs du serveur Rails se remplir de paires connect/disconnect. Puis revertez.

<details>
<summary>Solution</summary>

Supprimez la ref et son effet de synchronisation, puis changez le callback pour lire `isOpen` directement. Dans `chat-server/log/development.log`, vous verrez un cycle rapide :

```
VisitorChannel is transmitting the subscription confirmation
VisitorChannel stopped streaming
```

Chaque cycle crée un abonnement, envoie l'historique, met à jour l'état, re-render, détruit, et recrée. Revertez pour arrêter.

</details>

**Exercice 4 : sessionStorage vs localStorage**

Changez `getSessionToken` pour utiliser `sessionStorage`. Ouvrez le chat, envoyez un message, fermez l'onglet, rouvrez-le. Votre historique de conversation a disparu.

<details>
<summary>Solution</summary>

Remplacez `localStorage` par `sessionStorage` dans les appels `getItem` et `setItem`. `sessionStorage` est limité à l'onglet — le fermer détruit le token. Un nouvel UUID est généré à la réouverture, créant une nouvelle `Conversation` sans messages. La version originale utilise `localStorage` car il persiste entre les onglets et les redémarrages du navigateur.

</details>

---
*Traduit par Claude*
