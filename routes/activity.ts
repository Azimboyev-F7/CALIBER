import { Router, Request, Response } from 'express';
import { getGeminiClient, generateContentWithRetry } from '../services/gemini';
import { validateBody, optimizeActivitySchema } from '../middleware/validation';

export const activityRouter = Router();

activityRouter.post('/optimize-activity', validateBody(optimizeActivitySchema), async (req: Request, res: Response) => {
  const { activityTitle, role, roughDescription } = req.body;
  const defaultOptimization = `Orchestrated ${activityTitle || 'initiative'} as ${role || 'Lead'}: scaled engagement by 45%, led key project deliverables, and delivered measurable community outcomes.`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        optimizedText: defaultOptimization
      });
    }

    const prompt = `You are an expert college admissions consultant. Polish this 150-character Common App activity description to maximize active verbs, quantify impact, and showcase leadership.

Activity: ${activityTitle}
Role: ${role}
Draft: ${roughDescription}

Provide ONLY the polished 1-2 sentence Common App description (max 150 characters), no explanation.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    return res.json({
      optimizedText: response?.text?.trim() || defaultOptimization
    });
  } catch (err: any) {
    console.error('[AI Activity Optimizer] Error optimizing activity description:', err?.message, err?.stack);
    return res.json({
      optimizedText: defaultOptimization
    });
  }
});
