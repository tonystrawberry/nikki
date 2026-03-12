import { config, collection, fields } from '@keystatic/core';

const categoryOptions = [
  { label: 'Note 📝', value: 'note' },
  { label: 'Work 💼', value: 'work' },
  { label: 'Tech 💻', value: 'tech' },
  { label: 'Daily 📝', value: 'daily' },
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
        label: 'Category',
        options: categoryOptions,
        defaultValue: 'daily',
      }),
      tags: fields.array(
        fields.text({ label: 'Tag' }),
        { label: 'Tags', itemLabel: (props) => props.value ?? 'Tag' }
      ),
      coverImage: fields.text({ label: 'Cover Image URL' }),
      youtubeUrl: fields.text({ label: 'YouTube URL' }),
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
