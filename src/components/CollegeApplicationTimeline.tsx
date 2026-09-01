import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveScreen, UserProfile, CollegeTarget } from '../types';

export interface TimelineMilestone {
  id: string;
  title: string;
  type: 'college_deadline' | 'testing' | 'essay' | 'financial' | 'decision';
  dateStr: string; // e.g. "Nov 1", "Nov 30", "Jan 1"
  calculatedDate: Date;
  daysRemaining: number;
  isPast: boolean;
  category?: 'reach' | 'target' | 'safety' | 'general';
  round?: string;
  collegeId?: string;
  status?: string;
  checklistTotal?: number;
  checklistCompleted?: number;
  description?: string;
  isCustom?: boolean;
}

interface CollegeApplicationTimelineProps {
  userProfile: UserProfile;
  onNavigate: (screen: ActiveScreen) => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  className?: string;
}

export const CollegeApplicationTimeline: React.FC<CollegeApplicationTimelineProps> = ({
  userProfile,
  onNavigate,
  onUpdateProfile,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'early' | 'regular' | 'submitted'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'cards'>('timeline');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customType, setCustomType] = useState<'essay' | 'testing' | 'financial' | 'college_deadline'>('essay');
  const [customMilestones, setCustomMilestones] = useState<Array<{ id: string; title: string; date: string; type: 'essay' | 'testing' | 'financial' | 'college_deadline'; completed: boolean }>>([
    { id: 'cm-1', title: 'Request Counselor & Teacher Letters of Rec', date: 'Sep 20', type: 'essay', completed: true },
    { id: 'cm-2', title: 'Finalize Common App Core Essay (650 words)', date: 'Oct 10', type: 'essay', completed: false },
    { id: 'cm-3', title: 'Submit FAFSA & CSS Profile Financial Aid', date: 'Dec 01', type: 'financial', completed: false }
  ]);

  // Current anchor date (e.g. today's date)
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();

  // Helper to parse strings like "Nov 1", "Oct 15", "Jan 1" into Date object
  const parseDeadlineToDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(currentYear, 11, 31);
    
    // Check if ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr);
    }

    const months: { [key: string]: number } = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };

    const parts = dateStr.trim().split(/[\s,]+/);
    if (parts.length >= 2) {
      const monthKey = parts[0].toLowerCase();
      const day = parseInt(parts[1], 10) || 1;
      const monthIdx = months[monthKey] ?? 10;
      
      // If the month is Jan-May and today is Aug-Dec, the deadline is in the next calendar year
      let targetYear = currentYear;
      if (monthIdx < today.getMonth() && today.getMonth() >= 7) {
        targetYear = currentYear + 1;
      }
      return new Date(targetYear, monthIdx, day);
    }

    return new Date(currentYear, 10, 1);
  };

  // Compile all milestones: College deadlines + Custom milestones + Standard national deadlines
  const milestones: TimelineMilestone[] = useMemo(() => {
    const list: TimelineMilestone[] = [];

    // 1. Target colleges from profile
    (userProfile.targetColleges || []).forEach((col) => {
      const targetDate = parseDeadlineToDate(col.deadline);
      const diffTime = targetDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isPast = daysRemaining < 0;

      const totalChecklist = col.checklist ? col.checklist.length : 0;
      const completedChecklist = col.checklist ? col.checklist.filter((c) => c.completed).length : 0;

      list.push({
        id: `college-${col.id}`,
        title: col.name,
        type: 'college_deadline',
        dateStr: col.deadline,
        calculatedDate: targetDate,
        daysRemaining,
        isPast,
        category: col.category,
        round: col.round || 'Application Deadline',
        collegeId: col.id,
        status: col.status || 'in_progress',
        checklistTotal: totalChecklist,
        checklistCompleted: completedChecklist,
        description: col.notes || `${col.category.toUpperCase()} institution deadline for ${col.round || 'Admissions'}.`
      });
    });

    // 2. Custom User Milestones
    customMilestones.forEach((cm) => {
      const targetDate = parseDeadlineToDate(cm.date);
      const diffTime = targetDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isPast = daysRemaining < 0;

      list.push({
        id: `custom-${cm.id}`,
        title: cm.title,
        type: cm.type,
        dateStr: cm.date,
        calculatedDate: targetDate,
        daysRemaining,
        isPast,
        category: 'general',
        round: 'Action Item',
        status: cm.completed ? 'submitted' : 'in_progress',
        description: 'Personal application task & priority checklist checkpoint.',
        isCustom: true
      });
    });

    // 3. National standard admissions benchmark milestones
    const nationalBenchmarks: Array<{ title: string; dateStr: string; type: TimelineMilestone['type']; description: string }> = [
      {
        title: 'National Early Action / Early Decision (EA/ED) Deadlines',
        dateStr: 'Nov 1',
        type: 'college_deadline',
        description: 'Major cutoff for MIT, Stanford, Harvard REA, Yale, Princeton, and most Tier-1 Early applications.'
      },
      {
        title: 'University of California (UC) Application Final Cutoff',
        dateStr: 'Nov 30',
        type: 'college_deadline',
        description: 'Hard system cutoff for UC Berkeley, UCLA, UCSD, and all UC campuses. No extensions.'
      },
      {
        title: 'Regular Decision (RD) Major Submission Window',
        dateStr: 'Jan 1',
        type: 'college_deadline',
        description: 'Core Regular Decision deadline for Ivy League, Stanford, Duke, Northwestern, and Top 50.'
      },
      {
        title: 'Ivy Day & National Decision Release Week',
        dateStr: 'Mar 28',
        type: 'decision',
        description: 'Simultaneous 7:00 PM ET decision release across all 8 Ivy League universities.'
      },
      {
        title: 'National College Decision Day (Commitment Deposit)',
        dateStr: 'May 1',
        type: 'decision',
        description: 'Official deadline to accept admission offers and submit your enrollment deposit.'
      }
    ];

    nationalBenchmarks.forEach((bm, idx) => {
      // Only add if not already redundant with exact university date
      const targetDate = parseDeadlineToDate(bm.dateStr);
      const diffTime = targetDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      list.push({
        id: `benchmark-${idx}`,
        title: bm.title,
        type: bm.type,
        dateStr: bm.dateStr,
        calculatedDate: targetDate,
        daysRemaining,
        isPast: daysRemaining < 0,
        category: 'general',
        round: 'National Milestone',
        status: 'ready',
        description: bm.description
      });
    });

    // Sort chronologically by date
    return list.sort((a, b) => a.calculatedDate.getTime() - b.calculatedDate.getTime());
  }, [userProfile.targetColleges, customMilestones, today]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (filter === 'upcoming') return !m.isPast && m.status !== 'submitted' && m.status !== 'accepted';
      if (filter === 'early') {
        const d = m.dateStr.toLowerCase();
        return d.includes('oct') || d.includes('nov');
      }
      if (filter === 'regular') {
        const d = m.dateStr.toLowerCase();
        return d.includes('dec') || d.includes('jan') || d.includes('feb');
      }
      if (filter === 'submitted') {
        return m.status === 'submitted' || m.status === 'accepted';
      }
      return true;
    });
  }, [milestones, filter]);

  // Next immediate priority deadline
  const nextUrgentDeadline = useMemo(() => {
    return milestones.find((m) => !m.isPast && m.status !== 'submitted' && m.status !== 'accepted') || milestones[0];
  }, [milestones]);

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customDate.trim()) return;

    setCustomMilestones((prev) => [
      ...prev,
      {
        id: `cm-${Date.now()}`,
        title: customTitle.trim(),
        date: customDate.trim(),
        type: customType,
        completed: false
      }
    ]);

    setCustomTitle('');
    setCustomDate('');
    setIsAddingCustom(false);
  };

  const toggleCustomMilestone = (id: string) => {
    const rawId = id.replace('custom-', '');
    setCustomMilestones((prev) =>
      prev.map((cm) => (cm.id === rawId ? { ...cm, completed: !cm.completed } : cm))
    );
  };

  const getTypeIcon = (type: TimelineMilestone['type'], category?: string) => {
    if (type === 'decision') return 'celebration';
    if (type === 'financial') return 'payments';
    if (type === 'testing') return 'psychology_alt';
    if (type === 'essay') return 'edit_document';
    if (category === 'reach') return 'verified';
    return 'school';
  };

  const getUrgencyBadge = (days: number, status?: string) => {
    if (status === 'submitted' || status === 'accepted') {
      return {
        label: status === 'accepted' ? '🎉 Accepted' : '✓ Submitted',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      };
    }
    if (days < 0) {
      return {
        label: 'Passed',
        bg: 'bg-slate-700/50 text-slate-400 border-slate-600/30'
      };
    }
    if (days === 0) {
      return {
        label: '🔥 Due Today',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
      };
    }
    if (days <= 14) {
      return {
        label: `⚠️ ${days} Days Left`,
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
      };
    }
    if (days <= 45) {
      return {
        label: `⏳ ${days} Days Left`,
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    if (days <= 90) {
      return {
        label: `📅 ${days} Days Left`,
        bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      };
    }
    return {
      label: `In ${days} Days`,
      bg: 'bg-white/10 text-slate-300 border-white/15'
    };
  };

  return (
    <div className={`glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-gradient-to-br from-[#0e0e18] via-[#111122] to-[#0a0a12] shadow-[0_10px_35px_rgba(0,0,0,0.38)] flex flex-col gap-5 ${className}`}>
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[17px] md:text-[19px] font-bold text-white tracking-tight">
                College Application Timeline
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {milestones.length} Milestones
              </span>
            </div>
            <p className="text-[12.5px] text-slate-400">
              Real-time countdown relative to current date ({today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).
            </p>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interactive Timeline Track View"
            >
              <span className="material-symbols-outlined text-[14px]">timeline</span>
              <span>Track</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Upcoming Deadline Cards View"
            >
              <span className="material-symbols-outlined text-[14px]">grid_view</span>
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddingCustom(true)}
            className="glass-btn-secondary px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer hover:border-indigo-400/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Milestone</span>
          </button>

          <button
            onClick={() => onNavigate('colleges')}
            className="glass-btn-primary px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-500/20"
          >
            <span className="material-symbols-outlined text-[15px]">hub</span>
            <span>Colleges Hub</span>
          </button>
        </div>
      </div>

      {/* Next Priority Alert Banner */}
      {nextUrgentDeadline && (
        <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-indigo-300 text-[20px]">
                {getTypeIcon(nextUrgentDeadline.type, nextUrgentDeadline.category)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  Next Critical Milestone
                </span>
                <span className="text-[11px] text-slate-400">• {nextUrgentDeadline.dateStr}</span>
              </div>
              <h4 className="text-[14px] font-bold text-white">
                {nextUrgentDeadline.title} <span className="text-indigo-300 font-medium">({nextUrgentDeadline.round})</span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${getUrgencyBadge(nextUrgentDeadline.daysRemaining, nextUrgentDeadline.status).bg}`}>
              {getUrgencyBadge(nextUrgentDeadline.daysRemaining, nextUrgentDeadline.status).label}
            </span>
            {nextUrgentDeadline.collegeId ? (
              <button
                onClick={() => onNavigate('colleges')}
                className="px-3 py-1 glass-btn-secondary rounded-lg text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Requirements</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-[11.5px] scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Milestones ({milestones.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Action Required
          </button>
          <button
            onClick={() => setFilter('early')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'early'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Early Deadlines (Oct-Nov)
          </button>
          <button
            onClick={() => setFilter('regular')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'regular'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Regular Decision (Dec-Feb)
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'submitted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Submitted &amp; Completed
          </button>
        </div>
      </div>

      {/* Modal / Inline Form for Adding Custom Milestone */}
      <AnimatePresence>
        {isAddingCustom && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddCustomMilestone}
            className="p-4 rounded-xl bg-white/[0.04] border border-indigo-500/40 flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">add_task</span>
                Create Custom Milestone or Deadline
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-slate-400 hover:text-white material-symbols-outlined text-[18px]"
              >
                close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Milestone / Task Name
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Finalize Common App Essay with English Teacher"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-[13px] focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Target Deadline Date
                </label>
                <input
                  type="text"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  placeholder="e.g., Oct 15, Nov 01"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-[13px] focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 font-semibold">Category:</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="px-2 py-1 rounded-md bg-white/5 border border-white/15 text-[12px] text-slate-200 focus:outline-none"
                >
                  <option value="essay" className="bg-[#111122]">Essay &amp; Writing</option>
                  <option value="financial" className="bg-[#111122]">Financial Aid (FAFSA/CSS)</option>
                  <option value="testing" className="bg-[#111122]">Testing &amp; Scores</option>
                  <option value="college_deadline" className="bg-[#111122]">College Submission</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-1.5 rounded-lg text-[12px] font-bold"
                >
                  Save Milestone
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* TIMELINE TRACK VIEW */}
      {viewMode === 'timeline' && (
        <div className="relative pl-6 md:pl-8 border-l-2 border-indigo-500/25 space-y-5 my-2">
          {/* Today Indicator Line */}
          <div className="relative flex items-center gap-2 -ml-[31px] md:-ml-[39px] mb-6">
            <div className="w-4 h-4 rounded-full bg-indigo-400 border-4 border-[#0c0c14] shadow-[0_0_10px_rgba(129,140,248,0.9)] animate-pulse"></div>
            <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>Current Date: {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {filteredMilestones.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[13px]">
              No milestones found matching the selected filter.
            </div>
          ) : (
            filteredMilestones.map((item) => {
              const urgency = getUrgencyBadge(item.daysRemaining, item.status);
              const isSelected = selectedMilestoneId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`relative group p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] border-indigo-400/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedMilestoneId(isSelected ? null : item.id)}
                >
                  {/* Timeline Dot Node */}
                  <div
                    className={`absolute -left-[31px] md:-left-[39px] top-5 w-3.5 h-3.5 rounded-full border-2 border-[#0e0e18] shadow-sm transition-transform group-hover:scale-125 ${
                      item.status === 'submitted' || item.status === 'accepted'
                        ? 'bg-emerald-400'
                        : item.daysRemaining <= 14
                        ? 'bg-rose-400 animate-pulse'
                        : item.daysRemaining <= 45
                        ? 'bg-amber-400'
                        : 'bg-indigo-400'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        item.category === 'reach'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.category === 'target'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : item.category === 'safety'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {getTypeIcon(item.type, item.category)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[14.5px] font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {item.title}
                          </h4>
                          {item.round && (
                            <span className="text-[11.5px] text-slate-400 font-medium">
                              • {item.round}
                            </span>
                          )}
                          {item.category && item.category !== 'general' && (
                            <span className={`px-2 py-0.2 rounded-full text-[9.5px] font-extrabold uppercase ${
                              item.category === 'reach' ? 'bg-rose-500/20 text-rose-300' :
                              item.category === 'target' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {item.category}
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-slate-300 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[12.5px] font-bold text-white block">
                          {item.dateStr}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.calculatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border ${urgency.bg}`}>
                        {urgency.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2.5 text-[12px]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300">
                          <div>
                            <span className="font-semibold text-white">Milestone Scope:</span> {item.description}
                          </div>

                          {item.isCustom ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCustomMilestone(item.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {item.status === 'submitted' ? 'undo' : 'check'}
                              </span>
                              <span>{item.status === 'submitted' ? 'Mark Incomplete' : 'Mark Complete'}</span>
                            </button>
                          ) : item.collegeId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('colleges');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <span>Open College Workspace</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                          ) : null}
                        </div>

                        {item.checklistTotal !== undefined && item.checklistTotal > 0 && (
                          <div className="bg-white/5 p-2 rounded-lg flex items-center justify-between gap-3">
                            <span className="text-[11px] text-slate-400">
                              Application Checklist: <strong>{item.checklistCompleted} / {item.checklistTotal}</strong> requirements completed
                            </span>
                            <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-400 rounded-full"
                                style={{ width: `${(item.checklistCompleted! / item.checklistTotal) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* CARDS GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 my-2">
          {filteredMilestones.map((item) => {
            const urgency = getUrgencyBadge(item.daysRemaining, item.status);

            return (
              <div
                key={item.id}
                onClick={() => item.collegeId && onNavigate('colleges')}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  item.collegeId ? 'cursor-pointer hover:border-indigo-400/40 hover:bg-white/[0.06]' : ''
                } bg-white/[0.03] border-white/10`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-indigo-400">
                        {getTypeIcon(item.type, item.category)}
                      </span>
                      {item.round || 'Deadline'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${urgency.bg}`}>
                      {urgency.label}
                    </span>
                  </div>

                  <h4 className="text-[14.5px] font-bold text-white line-clamp-1 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11.5px]">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    <span>{item.dateStr}</span>
                  </div>
                  <span className="text-slate-400">
                    {item.calculatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
