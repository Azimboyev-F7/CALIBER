import React, { useState } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { AICollegeRecommendationsCard } from './AICollegeRecommendationsCard';

interface ProfileBuilderViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onRunAnalysis?: () => void;
  isAnalyzing?: boolean;
  hasUnsavedChanges?: boolean;
  onOpenAddActivity: () => void;
  onOpenAddAward: () => void;
  onDeleteActivity?: (id: string) => void;
  onDeleteAward?: (id: string) => void;
}

export const ProfileBuilderView: React.FC<ProfileBuilderViewProps> = ({
  userProfile,
  onUpdateProfile,
  onRunAnalysis,
  isAnalyzing,
  hasUnsavedChanges,
  onOpenAddActivity,
  onOpenAddAward,
  onDeleteActivity,
  onDeleteAward
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFieldChange = (field: keyof UserProfile, value: any) => {
    onUpdateProfile({ [field]: value });
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8 text-[#f1f5f9]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 glass-modal text-white font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-up text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Subtitle + Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] md:text-[30px] font-black text-white tracking-tight">
              Build Your Profile
            </h1>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-[13.5px] md:text-[14px] text-slate-400">
            Detail your academic journey and extracurricular impact to generate tailored admissions insights and university admission rates.
          </p>
        </div>

        {onRunAnalysis && (
          <button
            id="btn-analyze-full-profile"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="self-start sm:self-auto shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:via-purple-500 hover:to-indigo-400 text-white font-bold text-[13.5px] shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:shadow-[0_0_35px_rgba(99,102,241,0.65)] flex items-center gap-2.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 active:scale-[0.98]"
          >
            {isAnalyzing ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Evaluating Profile...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[19px] text-indigo-200">auto_awesome</span>
                <span>Analyze Full Profile</span>
                <span className="material-symbols-outlined text-[18px] text-white/70">arrow_forward</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Top 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Academic Snapshot (Span 5) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0c0c14] border border-white/10 p-5 md:p-6 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="flex items-center gap-2 text-white font-bold text-[16px] pb-1">
            <span className="text-indigo-400 text-[20px]">🎓</span>
            <span>Academic Snapshot</span>
          </div>

          {/* Row 1: GPA (Unweighted) & IELTS Score */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5">
                GPA (Unweighted)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={userProfile.unweightedGpa || ''}
                onChange={(e) => handleFieldChange('unweightedGpa', parseFloat(e.target.value) || 0)}
                placeholder="3.85"
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5">
                IELTS Score
              </label>
              <input
                type="text"
                value={userProfile.ieltsScore || ''}
                onChange={(e) => handleFieldChange('ieltsScore', e.target.value)}
                placeholder="7.5"
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: SAT Score & AP/IB/Honors Classes */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5">
                SAT Score
              </label>
              <input
                type="number"
                step="10"
                min="400"
                max="1600"
                value={userProfile.satScore || ''}
                onChange={(e) => handleFieldChange('satScore', parseInt(e.target.value, 10) || 0)}
                placeholder="1520"
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5">
                AP/IB/Honors Classes
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={userProfile.apIbHonorsCount ?? 10}
                onChange={(e) => handleFieldChange('apIbHonorsCount', parseInt(e.target.value, 10) || 0)}
                placeholder="10"
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Preferred Country */}
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>🌍</span>
              <span>Preferred Country</span>
            </label>
            <select
              value={userProfile.preferredCountry || 'United States (US)'}
              onChange={(e) => handleFieldChange('preferredCountry', e.target.value)}
              className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="United States (US)">United States (US)</option>
              <option value="United Kingdom (UK)">United Kingdom (UK)</option>
              <option value="Canada (CA)">Canada (CA)</option>
              <option value="Australia / NZ">Australia / NZ</option>
              <option value="Europe / Singapore">Europe / Singapore</option>
            </select>
          </div>

          {/* Row 4: Annual Budget for College */}
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>💵</span>
              <span>Annual Budget for College</span>
            </label>
            <select
              value={userProfile.budgetPerYear || '$25,000 - $45,000 / year'}
              onChange={(e) => handleFieldChange('budgetPerYear', e.target.value)}
              className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="Full Need / $0 - $10,000 / year">Full Need / $0 - $10,000 / year</option>
              <option value="$10,000 - $25,000 / year">$10,000 - $25,000 / year</option>
              <option value="$25,000 - $45,000 / year">$25,000 - $45,000 / year</option>
              <option value="$45,000 - $65,000 / year">$45,000 - $65,000 / year</option>
              <option value="$65,000+ / Full Pay">$65,000+ / Full Pay</option>
            </select>
          </div>

          {/* Row 5: Intended Major & Graduation Year */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5">
                Intended Major
              </label>
              <select
                value={userProfile.intendedMajor}
                onChange={(e) => handleFieldChange('intendedMajor', e.target.value)}
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Robotics & AI Engineering">Robotics &amp; AI Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Biomedical Engineering">Biomedical Engineering</option>
                <option value="Data Science & Mathematics">Data Science &amp; Mathematics</option>
                <option value="Economics & Finance">Economics &amp; Finance</option>
                <option value="Pre-Med / Biology">Pre-Med / Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-slate-300 mb-1.5">
                Graduation Year
              </label>
              <input
                type="text"
                value={userProfile.graduationYear}
                onChange={(e) => handleFieldChange('graduationYear', e.target.value)}
                placeholder="2026"
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Activities (Top) + Awards (Bottom) (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Activities Container */}
          <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-5 md:p-6 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 text-white font-bold text-[16px]">
                <span className="text-blue-400 text-[18px]">🏃</span>
                <span>Activities</span>
              </div>
              <button
                onClick={onOpenAddActivity}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-[12px] flex items-center gap-1 cursor-pointer transition-all border border-white/10"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Add Activity</span>
              </button>
            </div>

            {/* Activities List */}
            <div className="space-y-3">
              {userProfile.activities.length === 0 ? (
                <p className="text-[12.5px] text-slate-400 italic text-center py-4">
                  No activities added yet. Click &quot;+ Add Activity&quot; to build your portfolio.
                </p>
              ) : (
                userProfile.activities.map((act, idx) => {
                  // Border color accents matching user's original design
                  const borderAccent =
                    idx === 0
                      ? 'border-l-[4px] border-l-amber-500'
                      : idx === 1
                      ? 'border-l-[4px] border-l-cyan-500'
                      : idx === 2
                      ? 'border-l-[4px] border-l-indigo-500'
                      : 'border-l-[4px] border-l-slate-600';

                  return (
                    <div
                      key={act.id}
                      className={`p-3.5 rounded-xl bg-[#13131f] border border-white/10 hover:border-white/20 transition-all ${borderAccent}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-[14px] font-bold text-white">
                            {act.title}
                          </h4>
                          <p className="text-[12px] text-slate-300 mt-0.5">
                            {act.role}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-white/10 text-slate-300 border border-white/10">
                            {act.category || 'Extracurricular'}
                          </span>
                          {onDeleteActivity && (
                            <button
                              onClick={() => onDeleteActivity(act.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="Delete activity"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2.5 text-[11.5px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
                          {act.hoursPerWeek} hrs/wk
                        </span>
                        {act.isLeadership && (
                          <span className="text-indigo-400 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            Leadership
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Awards & Honors Container */}
          <div className="rounded-2xl bg-[#0c0c14] border border-white/10 p-5 md:p-6 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 text-white font-bold text-[16px]">
                <span className="text-amber-400 text-[18px]">🏆</span>
                <span>Awards &amp; Honors</span>
              </div>
              <button
                onClick={onOpenAddAward}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-[12px] flex items-center gap-1 cursor-pointer transition-all border border-white/10"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Add Award</span>
              </button>
            </div>

            {/* Awards List */}
            <div className="space-y-2.5">
              {userProfile.awards.length === 0 ? (
                <p className="text-[12.5px] text-slate-400 italic text-center py-3">
                  No honors or recognitions added yet.
                </p>
              ) : (
                userProfile.awards.map((award) => {
                  const isNational =
                    award.level?.toLowerCase() === 'national' ||
                    award.level?.toLowerCase() === 'international';

                  return (
                    <div
                      key={award.id}
                      className="p-3 rounded-xl bg-[#13131f] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                    >
                      <span className="font-semibold text-white text-[13px]">
                        {award.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            isNational
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                              : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/40'
                          }`}
                        >
                          {award.level}
                        </span>
                        {onDeleteAward && (
                          <button
                            onClick={() => onDeleteAward(award.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            title="Delete award"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Width AI University Recommendations & Estimated Admission Rates */}
      <AICollegeRecommendationsCard
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onShowToast={showToast}
      />

      {/* Bottom Full Evaluation Bar */}
      {onRunAnalysis && (
        <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-[#0c0c14] border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[22px]">rocket_launch</span>
              <h3 className="text-[17px] font-bold text-white">
                Ready for Full Holistic Evaluation?
              </h3>
            </div>
            <p className="text-[13px] text-slate-300 max-w-xl">
              Calculate your overall Admissions Tier, Narrative &amp; Spike Rating, tailored SWOT breakdown, and 6-month actionable roadmap.
            </p>
          </div>

          <button
            id="btn-analyze-full-profile-bottom"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:via-purple-500 hover:to-indigo-400 text-white font-bold text-[14px] shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.7)] flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 active:scale-[0.98] shrink-0"
          >
            {isAnalyzing ? (
              <>
                <span className="material-symbols-outlined text-[19px] animate-spin">progress_activity</span>
                <span>Evaluating Profile...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px] text-indigo-200">auto_awesome</span>
                <span>Analyze Full Profile &amp; Generate Roadmap</span>
                <span className="material-symbols-outlined text-[19px] text-white/70">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
