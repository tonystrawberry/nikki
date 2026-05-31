/**
 * RAG CHUNKING - src/lib/rag-chunk.ts
 * ===================================
 *
 * Pure, dependency-free functions that split a Markdown post body into
 * retrieval chunks. Kept separate from file I/O and the network so it can
 * be reasoned about (and unit-tested) in isolation.
 *
 * STRATEGY: split on `##` (h2) headings. The blog's memo posts are already
 * authored as `## Section` blocks (see CLAUDE.md / the /daily skill), so
 * headings are a natural semantic boundary — each chunk is one coherent
 * idea. Content before the first heading becomes an "intro" chunk.
 *
 * Oversized sections are windowed by paragraph with a small overlap so we
 * never ship a 3000-word wall as a single chunk (hurts retrieval precision
 * and can blow the embedding request's token budget).
 */

/** A post as read off disk, frontmatter already stripped. */
export interface RawPost {
  slug: string;
  title: string;
  date: string;
  /** Markdown body with frontmatter removed. */
  body: string;
}

/** One retrieval unit: a slice of a post, with enough metadata to cite it. */
export interface Chunk {
  slug: string;
  title: string;
  date: string;
  /** The `##` heading this chunk lives under, or '' for the intro. */
  heading: string;
  /** Raw Markdown text of the chunk (what we show the model). */
  text: string;
}

/** Roughly ~1000 tokens. Sections longer than this get windowed. */
const MAX_CHUNK_CHARS = 4000;
/** Overlap between windows so an idea split across the boundary survives. */
const OVERLAP_CHARS = 400;

interface Section {
  heading: string;
  body: string;
}

/** Split a Markdown body into sections at `##` (h2) headings. */
function splitByHeadings(body: string): Section[] {
  const lines = body.split('\n');
  const sections: Section[] = [];
  let heading = '';
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text) sections.push({ heading, body: text });
    buffer = [];
  };

  for (const line of lines) {
    const match = /^##\s+(.*)$/.exec(line);
    if (match) {
      flush();
      heading = match[1].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

/**
 * Window an over-long section into ~MAX_CHUNK_CHARS slices, breaking on
 * paragraph boundaries and overlapping by OVERLAP_CHARS.
 */
function windowText(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const paragraphs = text.split(/\n{2,}/);
  const windows: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > MAX_CHUNK_CHARS) {
      windows.push(current.trim());
      // Start the next window with a tail of the previous one for context.
      current = current.slice(-OVERLAP_CHARS) + '\n\n' + para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) windows.push(current.trim());

  // A single paragraph longer than the cap: hard-split it.
  return windows.flatMap((w) =>
    w.length <= MAX_CHUNK_CHARS * 1.5
      ? [w]
      : (w.match(new RegExp(`[\\s\\S]{1,${MAX_CHUNK_CHARS}}`, 'g')) ?? [w])
  );
}

/** Split one post into chunks ready for embedding. */
export function chunkPost(post: RawPost): Chunk[] {
  const sections = splitByHeadings(post.body);
  const chunks: Chunk[] = [];

  for (const section of sections) {
    for (const window of windowText(section.body)) {
      chunks.push({
        slug: post.slug,
        title: post.title,
        date: post.date,
        heading: section.heading,
        text: window,
      });
    }
  }
  return chunks;
}

/**
 * The text actually sent to the embedding model. We prepend the post title
 * and heading so a chunk's topic is captured even when the body text is
 * terse (e.g. a bullet list under "## Key Takeaways").
 */
export function embeddingInput(chunk: Chunk): string {
  const head = chunk.heading ? `${chunk.title} › ${chunk.heading}` : chunk.title;
  return `${head}\n\n${chunk.text}`;
}
