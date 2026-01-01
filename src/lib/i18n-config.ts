// Shared i18n configuration - can be imported by both server and client components

export const locales = ['fr', 'en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ja: '日本語',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ja: '🇯🇵',
};

// Type guard to check if a string is a valid locale
export const hasLocale = (locale: string): locale is Locale =>
  locales.includes(locale as Locale);

// Dictionary type based on the JSON structure
export interface Dictionary {
  nav: {
    posts: string;
    about: string;
    subscribe: string;
  };
  home: {
    welcome: string;
    tagline: string;
    browseByCategory: string;
    latestPosts: string;
    allPosts: string;
    posts: string;
    post: string;
    noPosts: string;
    noPostsInCategory: string;
    stayUpdated: string;
    stayUpdatedDesc: string;
    emailPlaceholder: string;
  };
  activity: {
    writingActivity: string;
    less: string;
    more: string;
    postsCount: string;
    postCount: string;
  };
  post: {
    backToPosts: string;
    writtenBy: string;
    viewAllPosts: string;
    minRead: string;
  };
  about: {
    title: string;
    subtitle: string;
    aboutMe: string;
    techStack: string;
    notCoding: string;
    journey: string;
    connect: string;
    thanks: string;
    readPosts: string;
  };
  footer: {
    tagline: string;
    rights: string;
  };
  categories: {
    all: string;
    reflections: string;
    experiences: string;
    culture: string;
    work: string;
    tech: string;
    daily: string;
  };
  filter: {
    showingPostsFrom: string;
    postsFound: string;
    postFound: string;
    clearFilter: string;
    noPostsOnDay: string;
    viewAllPosts: string;
  };
}

