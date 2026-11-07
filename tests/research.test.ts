import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mock = vi.hoisted(() => ({
  insert: vi.fn(),
  admin: vi.fn(),
  list: vi.fn(),
  rpc: vi.fn(),
  count: 0 as number | null,
  available: true,
}));

vi.mock('../services/supabaseServer', () => ({
  getServiceClient: () => mock.available ? {
    rpc: mock.rpc,
    from: (table: string) => {
      if (table === 'admin_users') return { select: () => ({ eq: () => ({ maybeSingle: mock.admin }) }) };
      return {
        upsert: mock.insert,
        select: (_cols?: string, opts?: { head?: boolean }) => opts?.head
          ? Promise.resolve({ count: mock.count, error: null })
          : ({ order: () => ({ limit: mock.list }) }),
      };
    },
  } : null,
}));

import { anonymizeUserId, buildResearchSnapshot, recordResearchSnapshot } from '../services/research';
import { analyticsRouter } from '../routes/analytics';

const profile = {
  name: 'Alex Chen', email: 'alex@example.com', contextNotes: 'My mom Jane works at Acme',
  unweightedGpa: '3.85', gpaScale: '4.0', satScore: '1520', ieltsScore: '7.5', apIbHonorsCount: '10',
  intendedMajor: 'Computer Science', graduationYear: '2026', preferredCountry: 'United States (US)',
  budgetPerYear: '$25,000 - $45,000 / year',
  activities: [
    { title: 'Robotics Club at Lincoln High', description: 'Led by me, call 555-1234', tier: 2, isLeadership: true },
    { title: 'Volunteering', description: 'x', tier: 4, isLeadership: false },
  ],
  awards: [{ title: 'State Math Olympiad', level: 'State' }],
};
const result = {
  reachRecommendations: [{ id: 'rec-mit', name: 'MIT', category: 'reach', officialAcceptanceRate: 3.9, acceptanceRateSourceYear: '2024', whyFit: 'Long free text', profileFit: { label: 'Strong' }, estimatedRange: { low: 4, high: 9 } }],
  targetRecommendations: [{ id: 'rec-umich', name: 'University of Michigan', category: 'target', profileFit: null, estimatedRange: null }],
  safetyRecommendations: [],
};

describe('anonymizeUserId', () => {
  it('is stable, salted and does not contain the user id', () => {
    const a = anonymizeUserId('user-1', 'salt-a');
    expect(a).toBe(anonymizeUserId('user-1', 'salt-a'));
    expect(a).not.toBe(anonymizeUserId('user-1', 'salt-b'));
    expect(a).not.toBe(anonymizeUserId('user-2', 'salt-a'));
    expect(a).not.toContain('user-1');
  });
});

describe('buildResearchSnapshot', () => {
  const snap = buildResearchSnapshot('anon', profile, result, 'local_engine', { filterRegion: 'United States' }, 'terms-v1');

  it('keeps numeric/categorical profile fields', () => {
    expect(snap).toMatchObject({
      anon_id: 'anon', source: 'local_engine', gpa: 3.85, sat: 1520, ielts: 7.5, ap_ib_honors_count: 10,
      intended_major: 'Computer Science', graduation_year: 2026, activity_count: 2, honors_count: 1,
      activity_tiers: [2, 4], leadership_count: 1,
    });
  });

  it('flattens recommendations by category with only whitelisted fields', () => {
    expect(snap.recommendations).toEqual([
      { id: 'rec-mit', name: 'MIT', category: 'reach', officialAcceptanceRate: 3.9, acceptanceRateSourceYear: '2024', profileFit: { label: 'Strong' }, estimatedRange: { low: 4, high: 9 } },
      { id: 'rec-umich', name: 'University of Michigan', category: 'target', officialAcceptanceRate: null, acceptanceRateSourceYear: null, profileFit: null, estimatedRange: null },
    ]);
  });

  it('never includes identifying or free-text data', () => {
    const json = JSON.stringify(snap);
    for (const leaked of ['Alex', 'alex@example.com', 'Jane', 'Acme', 'Lincoln', '555-1234', 'Robotics', 'Long free text']) {
      expect(json).not.toContain(leaked);
    }
  });

  it('rejects implausible values typed mid-entry instead of storing them', () => {
    const s = buildResearchSnapshot('a', { unweightedGpa: '39', satScore: '1', ieltsScore: '15', graduationYear: '20' }, {}, 'local_engine', {}, 'v');
    expect([s.gpa, s.sat, s.ielts, s.graduation_year]).toEqual([null, null, null, null]);
    const ok = buildResearchSnapshot('a', { unweightedGpa: '3.95', satScore: '1450', ieltsScore: '7.5', graduationYear: '2026' }, {}, 'local_engine', {}, 'v');
    expect([ok.gpa, ok.sat, ok.ielts, ok.graduation_year]).toEqual([3.95, 1450, 7.5, 2026]);
  });

  it('records the GPA scale, a 4.0-scale GPA, and the Terms version', () => {
    expect(snap).toMatchObject({ gpa_scale: '4.0', gpa_4pt: 3.85, terms_version: 'terms-v1', filter_region: 'United States' });
    expect(snap).not.toHaveProperty('filter_tier');
    const five = buildResearchSnapshot('a', { unweightedGpa: '4.5', gpaScale: '5.0' }, {}, 'x', {}, 'v');
    expect(five).toMatchObject({ gpa: 4.5, gpa_scale: '5.0', gpa_4pt: 3.6 });
  });

  it('rejects a GPA above its own scale (e.g. 4.8 on a 4.0 scale)', () => {
    const s = buildResearchSnapshot('a', { unweightedGpa: '4.8', gpaScale: '4.0' }, {}, 'x', {}, 'v');
    expect([s.gpa, s.gpa_4pt]).toEqual([null, null]);
  });

  it('turns unusable numbers into null instead of NaN', () => {
    const s = buildResearchSnapshot('a', { unweightedGpa: 'abc', satScore: '' }, {}, 'local_engine', {}, 'v');
    expect(s.gpa).toBeNull();
    expect(s.sat).toBeNull();
    expect(s.activity_count).toBe(0);
    expect(s.recommendations).toEqual([]);
  });
});

describe('recordResearchSnapshot', () => {
  beforeEach(() => {
    mock.available = true;
    mock.insert.mockReset().mockResolvedValue({ error: null });
    process.env.RESEARCH_ANON_SALT = 'test-salt';
  });

  it('stores a snapshot for a consenting user', async () => {
    expect(await recordResearchSnapshot({ userId: 'u1', consented: true, termsVersion: 'terms-v1', profile, result, source: 'local_engine', filters: {} })).toBe(true);
    const [row, options] = mock.insert.mock.calls[0];
    expect(row.anon_id).toBe(anonymizeUserId('u1', 'test-salt'));
    // One row per student: later runs update it instead of adding another.
    expect(options).toEqual({ onConflict: 'anon_id' });
    expect(typeof row.updated_at).toBe('string');
    expect(row.terms_version).toBe('terms-v1');
    expect(JSON.stringify(row)).not.toContain('u1"');
  });

  it('stores nothing without Terms acceptance', async () => {
    expect(await recordResearchSnapshot({ userId: 'u1', consented: false, termsVersion: '', profile, result, source: 'x', filters: {} })).toBe(false);
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it('stores nothing when the anonymization salt is not configured', async () => {
    delete process.env.RESEARCH_ANON_SALT;
    expect(await recordResearchSnapshot({ userId: 'u1', consented: true, termsVersion: 'terms-v1', profile, result, source: 'x', filters: {} })).toBe(false);
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it('never throws when the database fails', async () => {
    mock.insert.mockResolvedValue({ error: new Error('db down') });
    expect(await recordResearchSnapshot({ userId: 'u1', consented: true, termsVersion: 'terms-v1', profile, result, source: 'x', filters: {} })).toBe(false);
  });
});

describe('GET /admin/research', () => {
  const app = () => {
    const a = express();
    a.use((req, res, next) => {
      if (req.headers.authorization !== 'Bearer verified') return res.sendStatus(401);
      res.locals.userId = 'verified-user';
      next();
    });
    a.use(analyticsRouter);
    return a;
  };
  beforeEach(() => {
    mock.available = true;
    mock.admin.mockReset().mockResolvedValue({ data: { user_id: 'verified-user' }, error: null });
    mock.list.mockReset().mockResolvedValue({ data: [{ anon_id: 'abc', gpa: 3.9 }], error: null });
  });

  it('returns rows to administrators', async () => {
    const res = await request(app()).get('/admin/research').set('Authorization', 'Bearer verified');
    expect(res.status).toBe(200);
    expect(res.body.snapshots).toEqual([{ anon_id: 'abc', gpa: 3.9 }]);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('rejects non-administrators without reading data', async () => {
    mock.admin.mockResolvedValue({ data: null, error: null });
    const res = await request(app()).get('/admin/research').set('Authorization', 'Bearer verified');
    expect(res.status).toBe(403);
    expect(mock.list).not.toHaveBeenCalled();
  });

  it('is unavailable (not open) when the database is down', async () => {
    mock.available = false;
    const res = await request(app()).get('/admin/research').set('Authorization', 'Bearer verified');
    expect([403, 503]).toContain(res.status);
  });
});

import { researchRowsToCsv, type ResearchRow } from '../src/utils/researchCsv';

describe('researchRowsToCsv', () => {
  const row = (over: Partial<ResearchRow> = {}): ResearchRow => ({
    created_at: '2026-11-07T00:00:00Z', updated_at: '2026-11-07T01:00:00Z', anon_id: 'abc', source: 'local_engine', gpa: 3.9, gpa_scale: '4.0', gpa_4pt: 3.9, terms_version: 'v1', sat: 1500, ielts: null,
    ap_ib_honors_count: 8, intended_major: 'CS', graduation_year: 2026, preferred_country: 'US', budget_per_year: null,
    activity_count: 2, leadership_count: 1, activity_tiers: [1, 3], honors_count: 1, filter_region: null,
    recommendations: [
      { id: 'a', name: 'MIT', category: 'reach', officialAcceptanceRate: 3.9, acceptanceRateSourceYear: '2024', estimatedRange: { low: 2, high: 4 }, profileFit: { activityStrengthScore: 70, honorsStrengthScore: 90 } },
      { id: 'b', name: 'Purdue', category: 'safety', officialAcceptanceRate: 60, acceptanceRateSourceYear: '2025', estimatedRange: null, profileFit: null },
      { id: 'c', name: 'Georgia Tech', category: 'target', officialAcceptanceRate: 15, acceptanceRateSourceYear: '2024', estimatedRange: { low: 20, high: 30 }, profileFit: null },
    ], ...over,
  });

  it('writes a header, one line per row and pipe-joined schools per category', () => {
    const [header, line] = researchRowsToCsv([row()]).split('\r\n');
    const columns = header.split(',');
    expect(columns).toEqual(expect.arrayContaining(['gpa_scale', 'gpa_4pt', 'terms_version', 'reach_estimates', 'target_estimates', 'safety_estimates', 'reach_rates', 'data_years', 'activity_strength', 'honors_strength']));
    expect(columns).not.toContain('filter_tier');
    const cells = Object.fromEntries(columns.map((c, i) => [c, line.split(',')[i]]));
    expect(cells).toMatchObject({ reach: 'MIT', target: 'Georgia Tech', safety: 'Purdue', reach_estimates: '2-4', target_estimates: '20-30', safety_estimates: 'none', reach_rates: '3.9', data_years: '2024|2025', activity_strength: '70', honors_strength: '90' });
    expect(line).toContain('1|3');
  });

  it('quotes commas and neutralizes spreadsheet formulas', () => {
    const csv = researchRowsToCsv([row({ intended_major: '=HYPERLINK("x")', budget_per_year: '$25,000 - $45,000' })]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"$25,000 - $45,000"');
  });
});

describe('GET /admin/analytics research count', () => {
  const app = () => {
    const a = express();
    a.use((_req, res, next) => { res.locals.userId = 'verified-user'; next(); });
    a.use(analyticsRouter);
    return a;
  };
  beforeEach(() => {
    mock.available = true;
    mock.admin.mockReset().mockResolvedValue({ data: { user_id: 'verified-user' }, error: null });
    mock.rpc.mockReset().mockResolvedValue({ data: { weeklyActiveAccounts: 3 }, error: null });
    mock.count = 7;
  });

  it('adds the research snapshot count to the usage summary', async () => {
    const res = await request(app()).get('/admin/analytics?days=30');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ weeklyActiveAccounts: 3, researchSnapshots: 7 });
  });

  it('reports null (not 0) when the count is unavailable', async () => {
    mock.count = null;
    const res = await request(app()).get('/admin/analytics?days=30');
    expect(res.body.researchSnapshots).toBeNull();
  });
});
