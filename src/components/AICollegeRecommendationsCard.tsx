import { getStoredAuthUser } from '../lib/supabaseClient';
import { getDirectoryCategory, filterUniversitiesByRate } from '../utils/universityDirectory';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  UserProfile, 
  RecommendedCollege, 
  CollegeRecommendationsResult, 
  CollegeTarget,
  CollegeCategory 
} from '../types';
import { getApiHeaders } from '../utils/apiClient';
import { calculateEstimatedRange, generateIntelligentCollegeRecommendations } from '../../services/scoring';

interface AICollegeRecommendationsCardProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onShowToast?: (msg: string) => void;
}

export const AICollegeRecommendationsCard: React.FC<AICollegeRecommendationsCardProps> = ({
  userProfile,
  onUpdateProfile,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'reach' | 'target' | 'safety'>('all');
  const [selectedCollegeForDetail, setSelectedCollegeForDetail] = useState<RecommendedCollege | null>(null);

  const effectiveRegion = userProfile.preferredCountry || 'United States';
  const effectiveMajor = userProfile.intendedMajor || 'Computer Science';

  // Generate unique profile fingerprint to detect changes.
  // Include all relevant profile content and the account to avoid stale or cross-account results.
  const profileKey = JSON.stringify({ userId: getStoredAuthUser()?.id || 'demo', ...userProfile, targetColleges: undefined, analysisHistory: undefined, lastAnalyzedDate: undefined });

  const [recommendations, setRecommendations] = useState<CollegeRecommendationsResult | null>(() => {
    try {
      const cached = sessionStorage.getItem(`caliber_rec_${profileKey}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedKey, setLastFetchedKey] = useState<string>(() => {
    return recommendations ? profileKey : '';
  });

  const fetchRecommendations = useCallback(async (isManualTrigger = false) => {
    setIsLoading(true);
    const regionToSend = userProfile.preferredCountry || 'United States';
    const majorToSend = userProfile.intendedMajor || 'Computer Science';

    const modifiedProfile = {
      ...userProfile,
      preferredCountry: regionToSend,
      intendedMajor: majorToSend
    };

    const currentKey = JSON.stringify({ userId: getStoredAuthUser()?.id || 'demo', ...userProfile, targetColleges: undefined, analysisHistory: undefined, lastAnalyzedDate: undefined });

    try {
      const res = await fetch('/api/recommend-colleges', {
        method: 'POST',
        headers: await getApiHeaders(),
        body: JSON.stringify({ 
          profile: modifiedProfile,
          filterRegion: regionToSend
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data && data.data) {
        setRecommendations(data.data);
        setLastFetchedKey(currentKey);
        try {
          sessionStorage.setItem(`caliber_rec_${currentKey}`, JSON.stringify(data.data));
        } catch (e) {
          // ignore
        }
        if (isManualTrigger) {
          onShowToast?.(`Generated ${data.data.reachRecommendations?.length + data.data.targetRecommendations?.length + data.data.safetyRecommendations?.length} personalized university matches!`);
        }
      }
    } catch (err) {
      console.warn('[AI Recommendations] API unavailable, using local engine for', regionToSend, err);
      const fallbackData = generateIntelligentCollegeRecommendations(
        { ...userProfile, preferredCountry: regionToSend, intendedMajor: majorToSend },
        undefined,
        regionToSend
      );

      setRecommendations(fallbackData);
      setLastFetchedKey(currentKey);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, onShowToast]);

  // Initial load and profile-change auto refetch
  useEffect(() => {
    if (!recommendations && !isLoading) {
      fetchRecommendations(false);
    } else if (profileKey !== lastFetchedKey && !isLoading && lastFetchedKey !== '') {
      // Auto refresh when key changes
      fetchRecommendations(false);
    }
  }, [profileKey, lastFetchedKey, recommendations, isLoading, fetchRecommendations]);

  // Check if school is already in user's targetColleges
  const isSchoolAdded = (schoolName: string): boolean => {
    return (userProfile.targetColleges || []).some(
      (c) => c.name.toLowerCase().trim() === schoolName.toLowerCase().trim()
    );
  };

  // Add recommended school to user's main college list
  const handleAddSchool = (rec: RecommendedCollege) => {
    if (isSchoolAdded(rec.name)) {
      onShowToast?.(`${rec.name} is already in your college portfolio.`);
      return;
    }

    const fitSummary = rec.profileFit?.satPercentilePosition
      ? `SAT: ${rec.profileFit.satPercentilePosition}`
      : (rec.profileFit?.gpaComparison || 'Holistic Profile Fit');
    const weighedFactors = rec.profileFit?.topWeightedFactors?.length
      ? rec.profileFit.topWeightedFactors.join(', ')
      : rec.keyFactor;

    const newTarget: CollegeTarget = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: rec.name,
      category: rec.category,
      acceptanceRate: rec.baselineAcceptanceRate,
      baselineAcceptanceRate: rec.baselineAcceptanceRate,
      profileFit: rec.profileFit,
      estimatedRange: rec.estimatedRange ?? calculateEstimatedRange(userProfile, rec),
      location: rec.location,
      deadline: rec.deadline,
      round: rec.round,
      status: 'not_started',
      notes: `Profile Fit: ${fitSummary} | This school weighs: ${weighedFactors}`,
      checklist: [
        { id: `chk-1-${Date.now()}`, label: 'Main Application & Portal Profile', completed: false },
        { id: `chk-2-${Date.now()}`, label: 'Institutional Supplemental Essays', completed: false },
        { id: `chk-3-${Date.now()}`, label: 'Letters of Recommendation', completed: false },
        { id: `chk-4-${Date.now()}`, label: 'Transcripts & Test Scores', completed: false },
        { id: `chk-5-${Date.now()}`, label: 'Financial Aid (FAFSA / CSS / Scholarships)', completed: false }
      ]
    };

    onUpdateProfile({
      targetColleges: [...(userProfile.targetColleges || []), newTarget]
    });

    onShowToast?.(`Added ${rec.name} to your ${rec.category.toUpperCase()} universities!`);
  };

  const normalizedRecommendations = useMemo(() => [
    ...(recommendations?.reachRecommendations || []),
    ...(recommendations?.targetRecommendations || []),
    ...(recommendations?.safetyRecommendations || [])
  ].map((rec) => ({
    ...rec,
    acceptanceRate: rec.baselineAcceptanceRate,
    category: getDirectoryCategory({ acceptanceRate: rec.baselineAcceptanceRate, category: rec.category })
  })), [recommendations]);
  const reaches = filterUniversitiesByRate(normalizedRecommendations, 'reach');
  const targets = filterUniversitiesByRate(normalizedRecommendations, 'target');
  const safeties = filterUniversitiesByRate(normalizedRecommendations, 'safety');
  const rawDisplayList = filterUniversitiesByRate(normalizedRecommendations, activeTab);

  const isStale = lastFetchedKey !== '' && lastFetchedKey !== profileKey;

  return (
    <section className="glass-card rounded-2xl p-5 md:p-6 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#0d0d16] to-[#08080f] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              AI Admissions Matchmaker
            </span>
            {recommendations?.academicCompetitivenessTier && (
              <span className="text-[11.5px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {recommendations.academicCompetitivenessTier}
              </span>
            )}
          </div>
          <h3 className="text-[20px] md:text-[22px] font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            Personalized University Recommendations &amp; Admit Odds
          </h3>
          <p className="text-[13px] text-slate-300">
            Intelligent recommendations factoring in your GPA ({userProfile.unweightedGpa || 'N/A'}), SAT ({userProfile.satScore || 'N/A'}), IELTS ({userProfile.ieltsScore || 'N/A'}), Budget ({userProfile.budgetPerYear || 'Flexible'}), and Extracurricular Spike.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isStale && (
            <span className="text-[11.5px] text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 animate-pulse">
              <span className="material-symbols-outlined text-[14px]">update</span>
              Profile Criteria Changed
            </span>
          )}
          <button
            onClick={() => fetchRecommendations(true)}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
              isStale
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-amber-500/30 hover:brightness-110'
                : 'glass-btn-primary shadow-indigo-500/20 hover:border-indigo-400/50'
            } disabled:opacity-50`}
          >
            <span className={`material-symbols-outlined text-[17px] ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? 'sync' : 'auto_mode'}
            </span>
            <span>{isLoading ? 'Calculating Match Odds...' : 'Recalculate AI Rates'}</span>
          </button>
        </div>
      </div>

      {/* Summary Narrative Banner */}
      {recommendations?.summary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0f0f1c] border border-indigo-500/25 text-[13px] text-slate-200 flex items-start gap-3 shadow-inner">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-indigo-300 text-[18px]">insights</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              Admissions Portfolio Diagnosis
              <span className="text-[11px] font-normal text-indigo-300">
                (Destination: {effectiveRegion} • Major: {effectiveMajor})
              </span>
            </div>
            <p className="leading-relaxed text-slate-300">{recommendations.summary}</p>
          </div>
        </div>
      )}

      {/* Tier Category Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1.5 rounded-xl border border-white/10 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All Matches</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10.5px] bg-white/20">
              {reaches.length + targets.length + safeties.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reach')}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reach'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-rose-300/80 hover:text-white'
            }`}
          >
            <span>Reach</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10.5px] bg-rose-950/60 border border-rose-500/30">
              {reaches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('target')}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'target'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-indigo-300/80 hover:text-white'
            }`}
          >
            <span>Target</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10.5px] bg-indigo-950/60 border border-indigo-500/30">
              {targets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'safety'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-300/80 hover:text-white'
            }`}
          >
            <span>Safety</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10.5px] bg-emerald-950/60 border border-emerald-500/30">
              {safeties.length}
            </span>
          </button>
        </div>

        <div className="text-[12px] text-slate-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-amber-400 text-[16px]">verified</span>
          <span>Dual calculated rates (Official Admit Rate vs. Estimated Chance)</span>
        </div>
      </div>

      {/* Grid of Recommended Universities */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 glass-panel rounded-2xl border border-white/10">
          <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h4 className="text-[15px] font-bold text-white">Generating AI Admissions Intelligence...</h4>
          <p className="text-[12.5px] text-slate-400 max-w-md mx-auto">
            Matching global admissions standards in {effectiveRegion} with your unweighted GPA, test scores, and extracurricular impact.
          </p>
        </div>
      ) : rawDisplayList.length === 0 ? (
        <div className="py-12 text-center space-y-3 glass-panel rounded-2xl border border-white/10">
          <span className="material-symbols-outlined text-slate-500 text-[36px]">school</span>
          <h4 className="text-[15px] font-bold text-white">No recommended universities available</h4>
          <p className="text-[12.5px] text-slate-400">
            Click &quot;Recalculate AI Rates&quot; to generate recommendations tailored to your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rawDisplayList.map((rec) => {
            const isAdded = isSchoolAdded(rec.name);
            const isReach = rec.category === 'reach';
            const isTarget = rec.category === 'target';
            const isSafety = rec.category === 'safety';
            const effectiveRange = rec.estimatedRange !== undefined && rec.estimatedRange !== null
              ? rec.estimatedRange
              : calculateEstimatedRange(userProfile, rec, rec.profileFit);
            const midpointChance = effectiveRange
              ? Math.round((effectiveRange.low + effectiveRange.high) / 2)
              : null;
            const hasSatAndGpa = userProfile.satScore && parseFloat(userProfile.satScore) > 0
              && userProfile.unweightedGpa && parseFloat(userProfile.unweightedGpa) > 0;

            const tierBadge = isReach
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : isTarget
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

            const cardBorder = isReach
              ? 'hover:border-rose-500/50'
              : isTarget
              ? 'hover:border-indigo-500/50'
              : 'hover:border-emerald-500/50';

            return (
              <div
                key={rec.id || rec.name}
                className={`p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all flex flex-col justify-between space-y-3.5 shadow-sm group ${cardBorder}`}
              >
                {/* Header Information */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 pr-1">
                      <h4 className="text-[15.5px] font-extrabold text-white leading-snug group-hover:text-indigo-300 transition-colors">
                        {rec.name}
                      </h4>
                      <p className="text-[11.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px] text-slate-500">location_on</span>
                        {rec.location}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase border shrink-0 ${tierBadge}`}>
                      {rec.category}
                    </span>
                  </div>

                  {/* Data-Backed Admission Rate & Personalized Estimated Chance */}
                  <div className="grid grid-cols-2 bg-[#121220]/80 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-3">
                      <span className="text-[9.5px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
                        General Admit Rate
                      </span>
                      <span className="text-[20px] font-bold text-slate-200 leading-none font-mono tabular-nums tracking-tight">
                        {rec.baselineAcceptanceRate}
                      </span>
                    </div>
                    <div className="p-3 border-l border-white/10">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" style={{ animationDuration: '0.9s' }}></span>
                        <span className="text-[9.5px] text-indigo-300 uppercase font-bold tracking-wider">
                          Your Est. Rate
                        </span>
                        {/* <span
                          className="material-symbols-outlined text-[12px] text-indigo-400/70 cursor-help"
                          title="An estimate based on your percentile position relative to this school's admitted-class data. Shows ~ when full CDS data isn't available. Not a guaranteed outcome."
                        >
                          info
                        </span> */}
                      </div>
                      {effectiveRange && midpointChance !== null ? (
                        <span className="text-[20px] font-extrabold text-indigo-300 leading-none font-mono tabular-nums tracking-tight">
                          {midpointChance}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic leading-tight block mt-1">
                          {hasSatAndGpa ? 'CDS data unavailable' : 'Add SAT & GPA'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Why it Fits */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Why It Fits Your Profile:
                    </span>
                    <p className="text-[12px] text-slate-300 leading-relaxed line-clamp-3">
                      {rec.whyFit}
                    </p>
                  </div>

                  {/* Key Admissions Deciding Factor */}
                  <div className="text-[11.5px] text-amber-200/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[15px] text-amber-400 shrink-0 mt-0.5">
                      key
                    </span>
                    <span className="leading-snug">
                      <strong className="text-amber-300">Admissions Edge:</strong> {rec.keyFactor}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-400">event</span>
                    <span>{rec.round} ({rec.deadline})</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedCollegeForDetail(rec)}
                      className="p-1.5 rounded-lg glass-btn-secondary text-slate-300 hover:text-white cursor-pointer"
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>

                    <button
                      onClick={() => handleAddSchool(rec)}
                      disabled={isAdded}
                      className={`px-3 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default font-semibold'
                          : 'glass-btn-primary hover:bg-indigo-600 text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isAdded ? 'check_circle' : 'add'}
                      </span>
                      <span>{isAdded ? 'In Portfolio' : 'Add to List'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategic Strategy Tips */}
      {recommendations?.strategyNotes && recommendations.strategyNotes.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/25 space-y-2">
          <div className="flex items-center gap-2 text-[12.5px] font-bold text-indigo-300 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[17px]">tips_and_updates</span>
            Global Admissions Counselor Strategy
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] text-slate-300">
            {recommendations.strategyNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                <span className="text-indigo-400 font-bold">•</span>
                <span className="leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Modal for Recommended College */}
      {selectedCollegeForDetail && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#11111e] border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedCollegeForDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  selectedCollegeForDetail.category === 'reach' 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                    : selectedCollegeForDetail.category === 'target'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {selectedCollegeForDetail.category} Tier
                </span>
                <span className="text-[12px] text-slate-400">{selectedCollegeForDetail.location}</span>
              </div>
              <h3 className="text-[22px] font-extrabold text-white">{selectedCollegeForDetail.name}</h3>
            </div>

            {(() => {
              const modalEstimatedRange = selectedCollegeForDetail.estimatedRange !== undefined && selectedCollegeForDetail.estimatedRange !== null
                ? selectedCollegeForDetail.estimatedRange
                : calculateEstimatedRange(userProfile, selectedCollegeForDetail, selectedCollegeForDetail.profileFit);
              const modalMidpoint = modalEstimatedRange
                ? Math.round((modalEstimatedRange.low + modalEstimatedRange.high) / 2)
                : null;
              const modalHasSatAndGpa = userProfile.satScore && parseFloat(userProfile.satScore) > 0
                && userProfile.unweightedGpa && parseFloat(userProfile.unweightedGpa) > 0;
              return (
                <div className="grid grid-cols-2 gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Official Acceptance Rate</span>
                    <span className="text-[18px] font-bold text-white font-mono tabular-nums tracking-tight">{selectedCollegeForDetail.baselineAcceptanceRate}</span>
                  </div>
                  <div className="border-l border-white/10 pl-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-indigo-300 block font-bold">Estimated Chance</span>
                      <span
                        className="material-symbols-outlined text-[13px] text-indigo-400 cursor-help"
                        title="An estimate based on your percentile position relative to this school's admitted-class data. Shows ~ when full CDS data isn't available and the estimate is based on acceptance rate alone. Not a guaranteed outcome."
                      >
                        info
                      </span>
                    </div>
                    {modalEstimatedRange && modalMidpoint !== null ? (
                      <div>
                        <span className="text-[18px] font-black text-indigo-300 leading-none font-mono tabular-nums tracking-tight">
                          {modalMidpoint}%
                        </span>
                        <span className="text-[11px] text-indigo-300/80 block font-medium mt-0.5">
                          Range: {modalEstimatedRange.low}–{modalEstimatedRange.high}%
                          {modalEstimatedRange.approximate && (
                            <span className="text-slate-400 italic ml-1">(est.)</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic block mt-0.5">
                        {modalHasSatAndGpa
                          ? 'School CDS data unavailable for estimate'
                          : 'Add SAT & GPA in Profile Builder'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {selectedCollegeForDetail.profileFit && (
              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 space-y-1.5 text-[12.5px]">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Data-Backed Profile Comparison</span>
                </div>
                {selectedCollegeForDetail.profileFit.satPercentilePosition && (
                  <div className="text-slate-300">
                    <strong className="text-white">SAT Percentile:</strong> {selectedCollegeForDetail.profileFit.satPercentilePosition} of admitted class
                  </div>
                )}
                {selectedCollegeForDetail.profileFit.gpaComparison && (
                  <div className="text-slate-300">
                    <strong className="text-white">GPA Comparison:</strong> {selectedCollegeForDetail.profileFit.gpaComparison}
                  </div>
                )}
                <div className="text-slate-300">
                  <strong className="text-white">This school weighs:</strong>{' '}
                  {selectedCollegeForDetail.profileFit.topWeightedFactors?.length > 0
                    ? selectedCollegeForDetail.profileFit.topWeightedFactors.join(', ')
                    : selectedCollegeForDetail.keyFactor}
                </div>
              </div>
            )}

            <div className="space-y-3 text-[13px]">
              <div>
                <h5 className="font-bold text-white mb-1">Academic &amp; Program Fit</h5>
                <p className="text-slate-300 leading-relaxed">{selectedCollegeForDetail.whyFit}</p>
              </div>

              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 space-y-1">
                <h5 className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">key</span>
                  Decisive Admissions Factor
                </h5>
                <p className="text-slate-200 leading-relaxed">{selectedCollegeForDetail.keyFactor}</p>
              </div>

              <div className="flex items-center justify-between text-[12px] text-slate-300 pt-2 border-t border-white/10">
                <span>Application Cycle: <strong>{selectedCollegeForDetail.round}</strong></span>
                <span>Deadline: <strong>{selectedCollegeForDetail.deadline}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedCollegeForDetail(null)}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-[12.5px] font-bold cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  handleAddSchool(selectedCollegeForDetail);
                  setSelectedCollegeForDetail(null);
                }}
                disabled={isSchoolAdded(selectedCollegeForDetail.name)}
                className="px-4 py-2 rounded-xl glass-btn-primary text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSchoolAdded(selectedCollegeForDetail.name) ? 'check' : 'add'}
                </span>
                <span>{isSchoolAdded(selectedCollegeForDetail.name) ? 'Already Added' : 'Add to My Colleges'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
