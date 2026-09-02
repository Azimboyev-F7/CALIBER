import React, { useState, useMemo } from 'react';
import { 
  CollegeTarget, 
  CollegeCategory, 
  CollegeApplicationStatus, 
  UserProfile 
} from '../types';

interface CollegeProgressTrackerProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onShowToast?: (msg: string) => void;
}

// Preset popular universities database for quick-add
const POPULAR_UNIVERSITIES: Array<{
  name: string;
  category: CollegeCategory;
  acceptanceRate: string;
  location: string;
  deadline: string;
  round: string;
}> = [
  { name: 'MIT', category: 'reach', acceptanceRate: '3.9%', location: 'Cambridge, MA', deadline: 'Nov 1', round: 'Early Action (EA)' },
  { name: 'Stanford University', category: 'reach', acceptanceRate: '3.6%', location: 'Stanford, CA', deadline: 'Nov 1', round: 'Restrictive Early Action (REA)' },
  { name: 'Harvard University', category: 'reach', acceptanceRate: '3.4%', location: 'Cambridge, MA', deadline: 'Jan 1', round: 'Regular Decision (RD)' },
  { name: 'Princeton University', category: 'reach', acceptanceRate: '4.4%', location: 'Princeton, NJ', deadline: 'Jan 1', round: 'Regular Decision (RD)' },
  { name: 'Yale University', category: 'reach', acceptanceRate: '4.5%', location: 'New Haven, CT', deadline: 'Nov 1', round: 'Single-Choice EA' },
  { name: 'Columbia University', category: 'reach', acceptanceRate: '3.9%', location: 'New York, NY', deadline: 'Jan 1', round: 'Regular Decision (RD)' },
  { name: 'UC Berkeley', category: 'reach', acceptanceRate: '11.4%', location: 'Berkeley, CA', deadline: 'Nov 30', round: 'Regular Decision (RD)' },
  { name: 'UCLA', category: 'reach', acceptanceRate: '8.8%', location: 'Los Angeles, CA', deadline: 'Nov 30', round: 'Regular Decision (RD)' },
  { name: 'Carnegie Mellon University', category: 'reach', acceptanceRate: '11.0%', location: 'Pittsburgh, PA', deadline: 'Jan 3', round: 'Regular Decision (RD)' },
  { name: 'University of Michigan', category: 'target', acceptanceRate: '17.7%', location: 'Ann Arbor, MI', deadline: 'Nov 1', round: 'Early Action (EA)' },
  { name: 'Georgia Tech', category: 'target', acceptanceRate: '15.0%', location: 'Atlanta, GA', deadline: 'Oct 15', round: 'Early Action 1 (EA1)' },
  { name: 'University of Virginia', category: 'target', acceptanceRate: '19.0%', location: 'Charlottesville, VA', deadline: 'Nov 1', round: 'Early Action (EA)' },
  { name: 'UNC Chapel Hill', category: 'target', acceptanceRate: '17.0%', location: 'Chapel Hill, NC', deadline: 'Oct 15', round: 'Early Action (EA)' },
  { name: 'University of Southern California (USC)', category: 'reach', acceptanceRate: '9.9%', location: 'Los Angeles, CA', deadline: 'Dec 1', round: 'Early Action (EA)' },
  { name: 'UIUC (Grainger)', category: 'target', acceptanceRate: '23.0%', location: 'Urbana-Champaign, IL', deadline: 'Nov 1', round: 'Early Action (EA)' },
  { name: 'UT Austin', category: 'target', acceptanceRate: '28.0%', location: 'Austin, TX', deadline: 'Dec 1', round: 'Priority Decision' },
  { name: 'Purdue University', category: 'safety', acceptanceRate: '50.3%', location: 'West Lafayette, IN', deadline: 'Nov 1', round: 'Early Action (EA)' },
  { name: 'Penn State University', category: 'safety', acceptanceRate: '55.0%', location: 'University Park, PA', deadline: 'Nov 1', round: 'Early Action (EA)' },
  { name: 'University of Washington', category: 'target', acceptanceRate: '48.0%', location: 'Seattle, WA', deadline: 'Nov 15', round: 'Regular Decision' },
  { name: 'Texas A&M University', category: 'safety', acceptanceRate: '62.0%', location: 'College Station, TX', deadline: 'Dec 1', round: 'Early Action' }
];

const DEFAULT_CHECKLIST = [
  { id: 'chk-app', label: 'Main Common App / Coalition Profile', completed: false },
  { id: 'chk-supp', label: 'Institutional Supplement Essays', completed: false },
  { id: 'chk-rec', label: 'Teacher & Counselor Recommendations', completed: false },
  { id: 'chk-trans', label: 'Official Transcript & Test Scores Sent', completed: false },
  { id: 'chk-finaid', label: 'FAFSA / CSS Profile Submitted', completed: false }
];

const STATUS_CONFIG: Record<
  CollegeApplicationStatus,
  { label: string; icon: string; badgeClass: string; dotColor: string }
> = {
  not_started: {
    label: 'Not Started',
    icon: 'circle',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotColor: 'bg-slate-400'
  },
  in_progress: {
    label: 'Drafting / In Progress',
    icon: 'edit_note',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400'
  },
  ready: {
    label: 'Ready for Review',
    icon: 'fact_check',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-400'
  },
  submitted: {
    label: 'Submitted',
    icon: 'task_alt',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400'
  },
  accepted: {
    label: 'Accepted 🎉',
    icon: 'school',
    badgeClass: 'bg-purple-500/20 text-purple-200 border-purple-500/40 font-bold',
    dotColor: 'bg-purple-400'
  },
  deferred: {
    label: 'Deferred',
    icon: 'hourglass_top',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dotColor: 'bg-yellow-400'
  },
  waitlisted: {
    label: 'Waitlisted',
    icon: 'pause_circle',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotColor: 'bg-orange-400'
  },
  rejected: {
    label: 'Denied',
    icon: 'cancel',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotColor: 'bg-rose-400'
  }
};

export const CollegeProgressTracker: React.FC<CollegeProgressTrackerProps> = ({
  userProfile,
  onUpdateProfile,
  onShowToast
}) => {
  const colleges = userProfile.targetColleges || [];

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | CollegeCategory>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'submitted_accepted' | 'in_progress' | 'not_started'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'category' | 'name' | 'status'>('category');

  // Expanded card checklist states
  const [expandedCollegeId, setExpandedCollegeId] = useState<string | null>(null);

  // New college modal / form states
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCategory, setNewSchoolCategory] = useState<CollegeCategory>('reach');
  const [newSchoolRate, setNewSchoolRate] = useState('');
  const [newSchoolLocation, setNewSchoolLocation] = useState('');
  const [newSchoolDeadline, setNewSchoolDeadline] = useState('Jan 1');
  const [newSchoolRound, setNewSchoolRound] = useState('Regular Decision (RD)');
  const [newSchoolNotes, setNewSchoolNotes] = useState('');

  // Quick preset selector
  const [presetSearch, setPresetSearch] = useState('');
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

  // Metrics Calculations
  const reachColleges = colleges.filter((c) => c.category === 'reach');
  const targetColleges = colleges.filter((c) => c.category === 'target');
  const safetyColleges = colleges.filter((c) => c.category === 'safety');

  const submittedOrAcceptedCount = colleges.filter(
    (c) => c.status === 'submitted' || c.status === 'accepted'
  ).length;

  const inProgressCount = colleges.filter(
    (c) => c.status === 'in_progress' || c.status === 'ready'
  ).length;

  const notStartedCount = colleges.filter(
    (c) => !c.status || c.status === 'not_started'
  ).length;

  // Portfolio overall completion calculation
  const totalWeight = colleges.length * 100;
  const currentWeight = colleges.reduce((sum, c) => {
    if (c.status === 'accepted' || c.status === 'submitted') return sum + 100;
    if (c.status === 'ready') return sum + 80;
    if (c.status === 'in_progress') {
      const chk = c.checklist || [];
      if (chk.length > 0) {
        const completed = chk.filter((i) => i.completed).length;
        return sum + Math.round((completed / chk.length) * 60) + 20;
      }
      return sum + 45;
    }
    if (c.status === 'deferred' || c.status === 'waitlisted' || c.status === 'rejected') return sum + 100;
    return sum + 5;
  }, 0);

  const overallProgressPercent = totalWeight > 0 ? Math.min(100, Math.round((currentWeight / totalWeight) * 100)) : 0;

  // Portfolio balance advisory
  const getPortfolioAdvisory = () => {
    if (colleges.length === 0) return { title: 'Add Target Schools', tip: 'Start building your dream college list with a balance of reach, target, and safety options.', color: 'text-amber-400' };
    if (safetyColleges.length === 0) return { title: 'Missing Safety Schools', tip: 'Your list has no Safety schools (> 40% admit rate). Add at least 1-2 safety universities to ensure admission safety net.', color: 'text-rose-400' };
    if (reachColleges.length > targetColleges.length + safetyColleges.length) return { title: 'Reach-Heavy Portfolio', tip: `Reach schools (${reachColleges.length}) outnumber Target and Safety schools combined (${targetColleges.length + safetyColleges.length}). Consider adding more Target/Safety schools to balance admission odds.`, color: 'text-amber-400' };
    if (safetyColleges.length < targetColleges.length) return { title: 'Target-Heavy Portfolio', tip: `You have ${targetColleges.length} targets and ${safetyColleges.length} safeties. Consider adding more Safety schools so your foundation matches or exceeds your targets.`, color: 'text-indigo-300' };
    return { title: 'Well-Balanced Portfolio', tip: 'Strong mix of aspirational Reach, competitive Target, and safe foundation colleges.', color: 'text-emerald-400' };
  };

  const advisory = getPortfolioAdvisory();

  // Handlers for modifying colleges
  const handleCategoryChange = (collegeId: string, newCat: CollegeCategory) => {
    const updated = colleges.map((c) => (c.id === collegeId ? { ...c, category: newCat } : c));
    onUpdateProfile({ targetColleges: updated });
    onShowToast?.(`Updated school tier to ${newCat.toUpperCase()}`);
  };

  const handleStatusChange = (collegeId: string, newStatus: CollegeApplicationStatus) => {
    const updated = colleges.map((c) => (c.id === collegeId ? { ...c, status: newStatus } : c));
    onUpdateProfile({ targetColleges: updated });
    onShowToast?.(`Application status updated to ${STATUS_CONFIG[newStatus].label}`);
  };

  const handleToggleChecklist = (collegeId: string, checkId: string) => {
    const updated = colleges.map((c) => {
      if (c.id !== collegeId) return c;
      const list = c.checklist || DEFAULT_CHECKLIST;
      const newChecklist = list.map((item) =>
        item.id === checkId ? { ...item, completed: !item.completed } : item
      );
      return { ...c, checklist: newChecklist };
    });
    onUpdateProfile({ targetColleges: updated });
  };

  const handleDeleteSchool = (collegeId: string, schoolName: string) => {
    const updated = colleges.filter((c) => c.id !== collegeId);
    onUpdateProfile({ targetColleges: updated });
    onShowToast?.(`Removed ${schoolName} from dream list.`);
  };

  const handleAddPresetSchool = (preset: typeof POPULAR_UNIVERSITIES[0]) => {
    // Check if already in list
    if (colleges.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) {
      onShowToast?.(`${preset.name} is already in your college list!`);
      return;
    }

    const newCollege: CollegeTarget = {
      id: `col-${Date.now()}`,
      name: preset.name,
      category: preset.category,
      acceptanceRate: preset.acceptanceRate,
      location: preset.location,
      deadline: preset.deadline,
      round: preset.round,
      status: 'not_started',
      notes: `Targeting ${preset.round}`,
      checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item, id: `${item.id}-${Date.now()}` }))
    };

    onUpdateProfile({ targetColleges: [...colleges, newCollege] });
    setShowPresetsDropdown(false);
    setPresetSearch('');
    onShowToast?.(`Added ${preset.name} to ${preset.category.toUpperCase()} list!`);
  };

  const handleCreateCustomSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    const newCollege: CollegeTarget = {
      id: `col-${Date.now()}`,
      name: newSchoolName.trim(),
      category: newSchoolCategory,
      acceptanceRate: newSchoolRate.trim() ? (newSchoolRate.includes('%') ? newSchoolRate.trim() : `${newSchoolRate.trim()}%`) : '15%',
      location: newSchoolLocation.trim() || 'United States',
      deadline: newSchoolDeadline.trim() || 'Jan 1',
      round: newSchoolRound.trim() || 'Regular Decision (RD)',
      status: 'not_started',
      notes: newSchoolNotes.trim(),
      checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item, id: `${item.id}-${Date.now()}` }))
    };

    onUpdateProfile({ targetColleges: [...colleges, newCollege] });
    setNewSchoolName('');
    setNewSchoolRate('');
    setNewSchoolLocation('');
    setNewSchoolNotes('');
    setIsAddingCustom(false);
    onShowToast?.(`Added ${newCollege.name} to target list!`);
  };

  // Filtered and sorted colleges
  const filteredColleges = useMemo(() => {
    return colleges
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCat =
          selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter;

        let matchesStatus = true;
        if (selectedStatusFilter === 'submitted_accepted') {
          matchesStatus = c.status === 'submitted' || c.status === 'accepted';
        } else if (selectedStatusFilter === 'in_progress') {
          matchesStatus = c.status === 'in_progress' || c.status === 'ready';
        } else if (selectedStatusFilter === 'not_started') {
          matchesStatus = !c.status || c.status === 'not_started';
        }

        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'category') {
          const rank = { reach: 1, target: 2, safety: 3 };
          return rank[a.category] - rank[b.category];
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'status') {
          const statusRank: Record<string, number> = {
            accepted: 1,
            submitted: 2,
            ready: 3,
            in_progress: 4,
            not_started: 5,
            deferred: 6,
            waitlisted: 7,
            rejected: 8
          };
          return (statusRank[a.status || 'not_started'] || 9) - (statusRank[b.status || 'not_started'] || 9);
        }
        return a.deadline.localeCompare(b.deadline);
      });
  }, [colleges, searchQuery, selectedCategoryFilter, selectedStatusFilter, sortBy]);

  const presetFiltered = useMemo(() => {
    if (!presetSearch.trim()) return POPULAR_UNIVERSITIES.slice(0, 8);
    return POPULAR_UNIVERSITIES.filter((u) =>
      u.name.toLowerCase().includes(presetSearch.toLowerCase())
    );
  }, [presetSearch]);

  return (
    <div className="space-y-5">
      {/* Top Application Status Summary Dashboard */}
      <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-gradient-to-br from-indigo-950/40 via-[#10101a] to-[#0a0a0f] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Application Status Hub
              </span>
              <span className="text-[12px] text-slate-400">
                {colleges.length} Total Dream Institutions
              </span>
            </div>
            <h3 className="text-[20px] md:text-[22px] font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[24px]">
                account_balance
              </span>
              Dream College Progress &amp; Portfolio Dashboard
            </h3>
            <p className="text-[13px] text-slate-300">
              Categorize schools as <strong className="text-rose-300">Reach</strong>, <strong className="text-indigo-300">Target</strong>, or <strong className="text-emerald-300">Safety</strong> to balance admission odds and track deadlines.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 relative">
            <div className="relative">
              <button
                onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                className="glass-btn-secondary px-3.5 py-2 rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-400">add_circle</span>
                <span>Quick Add T20/T50</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {/* Presets Dropdown */}
              {showPresetsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-[#101018] border border-white/20 rounded-xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-xl">
                  <div className="p-2 border-b border-white/10 mb-1">
                    <input
                      type="text"
                      placeholder="Search universities..."
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      className="input-minimal w-full px-2.5 py-1.5 text-[12px]"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    {presetFiltered.map((p) => {
                      const isAdded = colleges.some((c) => c.name.toLowerCase() === p.name.toLowerCase());
                      return (
                        <div
                          key={p.name}
                          onClick={() => !isAdded && handleAddPresetSchool(p)}
                          className={`p-2 rounded-lg flex items-center justify-between text-[12px] transition-all ${
                            isAdded
                              ? 'opacity-40 cursor-not-allowed bg-white/[0.02]'
                              : 'hover:bg-white/[0.08] cursor-pointer text-white'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.location} • {p.acceptanceRate}</div>
                          </div>
                          <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            p.category === 'reach' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            p.category === 'target' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {isAdded ? 'Added' : p.category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="glass-btn-primary px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/25"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Custom School</span>
            </button>
          </div>
        </div>

        {/* Aggregate Progress & Tier Balance Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Overall Completion Progress */}
          <div className="md:col-span-6 bg-white/[0.03] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-indigo-400 text-[16px]">trending_up</span>
                Application Cycle Progress
              </span>
              <span className="text-[14px] font-extrabold text-white">
                {overallProgressPercent}% Complete
              </span>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${colleges.length > 0 ? (submittedOrAcceptedCount / colleges.length) * 100 : 0}%` }}
                title={`Submitted/Accepted: ${submittedOrAcceptedCount}`}
              ></div>
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                style={{ width: `${colleges.length > 0 ? (inProgressCount / colleges.length) * 100 : 0}%` }}
                title={`In Progress: ${inProgressCount}`}
              ></div>
            </div>

            {/* Legend Counts */}
            <div className="flex flex-wrap items-center justify-between text-[11.5px] text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Submitted / Admitted ({submittedOrAcceptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Drafting / Ready ({inProgressCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span>Not Started ({notStartedCount})</span>
              </div>
            </div>
          </div>

          {/* Tier Balance Breakdown */}
          <div className="md:col-span-6 bg-white/[0.03] p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-purple-400 text-[16px]">balance</span>
                Admissions Tier Distribution
              </span>
              <span className={`text-[11px] font-bold ${advisory.color}`}>
                {advisory.title}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 flex flex-col items-center justify-center text-center">
                <span className="text-[10.5px] font-bold text-rose-300 uppercase tracking-wider">Reach</span>
                <span className="text-[18px] font-extrabold text-white">{reachColleges.length}</span>
                <span className="text-[9.5px] text-slate-400">&lt; 15% Admit</span>
              </div>

              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex flex-col items-center justify-center text-center">
                <span className="text-[10.5px] font-bold text-indigo-300 uppercase tracking-wider">Target</span>
                <span className="text-[18px] font-extrabold text-white">{targetColleges.length}</span>
                <span className="text-[9.5px] text-slate-400">15% - 40%</span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-center">
                <span className="text-[10.5px] font-bold text-emerald-300 uppercase tracking-wider">Safety</span>
                <span className="text-[18px] font-extrabold text-white">{safetyColleges.length}</span>
                <span className="text-[9.5px] text-slate-400">&gt; 40% Admit</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic leading-tight">
              Tip: {advisory.tip}
            </p>
          </div>
        </div>

        {/* Custom School Inline Adder */}
        {isAddingCustom && (
          <form onSubmit={handleCreateCustomSchool} className="p-4 rounded-xl bg-white/[0.05] border border-indigo-500/40 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-[13.5px] font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-400 text-[17px]">add_location_alt</span>
                Add Custom Dream Institution
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-slate-400 hover:text-white text-[12px] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. Northwestern University"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">Admissions Category</label>
                <select
                  value={newSchoolCategory}
                  onChange={(e) => setNewSchoolCategory(e.target.value as CollegeCategory)}
                  className="input-minimal w-full px-2.5 py-1.5 text-[12.5px] bg-[#0a0a0f] text-white cursor-pointer"
                >
                  <option value="reach">Reach (&lt; 15% Admit)</option>
                  <option value="target">Target (15% - 40%)</option>
                  <option value="safety">Safety (&gt; 40%)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">Acceptance Rate</label>
                <input
                  type="text"
                  placeholder="e.g. 7.5%"
                  value={newSchoolRate}
                  onChange={(e) => setNewSchoolRate(e.target.value)}
                  className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">Deadline</label>
                <input
                  type="text"
                  placeholder="e.g. Nov 1"
                  value={newSchoolDeadline}
                  onChange={(e) => setNewSchoolDeadline(e.target.value)}
                  className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Evanston, IL"
                  value={newSchoolLocation}
                  onChange={(e) => setNewSchoolLocation(e.target.value)}
                  className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] text-slate-300 mb-1 font-medium">Application Round</label>
                <input
                  type="text"
                  placeholder="e.g. Early Decision (ED)"
                  value={newSchoolRound}
                  onChange={(e) => setNewSchoolRound(e.target.value)}
                  className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                />
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 glass-btn-primary font-bold text-[12.5px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Save to College List</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/10">
        {/* Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-white/[0.04]'
            }`}
          >
            All ({colleges.length})
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('reach')}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              selectedCategoryFilter === 'reach'
                ? 'bg-rose-600 text-white'
                : 'text-rose-300 hover:text-white bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            Reach ({reachColleges.length})
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('target')}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              selectedCategoryFilter === 'target'
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-300 hover:text-white bg-indigo-500/10 border border-indigo-500/20'
            }`}
          >
            Target ({targetColleges.length})
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('safety')}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
              selectedCategoryFilter === 'safety'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-300 hover:text-white bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            Safety ({safetyColleges.length})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-minimal px-2.5 py-1 text-[12px] w-36 sm:w-44"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input-minimal px-2 py-1 text-[12px] bg-[#0a0a0f] text-white cursor-pointer"
          >
            <option value="category">Sort: Category Tier</option>
            <option value="status">Sort: App Status</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="deadline">Sort: Deadline</option>
          </select>
        </div>
      </div>

      {/* College Target Cards Grid */}
      <div className="space-y-3">
        {filteredColleges.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-2 border border-white/10">
            <span className="material-symbols-outlined text-slate-500 text-[36px]">
              school
            </span>
            <h4 className="text-[15px] font-bold text-white">No institutions match this filter</h4>
            <p className="text-[12px] text-slate-400 max-w-sm mx-auto">
              Try adjusting your category or search filters, or click Quick Add to explore colleges.
            </p>
          </div>
        ) : (
          filteredColleges.map((college) => {
            const currentStatus = college.status || 'not_started';
            const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.not_started;
            const isExpanded = expandedCollegeId === college.id;
            const checklist = college.checklist || DEFAULT_CHECKLIST;
            const completedCount = checklist.filter((c) => c.completed).length;

            const isReach = college.category === 'reach';
            const isTarget = college.category === 'target';
            const isSafety = college.category === 'safety';

            const borderHighlight = isReach
              ? 'hover:border-rose-500/40'
              : isTarget
              ? 'hover:border-indigo-500/40'
              : 'hover:border-emerald-500/40';

            return (
              <div
                key={college.id}
                className={`glass-card rounded-2xl p-4 md:p-5 border border-white/10 transition-all shadow-[0_4px_20px_0_rgba(0,0,0,0.25)] ${borderHighlight} bg-gradient-to-r from-white/[0.02] to-transparent`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: School Info & Badges */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[16px] md:text-[17px] font-extrabold text-white">
                        {college.name}
                      </h4>
                      <span className="text-[11.5px] text-slate-400 font-normal">
                        • {college.location}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-slate-300">
                      <span className="flex items-center gap-1 font-semibold text-slate-200">
                        <span className="material-symbols-outlined text-[15px] text-indigo-400">percent</span>
                        Admit Rate: <strong className="text-white">{college.acceptanceRate}</strong>
                      </span>

                      <span className="text-slate-500">•</span>

                      <span className="flex items-center gap-1 text-slate-300">
                        <span className="material-symbols-outlined text-[15px] text-amber-400">event</span>
                        {college.round ? college.round : 'Deadline'}: <strong className="text-white">{college.deadline}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Middle & Right: Interactive Category Selector & Application Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Direct Category Toggles (Reach / Target / Safety) */}
                    <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/10 gap-1">
                      <button
                        onClick={() => handleCategoryChange(college.id, 'reach')}
                        title="Mark as Reach (&lt; 15% Admit Rate)"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                          isReach
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                            : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
                        }`}
                      >
                        Reach
                      </button>
                      <button
                        onClick={() => handleCategoryChange(college.id, 'target')}
                        title="Mark as Target (15% - 40% Admit Rate)"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                          isTarget
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                            : 'text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                        }`}
                      >
                        Target
                      </button>
                      <button
                        onClick={() => handleCategoryChange(college.id, 'safety')}
                        title="Mark as Safety (&gt; 40% Admit Rate)"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
                          isSafety
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                        }`}
                      >
                        Safety
                      </button>
                    </div>

                    {/* Application Status Selector */}
                    <div className="relative">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(college.id, e.target.value as CollegeApplicationStatus)}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all cursor-pointer appearance-none pr-8 ${statusInfo.badgeClass} bg-[#0e0e17]`}
                      >
                        <option value="not_started">⚪ Not Started</option>
                        <option value="in_progress">🟡 Drafting Essays / In Progress</option>
                        <option value="ready">🔵 Ready for Final Review</option>
                        <option value="submitted">🟢 Submitted 🎉</option>
                        <option value="accepted">🟣 Admitted / Accepted 🎓</option>
                        <option value="deferred">🟠 Deferred</option>
                        <option value="waitlisted">⏸️ Waitlisted</option>
                        <option value="rejected">🔴 Denied</option>
                      </select>
                      <span className="material-symbols-outlined text-[16px] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        arrow_drop_down
                      </span>
                    </div>

                    {/* Expand Milestones / Checklist Toggle */}
                    <button
                      onClick={() => setExpandedCollegeId(isExpanded ? null : college.id)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isExpanded
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isExpanded ? 'expand_less' : 'checklist'}
                      </span>
                      <span>
                        Tasks ({completedCount}/{checklist.length})
                      </span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSchool(college.id, college.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10 cursor-pointer"
                      title="Remove from college list"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Notes if available */}
                {college.notes && !isExpanded && (
                  <div className="mt-2.5 text-[11.5px] text-slate-400 italic flex items-center gap-1.5 pl-1">
                    <span className="material-symbols-outlined text-[14px] text-indigo-400 shrink-0">edit_note</span>
                    <span>{college.notes}</span>
                  </div>
                )}

                {/* Expandable Checklist & Application Milestone Tracker */}
                {isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-white/10 space-y-3 animate-fade-in bg-white/[0.02] p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[12px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-indigo-400 text-[16px]">task</span>
                        {college.name} Application Milestones
                      </h5>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {Math.round((completedCount / checklist.length) * 100)}% Tasks Complete
                      </span>
                    </div>

                    {/* Checklist Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {checklist.map((item) => (
                        <label
                          key={item.id}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 text-[12px] ${
                            item.completed
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-slate-300 line-through'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklist(college.id, item.id)}
                            className="rounded text-indigo-500 focus:ring-indigo-400 border-white/20 w-4 h-4 bg-white/10 cursor-pointer shrink-0"
                          />
                          <span className="truncate">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
