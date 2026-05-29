<!--
Sync Impact Report
===================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (first version)
Added sections:
  - Core Principles (5 principles)
  - Technology Constraints
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ reviewed — no updates needed
  - .specify/templates/spec-template.md ✅ reviewed — no updates needed
  - .specify/templates/tasks-template.md ✅ reviewed — no updates needed
Follow-up TODOs: none
-->

# tonysekai Constitution

## Core Principles

### I. Internationalization First

All user-facing content and UI MUST support the three project locales: `fr` (default), `en`, and `ja`. Every new page, component label, or user-visible string MUST have an entry in each dictionary file (`src/dictionaries/{fr,en,ja}.json`) and a corresponding field in the `Dictionary` type (`src/lib/i18n-config.ts`). Blog posts MUST exist in at least one locale directory under `posts/{locale}/`; cross-locale fallback (`en` then `fr`) handles missing translations at runtime but MUST NOT be relied upon as a permanent state. New routes MUST be nested under `[locale]`.

**Rationale**: The blog serves a trilingual audience. Incomplete translations degrade UX and break type safety.

### II. Server-First Rendering

Components MUST be Server Components by default. The `"use client"` directive MUST only be added when the component requires browser APIs, React hooks (`useState`, `useEffect`, etc.), or event handlers. File I/O (post reading, dictionary loading) MUST remain server-side and MUST use `server-only` imports where applicable. Client components MUST NOT import from modules marked `server-only`.

**Rationale**: Server Components reduce JavaScript bundle size, keep secrets safe, and improve initial load performance. Violating the boundary causes build failures.

### III. Content as Code

Blog posts are Markdown files stored in version control at `posts/{locale}/{YYYY-MM-DD}/{slug}.md` with YAML frontmatter. Post images MUST be stored under `public/images/blog/{YYYY-MM-DD}/`. Content MUST NOT live in a database or external CMS as the primary source of truth (Keystatic is an optional editing UI that reads/writes the same Markdown files). Frontmatter MUST include at minimum: `title`, `date`, `excerpt`, `author`, `category`, and `tags`.

**Rationale**: File-based content enables Git history, offline editing, easy migration, and removes runtime database dependencies.

### IV. Type Safety

TypeScript MUST be used for all source files. The `Dictionary` interface MUST stay in sync with the JSON dictionary files — every key added to a JSON file MUST have a corresponding type field, and vice versa. Explicit `any` casts are prohibited unless accompanied by a justifying comment. Type errors are caught by `npm run build` (Next.js runs `tsc` internally); there is no separate type-check script.

**Rationale**: The project has no dedicated test suite; the type system is the primary correctness safety net alongside linting.

### V. Build-Clean Commits

`npm run lint && npm run build` MUST pass before any commit is merged. Linting uses ESLint 9 with `eslint-config-next`. Build failures indicate type errors, missing imports, or broken pages. No code SHOULD be committed that introduces lint warnings unless explicitly justified and tracked.

**Rationale**: Without a test suite, the lint + build gate is the sole automated quality check. Keeping it green is non-negotiable.

## Technology Constraints

- **Framework**: Next.js 16 App Router. Pages Router patterns MUST NOT be introduced.
- **Styling**: Tailwind CSS v4 utility classes. Global CSS is limited to `src/app/globals.css` for CSS variables and base resets. No CSS-in-JS libraries.
- **UI library**: shadcn/ui components live in `src/components/ui/` as owned source code, not as an npm dependency.
- **Markdown pipeline**: `gray-matter` for frontmatter, `remark` + `remark-gfm` + `remark-html` for rendering. HTML is injected via `dangerouslySetInnerHTML`.
- **Routing**: `src/proxy.ts` handles locale detection and redirects (replaces legacy `middleware.ts`).
- **Path alias**: `@/*` maps to `./src/*`.
- **Node runtime**: Dependencies MUST be installable via `npm`. Python or other runtimes MUST NOT be required to build or run the site.

## Development Workflow

1. **Branch**: Create a feature branch from `main` for any non-trivial change.
2. **Develop**: Run `npm run dev` for the local dev server at `http://localhost:3000`. The root `/` redirects to `/fr`.
3. **Validate**: Run `npm run lint && npm run build` before committing.
4. **Content changes**: Adding a post requires creating the Markdown file, verifying frontmatter schema, and confirming the post renders at `/{locale}/posts/{slug}`.
5. **Dictionary changes**: When adding UI strings, update all three locale JSON files and the `Dictionary` interface simultaneously to avoid type errors.

## Governance

This constitution is the authoritative reference for project standards. All code reviews and automated checks MUST verify compliance with the principles above.

**Amendment procedure**:
1. Propose the change with rationale in a pull request modifying this file.
2. Update the version number following semantic versioning (MAJOR for principle removals/redefinitions, MINOR for new principles or material expansions, PATCH for clarifications and wording fixes).
3. Update `LAST_AMENDED_DATE` to the date of the merge.
4. Propagate changes to dependent templates and documentation as identified in the Sync Impact Report.

**Compliance review**: Every PR SHOULD be checked against these principles. The `npm run lint && npm run build` gate enforces Principles IV and V automatically; Principles I–III require human review.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
