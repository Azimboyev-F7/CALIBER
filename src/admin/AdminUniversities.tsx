import React, { useEffect, useMemo, useState } from 'react';
import { getApiHeaders } from '../utils/apiClient';

type ResearchSource = { id: number; title: string; url: string; excerpt: string };
type UniversityDraft = {
  schoolId: string;
  name: string;
  officialAcceptanceRate: number | null;
  acceptanceRateSourceYear: string;
  sat25th: number | null;
  sat75th: number | null;
  avgEnrolledGpaUnweighted: number | null;
  sourceUrl: string;
  rateEvidence: string;
  rateMethod?: string;
  satEvidence?: string;
  gpaEvidence?: string;
  requirementsEvidence?: string;
  notes: string;
  location: string;
  region: string;
  sources: ResearchSource[];
};
type ExistingUniversity = { school_id: string; name: string; official_acceptance_rate: number; location: string | null };
type ChatMessage = { from: 'admin' | 'assistant'; text: string };

const emptyDraft: UniversityDraft = {
  schoolId: '', name: '', officialAcceptanceRate: null, acceptanceRateSourceYear: '',
  sat25th: null, sat75th: null, avgEnrolledGpaUnweighted: null,
  sourceUrl: '', rateEvidence: '', notes: '', location: '', region: '', sources: [],
};

const numericFields: Array<keyof UniversityDraft> = [
  'officialAcceptanceRate', 'sat25th', 'sat75th', 'avgEnrolledGpaUnweighted',
];

export const AdminUniversities: React.FC = () => {
  const [universities, setUniversities] = useState<ExistingUniversity[]>([]);
  const [draft, setDraft] = useState<UniversityDraft>(emptyDraft);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'assistant', text: 'Type a university name. I will search current web sources for international undergraduate admissions data and prepare a record for your review.' },
  ]);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUniversities = async () => {
    try {
      const response = await fetch('/api/admin/universities', { headers: await getApiHeaders() });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load universities.');
      setUniversities(body.universities || []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load universities.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void loadUniversities(); }, []);

  const filtered = useMemo(
    () => universities.filter((university) => university.name.toLowerCase().includes(query.trim().toLowerCase())),
    [universities, query],
  );
  const canSave = Boolean(
    draft.schoolId && draft.name && draft.officialAcceptanceRate !== null &&
    draft.officialAcceptanceRate > 0 && draft.officialAcceptanceRate <= 100 &&
    draft.acceptanceRateSourceYear && draft.sourceUrl.startsWith('https://') &&
    draft.rateEvidence && draft.region && !working,
  );

  const updateDraft = (key: keyof UniversityDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: numericFields.includes(key) ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const searchUniversity = async () => {
    const name = message.trim();
    if (!name || working) return;
    setWorking(true);
    setNotice(null);
    setDraft(emptyDraft);
    setMessages((current) => [...current, { from: 'admin', text: name }]);
    try {
      const response = await fetch('/api/admin/universities/ai', {
        method: 'POST', headers: await getApiHeaders(), body: JSON.stringify({ message: name }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Research failed.');
      setDraft({ ...emptyDraft, ...body.university });
      setMessages((current) => [...current, { from: 'assistant', text: body.reply }]);
      setMessage('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Research failed.');
    } finally {
      setWorking(false);
    }
  };

  const saveUniversity = async () => {
    if (!canSave) return;
    setWorking(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/universities', {
        method: 'POST', headers: await getApiHeaders(), body: JSON.stringify({ university: draft }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'University could not be saved.');
      setNotice(`${draft.name} was saved to Supabase.`);
      await loadUniversities();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'University could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  const fields: Array<{ key: keyof UniversityDraft; label: string; type?: string }> = [
    { key: 'schoolId', label: 'School ID' },
    { key: 'name', label: 'University name' },
    { key: 'officialAcceptanceRate', label: 'International undergraduate acceptance rate (%)', type: 'number' },
    { key: 'acceptanceRateSourceYear', label: 'Admission cycle / source year' },
    { key: 'sat25th', label: 'SAT 25th percentile (if published)', type: 'number' },
    { key: 'sat75th', label: 'SAT 75th percentile (if published)', type: 'number' },
    { key: 'avgEnrolledGpaUnweighted', label: 'Average unweighted GPA (if published)', type: 'number' },
    { key: 'location', label: 'Location' },
    { key: 'region', label: 'Region (us, uk, canada, korea, germany, china)' },
    { key: 'sourceUrl', label: 'Acceptance rate source URL' },
  ];

  return <section className="max-w-[1300px] mx-auto px-4 md:px-8 py-7 md:py-10 space-y-6">
    <div>
      <div className="text-indigo-300 text-[11px] font-bold uppercase tracking-[0.18em]">School profile database</div>
      <h1 className="text-3xl font-extrabold text-white mt-2">Universities</h1>
      <p className="text-sm text-slate-400 mt-2">Research international undergraduate admissions from the web, check the cited figures, then save to Supabase.</p>
    </div>
    {notice && <div role="status" className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">{notice}</div>}
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <section className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
        <div><h2 className="font-bold text-white">University research assistant</h2><p className="text-xs text-slate-500 mt-1">Enter one university name, such as “Drexel University.”</p></div>
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((item, index) => <div key={index} className={`rounded-xl px-3 py-2.5 text-sm ${item.from === 'admin' ? 'ml-8 bg-indigo-500/15 text-indigo-100' : 'mr-8 bg-white/5 text-slate-300'}`}>{item.text}</div>)}
        </div>
        <input value={message} maxLength={160} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void searchUniversity(); }} placeholder="University name" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50" />
        <button disabled={working || !message.trim()} onClick={() => void searchUniversity()} className="w-full rounded-xl bg-indigo-500/25 hover:bg-indigo-500/35 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white">{working ? 'Searching sources…' : 'Search the web'}</button>
        {draft.sources.length > 0 && <div className="space-y-2 pt-2 border-t border-white/10">
          <h3 className="text-xs font-bold text-slate-300">Sources to review</h3>
          {draft.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-white/5 p-2.5 hover:bg-white/10 text-xs text-indigo-200 break-words"><span className="font-semibold">[{source.id}] {source.title}</span><span className="block text-slate-400 mt-1">{source.excerpt}</span></a>)}
        </div>}
      </section>

      <section className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-white">Review record</h2><p className="text-xs text-slate-500 mt-1">No record is saved until you confirm it.</p></div><button onClick={() => setDraft(emptyDraft)} className="text-xs text-slate-400 hover:text-white">Clear</button></div>
        {draft.name && draft.officialAcceptanceRate === null && <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-100">No cited international acceptance rate was found. Overall rates are not substituted. Supply an official international rate and its evidence before saving.</div>}
        {draft.rateMethod === 'calculated from international applicant/admit counts' && <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs text-emerald-100">The international rate was calculated from cited international applicant and admit counts. Review the counts and admission cycle in the source.</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          {fields.map(({ key, label, type }) => <label key={key} className="text-xs text-slate-400">{label}<input type={type || 'text'} step={type === 'number' ? 'any' : undefined} value={(draft[key] ?? '') as string | number} onChange={(event) => updateDraft(key, event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/50" /></label>)}
        </div>
        <label className="block text-xs text-slate-400">Exact evidence for the international rate<textarea value={draft.rateEvidence} onChange={(event) => updateDraft('rateEvidence', event.target.value)} rows={2} placeholder="Quote the source that explicitly gives the international undergraduate acceptance rate" className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/50" /></label>
        <label className="block text-xs text-slate-400">International application requirements / notes<textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/50" /></label>
        {draft.requirementsEvidence && <p className="text-xs text-slate-400">Requirements evidence: {draft.requirementsEvidence}</p>}
        {draft.satEvidence && <p className="text-xs text-slate-400">SAT evidence: {draft.satEvidence}</p>}
        {draft.gpaEvidence && <p className="text-xs text-slate-400">GPA evidence: {draft.gpaEvidence}</p>}
        <p className="text-xs text-slate-500">SAT and GPA fields represent published percentiles or averages, not international admission minimums. Check the linked source before saving.</p>
        <button disabled={!canSave} onClick={() => void saveUniversity()} className="w-full rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-emerald-100">Save to Supabase</button>
      </section>
    </div>
    <section className="glass-panel rounded-2xl border border-white/10 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><h2 className="font-bold text-white">Current university records <span className="text-slate-500 font-normal">({universities.length})</span></h2><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search universities" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none" /></div>
      {loading ? <div className="text-sm text-slate-500">Loading records…</div> : <div className="max-h-72 overflow-y-auto divide-y divide-white/5">{filtered.map((university) => <div key={university.school_id} className="flex items-center justify-between gap-4 py-3"><div><div className="text-sm font-semibold text-white">{university.name}</div><div className="text-xs text-slate-500">{university.school_id} · {university.location || 'Location not set'}</div></div><div className="text-sm text-slate-300">{university.official_acceptance_rate}%</div></div>)}</div>}
    </section>
  </section>;
};
