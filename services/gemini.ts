import { GoogleGenAI } from '@google/genai';

let geminiRateLimitedUntil = 0;

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
  const requestedModel = params.model || 'gemini-3.7-flash';
  const modelsToTry = [requestedModel, 'gemini-flash-latest', 'gemini-3.7-flash'];
  let lastError: any = null;

  const mergedConfig = {
    thinkingConfig: { thinkingBudget: 0 },
    ...(params.config || {})
  };

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: mergedConfig,
        });
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
