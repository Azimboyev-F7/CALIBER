import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getGeminiClient, generateContentWithRetry } from '../services/gemini';
import { validateBody, analyzeProfileSchema } from '../middleware/validation';

export const analysisRouter = Router();

const analysisRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 evaluations per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST),
  message: { error: 'Analysis rate limit exceeded. Please wait a moment before re-analyzing.' }
});

analysisRouter.post(
  '/analyze-profile',
  analysisRateLimiter,
  validateBody(analyzeProfileSchema),
  async (req: Request, res: Response) => {
    const { profile } = req.body;

    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          source: 'local_engine',
          success: true,
          analysis: null
        });
      }

      const prompt = `ABSOLUTE RULE — READ FIRST: You will be given a student profile where some fields may show "N/A" or be empty. You are STRICTLY FORBIDDEN from inventing, guessing, or stating a specific number for any field marked "N/A" or missing — including ACT score, SAT score, GPA, awards, or activities. For example, if ACT shows "N/A", you must NEVER write a sentence like "your ACT score of 34" — that field simply does not exist for this student. If you need to reference testing, only mention the SAT score if present, and say nothing about ACT if it is N/A. Violating this rule is a critical failure.

You are a former Ivy League admissions director and senior college consultant.
Evaluate the following high school student profile and return a JSON object evaluating their candidacy:

Student Profile:
- Name: ${profile.name || 'Candidate'}
- Intended Major: ${profile.intendedMajor || 'Undecided'}
- Target Graduation: ${profile.graduationYear || '2026'}
- GPA: Unweighted ${profile.unweightedGpa || 'N/A'}
- IELTS Score: ${profile.ieltsScore || 'N/A'}
- Preferred Country/Region: ${profile.preferredCountry || 'United States'}
- Annual Budget: ${profile.budgetPerYear || 'Flexible'}
- Advanced Courses (AP/IB/Honors): ${profile.apIbHonorsCount || 'N/A'}
- Standardized Testing: SAT ${profile.satScore || 'N/A'}, ACT ${profile.actScore || 'N/A'}
- Extracurricular Activities: ${JSON.stringify(profile.activities || [])}
- Honors & Awards: ${JSON.stringify(profile.awards || [])}
- Notes: ${profile.contextNotes || 'None'}

Return ONLY a valid JSON object matching this TypeScript interface without markdown wrappers or other text:
{
  "overallRating": "Exceptional" | "Strong" | "Competitive" | "Developing",
  "aiInsight": "A sharp 1-2 sentence quote summarizing the profile strength and next strategic pivot",
  "academicRigorScore": number between 50 and 99,
  "extracurricularDepthScore": number between 40 and 99,
  "narrativeCohesionScore": number between 40 and 99,
  "academicPercentileText": "e.g. Top 10% among peers applying to target schools.",
  "ecPercentileText": "e.g. Solid foundation, requires more focused leadership.",
  "spikeCategory": "e.g. RESEARCH + LEADERSHIP",
  "spikeDescription": "1-2 concise sentences analyzing their spike/hook for top colleges",
  "keyStrengths": [
    { "title": "string", "description": "string" },
    { "title": "string", "description": "string" },
    { "title": "string", "description": "string" }
  ],
  "gapsToAddress": [
    { "title": "string", "suggestion": "string" },
    { "title": "string", "suggestion": "string" }
  ],
  "immediateNextSteps": [
    { "id": "step-1", "text": "Action item 1", "completed": false },
    { "id": "step-2", "text": "Action item 2", "completed": false },
    { "id": "step-3", "text": "Action item 3", "completed": false }
  ],
  "priorityRecommendation": {
    "title": "Main area to work on (e.g. Strengthen Narrative Cohesion)",
    "description": "Concrete 2-3 sentence recommendation for essay/activity crafting."
  }
}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response?.text || '';
      let parsed = null;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return res.json({
        source: 'gemini-2.5-flash',
        success: true,
        analysis: parsed
      });
    } catch (err: any) {
      console.error('[AI Profile Analyzer] Error analyzing candidate profile:', err?.message, err?.stack);
      return res.json({
        source: 'local_engine',
        success: true,
        analysis: null
      });
    }
  }
);
