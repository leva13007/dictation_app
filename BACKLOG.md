# Backlog — Dictify

Ideas and planned features. Not prioritized — just captured.

---

## Core (stub exists, needs logic)

- **Check answer** — button in `PlayerPage` action bar is disabled; needs text comparison logic (`PlayerPage.tsx`)
- **Progress tracking** — cards always show "Not started"; needs persistence (localStorage or backend)
- **Analytics page** — route exists, link in TopBar is disabled
- **Connections page** — route exists, link in TopBar is disabled

---

## Enhancements

- **Video mode** — `has_video` field exists in `DicCatalogItem` but is never used; embed video alongside audio

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
