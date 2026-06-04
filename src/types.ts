export type DicCatalogItem = {
  id: string;
  title: string;
  level: string;
  sentences: number;
  duration_sec: number;
  tags: string[];
  has_video: boolean | null;
};

export type DicCatalog = {
  language: string;
  dics: DicCatalogItem[];
};

export type PlaylistRecord = {
  id: number;
  text: string;
  audio: string;
};

export const SOURCE_BASE_URL = 'https://leva13007.github.io/dictations/';
// export const SOURCE_BASE_URL = 'http://localhost:4737/';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const validatePlaylist = (raw: unknown): PlaylistRecord[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Playlist must be a non-empty JSON array.');
  }
  return raw.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Invalid record at index ${index}.`);
    const { id, text, audio } = item;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
      throw new Error(`Invalid id at index ${index}.`);
    if (typeof text !== 'string' || !text.trim())
      throw new Error(`Invalid text at index ${index}.`);
    if (typeof audio !== 'string' || !audio.trim())
      throw new Error(`Invalid audio at index ${index}.`);
    return { id, text: text.trim(), audio: (audio as string).replace(/^\.\//, '') };
  });
};

export const toAudioUrl = (audioPath: string, base?: string): string => {
  if (/^https?:\/\//i.test(audioPath)) return audioPath;
  return new URL(audioPath, base ?? SOURCE_BASE_URL).toString();
};

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `~${m}:${s.toString().padStart(2, '0')} min`;
};

export type WordDiffToken = {
  text: string;
  cls: 'correct' | 'wrong' | 'missing' | 'extra';
};

export type SentenceDiff = {
  expected: string;
  actual: string;
  tokens: WordDiffToken[];
  errorCount: number;
  clean: boolean;
};

export type OllamaAnalysis = {
  comment: string;
  patterns: Array<{ title: string; description: string }>;
};

export type CheckResult = {
  sentences: SentenceDiff[];
  totalWords: number;
  accuracy: number;
  spellingErrors: string[];
  missingWords: string[];
  extraWords: string[];
  aiAnalysis: OllamaAnalysis | null;
  timeSpent: number;
};
