# 01 — Architecture of the digital-clone chat

The blog at `/[locale]/chat` lets recruiters chat with an AI that talks
like Tony. There's no vector database, no Rails server, no background
queue. The whole feature lives in four files and one directory of
Markdown. This chapter lays out the moving pieces so the next chapters
can go deep on each one without losing the shape.

## Three concepts to keep in your head

Before reading any code, hold these three ideas:

1. **The "context" is assembled on the server, fresh per request.** There
   is no embedding index. Every API call rebuilds the system prompt
   from two on-disk sources — a curated persona file and a digest of
   blog post metadata — and ships the whole thing to Anthropic.
2. **Responses stream.** The browser opens a `fetch` and reads the body
   as it arrives, character by character. The API route translates the
   Anthropic SDK's async iterator into a `ReadableStream` of UTF-8 text.
3. **Prompt caching makes #1 affordable.** The system prompt is ~15–20K
   tokens. Tagging it with `cache_control: { type: 'ephemeral' }` means
   the first message of a session pays the full write cost (~1.25× input
   price) and every subsequent turn pays ~0.1×.

If those three click, the rest is plumbing.

## The four files

| File | Role |
|---|---|
| [content/persona/{fr,en,ja}.md](../../content/persona/) | Source of truth for recruiter-facing facts. Hand-curated. |
| [src/lib/clone-context.ts](../../src/lib/clone-context.ts) | Server-only. Reads the persona + blog post metadata, returns one big system prompt string. |
| [src/app/api/chat/route.ts](../../src/app/api/chat/route.ts) | Streaming `POST /api/chat`. Validates input with Zod, calls Claude, streams text deltas back. |
| [src/components/CloneChat.tsx](../../src/components/CloneChat.tsx) | Client component. Manages messages state, posts to `/api/chat`, reads the stream, renders Markdown. |

Plus the page wrapper [src/app/[locale]/chat/page.tsx](../../src/app/[locale]/chat/page.tsx)
which is just a Server Component that loads the dictionary and renders
`<CloneChat />`.

## What happens when you press Enter

ASCII flow of one user message:

```
Browser                          Next.js (Node runtime)             Anthropic
-------                          -----------------------            ---------
[user types text]
[click Send]
  │
  │ POST /api/chat
  │ { locale, messages: [...] }
  ├──────────────────────────────►
                                 BodySchema.parse(...)            (Zod validates shape)
                                 buildSystemPrompt(locale)
                                   ├─ readPersona(locale)         (fs.readFileSync)
                                   └─ formatPostsDigest(locale)   (getAllPosts -> map)
                                 client.messages.stream({
                                   model: 'claude-sonnet-4-6',
                                   system: [{ text, cache_control }],
                                   messages,
                                 })
                                                                  ├────────────►
                                                                  │ streams events
                                                                  ◄────────────┤
                                 for await (event of stream):
                                   if text_delta:
                                     controller.enqueue(bytes)
  ◄──────────────────────────────┤
  (TextDecoder reads chunks)
  setMessages(...latest text)
  ReactMarkdown re-renders
[user sees text growing]
```

Two things to notice. First, the Anthropic call doesn't go through the
browser — the API key never reaches the client. Second, every render
of the assistant bubble re-parses the partial Markdown. That's fine
because the messages are short; if they were essay-length we'd buffer.

## Repo layout for this feature

```
content/persona/
  en.md           ← recruiter brief, edit this
  fr.md
  ja.md

src/
  app/
    [locale]/
      chat/
        page.tsx       ← Server Component, renders CloneChat
    api/
      chat/
        route.ts       ← POST handler, Node runtime, streams text/plain
  components/
    CloneChat.tsx      ← "use client", state + fetch + Markdown render
  lib/
    clone-context.ts   ← buildSystemPrompt, server-only

src/dictionaries/{fr,en,ja}.json   ← chat.placeholder, chat.send, etc.
.env.local.example                  ← ANTHROPIC_API_KEY=...
```

The split between `app/api/chat/` and `app/[locale]/chat/` matters: the
API route is **not** behind the `[locale]` segment, so the client posts
to `/api/chat` regardless of which locale the recruiter is browsing.
The locale is passed in the request body, not the URL.

## Why this shape, not something fancier

We rejected several alternatives. Worth knowing what they are so you can
pick differently when it matters:

| Choice | What we picked | What we skipped | Why |
|---|---|---|---|
| Backend language | Next.js API route (TypeScript) | Rails service | One deploy target, no CORS, no second auth boundary. |
| Knowledge retrieval | Stuff persona + post digest into system prompt | RAG with pgvector | 80 posts × ~250 tokens of excerpt = ~20K tokens. Prompt caching makes it cheap. RAG would add a database and a re-indexing job for a personal blog. |
| Response transport | `ReadableStream` of plain text | Server-Sent Events | Both work. Plain text is one fewer protocol to debug; the Anthropic deltas are already plain text. |
| Conversation state | Sent on every request from the client | Server-side session store | Stateless server, no DB writes, recruiter can refresh and start over. Loses cross-tab continuity, which we don't need. |
| Markdown rendering | `react-markdown` on the client | Render to HTML on the server | Streaming HTML chunks is annoying to do safely; rendering on the client re-parses tiny strings each delta, which is fine for chat. |

The trade-off thread running through all of these is "personal blog with
low traffic" — for a product chatbot with thousands of recruiters you'd
likely flip three of those four (real RAG, server state, SSE).

## A note on environment

You need an Anthropic API key:

```bash
cp .env.local.example .env.local
# paste your key into ANTHROPIC_API_KEY
npm run dev
# open http://localhost:3000/en/chat
```

Without the key, the page still renders — the API route returns
`500 ANTHROPIC_API_KEY is not configured.` and the chat UI shows the
error. Useful: it means the chat is opt-in for contributors and doesn't
block the rest of the site in dev.

The rest of these chapters assume `npm run dev` is running on port 3000.
Chapter 5 covers the deployment story.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Find the four files that make up this feature without grepping. Open
   each in your editor.

   <details>
   <summary><b>Solution</b></summary>

   They are listed in the table above, but from a fresh checkout you
   can also discover them by following imports:

   - Start at [src/app/[locale]/chat/page.tsx](../../src/app/%5Blocale%5D/chat/page.tsx) — it imports `CloneChat`.
   - `CloneChat.tsx` posts to `/api/chat` — that's [src/app/api/chat/route.ts](../../src/app/api/chat/route.ts).
   - `route.ts` imports `buildSystemPrompt` from [src/lib/clone-context.ts](../../src/lib/clone-context.ts).
   - `clone-context.ts` reads `content/persona/{locale}.md`.

   Following imports is how the *real* dependency graph reveals itself —
   the file tree alone won't tell you the persona files are load-bearing.
   </details>

2. Send one message in the chat and open DevTools → Network → `/api/chat`.
   Note the response's `content-type` and watch the body stream in.

   <details>
   <summary><b>Solution</b></summary>

   ```bash
   npm run dev
   # then in the browser, open http://localhost:3000/en/chat, send "hello",
   # open DevTools → Network → click the chat request → Response tab
   ```

   You'll see `content-type: text/plain; charset=utf-8` and the body
   filling in as deltas arrive — this is the `ReadableStream` from
   [src/app/api/chat/route.ts:73](../../src/app/api/chat/route.ts#L73)
   being consumed by the browser. That stream is concept #2 from the
   top of this chapter, made visible.
   </details>

3. Open [content/persona/en.md](../../content/persona/en.md), change
   your name to `Tony "Strawberry" Duong`, save, and ask the chat
   "what's your full name?" Without restarting the dev server, does it
   pick up the change?

   <details>
   <summary><b>Solution</b></summary>

   Yes, immediately. The persona is read with `fs.readFileSync` on
   every request (see [src/lib/clone-context.ts:11](../../src/lib/clone-context.ts#L11)),
   not at build time. This is concept #1 — the context is assembled
   per-request, not baked into a static bundle. Trade-off: tiny extra
   I/O per request, in exchange for live editing.
   </details>

4. Find where the locale travels from the browser to the system prompt.
   List every hop.

   <details>
   <summary><b>Solution</b></summary>

   1. [src/app/[locale]/chat/page.tsx](../../src/app/%5Blocale%5D/chat/page.tsx)
      awaits `params` and passes `locale` to `<CloneChat locale={locale} />`.
   2. [src/components/CloneChat.tsx](../../src/components/CloneChat.tsx)
      sends `JSON.stringify({ locale, messages: next })` in the fetch body.
   3. [src/app/api/chat/route.ts:14](../../src/app/api/chat/route.ts#L14)
      validates it via `BodySchema.parse(...)`.
   4. [src/lib/clone-context.ts](../../src/lib/clone-context.ts)'s
      `buildSystemPrompt(locale)` uses it to (a) pick the persona file,
      (b) pick the role line in the right language, (c) instruct Claude
      to reply in that language.

   The locale never appears in the URL of the API route — it lives in
   the body. That's a deliberate choice so we don't have to think about
   per-locale rate limiting, caching, or routing.
   </details>

Next chapter zooms in on the context layer — how `buildSystemPrompt`
turns 80 blog posts plus a Markdown file into the prompt that Claude
actually sees.
