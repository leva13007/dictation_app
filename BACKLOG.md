# Backlog — Dictify

Ideas and planned features. Not prioritized — just captured.

---

## Bugs

- **B-01 · Audio timer doesn't update during playback** — `PlayerPage.tsx:200` — `currentTime` is read synchronously from `audioRef.current` during render, not from state, so the timer never ticks while audio plays. Fix: lift `currentTime` into state updated inside the `timeupdate` listener.

- **B-02 · Audio listeners re-attach unnecessarily** — `PlayerPage.tsx:109` — `useEffect` depends on `currentSentence` (object reference); any re-render re-attaches all listeners even if audio src hasn't changed. Fix: depend on `currentSentence?.audio` (string) instead.

---

## Tech Debt

- **T-01 · Catalog fetched twice on every player visit** — `DictationListPage` and `PlayerPage` each independently fetch `dics/index.json`. Fix: pass catalog entry via router state `navigate('/player/:id', { state: entry })` or add a module-level cache.

- **T-02 · `ollama.ts` is dead code** — `src/services/ollama.ts` implements AI analysis but is never imported. Either wire it into `ResultView` with loading/error state or remove until the feature is ready.

- **T-03 · `key={i}` on sentence diff list** — `ResultView.tsx:159` — array index used as React key. Fix: use `key={s.expected}` or add `id` to `SentenceDiff`.

- **T-04 · Accuracy metric undercounts correct words** — `diff.ts:206` — `punct` tokens (correct word, wrong capitalisation/punctuation) count as fully wrong. Consider counting them as correct or adding a separate punctuation counter.

---

## Core (stub exists, needs logic)

- **Check answer** — button in `PlayerPage` action bar is disabled; needs text comparison logic (`PlayerPage.tsx`)
- **Progress tracking** — cards always show "Not started"; needs persistence (localStorage or backend)
- **Analytics page** — route exists, link in TopBar is disabled
- **Connections page** — route exists, link in TopBar is disabled

---

## Enhancements

- **Video mode** — `has_video` field exists in `DicCatalogItem` but is never used; embed video alongside audio
- **AI analysis in Results** — `ollama.ts` is written but not connected; wire up after check completes, show comment + patterns in `ResultView`, handle Ollama unavailability gracefully

---

## Ideas / Extended Functionality

### Comprehension Quiz

After completing a dictation, the user can click a **Quiz** button to test understanding and retention.

**Flow:**
1. User finishes dictation → "Quiz" button appears
2. 4 random questions selected from the dictation's question pool
3. User answers each question in free text
4. AI evaluates each answer and gives explanatory feedback

**Question authoring:**
- Stored in `questions.json` alongside `playlist.json` in the content repo (`dictations_stage`)
- Up to ~10 questions per dictation; authored by the content creator
- Mix of `general` (whole text) and `partial` (specific part) questions
- No correct answers in JSON — AI evaluates against the dictation text itself

**`questions.json` shape:**
```json
{
  "questions": [
    { "id": "q1", "scope": "general", "text": "..." },
    { "id": "q2", "scope": "partial", "text": "..." }
  ]
}
```

**AI payload:** dictation full text + question + user's answer → feedback with explanation (not just correct/incorrect)

**Why separate file:** keeps `playlist.json` untouched (no breaking changes to existing API/tests), easier to test independently.
