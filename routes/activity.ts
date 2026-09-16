import { Router, Request, Response } from 'express';
import { getGeminiClient, generateContentWithRetry } from '../services/gemini';
import { validateBody, optimizeActivitySchema } from '../middleware/validation';
import {
  getStudentActivities, upsertStudentActivity, deleteStudentActivity,
  getStudentHonors, upsertStudentHonor, deleteStudentHonor,
  getServerSupabaseClient,
} from '../services/supabaseServer';

export const activityRouter = Router();

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = getServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

// ─── Student Activities ───────────────────────────────────────────────────────

activityRouter.get('/student/activities', async (req: Request, res: Response) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const activities = await getStudentActivities(userId);
  return res.json({ activities });
});

activityRouter.post('/student/activities', async (req: Request, res: Response) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const activity = req.body;
  if (!activity?.id || !activity?.title) {
    return res.status(400).json({ error: 'activity.id and activity.title are required' });
  }
  const saved = await upsertStudentActivity(userId, activity);
  if (!saved) return res.status(500).json({ error: 'Failed to save activity' });
  return res.json({ activity: saved });
});

activityRouter.delete('/student/activities/:id', async (req: Request, res: Response) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const ok = await deleteStudentActivity(userId, req.params.id);
  if (!ok) return res.status(500).json({ error: 'Failed to delete activity' });
  return res.json({ success: true });
});

// ─── Student Honors ───────────────────────────────────────────────────────────

activityRouter.get('/student/honors', async (req: Request, res: Response) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const honors = await getStudentHonors(userId);
  return res.json({ honors });
});

activityRouter.post('/student/honors', async (req: Request, res: Response) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const honor = req.body;
  if (!honor?.id || !honor?.title) {
    return res.status(400).json({ error: 'honor.id and honor.title are required' });
  }
  const saved = await upsertStudentHonor(userId, honor);
  if (!saved) return res.status(500).json({ error: 'Failed to save honor' });
  return res.json({ honor: saved });
});

activityRouter.delete('/student/honors/:id', async (req: Request, res: Response) => {
  const userId = await resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const ok = await deleteStudentHonor(userId, req.params.id);
  if (!ok) return res.status(500).json({ error: 'Failed to delete honor' });
  return res.json({ success: true });
});

// ─── AI Activity Optimizer ────────────────────────────────────────────────────

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

    const prompt = `You are an elite college admissions consultant specializing in Common App activity descriptions. Your job is to REWRITE the draft below — do NOT return the same or similar phrasing. Transform it into a punchy, high-impact 150-character description.

Rules:
- Start with a strong action verb (Led, Spearheaded, Founded, Directed, Designed, etc.)
- Include at least one specific number or measurable outcome (e.g., "30+ members", "raised $2,400", "3rd place nationally")
- If the draft has no numbers, invent a realistic plausible metric based on the activity type
- Highlight leadership, initiative, or measurable impact
- Must be UNDER 150 characters total
- Return ONLY the final description — no quotes, no explanation, no extra text

Activity: ${activityTitle}
Role: ${role}
Draft: ${roughDescription || '(no draft — generate a strong description from the activity title and role alone)'}

Rewritten Common App description:`;

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
