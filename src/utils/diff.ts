import type { WordDiffToken, SentenceDiff } from '../types';

type Token = { original: string; normalized: string };
type Op =
  | { type: 'match'; a: Token; b: Token }
  | { type: 'del'; a: Token }
  | { type: 'ins'; b: Token };

function tokenize(text: string): Token[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => ({ original: w, normalized: w.toLowerCase().replace(/[^a-z0-9']/g, '') }));
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function isMisspelling(a: string, b: string): boolean {
  if (!a || !b || a === b) return false;
  const maxLen = Math.max(a.length, b.length);
  const threshold = maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : 3;
  return editDistance(a, b) <= threshold;
}

function buildOps(expected: Token[], actual: Token[]): Op[] {
  const m = expected.length, n = actual.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        expected[i - 1].normalized === actual[j - 1].normalized
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const ops: Op[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1].normalized === actual[j - 1].normalized) {
      ops.unshift({ type: 'match', a: expected[i - 1], b: actual[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'ins', b: actual[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'del', a: expected[i - 1] });
      i--;
    }
  }
  return ops;
}

function processChunk(dels: Token[], ins: Token[]): WordDiffToken[] {
  const tokens: WordDiffToken[] = [];
  const usedIns = new Set<number>();

  for (const del of dels) {
    const matchIdx = ins.findIndex(
      (tok, idx) => !usedIns.has(idx) && isMisspelling(del.normalized, tok.normalized),
    );
    if (matchIdx >= 0) {
      tokens.push({ text: ins[matchIdx].original, cls: 'wrong' });
      usedIns.add(matchIdx);
    } else {
      tokens.push({ text: del.original, cls: 'missing' });
    }
  }

  ins.forEach((tok, idx) => {
    if (!usedIns.has(idx)) tokens.push({ text: tok.original, cls: 'extra' });
  });

  return tokens;
}

export function diffSentence(expected: string, actual: string): WordDiffToken[] {
  const expTokens = tokenize(expected);
  const actTokens = tokenize(actual);
  if (expTokens.length === 0 && actTokens.length === 0) return [];

  const ops = buildOps(expTokens, actTokens);
  const tokens: WordDiffToken[] = [];
  let dels: Token[] = [], ins: Token[] = [];

  const flush = () => {
    tokens.push(...processChunk(dels, ins));
    dels = []; ins = [];
  };

  for (const op of ops) {
    if (op.type === 'match') {
      flush();
      tokens.push({ text: op.b.original, cls: 'correct' });
    } else if (op.type === 'del') {
      dels.push(op.a);
    } else {
      ins.push(op.b);
    }
  }
  flush();

  return tokens;
}

export type DiffSummary = {
  sentences: SentenceDiff[];
  totalWords: number;
  accuracy: number;
  spellingErrors: string[];
  missingWords: string[];
  extraWords: string[];
};

export function computeDiff(
  playlist: Array<{ text: string }>,
  userLines: string[],
): DiffSummary {
  const sentences: SentenceDiff[] = playlist.map((item, idx) => {
    const actual = userLines[idx] ?? '';
    const tokens = diffSentence(item.text, actual);
    const errorCount = tokens.filter(t => t.cls !== 'correct').length;
    return { expected: item.text, actual, tokens, errorCount, clean: errorCount === 0 };
  });

  const totalWords = playlist.reduce(
    (acc, item) => acc + tokenize(item.text).length,
    0,
  );
  const correctWords = sentences.reduce(
    (acc, s) => acc + s.tokens.filter(t => t.cls === 'correct').length,
    0,
  );
  const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

  const uniq = (arr: string[]) => [...new Set(arr)];
  const spellingErrors = uniq(
    sentences.flatMap(s => s.tokens.filter(t => t.cls === 'wrong').map(t => t.text)),
  );
  const missingWords = uniq(
    sentences.flatMap(s => s.tokens.filter(t => t.cls === 'missing').map(t => t.text)),
  );
  const extraWords = uniq(
    sentences.flatMap(s => s.tokens.filter(t => t.cls === 'extra').map(t => t.text)),
  );

  return { sentences, totalWords, accuracy, spellingErrors, missingWords, extraWords };
}
