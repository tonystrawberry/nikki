# 02 — Chunking the corpus

Retrieval doesn't operate on "posts." It operates on **chunks** — slices
of a post small enough to be a precise search hit but large enough to
carry a complete idea. Get chunking wrong and everything downstream
suffers: too big and the embedding becomes a mushy average of five topics;
too small and you retrieve a sentence with no context. This chapter is
about [src/lib/rag-chunk.ts](../../src/lib/rag-chunk.ts), the one module
in this feature with **no I/O and no network** — pure string-in,
chunks-out, which is exactly why it's the easiest to test and reason about.

## Why split on `##` headings

Look at how the blog's memo posts are authored (the `/daily` skill and
CLAUDE.md spell it out): structured sections under `##` headings, often
ending with `## Key Takeaways`. The author already did the semantic
segmentation for us. A `##` boundary almost always marks "new idea
starts here," which is precisely where you want a chunk boundary.

So the primary strategy is: **one chunk per `## section`.** Text before
the first heading (the post's intro paragraph) becomes its own chunk with
an empty heading.

```
## Gratitude as a daily practice          ┐
- A study of nuns' letters ...            │  → chunk { heading: "Gratitude as
- Gratitude has levels ...                │              a daily practice", ... }
                                          ┘
## The counterclockwise study             ┐
Elderly participants spent a week ...     │  → chunk { heading: "The
...                                       │              counterclockwise study", ... }
                                          ┘
```

Contrast this with the naive alternative — fixed 500-token windows
sliced blindly through the text. Those cut mid-sentence and mid-idea, and
they ignore the structure the author painstakingly created. Heading-based
chunking is "free" semantic boundaries; we'd be silly not to use them.

## The shape of a chunk

```ts
export interface Chunk {
  slug: string;     // which post — used to build the /posts/{slug} citation
  title: string;    // post title — shown to the model, and embedded for context
  date: string;     // post date — metadata, handy for "recent" reasoning
  heading: string;  // the ## this lives under, or '' for the intro
  text: string;     // raw Markdown of the section — what the model reads
}
```

`slug` is the load-bearing field: it's how a retrieved chunk turns into a
clickable `/posts/{slug}` citation in the answer. Everything else is for
ranking quality or display.

## Handling the long-section problem

Most sections are a few paragraphs. But occasionally one is huge (a long
tutorial section, a transcript dump). Embedding models have two limits a
giant section hits: a hard token cap per input, and a soft "precision"
cap — a 3000-word section's embedding is the average of too many ideas,
so it matches everything weakly and nothing strongly.

`windowText()` handles this. If a section exceeds `MAX_CHUNK_CHARS`
(~4000 chars ≈ ~1000 tokens), it's split into overlapping windows on
paragraph boundaries:

```
[ paragraph 1 ][ paragraph 2 ][ paragraph 3 ][ paragraph 4 ]
└──────── window A ────────┘
                    └──────── window B ────────┘
                    ↑ OVERLAP_CHARS (~400) carried from A into B
```

The overlap matters: without it, an idea that straddles the cut between
window A and window B would be in *neither* embedding cleanly. The ~400-char
tail of A is prepended to B so the boundary idea survives in both. And as a
last resort, a single paragraph longer than the cap is hard-split by
character count — ugly, but it guarantees we never exceed the limit.

See [src/lib/rag-chunk.ts](../../src/lib/rag-chunk.ts) — `splitByHeadings`,
then `windowText`, composed by `chunkPost`.

## The embedding input ≠ the stored text

This is the subtle bit. We store `chunk.text` (the raw section) to show
the model at answer time. But we embed something *different*:

```ts
export function embeddingInput(chunk: Chunk): string {
  const head = chunk.heading ? `${chunk.title} › ${chunk.heading}` : chunk.title;
  return `${head}\n\n${chunk.text}`;
}
```

We prepend `Post Title › Heading` before embedding. Why? Consider a chunk
whose entire body is:

```
- A genetic set point we return to
- ~50% heritable, the rest is habit and circumstance
```

Embedded alone, that's topic-ambiguous — set point of *what*? Prepending
`Professeur de bonheur › Is happiness genetic?` injects the topic into the
vector, so a query like "is happiness hereditary?" lands on it. The
heading and title are cheap, high-signal context. We don't store that
prefix in `text` because the model already gets the title/heading via the
formatting in `formatRetrievedContext` — embedding it and displaying it
are two separate concerns.

## Determinism matters

`chunkPost` is deterministic: same body in, same chunks out, every time.
This is what makes the incremental cache in chapter 3 correct — we can
hash the body, and if the hash is unchanged we *know* the chunks (and
therefore the embeddings) are unchanged. A non-deterministic chunker
(say, one that used `Date.now()` or random window sizes) would silently
break that guarantee.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Take a real post — say
   [posts/en/2026-05-31/professeur-de-bonheur-le-bonheur-est-genetique.md](../../posts/en/2026-05-31/professeur-de-bonheur-le-bonheur-est-genetique.md)
   — and predict how many chunks `chunkPost` produces. Then verify.

   <details>
   <summary><b>Solution</b></summary>

   Count the intro (text before the first `##`) as 1, plus one per `##`
   heading, plus extra for any section over ~4000 chars. Verify with a
   one-off:

   ```bash
   npx tsx -e "
     import matter from 'gray-matter';
     import fs from 'fs';
     import { chunkPost } from './src/lib/rag-chunk';
     const f = 'posts/en/2026-05-31/professeur-de-bonheur-le-bonheur-est-genetique.md';
     const { data, content } = matter(fs.readFileSync(f, 'utf8'));
     const c = chunkPost({ slug: 's', title: data.title, date: data.date, body: content });
     console.log(c.length, 'chunks:', c.map(x => x.heading || '(intro)'));
   "
   ```
   </details>

2. A `day-N.md` daily post has one heading: `## Today, I:` followed by
   bullets. How many chunks does it produce, and is that a problem?

   <details>
   <summary><b>Solution</b></summary>

   Usually two: the intro (if any text precedes the heading — often none,
   so it may be just one) and the `Today, I:` section. That's fine —
   daily posts are short and single-topic, so one chunk faithfully
   represents them. Chunking only needs to *split* posts that contain
   multiple ideas.
   </details>

3. Why is `embeddingInput` a separate function instead of just embedding
   `chunk.text`? Construct a query that would fail without it.

   <details>
   <summary><b>Solution</b></summary>

   A "## Key Takeaways" chunk that's a bare bullet list has no topic words
   of its own. A query like "summary of the happiness video" might miss it
   because the word "happiness" never appears in that section's body — but
   it *does* appear in the post title, which `embeddingInput` prepends.
   Without the title/heading prefix, terse chunks become unfindable.
   </details>

Next chapter: turning these chunks into vectors with Voyage, and the
ingestion script that does it incrementally.
