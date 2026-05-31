import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { buildSystemPrompt, formatRetrievedContext } from '@/lib/clone-context';
import { retrieve } from '@/lib/rag';
import { hasLocale, type Locale } from '@/lib/i18n-config';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  locale: z.string().refine(hasLocale, { message: 'Unsupported locale' }),
  messages: z.array(MessageSchema).min(1).max(40),
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request body';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey });
  const locale = body.locale as Locale;

  // RAG: retrieve the most relevant post sections for the latest user turn.
  // Best-effort — `retrieve` returns [] if the index is missing or embedding
  // fails, and we fall back to the digest-only prompt.
  const lastUser = [...body.messages].reverse().find((m) => m.role === 'user');
  const retrieved = lastUser ? await retrieve(locale, lastUser.content) : [];

  const stableSystem = buildSystemPrompt(locale);
  const retrievedContext = formatRetrievedContext(retrieved);

  // Two system blocks: the stable one is cached across turns; the retrieved
  // one varies per question, so it sits after the cache breakpoint.
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: stableSystem, cache_control: { type: 'ephemeral' } },
    ...(retrievedContext ? [{ type: 'text' as const, text: retrievedContext }] : []),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system,
          messages: body.messages,
        });

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`\n\n[error] ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
