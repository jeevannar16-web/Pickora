# Spinora

A polished, dark-mode-first random picker / winner-selection wheel built as a fully client-side progressive web app. Everything runs in your browser — no accounts, no uploads, no server.

![tech](https://img.shields.io/badge/React-19-61DAFB) ![tech](https://img.shields.io/badge/TypeScript-6-3178C6) ![tech](https://img.shields.io/badge/Vite-8-646CFF) ![tech](https://img.shields.io/badge/Tailwind-4-38BDF8) ![tech](https://img.shields.io/badge/Zustand-5-7C3AED)

## Features

- **Custom SVG wheel** — 8 wheel styles, various pointer & hub designs. No canvas, no dependencies — the wheel is drawn in SVG and the winner math is unit-tested.
- **Zero-restart spins** — single or multiple winners, duplicates allowed or not.
- **8 built-in themes** (Aurora, Midnight Neon, Ocean, Sunset, Candy, Emerald, Royal Gold, Minimal Mono) plus a full **theme editor** to build your own.
- **Settings** — wheel size, spin duration & easing, confetti, tick sounds, winner mode, and more.
- **Winner history** — every draw is recorded with its ID, mode, and results.
- **Bulk management** — paste a list, import/export CSV & JSON, duplicate detection, undo, search.
- **Presentation mode** — fullscreen wheel, Space to spin, Esc to exit.
- **Accessibility-first** — reduced-motion support, keyboard navigation, landmarks, screen-reader labels.
- **Persistence** — all state (names, theme, settings, history) lives in `localStorage`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start the Vite dev server              |
| `npm run build`  | Production build to `dist/`            |
| `npm run typecheck` | TypeScript type checking            |
| `npm run lint`   | Oxlint                                 |
| `npm run test`   | Vitest unit tests                      |
| `npm run test:e2e` | Playwright end-to-end tests          |

## Testing

- **45 unit tests** — random selection, all-or-nothing semantics, multi-winner without duplicates, deterministic wheel-segment/pointer alignment math.
- **21 end-to-end tests** (Playwright) — desktop flows (add, spin, winners, history, presentation) and mobile layout (bottom-nav, bottom sheets, no horizontal overflow).

```bash
npm run test        # unit tests
npx playwright test # e2e tests (desktop + mobile projects)
```

## Tech stack

React 19 · TypeScript 6 · Vite · Tailwind CSS v4 · Zustand · Framer Motion · Radix UI · canvas-confetti · Vitest · Playwright

## License

MIT

## Deployment

This is a fully static SPA. The `npm run build` command outputs production assets to `dist/`.

### Recommended hosts (free tiers)

- **Netlify** — Connect GitHub repo, auto-deploys on push. Add `netlify.toml` (included).
- **Cloudflare Pages** — Connect GitHub repo, auto-deploys on push. Uses `public/_headers` + `public/_redirects` (included).
- **GitHub Pages** — Requires `base` config in `vite.config.ts` and a GitHub Actions workflow.

### Quick deploy (Netlify Drop)

```bash
npm run build
# Drag the `dist/` folder to https://app.netlify.com/drop
```

### GitHub Pages setup (if preferred)

1. In `vite.config.ts`, add `base: '/Pickora/'` (repo name).
2. Add `.github/workflows/deploy.yml` (see Vite docs).
3. Enable Pages in repo Settings → Pages → GitHub Actions.