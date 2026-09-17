import React, { useState, useMemo, useEffect } from 'react';
import { CollegeTarget, CollegeCategory, UserProfile } from '../types';
import { UNIVERSITIES_DATABASE, UniversityInfo } from '../data/universitiesDatabase';
import { filterUniversitiesByRate, getDirectoryCategory } from '../utils/universityDirectory';

interface AddUniversityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onAddCollege: (college: CollegeTarget) => void;
  onShowToast?: (msg: string) => void;
  initialCategory?: CollegeCategory;
  initialTab?: 'directory' | 'custom';
}

const DEFAULT_CHECKLIST = [
  { id: 'chk-app', label: 'Complete Common Application / Portal Profile', completed: false },
  { id: 'chk-supp', label: 'Draft Institutional Supplemental Essays', completed: false },
  { id: 'chk-rec', label: 'Request Teacher & Counselor Recommendations', completed: false },
  { id: 'chk-trans', label: 'Submit Official High School Transcripts & Test Scores', completed: false },
  { id: 'chk-finaid', label: 'Submit FAFSA / CSS Profile for Financial Aid', completed: false }
];

// Quick suggestions for custom institutions
const POPULAR_CUSTOM_PRESETS = [
  { name: 'Brown University', category: 'reach' as CollegeCategory, rate: '5.1%', location: 'Providence, RI', deadline: 'Jan 3', round: 'Regular Decision (RD)' },
  { name: 'University of Oxford', category: 'reach' as CollegeCategory, rate: '13.7%', location: 'Oxford, United Kingdom', deadline: 'Oct 15', round: 'UCAS Deadline' },
  { name: 'University of Cambridge', category: 'reach' as CollegeCategory, rate: '15.8%', location: 'Cambridge, United Kingdom', deadline: 'Oct 15', round: 'UCAS Deadline' },
  { name: 'University of Toronto', category: 'target' as CollegeCategory, rate: '43.0%', location: 'Toronto, ON, Canada', deadline: 'Jan 15', round: 'OUAC / Direct App' },
  { name: 'University of Washington', category: 'target' as CollegeCategory, rate: '48.0%', location: 'Seattle, WA', deadline: 'Nov 15', round: 'Regular Decision' },
  { name: 'University of Waterloo', category: 'target' as CollegeCategory, rate: '53.0%', location: 'Waterloo, ON, Canada', deadline: 'Feb 1', round: 'AIF Application' },
  { name: 'New York University (NYU)', category: 'reach' as CollegeCategory, rate: '8.0%', location: 'New York, NY', deadline: 'Jan 5', round: 'Regular Decision' },
  { name: 'UC San Diego (UCSD)', category: 'target' as CollegeCategory, rate: '24.7%', location: 'La Jolla, CA', deadline: 'Nov 30', round: 'UC Application' }
];

export const AddUniversityModal: React.FC<AddUniversityModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onAddCollege,
  onShowToast,
  initialCategory,
  initialTab = 'directory'
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'custom'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CollegeCategory>(
    initialCategory || 'all'
  );

  // Per-university local customization state for directory items (key: uni.id)
  const [selectedTiers, setSelectedTiers] = useState<Record<string, CollegeCategory>>({});
  const [selectedRounds, setSelectedRounds] = useState<Record<string, 'ea_ed' | 'rd'>>({});

  // Custom Form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<CollegeCategory>(initialCategory || 'target');
  const [customRate, setCustomRate] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customDeadline, setCustomDeadline] = useState('Jan 1');
  const [customRound, setCustomRound] = useState('Regular Decision (RD)');
  const [customNotes, setCustomNotes] = useState('');

  const existingColleges = userProfile.targetColleges || [];

  useEffect(() => {
    if (!isOpen) return;
    setCategoryFilter(initialCategory || 'all');
    setActiveTab(initialTab);
    setSearchQuery('');
    setCustomCategory(initialCategory || 'target');
    setSelectedTiers({});
  }, [isOpen, initialCategory, initialTab]);

  const filteredDirectory = useMemo(() => {
    const result = UNIVERSITIES_DATABASE.filter((uni) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        uni.name.toLowerCase().includes(q) ||
        uni.shortName.toLowerCase().includes(q) ||
        uni.location.toLowerCase().includes(q) ||
        uni.popularMajors.some((m) => m.toLowerCase().includes(q)) ||
        uni.keyStrengths.some((s) => s.toLowerCase().includes(q));

      return matchesSearch;
    });
    return filterUniversitiesByRate(result, categoryFilter);
  }, [searchQuery, categoryFilter]);

  if (!isOpen) return null;

  // Clean date helper that prevents "undefined undefined" or syntax breaks
  const extractCleanDeadline = (rawDate: string | undefined): string => {
    if (!rawDate || rawDate.toLowerCase().startsWith('none')) return 'Jan 1';
    const match = rawDate.match(/([A-Za-z]{3,9}\s+\d{1,2})/);
    if (match) return match[1];
    const cleaned = rawDate.split('(')[0].trim();
    return cleaned || 'Jan 1';
  };

  const handleAddFromDirectory = (uni: UniversityInfo) => {
    const isAlreadyAdded = existingColleges.some(
      (c) => c.name.toLowerCase().trim() === uni.name.toLowerCase().trim()
    );

    if (isAlreadyAdded) {
      onShowToast?.(`${uni.shortName} is already in your college portfolio!`);
      return;
    }

    const tierToUse = selectedTiers[uni.id] || getDirectoryCategory(uni);
    const roundPreference = selectedRounds[uni.id] || (uni.deadlineEA_ED && !uni.deadlineEA_ED.toLowerCase().startsWith('none') ? 'ea_ed' : 'rd');

    const chosenRound = roundPreference === 'ea_ed' && uni.deadlineEA_ED && !uni.deadlineEA_ED.toLowerCase().startsWith('none')
      ? uni.deadlineEA_ED
      : uni.deadlineRD || 'Regular Decision (RD)';

    const cleanDeadline = extractCleanDeadline(chosenRound);

    const newCollege: CollegeTarget = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: uni.name,
      category: tierToUse,
      acceptanceRate: uni.acceptanceRate,
      location: uni.location,
      deadline: cleanDeadline,
      round: chosenRound,
      status: 'not_started',
      notes: uni.admissionsStrategyTip,
      checklist: DEFAULT_CHECKLIST.map((item, idx) => ({
        id: `chk-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        label: item.label,
        completed: false
      }))
    };

    onAddCollege(newCollege);
    onShowToast?.(`Added ${uni.shortName} as a ${tierToUse.toUpperCase()} university!`);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      onShowToast?.('Please enter a university name.');
      return;
    }

    const isAlreadyAdded = existingColleges.some(
      (c) => c.name.toLowerCase().trim() === customName.toLowerCase().trim()
    );

    if (isAlreadyAdded) {
      onShowToast?.(`${customName.trim()} is already in your college list!`);
      return;
    }

    let formattedRate = customRate.trim();
    if (!formattedRate) {
      formattedRate = customCategory === 'reach' ? '8.5%' : customCategory === 'target' ? '22.0%' : '52.0%';
    } else if (!formattedRate.includes('%')) {
      formattedRate = `${formattedRate}%`;
    }

    const newCollege: CollegeTarget = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: customName.trim(),
      category: customCategory,
      acceptanceRate: formattedRate,
      location: customLocation.trim() || 'United States',
      deadline: extractCleanDeadline(customDeadline.trim() || 'Jan 1'),
      round: customRound.trim() || 'Regular Decision (RD)',
      status: 'not_started',
      notes: customNotes.trim() || 'Custom university entry added to admissions portfolio.',
      checklist: DEFAULT_CHECKLIST.map((item, idx) => ({
        id: `chk-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        label: item.label,
        completed: false
      }))
    };

    onAddCollege(newCollege);
    setCustomName('');
    setCustomRate('');
    setCustomLocation('');
    setCustomNotes('');
    onShowToast?.(`Added ${newCollege.name} to your ${newCollege.category.toUpperCase()} list!`);
    onClose();
  };

  const handleApplyPreset = (preset: typeof POPULAR_CUSTOM_PRESETS[0]) => {
    setCustomName(preset.name);
    setCustomCategory(preset.category);
    setCustomRate(preset.rate);
    setCustomLocation(preset.location);
    setCustomDeadline(preset.deadline);
    setCustomRound(preset.round);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl border border-white/20 bg-[#0d0d14] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/50 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[19px] md:text-[21px] font-extrabold text-white tracking-tight">
                  Add Target University
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {existingColleges.length} in List
                </span>
              </div>
              <p className="text-[12.5px] text-slate-400">
                Browse our curated Top 50 database or create a custom entry for any university worldwide.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-white/10 px-6 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'border-indigo-400 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">travel_explore</span>
            <span>Browse Top Universities Directory ({UNIVERSITIES_DATABASE.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'border-indigo-400 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span>Add Custom Institution Worldwide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200 space-y-4">
          {activeTab === 'directory' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search by university name, location, or major (e.g. CS, Robotics, Business, Pre-Med)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-minimal w-full pl-9 pr-3 py-2 text-[12.5px]"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[14px]"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter by Tier */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({UNIVERSITIES_DATABASE.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter('reach')}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                      categoryFilter === 'reach'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                    }`}
                  >
                    Reach (&lt;20%)
                  </button>
                  <button
                    onClick={() => setCategoryFilter('target')}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                      categoryFilter === 'target'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                    }`}
                  >
                    Target (20-55%)
                  </button>
                  <button
                    onClick={() => setCategoryFilter('safety')}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                      categoryFilter === 'safety'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    Safety (&gt;55%)
                  </button>
                </div>
              </div>

              {/* Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredDirectory.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-slate-400 space-y-3">
                    <span className="material-symbols-outlined text-[36px] text-slate-500">search_off</span>
                    <p className="text-[13.5px]">No universities match "{searchQuery}".</p>
                    <button
                      onClick={() => setActiveTab('custom')}
                      className="glass-btn-primary px-4 py-2 rounded-xl text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      Add "{searchQuery}" as Custom University
                    </button>
                  </div>
                ) : (
                  filteredDirectory.map((uni) => {
                    const isAdded = existingColleges.some(
                      (c) => c.name.toLowerCase().trim() === uni.name.toLowerCase().trim()
                    );

                    const currentChosenTier = selectedTiers[uni.id] || getDirectoryCategory(uni);
                    const hasEA = uni.deadlineEA_ED && !uni.deadlineEA_ED.toLowerCase().startsWith('none');
                    const currentRoundPref = selectedRounds[uni.id] || (hasEA ? 'ea_ed' : 'rd');

                    const tierClasses =
                      currentChosenTier === 'reach'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : currentChosenTier === 'target'
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

                    const displayedDeadline = currentRoundPref === 'ea_ed' && hasEA
                      ? uni.deadlineEA_ED
                      : uni.deadlineRD;

                    return (
                      <div
                        key={uni.id}
                        className={`p-4 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border transition-all flex flex-col justify-between space-y-3 ${
                          isAdded ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-[14.5px] font-bold text-white leading-snug">
                                {uni.name}
                              </h4>
                              <div className="text-[11.5px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                                <span>{uni.location} • {uni.setting}</span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 border ${tierClasses}`}>
                              {currentChosenTier}
                            </span>
                          </div>

                          {/* Quick Stats Badges */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              Admit: <strong className="text-white">{uni.acceptanceRate}</strong>
                            </span>
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              SAT: <strong className="text-white">{uni.middleSat}</strong>
                            </span>
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              Tuition: <strong className="text-white">{uni.tuition.split('/')[0]}</strong>
                            </span>
                          </div>

                          <p className="text-[11.5px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {uni.overview}
                          </p>

                          {/* Tier & Round Selection Controls */}
                          {!isAdded && (
                            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                              {/* Tier Selector */}
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Tier:</span>
                                {(['reach', 'target', 'safety'] as CollegeCategory[]).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setSelectedTiers((prev) => ({ ...prev, [uni.id]: t }))}
                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                      currentChosenTier === t
                                        ? t === 'reach'
                                          ? 'bg-rose-500 text-white'
                                          : t === 'target'
                                          ? 'bg-indigo-500 text-white'
                                          : 'bg-emerald-500 text-white'
                                        : 'bg-white/5 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>

                              {/* Application Round Selector */}
                              {hasEA && (
                                <div className="flex items-center gap-1 text-[10.5px]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRounds((prev) => ({ ...prev, [uni.id]: 'ea_ed' }))}
                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                                      currentRoundPref === 'ea_ed'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Early
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRounds((prev) => ({ ...prev, [uni.id]: 'rd' }))}
                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                                      currentRoundPref === 'rd'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Regular
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[11px] text-amber-300 font-medium truncate max-w-[180px]" title={displayedDeadline}>
                            Due: {displayedDeadline}
                          </span>

                          <button
                            onClick={() => handleAddFromDirectory(uni)}
                            disabled={isAdded}
                            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-not-allowed'
                                : 'glass-btn-primary shadow-sm hover:scale-[1.02]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isAdded ? 'check_circle' : 'add'}
                            </span>
                            <span>{isAdded ? 'In Portfolio' : `Add as ${currentChosenTier.toUpperCase()}`}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: Custom University Form */
            <form onSubmit={handleCreateCustom} className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[12.5px] text-slate-300 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-indigo-400 text-[20px] shrink-0 mt-0.5">
                  info
                </span>
                <div>
                  <strong className="text-white">Add Any Global Institution:</strong> Track international universities (UK, Canada, Europe, Asia) or specialized liberal arts colleges with custom deadlines and milestone checklists.
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Popular Global Presets (Click to autofill):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CUSTOM_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11.5px] bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px] text-indigo-400">bolt</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-2">
                <div className="sm:col-span-8">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    University / College Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. University of Oxford, UCLA, Brown University..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[12.5px]"
                    required
                    autoFocus
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Admissions Tier *
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as CollegeCategory)}
                    className="input-minimal w-full px-2.5 py-2 text-[12.5px] bg-[#0a0a0f] text-white cursor-pointer"
                  >
                    <option value="reach">Reach (&lt; 20% Admit Rate)</option>
                    <option value="target">Target (20% - 55% Admit Rate)</option>
                    <option value="safety">Safety (&gt; 55% Admit Rate)</option>
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Location (City, State / Country)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oxford, UK or Los Angeles, CA"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[12.5px]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Acceptance Rate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14.5%"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[12.5px]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Target Deadline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nov 30, Jan 1"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[12.5px]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Application Round
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regular Decision (RD), Early Action (EA), UCAS"
                    value={customRound}
                    onChange={(e) => setCustomRound(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[12.5px]"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Intended Major / Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, Economics, Bioengineering"
                    className="input-minimal w-full px-3 py-2 text-[12.5px]"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-[11.5px] text-slate-200 mb-1 font-semibold">
                    Admissions Strategy Notes &amp; Faculty Links (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific professors, labs, or programs you plan to highlight in your essays..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="input-minimal w-full p-2.5 text-[12.5px] rounded-xl resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-btn-secondary px-4 py-2 rounded-xl text-[12.5px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Save to {customCategory.toUpperCase()} List</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
