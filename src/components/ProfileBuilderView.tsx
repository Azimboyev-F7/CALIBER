import React, { useState } from 'react';
import { ActiveScreen, ActivityItem, AwardItem, UserProfile } from '../types';
import { AICollegeRecommendationsCard } from './AICollegeRecommendationsCard';

interface ProfileBuilderViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onOpenAddActivity: () => void;
  onOpenAddAward: () => void;
  onDeleteActivity: (id: string) => void;
  onDeleteAward: (id: string) => void;
}

export const ProfileBuilderView: React.FC<ProfileBuilderViewProps> = ({
  userProfile,
  onUpdateProfile,
  onNavigate,
  onRunAnalysis,
  isAnalyzing,
  onOpenAddActivity,
  onOpenAddAward,
  onDeleteActivity,
  onDeleteAward
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  return (
    <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 text-[#f1f5f9]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#141424] border border-indigo-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fade-in backdrop-blur-xl">
          <span className="material-symbols-outlined text-indigo-400 text-[20px]">
            check_circle
          </span>
          <span className="text-[13px] font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-[16px] cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-[24px] md:text-[30px] font-extrabold text-white tracking-tight mb-1">
          Build Your Profile
        </h2>
        <p className="text-[13.5px] md:text-[14.5px] text-slate-400">
          Detail your academic journey and extracurricular impact to generate tailored admissions insights and university admission rates.
        </p>
      </div>

      {/* Bento Grid Layout for Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Academic Snapshot */}
        <div className="lg:col-span-5 space-y-5">
          <section className="glass-card rounded-2xl p-5 md:p-6 flex flex-col h-full shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-indigo-400 text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
              <h3 className="text-[17px] md:text-[19px] font-bold text-white">
                Academic Snapshot
              </h3>
            </div>

            <div className="space-y-3.5 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-300 mb-1">
                    GPA (Unweighted)
                  </label>
                  <input
                    type="text"
                    value={userProfile.unweightedGpa}
                    onChange={(e) => onUpdateProfile({ unweightedGpa: e.target.value })}
                    placeholder="e.g. 3.85"
                    className="input-minimal w-full px-3 py-1.5 text-[13.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-300 mb-1">
                    IELTS Score
                  </label>
                  <input
                    type="text"
                    value={userProfile.ieltsScore || ''}
                    onChange={(e) => onUpdateProfile({ ieltsScore: e.target.value })}
                    placeholder="e.g. 7.5"
                    className="input-minimal w-full px-3 py-1.5 text-[13.5px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-300 mb-1">
                    SAT Score
                  </label>
                  <input
                    type="text"
                    value={userProfile.satScore}
                    onChange={(e) => onUpdateProfile({ satScore: e.target.value })}
                    placeholder="e.g. 1520"
                    className="input-minimal w-full px-3 py-1.5 text-[13.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-300 mb-1">
                    AP/IB/Honors Classes
                  </label>
                  <input
                    type="number"
                    value={userProfile.apIbHonorsCount}
                    onChange={(e) => onUpdateProfile({ apIbHonorsCount: e.target.value })}
                    placeholder="Count"
                    className="input-minimal w-full px-3 py-1.5 text-[13.5px] font-medium"
                  />
                </div>
              </div>

              <hr className="border-white/10 my-3" />

              <div>
                <label className="block text-[12px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-indigo-400">public</span>
                  Preferred Country
                </label>
                <select
                  value={userProfile.preferredCountry || 'United States'}
                  onChange={(e) => onUpdateProfile({ preferredCountry: e.target.value })}
                  className="input-minimal w-full px-3 py-1.5 text-[13.5px] bg-[#0a0a0f] text-white cursor-pointer"
                >
                  <option className="bg-[#0f101c] text-slate-100" value="United States">United States (US)</option>
                  <option className="bg-[#0f101c] text-slate-100" value="United Kingdom">United Kingdom (UK)</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Canada">Canada</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Germany">Germany</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Australia">Australia</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Singapore">Singapore</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Europe (General)">Europe (General)</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Any / Global">Any / Global</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">payments</span>
                  Annual Budget for College
                </label>
                <select
                  value={userProfile.budgetPerYear || '$25,000 - $45,000 / yr'}
                  onChange={(e) => onUpdateProfile({ budgetPerYear: e.target.value })}
                  className="input-minimal w-full px-3 py-1.5 text-[13.5px] bg-[#0a0a0f] text-white cursor-pointer"
                >
                  <option className="bg-[#0f101c] text-slate-100" value="Full Financial Aid Needed">Full Financial Aid / Scholarship Needed</option>
                  <option className="bg-[#0f101c] text-slate-100" value="Under $10,000 / yr">Under $10,000 / year</option>
                  <option className="bg-[#0f101c] text-slate-100" value="$10,000 - $25,000 / yr">$10,000 - $25,000 / year</option>
                  <option className="bg-[#0f101c] text-slate-100" value="$25,000 - $45,000 / yr">$25,000 - $45,000 / year</option>
                  <option className="bg-[#0f101c] text-slate-100" value="$45,000+ / yr">$45,000+ / year (Flexible)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[12px] font-medium text-slate-300 mb-1">
                    Intended Major
                  </label>
                  <select
                    value={userProfile.intendedMajor}
                    onChange={(e) => onUpdateProfile({ intendedMajor: e.target.value })}
                    className="input-minimal w-full px-3 py-1.5 text-[13.5px] bg-[#0a0a0f] text-white cursor-pointer"
                  >
                    <option className="bg-[#0f101c] text-slate-100" value="cs">Computer Science</option>
                    <option className="bg-[#0f101c] text-slate-100" value="engineering">Engineering</option>
                    <option className="bg-[#0f101c] text-slate-100" value="business">Business / Finance</option>
                    <option className="bg-[#0f101c] text-slate-100" value="biology">Biology / Pre-Med</option>
                    <option className="bg-[#0f101c] text-slate-100" value="humanities">Humanities</option>
                    <option className="bg-[#0f101c] text-slate-100" value="undecided">Undecided</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-slate-300 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    value={userProfile.graduationYear}
                    onChange={(e) => onUpdateProfile({ graduationYear: e.target.value })}
                    placeholder="YYYY"
                    className="input-minimal w-full px-3 py-1.5 text-[13.5px] font-medium"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Activities & Awards */}
        <div className="lg:col-span-7 space-y-5 flex flex-col">
          {/* Activities Section */}
          <section className="glass-card rounded-2xl p-5 md:p-6 flex-1 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-indigo-400 text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  directions_run
                </span>
                <h3 className="text-[17px] md:text-[19px] font-bold text-white">
                  Activities
                </h3>
              </div>
              
              <button
                onClick={onOpenAddActivity}
                className="flex items-center gap-1 glass-btn-secondary px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Add Activity
              </button>
            </div>

            <div className="space-y-3">
              {userProfile.activities.length === 0 ? (
                <div className="p-6 border border-dashed border-white/15 rounded-xl text-center text-slate-400 text-[13px]">
                  No activities added yet. Click "+ Add Activity" to log your leadership roles.
                </div>
              ) : (
                userProfile.activities.map((activity) => {
                  const barColorClass =
                    activity.accentColor === 'tertiary'
                      ? 'bg-amber-400'
                      : activity.accentColor === 'secondary'
                      ? 'bg-slate-300'
                      : 'bg-indigo-400';

                  return (
                    <div
                      key={activity.id}
                      className="p-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all bg-white/[0.04] backdrop-blur-md group relative overflow-hidden"
                    >
                      {/* Left color bar */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${barColorClass}`}></div>

                      <div className="flex justify-between items-start mb-1 pl-2.5">
                        <div>
                          <h4 className="text-[15px] font-bold text-white">
                            {activity.title}
                          </h4>
                          <p className="text-[13px] text-slate-300">{activity.role}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full glass-pill text-slate-200 text-[10.5px] font-semibold">
                            {activity.category}
                          </span>
                          <button
                            onClick={() => onDeleteActivity(activity.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-0.5 transition-all cursor-pointer"
                            title="Remove activity"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 mt-2 pl-2.5">
                        <div className="flex items-center gap-1 text-slate-400">
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          <span className="text-[11.5px] font-medium">{activity.hoursPerWeek} hrs/wk</span>
                        </div>

                        {activity.isLeadership && (
                          <div className="flex items-center gap-1 text-indigo-400">
                            <span
                              className="material-symbols-outlined text-[15px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span className="text-[11.5px] font-semibold">Leadership</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Awards & Honors Section */}
          <section className="glass-card rounded-2xl p-5 md:p-6 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-amber-400 text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  emoji_events
                </span>
                <h3 className="text-[17px] md:text-[19px] font-bold text-white">
                  Awards &amp; Honors
                </h3>
              </div>
              
              <button
                onClick={onOpenAddAward}
                className="flex items-center gap-1 glass-btn-secondary px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Add Award
              </button>
            </div>

            <ul className="divide-y divide-white/10 border-t border-white/10">
              {userProfile.awards.length === 0 ? (
                <li className="py-5 text-center text-slate-400 text-[13px]">
                  No awards added yet. Add scholastic and extracurricular recognitions.
                </li>
              ) : (
                userProfile.awards.map((award) => {
                  const isNational = award.level === 'National' || award.level === 'International';
                  const badgeStyle = isNational
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

                  return (
                    <li
                      key={award.id}
                      className="flex items-center justify-between py-2.5 group hover:bg-white/[0.04] px-2.5 rounded-lg transition-colors"
                    >
                      <span className="text-[13.5px] font-medium text-white">
                        {award.title}
                      </span>
                      
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${badgeStyle}`}
                        >
                          {award.level}
                        </span>
                        <button
                          onClick={() => onDeleteAward(award.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-0.5 transition-all cursor-pointer"
                          title="Remove award"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* AI University Recommendations & Personalized Admissions Rates Hub */}
      <AICollegeRecommendationsCard
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onShowToast={showToast}
      />

      {/* Primary Action Button Bar */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="glass-btn-secondary px-5 py-2.5 rounded-xl text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer order-2 sm:order-1"
        >
          <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="glass-btn-primary px-6 py-2.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 order-1 sm:order-2 shadow-lg shadow-indigo-500/25"
        >
          <span
            className={`material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform ${
              isAnalyzing ? 'animate-spin' : ''
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isAnalyzing ? 'sync' : 'magic_button'}
          </span>
          <span>{isAnalyzing ? 'Evaluating Profile with AI...' : 'Analyze Full Profile'}</span>
        </button>
      </div>
    </div>
  );
};
