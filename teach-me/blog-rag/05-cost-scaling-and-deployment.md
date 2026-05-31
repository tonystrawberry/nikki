# 05 — Cost, scaling, and deployment

The feature works. This chapter is the operator's view: what it costs,
how it behaves as the blog grows toward 1000 posts, and how the index
gets to production.

## What it costs

Two providers, two very different bills.

### Embeddings (Voyage) — effectively free

`voyage-3.5` is ~$0.06 per 1M tokens. The whole corpus is ~0.5M tokens
across three locales.

| Event | Tokens | Cost |
|---|---|---|
| Full initial embed (all locales) | ~0.55M | **~$0.03** |
| One new trilingual post | ~5K | **~$0.0003** |
| One chat query (embed the question) | ~80 | **~$0.000005** |

The incremental cache (chapter 3) means you almost never pay the full
embed again. Embeddings are a rounding error.

### Generation (Claude) — the real cost

This dominates, and it's where RAG *saves* money versus the old
stuff-everything prompt. Per message, with the stable block cached
(Sonnet 4.6: input $3, output $15, cache-read $0.30 per 1M):

| Component | Tokens | Cost/msg |
|---|---|---|
| Cached system (persona + lightweight index) | ~4K @ $0.30/1M | $0.0012 |
| Retrieved chunks (k=8 × ~400, not cached) | ~3.2K @ $3/1M | $0.0096 |
| Conversation history | ~1K @ $3/1M | $0.0030 |
| Output (~400 tokens) | ~400 @ $15/1M | $0.0060 |
| **≈ per message** | | **~$0.02** |

So roughly **2¢/message**, ~$10–20/month at a few hundred conversations.
Drop to Haiku for generation and it's well under a cent, at some quality
cost for a recruiter-facing clone.

## The scaling punchline

This is the number the whole feature exists for. The old design's
per-message input grew with every post written; RAG's stays flat:

| Corpus | Old (stuff index/bodies) | RAG |
|---|---|---|
| 100 posts | ~$0.015/msg input | ~$0.02/msg |
| 1,000 posts | index alone ~50K cached tokens; bodies blow the window | **~$0.02/msg (unchanged)** |
| 10,000 posts | non-viable | **~$0.02/msg (unchanged)** |

Because retrieval always returns ~8 chunks regardless of library size,
the prompt is constant. You can 100× the blog and the per-message cost
doesn't move.

## Where brute force stops being enough

Retrieval today is a linear scan in [rag.ts](../../src/lib/rag.ts).
Rough budget: a few thousand chunks × 1024 dims is single-digit
milliseconds. The honest ceiling is roughly **tens of thousands of
chunks** (~a few thousand posts) before the scan plus the `.bin` load
start to feel slow on a cold serverless invocation.

When you get there, the fix is contained because `retrieve()` is the
abstraction boundary:

- **sqlite-vec** — store vectors in SQLite (the chat-server already runs
  SQLite) with a KNN query. Keeps the "just files" simplicity.
- **An ANN index** (hnswlib, or a hosted vector DB) — sub-linear search
  if you truly have hundreds of thousands of chunks.

Nothing above `retrieve()` changes — the route, the prompt wiring, the
chunking all stay. That's the payoff of keeping retrieval behind one
function.

## Quality knobs, when answers disappoint

Cost isn't the only axis. If retrieval misses relevant content:

- **Raise `k`** (retrieve 10–12 instead of 8). Cheap, immediate.
- **Add a reranker.** Retrieve 20 candidates, then have Voyage's
  `rerank-2.5` reorder them and keep the top 6. Catches cases where the
  best chunk wasn't in the top-k by raw cosine. ~$0.05/1M tokens —
  still negligible.
- **Embed more of the conversation,** not just the latest message (see
  chapter 4's exercise) — fixes context-blind follow-ups.
- **Re-chunk.** If sections are too coarse, lower `MAX_CHUNK_CHARS`; the
  whole index rebuilds from `npm run embeddings`.

Reach for these only when you see a concrete bad answer — premature
tuning is how RAG systems get needlessly complex.

## Deployment

The deploy story is deliberately boring, which is the point:

1. **Build the index locally:** `npm run embeddings` (needs the Voyage
   key in `.env.local`).
2. **Commit the artifacts:** `data/embeddings/*.json` and `*.bin` are
   committed; `.cache.json` is gitignored.
3. **Push and deploy.** Production reads the committed index off disk via
   [rag.ts](../../src/lib/rag.ts). No Voyage key is needed at deploy or
   build time on the host — the vectors are already there.

The serving app *does* still call Voyage once per chat message (to embed
the query), so the production environment needs `VOYAGE_API_KEY` set for
the live query embedding — but not to read the index. If you want zero
serve-time Voyage dependency, that's the thing to cache or self-host next.

### A note on binary blobs in git

The `.bin` files are committed binaries. At the current scale that's a
few MB — fine. As the corpus grows the blobs grow, and git stores a full
copy per change. If they reach tens of MB and change often, consider Git
LFS, or generating the index in CI from the committed `.cache.json`
(which would move the Voyage-key requirement into CI). Not worth it yet;
worth remembering.

## Workflow checklist (the whole loop)

```
write/edit a post in posts/{locale}/...
        │
        ▼
npm run embeddings           # re-embeds only changed posts (cache)
        │
        ▼
git add data/embeddings/*.json data/embeddings/*.bin
git commit
        │
        ▼
push → deploy → clone answers with the new content
```

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Estimate your real monthly cost. Roughly how many chat messages would
   it take to spend $5?

   <details>
   <summary><b>Solution</b></summary>

   At ~$0.02/message, $5 ≈ 250 messages — call it ~40 conversations of
   6 turns. Embeddings add essentially nothing. So the bill tracks chat
   *usage*, not blog *size* — exactly the property RAG was adopted for.
   </details>

2. You wrote 3 new posts and edited 1. Before running, predict how many
   posts get re-embedded and why.

   <details>
   <summary><b>Solution</b></summary>

   Four: the 3 new (no cache entry) and the 1 edited (body hash changed).
   Every other post hits the cache and is reused. The
   `(N reused, M embedded)` log line confirms `M == 4` per locale you
   built.
   </details>

3. Decide whether to add a reranker today. What evidence would justify it?

   <details>
   <summary><b>Solution</b></summary>

   Don't add it speculatively. Justify it only with concrete misses:
   ask the clone 10 real questions, log the retrieved chunks, and check
   whether the *right* chunk was present but ranked below the cutoff. If
   yes (present but ranked ~9–15), a reranker helps. If the right chunk
   wasn't retrieved at all, the problem is chunking or embeddings, not
   ranking — fix that first.
   </details>

That's the feature, end to end: chunk → embed offline → retrieve online →
splice into a cached prompt → stream. Built offline, served online, flat
cost as the blog grows. Re-read chapter 1's data-flow diagram now; it
should read like a summary rather than an introduction.
