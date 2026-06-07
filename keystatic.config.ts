import { config, collection, fields } from '@keystatic/core';

const categoryOptions = [
  { label: 'Note 📝', value: 'note' },
  { label: 'Work 💼', value: 'work' },
  { label: 'Tech 💻', value: 'tech' },
  { label: 'Daily 📝', value: 'daily' },
  { label: 'Reflections 💭', value: 'reflections' },
] as const;

function postCollection(label: string, path: `posts/${'fr' | 'en' | 'ja'}/**`) {
  return collection({
    label,
    slugField: 'title',
    path,
    format: { contentField: 'content' },
    schema: {
      title: fields.slug({ name: { label: 'Title' } }),
      date: fields.date({ label: 'Date' }),
      excerpt: fields.text({ label: 'Excerpt', multiline: true }),
      author: fields.text({
        label: 'Author',
        defaultValue: 'Tony Duong',
      }),
      category: fields.select({
        label: 'Category (legacy / primary)',
        description: 'Kept for backwards-compatibility. Prefer the "Categories" field below for new posts; if Categories is set, it takes precedence.',
        options: categoryOptions,
        defaultValue: 'daily',
      }),
      categories: fields.multiselect({
        label: 'Categories',
        description: 'A post can belong to several categories (e.g. Note + Tech). Takes precedence over the single Category field.',
        options: categoryOptions,
        defaultValue: [],
      }),
      tags: fields.array(
        fields.text({ label: 'Tag' }),
        { label: 'Tags', itemLabel: (props) => props.value ?? 'Tag' }
      ),
      coverImage: fields.text({ label: 'Cover Image URL' }),
      youtubeUrl: fields.text({ label: 'YouTube URL' }),
      collection: fields.text({
        label: 'Collection (slug)',
        description: 'Group posts into a book/series (e.g. "ddia"). Leave empty for standalone posts.',
      }),
      collectionOrder: fields.number({
        label: 'Collection order',
        description: 'Chapter/part order within the collection (e.g. 1, 2, 3).',
      }),
      collectionTitle: fields.text({
        label: 'Collection title',
        description: 'Display name for the collection (e.g. "Designing Data-Intensive Applications"). Set on one post.',
      }),
      content: fields.mdx({ label: 'Content', extension: 'md' }),
    },
  });
}

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    posts_fr: postCollection('Posts FR 🇫🇷', 'posts/fr/**'),
    posts_en: postCollection('Posts EN 🇬🇧', 'posts/en/**'),
    posts_ja: postCollection('Posts JA 🇯🇵', 'posts/ja/**'),
  },
});
