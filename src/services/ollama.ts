const OLLAMA_BASE = 'http://localhost:11434';
export const OLLAMA_MODEL = 'llama3.2';

type OllamaAnalysis = {
  comment: string;
  patterns: Array<{ title: string; description: string }>;
};

export async function getAIAnalysis(
  sentences: string[],
  userLines: string[],
  errors: {
    spellingErrors: string[];
    missingWords: string[];
    extraWords: string[];
    accuracy: number;
  },
): Promise<OllamaAnalysis> {
  const originalText = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const studentText = userLines
    .map((l, i) => `${i + 1}. ${l.trim() || '(empty)'}`)
    .join('\n');

  const errorLines = [
    errors.spellingErrors.length
      ? `Spelling errors: ${errors.spellingErrors.slice(0, 8).join(', ')}`
      : null,
    errors.missingWords.length
      ? `Missing words: ${errors.missingWords.slice(0, 8).join(', ')}`
      : null,
    errors.extraWords.length
      ? `Extra words: ${errors.extraWords.slice(0, 8).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n') || 'No errors detected.';

  const prompt = `You are an English language teacher reviewing a student's dictation exercise.

Original sentences:
${originalText}

Student's response:
${studentText}

Identified errors:
${errorLines}
Accuracy: ${errors.accuracy}%

Respond with a JSON object in this exact format:
{
  "comment": "A 2-3 sentence motivational comment addressing specific patterns you see",
  "patterns": [
    {"title": "Pattern name", "description": "Specific actionable advice"},
    {"title": "Pattern name", "description": "Specific actionable advice"},
    {"title": "Pattern name", "description": "Specific actionable advice"}
  ]
}

Include 3-4 pattern items. Be specific and constructive. Respond with valid JSON only.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format: 'json',
      }),
    });

    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content ?? '{}';
    return JSON.parse(content) as OllamaAnalysis;
  } finally {
    clearTimeout(timeout);
  }
}
