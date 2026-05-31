/**
 * VOYAGE EMBEDDINGS CLIENT - src/lib/voyage.ts
 * ============================================
 *
 * Thin `fetch`-based client for Voyage AI's embeddings API. No SDK
 * dependency — one POST to /v1/embeddings.
 *
 * Voyage is Anthropic's recommended embeddings partner, and `voyage-3.5`
 * is multilingual, which matters here: the corpus is fr/en/ja and we want
 * a French query to match an English post in the same vector space.
 *
 * NOTE: this file is intentionally NOT `server-only` — the ingestion
 * script (scripts/build-embeddings.ts) imports it to embed documents at
 * build time, outside the Next.js server runtime.
 *
 * Two call types, because Voyage uses ASYMMETRIC embeddings:
 *   - input_type: "document"  → for the chunks we index
 *   - input_type: "query"     → for the user's question at search time
 * Distinguishing them measurably improves retrieval quality.
 */

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

/** Default to voyage-3.5 (1024-dim, multilingual). Override via env if needed. */
export const VOYAGE_MODEL = process.env.VOYAGE_MODEL?.trim() || 'voyage-3.5';

/** Max inputs per request (Voyage allows up to 1000; we also cap by tokens below). */
const MAX_BATCH_INPUTS = 96;
/**
 * Approx token budget per request. The free tier (no payment method) caps at
 * 10K tokens/min, so we keep each request well under that; paid tiers are far
 * higher and this just means a few more requests. ~4 chars ≈ 1 token.
 */
const MAX_BATCH_TOKENS = Number(process.env.VOYAGE_MAX_BATCH_TOKENS) || 8000;
const estimateTokens = (s: string): number => Math.ceil(s.length / 4);

type InputType = 'document' | 'query';

interface VoyageEmbeddingsResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage?: { total_tokens: number };
}

function getApiKey(): string {
  const key = process.env.VOYAGE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'VOYAGE_API_KEY is not configured. Add it to .env.local (see .env.local.example).'
    );
  }
  return key;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function embedBatch(inputs: string[], inputType: InputType): Promise<number[][]> {
  const apiKey = getApiKey();

  // Retry with exponential backoff. The free tier (3 RPM / 10K TPM) returns
  // 429 often, so we wait generously rather than failing the whole build.
  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: inputs, model: VOYAGE_MODEL, input_type: inputType }),
    });

    if (res.ok) {
      const json = (await res.json()) as VoyageEmbeddingsResponse;
      // Voyage may return out of order; sort by index to align with inputs.
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < maxAttempts - 1) {
      // 429 on the free tier means "wait for the per-minute window to reset".
      const waitMs = res.status === 429 ? 22_000 : 1500 * 2 ** attempt;
      console.warn(`[voyage] ${res.status}, retrying in ${Math.round(waitMs / 1000)}s…`);
      await sleep(waitMs);
      continue;
    }

    const body = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${body.slice(0, 300)}`);
  }

  throw new Error('Voyage API: exhausted retries');
}

/** Greedily pack inputs into batches bounded by both count and est. tokens. */
function packBatches(texts: string[]): string[][] {
  const batches: string[][] = [];
  let batch: string[] = [];
  let tokens = 0;
  for (const text of texts) {
    const t = estimateTokens(text);
    if (batch.length > 0 && (batch.length >= MAX_BATCH_INPUTS || tokens + t > MAX_BATCH_TOKENS)) {
      batches.push(batch);
      batch = [];
      tokens = 0;
    }
    batch.push(text);
    tokens += t;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

/**
 * Embed a list of documents (the chunks we index). Batches internally — by
 * input count AND estimated tokens — so callers can pass thousands of chunks.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const batches = packBatches(texts);
  const out: number[][] = [];
  for (let i = 0; i < batches.length; i++) {
    if (batches.length > 1) console.log(`[voyage] batch ${i + 1}/${batches.length}…`);
    out.push(...(await embedBatch(batches[i], 'document')));
  }
  return out;
}

/** Embed a single user query for retrieval. */
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedBatch([text], 'query');
  return embedding;
}
