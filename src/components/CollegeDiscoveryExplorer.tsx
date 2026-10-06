import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const matchesMajor = (university: UniversityInfo) => 
    major === 'All majors' || university.popularMajors.some((item) => item.toLowerCase().includes(major.toLowerCase()));

  const results = useMemo(() => 
    UNIVERSITIES_DATABASE.filter(
      (university) => 
        matchesMajor(university) && 
        (setting === 'Any campus setting' || university.setting === setting) && 
        (category === 'all' || university.category === category)
    ).sort((a, b) => parseRate(a.acceptanceRate) - parseRate(b.acceptanceRate)).slice(0, 4), 
    [major, setting, category]
  );

  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="py-16 md:py-20 relative overflow-hidden bg-transparent"
    >
      {/* Ambient background glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.12, 1],
          opacity: [0.12, 0.2, 0.12]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/10 blur-[130px] pointer-events-none" 
      />

      <div className="max-w-[1100px] mx-auto px-5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/25 text-purple-300 text-[11px] font-bold tracking-widest uppercase shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px] animate-pulse">explore</span>
            Explore Before You Apply
          </motion.div>
          <h2 className="text-[28px] md:text-[40px] font-extrabold text-white tracking-tight mt-4 mb-3">
            Discover your{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-300 bg-clip-text text-transparent">
              college universe
            </span>
          </h2>
          <p className="text-[14.5px] text-slate-400 leading-relaxed">
            Filter 1,200+ universities by academic major, setting, and selectivity tier to preview your potential target list.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-[#0d0e1b]/90 border border-white/15 rounded-2xl p-4 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl relative overflow-hidden"
        >
          {/* Subtle top shimmer accent */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* Filter Bar Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <label className="text-[11.5px] text-slate-300 font-semibold flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-indigo-400">school</span>
                Intended Field of Study
              </span>
              <select 
                value={major} 
                onChange={(event) => setMajor(event.target.value)} 
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer"
              >
                <option>All majors</option>
                {majors.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="text-[11.5px] text-slate-300 font-semibold flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-purple-400">location_city</span>
                Campus Environment
              </span>
              <select 
                value={setting} 
                onChange={(event) => setSetting(event.target.value)} 
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-purple-400 transition-colors cursor-pointer"
              >
                <option>Any campus setting</option>
                <option>Urban</option>
                <option>Suburban</option>
                <option>College Town</option>
                <option>Rural</option>
              </select>
            </label>

            <label className="text-[11.5px] text-slate-300 font-semibold flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-[15px] text-pink-400">tune</span>
                Selectivity Range
              </span>
              <select 
                value={category} 
                onChange={(event) => setCategory(event.target.value)} 
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-pink-400 transition-colors cursor-pointer"
              >
                <option value="all">Every selectivity level</option>
                <option value="reach">Highly selective (Reach &lt; 15%)</option>
                <option value="target">Competitive target (Target 15% - 40%)</option>
                <option value="safety">More accessible (Safety &gt; 40%)</option>
              </select>
            </label>
          </div>

          {/* Results Grid with Smooth Layout Animation */}
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6"
          >
            <AnimatePresence mode="popLayout">
              {results.map((university, index) => (
                <motion.div 
                  layout
                  key={university.id} 
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ 
                    y: -6, 
                    scale: 1.025,
                    boxShadow: '0 12px 30px -4px rgba(99, 102, 241, 0.25)',
                    borderColor: 'rgba(129, 140, 248, 0.5)'
                  }}
                  onClick={() => onNavigate('colleges')}
                  className="rounded-xl bg-white/[0.04] border border-white/10 p-4 transition-colors cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">
                        {university.shortName}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                        {university.acceptanceRate}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-slate-500">pin_drop</span>
                      {university.location} · {university.setting}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {university.popularMajors.slice(0, 2).map((item) => (
                        <span key={item} className="text-[10px] text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-1.5 py-0.5 font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <span className="font-medium">View Analysis</span>
                    <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {results.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <span className="material-symbols-outlined text-[32px] text-slate-600 mb-2 block">search_off</span>
              <p className="text-sm text-slate-400">No universities match this filter combination.</p>
              <button 
                onClick={() => { setMajor('All majors'); setSetting('Any campus setting'); setCategory('all'); }}
                className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Reset filters
              </button>
            </motion.div>
          )}

          {/* Bottom Explorer Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-indigo-400">verified</span>
              Displaying {results.length} curated institutions from Caliber&apos;s admissions dataset.
            </span>
            <button 
              onClick={() => onNavigate('colleges')} 
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all cursor-pointer group"
            >
              <span>Explore Complete University Directory</span>
              <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
