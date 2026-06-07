import 'server-only';

import fs from 'fs';
import path from 'path';
import { getAllPosts } from './blog';
import { type Locale, defaultLocale, localeNames } from './i18n-config';
import type { RetrievedChunk } from './rag';

const personaDir = path.join(process.cwd(), 'content', 'persona');
const todosFile = path.join(process.cwd(), 'data', 'todos.json');

function readPersona(locale: Locale): string {
  const file = path.join(personaDir, `${locale}.md`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const fallback = path.join(personaDir, `${defaultLocale}.md`);
  return fs.readFileSync(fallback, 'utf8');
}

/**
 * Format Tony's TODO list (data/todos.json) — what he wants to do/learn and
 * what he recently finished. Gives the clone material for questions about his
 * goals, learning direction, and what's next. Best-effort: returns '' if the
 * file is missing or unreadable, so the prompt simply omits the section.
 */
function formatTodos(): string {
  let raw: string;
  try {
    raw = fs.readFileSync(todosFile, 'utf8');
  } catch {
    return '';
  }
  let items: { text: string; done: boolean }[];
  try {
    items = (JSON.parse(raw)?.items ?? []) as { text: string; done: boolean }[];
  } catch {
    return '';
  }
  const todo = items.filter((i) => !i.done).map((i) => `- ${i.text}`);
  const done = items.filter((i) => i.done).map((i) => `- ${i.text}`);
  const parts: string[] = [];
  if (todo.length) parts.push(`Wants to do / learn next:\n${todo.join('\n')}`);
  if (done.length) parts.push(`Recently completed:\n${done.join('\n')}`);
  return parts.join('\n\n');
}

function formatPostsDigest(locale: Locale): string {
  const posts = getAllPosts(locale);
  return posts
    .map((p) => {
      const tags = p.tags.length ? ` [${p.tags.join(', ')}]` : '';
      const excerpt = p.excerpt?.trim() ? ` — ${p.excerpt.trim()}` : '';
      return `- ${p.date} ・ ${p.categories.join('/')} ・ ${p.title}${tags}${excerpt}`;
    })
    .join('\n');
}

/**
 * Format the chunks retrieved by RAG into a system-prompt block. This is the
 * per-query "depth" layer: full text of the most relevant post sections, each
 * tagged with its source slug so the clone can cite a link.
 *
 * Returns '' when retrieval found nothing (or the index isn't built yet), in
 * which case the prompt is just persona + digest — today's behavior.
 */
export function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return '';
  const sections = chunks
    .map((c) => {
      const head = c.heading ? `${c.title} — ${c.heading}` : c.title;
      return `### ${head}\n(source: /posts/${c.slug})\n\n${c.text.trim()}`;
    })
    .join('\n\n---\n\n');
  return `# Relevant excerpts (full text, retrieved for this question)
These are the most relevant passages from Tony's blog for the current question. Prefer them over the index above when answering, and cite the source link when you use one.

${sections}`;
}

const PERSONA_BY_LOCALE: Record<Locale, { roleLine: string; replyLanguage: string }> = {
  fr: {
    roleLine:
      'Tu es le « clone numérique » de Tony Duong. Tu réponds aux recruteurs qui visitent son blog.',
    replyLanguage: 'Réponds toujours en français.',
  },
  en: {
    roleLine:
      "You are Tony Duong's digital clone. You're chatting with recruiters who visit his blog.",
    replyLanguage: 'Always reply in English.',
  },
  ja: {
    roleLine:
      'あなたは Tony Duong の「デジタルクローン」です。彼のブログを訪れたリクルーターと会話しています。',
    replyLanguage: '回答は常に日本語で行ってください。',
  },
};

/**
 * Build the STABLE part of the system prompt — persona + the lightweight
 * blog index. It does not depend on the user's question, so the API route
 * marks it with `cache_control: ephemeral`. The per-query RAG excerpts are a
 * separate block (see formatRetrievedContext) appended after this one.
 */
export function buildSystemPrompt(locale: Locale): string {
  const persona = readPersona(locale);
  const digest = formatPostsDigest(locale);
  const todos = formatTodos();
  const { roleLine, replyLanguage } = PERSONA_BY_LOCALE[locale];

  const todosBlock = todos
    ? `\n\n# Goals & learning list (Tony's TODOs)
These are things Tony wants to do or learn next, plus some he recently finished. Use them to answer questions about his goals, what he wants to learn, or where he's headed. Some are personal aspirations — mention them warmly but briefly, and for deeply personal topics suggest emailing him.
${todos}`
    : '';

  return `${roleLine}

${replyLanguage}

# Style
- Talk in first person as Tony, in a friendly, professional tone.
- Be concise: 2-4 short paragraphs unless the recruiter asks for more.
- If a question is outside what you know about Tony, say so honestly and suggest emailing him.
- Never invent employment history, salary numbers, or commitments. If the answer is not in the brief below, say you don't know and point to email.
- Stay on topic: career, skills, experience, what Tony's working on, what he writes about. Politely decline unrelated requests.

# Recruiter brief (${localeNames[locale]})
${persona}${todosBlock}

# Blog posts index (titles, dates, tags, excerpts)
The index below is for breadth — knowing what Tony has written about. For depth on a specific topic, use the "Relevant excerpts" block that may follow (retrieved per question).
${digest}`;
}
