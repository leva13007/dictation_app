---
status: active
category: apps
stack: React, TypeScript, Vite
---

# Dictation App

A lightweight React + Vite tool for running audio dictations. It plays through a configurable playlist of audio clips, lets you replay sentences at different speeds, shows optional hints, and provides a text box so learners can type what they hear.

## Requirements
- Node.js 20+ (or any version supported by the current `engines` on your machine)
- npm 10+

## Quick Start
```bash
npm install
npm run dev
```
The dev server prints a local URL (default `http://localhost:5173`).

## Build & Preview
```bash
npm run build
npm run preview
```
Use this pair to create a production bundle and sanity-check it locally.

## GitHub Pages Deploy
Use a repository base path when building (replace `dictation_app` with your repo name):
```bash
npm run build -- --base=/dictation_app/
```
After deploying the `dist/` folder to GitHub Pages, audio and playlists are loaded from:
- `public/dics/index.json`
- `public/dics/<dic-id>/playlist.json`
- `public/dics/<dic-id>/sounds/*.mp3`

You can open different dictations with a query param:
- `?dic=0001`
- `?dic=0002`
- `?dic=0003`

## Keyboard Shortcuts
All shortcuts use `Ctrl` + [key] for consistency across platforms (Windows, macOS, Linux).:

| Action      | Shortcut |
|-------------|----------|
| Previous    | `Ctrl + Q` |
| Play        | `Ctrl + W` |
| Replay      | `Ctrl + E` |
| Next        | `Ctrl + R` |
| Toggle hint | `Ctrl + A` |

## Playback Controls
- Buttons cover prev/play/replay/next navigation.
- Speed presets: 0.5x, 0.75x, 1x, and 1.25x.
- Hints reveal the text for the current sentence; the textarea underneath is free-form for typing what you hear.

## Managing Dictations
- Keep each set under `public/dics/<dic-id>/`.
- Maintain `public/dics/index.json` with this strict shape:
```json
{
  "dics": [
    { "id": "0001", "title": "My Dictation" }
  ]
}
```
- Put the playlist in `public/dics/<dic-id>/playlist.json`.
- Put audio files in `public/dics/<dic-id>/sounds/`.
- Each playlist item should follow:
```json
{
  "id": 1,
  "text": "Sentence text",
  "audio": "dics/0002/sounds/0002-01.mp3"
}
```

That is all that is needed to run or tweak the app. Happy dictating!
