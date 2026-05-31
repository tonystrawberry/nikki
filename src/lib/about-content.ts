/**
 * ABOUT CONTENT - src/lib/about-content.ts
 * ========================================
 *
 * Single source of truth for the personal bio + interests shown on the
 * /[locale]/about page. Extracted out of the page component so the
 * digital-clone chat can reuse the exact same facts in its system prompt
 * (see clone-context.ts) instead of duplicating them.
 *
 * Plain data only — no I/O, no server-only — so both the Server Component
 * page and the server-only clone context can import it.
 */

import type { Locale } from "./i18n-config";

export interface Bio {
  intro: string;
  why: string;
  topics: string;
  hope: string;
}

export const bio: Record<Locale, Bio> = {
  fr: {
    intro: "Je m'appelle Tony. Je vis à Tokyo et je travaille comme développeur.",
    why: "J'ai créé ce journal pour documenter ma vie, mes pensées et mes expériences. C'est un espace personnel où je peux écrire librement sur tout ce qui me passe par la tête.",
    topics: "Tu y trouveras des réflexions sur la vie, des reviews de films que j'ai aimés, des notes sur mon travail, et parfois juste des pensées random de mon quotidien.",
    hope: "J'espère que ces écrits pourront parfois te parler, ou au moins te divertir.",
  },
  en: {
    intro: "My name is Tony. I live in Tokyo and work as a developer.",
    why: "I created this diary to document my life, thoughts, and experiences. It's a personal space where I can freely write about anything that comes to mind.",
    topics: "You'll find reflections on life, reviews of movies I loved, notes about my work, and sometimes just random thoughts from my daily life.",
    hope: "I hope these writings can sometimes speak to you, or at least entertain you.",
  },
  ja: {
    intro: "私の名前はTonyです。東京に住んでいて、開発者として働いています。",
    why: "この日記を作ったのは、自分の人生、考え、経験を記録するためです。頭に浮かぶことを自由に書ける個人的な空間です。",
    topics: "人生についての考え、好きだった映画のレビュー、仕事についてのメモ、そして時には日常のランダムな思考が見つかります。",
    hope: "これらの文章があなたに響くことがあれば、少なくとも楽しんでもらえれば嬉しいです。",
  },
};

export interface Interest {
  emoji: string;
  label: Record<Locale, string>;
}

export const interests: Interest[] = [
  { emoji: "📖", label: { fr: "Lecture", en: "Reading", ja: "読書" } },
  { emoji: "🎮", label: { fr: "Jeux vidéo", en: "Gaming", ja: "ゲーム" } },
  { emoji: "🎬", label: { fr: "Cinéma", en: "Movies", ja: "映画" } },
  { emoji: "✈️", label: { fr: "Voyages", en: "Travel", ja: "旅行" } },
  { emoji: "🍜", label: { fr: "Cuisine", en: "Food", ja: "グルメ" } },
  { emoji: "🎵", label: { fr: "Musique", en: "Music", ja: "音楽" } },
];
