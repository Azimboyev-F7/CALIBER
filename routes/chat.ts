import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getGeminiClient, generateContentWithRetry } from '../services/gemini';
import { generateIntelligentCoachReply } from '../services/scoring';
import { getCoachSystemInstruction } from '../prompts/coach';
import { validateBody, chatCoachSchema } from '../middleware/validation';

export const chatRouter = Router();

const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 40, // 40 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST),
  message: { error: 'Too many chat requests. Please slow down and try again shortly.' }
});

// Non-streaming chat endpoint
chatRouter.post('/chat-coach', chatRateLimiter, validateBody(chatCoachSchema), async (req: Request, res: Response) => {
  const { message, history, profile, analysis } = req.body;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: generateIntelligentCoachReply(message, profile, analysis),
        source: 'local_coach',
        success: true
      });
    }

    const systemInstruction = getCoachSystemInstruction(profile, analysis);

    // Build conversation contents
    const contentsPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const item of recentHistory) {
        if (item.sender === 'user') {
          contentsPayload.push({
            role: 'user',
            parts: [{ text: item.text }]
          });
        } else if (item.sender === 'coach') {
          contentsPayload.push({
            role: 'model',
            parts: [{ text: item.text }]
          });
        }
      }
    }

    contentsPayload.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.6-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const replyText = response?.text || generateIntelligentCoachReply(message, profile, analysis);

    return res.json({
      reply: replyText,
      source: 'ai_coach',
      success: true
    });
  } catch (err: any) {
    console.error('[AI Admissions Coach] Error processing chat-coach request:', err?.message, err?.stack);
    const fallback = generateIntelligentCoachReply(message, profile, analysis);
    return res.json({
      reply: fallback,
      source: 'coach_advisory_engine',
      success: true
    });
  }
});

// Sub-second SSE streaming chat endpoint
chatRouter.post('/chat-coach-stream', chatRateLimiter, validateBody(chatCoachSchema), async (req: Request, res: Response) => {
  const { message, history, profile, analysis } = req.body;

  // Set up Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendSSE = (data: { chunk?: string; done?: boolean; full?: string; error?: string }) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      const fullReply = generateIntelligentCoachReply(message, profile, analysis);
      sendSSE({ chunk: fullReply, full: fullReply, done: true });
      return res.end();
    }

    const systemInstruction = getCoachSystemInstruction(profile, analysis);

    const contentsPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-8);
      for (const item of recentHistory) {
        if (item.sender === 'user') {
          contentsPayload.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'coach') {
          contentsPayload.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    contentsPayload.push({ role: 'user', parts: [{ text: message }] });

    const streamResponse = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    let accumulated = '';
    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        accumulated += text;
        sendSSE({ chunk: text, done: false });
      }
    }

    sendSSE({ full: accumulated, done: true });
    res.end();
  } catch (err: any) {
    console.error('[AI Admissions Coach Streaming] Error processing chat-coach-stream:', err?.message, err?.stack);
    const fallback = generateIntelligentCoachReply(message, profile, analysis);
    sendSSE({ chunk: fallback, full: fallback, done: true });
    res.end();
  }
});
