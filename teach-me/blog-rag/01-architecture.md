# 01 — Architecture of the blog RAG

The digital-clone chat from the `clone-chat` teach-me set had one
deliberate limitation. Re-read its chapter 1 and you'll find this line in
the "why this shape" table:

> Knowledge retrieval — **What we picked:** stuff persona + post digest
> into the system prompt. **What we skipped:** RAG with pgvector. **Why:**
> 80 posts × ~250 tokens of excerpt = ~20K tokens. Prompt caching makes
> it cheap.

This feature is the sequel that flips that decision — and it's worth
understanding *why now*, because "we skipped RAG on purpose" was the
right call at 80 posts and the wrong call at 300+.

## The problem RAG actually solves here

The clone never sent post *bodies* (except the `career-story` collection,
whose full text it stuffed). It sent a **digest**: one line per post of
title + date + tags + excerpt. So if a recruiter asked "what did Tony
conclude about message queues?", the model only had the *excerpt* of that
post — it could name the article and paraphrase one sentence, but it
couldn't go deep.

That's lossy by design, and it gets worse as you write more:

| Corpus | Digest-only prompt | Can it answer in depth? |
|---|---|---|
| 80 posts | ~20K tokens | Only for `career-story` (full text stuffed) |
| 300 posts | ~50K tokens | Same — still no bodies |
| 1000 posts | ~120K+ tokens | Prompt bloats; still no bodies; full-body stuffing would blow the window |

RAG decouples answer quality from library size: instead of shipping the
whole library every request, **retrieve the handful of post sections
relevant to *this* question** and ship only those — as full text. Prompt
size stays flat whether you have 80 posts or 10,000.

## The one idea that shapes everything: build offline, serve online

There are two clocks in this feature, and keeping them separate is the
whole architecture:

1. **Build time (offline, occasional).** You run `npm run embeddings`.
   It reads every post, splits each into chunks, asks Voyage for an
   embedding vector per chunk, and writes an index to `data/embeddings/`.
   This is the only step that needs a Voyage API key, and it only re-runs
   when you write or edit posts.
2. **Request time (online, every message).** The chat API embeds *just
   the user's question*, compares it against the pre-built index with a
   plain cosine similarity scan, and pastes the top matches into the
   system prompt. No database, no key needed to serve.

```
BUILD TIME (npm run embeddings)            REQUEST TIME (POST /api/chat)
-------------------------------            -----------------------------
posts/{locale}/**/*.md                     user question
   │                                          │
   │ chunkPost()                              │ embedQuery()  ── Voyage ──┐
   ▼                                          ▼                           │
[chunks]                                   query vector                   │
   │ embedDocuments() ── Voyage ──┐           │                           │
   ▼                              │           │  cosine vs index          │
[vectors] ◄─────────────────────-─┘           ▼                           │
   │ normalize + pack                       top-k chunks                   │
   ▼                                          │                           │
data/embeddings/{locale}.json  ───────────►  │ formatRetrievedContext()  │
data/embeddings/{locale}.bin   ───────────►  ▼                           │
   (committed to the repo)                 system prompt ── Claude ───────┘
                                              │
                                              ▼
                                           streamed answer
```

The index files are **committed to the repo**. That's why request time
needs no Voyage key: the vectors are already on disk by the time the app
deploys. You pay Voyage once, at build time, for content that changed.

## The files

| File | Clock | Role |
|---|---|---|
| [src/lib/rag-chunk.ts](../../src/lib/rag-chunk.ts) | both | Pure functions: split a post body into chunks; build the text we embed. No I/O. |
| [src/lib/voyage.ts](../../src/lib/voyage.ts) | both | `fetch` client for Voyage embeddings. `embedDocuments` (build) and `embedQuery` (serve). |
| [scripts/build-embeddings.ts](../../scripts/build-embeddings.ts) | build | The ingestion job. Reads posts, chunks, embeds, writes the index. Has an incremental cache. |
| [src/lib/rag.ts](../../src/lib/rag.ts) | serve | Server-only. Loads the index, runs cosine search, returns top-k chunks. |
| [src/lib/clone-context.ts](../../src/lib/clone-context.ts) | serve | Now builds a *stable* prompt + a per-query `formatRetrievedContext` block. |
| [src/app/api/chat/route.ts](../../src/app/api/chat/route.ts) | serve | Retrieves before streaming; sends two system blocks (cached + retrieved). |
| [data/embeddings/{locale}.json/.bin](../../data/embeddings/) | artifact | The committed index. `.json` = metadata + chunk text, `.bin` = packed vectors. |

Compare this to the clone-chat file table: we *kept* `route.ts`,
`clone-context.ts`, and the persona files, and *added* a chunking module,
an embeddings client, an ingestion script, and a retrieval module. The
chat UI ([CloneChat.tsx](../../src/components/CloneChat.tsx)) didn't
change at all — RAG is entirely a server-side upgrade.

## Graceful degradation: the index is optional

A subtle but important property: if the index files don't exist (you
haven't run `npm run embeddings`, or there's no Voyage key in CI),
[rag.ts](../../src/lib/rag.ts)'s `retrieve()` returns `[]`, and
`formatRetrievedContext([])` returns `''`. The chat then runs on exactly
the old digest-only prompt. **The feature fails soft** — depth degrades,
nothing breaks. That's why the build passed in this PR even though the
index hadn't been generated yet.

## What we kept from the old design, on purpose

RAG didn't replace the digest — it's now a **hybrid**:

- The **digest** (titles/tags/excerpts of every post) stays in the cached
  system prompt. It answers *breadth* questions: "what topics does Tony
  write about?" Retrieval is bad at "list everything"; the digest nails it.
- The **retrieved chunks** answer *depth* questions: "what did he
  actually say about X?" with full section text.

Two layers, two jobs. Losing either one makes the clone worse.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Without running anything, predict what `POST /api/chat` does *today*
   if `data/embeddings/` is empty. Then confirm by reading the route.

   <details>
   <summary><b>Solution</b></summary>

   `retrieve()` in [src/lib/rag.ts](../../src/lib/rag.ts) calls
   `loadIndex(locale)`, which returns `null` when the `.json`/`.bin`
   files are missing, so `retrieve` returns `[]`. Back in
   [route.ts](../../src/app/api/chat/route.ts), `formatRetrievedContext([])`
   returns `''`, so the `system` array has just the one cached block —
   identical to the pre-RAG prompt. The chat works, minus the depth.
   </details>

2. Identify which files need a Voyage API key to run, and which don't.

   <details>
   <summary><b>Solution</b></summary>

   Only the **build** path needs the key:
   [scripts/build-embeddings.ts](../../scripts/build-embeddings.ts) →
   `embedDocuments` → Voyage. At **serve** time, `retrieve` calls
   `embedQuery` (also Voyage) — so technically the *running app* needs the
   key too, but only for the query embedding, not to read the index. If
   you wanted zero serve-time dependency on Voyage you'd cache query
   embeddings or move query embedding to a model you self-host. For a
   personal blog, one cheap query embed per message is fine.
   </details>

3. Explain why the index lives in `data/embeddings/` and is committed,
   rather than being built during `next build`.

   <details>
   <summary><b>Solution</b></summary>

   Building during `next build` would mean every deploy needs the Voyage
   key *and* re-embeds (or relies on a cache that may not survive a clean
   CI checkout). Committing the artifact means: deploys are
   key-free and deterministic, the index is versioned alongside the posts
   that produced it, and you only spend Voyage tokens when you *choose* to
   run `npm run embeddings`. Trade-off: binary blobs in git history. At a
   few MB that's fine; chapter 5 covers when it stops being fine.
   </details>

The next chapter goes deep on chunking — how one Markdown post becomes
the units we actually embed and retrieve.
