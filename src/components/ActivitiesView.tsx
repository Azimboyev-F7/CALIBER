import React, { useState } from 'react';
import { ActiveScreen, ActivityItem, UserProfile } from '../types';
import { getApiHeaders } from '../utils/apiClient';

interface ActivitiesViewProps {
  userProfile: UserProfile;
  onUpdateActivities: (activities: ActivityItem[]) => void;
  onOpenAddActivity: () => void;
  onNavigate: (screen: ActiveScreen) => void;
}

// Evaluates Common App description quality based on Ivy admissions criteria
function evaluateActivityImpact(desc: string) {
  if (!desc || desc.trim().length === 0) {
    return {
      score: 40,
      label: 'Draft needed',
      badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
      tip: 'Draft 150-char description with active verbs & metrics',
      hasNumbers: false,
      hasVerbs: false,
    };
  }

  const text = desc.toLowerCase();
  const hasNumbers = /\d+|\$|%|\b(k|m)\b|hundred|thousand|users|members|raised/i.test(text);
  const actionVerbPattern = /\b(founded|spearheaded|architected|built|led|organized|published|directed|designed|developed|launched|engineered|managed|coordinated|researched|pioneered|scaled|co-founded|raised|mentored)\b/i;
  const hasVerbs = actionVerbPattern.test(text);
  const length = desc.length;

  let score = 55;
  if (hasVerbs) score += 20;
  if (hasNumbers) score += 20;
  if (length >= 100 && length <= 150) score += 5;
  if (length > 150) score -= 15;

  score = Math.min(98, Math.max(40, score));

  if (score >= 90) {
    return {
      score,
      label: 'Elite Impact',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      tip: 'Strong action verbs and quantifiable scale',
      hasNumbers,
      hasVerbs,
    };
  }
  if (score >= 75) {
    return {
      score,
      label: 'Solid Impact',
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      tip: hasNumbers ? 'Add more active leadership verbs' : 'Add metrics (e.g. $ raised, users, team size)',
      hasNumbers,
      hasVerbs,
    };
  }
  return {
    score,
    label: 'Needs Metrics',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    tip: 'Add numbers, measurable outcomes, or active verbs',
    hasNumbers,
    hasVerbs,
  };
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  userProfile,
  onUpdateActivities,
  onOpenAddActivity,
  onNavigate: _onNavigate
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'common_app_preview'>('cards');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const totalHours = userProfile.activities.reduce((acc, curr) => acc + (curr.hoursPerWeek || 0), 0);
  const leadershipCount = userProfile.activities.filter((a) => a.isLeadership).length;
  const tier1Or2Count = userProfile.activities.filter((a) => a.tier <= 2).length;

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
    } catch (_e) {
      const source = draftDescription.trim() || [selectedActivity.role, selectedActivity.title].filter(Boolean).join(' — ');
      setAiSuggestion(source.slice(0, 150));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!selectedActivity || !aiSuggestion) return;
    const updated = userProfile.activities.map((a) =>
      a.id === selectedActivity.id ? { ...a, description: aiSuggestion } : a
    );
    onUpdateActivities(updated);
    setSelectedActivity(null);
    setAiSuggestion(null);
  };

  const handleDelete = (id: string) => {
    onUpdateActivities(userProfile.activities.filter((a) => a.id !== id));
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= userProfile.activities.length) return;
    const items = [...userProfile.activities];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    onUpdateActivities(items);
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 text-[#f1f5f9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Common App Activity Section
            </span>
            <span className="text-[12px] text-slate-400">
              10-Slot Portfolio &amp; Narrative Builder
            </span>
          </div>
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-400 text-[32px]">history_edu</span>
            My Activities &amp; Narrative Spike
          </h2>
          <p className="text-[13.5px] text-slate-300 max-w-xl leading-relaxed">
            Manage your extracurricular portfolio, calculate weekly time commitments, and use AI to craft punchy, 150-character descriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAddActivity}
            className="px-4 py-2.5 glass-btn-primary font-bold rounded-xl text-[12.5px] flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            Add Activity
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">timer</span>
          </div>
          <div>
            <div className="text-[19px] font-bold text-white font-mono">{totalHours} hrs/wk</div>
            <div className="text-[11px] text-slate-400">Weekly Extracurricular Load</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-purple-400 text-[20px]">military_tech</span>
          </div>
          <div>
            <div className="text-[19px] font-bold text-white font-mono">{leadershipCount} Roles</div>
            <div className="text-[11px] text-slate-400">Officer / Captain Positions</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-rose-400 text-[20px]">flare</span>
          </div>
          <div>
            <div className="text-[19px] font-bold text-white font-mono">{tier1Or2Count} Top-Tier</div>
            <div className="text-[11px] text-slate-400">Tier 1 &amp; Tier 2 Distinction</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-sky-400 text-[20px]">view_list</span>
          </div>
          <div>
            <div className="text-[19px] font-bold text-white font-mono">{userProfile.activities.length} / 10</div>
            <div className="text-[11px] text-slate-400">Common App Slots Populated</div>
          </div>
        </div>
      </div>

      {/* Toolbar: View Switcher (Cards vs Common App Official Preview) */}
      <div className="flex items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/10 flex-wrap">
        <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/10 gap-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Interactive Cards</span>
          </button>

          <button
            onClick={() => setViewMode('common_app_preview')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'common_app_preview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Common App 10-Slot Preview</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400 text-[16px]">info</span>
          <span>Admissions officers evaluate your top 10 activities in order of importance.</span>
        </div>
      </div>

      {/* VIEW 1: Standard Interactive Cards */}
      {viewMode === 'cards' && (
        <div className="space-y-3.5 animate-fade-in">
          {userProfile.activities.map((act, index) => {
            const tierColors: Record<number, { label: string; style: string }> = {
              1: { label: 'Tier 1 (National/Top)', style: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
              2: { label: 'Tier 2 (State/Leadership)', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
              3: { label: 'Tier 3 (School/Local)', style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
              4: { label: 'Tier 4 (General)', style: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
            };

            const impactCritique = evaluateActivityImpact(act.description || '');

            return (
              <div
                key={act.id}
                className="glass-card glass-card-hover rounded-2xl p-4 md:p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg group relative"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Order Rank and Up/Down Movers */}
                  <div className="flex flex-col items-center justify-center pt-0.5 shrink-0 text-slate-500">
                    <button
                      onClick={() => handleMoveOrder(index, 'up')}
                      disabled={index === 0}
                      title="Move up in priority"
                      className="hover:text-indigo-300 disabled:opacity-20 cursor-pointer p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_drop_up</span>
                    </button>
                    <span className="text-[13px] font-mono font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleMoveOrder(index, 'down')}
                      disabled={index === userProfile.activities.length - 1}
                      title="Move down in priority"
                      className="hover:text-indigo-300 disabled:opacity-20 cursor-pointer p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-bold text-white truncate">{act.title}</h3>
                      <span className="text-[13px] text-slate-300 font-medium">({act.role})</span>
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

                      {/* AI Impact Score Chip */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${impactCritique.badgeClass}`}
                        title={impactCritique.tip}
                      >
                        <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                        <span>{impactCritique.label} ({impactCritique.score}%)</span>
                      </span>
                    </div>

                    <p className="text-[13px] text-slate-300 leading-relaxed">
                      {act.description || 'No description added yet. Use the AI Optimizer below to format for Common App.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-indigo-400">schedule</span>
                        {act.hoursPerWeek} hours/week
                      </span>
                      <span>•</span>
                      <span>~{act.hoursPerWeek * 36} hours/school year</span>
                      <span>•</span>
                      <span className={act.description?.length && act.description.length > 150 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {act.description?.length || 0} / 150 chars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
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
      )}

      {/* VIEW 2: Common App Official 10-Slot Visual Preview */}
      {viewMode === 'common_app_preview' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">visibility</span>
              <span>This is the official layout admissions committees view inside Common App portals. Maximum 150 characters per description.</span>
            </span>
            <span className="font-mono font-bold text-white">{userProfile.activities.length} / 10 slots filled</span>
          </div>

          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, slotIndex) => {
              const act = userProfile.activities[slotIndex];
              const slotNumber = slotIndex + 1;

              if (!act) {
                return (
                  <div
                    key={`empty-slot-${slotNumber}`}
                    onClick={onOpenAddActivity}
                    className="p-4 rounded-xl border border-dashed border-white/10 hover:border-indigo-400/40 bg-white/[0.01] hover:bg-white/[0.03] text-slate-500 hover:text-indigo-300 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm w-8">#{slotNumber}</span>
                      <span className="text-xs">Empty Activity Slot — Click to add pursuit</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">add_circle</span>
                  </div>
                );
              }

              const charCount = act.description?.length || 0;
              const isOverLimit = charCount > 150;
              const impact = evaluateActivityImpact(act.description || '');

              return (
                <div
                  key={act.id}
                  className="glass-card rounded-xl p-4 border border-white/15 space-y-2 hover:border-indigo-400/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                        Activity #{slotNumber}
                      </span>
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        {act.category}
                      </span>
                      {act.isLeadership && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.2 rounded font-bold">
                          Leadership
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-mono font-bold ${isOverLimit ? 'text-rose-400' : 'text-slate-400'}`}>
                        {charCount}/150 chars
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${impact.badgeClass}`}>
                        {impact.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Position / Leadership (Max 50)</span>
                      <span className="text-white font-semibold">{act.role || 'Member'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Organization Name (Max 100)</span>
                      <span className="text-white font-semibold">{act.title}</span>
                    </div>
                  </div>

                  <div className="text-xs pt-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Description (Max 150 Characters)</span>
                    <p className="text-slate-200 bg-black/30 p-2.5 rounded-lg border border-white/5 font-mono text-[12px] leading-relaxed">
                      {act.description || <span className="text-slate-600 italic">No description</span>}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>Timing: {act.hoursPerWeek} hrs/week • ~{act.hoursPerWeek * 36} hrs/yr</span>
                    <button
                      onClick={() => handleOpenOptimizer(act)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                      Optimize Description
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
