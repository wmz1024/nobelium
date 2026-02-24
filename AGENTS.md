# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Nobelium is a static blog built on **Next.js 14** that uses **Notion as a CMS**. Blog content is fetched from a Notion database via the unofficial `notion-client` API and rendered using `react-notion-x`. It is designed to be deployed on **Vercel** with Incremental Static Regeneration (ISR).

## Commands

- **Dev server**: `pnpm dev` (runs on port 3000)
- **Build**: `pnpm build` (also runs `next-sitemap` as a postbuild step)
- **Lint**: `pnpm lint` (uses `next lint` with `eslint-config-next/core-web-vitals`)
- **Start production**: `pnpm start`

Package manager is **pnpm** (see `pnpm-lock.yaml` and `.npmrc`). Do not use npm or yarn.

## Environment Variables

- `NOTION_PAGE_ID` (required): The ID of the shared Notion database page. Set in `.env` for local dev.
- `NOTION_ACCESS_TOKEN` (optional): Token for private Notion databases.
- `VERCEL_ENV`: Used to distinguish production from development (controls analytics loading).

## Architecture

### Data Flow: Notion → Static Pages

1. `lib/server/notion-api.js` — Creates a singleton `NotionAPI` client from `notion-client`.
2. `lib/notion/getAllPosts.js` — Fetches the Notion database page, extracts the collection schema, iterates all page IDs, resolves properties via `getPageProperties`, filters to published posts via `filterPublishedPosts`, and sorts by date.
3. `lib/notion/getPostBlocks.js` — Fetches the full block tree for a single post (used for rendering).
4. Pages use `getStaticProps` / `getStaticPaths` with `revalidate: 1` for ISR.

### Configuration System (dual-mode)

- `blog.config.js` — Central config file (title, author, theme, analytics, comments, SEO, etc.). This is the primary file users customize.
- `lib/server/config.js` — Reads `blog.config.js` at build time via `eval()` (server-side only, CommonJS).
- `lib/config.js` — React Context provider (`ConfigProvider` / `useConfig`) that makes config available client-side.
- `pages/api/config.js` — API route that exposes `clientConfig` as JSON so the client can fetch it at runtime.
- `_app.js` loads config server-side via direct import, client-side via `/api/config` fetch.

### Rendering Pipeline

- `components/NotionRenderer.js` wraps `react-notion-x`'s `NotionRenderer` with lazy-loaded sub-renderers (Code with Prism.js + Mermaid, Collection, Equation/KaTeX, PDF, Tweet).
- Custom block type handling: toggle blocks are suffixed with `_nobelium` to use a custom `Toggle` component.
- `pages/[slug].js` post-processes the block map to remap language names (C++ → cpp, C# → csharp, Assembly → asm6502) and re-sign Notion file/attachment URLs.

### Patched Dependencies

`react-notion-x` and `notion-utils` have pnpm patches in `patches/`:
- `react-notion-x` patch adds support for custom block type renderers and fixes KaTeX display mode.
- These patches are applied automatically by pnpm. If upgrading these packages, patches must be regenerated.

### Styling

- **Tailwind CSS** with `darkMode: 'class'`. Config in `tailwind.config.js` imports `lib/server/config` for theme colors.
- `styles/globals.css` and `styles/notion.css` for global and Notion-specific overrides.
- Font stacks (sans/serif with CJK support) defined in `consts.js`.
- Dark mode managed by `lib/theme.js` via `ThemeProvider` using `react-use`'s `useMedia`.

### i18n

- Locale JSON files lazy-loaded from `assets/i18n/` via `assets/i18n/index.js`.
- Supported languages: en-US, zh-CN, zh-HK, zh-TW, ja-JP, es-ES.
- Locale provided via React Context (`lib/locale.js`).

### Comments

`components/Comments.js` supports multiple providers configured in `blog.config.js`: Gitalk, Utterances, Cusdis, and Waline. Each is dynamically imported with `ssr: false`.

### Path Aliases

Defined in `jsconfig.json`: `@/*` maps to project root, with explicit aliases for `@/components/*`, `@/layouts/*`, `@/lib/*`, `@/styles/*`, `@/data/*`.

### Key Routes

- `/` — Paginated blog index (`pages/index.js`)
- `/page/[page]` — Additional pagination pages
- `/[slug]` — Individual post/page (ISR with fallback)
- `/search` — Client-side search with tag filtering
- `/tag/[tag]` — Posts filtered by tag
- `/feed` — Atom RSS feed (server-side rendered)
- `/api/config` — Exposes blog config as JSON
