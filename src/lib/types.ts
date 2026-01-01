// Define available categories for the personal diary
export const CATEGORIES = {
  reflections: { name: 'Reflections', icon: '💭', description: 'Thoughts on life, philosophy, and personal growth' },
  experiences: { name: 'Experiences', icon: '🌟', description: 'Memories, travels, and life moments' },
  culture: { name: 'Culture', icon: '🎬', description: 'Movies, music, books, and art' },
  work: { name: 'Work', icon: '💼', description: 'Career, projects, and professional life' },
  tech: { name: 'Tech', icon: '💻', description: 'Technology, coding, and digital tools' },
  daily: { name: 'Daily', icon: '📝', description: 'Everyday life and random thoughts' },
} as const;

export type Category = keyof typeof CATEGORIES;

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  category: Category;
  tags: string[];
  coverImage?: string;
  readingTime: string;
}

export interface Post extends PostMeta {
  content: string;
}
