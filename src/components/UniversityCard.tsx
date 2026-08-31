import React, { useState } from 'react';
import { CollegeTarget, CollegeCategory, CollegeApplicationStatus } from '../types';
import { getUniversityInfoByName } from '../data/universitiesDatabase';

interface UniversityCardProps {
  college: CollegeTarget;
  onOpenDetails: (college: CollegeTarget) => void;
  onCategoryChange: (collegeId: string, category: CollegeCategory) => void;
  onStatusChange: (collegeId: string, status: CollegeApplicationStatus) => void;
  onDelete: (collegeId: string, name: string) => void;
}

const STATUS_CONFIG: Record<
  CollegeApplicationStatus,
  { label: string; icon: string; badgeClass: string; dotColor: string }
> = {
  not_started: {
    label: 'Not Started',
    icon: 'radio_button_unchecked',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotColor: 'bg-slate-400'
  },
  in_progress: {
    label: 'Drafting Essays',
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

export const UniversityCard: React.FC<UniversityCardProps> = ({
  college,
  onOpenDetails,
  onCategoryChange,
  onStatusChange,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const currentStatus = college.status || 'not_started';
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.not_started;
  const checklist = college.checklist || [];
  const completedTasks = checklist.filter((i) => i.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedTasks / checklist.length) * 100) : 0;

  const isReach = college.category === 'reach';
  const isTarget = college.category === 'target';
  const isSafety = college.category === 'safety';

  const tierBadge = isReach
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : isTarget
    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  const borderGlow = isReach
    ? 'hover:border-rose-500/40'
    : isTarget
    ? 'hover:border-indigo-500/40'
    : 'hover:border-emerald-500/40';

  const dbInfo = getUniversityInfoByName(college.name);

  return (
    <div
      className={`glass-card rounded-2xl p-4 md:p-5 border border-white/10 ${borderGlow} transition-all duration-300 flex flex-col justify-between space-y-4 bg-gradient-to-br from-white/[0.03] to-transparent shadow-lg group relative`}
    >
      {/* Top Row: Name, Location, and Tier Badge */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:border-indigo-400/50 transition-colors mt-0.5">
              <span className="material-symbols-outlined text-[22px]">
                account_balance
              </span>
            </div>
            <div className="min-w-0">
              <h4
                onClick={() => onOpenDetails(college)}
                className="text-[15.5px] md:text-[16.5px] font-bold text-white tracking-tight truncate hover:text-indigo-300 transition-colors cursor-pointer"
                title={college.name}
              >
                {college.name}
              </h4>
              <div className="text-[11.5px] text-slate-400 truncate mt-0.5">
                {college.location}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${tierBadge}`}>
              {college.category}
            </span>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="More options"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 bg-[#101018] border border-white/15 rounded-xl shadow-2xl p-1.5 z-40 animate-fade-in text-[12px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Change Tier
                  </div>
                  <button
                    onClick={() => {
                      onCategoryChange(college.id, 'reach');
                      setShowMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>Set as Reach</span>
                  </button>
                  <button
                    onClick={() => {
                      onCategoryChange(college.id, 'target');
                      setShowMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>Set as Target</span>
                  </button>
                  <button
                    onClick={() => {
                      onCategoryChange(college.id, 'safety');
                      setShowMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Set as Safety</span>
                  </button>

                  <div className="border-t border-white/10 my-1"></div>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(college.id, college.name);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>Delete School</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/5 text-[11.5px]">
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Admit Rate</span>
            <span className="text-white font-extrabold text-[13px]">{college.acceptanceRate}</span>
          </div>

          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Deadline</span>
            <span className="text-amber-300 font-extrabold text-[13px] truncate block">
              {college.deadline}
            </span>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        {checklist.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[13px] text-indigo-400">checklist</span>
                Checklist: {completedTasks}/{checklist.length} done
              </span>
              <span className="text-white font-bold">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions Row: Status Selector & View Info Button */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
        {/* Status Dropdown */}
        <div className="relative flex-1">
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(college.id, e.target.value as CollegeApplicationStatus)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer appearance-none pr-6 ${statusInfo.badgeClass} bg-[#0b0b12]`}
          >
            <option value="not_started">⚪ Not Started</option>
            <option value="in_progress">🟡 Drafting Essays</option>
            <option value="ready">🔵 Ready for Review</option>
            <option value="submitted">🟢 Submitted 🎉</option>
            <option value="accepted">🟣 Admitted 🎓</option>
            <option value="deferred">🟠 Deferred</option>
            <option value="waitlisted">⏸️ Waitlisted</option>
            <option value="rejected">🔴 Denied</option>
          </select>
          <span className="material-symbols-outlined text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            arrow_drop_down
          </span>
        </div>

        {/* View Info & Milestones Modal Button */}
        <button
          onClick={() => onOpenDetails(college)}
          className="glass-btn-secondary px-3 py-1.5 rounded-xl text-[11.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 hover:border-indigo-400/50 hover:text-white"
        >
          <span className="material-symbols-outlined text-[15px] text-indigo-400">visibility</span>
          <span>Details</span>
        </button>
      </div>
    </div>
  );
};
