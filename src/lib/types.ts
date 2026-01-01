// Define available categories
export const CATEGORIES = {
  tech: { name: 'Tech', icon: '💻', description: 'Technology, programming, and digital tools' },
  society: { name: 'Society', icon: '🌍', description: 'Culture, trends, and social observations' },
  hobbies: { name: 'Hobbies', icon: '🎨', description: 'Creative pursuits and personal interests' },
  life: { name: 'Life', icon: '✨', description: 'Personal growth and life lessons' },
  books: { name: 'Books', icon: '📚', description: 'Reading notes and book reviews' },
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
