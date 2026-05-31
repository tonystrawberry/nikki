# 05 — Testing and deployment

This codebase ships with no automated tests for the chat feature. That's
a deliberate trade — for a feature this small, with two pure functions
and one streaming route, the maintenance cost of tests was judged
higher than the value. This chapter walks through what testing *would*
look like if you wanted it, then covers what it takes to deploy this in
front of real recruiters.

## What's worth testing, and what isn't

| Code path | Worth a test? | Why |
|---|---|---|
| `buildSystemPrompt(locale)` | Yes | Pure function. Given a locale and the filesystem, returns a string. Easy to assert against. |
| `readPersona(locale)` fallback | Yes | The "missing locale → defaultLocale" branch is exactly the kind of thing that silently breaks. |
| `BodySchema.parse(...)` boundary | Maybe | Zod's own tests already cover the framework. Worth one happy/sad path test for documentation. |
| `client.messages.stream(...)` integration | No | This is a wrapper over the Anthropic SDK. Testing it means either mocking the SDK (low value) or hitting the real API (expensive, flaky). |
| The React UI's stream reader | Maybe | Behavioural test with Playwright if it ever breaks twice. |

The pattern here is: **test the parts that are pure and cheap. Skip the
parts that need network or DOM unless you've already been bitten.**

## A unit test for `buildSystemPrompt`

The project doesn't currently have a test runner installed. If you
wanted to add one, Vitest fits Next.js 16 cleanly:

```bash
npm install -D vitest @types/node
```

Then create `src/lib/__tests__/clone-context.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from '../clone-context';

describe('buildSystemPrompt', () => {
  it('includes the persona content for the requested locale', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('Tony Duong');
    expect(prompt).toContain('tony.duong.102@gmail.com');
  });

  it('uses the locale-specific reply-language instruction', () => {
    expect(buildSystemPrompt('en')).toContain('Always reply in English');
    expect(buildSystemPrompt('fr')).toContain('Réponds toujours en français');
    expect(buildSystemPrompt('ja')).toContain('回答は常に日本語で行ってください');
  });

  it('includes at least one post in the digest', () => {
    const prompt = buildSystemPrompt('en');
    // Format: "- YYYY-MM-DD · category · title"
    expect(prompt).toMatch(/- \d{4}-\d{2}-\d{2} · (note|work|tech|daily) · /);
  });
});
```

Add a `test` script to [package.json](../../package.json):

```json
"scripts": {
  "test": "vitest run"
}
```

Run with `npm test`. This is the highest-leverage test you can write
for this feature — every regression you'd actually see (missing
persona, wrong language instruction, posts not loaded) is caught.

## Smoke-testing the API by hand

For the streaming route, a `curl` smoke test is more useful than a unit
test:

```bash
# Make sure ANTHROPIC_API_KEY is set
cp .env.local.example .env.local
# paste your key
npm run dev
```

Then in another terminal:

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "locale":"en",
    "messages":[{"role":"user","content":"Reply with exactly: PONG"}]
  }'
```

Expected output: the literal text `PONG` (possibly with surrounding
punctuation depending on the model's mood) streamed to stdout. If you
get anything else:

- `HTTP/1.1 500 ANTHROPIC_API_KEY is not configured` — your key isn't
  in `.env.local`, or the dev server was started before you added it.
  Restart `npm run dev`.
- `HTTP/1.1 400 Unsupported locale` — typo in the request.
- Empty response with `Connection: close` — the model crashed mid-stream.
  Check the dev-server logs for the in-stream `[error] ...` text.

Save the curl command somewhere durable; it's the fastest way to verify
the feature works after any change.

## Pre-deploy checklist

Before opening the chat URL to recruiters, walk through:

1. **`npm run lint && npm run build` is green.** See the project's
   convention in [CLAUDE.md](../../CLAUDE.md). The build step runs `tsc`
   as part of itself — there's no separate `typecheck`.
2. **Persona files have your real info.** The starter templates in
   [content/persona/](../../content/persona/) contain placeholders. The
   bot will quote them verbatim.
3. **`ANTHROPIC_API_KEY` is set in the production environment**, not just
   in `.env.local`. See the next section.
4. **Cost cap on the Anthropic console.** Set a monthly budget alert.
   For a personal blog with ~10 conversations a month at Sonnet 4.6
   prices, you're looking at single-digit dollars; but a misbehaving
   bot or a viral post could spike that.
5. **You're comfortable with what the bot might say.** Read the system
   prompt — `buildSystemPrompt('en')` — and decide whether its style
   rules and refusal language match what you want a recruiter to read.

## Setting the API key in production

The exact mechanism depends on the host. The shape of the answer is the
same everywhere: an environment variable named `ANTHROPIC_API_KEY` must
be available to the Node process running the Next.js server.

| Host | How |
|---|---|
| Vercel | Project Settings → Environment Variables → add `ANTHROPIC_API_KEY` for Production (and Preview if you want PR previews to chat). Redeploy. |
| Cloudflare Pages | Settings → Environment variables. Note: Pages uses the Edge runtime by default — this route forces `runtime = 'nodejs'`, so deploy via Cloudflare Workers + Node compat or migrate the route off `fs`. |
| Self-hosted (Docker, EC2) | Either `docker run -e ANTHROPIC_API_KEY=...` or a `.env.production` file your process manager reads. Never bake the key into the image. |
| Fly.io | `fly secrets set ANTHROPIC_API_KEY=...` then `fly deploy`. |

The route handler reads `process.env.ANTHROPIC_API_KEY` at request time,
not at module load, so a missing key produces a runtime error (handled
gracefully — see [chapter 3](./03-the-streaming-api.md#the-env-var-check))
rather than a build failure.

## Walkthrough: a request in production

For mental model purposes, here's what happens when a recruiter at
`https://your-domain.com/en/chat` sends a message, with the
Vercel/Node hosting in mind:

| Step | Where | What |
|---|---|---|
| 1 | Browser | `fetch('/api/chat', ...)` |
| 2 | Edge network | Routes to nearest Vercel function region |
| 3 | Node lambda | Cold start (~200ms) or warm (~5ms) |
| 4 | Node lambda | `route.ts` runs, validates body, builds system prompt |
| 5 | Node lambda → Anthropic API | TLS, streamed request body, streamed response |
| 6 | Node lambda | Forwards deltas as bytes to the HTTP response |
| 7 | Edge network | Streams bytes back to browser without buffering |
| 8 | Browser | `TextDecoder` + Markdown render |

Steps 5–7 are where streaming earns its keep — if the platform buffered
the response (some configurations of nginx do), the recruiter would
wait for the whole reply instead of seeing it type. Vercel's default
config does not buffer; for self-hosted setups behind nginx, you need
`proxy_buffering off;` and `X-Accel-Buffering: no` in response headers.

## What's deliberately *not* shipped

Some things you might expect that aren't here, and why:

- **Rate limiting.** The route accepts unauthenticated POSTs at
  whatever rate the network allows. For a personal blog with no inbound
  traffic, that's fine; for production it's risky. The simplest
  defence is per-IP rate limiting via [Vercel's Edge Config](https://vercel.com/docs/edge-config)
  or a middleware in [src/proxy.ts](../../src/proxy.ts) (if you have
  one) that tracks request counts.
- **Conversation logging.** No persistence, intentional. If you want
  analytics ("what do recruiters ask about?"), the right place is in
  the `start` callback of the `ReadableStream` — log to a write-only
  sink before streaming back. Watch out for PII.
- **Authentication.** No login. Recruiters chat anonymously. If you
  ever needed accounts, the cleanest place to gate it is the
  page-level Server Component, not the API route — that way an
  unauthenticated user never reaches the API.
- **Abuse detection.** No "is this prompt-injection" filter. Sonnet 4.6
  is reasonably robust to "ignore previous instructions" attacks
  thanks to the system prompt's style rules, but it's not perfect.
  If this matters, run the user's input through a small classifier
  first.

Each of these would be the right thing to add if traffic grew. For a
personal blog, they're features whose absence is the right call.

## When you outgrow this

The shape of the feature changes if any of these become true:

| If… | Then… |
|---|---|
| The blog passes ~500 posts and the digest > 100K tokens | Add a retrieval step — embed posts, fetch top-k by query. Keep the persona file as-is. |
| Recruiters expect chat history across visits | Add a session ID cookie and persist messages server-side. Now you're a real product and need a privacy policy. |
| You want multiple bot personas (e.g. "recruiter chat" vs "interviewer practice") | Move `roleLine` + style rules into per-persona Markdown files alongside the recruiter brief, keyed by route path. |
| Latency is the bottleneck | Switch to `claude-haiku-4-5`, or move the API route to the Edge runtime (which requires getting rid of `fs.readFileSync`). |

The current design optimises for "easy to read, easy to change". As
soon as more than one engineer is working on it, the friction points
above become real and the architecture can grow into them.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Write the Vitest test for `buildSystemPrompt` shown above and run it.

   <details>
   <summary><b>Solution</b></summary>

   Install Vitest:

   ```bash
   npm install -D vitest @types/node
   ```

   Create `src/lib/__tests__/clone-context.test.ts` with the body
   from the chapter, add `"test": "vitest run"` to the scripts in
   [package.json](../../package.json), then:

   ```bash
   npm test
   ```

   Expected: 3 passing tests. If the third (posts digest) fails, your
   `posts/en/` directory is empty — add at least one post, or change
   the assertion to allow an empty digest.
   </details>

2. Add a check at the top of the API route that returns 403 if the
   `x-clone-token` header doesn't match a secret env var. Useful if you
   want to gate access while testing in production.

   <details>
   <summary><b>Solution</b></summary>

   In [src/app/api/chat/route.ts](../../src/app/api/chat/route.ts),
   right after the `apiKey` check:

   ```ts
   const expected = process.env.CLONE_ACCESS_TOKEN;
   if (expected && req.headers.get('x-clone-token') !== expected) {
     return new Response(JSON.stringify({ error: 'Forbidden' }), {
       status: 403,
       headers: { 'Content-Type': 'application/json' },
     });
   }
   ```

   The `if (expected)` guard means: if you don't set
   `CLONE_ACCESS_TOKEN`, the route is public. Set it to enable gating.
   For the client to actually send the header, you'd add it to the
   `fetch` call in [CloneChat.tsx](../../src/components/CloneChat.tsx)
   — which means the secret leaks to the browser bundle. So this is
   only useful for server-to-server calls (e.g. an admin tool), not
   public-facing chat.
   </details>

3. The dev server is running. Use `curl` to send a malformed locale and
   confirm the API returns 400 with a useful error.

   <details>
   <summary><b>Solution</b></summary>

   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"locale":"klingon","messages":[{"role":"user","content":"hi"}]}'
   ```

   Expected: `HTTP 400` with body something like
   `{"error":"... Unsupported locale ..."}`. The error message comes
   from the `.refine(hasLocale, { message: 'Unsupported locale' })` in
   [route.ts:13](../../src/app/api/chat/route.ts#L13). This is your
   most basic regression test — if it ever returns 200 or 500, the
   schema isn't doing its job.
   </details>

4. Sketch (don't implement) a per-IP rate limit of 10 messages per
   minute. Where would it live, and what's the failure mode you'd
   worry about?

   <details>
   <summary><b>Solution</b></summary>

   Two reasonable places:

   - **Top of [route.ts](../../src/app/api/chat/route.ts)** — call a
     `rateLimit(ip)` helper before validation. Pros: explicit, easy
     to read. Cons: needs storage (Redis, Vercel KV).
   - **[src/proxy.ts](../../src/proxy.ts) (Next.js middleware)** —
     applies to all routes, including future ones. Cons: less
     obvious from the route's code that it's gated.

   Failure mode to worry about: shared IPs behind corporate NATs. A
   single rate-limit bucket can lock out an entire office. Mitigation:
   key by `IP + fingerprint` (User-Agent hash), or accept it and set
   the limit generously (60/min instead of 10).
   </details>

5. The chat works in dev but the deployed version returns 500 with no
   detail in the response body. Where do you look first?

   <details>
   <summary><b>Solution</b></summary>

   In order:

   1. **Host's function logs.** Vercel → Deployments → function tab →
      look for `ANTHROPIC_API_KEY is not configured` or any unhandled
      exception. The route's 500 path returns a generic JSON message
      to clients but the underlying error is logged.
   2. **Environment variables in the dashboard.** It's almost always
      a missing `ANTHROPIC_API_KEY`.
   3. **The Anthropic console.** If you're past your spend cap or
      your key is revoked, requests will fail. The error in the logs
      will mention `Anthropic.AuthenticationError` or similar.
   4. **The build output.** If your host built without picking up
      `.env.local`, the lint will pass but runtime will fail. The
      principle: build-time env vars and runtime env vars are
      different concepts in Next.js.

   90% of "works locally, breaks in prod" issues with this feature are
   step 2.
   </details>

You've now read the entire chat feature top to bottom and seen what it
takes to put it in front of real users. Open
[src/lib/clone-context.ts](../../src/lib/clone-context.ts),
[src/app/api/chat/route.ts](../../src/app/api/chat/route.ts), and
[src/components/CloneChat.tsx](../../src/components/CloneChat.tsx)
side by side once more — you should be able to point at any line and
explain why it's there.
