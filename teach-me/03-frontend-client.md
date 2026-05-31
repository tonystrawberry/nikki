# Chapter 3: The Frontend Client

The Rails server from chapter 2 broadcasts JSON over WebSockets. This chapter covers the TypeScript layer that consumes it: the ActionCable client wrapper, the type system for channel data, the ChatWidget lifecycle, and a `useRef` pattern that took an embarrassing number of hours to get right.

## The ActionCable client layer

**File:** `src/lib/chat-client.ts`

This module sits between React and the Rails WebSocket server. Two module-level singletons ensure exactly one connection per role:

```typescript
let visitorConsumer: Consumer | null = null;
let adminConsumer: Consumer | null = null;
```

`createConsumer` opens the WebSocket. The visitor authenticates via query parameter (`createConsumer(\`${WS_URL}?token=${sessionToken}\`)`), while the admin authenticates via session cookie -- no token, just the cookie set by `adminLogin`. Every `fetch` call to the Rails server uses `credentials: "include"`, which is required for the browser to send and receive cookies cross-origin. This applies to both REST calls and the WebSocket upgrade handshake.

`subscribeVisitorChannel` and `subscribeAdminChannel` wrap `consumer.subscriptions.create` with typed callbacks, accepting a `received` function typed to the appropriate channel data union.

### The missing type declarations

`@rails/actioncable` ships with zero TypeScript declarations. The project includes hand-written types at `src/types/actioncable.d.ts` -- a `declare module` defining `Consumer`, `Subscription`, `CreateMixin`, and `createConsumer`. Without this file, `npm run build` fails. The types are minimal: we only declare what we call.

## Type-safe channel data

**File:** `src/lib/chat-types.ts`

Channel data uses discriminated unions keyed on a `type` field:

```typescript
export type VisitorChannelData =
  | { type: "history"; conversation: { id: number; visitor_name: string }; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "error"; error: string };
```

In a `switch (data.type)`, TypeScript narrows automatically -- inside `case "history":`, `data.messages` exists and is `ChatMessage[]`. `AdminChannelData` follows the same pattern with five variants (`conversations`, `new_message`, `history`, `conversation_deleted`, `error`).

These types mirror the JSON structures from the Rails channels (chapter 2). No code generation -- you keep them in sync manually, and the compiler catches mismatches at build time.

## ChatWidget lifecycle

**File:** `src/components/ChatWidget.tsx`

The widget has three states:

| State | `isOpen` | `hasName` | WebSocket | UI |
|-------|----------|-----------|-----------|-----|
| Closed | `false` | -- | None | Floating button |
| Open, no name | `true` | `false` | None | Name input form |
| Open, chatting | `true` | `true` | Connected | ChatPanel with messages |

The WebSocket connection exists only in state 3, enforced by the guard at the top of the subscription effect:

```typescript
useEffect(() => {
  if (!isOpen || !hasName) return;
  const sub = subscribeVisitorChannel(tokenRef.current, { received, connected, disconnected });
  return () => { sub.unsubscribe(); disconnectVisitor(); };
}, [isOpen, hasName]);
```

Session identity is a UUID in `localStorage`:

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

This maps 1:1 to a `Conversation` via `find_or_create_by!(session_token:)` (chapter 2). Same token = same conversation across page refreshes. The visitor's name is persisted separately so the name form is skipped on return visits.

On connect, the server transmits a `"history"` event. The `"message"` handler uses deduplication (`prev.some(m => m.id === data.message.id)`) to prevent double-rendering when ActionCable retransmits after a brief disconnect.

## The useRef trap

This is the hardest bug in the codebase. Without the fix:

```
1. useEffect runs → creates subscription
2. Message arrives → received() calls setMessages()
3. Re-render. isOpen is still true but is a new closure reference
4. Effect cleanup runs → effect re-runs → new subscription
5. Server sends history → setMessages() → re-render → goto 4
```

The Rails server logs flood with connect/disconnect pairs. The fix: a ref that tracks `isOpen` without participating in the dependency array:

```typescript
const isOpenRef = useRef(isOpen);
useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
```

Inside the `received` callback, read `isOpenRef.current` instead of `isOpen`. The ref gives you the latest value without forcing the subscription effect to re-run.

The same pattern appears in `src/components/AdminChat.tsx` with `selectedIdRef` -- the admin's callback needs the selected conversation ID to decide whether to append messages to the visible list, without re-subscribing every time the user clicks a different conversation.

The rule: if a callback inside `useEffect` needs a value that changes frequently, but the effect itself should not re-run on that change, use a ref.

## ChatPanel -- the shared message component

**File:** `src/components/ChatPanel.tsx`

ChatPanel is a presentational component used by both the visitor widget and the admin dashboard. It receives `messages`, `onSendMessage`, and `isConnected` as props. It has no idea which side it represents.

Auto-scroll uses a hidden `<div ref={messagesEndRef} />` at the bottom of the message list, scrolled into view via `useEffect` whenever `messages` changes. Message alignment is determined by `msg.sender` -- visitor messages go right, admin messages go left. In AdminChat, the same logic is inverted. The parent controls perspective.

---

The visitor side is now wired end to end -- from the floating button through the WebSocket subscription to message rendering. Chapter 4 covers the admin experience: how the admin dashboard manages multiple conversations over a single WebSocket, and how Web Push notifications alert the admin when they are away from the browser.

## Try it out

**Exercise 1: Verify session isolation**

Open the chat widget in two browsers (or regular + incognito). Send messages from both. In a Rails console, run `Conversation.last(2)` and confirm two records with different `session_token` values.

<details>
<summary>Solution</summary>

```ruby
Conversation.last(2).pluck(:id, :session_token, :visitor_name)
# => [[2, "a1b2c3...", "Alice"], [1, "d4e5f6...", "Bob"]]
```

Each browser generated its own UUID via `crypto.randomUUID()`, stored in its own `localStorage`.

</details>

**Exercise 2: Add a typing indicator type**

In `src/lib/chat-types.ts`, add `| { type: "typing"; is_typing: boolean }` to `VisitorChannelData`. Handle it in `ChatWidget.tsx`'s switch statement by showing "Tony is typing..." when active.

<details>
<summary>Solution</summary>

Add state (`const [isTyping, setIsTyping] = useState(false)`) and a case:

```typescript
case "typing":
  setIsTyping(data.is_typing);
  break;
```

Render conditionally: `{isTyping && <p className="text-xs text-muted-foreground px-3 py-1">Tony is typing...</p>}`. No server changes needed -- TypeScript is satisfied and you can test via the browser console.

</details>

**Exercise 3: Break the useRef pattern**

Remove the `isOpenRef` declaration and its sync effect from `ChatWidget.tsx`. Replace `isOpenRef.current` with `isOpen` in the received callback. Open the widget, send a message, and watch the Rails server logs flood with connect/disconnect pairs. Then revert.

<details>
<summary>Solution</summary>

Delete the ref and its sync effect, then change the callback to read `isOpen` directly. In `chat-server/log/development.log`, you will see rapid cycling:

```
VisitorChannel is transmitting the subscription confirmation
VisitorChannel stopped streaming
```

Each cycle creates a subscription, sends history, updates state, re-renders, tears down, and recreates. Revert to stop it.

</details>

**Exercise 4: sessionStorage vs localStorage**

Change `getSessionToken` to use `sessionStorage`. Open the chat, send a message, close the tab, reopen it. Your conversation history is gone.

<details>
<summary>Solution</summary>

Replace `localStorage` with `sessionStorage` in both the `getItem` and `setItem` calls. `sessionStorage` is scoped to the tab -- closing it destroys the token. A new UUID is generated on reopen, creating a new `Conversation` with no messages. The original uses `localStorage` because it persists across tabs and browser restarts.

</details>
