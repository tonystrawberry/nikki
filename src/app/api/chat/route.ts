import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { buildSystemPrompt } from '@/lib/clone-context';
import { hasLocale } from '@/lib/i18n-config';

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
  const system = buildSystemPrompt(body.locale as Parameters<typeof buildSystemPrompt>[0]);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: system,
              cache_control: { type: 'ephemeral' },
            },
          ],
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
