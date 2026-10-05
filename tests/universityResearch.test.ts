import { describe, expect, it } from 'vitest';
import { findLocalUniversityDraft, groundedSources, hasAcceptanceEvidence, hasInternationalAcceptanceEvidence, manualUniversityDraft, normalizeUniversityRequest, verifiedResearchDraft } from '../services/universityResearch';

const excerpt = 'For fall 2025, the international undergraduate admission rate was 12.5%; SAT middle 50% was 1280 to 1450.';
const sources = [{ id: 1, title: 'University admissions', url: 'https://example.edu/admissions', excerpt }];

describe('international university research', () => {
  it('extracts the university name from administrator chat commands', () => {
    expect(normalizeUniversityRequest('Add University of Florida')).toBe('University of Florida');
    expect(normalizeUniversityRequest('Could you please research Drexel University?')).toBe('Drexel University');
    expect(normalizeUniversityRequest('Please add Stanford University to Supabase.')).toBe('Stanford University');
  });

  it('creates the complete review structure when automated research is unavailable', () => {
    expect(manualUniversityDraft('Drexel University')).toMatchObject({
      schoolId: 'rec-drexel-university',
      name: 'Drexel University',
      officialAcceptanceRate: null,
      acceptanceRateSourceYear: '',
      sourceUrl: '',
      rateEvidence: '',
      region: '',
      sources: [],
    });
  });

  it('requires a cited international admission rate rather than an overall rate', () => {
    expect(hasInternationalAcceptanceEvidence('International undergraduate admission rate was 12.5%', 12.5)).toBe(true);
    expect(hasInternationalAcceptanceEvidence('International enrollment is 22%; overall admission rate is 12.5%', 12.5)).toBe(false);
    expect(hasInternationalAcceptanceEvidence('Overall acceptance rate was 12.5%', 12.5)).toBe(false);
  });

  it('keeps only values backed by the cited excerpt', () => {
    const draft = verifiedResearchDraft({
      name: 'Example University', internationalAcceptanceRate: 12.5,
      acceptanceRateSourceYear: '2025', rateSourceId: 1, rateEvidence: 'the international undergraduate admission rate was 12.5%',
      sat25th: 1280, sat75th: 1450, satSourceId: 1, satEvidence: 'SAT middle 50% was 1280 to 1450',
      avgEnrolledGpaUnweighted: 3.9, gpaSourceId: 1, gpaEvidence: 'GPA was 3.9',
    }, sources);
    expect(draft.officialAcceptanceRate).toBe(12.5);
    expect(draft.sourceUrl).toBe('https://example.edu/admissions');
    expect(draft.category).toBe('reach');
    expect(draft.sat25th).toBe(1280);
    expect(draft.sat75th).toBe(1450);
    expect(draft.avgEnrolledGpaUnweighted).toBeNull();
  });

  it('does not create a rate from an uncited or overall-only statement', () => {
    const draft = verifiedResearchDraft({
      name: 'Example University', internationalAcceptanceRate: 12.5,
      acceptanceRateSourceYear: '2025', rateSourceId: 1,
      rateEvidence: 'Overall admission rate was 12.5%',
    }, sources);
    expect(draft.officialAcceptanceRate).toBeNull();
    expect(draft.sourceUrl).toBe('');
  });

  it('calculates a rate only from cited international applicant and admit counts', () => {
    const countsExcerpt = 'For fall 2025, international undergraduate applicants: 2,000; international applicants admitted: 250.';
    const draft = verifiedResearchDraft({
      name: 'Example University', acceptanceRateSourceYear: '2025',
      internationalApplicants: 2000, internationalAdmits: 250,
      countsSourceId: 1, countsEvidence: countsExcerpt,
    }, [{ id: 1, title: 'Admissions', url: 'https://example.edu/cds', excerpt: countsExcerpt }]);
    expect(draft.officialAcceptanceRate).toBe(12.5);
    expect(draft.rateMethod).toBe('calculated from international applicant/admit counts');
    expect(draft.rateEvidence).toContain('250 admitted / 2000 international applicants');

    const overall = verifiedResearchDraft({
      name: 'Example University', internationalApplicants: 2000, internationalAdmits: 250,
      countsSourceId: 1, countsEvidence: 'Overall applicants: 2,000; admitted: 250.',
    }, [{ id: 1, title: 'Admissions', url: 'https://example.edu/cds', excerpt: 'Overall applicants: 2,000; admitted: 250.' }]);
    expect(overall.officialAcceptanceRate).toBeNull();
  });

  it('extracts only linked Google Search grounding sources', () => {
    const response = { candidates: [{ groundingMetadata: {
      groundingChunks: [{ web: { uri: 'https://example.edu/admissions', title: 'Admissions' } }],
      groundingSupports: [{ segment: { text: excerpt }, groundingChunkIndices: [0] }],
    } }] };
    expect(groundedSources(response)).toEqual(sources.map((source) => ({ ...source, title: 'Admissions' })));
    expect(groundedSources({ candidates: [{ groundingMetadata: {} }] })).toEqual([]);
  });
  it('validates official undergraduate and CDS acceptance rate evidence', () => {
    expect(hasAcceptanceEvidence('International undergraduate admission rate was 12.5%', 12.5)).toBe(true);
    expect(hasAcceptanceEvidence('Official Common Data Set 2023-2024 reports acceptance rate of 5.2%', 5.2)).toBe(true);
    expect(hasAcceptanceEvidence('Undergraduate admissions statistics report an overall acceptance rate of approximately 15% across cycles.', 15)).toBe(true);
    expect(hasAcceptanceEvidence('Random unrelated sentence with no admissions info', 15)).toBe(false);
    expect(hasAcceptanceEvidence('', 15)).toBe(false);
  });

  it('matches local school profiles when available', () => {
    const mit = findLocalUniversityDraft('MIT');
    expect(mit).not.toBeNull();
    expect(mit?.schoolId).toBe('rec-mit');
    expect(mit?.officialAcceptanceRate).toBeGreaterThan(0);
    expect(mit?.region).toBe('us');

    const stanford = findLocalUniversityDraft('Stanford');
    expect(stanford).not.toBeNull();
    expect(stanford?.name).toContain('Stanford');

    expect(findLocalUniversityDraft('Atlantis University of Fiction')).toBeNull();
  });
});
