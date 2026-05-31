/**
 * BUILD EMBEDDINGS - scripts/build-embeddings.ts
 * ==============================================
 *
 * Offline ingestion: read every post, chunk it, embed the chunks with
 * Voyage, and write a per-locale index that src/lib/rag.ts serves at
 * request time.
 *
 *   npm run embeddings            # all locales
 *   npm run embeddings -- en      # one or more locales
 *
 * OUTPUT (committed to the repo so deploys need no Voyage key):
 *   data/embeddings/{locale}.json   metadata + chunk text
 *   data/embeddings/{locale}.bin    packed, L2-normalized Float32 vectors
 *
 * INCREMENTAL: a content-hash cache (data/embeddings/.cache.json, gitignored)
 * lets re-runs skip posts whose body hasn't changed, so the Voyage bill is
 * proportional to *new writing*, not the whole corpus. Re-embedding all 300
 * posts costs only a few cents, but this keeps it near-zero day to day.
 *
 * Run from the repo root. Reads VOYAGE_API_KEY from the environment or, as a
 * convenience, from .env.local.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { getAllPosts, getRawPostBody } from '../src/lib/blog';
import { chunkPost, embeddingInput, type Chunk } from '../src/lib/rag-chunk';
import { embedDocuments, VOYAGE_MODEL } from '../src/lib/voyage';
import { locales, type Locale } from '../src/lib/i18n-config';

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'embeddings');
const CACHE_PATH = path.join(OUTPUT_DIR, '.cache.json');

/** Minimal .env.local loader so `npm run embeddings` works with the existing key. */
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

/** Per-post cache entry: chunk texts + their raw embeddings, keyed by body hash. */
interface CacheEntry {
  hash: string;
  chunks: Chunk[];
  vectors: number[][];
}
type Cache = Record<string, CacheEntry>; // key: `${locale}/${slug}`

function loadCache(): Cache {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as Cache;
  } catch {
    return {};
  }
}

function hashBody(body: string): string {
  return crypto.createHash('sha256').update(body).digest('hex');
}

function normalizeInPlace(vec: number[]): void {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / norm;
}

async function buildLocale(locale: Locale, cache: Cache): Promise<{ chunks: number; reused: number }> {
  const posts = getAllPosts(locale);

  const allChunks: Chunk[] = [];
  const allVectors: number[][] = [];
  let reused = 0;
  const toEmbed: { chunk: Chunk; globalIndex: number }[] = [];

  for (const post of posts) {
    const body = getRawPostBody(post.slug, locale);
    if (!body || !body.trim()) continue;

    const key = `${locale}/${post.slug}`;
    const hash = hashBody(body);
    const cached = cache[key];

    const chunks = chunkPost({ slug: post.slug, title: post.title, date: post.date, body });

    if (cached && cached.hash === hash && cached.vectors.length === chunks.length) {
      // Unchanged post — reuse its cached embeddings.
      for (let i = 0; i < chunks.length; i++) {
        allChunks.push(chunks[i]);
        allVectors.push(cached.vectors[i]);
      }
      reused += chunks.length;
    } else {
      // New or changed — queue its chunks for embedding, remember positions.
      for (const chunk of chunks) {
        toEmbed.push({ chunk, globalIndex: allChunks.length });
        allChunks.push(chunk);
        allVectors.push([]); // placeholder, filled after embedding
      }
      cache[key] = { hash, chunks, vectors: [] }; // vectors filled below
    }
  }

  // Embed everything new in one batched call.
  if (toEmbed.length > 0) {
    const inputs = toEmbed.map(({ chunk }) => embeddingInput(chunk));
    const vectors = await embedDocuments(inputs);
    toEmbed.forEach(({ globalIndex }, i) => {
      allVectors[globalIndex] = vectors[i];
    });

    // Refresh cache entries for changed posts with their fresh vectors.
    for (const post of posts) {
      const key = `${locale}/${post.slug}`;
      const entry = cache[key];
      if (!entry || entry.vectors.length > 0) continue;
      entry.vectors = entry.chunks.map((c) => {
        const idx = allChunks.findIndex(
          (ac) => ac.slug === c.slug && ac.heading === c.heading && ac.text === c.text
        );
        return allVectors[idx];
      });
    }
  }

  if (allChunks.length === 0) {
    console.warn(`[${locale}] no chunks — skipping`);
    return { chunks: 0, reused: 0 };
  }

  // Normalize and pack into a Float32 binary, row-major.
  const dim = allVectors[0].length;
  const packed = new Float32Array(allChunks.length * dim);
  allVectors.forEach((vec, i) => {
    normalizeInPlace(vec);
    packed.set(vec, i * dim);
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${locale}.json`),
    JSON.stringify({ model: VOYAGE_MODEL, dim, count: allChunks.length, chunks: allChunks })
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${locale}.bin`),
    Buffer.from(packed.buffer, packed.byteOffset, packed.byteLength)
  );

  return { chunks: allChunks.length, reused };
}

async function main(): Promise<void> {
  loadEnvLocal();

  const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const targets = (requested.length ? requested : [...locales]) as Locale[];
  for (const t of targets) {
    if (!locales.includes(t)) throw new Error(`Unknown locale "${t}". Valid: ${locales.join(', ')}`);
  }

  const cache = loadCache();

  console.log(`Embedding model: ${VOYAGE_MODEL}`);
  for (const locale of targets) {
    const { chunks, reused } = await buildLocale(locale, cache);
    console.log(`[${locale}] ${chunks} chunks indexed (${reused} reused from cache, ${chunks - reused} embedded)`);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
  console.log(`Done. Wrote index to ${path.relative(process.cwd(), OUTPUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
