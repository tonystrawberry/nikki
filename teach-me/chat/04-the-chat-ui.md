# 04 — The chat UI

[src/components/CloneChat.tsx](../../src/components/CloneChat.tsx) is
the only client-side file in the feature. It owns three responsibilities:
local state for the conversation, posting to `/api/chat` and reading
the stream, and rendering Markdown deltas as they arrive. This chapter
walks through how it does each one.

## Why this has to be a Client Component

The file starts with:

```tsx
"use client";
```

That directive flips the component out of the Server Component default.
Without it, none of the following would work:

- `useState` / `useEffect` / `useRef` are React hooks that need a
  client-side React runtime.
- `fetch` against `/api/chat` would still work in a Server Component
  during render, but the response body would be consumed once on the
  server — not what we want.
- The streaming reader (`response.body.getReader()`) needs to live
  somewhere reactive so each delta can trigger a re-render.

The page wrapper [src/app/[locale]/chat/page.tsx](../../src/app/%5Blocale%5D/chat/page.tsx)
stays a Server Component and passes the locale plus the dictionary slice
down to `<CloneChat />` as props. That's the standard
Server-Component-loads-data, Client-Component-handles-interaction
pattern used throughout the codebase (see also
[src/components/PostList.tsx](../../src/components/PostList.tsx) and
[src/components/Header.tsx](../../src/components/Header.tsx)).

## State shape

```tsx
type ChatMessage = { role: "user" | "assistant"; content: string };

const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState("");
const [isStreaming, setIsStreaming] = useState(false);
const [error, setError] = useState<string | null>(null);
const scrollRef = useRef<HTMLDivElement | null>(null);
```

Four pieces of state, all stored locally. There's no `localStorage`,
no Redux, no server-side session. Reloading the page resets the
conversation — deliberate. A recruiter who refreshes probably wants a
clean slate, and we avoid the entire "what about PII" question that
persistent chat logs would raise.

`scrollRef` is the only non-state ref. It points at the scrollable
message container so we can pin the view to the bottom as new content
streams in:

```tsx
useEffect(() => {
  scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
}, [messages, isStreaming]);
```

This fires after every state change, which sounds wasteful but is
actually free — `scrollTo` is idempotent. The dependency on
`isStreaming` matters: when streaming ends, the last delta's render
might happen before the final scroll, so we re-scroll one more time.

## The send function — optimistic UI

```tsx
async function send() {
  const text = input.trim();
  if (!text || isStreaming) return;

  const next: ChatMessage[] = [...messages, { role: "user", content: text }];
  setMessages(next);
  setInput("");
  setError(null);
  setIsStreaming(true);

  let assistantText = "";
  setMessages([...next, { role: "assistant", content: "" }]);
  // ...
}
```

The "optimistic" move is on the last line: before the network even
opens, we push a blank assistant message into state. That's what
becomes the `…` placeholder while waiting for the first delta. As
deltas arrive, we overwrite this empty-string `content` field with the
accumulated text.

If we didn't pre-push, the UI would flash empty for the entire
time-to-first-token (~500ms-1s on Sonnet 4.6). The placeholder gives
the user immediate visual feedback that their message was received.

## Reading the stream

```tsx
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ locale, messages: next }),
});

if (!res.ok || !res.body) {
  const body = await res.text().catch(() => "");
  throw new Error(body || `HTTP ${res.status}`);
}

const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  assistantText += decoder.decode(value, { stream: true });
  setMessages([...next, { role: "assistant", content: assistantText }]);
}
```

Five things going on here:

1. **`res.body` is a `ReadableStream<Uint8Array>`.** It's the mirror of
   what [the API route](./03-the-streaming-api.md) returned.
2. **`.getReader()` gives a single consumer.** Once acquired, no other
   reader can grab the body — we own it until we close it.
3. **`TextDecoder` with `{ stream: true }`** is the magic flag. Without
   it, a chunk that ends mid-codepoint (e.g. half of `é` in UTF-8)
   would be silently replaced with `U+FFFD`. With it, the decoder
   buffers the partial bytes and joins them with the next chunk.
4. **Accumulate, don't replace.** We append to `assistantText` and
   re-set the state with the full text every iteration. React diffs
   the resulting tree; only the last bubble re-renders.
5. **No `await` between read and setState.** Each delta is rendered
   before we wait for the next one. That's what makes the text "type"
   on screen.

### Walkthrough: a single message, frame by frame

Suppose the user sends `"hi"` and Claude replies `"Hey there!"` in
three deltas. Here's what `messages` looks like at each tick:

| Tick | Trigger | `messages` |
|---|---|---|
| t0 | Initial state | `[]` |
| t1 | `setMessages(next)` (user push) | `[{user,"hi"}]` |
| t2 | `setMessages([...next, {assistant,""}])` (placeholder) | `[{user,"hi"}, {assistant,""}]` |
| t3 | First delta `"Hey"` arrives | `[{user,"hi"}, {assistant,"Hey"}]` |
| t4 | Second delta `" there"` | `[{user,"hi"}, {assistant,"Hey there"}]` |
| t5 | Third delta `"!"` | `[{user,"hi"}, {assistant,"Hey there!"}]` |
| t6 | `reader.read()` returns `done: true`, `setIsStreaming(false)` | (same content, isStreaming flips) |

Notice the placeholder at t2 — that's why you see `…` for a beat before
text starts flowing.

## Markdown rendering — and the trap we walked into

The bot returns Markdown (`**bold**`, links, lists). Plain
`<div>{content}</div>` would show the raw asterisks, so we use
`react-markdown`:

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
    a: ({ children, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer"
         className="text-primary underline underline-offset-2 hover:text-primary/80">
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    // ... ul, ol, li, code, pre, h1, h2, h3
  }}
>
  {m.content}
</ReactMarkdown>
```

There's a story behind the verbose `components` map. The first attempt
used Tailwind's typography plugin (`prose prose-sm prose-invert`) — but
this codebase doesn't ship the typography plugin. It has its own
`.prose` styles in [src/app/globals.css:109](../../src/app/globals.css#L109),
sized for blog-post bodies (1.125rem with generous line-height). Those
styles are completely wrong for a chat bubble.

So the choice was: install the typography plugin and add a second
`.prose` definition, or skip `prose` entirely and style elements
directly. Direct styling wins on two counts:

- No new dependency.
- The styles live next to the JSX, so when you tweak the chat appearance
  you don't have to wonder which CSS file controls it.

Cost: about 20 extra lines in the component. Fair trade.

### Why re-rendering markdown each delta is fine

You might worry that running `react-markdown` on every keystroke is
slow. It's not, because:

- The AST it parses is small (one bubble of maybe 200 chars).
- React's reconciliation diffs the resulting tree; unchanged subtrees
  don't repaint.
- The CPU cost is bounded by network speed — deltas arrive at 50-200ms
  intervals, plenty of time for a parse.

If the bubble were essay-length, this would change. The fix would be to
debounce re-renders to once per 50ms, or to render Markdown only after
streaming completes (showing plain text mid-stream). Neither is needed
for chat-sized responses.

## The Enter-to-send affordance

```tsx
function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}
```

Pure convention. `Enter` sends; `Shift+Enter` inserts a newline. Every
modern chat UI does this and the muscle memory cost of getting it wrong
is high. The `preventDefault` matters — without it, `Enter` would still
add a newline before send, leaving a stray `\n` in the input box.

## Error handling

```tsx
} catch (err) {
  const msg = err instanceof Error ? err.message : "Unknown error";
  setError(msg);
  setMessages(next);
}
```

On failure we **roll back** to `next` (the version without the empty
assistant placeholder) and show an error string under the messages.
The user's message stays in the conversation; they can edit input and
retry. The error message itself comes from either the route's JSON
error body (4xx/5xx before streaming starts) or the in-stream
`[error] ...` text (failures mid-stream — see [chapter 3](./03-the-streaming-api.md#errors-mid-stream)).

There's no automatic retry. For chat that's the right call — a 500
likely means "key isn't set" or "Anthropic is down", neither of which a
silent retry fixes.

## Decisions, alternatives

| Choice | Picked | Skipped | Why |
|---|---|---|---|
| State store | `useState` | Zustand / Redux | Four pieces of state, one component. Nothing to share. |
| Persistence | None | localStorage / IndexedDB | Recruiters don't expect a chat to survive a refresh, and persistence raises PII questions. |
| Stream reader | Native `ReadableStream` + `TextDecoder` | A streaming lib (`eventsource-parser`, `ai`) | The protocol is plain text — no framing to parse. Adding a library would be pure overhead. |
| Markdown | `react-markdown` with custom components | Typography plugin / dangerouslySetInnerHTML | No new global CSS, no XSS risk (react-markdown sanitises). |
| Optimistic UI | Pre-push empty assistant message | Show only after first delta | ~1s TTFT is too long to leave the user staring at a static screen. |

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Add a "Clear conversation" button that resets `messages` to `[]`.

   <details>
   <summary><b>Solution</b></summary>

   In [src/components/CloneChat.tsx](../../src/components/CloneChat.tsx),
   add a button next to the Send button:

   ```tsx
   <Button
     variant="outline"
     onClick={() => { setMessages([]); setError(null); }}
     disabled={isStreaming || messages.length === 0}
   >
     {dict.clear ?? "Clear"}
   </Button>
   ```

   Add `clear: "Clear"` (and translations) to the `chat` block in
   each [src/dictionaries/{fr,en,ja}.json](../../src/dictionaries/) plus
   the `Dictionary` interface in [src/lib/i18n-config.ts:179](../../src/lib/i18n-config.ts#L179).
   Notice: clearing state on the client also drops the server's prompt
   cache association — the next message pays a fresh cache write.
   </details>

2. Currently the placeholder is `"…"`. Replace it with a typing
   indicator (three animated dots) that only shows while streaming has
   produced zero characters.

   <details>
   <summary><b>Solution</b></summary>

   Replace the `m.content ? ... : isStreaming ? "…" : ""` branch with
   a small component:

   ```tsx
   function TypingDots() {
     return (
       <span className="inline-flex gap-1">
         <span className="h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
         <span className="h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
         <span className="h-1 w-1 rounded-full bg-current animate-bounce" />
       </span>
     );
   }
   ```

   Use `<TypingDots />` wherever `"…"` was. The condition stays the
   same: show only when `m.role === "assistant" && !m.content && isStreaming`.
   Tailwind's `animate-bounce` is built in.
   </details>

3. The bot occasionally outputs `<br>` or HTML. Find what `react-markdown`
   does with raw HTML by default and make it explicit.

   <details>
   <summary><b>Solution</b></summary>

   By default, `react-markdown` *strips* raw HTML — `<script>` and
   friends just disappear. That's good for safety. If you want to
   render *some* HTML (like `<br>`) you'd opt in with
   `rehype-raw`, but you'd also be re-introducing XSS risk for any
   model-emitted HTML. The current behaviour ("strip everything") is
   the right default. Worth knowing it exists when a future feature
   needs richer rendering.
   </details>

4. Cap the visible conversation to the last 10 messages without dropping
   them from the request body. (The bot should still see full history.)

   <details>
   <summary><b>Solution</b></summary>

   Change only the render loop, not the state:

   ```tsx
   {messages.slice(-10).map((m, i) => ( ... ))}
   ```

   `messages` itself still grows, so the next fetch sends the full
   array. This is a cosmetic trim — useful if a session has 50 turns
   and rendering all of them is visual clutter. To trim what the
   server sees, you'd `.slice(-10)` in the `body` of the fetch as
   well, at the cost of losing older context for the bot.
   </details>

5. Add a "Copy" button to each assistant message that copies its
   Markdown source to the clipboard.

   <details>
   <summary><b>Solution</b></summary>

   Inside the assistant bubble (`m.role === "assistant"` branch):

   ```tsx
   <button
     onClick={() => navigator.clipboard.writeText(m.content)}
     className="mt-1 text-xs text-muted-foreground hover:text-foreground"
   >
     Copy
   </button>
   ```

   You copy `m.content` (the Markdown source), not the rendered DOM —
   that way a paste into another tool preserves the formatting
   intent. The `navigator.clipboard` API works only in secure contexts
   (HTTPS or localhost), which the dev server satisfies.
   </details>

Next chapter is the operations chapter — how to test the pieces we
just walked through, and what it takes to put this in front of real
recruiters.
