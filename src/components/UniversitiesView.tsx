import { getDirectoryCategory, filterUniversitiesByRate } from '../utils/universityDirectory';
import React, { useState, useMemo } from 'react';
import { ActiveScreen, UserProfile, CollegeTarget, CollegeCategory, CollegeApplicationStatus } from '../types';
import { UniversityCard } from './UniversityCard';
import { UniversityDetailModal } from './UniversityDetailModal';
import { AddUniversityModal } from './AddUniversityModal';
import { AICollegeRecommendationsCard } from './AICollegeRecommendationsCard';

interface UniversitiesViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onShowToast?: (msg: string) => void;
}

export const UniversitiesView: React.FC<UniversitiesViewProps> = ({
  userProfile,
  onUpdateProfile,
  onNavigate: _onNavigate,
  onShowToast
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'portfolio' | 'ai_recommender'>('portfolio');
  const [viewMode, setViewMode] = useState<'tiers' | 'stages' | 'scatter' | 'timeline'>('tiers');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | CollegeCategory>('all');
  const [hoveredScatterCollege, setHoveredScatterCollege] = useState<CollegeTarget | null>(null);

  // Modals state
  const [selectedCollegeForModal, setSelectedCollegeForModal] = useState<CollegeTarget | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCategoryForModal, setAddCategoryForModal] = useState<CollegeCategory | undefined>(undefined);

  const handleOpenAddModal = (cat?: CollegeCategory) => {
    setAddCategoryForModal(cat);
    setIsAddModalOpen(true);
  };

  const colleges = useMemo(() => (userProfile.targetColleges || []).map((college) => ({
    ...college, category: getDirectoryCategory(college)
  })), [userProfile.targetColleges]);

  // Grouped by Category
  const reaches = useMemo(() => filterUniversitiesByRate(colleges, 'reach'), [colleges]);
  const targets = useMemo(() => filterUniversitiesByRate(colleges, 'target'), [colleges]);
  const safeties = useMemo(() => filterUniversitiesByRate(colleges, 'safety'), [colleges]);

  // Stage metrics
  const submittedCount = colleges.filter((c) => c.status === 'submitted' || c.status === 'accepted').length;
  const inProgressCount = colleges.filter((c) => c.status === 'in_progress' || c.status === 'ready').length;
  const notStartedCount = colleges.filter((c) => !c.status || c.status === 'not_started').length;

  // Portfolio Health Assessment based on real ratio & distribution
  const getPortfolioAdvice = () => {
    if (colleges.length === 0) {
      return {
        status: 'Empty Portfolio',
        badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        message: 'Start by adding Reach, Target, and Safety schools to build a resilient admissions strategy.',
        healthScore: 0
      };
    }
    // Condition 1: Missing Safety Schools
    if (safeties.length === 0) {
      return {
        status: 'Missing Safety Schools',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        message: 'Your list has no Safety schools (> 40% admit rate). Add at least 1-2 safety universities to ensure admission safety net.',
        healthScore: 40
      };
    }
    // Condition 2: Reach count > (Target + Safety count) combined
    if (reaches.length > targets.length + safeties.length) {
      return {
        status: 'Reach-Heavy Portfolio',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        message: `Reach schools (${reaches.length}) outnumber Target and Safety schools combined (${targets.length + safeties.length}). Consider adding more Target/Safety schools to balance admission odds.`,
        healthScore: 60
      };
    }
    // Condition 3: Safety count < Target count (not yet well-balanced)
    if (safeties.length < targets.length) {
      return {
        status: 'Target-Heavy Portfolio',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        message: `You have solid match targets (${targets.length}), but fewer safety schools (${safeties.length}). Consider adding more safety options so Safeties equal or exceed Targets.`,
        healthScore: 80
      };
    }
    // Condition 4: Only label "Well-Balanced Portfolio" when Safety >= Target and not Reach-dominant
    return {
      status: 'Well-Balanced Portfolio',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      message: `Great strategy! You have a healthy distribution of aspirational reaches (${reaches.length}), competitive target matches (${targets.length}), and safe foundation colleges (${safeties.length}).`,
      healthScore: 100
    };
  };

  const portfolioAdvice = getPortfolioAdvice();

  // Handlers for modifying target colleges
  const handleUpdateCollege = (updated: CollegeTarget) => {
    const nextColleges = colleges.map((c) => (c.id === updated.id ? updated : c));
    onUpdateProfile({ targetColleges: nextColleges });
    setSelectedCollegeForModal(updated);
  };

  const handleCategoryChange = (collegeId: string, category: CollegeCategory) => {
    const nextColleges = colleges.map((c) => (c.id === collegeId ? { ...c, category } : c));
    onUpdateProfile({ targetColleges: nextColleges });
    onShowToast?.(`Updated tier to ${category.toUpperCase()}`);
  };

  const handleStatusChange = (collegeId: string, status: CollegeApplicationStatus) => {
    const nextColleges = colleges.map((c) => (c.id === collegeId ? { ...c, status } : c));
    onUpdateProfile({ targetColleges: nextColleges });
    onShowToast?.('Updated application status!');
  };

  const handleDeleteCollege = (collegeId: string, name: string) => {
    const nextColleges = colleges.filter((c) => c.id !== collegeId);
    onUpdateProfile({ targetColleges: nextColleges });
    onShowToast?.(`Removed ${name} from your college list.`);
    if (selectedCollegeForModal?.id === collegeId) {
      setSelectedCollegeForModal(null);
    }
  };

  const handleAddCollege = (newCollege: CollegeTarget) => {
    onUpdateProfile({ targetColleges: [...colleges, newCollege] });
  };

  // Filtered by Search & Filter
  const filteredColleges = useMemo(() => {
    return filterUniversitiesByRate(colleges, tierFilter).filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || c.category === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [colleges, searchQuery, tierFilter]);

  // Distribution percentages for visual balance meter
  const totalCollegesCount = colleges.length || 1;
  const reachPct = Math.round((reaches.length / totalCollegesCount) * 100);
  const targetPct = Math.round((targets.length / totalCollegesCount) * 100);
  const safetyPct = Math.round((safeties.length / totalCollegesCount) * 100);

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 text-[#f1f5f9]">
      {/* Page Title & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Strategic Admissions Hub
            </span>
            <span className="text-[12px] text-slate-400">
              Class of '{userProfile.graduationYear.slice(-2)} Portfolio Tracker
            </span>
          </div>
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-400 text-[32px]">
              school
            </span>
            Target Universities &amp; Application Manager
          </h1>
          <p className="text-[13.5px] text-slate-300">
            Organize your college list by admissions tiers, track application milestones, and explore university requirements.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenAddModal()}
            className="glass-btn-primary px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add University</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center border-b border-white/10 space-x-2">
        <button
          onClick={() => setActiveMainTab('portfolio')}
          className={`px-4 py-3 rounded-t-xl font-bold text-[13.5px] transition-all cursor-pointer flex items-center gap-2 ${
            activeMainTab === 'portfolio'
              ? 'bg-indigo-500/20 text-white border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          <span>My College Portfolio ({colleges.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('ai_recommender')}
          className={`px-4 py-3 rounded-t-xl font-bold text-[13.5px] transition-all cursor-pointer flex items-center gap-2 ${
            activeMainTab === 'ai_recommender'
              ? 'bg-indigo-500/20 text-white border-b-2 border-indigo-400'
              : 'text-amber-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-amber-400">auto_awesome</span>
          <span>AI College Match Finder</span>
          <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-400 text-black rounded">
            AI
          </span>
        </button>
      </div>

      {/* TAB 1: Main Portfolio View */}
      {activeMainTab === 'portfolio' && (
        <div className="space-y-6 animate-fade-in">
          {/* Portfolio Health & Distribution Overview Banner */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-gradient-to-br from-indigo-950/40 via-[#10101a] to-[#0a0a0f] shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* 3 Category Count Pills */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                {/* Reaches */}
                <div
                  onClick={() => setTierFilter(tierFilter === 'reach' ? 'all' : 'reach')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-center ${
                    tierFilter === 'reach'
                      ? 'bg-rose-500/25 border-rose-500/50 shadow-md shadow-rose-500/20'
                      : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15'
                  }`}
                >
                  <div className="text-[10.5px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>Reach</span>
                  </div>
                  <div className="text-[22px] font-black text-white mt-0.5">{reaches.length}</div>
                  <div className="text-[10px] text-slate-400">&lt; 15% Admit Rate</div>
                </div>

                {/* Targets */}
                <div
                  onClick={() => setTierFilter(tierFilter === 'target' ? 'all' : 'target')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-center ${
                    tierFilter === 'target'
                      ? 'bg-indigo-500/25 border-indigo-500/50 shadow-md shadow-indigo-500/20'
                      : 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15'
                  }`}
                >
                  <div className="text-[10.5px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>Target</span>
                  </div>
                  <div className="text-[22px] font-black text-white mt-0.5">{targets.length}</div>
                  <div className="text-[10px] text-slate-400">15% - 40% Match</div>
                </div>

                {/* Safeties */}
                <div
                  onClick={() => setTierFilter(tierFilter === 'safety' ? 'all' : 'safety')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-center ${
                    tierFilter === 'safety'
                      ? 'bg-emerald-500/25 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
                  }`}
                >
                  <div className="text-[10.5px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Safety</span>
                  </div>
                  <div className="text-[22px] font-black text-white mt-0.5">{safeties.length}</div>
                  <div className="text-[10px] text-slate-400">&gt; 40% Likely</div>
                </div>
              </div>

              {/* Status Summary & Advice */}
              <div className="md:w-80 bg-white/[0.03] p-3.5 rounded-xl border border-white/10 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Portfolio Strategy
                  </span>
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${portfolioAdvice.badgeColor}`}>
                    {portfolioAdvice.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11.5px] text-slate-300">
                  <span>Submitted / Admitted: <strong className="text-white">{submittedCount}</strong></span>
                  <span>In Progress: <strong className="text-amber-300">{inProgressCount}</strong></span>
                  <span>Draft: <strong className="text-slate-400">{notStartedCount}</strong></span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {portfolioAdvice.message}
                </p>
              </div>
            </div>

            {/* Visual Portfolio Balance Meter */}
            {colleges.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 font-sans font-bold text-slate-300">
                    <span className="material-symbols-outlined text-indigo-400 text-[14px]">tune</span>
                    List Distribution Balance:
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-rose-400">Reach: {reachPct}%</span>
                    <span className="text-indigo-400">Target: {targetPct}%</span>
                    <span className="text-emerald-400">Safety: {safetyPct}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/10 p-[1px]">
                  <div
                    style={{ width: `${reachPct}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-l-full transition-all duration-500"
                    title={`Reach: ${reaches.length}`}
                  />
                  <div
                    style={{ width: `${targetPct}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    title={`Target: ${targets.length}`}
                  />
                  <div
                    style={{ width: `${safetyPct}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-r-full transition-all duration-500"
                    title={`Safety: ${safeties.length}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Control Bar: View Switcher (Tiers, Scatter Matrix, Stages, Timeline) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/10">
            {/* View Mode Buttons */}
            <div className="flex flex-wrap items-center bg-white/[0.04] p-1 rounded-xl border border-white/10 gap-1">
              <button
                onClick={() => setViewMode('tiers')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'tiers'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">folder_special</span>
                <span>By Category Tier</span>
              </button>

              <button
                onClick={() => setViewMode('scatter')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'scatter'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bubble_chart</span>
                <span>Selectivity vs Match Matrix</span>
              </button>

              <button
                onClick={() => setViewMode('stages')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'stages'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                <span>Pipeline Kanban</span>
              </button>

              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                <span>Deadlines Timeline</span>
              </button>
            </div>

            {/* Search and Tier Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-minimal pl-8 pr-2.5 py-1.5 text-[12px] w-40 sm:w-48"
                />
              </div>

              {tierFilter !== 'all' && (
                <button
                  onClick={() => setTierFilter('all')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Clear Filter</span>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* EMPTY STATE */}
          {colleges.length === 0 && (
            <div className="glass-card rounded-2xl p-10 text-center space-y-4 border border-dashed border-white/20">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <span className="material-symbols-outlined text-[36px]">account_balance</span>
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-white">No Target Universities Added Yet</h3>
                <p className="text-[13px] text-slate-400 max-w-md mx-auto mt-1">
                  Build your dream list with top institutions like MIT, Stanford, Harvard, UC Berkeley, or search from our curated directory.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="glass-btn-primary px-5 py-2.5 rounded-xl text-[13px] font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Add Your First University</span>
              </button>
            </div>
          )}

          {/* VIEW MODE 1: BY ADMISSIONS TIERS (Reach / Target / Safety Grouped Sections) */}
          {colleges.length > 0 && viewMode === 'tiers' && (
            <div className="space-y-8 animate-fade-in">
              {/* REACH SCHOOLS SECTION */}
              {(tierFilter === 'all' || tierFilter === 'reach') && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.7)]"></span>
                      <h3 className="text-[17px] font-extrabold text-white tracking-tight">
                        Reach Institutions
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {reaches.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-slate-400 hidden sm:inline">
                        Acceptance Rate &lt; 15% • Highly Aspirational
                      </span>
                      <button
                        onClick={() => handleOpenAddModal('reach')}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Add Reach</span>
                      </button>
                    </div>
                  </div>

                  {reaches.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-dashed border-rose-500/20 text-center text-[12.5px] text-slate-400 space-y-2">
                      <p>No Reach institutions added yet. Aim high and add dream schools.</p>
                      <button
                        onClick={() => handleOpenAddModal('reach')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">add</span>
                        <span>Add Reach School</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reaches
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.location.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((college) => (
                          <UniversityCard
                            key={college.id}
                            college={college}
                            onOpenDetails={setSelectedCollegeForModal}
                            onCategoryChange={handleCategoryChange}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteCollege}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TARGET SCHOOLS SECTION */}
              {(tierFilter === 'all' || tierFilter === 'target') && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.7)]"></span>
                      <h3 className="text-[17px] font-extrabold text-white tracking-tight">
                        Target Matches
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {targets.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-slate-400 hidden sm:inline">
                        Acceptance Rate 15% - 40% • Competitive Alignment
                      </span>
                      <button
                        onClick={() => handleOpenAddModal('target')}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Add Target</span>
                      </button>
                    </div>
                  </div>

                  {targets.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-dashed border-indigo-500/20 text-center text-[12.5px] text-slate-400 space-y-2">
                      <p>No Target institutions added yet. Add competitive match colleges for a balanced list.</p>
                      <button
                        onClick={() => handleOpenAddModal('target')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">add</span>
                        <span>Add Target School</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {targets
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.location.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((college) => (
                          <UniversityCard
                            key={college.id}
                            college={college}
                            onOpenDetails={setSelectedCollegeForModal}
                            onCategoryChange={handleCategoryChange}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteCollege}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* SAFETY SCHOOLS SECTION */}
              {(tierFilter === 'all' || tierFilter === 'safety') && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"></span>
                      <h3 className="text-[17px] font-extrabold text-white tracking-tight">
                        Safety Institutions
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {safeties.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-slate-400 hidden sm:inline">
                        Acceptance Rate &gt; 40% • Likely Admission
                      </span>
                      <button
                        onClick={() => handleOpenAddModal('safety')}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Add Safety</span>
                      </button>
                    </div>
                  </div>

                  {safeties.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-dashed border-emerald-500/20 text-center text-[12.5px] text-slate-400 space-y-2">
                      <p>No Safety institutions added yet. Adding 1-2 safeties protects your admission cycle.</p>
                      <button
                        onClick={() => handleOpenAddModal('safety')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">add</span>
                        <span>Add Safety School</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {safeties
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.location.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((college) => (
                          <UniversityCard
                            key={college.id}
                            college={college}
                            onOpenDetails={setSelectedCollegeForModal}
                            onCategoryChange={handleCategoryChange}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteCollege}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: SELECTIVITY VS MATCH SCATTER MATRIX */}
          {colleges.length > 0 && viewMode === 'scatter' && (
            <div className="glass-card rounded-2xl p-5 md:p-7 border border-white/10 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-[20px]">bubble_chart</span>
                    <span>Admissions Selectivity vs. Profile Match Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Interactive mapping of your target schools comparing Acceptance Rate (selectivity) vs Fit Score.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_#fb7185]" />
                    <span className="text-slate-300">Reach (&lt;15%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                    <span className="text-slate-300">Target (15-40%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span className="text-slate-300">Safety (&gt;40%)</span>
                  </div>
                </div>
              </div>

              {/* 2D Coordinate Matrix Canvas */}
              <div className="relative w-full h-[400px] bg-gradient-to-b from-[#0e0e1a] to-[#080811] rounded-xl border border-white/10 p-6 overflow-hidden">
                {/* Quadrant Background Tints */}
                <div className="absolute inset-x-6 top-6 bottom-1/2 grid grid-cols-2 gap-px pointer-events-none opacity-40">
                  <div className="bg-emerald-500/[0.03] border-b border-r border-white/10 p-2 text-[10px] uppercase font-bold text-emerald-400/60">
                    Safe Foundation Zone (High Admit)
                  </div>
                  <div className="bg-indigo-500/[0.03] border-b border-white/10 p-2 text-[10px] uppercase font-bold text-indigo-400/60 text-right">
                    Ideal Target Matches
                  </div>
                </div>
                <div className="absolute inset-x-6 top-1/2 bottom-6 grid grid-cols-2 gap-px pointer-events-none opacity-40">
                  <div className="bg-slate-500/[0.02] border-r border-white/10 p-2 text-[10px] uppercase font-bold text-slate-500/60">
                    Selective Stretches
                  </div>
                  <div className="bg-rose-500/[0.04] p-2 text-[10px] uppercase font-bold text-rose-400/60 text-right">
                    Aspirational Reach Spikes (Low Admit)
                  </div>
                </div>

                {/* SVG Coordinate Grid and Nodes */}
                <svg className="w-full h-full overflow-visible">
                  {/* Axis Grid Lines */}
                  <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />

                  {/* College Bubbles */}
                  {filteredColleges.map((col, idx) => {
                    const rawAdmit = parseFloat(col.acceptanceRate.replace(/[^0-9.]/g, '')) || (col.category === 'reach' ? 6 : col.category === 'target' ? 22 : 55);
                    const rawMatch = (col as any).matchScore ?? (col.category === 'safety' ? 90 : col.category === 'target' ? 82 : 74);

                    // Clamp to plot boundaries
                    // Y: 0% admit is at bottom (90%), 70% admit is at top (10%)
                    const yPos = Math.max(10, Math.min(90, 90 - (rawAdmit / 65) * 80));
                    // X: 50% match is at left (10%), 100% match is at right (90%)
                    const xPos = Math.max(10, Math.min(90, ((rawMatch - 45) / 55) * 80 + 10));

                    const isHovered = hoveredScatterCollege?.id === col.id;
                    const nodeColor = col.category === 'reach' ? '#fb7185' : col.category === 'target' ? '#818cf8' : '#34d399';

                    return (
                      <g
                        key={col.id || idx}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredScatterCollege(col)}
                        onMouseLeave={() => setHoveredScatterCollege(null)}
                        onClick={() => setSelectedCollegeForModal(col)}
                      >
                        {isHovered && (
                          <circle
                            cx={`${xPos}%`}
                            cy={`${yPos}%`}
                            r="22"
                            fill="none"
                            stroke={nodeColor}
                            strokeWidth="1.5"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          cx={`${xPos}%`}
                          cy={`${yPos}%`}
                          r={isHovered ? '14' : '10'}
                          fill={nodeColor}
                          fillOpacity={isHovered ? 0.9 : 0.75}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? '2.5' : '1.5'}
                          className="transition-all duration-200"
                        />
                        <text
                          x={`${xPos}%`}
                          y={`${yPos}%`}
                          dy="3"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          className="pointer-events-none select-none"
                        >
                          {col.name.slice(0, 2).toUpperCase()}
                        </text>
                        <text
                          x={`${xPos}%`}
                          y={`${yPos}%`}
                          dy="-15"
                          textAnchor="middle"
                          fill={isHovered ? '#ffffff' : '#cbd5e1'}
                          fontSize="10"
                          fontWeight={isHovered ? '800' : '600'}
                          className="pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                        >
                          {col.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Y-Axis Label */}
                <div className="absolute left-2 top-2 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                  ▲ Higher Acceptance Rate (Selectivity)
                </div>
                {/* X-Axis Label */}
                <div className="absolute right-3 bottom-1.5 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                  Higher Profile Alignment Match ▶
                </div>
              </div>

              {/* Hovered College Spotlight Tooltip Card */}
              {hoveredScatterCollege ? (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{
                      backgroundColor: hoveredScatterCollege.category === 'reach' ? '#fb7185' : hoveredScatterCollege.category === 'target' ? '#818cf8' : '#34d399'
                    }} />
                    <div>
                      <span className="font-bold text-white text-sm">{hoveredScatterCollege.name}</span>
                      <span className="text-slate-400 ml-2">({hoveredScatterCollege.category.toUpperCase()} • {hoveredScatterCollege.location})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span>Admit Rate: <strong className="text-amber-300">{hoveredScatterCollege.acceptanceRate}</strong></span>
                    <span>Status: <strong className="text-white capitalize">{hoveredScatterCollege.status || 'Not Started'}</strong></span>
                    <button
                      onClick={() => setSelectedCollegeForModal(hoveredScatterCollege)}
                      className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-sans font-bold hover:bg-indigo-500/30"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-indigo-400">touch_app</span>
                  <span>Hover over any university bubble to inspect admissions odds, or click to view requirements.</span>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 3: BY PIPELINE STAGES (Kanban Columns) */}
          {colleges.length > 0 && viewMode === 'stages' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in items-start">
              {/* Column 1: Not Started */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[12px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Not Started</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-slate-300">
                    {notStartedCount}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredColleges
                    .filter((c) => !c.status || c.status === 'not_started')
                    .map((college) => (
                      <UniversityCard
                        key={college.id}
                        college={college}
                        onOpenDetails={setSelectedCollegeForModal}
                        onCategoryChange={handleCategoryChange}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteCollege}
                      />
                    ))}
                </div>
              </div>

              {/* Column 2: Drafting Essays */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <span className="text-[12px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Drafting Essays</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {colleges.filter((c) => c.status === 'in_progress').length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredColleges
                    .filter((c) => c.status === 'in_progress')
                    .map((college) => (
                      <UniversityCard
                        key={college.id}
                        college={college}
                        onOpenDetails={setSelectedCollegeForModal}
                        onCategoryChange={handleCategoryChange}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteCollege}
                      />
                    ))}
                </div>
              </div>

              {/* Column 3: Ready for Review */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
                  <span className="text-[12px] font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>Ready for Review</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {colleges.filter((c) => c.status === 'ready').length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredColleges
                    .filter((c) => c.status === 'ready')
                    .map((college) => (
                      <UniversityCard
                        key={college.id}
                        college={college}
                        onOpenDetails={setSelectedCollegeForModal}
                        onCategoryChange={handleCategoryChange}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteCollege}
                      />
                    ))}
                </div>
              </div>

              {/* Column 4: Submitted & Decisions */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <span className="text-[12px] font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Submitted / Outcome</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {submittedCount}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredColleges
                    .filter((c) => c.status === 'submitted' || c.status === 'accepted' || c.status === 'deferred' || c.status === 'waitlisted' || c.status === 'rejected')
                    .map((college) => (
                      <UniversityCard
                        key={college.id}
                        college={college}
                        onOpenDetails={setSelectedCollegeForModal}
                        onCategoryChange={handleCategoryChange}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteCollege}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 4: TIMELINE VIEW (Chronological by Deadline) */}
          {colleges.length > 0 && viewMode === 'timeline' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="text-[13px] font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[18px]">event_upcoming</span>
                  <span>Upcoming Application Submission Deadlines</span>
                </div>

                <div className="space-y-3 pt-2">
                  {[...filteredColleges]
                    .sort((a, b) => a.deadline.localeCompare(b.deadline))
                    .map((college) => {
                      const tierClass =
                        college.category === 'reach'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : college.category === 'target'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                      return (
                        <div
                          key={college.id}
                          onClick={() => setSelectedCollegeForModal(college)}
                          className="p-4 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/10 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center shrink-0 min-w-[70px]">
                              <span className="text-[10px] uppercase font-bold block">Target Due</span>
                              <span className="text-[13.5px] font-black text-white block">{college.deadline}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-[15px] font-bold text-white">{college.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase border ${tierClass}`}>
                                  {college.category}
                                </span>
                              </div>
                              <p className="text-[12px] text-slate-400">
                                {college.round || 'Regular Decision'} • Admit Rate: {college.acceptanceRate} • {college.location}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCollegeForModal(college);
                              }}
                              className="glass-btn-secondary px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>View Info &amp; Tasks</span>
                              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI College Match Finder */}
      {activeMainTab === 'ai_recommender' && (
        <div className="space-y-6 animate-fade-in">
          <AICollegeRecommendationsCard
            userProfile={userProfile}
            onUpdateProfile={onUpdateProfile}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* University Detail Modal */}
      {selectedCollegeForModal && (
        <UniversityDetailModal
          college={selectedCollegeForModal}
          userProfile={userProfile}
          isOpen={Boolean(selectedCollegeForModal)}
          onClose={() => setSelectedCollegeForModal(null)}
          onUpdateCollege={handleUpdateCollege}
          onDeleteCollege={handleDeleteCollege}
          onShowToast={onShowToast}
        />
      )}

      {/* Add University Modal */}
      <AddUniversityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userProfile={userProfile}
        onAddCollege={handleAddCollege}
        onShowToast={onShowToast}
        initialCategory={addCategoryForModal}
      />
    </div>
  );
};
