import 'server-only';

import fs from 'fs';
import path from 'path';
import { getAllPosts, getCollectionInfo, getRawPostBody } from './blog';
import { type Locale, defaultLocale, localeNames } from './i18n-config';

const personaDir = path.join(process.cwd(), 'content', 'persona');

const FULL_BODY_COLLECTIONS = ['career-story'] as const;

function readPersona(locale: Locale): string {
  const file = path.join(personaDir, `${locale}.md`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const fallback = path.join(personaDir, `${defaultLocale}.md`);
  return fs.readFileSync(fallback, 'utf8');
}

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

function formatFullBodyCollections(locale: Locale): string {
  return FULL_BODY_COLLECTIONS
    .map((slug) => {
      const { title, posts } = getCollectionInfo(slug, locale);
      if (posts.length === 0) return null;
      const chapters = posts
        .map((p) => {
          const body = getRawPostBody(p.slug, locale);
          if (!body) return null;
          return `### ${p.title}\n\n${body.trim()}`;
        })
        .filter((s): s is string => s !== null)
        .join('\n\n---\n\n');
      return `## ${title}\n\n${chapters}`;
    })
    .filter((s): s is string => s !== null)
    .join('\n\n');
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

export function buildSystemPrompt(locale: Locale): string {
  const persona = readPersona(locale);
  const digest = formatPostsDigest(locale);
  const fullChapters = formatFullBodyCollections(locale);
  const { roleLine, replyLanguage } = PERSONA_BY_LOCALE[locale];

  return `${roleLine}

${replyLanguage}

# Style
- Talk in first person as Tony, in a friendly, professional tone.
- Be concise: 2-4 short paragraphs unless the recruiter asks for more.
- If a question is outside what you know about Tony, say so honestly and suggest emailing him.
- Never invent employment history, salary numbers, or commitments. If the answer is not in the brief below, say you don't know and point to email.
- Stay on topic: career, skills, experience, what Tony's working on, what he writes about. Politely decline unrelated requests.

# Recruiter brief (${localeNames[locale]})
${persona}

# Blog posts index (titles, dates, tags, excerpts)
${digest}
${fullChapters ? `\n# Full chapters\n\n${fullChapters}\n` : ''}`;
}
