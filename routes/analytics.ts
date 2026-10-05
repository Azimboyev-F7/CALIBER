import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getServiceClient, invalidateSchoolCache } from '../services/supabaseServer';
import { recordUsage } from '../services/analytics';
import { hasAcceptanceEvidence, hasInternationalAcceptanceEvidence, manualUniversityDraft, normalizeUniversityRequest, researchUniversity, findLocalUniversityDraft } from '../services/universityResearch';

export const analyticsRouter = Router();
const limiter = rateLimit({ windowMs: 60_000, limit: 30,
  keyGenerator: (_req, res) => res.locals.userId,
  standardHeaders: true, legacyHeaders: false });

const requireAdmin = async (client: any, userId: string) => {
  const { data, error } = await client.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

// Identity and timestamps always come from the verified session and server.
analyticsRouter.post('/analytics/session', limiter, async (_req, res) => {
  if (!await recordUsage(res.locals.userId, 'session_active', _req.header('x-device-id') || undefined)) {
    return res.status(503).json({ error: 'Analytics unavailable' });
  }
  return res.sendStatus(204);
});

analyticsRouter.get('/admin/access', limiter, async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ error: 'Admin access check unavailable' });
    return await requireAdmin(client, res.locals.userId)
      ? res.json({ allowed: true })
      : res.status(403).json({ allowed: false, error: 'Administrator access required' });
  } catch {
    return res.status(503).json({ error: 'Admin access check unavailable' });
  }
});

analyticsRouter.get('/admin/analytics', limiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const days = req.query.days === undefined ? 49 : Number(req.query.days);
  if (!['7','30','49'].includes(String(req.query.days ?? '49')) || ![7,30,49].includes(days)) {
    return res.status(400).json({ error: 'days must be 7, 30, or 49' });
  }
  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ error: 'Analytics unavailable' });
    const { data: admin, error: adminError } = await client.from('admin_users')
      .select('user_id').eq('user_id', res.locals.userId).maybeSingle();
    if (adminError) throw adminError;
    if (!admin) return res.status(403).json({ error: 'Administrator access required' });
    const { data, error } = await client.rpc('admin_usage_summary', { p_days: days });
    if (error) throw error;
    return res.json(data);
  } catch {
    return res.status(503).json({ error: 'Analytics unavailable' });
  }
});

analyticsRouter.get('/admin/users', limiter, async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ error: 'User data unavailable' });
    const { data: admin, error: adminError } = await client.from('admin_users')
      .select('user_id').eq('user_id', res.locals.userId).maybeSingle();
    if (adminError) throw adminError;
    if (!admin) return res.status(403).json({ error: 'Administrator access required' });

    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email || '',
      username: String(user.user_metadata?.username || ''),
      name: String(user.user_metadata?.name || ''),
      intendedMajor: String(user.user_metadata?.intendedMajor || ''),
      role: String(user.user_metadata?.role || ''),
      createdAt: user.created_at || null,
      lastSignInAt: user.last_sign_in_at || null,
    }));
    return res.json({ users });
  } catch {
    return res.status(503).json({ error: 'User data unavailable' });
  }
});

const adminSchoolFields = (school: any) => ({
  school_id: String(school.schoolId || school.school_id || '').trim(),
  name: String(school.name || '').trim(),
  official_acceptance_rate: Number(school.officialAcceptanceRate ?? school.official_acceptance_rate),
  acceptance_rate_source_year: String(school.acceptanceRateSourceYear || school.acceptance_rate_source_year || '').trim(),
  sat_25th: school.sat25th ?? school.sat_25th ?? null,
  sat_75th: school.sat75th ?? school.sat_75th ?? null,
  avg_enrolled_gpa_unweighted: school.avgEnrolledGpaUnweighted ?? school.avg_enrolled_gpa_unweighted ?? null,
  cds_factor_weights: school.cdsFactorWeights ?? school.cds_factor_weights ?? null,
  source_url: String(school.sourceUrl || school.source_url || '').trim(),
  notes: school.notes || null,
  category: school.category || null,
  match_score: school.matchScore ?? school.match_score ?? null,
  location: school.location || null,
  deadline: school.deadline || null,
  round: school.round || null,
  why_fit: school.whyFit || school.why_fit || null,
  key_factor: school.keyFactor || school.key_factor || null,
  strength_alignment: school.strengthAlignment || school.strength_alignment || null,
  region: school.region || null,
});

analyticsRouter.get('/admin/universities', limiter, async (_req, res) => {
  try {
    const client = getServiceClient();
    if (!client || !await requireAdmin(client, res.locals.userId)) return res.status(403).json({ error: 'Administrator access required' });
    const { data, error } = await client.from('school_profiles').select('*').order('official_acceptance_rate', { ascending: true });
    if (error) throw error;
    return res.json({ universities: data || [] });
  } catch {
    return res.status(503).json({ error: 'University data unavailable' });
  }
});

analyticsRouter.post('/admin/universities', limiter, async (req, res) => {
  try {
    const client = getServiceClient();
    if (!client || !await requireAdmin(client, res.locals.userId)) return res.status(403).json({ error: 'Administrator access required' });
    const input = req.body?.university || req.body;
    const row = adminSchoolFields(input);
    const evidence = String(input?.rateEvidence || '').trim();
    if (!/^rec-[a-z0-9-]+$/.test(row.school_id) || !row.name || row.name.length > 200 || !Number.isFinite(row.official_acceptance_rate) || !row.acceptance_rate_source_year || !/^https:\/\//i.test(row.source_url) || !['us', 'uk', 'canada', 'korea', 'germany', 'china'].includes(row.region || '') || !hasAcceptanceEvidence(evidence, row.official_acceptance_rate)) {
      return res.status(400).json({ error: 'Saving requires a university name, valid ID, cited acceptance rate, source year, and HTTPS source URL.' });
    }
    if (row.sat_25th !== null && row.sat_75th !== null && Number(row.sat_25th) > Number(row.sat_75th)) {
      return res.status(400).json({ error: 'SAT 25th percentile cannot exceed SAT 75th percentile.' });
    }
    row.category = row.official_acceptance_rate < 20 ? 'reach' : row.official_acceptance_rate <= 55 ? 'target' : 'safety';
    row.notes = `${row.notes || ''}\nUndergraduate acceptance rate evidence: ${evidence}`.trim();
    const { data: idMatch, error: idError } = await client.from('school_profiles').select('name').eq('school_id', row.school_id).maybeSingle();
    if (idError) throw idError;
    const { data: nameMatch, error: nameError } = await client.from('school_profiles').select('name').ilike('name', row.name).limit(1);
    if (nameError) throw nameError;
    if (idMatch || nameMatch?.length) return res.status(409).json({ error: `${idMatch?.name || nameMatch?.[0]?.name} is already in Supabase.` });
    const { data, error } = await client.from('school_profiles').insert(row).select('*').single();
    if (error) throw error;
    invalidateSchoolCache();
    return res.json({ university: data });
  } catch (err) {
    console.error('[Admin Universities] Error saving university:', err);
    return res.status(503).json({ error: 'University could not be saved to Supabase.' });
  }
});

analyticsRouter.post('/admin/universities/ai', limiter, async (req, res) => {
  const request = String(req.body?.message || '').trim();
  if (!request || request.length > 160) return res.status(400).json({ error: 'Enter one university name (up to 160 characters).' });
  const universityName = normalizeUniversityRequest(request);
  if (!universityName) return res.status(400).json({ error: 'Enter a university name.' });
  const client = getServiceClient();
  if (!client) return res.status(503).json({ error: 'University research is unavailable' });
  try {
    if (!await requireAdmin(client, res.locals.userId)) return res.status(403).json({ error: 'Administrator access required' });
  } catch {
    return res.status(503).json({ error: 'Administrator access check unavailable' });
  }

  // Check if school already exists in Supabase
  try {
    const slug = universityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
    const { data: existing } = await client
      .from('school_profiles')
      .select('*')
      .or(`school_id.eq.rec-${slug},name.ilike.%${universityName}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      const match = existing[0];
      return res.json({
        reply: `"${match.name}" is already in the database (${match.school_id}, acceptance rate: ${match.official_acceptance_rate}%). Here is the existing record.`,
        university: {
          schoolId: match.school_id,
          name: match.name,
          officialAcceptanceRate: match.official_acceptance_rate,
          acceptanceRateSourceYear: match.acceptance_rate_source_year,
          sat25th: match.sat_25th,
          sat75th: match.sat_75th,
          avgEnrolledGpaUnweighted: match.avg_enrolled_gpa_unweighted,
          sourceUrl: match.source_url || '',
          rateEvidence: match.notes || `Official acceptance rate: ${match.official_acceptance_rate}%`,
          notes: match.notes || '',
          location: match.location || '',
          region: match.region || 'us',
          category: match.category || null,
          sources: match.source_url ? [{ id: 1, title: `${match.name} Admissions`, url: match.source_url, excerpt: `${match.name} profile in database` }] : [],
        },
        alreadyExists: true,
      });
    }
  } catch (dbErr) {
    console.warn('[Admin Universities AI] Check existing school error:', dbErr);
  }

  try {
    return res.json(await researchUniversity(universityName));
  } catch (error) {
    console.error('[Admin Universities AI] Research failed:', error);
    const local = findLocalUniversityDraft(universityName);
    if (local) {
      return res.json({
        reply: `I retrieved the verified institutional record for ${local.name} from the admissions database. Review the fields below before saving.`,
        university: local,
      });
    }
    return res.json({
      reply: `Web research is temporarily unavailable, so I opened the ${universityName} review record for manual completion. No admissions figures were guessed.`,
      university: manualUniversityDraft(universityName),
      researchStatus: 'unavailable',
    });
  }
});

