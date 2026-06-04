# CLAUDE.md — Dictation App

## What This Is

**Dictify** — React SPA for audio dictation practice. Users listen to audio clips sentence by sentence, type what they hear, and can request hints. Content (MP3 + JSON) lives in a separate repo served via GitHub Pages.

## Architecture

```
src/
  main.tsx                  # entry point, BrowserRouter
  App.tsx                   # Routes: / → /list, /list, /player/:id
  types.ts                  # shared types + helpers + SOURCE_BASE_URL
  components/
    TopBar.tsx              # nav + theme toggle (persists to localStorage)
  pages/
    DictationListPage.tsx   # catalog with search / level filter / sort
    PlayerPage.tsx          # audio player + hint + reading mode + textarea
```

All CSS is in co-located `.module.css` files — no CSS framework.

## Content Source

All data is fetched from:
```
SOURCE_BASE_URL = 'https://leva13007.github.io/dictations/'
```
Defined in `src/types.ts:22`. A commented-out localhost alternative is there for local content dev.

Data shape:
- `GET /dics/index.json` → `{ language, dics: DicCatalogItem[] }`
- `GET /dics/:id/playlist.json` → `PlaylistRecord[]`

`DicCatalogItem`: `id, title, level (CEFR A1–C2), sentences, duration_sec, tags, has_video`
`PlaylistRecord`: `id, text, audio` (audio is a relative path resolved via `toAudioUrl()`)

## Build & Deploy

```bash
npm run dev       # dev server at localhost:5173
npm run build     # tsc + vite build → outputs to docs/ (not dist/)
npm run preview   # preview production build
```

`vite.config.ts`:
- `base: '/dictation_app/'` — hardcoded for GitHub Pages
- `outDir: 'docs'` — GitHub Pages serves from `/docs`
- `__APP_VERSION__` injected from `package.json`

CI: `.github/workflows/deploy.yml` — on push to `main`: `npm ci → npm run build → deploy docs/`

## Key Behaviours

**Theme:** `data-theme` attribute on `<html>`, toggled by TopBar, persisted to `localStorage('dictify-theme')`. Defaults to OS preference.

**Hint:** shows current sentence text with a countdown timer (~7.5 s), then auto-hides. Ctrl+A toggles it.

**Reading Mode:** sidebar panel with two views — "Sentence" (current only) or "Full Text" (all sentences, current highlighted).

**Keyboard shortcuts (PlayerPage only):**

| Key | Action |
|-----|--------|
| Ctrl+Q | Previous sentence |
| Ctrl+W | Play / Pause |
| Ctrl+E | Replay from start |
| Ctrl+R | Next sentence |
| Ctrl+A | Toggle hint |

## What Is Not Yet Implemented

- **Check answer** — button exists in `PlayerPage` action bar but has no logic (disabled when textarea is empty, no comparison runs)
- **Progress tracking** — all cards always show "Not started"; no persistence
- **Analytics page** — link in TopBar is disabled
- **Connections page** — link in TopBar is disabled
- **Video mode** — `has_video` field exists in `DicCatalogItem` but is never used

## Conventions

- No external UI library — inline SVG icons only
- Validate all external data at the boundary (`validatePlaylist` in `types.ts`)
- `useCallback` on all player action handlers to keep keyboard event handler stable
- Audio element is a hidden `<audio ref>` — controlled imperatively, not via state
