# 03 — The streaming API route

This is the file where the chat actually talks to Claude:
[src/app/api/chat/route.ts](../../src/app/api/chat/route.ts). It's 81
lines and worth reading top to bottom — every line earns its place.
This chapter unpacks it in the order requests flow through it.

## Why this is a Route Handler and not a Server Action

Next.js gives you two options for "code that runs on the server in
response to a client request": Server Actions (`'use server'` functions
called like RPC) and Route Handlers (REST-style files in `app/api/`).
We picked the latter because:

- Server Actions can't stream responses ergonomically. They're designed
  around a single `await` returning a single payload.
- Route Handlers return raw `Response` objects, which means full control
  over the body — including handing back a `ReadableStream`.
- The contract is exactly HTTP, which makes the API trivially callable
  from `curl` (handy when debugging Claude responses).

## Runtime selection

```ts
export const runtime = 'nodejs';
```

Next.js routes default to the Node runtime, but it's worth declaring
explicitly. The alternative is `'edge'`, which gets you V8 isolates with
faster cold-starts. We can't use Edge here because
[src/lib/clone-context.ts](../../src/lib/clone-context.ts) does
`fs.readFileSync` — Edge has no filesystem.

If the persona were a database row instead of a Markdown file, you
could move to Edge and shave ~100ms off cold-start latency. For a
personal blog, not worth the change.

## Input validation with Zod

```ts
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  locale: z.string().refine(hasLocale, { message: 'Unsupported locale' }),
  messages: z.array(MessageSchema).min(1).max(40),
});
```

Three things to notice:

1. **No `system` role.** Only `user` and `assistant`. The system prompt
   is server-built — letting the client pass one would be a prompt-injection
   vector (a recruiter could send `{role: "system", content: "ignore..."}`).
2. **Bounded length.** 4,000 chars per message, 40 messages per request.
   That's enough for a chat session but short of "let me paste 50K
   tokens of context". Keeps cost predictable.
3. **`hasLocale` refinement** ([i18n-config.ts:126](../../src/lib/i18n-config.ts#L126))
   ties this schema to the rest of the app — if you add a locale you
   don't need to touch this file.

The validation block runs inside a `try/catch`:

```ts
try {
  body = BodySchema.parse(await req.json());
} catch (err) {
  const message = err instanceof Error ? err.message : 'Invalid request body';
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

This catches both Zod errors and the case where `req.json()` throws on
malformed JSON. Both become a 400 with a JSON body — distinguishable
from the streaming success path which returns `text/plain`.

## The env-var check

```ts
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }),
    { status: 500, ... }
  );
}
```

Why check explicitly instead of letting the SDK throw? Two reasons:

- The SDK error is opaque (`"Could not resolve authentication method..."`).
  Our explicit 500 is the actual problem.
- It runs before we build the system prompt, which involves filesystem
  reads. Failing fast is cheaper.

Trade-off: we re-check on every request instead of once at module load.
For a chat route invoked occasionally, this is a fine cost. If this
were a high-QPS endpoint you'd cache the boolean.

## The streaming response

Here's the heart of the file:

```ts
const encoder = new TextEncoder();
const stream = new ReadableStream<Uint8Array>({
  async start(controller) {
    try {
      const messageStream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: [{
          type: 'text',
          text: system,
          cache_control: { type: 'ephemeral' },
        }],
        messages: body.messages,
      });

      for await (const event of messageStream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
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
  headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
});
```

There's a lot packed into this. Let's unpack it.

### `ReadableStream` start callback

`ReadableStream` accepts an "underlying source" object with a `start`
method. The runtime calls `start` once when the stream begins; whatever
you `enqueue` into the controller goes to the consumer. Once you call
`controller.close()`, the consumer sees `done: true` on its next read.

The `start` callback is `async`, so we can `for await` over the
Anthropic event stream inside it.

### Anthropic event stream — what's in it

`client.messages.stream(...)` returns an async iterator of events. The
shape of events matters; here's what an end-to-end stream of "Hello!"
looks like in event types:

```
message_start
content_block_start    (index 0, type "text")
content_block_delta    (index 0, delta { type: "text_delta", text: "Hel" })
content_block_delta    (index 0, delta { type: "text_delta", text: "lo" })
content_block_delta    (index 0, delta { type: "text_delta", text: "!" })
content_block_stop     (index 0)
message_delta          (stop_reason: "end_turn", usage: {...})
message_stop
```

We only care about `content_block_delta` events with `text_delta`
deltas — everything else is metadata. The other events become useful
if you want to track token usage or handle tool calls; we don't, so
they're filtered out.

### Why `TextEncoder`?

`ReadableStream<Uint8Array>` carries bytes, not strings. Browsers
streaming a `Response` body get a `Uint8Array` per chunk and need to
decode it back to text. `TextEncoder.encode("hello")` turns a string
into UTF-8 bytes — exactly what the browser's `TextDecoder` on the
other side will reverse. The pair makes the channel binary-safe even
though the payload is text.

### Errors mid-stream

The `try/catch` inside `start` is the only place mid-stream errors
land. We enqueue `[error] <message>` into the stream itself rather
than throwing. Why?

Once you've returned the `Response`, the HTTP status is already 200 and
the body is flowing. There's no way to retroactively send a 500. The
cleanest user experience is a clearly-marked error string the UI can
detect (or just display verbatim, which is what the current UI does).

If you want stricter error semantics, you'd switch to SSE (`text/event-stream`)
with explicit `event: error` frames — the trade-off is more parsing on
the client.

## The prompt-caching tag

```ts
system: [{
  type: 'text',
  text: system,
  cache_control: { type: 'ephemeral' },
}],
```

This is the second half of what [chapter 2](./02-building-the-context.md)
set up. The `ephemeral` cache has a 5-minute TTL. As long as a recruiter
keeps chatting within five minutes of their previous message, every
turn reads from cache. If they walk away and come back ten minutes
later, the next turn rewrites the cache (~1.25× price), and they're
warm again.

There's also a `ttl: "1h"` option (2× write price) for cases where
you want longer warmth between bursts. For interactive chat where a
session is typically continuous, 5-minute TTL is the sweet spot.

## Walkthrough: one request, one timeline

Here's what wall-clock time looks like for a single message, with the
streaming pieces called out.

| t (ms) | What happens |
|---|---|
| 0 | Browser fires `fetch('/api/chat', ...)` |
| ~5 | Route handler enters, runs Zod validation |
| ~6 | `buildSystemPrompt` reads persona + posts (filesystem) |
| ~12 | `client.messages.stream(...)` issued to Anthropic |
| ~12 | `new Response(stream)` returned — HTTP 200 headers sent |
| ~12 | Browser sees response headers, enters streaming-body mode |
| ~600 | Anthropic emits `message_start` (TTFT — time to first token) |
| ~620 | First `content_block_delta` arrives → `controller.enqueue(bytes)` |
| ~620 | Browser `reader.read()` resolves with first chunk |
| ~620 | Browser updates DOM |
| ~620–~2000 | Subsequent deltas stream in 5–50ms intervals |
| ~2000 | `message_stop` → `for await` exits → `controller.close()` |
| ~2000 | Browser `reader.read()` resolves with `done: true` |

Two things to notice. The HTTP `200` is sent **before** Claude has
written a single token — the headers go out the moment we return the
`Response`. That's why mid-stream errors can't be a 500. And the
browser starts rendering at ~620ms, not at the full ~2000ms it would
take to buffer the whole response. That's the whole point of streaming.

## Why not Server-Sent Events?

We mentioned this in chapter 1 but it's worth seeing the alternatives
side by side.

| Transport | Pros | Cons |
|---|---|---|
| `text/plain` ReadableStream (chosen) | Simplest possible client. No framing. Trivial to `curl`. | No way to send structured metadata mid-stream (e.g. token counts). |
| Server-Sent Events (`text/event-stream`) | Reconnect support. Named event types. Explicit framing. | More client code. The Anthropic SDK already gives us deltas — we'd just be re-wrapping. |
| WebSocket | Full-duplex, lower per-message overhead. | Stateful, needs upgrade handling, won't work behind some proxies. Overkill for one-way streaming. |

For a single-direction stream of plain text, the simplest option wins.
If you ever needed to send "the model is thinking" or "usage so far"
events interleaved with text, SSE would earn its keep.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Hit `/api/chat` with `curl` and watch the bytes stream.

   <details>
   <summary><b>Solution</b></summary>

   With the dev server running:

   ```bash
   curl -N -X POST http://localhost:3000/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"locale":"en","messages":[{"role":"user","content":"Say hi in 5 words"}]}'
   ```

   `-N` disables curl's output buffering so you see chars as they arrive.
   The response is plain text — no JSON envelope, no SSE framing.
   This is the simplest possible streaming protocol, and exactly why it
   was chosen for this route.
   </details>

2. Send an empty `content` field in the body. What does the response
   look like?

   <details>
   <summary><b>Solution</b></summary>

   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"locale":"en","messages":[{"role":"user","content":""}]}'
   ```

   You get HTTP 400 with `{"error":"..."}` because `MessageSchema`
   requires `content` to be `.min(1)`. The fact that this is a
   structured JSON error and **not** a stream is the whole reason we
   validate before constructing the stream — once the stream starts,
   we can't go back to 4xx.
   </details>

3. Change the model to `claude-haiku-4-5` and compare time-to-first-token
   and full-response time against Sonnet 4.6.

   <details>
   <summary><b>Solution</b></summary>

   Edit [src/app/api/chat/route.ts:46](../../src/app/api/chat/route.ts#L46):

   ```ts
   model: 'claude-haiku-4-5',
   ```

   Use DevTools → Network → Timing to read TTFB. Haiku is typically
   2–4× faster to first token and meaningfully cheaper, at some cost to
   answer quality on harder questions. For a recruiter chat, Haiku is a
   defensible choice; for nuanced career-advice questions, Sonnet wins.
   </details>

4. Add a custom header `x-clone-cache-hit: true|false` to the response
   that reflects whether the system prompt cache was read. (Hint: you'll
   need to look at the SDK's `finalMessage` or per-event usage.)

   <details>
   <summary><b>Solution</b></summary>

   This is harder than it sounds because we return the `Response`
   *before* the stream finishes — so we don't know cache stats at that
   point. The cleanest answer is to **not** put it in a header. Either:

   - Log it server-side after the loop ends (`console.log` of
     `(await messageStream.finalMessage()).usage`).
   - Emit a trailer at the very end of the stream: enqueue
     `\n\n[meta] cache_read=18000` after the `for await` exits.

   Headers must be sent before the body starts; the streaming nature
   of this route forces a different design. Useful gotcha to internalise.
   </details>

5. Make `max_tokens` configurable from the client (within a hard cap of
   2048). Where do you wire the validation?

   <details>
   <summary><b>Solution</b></summary>

   Add it to `BodySchema`:

   ```ts
   const BodySchema = z.object({
     locale: z.string().refine(hasLocale, ...),
     messages: z.array(MessageSchema).min(1).max(40),
     maxTokens: z.number().int().min(64).max(2048).optional(),
   });
   ```

   Then in the stream call:

   ```ts
   max_tokens: body.maxTokens ?? 1024,
   ```

   The cap is server-side enforced regardless of what the client sends.
   This is the same pattern as the message-length cap — never trust the
   client for cost-bounding parameters.
   </details>

Next chapter follows the bytes the other direction — how the browser
reads the stream and renders Markdown deltas without flicker.
