import { GoogleGenAI } from '@google/genai';

let geminiRateLimitedUntil = 0;

// Fix Windows-1251 mojibake that appears when UTF-8 multibyte sequences are
// misread byte-by-byte. Most common culprit: em dash and curly quotes.
const MOJIBAKE_MAP: [RegExp, string][] = [
  [/вЂ“/g, '—'], // — em dash  (E2 80 94)
  [/вЂ™/g, '’'], // ' right single quote (E2 80 99)
  [/вЂœ/g, '“'], // " left double quote  (E2 80 9C)
  [/вЂ/g, '”'], // " right double quote (E2 80 9D)
  [/вЂ¦/g, '…'], // … ellipsis          (E2 80 A6)
  [/вЂ–/g, '–'], // – en dash           (E2 80 93)
];

export function fixMojibake(text: string): string {
  let out = text;
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (Date.now() < geminiRateLimitedUntil) {
    return null; // In cooldown, engage instant deterministic fallback
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function setGeminiCooldown(ms = 45000) {
  geminiRateLimitedUntil = Date.now() + ms;
}

export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    model?: string;
  }
): Promise<any> {
  const requestedModel = params.model || 'gemini-3.6-flash';
  const fallbacks = ['gemini-3.6-flash'].filter((m) => m !== requestedModel);
  const modelsToTry = [requestedModel, ...fallbacks];
  let lastError: any = null;

  const mergedConfig = {
    ...(params.config || {})
  };

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini request timed out after 20s')), 20000)
        );
        const response = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: mergedConfig,
          }),
          timeoutPromise
        ]);
        return response;
      } catch (err: any) {
        lastError = err;
        const is429 =
          err?.status === 'RESOURCE_EXHAUSTED' ||
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('Quota exceeded');
        const is503 =
          err?.status === 'UNAVAILABLE' ||
          err?.status === 503 ||
          err?.message?.includes('503') ||
          err?.message?.includes('demand');

        if (is429) {
          setGeminiCooldown(45000);
          console.warn(
            `[Gemini Service] Rate limit / quota exceeded for model ${modelName}. Cooldown engaged (45s).`,
            err?.message,
            err?.stack
          );
          throw err;
        }

        if (is503 && attempt === 0) {
          console.warn(
            `[Gemini Service] Temporary 503 unavailable for model ${modelName}, retrying in 300ms...`,
            err?.message
          );
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        console.error(
          `[Gemini Service] Attempt ${attempt + 1} failed for ${modelName}:`,
          err?.message,
          err?.stack
        );
        break;
      }
    }
  }

  throw lastError;
}
