# 02 — Building the system prompt

The bot's "personality" lives entirely in one function:
`buildSystemPrompt(locale)` in [src/lib/clone-context.ts](../../src/lib/clone-context.ts).
This chapter walks through it line by line and explains why it produces
the shape it does.

## The two sources, and why both

Recruiters ask two different kinds of questions:

- **Factual** — "Where are you based? What's your stack? How do I reach you?"
- **Vibes** — "What are you interested in? What have you been working on?"

Pure blog content covers vibes well (Tony writes daily) but is hopeless
at facts (he doesn't write "my email is X" in a post). A pure CV file
gives facts but loses voice.

The clone uses both, fused into one system prompt:

1. **Persona file** — [content/persona/{locale}.md](../../content/persona/).
   Editable Markdown. The recruiter-facing brief: location, role, stack,
   languages spoken, what Tony is looking for, contact.
2. **Post digest** — for every Markdown file under `posts/{locale}/`, the
   title, date, category, tags, and excerpt. **Not** the body. That keeps
   the prompt around 15–20K tokens instead of 200K+.

## Reading the persona

```ts
// src/lib/clone-context.ts
const personaDir = path.join(process.cwd(), 'content', 'persona');

function readPersona(locale: Locale): string {
  const file = path.join(personaDir, `${locale}.md`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const fallback = path.join(personaDir, `${defaultLocale}.md`);
  return fs.readFileSync(fallback, 'utf8');
}
```

Two things to note. First, `'server-only'` at the top of the file
([clone-context.ts:1](../../src/lib/clone-context.ts#L1)) prevents this
from accidentally being imported into a client component — `fs` would
crash the bundle. The same poison-pill pattern is used in
[src/lib/i18n.ts](../../src/lib/i18n.ts).

Second, the fallback to `defaultLocale` (French, in this repo) keeps the
bot working even if a locale file is missing. The dictionary system in
[src/lib/blog.ts](../../src/lib/blog.ts) has the same idea — it's a
project convention worth keeping if you add more locale-aware features.

## Compressing the blog

```ts
function formatPostsDigest(locale: Locale): string {
  const posts = getAllPosts(locale);
  return posts
    .map((p) => {
      const tags = p.tags.length ? ` [${p.tags.join(', ')}]` : '';
      const excerpt = p.excerpt?.trim() ? ` — ${p.excerpt.trim()}` : '';
      return `- ${p.date} · ${p.category} · ${p.title}${tags}${excerpt}`;
    })
    .join('\n');
}
```

`getAllPosts(locale)` comes from [src/lib/blog.ts](../../src/lib/blog.ts)
and returns metadata (title, date, excerpt, category, tags) but **not**
the rendered HTML. Even if it did, we'd discard it — the goal is a
scannable index.

One row of the output for a real post looks like:

```
- 2026-05-23 · daily · Day 30 [reading, ddia] — Final notes on Designing Data-Intensive Applications, chapter 12.
```

With ~80 posts per locale, this gives Claude an at-a-glance map of *what*
Tony writes about and *when*, in roughly 200 tokens per post. That's
enough for the bot to say "you've been deep in DDIA recently" without
needing the full chapter prose.

### Why excerpts and not summaries?

Excerpts are already curated by the blog author (it's a frontmatter
field). Generating LLM summaries on every build would be expensive and
non-deterministic; using the existing `excerpt` field reuses work that's
already been done. It's a small example of the broader principle: when
your codebase already has a hand-curated field, use it before reaching
for a generative one.

## Per-locale role line and reply language

```ts
const PERSONA_BY_LOCALE: Record<Locale, { roleLine: string; replyLanguage: string }> = {
  fr: { roleLine: 'Tu es le « clone numérique » de Tony Duong. ...',
        replyLanguage: 'Réponds toujours en français.' },
  en: { roleLine: "You are Tony Duong's digital clone. ...",
        replyLanguage: 'Always reply in English.' },
  ja: { roleLine: 'あなたは Tony Duong の「デジタルクローン」です。...',
        replyLanguage: '回答は常に日本語で行ってください。' },
};
```

The role line and the reply-language instruction are intentionally
written *in* the target language. Models follow language-of-instruction
more reliably than `Respond in {locale}` written in English. This is a
small prompt-engineering trick worth internalising — see [the same
pattern in the dictionary files](../../src/dictionaries/) where every
locale has its own copy of every string.

## Assembling the prompt

```ts
export function buildSystemPrompt(locale: Locale): string {
  const persona = readPersona(locale);
  const digest = formatPostsDigest(locale);
  const { roleLine, replyLanguage } = PERSONA_BY_LOCALE[locale];

  return `${roleLine}

${replyLanguage}

# Style
- Talk in first person as Tony, in a friendly, professional tone.
- Be concise: 2-4 short paragraphs unless the recruiter asks for more.
- ...

# Recruiter brief (${localeNames[locale]})
${persona}

# Blog posts index (titles, dates, tags, excerpts)
${digest}
`;
}
```

Order matters. The render order Claude sees is:

```
tools (none)
system [
  cache_control: ephemeral, text:
    [role line]
    [reply language]
    [style rules]
    [persona block, ~50–200 lines]
    [post digest, ~80 lines]
]
messages [
  user / assistant / user / assistant ...
]
```

The whole system block carries one `cache_control: { type: 'ephemeral' }`
marker (set in [src/app/api/chat/route.ts:51](../../src/app/api/chat/route.ts#L51)).
That tells Claude: "everything up to here is stable, cache it for 5
minutes."

## Why the order is what it is — the prompt-caching gotcha

Prompt caching is a **prefix match**. Any byte change anywhere in the
prefix invalidates everything after it. That has consequences for what
goes where:

| Position | What lives here | Why |
|---|---|---|
| Very early | Role line, reply language, style rules | Frozen across all recruiters, all sessions. Maximum cache reuse. |
| Middle | Persona block | Changes only when you edit the Markdown — i.e. rarely. |
| End of system | Post digest | Changes only when you publish a new post — still rare. |
| `messages` | Conversation | Changes every turn. Lives after the cache marker on purpose. |

If you ever interpolate something time-varying into the system prompt —
`Today is ${new Date()}`, a session ID, a per-recruiter greeting — you'd
silently kill caching. The walkthrough below shows what that looks like.

### Walkthrough: what one byte costs you

Suppose you decide to add a freshness hint to the prompt:

```ts
// BAD — invalidates the cache every request
const today = new Date().toISOString().slice(0, 10);
return `... # Today: ${today}\n${persona}\n${digest}`;
```

Now imagine three back-to-back requests:

| Request | Prefix bytes | `cache_creation_input_tokens` | `cache_read_input_tokens` |
|---|---|---|---|
| #1 at 10:00 | `# Today: 2026-05-24\n...` | ~18,000 | 0 |
| #2 at 10:00 | `# Today: 2026-05-24\n...` (same) | 0 | ~18,000 |
| #3 at 10:01 | `# Today: 2026-05-24\n...` (same) | 0 | ~18,000 |

Same day, still hitting. Now wait until the next day:

| Request | Prefix bytes | `cache_creation_input_tokens` | `cache_read_input_tokens` |
|---|---|---|---|
| #4 at 00:01 next day | `# Today: 2026-05-25\n...` (one byte differs) | ~18,000 | 0 |

One byte. Full cache miss. If you need fresh-time data, put it **after**
the cache marker — in a user-turn message or assistant follow-up — not
in the system block.

You can verify cache behaviour in any response: the Anthropic SDK's
result carries `usage.cache_read_input_tokens` and
`usage.cache_creation_input_tokens`. We don't currently log them in
this repo, but it's a one-line addition for the curious.

## What this approach gives up

Two things to be honest about:

- **No semantic search.** If a recruiter asks "did you write about
  database replication?" the bot answers from titles/excerpts only.
  It can say "yes, around late May, see Day 30" but can't quote the
  paragraph. For this project that's the right trade — a personal blog
  doesn't need RAG.
- **Bounded by context window.** If the blog grows to 500 posts, the
  digest balloons past 100K tokens. At that point you'd either filter
  (last N posts, or only tagged-`tech`) or switch to a retrieval step.
  The current code is honest about its scaling ceiling; growing past it
  is a chapter for a future you.

## Try it out

Try each step yourself first — expand the solution only when stuck.

1. Add a "Years of experience: 5" line to
   [content/persona/en.md](../../content/persona/en.md), then ask the
   chat "how much experience do you have?" Confirm the answer reflects
   your edit.

   <details>
   <summary><b>Solution</b></summary>

   Edit the file, save, no restart needed. The bot should now say "5
   years" (it shouldn't make one up because the style rules forbid
   inventing facts). This proves the persona is a runtime read — see
   the `readPersona` snippet earlier in this chapter.
   </details>

2. Trim the digest to only the 10 most recent posts. Where would you
   change it, and what's the trade-off?

   <details>
   <summary><b>Solution</b></summary>

   Edit [src/lib/clone-context.ts:17](../../src/lib/clone-context.ts#L17):

   ```ts
   function formatPostsDigest(locale: Locale): string {
     const posts = getAllPosts(locale).slice(0, 10);
     return posts.map(/* ... */).join('\n');
   }
   ```

   `getAllPosts` already sorts newest-first
   ([blog.ts:298](../../src/lib/blog.ts#L298)). Trade-off: cheaper prompt
   (~2K tokens instead of ~18K), but the bot loses context about older
   posts. For a personal blog this is a reasonable lever — for an
   archive site it'd hide important history.
   </details>

3. Make the bot refuse to discuss salary expectations, no matter how
   it's asked. Where in the prompt does that live, and why there?

   <details>
   <summary><b>Solution</b></summary>

   Add a bullet to the `# Style` block in [clone-context.ts:48](../../src/lib/clone-context.ts#L48):

   ```ts
   - Never quote salary numbers or compensation expectations. If asked, say
     you don't discuss this in chat and ask the recruiter to email Tony directly.
   ```

   It goes in the style rules because that block is at the *very* top of
   the system prompt — instructions early in the prompt have stronger
   priority. Putting it in the persona file would also work, but mixing
   "behaviour rules" with "facts" makes the persona harder to maintain.
   </details>

4. Print the system prompt produced for the English locale and read it
   yourself. (Hint: write a tiny script, don't paste it into the
   browser.)

   <details>
   <summary><b>Solution</b></summary>

   Create a file `scripts/dump-prompt.ts`:

   ```ts
   import { buildSystemPrompt } from '@/lib/clone-context';
   console.log(buildSystemPrompt('en'));
   ```

   Then run it with tsx (no extra dependency needed if you use Node's
   `--experimental-strip-types`, or `npx tsx scripts/dump-prompt.ts`).
   Reading what your model actually sees is the single highest-leverage
   debugging move for prompt-driven systems.
   </details>

5. Imagine a recruiter who only speaks Spanish. What would you change
   to support `es` as a fourth locale?

   <details>
   <summary><b>Solution</b></summary>

   At minimum:
   - Add `'es'` to [src/lib/i18n-config.ts:50](../../src/lib/i18n-config.ts#L50)'s `locales` array, plus `localeNames.es` and `localeFlags.es`.
   - Add an `es` entry to `PERSONA_BY_LOCALE` in
     [src/lib/clone-context.ts:33](../../src/lib/clone-context.ts#L33).
   - Add `content/persona/es.md` and `src/dictionaries/es.json`.
   - The bot can still talk about French/English/Japanese posts even
     without `posts/es/` — the digest will just be empty for `es`.

   That last bullet matters: the bot's *interface language* (Spanish)
   is decoupled from the *content language* (the posts). Lots of
   real-world i18n bugs come from conflating those.
   </details>

Next chapter follows the prompt out of this function and into the
streaming API route — Zod validation, `ReadableStream`, and how the
Anthropic SDK's async iterator becomes UTF-8 bytes the browser can read.
