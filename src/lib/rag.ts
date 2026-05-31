/**
 * RAG RETRIEVAL - src/lib/rag.ts
 * ==============================
 *
 * Server-only. Loads the pre-built embedding index for a locale and finds
 * the chunks most relevant to a query via brute-force cosine similarity.
 *
 * WHY BRUTE FORCE (no vector DB): at this corpus size (~100 posts/locale →
 * a few thousand chunks) a linear scan is sub-millisecond. A hosted vector
 * DB would be infrastructure for a problem we don't have. This stays fast
 * into the tens of thousands of chunks; past that, swap in sqlite-vec or
 * an ANN index behind this same `retrieve()` interface.
 *
 * INDEX FORMAT (built by scripts/build-embeddings.ts):
 *   data/embeddings/{locale}.json  → { model, dim, count, chunks: Chunk[] }
 *   data/embeddings/{locale}.bin   → count × dim Float32, row-major,
 *                                     aligned with chunks[] order
 *
 * Vectors live in a packed Float32 binary, not JSON: ~4 KB/chunk vs ~18 KB
 * as JSON text, and it parses into a typed array instantly instead of
 * allocating millions of JS number objects.
 *
 * GRACEFUL DEGRADATION: if the index files are missing (e.g. nobody has run
 * `npm run embeddings` yet, or there's no Voyage key), `retrieve()` returns
 * [] and the caller falls back to the metadata-only digest. The chat keeps
 * working — it just answers with less depth.
 */

import 'server-only';

import fs from 'fs';
import path from 'path';

import { embedQuery } from './voyage';
import type { Chunk } from './rag-chunk';
import type { Locale } from './i18n-config';

export interface RetrievedChunk extends Chunk {
  /** Cosine similarity to the query, in [-1, 1]. */
  score: number;
}

interface IndexMeta {
  model: string;
  dim: number;
  count: number;
  chunks: Chunk[];
}

interface LoadedIndex {
  dim: number;
  chunks: Chunk[];
  /** Packed, L2-normalized vectors: count × dim, row-major. */
  vectors: Float32Array;
}

const embeddingsDir = path.join(process.cwd(), 'data', 'embeddings');

/** Module-scope cache: the index is read from disk once per locale per process. */
const indexCache = new Map<Locale, LoadedIndex | null>();

function loadIndex(locale: Locale): LoadedIndex | null {
  if (indexCache.has(locale)) return indexCache.get(locale)!;

  const metaPath = path.join(embeddingsDir, `${locale}.json`);
  const binPath = path.join(embeddingsDir, `${locale}.bin`);

  if (!fs.existsSync(metaPath) || !fs.existsSync(binPath)) {
    indexCache.set(locale, null);
    return null;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as IndexMeta;
  const buf = fs.readFileSync(binPath);

  // Copy into a fresh, 4-byte-aligned ArrayBuffer. A Buffer from readFileSync
  // can sit at an arbitrary byteOffset in a pooled allocation, and
  // Float32Array requires alignment — slicing guarantees a clean view.
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const vectors = new Float32Array(ab);

  const loaded: LoadedIndex = { dim: meta.dim, chunks: meta.chunks, vectors };
  indexCache.set(locale, loaded);
  return loaded;
}

function normalize(vec: number[]): Float32Array {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

/**
 * Retrieve the top-k chunks for a query in a given locale.
 *
 * Stored vectors are pre-normalized at build time and the query is
 * normalized here, so a plain dot product equals cosine similarity.
 *
 * Returns [] (never throws) if the index is missing or the embedding call
 * fails — retrieval is best-effort and must not break the chat.
 */
export async function retrieve(
  locale: Locale,
  query: string,
  k = 8
): Promise<RetrievedChunk[]> {
  const index = loadIndex(locale);
  if (!index || index.chunks.length === 0) return [];

  let queryVec: Float32Array;
  try {
    queryVec = normalize(await embedQuery(query));
  } catch (err) {
    console.error('[rag] query embedding failed, falling back to digest:', err);
    return [];
  }

  const { dim, vectors, chunks } = index;
  const scores: { i: number; score: number }[] = new Array(chunks.length);

  for (let i = 0; i < chunks.length; i++) {
    const base = i * dim;
    let dot = 0;
    for (let d = 0; d < dim; d++) dot += vectors[base + d] * queryVec[d];
    scores[i] = { i, score: dot };
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, k).map(({ i, score }) => ({ ...chunks[i], score }));
}
