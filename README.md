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
- Audio and list files live under `public/dics/0001/` (feel free to add additional folders for new sets).
- The playlist metadata is defined in `src/dics/0001/playlist.ts`; update or duplicate this file to point to new audio files and hint text.

That is all that is needed to run or tweak the app. Happy dictating!

