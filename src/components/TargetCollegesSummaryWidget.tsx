import React from 'react';
import { ActiveScreen, UserProfile, CollegeTarget } from '../types';

interface TargetCollegesSummaryWidgetProps {
  userProfile: UserProfile;
  onNavigate: (screen: ActiveScreen) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onShowToast?: (msg: string) => void;
}

export const TargetCollegesSummaryWidget: React.FC<TargetCollegesSummaryWidgetProps> = ({
  userProfile,
  onNavigate,
  onUpdateProfile,
  onShowToast
}) => {
  const colleges = userProfile.targetColleges || [];

  const reaches = colleges.filter((c) => c.category === 'reach');
  const targets = colleges.filter((c) => c.category === 'target');
  const safeties = colleges.filter((c) => c.category === 'safety');

  const submittedOrAccepted = colleges.filter(
    (c) => c.status === 'submitted' || c.status === 'accepted'
  );
  const inProgress = colleges.filter(
    (c) => c.status === 'in_progress' || c.status === 'ready'
  );

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/15 bg-gradient-to-br from-indigo-950/30 via-[#101018] to-[#0a0a0f] shadow-xl space-y-4">
      {/* Header with Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-400 text-[22px]">
              school
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] md:text-[19px] font-bold text-white tracking-tight">
                Target Universities List
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {colleges.length} Saved
              </span>
            </div>
            <p className="text-[12.5px] text-slate-400">
              Your college application portfolio, deadlines, and milestone tracker.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('colleges')}
            className="glass-btn-primary px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Add University</span>
          </button>
          <button
            onClick={() => onNavigate('colleges')}
            className="glass-btn-secondary px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Manage Hub</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
              Reach Schools
            </div>
            <div className="text-[18px] font-extrabold text-white mt-0.5">
              {reaches.length}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"></span>
        </div>

        <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Target Schools
            </div>
            <div className="text-[18px] font-extrabold text-white mt-0.5">
              {targets.length}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"></span>
        </div>

        <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Safety Schools
            </div>
            <div className="text-[18px] font-extrabold text-white mt-0.5">
              {safeties.length}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
        </div>

        <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Submitted / Ready
            </div>
            <div className="text-[18px] font-extrabold text-white mt-0.5">
              {submittedOrAccepted.length + inProgress.length} / {colleges.length}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
        </div>
      </div>

      {/* Target Schools Mini Grid / Preview */}
      {colleges.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-white/20 bg-white/[0.01] text-center space-y-3">
          <span className="material-symbols-outlined text-[36px] text-slate-500">
            domain_add
          </span>
          <div>
            <h4 className="text-[15px] font-bold text-white">No Target Universities Added Yet</h4>
            <p className="text-[12.5px] text-slate-400 max-w-md mx-auto mt-0.5">
              Build your college list with MIT, Harvard, Stanford, UC Berkeley, or search Top 50 universities.
            </p>
          </div>
          <button
            onClick={() => onNavigate('colleges')}
            className="glass-btn-primary px-4 py-2 rounded-xl text-[12.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Add Target Universities
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11.5px] font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Saved Universities</span>
            <span>Category &amp; Deadline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {colleges.slice(0, 6).map((college) => {
              const categoryClasses =
                college.category === 'reach'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : college.category === 'target'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

              const statusLabel =
                college.status === 'submitted'
                  ? 'Submitted'
                  : college.status === 'accepted'
                  ? 'Accepted 🎉'
                  : college.status === 'in_progress'
                  ? 'In Progress'
                  : college.status === 'ready'
                  ? 'Ready'
                  : 'Not Started';

              return (
                <div
                  key={college.id}
                  onClick={() => onNavigate('colleges')}
                  className="p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/10 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:border-indigo-400 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        account_balance
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {college.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {college.location} • Admit Rate: <span className="text-slate-200 font-semibold">{college.acceptanceRate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${categoryClasses}`}>
                        {college.category}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-1">
                      Due: <span className="text-white font-medium">{college.deadline}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {colleges.length > 6 && (
            <div className="text-center pt-1">
              <button
                onClick={() => onNavigate('colleges')}
                className="text-[12px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                + View all {colleges.length} universities in your list →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
