# 03 — Embeddings and the ingestion job

This chapter covers the two pieces that turn chunks into a searchable
index: the Voyage client ([src/lib/voyage.ts](../../src/lib/voyage.ts))
and the ingestion script
([scripts/build-embeddings.ts](../../scripts/build-embeddings.ts)).

## What an embedding is, in one paragraph

An embedding model maps a piece of text to a fixed-length vector — for
`voyage-3.5`, an array of 1024 floats — such that texts about similar
things land near each other in that 1024-dimensional space. "Is happiness
genetic?" and "happiness has a hereditary set point" produce vectors that
point in nearly the same direction, even though they share few words.
That "nearly the same direction" is what we'll measure at search time
(next chapter). The whole game is: embed once, compare cheaply forever.

## Why Voyage, and why asymmetric

Two reasons Voyage specifically:

1. **Multilingual.** The corpus is fr/en/ja. We need one model that puts
   all three languages in a *shared* space, so a French question can match
   an English post. `voyage-3.5` does this; many embedding models don't.
2. **It's Anthropic's recommended embeddings partner.** Generation is
   Claude; Anthropic doesn't ship its own embeddings model and points to
   Voyage. So this isn't bolting on a competitor — it's the documented pairing.

And one technique: **asymmetric embeddings.** Voyage takes an `input_type`:

```ts
embedDocuments(texts)  // input_type: "document"  → for chunks we index
embedQuery(text)       // input_type: "query"     → for the user's question
```

The model embeds a short question and a long passage slightly differently
so they match better. It's a free quality win — just pass the right type.
The whole dependency is two functions; swapping to OpenAI or a local model
means rewriting only this file (see chapter 5).

## The rate-limit reality

The embeddings API has per-minute limits. On Voyage's free tier (no
payment method) those are *tiny*: 3 requests/min and 10K tokens/min. The
full corpus is ~0.5M tokens, so on the free tier a full build is
bottlenecked to ~50 minutes of waiting. With a payment method the limits
jump to millions of tokens/min and the same build finishes in seconds for
a few cents.

The client is written to survive either world:

- **Token-aware batching.** `packBatches` greedily fills each request up
  to both an input-count cap (`MAX_BATCH_INPUTS`) and an estimated-token
  cap (`MAX_BATCH_TOKENS`, default 8000). Without the token cap, a single
  request could exceed 10K TPM and 429 forever.
- **Backoff on 429.** `embedBatch` retries up to 6 times; on a 429 it
  waits ~22s — long enough for the per-minute window to reset — instead
  of hammering and failing.

```
embedDocuments(texts)
   │ packBatches: fill to ≤96 inputs AND ≤8000 est. tokens
   ▼
[ batch 1 ][ batch 2 ] ... [ batch N ]
   │ embedBatch(batch)  ── POST /v1/embeddings ──► Voyage
   │   200 → sort by index, return vectors
   │   429 → wait ~22s, retry (≤6×)
   ▼
[ all vectors, in input order ]
```

One detail worth its own sentence: Voyage may return results out of order,
so `embedBatch` sorts `json.data` by `index` before mapping. If you skip
that sort, a vector silently attaches to the wrong chunk — the nastiest
kind of bug, because nothing errors; retrieval just quietly returns
nonsense. Order alignment is sacred in this whole pipeline.

## The ingestion script, end to end

[scripts/build-embeddings.ts](../../scripts/build-embeddings.ts) ties it
together. Run it from the repo root:

```bash
npm run embeddings          # all locales
npm run embeddings -- en    # just English
```

What it does per locale:

1. `getAllPosts(locale)` for metadata, `getRawPostBody` for each body.
2. `chunkPost(...)` → the chunks from chapter 2.
3. Decide per post: **reuse** cached vectors or **embed** fresh (see
   incremental cache below).
4. `embedDocuments(newChunks)` for everything not reused.
5. Normalize each vector, pack into a `Float32Array`, write
   `{locale}.json` (metadata + chunk text) and `{locale}.bin` (vectors).

### The incremental cache

Embeddings cost money and time, and most of the corpus is unchanged
between runs. So the script keeps `data/embeddings/.cache.json`
(gitignored), keyed by `{locale}/{slug}`, storing each post's body hash
plus its chunk vectors:

```ts
if (cached && cached.hash === hash && cached.vectors.length === chunks.length) {
  // body unchanged → reuse cached vectors, embed nothing
} else {
  // new or edited → queue chunks for embedding
}
```

Because `chunkPost` is deterministic (chapter 2), an unchanged body
guarantees unchanged chunks, so reusing the cached vectors is safe. The
payoff: after the first full build, writing one new post re-embeds only
*that* post's handful of chunks. Your day-to-day Voyage spend is
proportional to new writing, not corpus size.

### Why normalize at build time

Each vector is L2-normalized (scaled to length 1) *before* being written
to the `.bin`. This is a deliberate move that pays off at search time:
for unit vectors, cosine similarity equals a plain dot product. By
normalizing once during ingestion, every search avoids recomputing
magnitudes — the hot loop in [rag.ts](../../src/lib/rag.ts) is just
multiply-and-add. Do the work once at build, not on every query.

### The output format

```
data/embeddings/
  en.json   { model, dim: 1024, count, chunks: [{slug,title,date,heading,text}, …] }
  en.bin    count × 1024 Float32, row-major, same order as chunks[]
  fr.json / fr.bin
  ja.json / ja.bin
  .cache.json   (gitignored build cache)
```

The `.json` and `.bin` are two halves of one index, joined by array
order: `chunks[i]` in the JSON describes the vector at offset
`i * dim` in the binary. Chapter 4 relies entirely on that alignment.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. With a Voyage key in `.env.local`, run `npm run embeddings -- en` and
   inspect the output sizes. How many bytes per vector, and does it match
   `count × 1024 × 4`?

   <details>
   <summary><b>Solution</b></summary>

   ```bash
   npm run embeddings -- en
   node -e "const m=require('./data/embeddings/en.json'); const {size}=require('fs').statSync('./data/embeddings/en.bin'); console.log('count',m.count,'dim',m.dim,'bin bytes',size,'expected',m.count*m.dim*4)"
   ```
   `bin bytes` should equal `count × dim × 4` exactly (4 bytes per
   Float32). If it doesn't, the pack step has a bug.
   </details>

2. Run `npm run embeddings -- en` twice in a row. Why is the second run
   nearly instant?

   <details>
   <summary><b>Solution</b></summary>

   The first run populates `.cache.json` with every post's body hash and
   vectors. The second run hashes each body, finds an unchanged match, and
   reuses the cached vectors — zero Voyage calls. Edit one post and re-run:
   only that post re-embeds. Watch the `(N reused, M embedded)` line.
   </details>

3. Predict what happens if you delete `.cache.json` but keep the
   `.json`/`.bin`. Then what happens if you delete the `.bin` but keep
   `.cache.json`?

   <details>
   <summary><b>Solution</b></summary>

   Deleting `.cache.json` forces a full re-embed on the next run (slow on
   the free tier), but produces an identical index. Deleting `.bin` while
   keeping the cache: the next run still has the vectors *in the cache*, so
   it rebuilds the `.bin` from cache without calling Voyage. The cache is
   the source of truth for "have I embedded this?"; the `.bin` is a derived
   artifact.
   </details>

Next chapter: the serve-time half — loading this index and finding the
top matches, then splicing them into the prompt.
