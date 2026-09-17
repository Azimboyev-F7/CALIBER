import React, { useState } from 'react';
import { ActiveScreen, ActivityItem, UserProfile } from '../types';
import { getApiHeaders } from '../utils/apiClient';

interface ActivitiesViewProps {
  userProfile: UserProfile;
  onUpdateActivities: (activities: ActivityItem[]) => void;
  onOpenAddActivity: () => void;
  onNavigate: (screen: ActiveScreen) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  userProfile,
  onUpdateActivities,
  onOpenAddActivity,
  onNavigate
}) => {
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const totalHours = userProfile.activities.reduce((acc, curr) => acc + (curr.hoursPerWeek || 0), 0);
  const leadershipCount = userProfile.activities.filter(a => a.isLeadership).length;

  const handleOpenOptimizer = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setDraftDescription(activity.description || '');
    setAiSuggestion(null);
  };

  const handleRunAiOptimize = async () => {
    if (!selectedActivity) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize-activity', {
        method: 'POST',
        headers: await getApiHeaders(),
        body: JSON.stringify({
          activityTitle: selectedActivity.title,
          role: selectedActivity.role,
          roughDescription: draftDescription
        })
      });
      if (!res.ok) throw new Error(`Optimizer request failed (${res.status})`);
      const data = await res.json();
      if (!data.optimizedText) throw new Error('Optimizer returned no description');
      setAiSuggestion(String(data.optimizedText).slice(0, 150));
    } catch (e) {
      const source = draftDescription.trim() || [selectedActivity.role, selectedActivity.title].filter(Boolean).join(' — ');
      setAiSuggestion(source.slice(0, 150));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!selectedActivity || !aiSuggestion) return;
    const updated = userProfile.activities.map(a => 
      a.id === selectedActivity.id ? { ...a, description: aiSuggestion } : a
    );
    onUpdateActivities(updated);
    setSelectedActivity(null);
    setAiSuggestion(null);
  };

  const handleDelete = (id: string) => {
    onUpdateActivities(userProfile.activities.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 text-[#f1f5f9]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-white tracking-tight mb-1.5">
            My Activities &amp; Narrative Spike
          </h2>
          <p className="text-[13.5px] md:text-[14.5px] text-slate-300 max-w-xl leading-relaxed">
            Manage your extracurricular portfolio, calculate weekly time commitments, and use AI to craft punchy, 150-character descriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddActivity}
            className="px-4 py-2 glass-btn-primary font-bold rounded-xl text-[12px] flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Activity
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">timer</span>
          </div>
          <div>
            <div className="text-[20px] font-bold text-white">{totalHours} hrs/week</div>
            <div className="text-[11px] text-slate-400">Total Extracurricular Load</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400 text-[20px]">military_tech</span>
          </div>
          <div>
            <div className="text-[20px] font-bold text-white">{leadershipCount} Roles</div>
            <div className="text-[11px] text-slate-400">Officer / Captain Positions</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-sky-400 text-[20px]">view_list</span>
          </div>
          <div>
            <div className="text-[20px] font-bold text-white">{userProfile.activities.length} / 10</div>
            <div className="text-[11px] text-slate-400">Common App Slots Used</div>
          </div>
        </div>
      </div>

      {/* Activity Cards List */}
      <div className="space-y-3.5">
        {userProfile.activities.map((act, index) => {
          const tierColors: Record<number, { label: string; style: string }> = {
            1: { label: 'Tier 1 (National/Top)', style: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
            2: { label: 'Tier 2 (State/Leadership)', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
            3: { label: 'Tier 3 (School/Local)', style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
            4: { label: 'Tier 4 (General)', style: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
          };

          return (
            <div
              key={act.id}
              className="glass-card glass-card-hover rounded-2xl p-4 md:p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <span className="text-[14px] font-mono text-slate-500 pt-0.5">
                  #{index + 1}
                </span>

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-bold text-white">{act.title}</h3>
                    <span className="text-[13px] text-slate-300">({act.role})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium glass-pill text-slate-200">
                      {act.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${tierColors[act.tier]?.style}`}>
                      {tierColors[act.tier]?.label}
                    </span>
                    {act.isLeadership && (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        Leadership
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    {act.description || 'No description added yet. Use the AI Optimizer below to format for Common App.'}
                  </p>

                  <div className="flex items-center gap-3 text-[11.5px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      {act.hoursPerWeek} hours/week
                    </span>
                    <span>•</span>
                    <span>~{act.hoursPerWeek * 36} hours/school year</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleOpenOptimizer(act)}
                  className="px-3 py-1.5 glass-btn-secondary rounded-lg text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                  AI Optimize
                </button>

                <button
                  onClick={() => handleDelete(act.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Delete activity"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Optimizer Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-5 md:p-6 space-y-4 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[20px]">auto_fix_high</span>
                <h3 className="text-[16px] font-bold text-white">
                  Optimize for Common App: {selectedActivity.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[12px] text-slate-300 font-medium">
                Current Activity Notes / Draft (Role: {selectedActivity.role}):
              </label>
              <textarea
                rows={3}
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="What did you achieve? Any numbers, leadership moments, or team wins?"
                className="input-minimal w-full p-3 text-[13px]"
              />
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Common App standard limit: 150 characters</span>
                <span className={draftDescription.length > 150 ? 'text-amber-400 font-semibold' : ''}>
                  {draftDescription.length} chars
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunAiOptimize}
                disabled={isOptimizing}
                className="px-4 py-2 glass-btn-primary font-bold rounded-xl text-[12px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[15px] ${isOptimizing ? 'animate-spin' : ''}`}>
                  {isOptimizing ? 'sync' : 'auto_awesome'}
                </span>
                {isOptimizing ? 'Generating...' : 'Generate High-Impact Bullet'}
              </button>
            </div>

            {aiSuggestion && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 space-y-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    AI Recommended Common App Description
                  </span>
                  <span className="text-[10.5px] text-slate-400">
                    {aiSuggestion.length} chars
                  </span>
                </div>
                <p className="text-[13px] text-slate-200 font-medium leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/10">
                  {aiSuggestion}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAiSuggestion(null)}
                    className="px-3 py-1 text-[11.5px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleApplyAiSuggestion}
                    className="px-3.5 py-1.5 glass-btn-primary text-[11.5px] font-bold rounded-lg cursor-pointer"
                  >
                    Apply to Activity
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
