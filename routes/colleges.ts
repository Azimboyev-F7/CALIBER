import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getGeminiClient, generateContentWithRetry } from '../services/gemini';
import {
  generateIntelligentCollegeRecommendations,
  calculateProfileFit,
  calculateEstimatedRange
} from '../services/scoring';
import { SCHOOL_PROFILES } from '../data/schools';
import { validateBody, recommendCollegesSchema } from '../middleware/validation';

export const collegesRouter = Router();

const collegesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25, // 25 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST),
  message: { error: 'College recommendations rate limit exceeded. Please wait a moment.' }
});

collegesRouter.post(
  '/recommend-colleges',
  collegesRateLimiter,
  validateBody(recommendCollegesSchema),
  async (req: Request, res: Response) => {
    const { profile, filterTier, filterRegion } = req.body;

    const normalizeName = (n: string) =>
      n.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

    const enrichWithProfileFit = (colleges: any[]) => {
      if (!Array.isArray(colleges)) return;
      for (const college of colleges) {
        const collegeName = normalizeName(college.name || '');
        // Find matching verified institutional record — fuzzy on name to handle
        // Gemini variants like "University of Michigan - Ann Arbor" → "University of Michigan"
        const matched = SCHOOL_PROFILES.find((s) => {
          if (s.schoolId === college.id) return true;
          const dbName = normalizeName(s.name);
          if (dbName === collegeName) return true;
          if (dbName.includes(collegeName) || collegeName.includes(dbName)) return true;
          // Match on first 3 significant words (e.g. "carnegie mellon university" ↔ "carnegie mellon university scs")
          const dbWords = dbName.split(' ').slice(0, 3).join(' ');
          const colWords = collegeName.split(' ').slice(0, 3).join(' ');
          return dbWords === colWords && dbWords.length > 5;
        });
        const schoolData = matched || college;
        college.profileFit = calculateProfileFit(profile, schoolData);
        college.estimatedRange = calculateEstimatedRange(profile, schoolData, college.profileFit);
        if (matched?.officialAcceptanceRate) {
          college.officialAcceptanceRate = matched.officialAcceptanceRate;
          college.baselineAcceptanceRate = `${matched.officialAcceptanceRate.toFixed(1)}%`;
        }
        delete college.estimatedAdmitRate;
      }
    };

    try {
      const ai = getGeminiClient();
      if (!ai) {
        const fallbackResult = generateIntelligentCollegeRecommendations(profile, filterTier, filterRegion);
        enrichWithProfileFit(fallbackResult.reachRecommendations);
        enrichWithProfileFit(fallbackResult.targetRecommendations);
        enrichWithProfileFit(fallbackResult.safetyRecommendations);

        return res.json({
          source: 'local_engine',
          success: true,
          data: fallbackResult
        });
      }

      const activeCountry = filterRegion || profile.preferredCountry || 'United States';
      const prompt = `You are a former Dean of Admissions at a top university and premier global College Counselor.
Analyze the following high school student profile and generate tailored university recommendations categorized into Reach, Target, and Safety with official institutional acceptance rates and data-backed Profile Fit metrics.

Student Profile:
- Name: ${profile.name || 'Candidate'}
- Intended Major: ${profile.intendedMajor || 'Undecided'}
- Target Graduation Year: ${profile.graduationYear || '2026'}
- Unweighted GPA: ${profile.unweightedGpa || 'N/A'} (out of 4.0)
- IELTS Score: ${profile.ieltsScore || 'Not provided'}
- Preferred Country/Region: ${activeCountry}
- Annual Budget for Tuition & Expenses: ${profile.budgetPerYear || 'Flexible'}
- Advanced Coursework (AP/IB/Honors count): ${profile.apIbHonorsCount || 'N/A'}
- SAT Score: ${profile.satScore || 'N/A'}
- Extracurricular Activities (${(profile.activities || []).length} total): ${JSON.stringify(profile.activities || [])}
- Honors & Awards (${(profile.awards || []).length} total): ${JSON.stringify(profile.awards || [])}
- Context: ${profile.contextNotes || 'None'}
${filterTier ? `- Focus Tier: ${filterTier}` : ''}
${filterRegion ? `- Preferred Region: ${filterRegion}` : ''}

CRITICAL MANDATES:
1. DATA-BACKED REAL ACCEPTANCE RATES:
   - "baselineAcceptanceRate": The school's real, official general acceptance rate (e.g., "3.9%" for MIT, "3.6%" for Stanford, "17.7%" for Michigan, "50.3%" for Purdue, "89.0%" for Arizona State).
   - DO NOT fabricate, calculate, or return any personal percentage "chance of admission" or "estimated admit rate". That framing is completely forbidden.
2. CATEGORIZATION:
   - Reach: High-selectivity institutions (< 20% acceptance rate) relative to the applicant pool.
   - Target: Moderate selectivity institutions (20% - 55% acceptance rate) matching student range.
   - Safety: High-access institutions (> 55% acceptance rate) with reliable admission criteria.
3. Common Data Set (CDS) Factors:
   - For "keyFactor", state the primary criteria emphasized in institutional Common Data Set Section C7 (e.g. Rigor of secondary school record, Academic GPA, Application Essay, or Extracurricular Activities).
4. QUANTITIES: Recommend 2-3 Reach, 2-3 Target, and 1-2 Safety universities in "${activeCountry}".

Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "summary": "1-2 sentence executive assessment of their university positioning and profile fit.",
  "academicCompetitivenessTier": "e.g. Data-Backed Profile Fit Analysis",
  "reachRecommendations": [
    {
      "id": "string",
      "name": "string",
      "category": "reach",
      "baselineAcceptanceRate": "string",
      "matchScore": number,
      "location": "City, State, Country",
      "deadline": "string",
      "round": "string",
      "whyFit": "string",
      "keyFactor": "string",
      "strengthAlignment": "very_high" | "high" | "moderate"
    }
  ],
  "targetRecommendations": [
    {
      "id": "string",
      "name": "string",
      "category": "target",
      "baselineAcceptanceRate": "string",
      "matchScore": number,
      "location": "City, State, Country",
      "deadline": "string",
      "round": "string",
      "whyFit": "string",
      "keyFactor": "string",
      "strengthAlignment": "very_high" | "high" | "moderate"
    }
  ],
  "safetyRecommendations": [
    {
      "id": "string",
      "name": "string",
      "category": "safety",
      "baselineAcceptanceRate": "string",
      "matchScore": number,
      "location": "City, State, Country",
      "deadline": "string",
      "round": "string",
      "whyFit": "string",
      "keyFactor": "string",
      "strengthAlignment": "very_high" | "high" | "moderate"
    }
  ],
  "strategyNotes": [
    "string",
    "string",
    "string"
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
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

      if (!parsed) {
        parsed = generateIntelligentCollegeRecommendations(profile, filterTier, filterRegion);
      } else {
        const local = generateIntelligentCollegeRecommendations(profile, filterTier, filterRegion);
        if (!parsed.reachRecommendations?.length) parsed.reachRecommendations = local.reachRecommendations;
        if (!parsed.targetRecommendations?.length) parsed.targetRecommendations = local.targetRecommendations;
        if (!parsed.safetyRecommendations?.length) parsed.safetyRecommendations = local.safetyRecommendations;
      }

      enrichWithProfileFit(parsed.reachRecommendations);
      enrichWithProfileFit(parsed.targetRecommendations);
      enrichWithProfileFit(parsed.safetyRecommendations);

      return res.json({
        source: 'gemini-3.6-flash',
        success: true,
        data: parsed
      });
    } catch (err: any) {
      console.error('[AI College Matchmaker] Error matching universities:', err?.message, err?.stack);
      const fallbackResult = generateIntelligentCollegeRecommendations(profile, filterTier, filterRegion);
      enrichWithProfileFit(fallbackResult.reachRecommendations);
      enrichWithProfileFit(fallbackResult.targetRecommendations);
      enrichWithProfileFit(fallbackResult.safetyRecommendations);

      return res.json({
        source: 'local_engine',
        success: true,
        data: fallbackResult
      });
    }
  }
);
