# 04 — Retrieval and prompt wiring

Build time is done; the index sits in `data/embeddings/`. This chapter is
the request-time half: [src/lib/rag.ts](../../src/lib/rag.ts) finds the
relevant chunks, and the changes to
[clone-context.ts](../../src/lib/clone-context.ts) and
[route.ts](../../src/app/api/chat/route.ts) splice them into the prompt
Claude sees — without breaking the prompt caching the clone-chat feature
depends on.

## Loading the index once

`loadIndex(locale)` reads the `.json` (metadata + chunk text) and the
`.bin` (vectors), and caches the result in a module-scope `Map`. Module
scope means "once per process": the first request for a locale pays the
file read, every later request reuses the parsed index. On a warm server
that's effectively free.

The one sharp edge is turning the file bytes into a `Float32Array`:

```ts
const buf = fs.readFileSync(binPath);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const vectors = new Float32Array(ab);
```

Why the `.slice` instead of `new Float32Array(buf.buffer)` directly?
Node's `Buffer` for a small read can be a *view* into a larger pooled
`ArrayBuffer`, starting at an arbitrary `byteOffset`. `Float32Array`
requires its backing offset to be a multiple of 4, so constructing one
directly on the pooled buffer can throw `RangeError: start offset must be
a multiple of 4`. Slicing copies the exact bytes into a fresh, aligned
`ArrayBuffer`. It's a classic "works on my machine until the file size
changes" trap; the slice makes it deterministic.

If either file is missing, `loadIndex` caches `null` and returns it — the
graceful-degradation path from chapter 1.

## Cosine similarity, brute force

```ts
for (let i = 0; i < chunks.length; i++) {
  const base = i * dim;
  let dot = 0;
  for (let d = 0; d < dim; d++) dot += vectors[base + d] * queryVec[d];
  scores[i] = { i, score: dot };
}
scores.sort((a, b) => b.score - a.score);
return scores.slice(0, k).map(...);
```

That's the entire search. Two things make it correct and fast:

- **It's a dot product, not a full cosine formula.** Both the stored
  vectors (build time) and the query vector (`normalize(...)` here) are
  unit length, and for unit vectors `cosine == dot product`. The
  normalization we did once at ingestion is what lets the hot loop skip
  computing magnitudes.
- **Brute force is fine here.** A few thousand chunks × 1024 dims is a
  few million multiply-adds — sub-millisecond. No index structure, no
  database, nothing to keep in sync. The function signature is the
  abstraction boundary: the day brute force is too slow (tens of
  thousands of chunks), you swap the loop for sqlite-vec or an ANN index
  behind the same `retrieve()` and nothing else changes.

`retrieve()` is also wrapped so that an embedding failure (network, bad
key) logs and returns `[]` rather than throwing. Retrieval is best-effort;
it must never take down the chat.

## Splicing into the prompt — without killing the cache

Here's the part that required care. The clone-chat feature caches its big
system prompt with `cache_control: { type: 'ephemeral' }`, so follow-up
turns are cheap. But RAG context **changes every question** — if we
appended it to the cached block, we'd bust the cache on every turn and pay
full price each time.

The fix: **two system blocks.**

```ts
const system: Anthropic.TextBlockParam[] = [
  { type: 'text', text: stableSystem, cache_control: { type: 'ephemeral' } }, // cached
  ...(retrievedContext ? [{ type: 'text' as const, text: retrievedContext }] : []), // per-query
];
```

Anthropic caches a *prefix*. The stable block (persona + lightweight post
index) sits first and carries the cache breakpoint, so it's reused across
turns. The retrieved block comes after the breakpoint, so it can vary
freely without invalidating the cached prefix. Best of both: stable
context stays cheap, fresh context stays fresh.

```
system: [
  ┌──────────────────────────────────────────┐
  │ STABLE  (persona + post digest)           │ ← cache_control: ephemeral
  │ same every turn → served from cache        │   (the cached prefix)
  └──────────────────────────────────────────┘
  ┌──────────────────────────────────────────┐
  │ RETRIEVED (top-k chunks for THIS question)│ ← no cache_control
  │ different every turn → always fresh        │   (after the breakpoint)
  └──────────────────────────────────────────┘
]
```

### What changed in clone-context.ts

`buildSystemPrompt` lost the old `formatFullBodyCollections` call — the
bit that stuffed entire `career-story` chapters into the prompt. RAG
covers that depth now (those chapters are in the index like everything
else), and stuffing full bodies was exactly the thing that didn't scale.
In its place, `formatRetrievedContext(chunks)` renders the retrieved
sections, each tagged with `(source: /posts/{slug})` so the clone can cite
a real link, and returns `''` when there's nothing — which keeps the
second system block absent entirely on the degraded path.

The digest stayed. That's the **hybrid** from chapter 1: digest for
breadth, retrieval for depth.

### What changed in route.ts

```ts
const lastUser = [...body.messages].reverse().find((m) => m.role === 'user');
const retrieved = lastUser ? await retrieve(locale, lastUser.content) : [];
```

We retrieve against the **latest user message**. Simple and good enough;
note the trade-off in the exercises. Then build the two-block `system` and
stream exactly as before — the streaming machinery from clone-chat
chapter 3 is untouched.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. With the index built, add a temporary log of the retrieved chunks in
   the route and ask the chat a specific question. Do the top hits make
   sense?

   <details>
   <summary><b>Solution</b></summary>

   Temporarily add `console.log(retrieved.map(c => [c.slug, c.heading, c.score.toFixed(3)]))`
   after the `retrieve(...)` call in
   [route.ts](../../src/app/api/chat/route.ts), run `npm run dev`, and ask
   "what did you learn about message queues?". The server console should
   list the message-queue post's sections at the top with the highest
   scores. Remove the log when done.
   </details>

2. We only embed the *latest* user message. Describe a conversation where
   that retrieves the wrong thing, and a fix.

   <details>
   <summary><b>Solution</b></summary>

   User: "Tell me about the happiness video." → good retrieval. Then:
   "What did the study say about aging?" — "aging" alone might under-rank
   the right chunk because the topic (that specific video) lives in the
   prior turn. Fixes: embed the last 2-3 user turns concatenated, or do a
   cheap "query rewrite" with Claude (fold context into a standalone
   question) before embedding. For a low-traffic clone, latest-message
   retrieval is usually fine; this is the first knob to turn if answers
   feel context-blind.
   </details>

3. Confirm the cache still works after adding the second system block.
   How would you verify from the API response?

   <details>
   <summary><b>Solution</b></summary>

   The Anthropic streaming response exposes usage with
   `cache_creation_input_tokens` and `cache_read_input_tokens`. On the
   second message of a session, `cache_read_input_tokens` should be large
   (the stable block was read from cache) while the retrieved block shows
   up as normal input tokens. If `cache_read` is ~0 on every turn, the
   stable block isn't being cached — check that it's first in the array
   and carries `cache_control`.
   </details>

Final chapter: the money and the deploy — what this costs, how it scales
to 1000 posts, and how the committed index ships to production.
