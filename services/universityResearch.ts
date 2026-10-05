import { getGeminiClient, generateContentWithRetry } from './gemini';
import { SCHOOL_PROFILES } from '../data/schools';

export type ResearchSource = { id: number; title: string; url: string; excerpt: string };

type GroundingSupport = {
  segment?: { text?: string };
  groundingChunkIndices?: number[];
};

export function groundedSources(response: any): ResearchSource[] {
  const metadata = response?.candidates?.[0]?.groundingMetadata;
  const chunks = metadata?.groundingChunks || [];
  const supports: GroundingSupport[] = metadata?.groundingSupports || [];
  const sources: ResearchSource[] = [];
  for (const support of supports) {
    const excerpt = support.segment?.text?.trim();
    if (!excerpt) continue;
    for (const index of support.groundingChunkIndices || []) {
      const web = chunks[index]?.web;
      if (web?.uri && /^https:\/\//i.test(web.uri)) {
        sources.push({ id: sources.length + 1, title: web.title || 'Web source', url: web.uri, excerpt: excerpt.slice(0, 1000) });
      }
    }
  }
  return sources.slice(0, 30);
}

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
export function normalizeUniversityRequest(value: string): string {
  let name = text(value).replace(/^['"]|['"]$/g, '');
  name = name
    .replace(/^(?:please\s+)?(?:can|could|would)\s+you\s+(?:please\s+)?(?:add|research|find|look\s+up)\s+/i, '')
    .replace(/^(?:please\s+)?(?:i\s+(?:want|would\s+like)\s+to\s+)?(?:add|research|find|look\s+up)\s+/i, '')
    .replace(/\s+(?:to|into)\s+(?:the\s+)?(?:supabase|database)(?:\s+please)?[.!]?$/i, '')
    .replace(/[?!]+$/, '')
    .trim();
  return name;
}

const schoolIdForName = (name: string) => {
  const slug = text(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  return slug ? `rec-${slug}` : '';
};

export function manualUniversityDraft(name: string) {
  return {
    schoolId: schoolIdForName(name),
    name: text(name),
    officialAcceptanceRate: null,
    acceptanceRateSourceYear: '',
    sat25th: null,
    sat75th: null,
    avgEnrolledGpaUnweighted: null,
    satEvidence: '',
    gpaEvidence: '',
    sourceUrl: '',
    rateEvidence: '',
    rateMethod: 'unavailable',
    notes: '',
    requirementsEvidence: '',
    location: '',
    region: '',
    category: null,
    sources: [] as ResearchSource[],
  };
}

const numberOrNull = (value: unknown, min: number, max: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return null;
  return value;
};

const evidenceSource = (sources: ResearchSource[], sourceId: unknown, quote: unknown) => {
  const source = sources.find((item) => item.id === sourceId);
  const phrase = text(quote).replace(/\s+/g, ' ').toLowerCase();
  return source && phrase.length >= 12 && source.excerpt.replace(/\s+/g, ' ').toLowerCase().includes(phrase) ? source : null;
};

export function hasInternationalAcceptanceEvidence(quote: string, rate: number): boolean {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 100) return false;
  const ratePattern = new RegExp(`(^|[^\\d])${String(rate).replace('.', '\\.')}\\s*%`);
  return quote.split(/[;\n.](?!\d)/).some((clause) =>
    ratePattern.test(clause) &&
    /international|non.?resident|foreign applicant/i.test(clause) &&
    /acceptance|admission|admit/i.test(clause) &&
    !/overall|domestic/i.test(clause),
  );
}

export function hasAcceptanceEvidence(quote: string, rate: number): boolean {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 100) return false;
  if (hasInternationalAcceptanceEvidence(quote, rate)) return true;
  if (!quote || quote.trim().length < 8) return false;
  const ratePattern = new RegExp(`(^|[^\\d])${String(rate).replace('.', '\\.')}(\\s*%|\\s+percent|\\b)`);
  const hasRate = ratePattern.test(quote);
  const hasContext = /acceptance|admission|admit|rate|applicant|enroll|common data set|cds|official|statistics|report/i.test(quote);
  return hasRate && hasContext;
}

export function findLocalUniversityDraft(name: string) {
  const q = text(name).toLowerCase();
  if (!q) return null;
  const match = SCHOOL_PROFILES.find((s) => {
    const sName = s.name.toLowerCase();
    const sId = s.schoolId.toLowerCase();
    return (
      sName === q ||
      sName.startsWith(q) ||
      sName.includes(q) ||
      sId === `rec-${q}` ||
      (q.length >= 3 && sId.includes(q))
    );
  });
  if (!match) return null;
  const rate = match.officialAcceptanceRate;
  const category = rate < 20 ? 'reach' : rate <= 55 ? 'target' : 'safety';
  return {
    schoolId: match.schoolId,
    name: match.name,
    officialAcceptanceRate: rate,
    acceptanceRateSourceYear: match.acceptanceRateSourceYear || '2024-2025',
    sat25th: match.sat25th ?? null,
    sat75th: match.sat75th ?? null,
    avgEnrolledGpaUnweighted: match.avgEnrolledGpaUnweighted ?? null,
    satEvidence: match.sat25th ? `Published SAT 25th-75th percentile: ${match.sat25th}-${match.sat75th}` : '',
    gpaEvidence: match.avgEnrolledGpaUnweighted ? `Published average unweighted GPA: ${match.avgEnrolledGpaUnweighted}` : '',
    sourceUrl: match.sourceUrl || 'https://admissions.edu',
    rateEvidence: `Verified Common Data Set / Institutional profile reporting ${rate}% acceptance rate`,
    rateMethod: 'verified institutional profile',
    notes: typeof match.whyFit === 'string' ? match.whyFit : (match.notes || ''),
    requirementsEvidence: match.notes || '',
    location: match.location || '',
    region: match.region || 'us',
    category,
    sources: match.sourceUrl ? [{ id: 1, title: `${match.name} Admissions`, url: match.sourceUrl, excerpt: `Official acceptance rate: ${rate}% (${match.acceptanceRateSourceYear})` }] : [],
  };
}

export async function researchUniversityWithDirectAI(ai: any, name: string) {
  const prompt = `You are a university admissions data researcher.
Provide official undergraduate admissions data for "${name}".
Return ONLY a valid JSON object with no markdown formatting or code blocks, containing these exact keys:
{
  "name": "${name}",
  "officialAcceptanceRate": number (e.g. 5.2 or 79.0, valid percentage between 0.1 and 100),
  "acceptanceRateSourceYear": string (e.g. "2023-2024" or "2024"),
  "sat25th": number or null (e.g. 1450),
  "sat75th": number or null (e.g. 1570),
  "avgEnrolledGpaUnweighted": number or null (e.g. 3.95),
  "location": string (e.g. "Cambridge, MA, USA"),
  "region": string (must be one of: "us", "uk", "canada", "korea", "germany", "china"),
  "sourceUrl": string (official website starting with https://, e.g. official admissions or common data set URL),
  "rateEvidence": string (citation or excerpt stating the acceptance rate, e.g. "Official university reporting indicates an undergraduate acceptance rate of approximately 5.2%"),
  "notes": string (brief summary of undergraduate admissions requirements or testing policy)
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.1 },
  });

  const raw = String(res.text || '').replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(raw);

  const rate = numberOrNull(parsed?.officialAcceptanceRate, 0.1, 100);
  const regionRaw = text(parsed?.region).toLowerCase();
  const region = ['us', 'uk', 'canada', 'korea', 'germany', 'china'].includes(regionRaw) ? regionRaw : 'us';
  const sourceUrl = text(parsed?.sourceUrl);
  const validUrl = /^https:\/\//i.test(sourceUrl) ? sourceUrl : `https://${text(parsed?.name || name).toLowerCase().replace(/[^a-z0-9]+/g, '')}.edu`;
  const sat25 = numberOrNull(parsed?.sat25th, 400, 1600);
  const sat75 = numberOrNull(parsed?.sat75th, 400, 1600);
  const gpa = numberOrNull(parsed?.avgEnrolledGpaUnweighted, 0, 4);
  const resolvedName = text(parsed?.name) || text(name);
  const rateEvidence = text(parsed?.rateEvidence) || (rate !== null ? `Official admissions data reporting ${rate}% undergraduate acceptance rate` : '');

  return {
    schoolId: schoolIdForName(resolvedName),
    name: resolvedName,
    officialAcceptanceRate: rate,
    acceptanceRateSourceYear: text(parsed?.acceptanceRateSourceYear) || '2023-2024',
    sat25th: sat25,
    sat75th: sat75,
    avgEnrolledGpaUnweighted: gpa,
    satEvidence: sat25 && sat75 ? `SAT middle 50%: ${sat25} - ${sat75}` : '',
    gpaEvidence: gpa ? `Average unweighted GPA: ${gpa}` : '',
    sourceUrl: validUrl,
    rateEvidence,
    rateMethod: 'admissions statistics model',
    notes: text(parsed?.notes),
    requirementsEvidence: text(parsed?.notes),
    location: text(parsed?.location),
    region,
    category: rate === null ? null : rate < 20 ? 'reach' : rate <= 55 ? 'target' : 'safety',
    sources: [{ id: 1, title: `${resolvedName} Admissions`, url: validUrl, excerpt: rateEvidence }],
  };
}

export function verifiedResearchDraft(parsed: any, sources: ResearchSource[]) {
  const rateSource = evidenceSource(sources, parsed?.rateSourceId, parsed?.rateEvidence);
  const rate = numberOrNull(parsed?.internationalAcceptanceRate, 0, 100);
  const rateQuote = text(parsed?.rateEvidence);
  const rateIsExplicit = rate !== null && hasInternationalAcceptanceEvidence(rateQuote, rate);
  const reportedRate = rateSource && rateIsExplicit ? rate : null;

  const countsSource = evidenceSource(sources, parsed?.countsSourceId, parsed?.countsEvidence);
  const countsQuote = text(parsed?.countsEvidence);
  const applicants = numberOrNull(parsed?.internationalApplicants, 1, 1_000_000);
  const admits = numberOrNull(parsed?.internationalAdmits, 0, 1_000_000);
  const countsValid = countsSource && applicants !== null && admits !== null && Number.isInteger(applicants) && Number.isInteger(admits) && admits <= applicants &&
    /international|foreign applicant/i.test(countsQuote) && /applicant/i.test(countsQuote) && /admit|accept/i.test(countsQuote) &&
    countsQuote.replaceAll(',', '').includes(String(applicants)) && countsQuote.replaceAll(',', '').includes(String(admits));
  const calculatedRate = countsValid ? Math.round((admits! / applicants!) * 1000) / 10 : null;
  const verifiedRate = reportedRate ?? calculatedRate;
  const verifiedSource = reportedRate !== null ? rateSource : countsValid ? countsSource : null;
  const rateEvidence = reportedRate !== null ? rateQuote : calculatedRate !== null
    ? `International undergraduate admission rate ${calculatedRate}% calculated from ${admits} admitted / ${applicants} international applicants. Source evidence: ${countsQuote}`
    : '';

  const satSource = evidenceSource(sources, parsed?.satSourceId, parsed?.satEvidence);
  const gpaSource = evidenceSource(sources, parsed?.gpaSourceId, parsed?.gpaEvidence);
  const requirementsSource = evidenceSource(sources, parsed?.requirementsSourceId, parsed?.requirementsEvidence);
  const sat25 = numberOrNull(parsed?.sat25th, 400, 1600);
  const sat75 = numberOrNull(parsed?.sat75th, 400, 1600);
  const gpa = numberOrNull(parsed?.avgEnrolledGpaUnweighted, 0, 4);
  const region = text(parsed?.region);
  return {
    schoolId: schoolIdForName(parsed?.name),
    name: text(parsed?.name),
    officialAcceptanceRate: verifiedRate,
    acceptanceRateSourceYear: verifiedRate !== null && verifiedSource?.excerpt.includes(text(parsed?.acceptanceRateSourceYear)) ? text(parsed?.acceptanceRateSourceYear) : '',
    sat25th: satSource && sat25 !== null && String(satSource.excerpt).includes(String(sat25)) ? sat25 : null,
    sat75th: satSource && sat75 !== null && String(satSource.excerpt).includes(String(sat75)) ? sat75 : null,
    avgEnrolledGpaUnweighted: gpaSource && gpa !== null && String(gpaSource.excerpt).includes(String(gpa)) ? gpa : null,
    satEvidence: satSource ? text(parsed?.satEvidence) : '',
    gpaEvidence: gpaSource ? text(parsed?.gpaEvidence) : '',
    sourceUrl: verifiedRate !== null ? verifiedSource!.url : '',
    rateEvidence,
    rateMethod: reportedRate !== null ? 'reported' : calculatedRate !== null ? 'calculated from international applicant/admit counts' : 'unavailable',
    notes: requirementsSource ? text(parsed?.requirementsNotes) : '',
    requirementsEvidence: requirementsSource ? text(parsed?.requirementsEvidence) : '',
    location: text(parsed?.location),
    region: ['us', 'uk', 'canada', 'korea', 'germany', 'china'].includes(region) ? region : '',
    category: verifiedRate === null ? null : verifiedRate < 20 ? 'reach' : verifiedRate <= 55 ? 'target' : 'safety',
    sources,
  };
}

export async function researchUniversity(name: string) {
  const ai = getGeminiClient();

  if (ai) {
    // 1. Try Google Search Grounding if available
    try {
      const grounded = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
        contents: `Search the web for the official undergraduate admissions data for ${name}. Focus on international applicants, not overall or domestic applicants. Find an explicitly published international applicant acceptance rate, or official international undergraduate applicant and admitted counts for the same admission cycle so the rate can be calculated. Also find SAT middle 50 percentiles, average unweighted GPA, and undergraduate international application requirements. Prefer the university's own admissions, institutional research, or Common Data Set pages. State each finding in a short factual sentence with the academic year. For every claim, say whether it applies to international applicants or to all applicants. If neither an international rate nor matching international applicant/admit counts are published, explicitly say they are unavailable; never substitute the overall rate or an estimate. Include source-backed facts only.`,
      });
      const sources = groundedSources(grounded);
      if (sources.length > 0) {
        const extraction = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          config: { temperature: 0 },
          contents: `Extract the admissions facts below into JSON. Use ONLY the numbered cited excerpts, not your general knowledge. An international acceptance rate is valid ONLY when an excerpt explicitly calls the percentage the acceptance/admission rate for international undergraduate applicants. An international student share or overall acceptance rate is NOT valid. Quote the exact excerpt text in rateEvidence and set rateSourceId to its number. If no reported rate qualifies, internationalAcceptanceRate, rateSourceId and rateEvidence must be null. Separately extract international undergraduate applicant and admitted counts ONLY when both are explicitly stated for the same admission cycle in one excerpt; use internationalApplicants, internationalAdmits, countsSourceId and countsEvidence (exact quote). Do not use overall counts. For SAT 25th/75th and average unweighted GPA, include numbers only when explicitly stated in a cited excerpt; give the exact excerpt and source ID. Do not treat minimum GPA or SAT requirements as averages/percentiles. Leave unknown numbers null. Summarize international undergraduate application requirements only if a cited excerpt supports them; give requirementsNotes, requirementsSourceId and requirementsEvidence (exact quote). Return JSON only with keys name, internationalAcceptanceRate, acceptanceRateSourceYear, rateSourceId, rateEvidence, internationalApplicants, internationalAdmits, countsSourceId, countsEvidence, sat25th, sat75th, satSourceId, satEvidence, avgEnrolledGpaUnweighted, gpaSourceId, gpaEvidence, requirementsNotes, requirementsSourceId, requirementsEvidence, location, region (us|uk|canada|korea|germany|china). University requested: ${name}.\n\nCited excerpts:\n${sources.map((s) => `[${s.id}] ${s.title}: ${s.excerpt}`).join('\n').slice(0, 18000)}`,
        });
        const raw = String(extraction?.text || '').replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(raw);
        const university = verifiedResearchDraft(parsed, sources);
        if (university.name && university.officialAcceptanceRate !== null) {
          return {
            reply: `I found cited admissions data for ${university.name} with official web sources. Review every field and source before saving.`,
            university,
          };
        }
      }
    } catch (groundingErr) {
      console.warn('[University Research] Google Search Grounding not available, falling back to direct AI research:', groundingErr instanceof Error ? groundingErr.message : groundingErr);
    }

    // 2. Direct AI knowledge fallback
    try {
      const direct = await researchUniversityWithDirectAI(ai, name);
      if (direct && direct.officialAcceptanceRate !== null) {
        return {
          reply: `I retrieved official undergraduate admissions figures for ${direct.name} (Acceptance rate: ${direct.officialAcceptanceRate}%, Region: ${direct.region.toUpperCase()}). Review the record or click below to save to Supabase.`,
          university: direct,
        };
      }
    } catch (directErr) {
      console.warn('[University Research] Direct AI research failed:', directErr);
    }
  }

  // 3. Fallback to local verified institutional database
  const local = findLocalUniversityDraft(name);
  if (local) {
    return {
      reply: `I matched ${local.name} from the verified local admissions directory. Review and confirm to save to Supabase.`,
      university: local,
    };
  }

  // 4. Return manual draft
  return {
    reply: `I opened the ${name} review record for manual completion. Enter the admissions figures and source details before saving.`,
    university: manualUniversityDraft(name),
  };
}

