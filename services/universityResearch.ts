import { getGeminiClient, generateContentWithRetry } from './gemini';

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
  const slug = text(parsed?.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  const region = text(parsed?.region);
  return {
    schoolId: slug ? `rec-${slug}` : '',
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
  if (!ai) throw new Error('AI university research is unavailable. Check the API key and quota.');

  const grounded = await generateContentWithRetry(ai, {
    model: 'gemini-3.5-flash-lite',
    config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
    contents: `Search the web for the official undergraduate admissions data for ${name}. Focus on international applicants, not overall or domestic applicants. Find an explicitly published international applicant acceptance rate, or official international undergraduate applicant and admitted counts for the same admission cycle so the rate can be calculated. Also find SAT middle 50 percentiles, average unweighted GPA, and undergraduate international application requirements. Prefer the university's own admissions, institutional research, or Common Data Set pages. State each finding in a short factual sentence with the academic year. For every claim, say whether it applies to international applicants or to all applicants. If neither an international rate nor matching international applicant/admit counts are published, explicitly say they are unavailable; never substitute the overall rate or an estimate. Include source-backed facts only.`,
  });
  const sources = groundedSources(grounded);
  if (!sources.length) throw new Error('Web research returned no cited sources. Please try again.');

  const extraction = await generateContentWithRetry(ai, {
    model: 'gemini-3.5-flash-lite',
    config: { temperature: 0 },
    contents: `Extract the admissions facts below into JSON. Use ONLY the numbered cited excerpts, not your general knowledge. An international acceptance rate is valid ONLY when an excerpt explicitly calls the percentage the acceptance/admission rate for international undergraduate applicants. An international student share or overall acceptance rate is NOT valid. Quote the exact excerpt text in rateEvidence and set rateSourceId to its number. If no reported rate qualifies, internationalAcceptanceRate, rateSourceId and rateEvidence must be null. Separately extract international undergraduate applicant and admitted counts ONLY when both are explicitly stated for the same admission cycle in one excerpt; use internationalApplicants, internationalAdmits, countsSourceId and countsEvidence (exact quote). Do not use overall counts. For SAT 25th/75th and average unweighted GPA, include numbers only when explicitly stated in a cited excerpt; give the exact excerpt and source ID. Do not treat minimum GPA or SAT requirements as averages/percentiles. Leave unknown numbers null. Summarize international undergraduate application requirements only if a cited excerpt supports them; give requirementsNotes, requirementsSourceId and requirementsEvidence (exact quote). Return JSON only with keys name, internationalAcceptanceRate, acceptanceRateSourceYear, rateSourceId, rateEvidence, internationalApplicants, internationalAdmits, countsSourceId, countsEvidence, sat25th, sat75th, satSourceId, satEvidence, avgEnrolledGpaUnweighted, gpaSourceId, gpaEvidence, requirementsNotes, requirementsSourceId, requirementsEvidence, location, region (us|uk|canada|korea|germany|china). University requested: ${name}.\n\nCited excerpts:\n${sources.map((s) => `[${s.id}] ${s.title}: ${s.excerpt}`).join('\n').slice(0, 18000)}`,
  });
  const raw = String(extraction?.text || '').replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(raw);
  const university = verifiedResearchDraft(parsed, sources);
  if (!university.name) throw new Error('The research did not identify a university.');
  return {
    reply: university.officialAcceptanceRate === null
      ? `I found cited information for ${university.name}, but no verified international undergraduate acceptance rate. Review the sources; saving requires that rate and its source.`
      : `I found a cited international undergraduate acceptance rate for ${university.name}. Review every field and source before saving.`,
    university,
  };
}
