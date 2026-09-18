import React, { useMemo, useState } from 'react';
import { UNIVERSITIES_DATABASE, UniversityInfo } from '../data/universitiesDatabase';
import { ActiveScreen } from '../types';

interface CollegeDiscoveryExplorerProps {
  onNavigate: (screen: ActiveScreen) => void;
}

const parseRate = (value: string) => Number.parseFloat(value.replace(/[^0-9.]/g, '')) || 100;

export const CollegeDiscoveryExplorer: React.FC<CollegeDiscoveryExplorerProps> = ({ onNavigate }) => {
  const [major, setMajor] = useState('All majors');
  const [setting, setSetting] = useState('Any campus setting');
  const [category, setCategory] = useState('all');

  const majors = useMemo(() => [
    'Computer Science', 'Engineering', 'Business', 'Economics', 'Biology',
    'Psychology', 'Mathematics', 'Physics', 'Chemistry', 'Political Science',
    'Communications', 'English', 'Nursing', 'Neuroscience', 'Data Science'
  ], []);
  const matchesMajor = (university: UniversityInfo) => major === 'All majors' || university.popularMajors.some((item) => item.toLowerCase().includes(major.toLowerCase()));
  const results = useMemo(() => UNIVERSITIES_DATABASE.filter((university) => matchesMajor(university) && (setting === 'Any campus setting' || university.setting === setting) && (category === 'all' || university.category === category)).sort((a, b) => parseRate(a.acceptanceRate) - parseRate(b.acceptanceRate)).slice(0, 4), [major, setting, category]);

  return (
    <section className="py-16 md:py-20 relative overflow-hidden bg-transparent">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="max-w-[1100px] mx-auto px-5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/25 text-purple-300 text-[11px] font-bold tracking-widest uppercase"><span className="material-symbols-outlined text-[15px]">explore</span>Explore before you apply</span>
          <h2 className="text-[28px] md:text-[40px] font-extrabold text-white tracking-tight mt-4 mb-3">Discover your college universe</h2>
          <p className="text-[14.5px] text-slate-400 leading-relaxed">Explore real universities by major, campus setting, and selectivity. Find a direction before you build your profile.</p>
        </div>

        <div className="bg-[#0d0e1b]/90 border border-white/15 rounded-2xl p-4 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-[11px] text-slate-400 font-semibold">What could you study?
              <select value={major} onChange={(event) => setMajor(event.target.value)} className="mt-1.5 w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400"><option>All majors</option>{majors.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label className="text-[11px] text-slate-400 font-semibold">What campus feels right?
              <select value={setting} onChange={(event) => setSetting(event.target.value)} className="mt-1.5 w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400"><option>Any campus setting</option><option>Urban</option><option>Suburban</option><option>College Town</option><option>Rural</option></select>
            </label>
            <label className="text-[11px] text-slate-400 font-semibold">How selective?
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400"><option value="all">Every selectivity level</option><option value="reach">Highly selective</option><option value="target">Competitive target</option><option value="safety">More accessible</option></select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {results.map((university) => <div key={university.id} className="rounded-xl bg-white/[0.045] border border-white/10 p-4 hover:border-indigo-400/50 hover:-translate-y-0.5 transition-all"><div className="flex items-start justify-between gap-2"><h3 className="text-[14px] font-bold text-white leading-snug">{university.shortName}</h3><span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded shrink-0">{university.acceptanceRate}</span></div><p className="text-[11px] text-slate-500 mt-1">{university.location} · {university.setting}</p><div className="flex flex-wrap gap-1 mt-3">{university.popularMajors.slice(0, 2).map((item) => <span key={item} className="text-[10px] text-indigo-200 bg-indigo-500/10 rounded px-1.5 py-1">{item}</span>)}</div></div>)}
          </div>

          {results.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No matches yet. Try a broader combination.</p>}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10"><span className="text-xs text-slate-500">Showing {results.length} examples from the Caliber university directory.</span><button onClick={() => onNavigate('colleges')} className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5">Explore the full directory <span className="material-symbols-outlined text-[15px]">arrow_forward</span></button></div>
        </div>
      </div>
    </section>
  );
};
