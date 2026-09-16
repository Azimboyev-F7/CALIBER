import React, { useState } from 'react';
import { ActiveScreen, AnalysisResult, UserProfile } from '../types';
import { AdmissionsCoachChat } from './AdmissionsCoachChat';

interface AdmissionsCoachViewProps {
  userProfile: UserProfile;
  analysis: AnalysisResult;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenContextNotes: () => void;
}

type CoachMode = 'chat' | 'weaknesses' | 'spike' | 'essay' | 'eclift';

function buildEssayAngles(userProfile: any, analysis: any) {
  const topActivities = [...(userProfile.activities || [])]
    .sort((a: any, b: any) => (a.tier ?? 4) - (b.tier ?? 4))
    .slice(0, 3);

  const act1 = topActivities[0];
  const act2 = topActivities[1];
  const spike = analysis?.spikeCategory || userProfile.intendedMajor || 'your core interest';
  const major = userProfile.intendedMajor || 'your intended field';
  const name = userProfile.name?.split(' ')[0] || 'You';
  const background = userProfile.contextNotes || '';

  const angle1Title = act1
    ? `The Moment That Defined Your ${act1.title} Journey`
    : `The Defining Moment in ${spike}`;
  const angle1Body = act1
    ? `Open with a vivid, specific scene from your work in ${act1.title} as ${act1.role}. Show the moment a challenge or breakthrough changed how you think. Connect that personal revelation to your long-term drive toward ${major}.${background ? ` Your context — "${background.slice(0, 80)}..." — is a natural anchor for this arc.` : ''}`
    : `Open with a specific moment that sparked your passion for ${spike}. Show the internal shift — from confusion to clarity, from observer to builder — and connect it to your pursuit of ${major}.`;

  const angle1Prompt = act1
    ? `Common App #1 (Background/Identity) or #6 (Topic that captivates you)`
    : `Common App #1 or #6`;

  const angle2Title = act1 && act2
    ? `The Unexpected Bridge: ${act1.category} Meets ${act2.category}`
    : `Two Worlds, One Vision: Your Cross-Domain Spike in ${spike}`;
  const angle2Body = act1 && act2
    ? `Reveal the non-obvious intellectual link between your work in ${act1.title} and ${act2.title}. How does the thinking you apply in one domain directly enhance your performance in the other? This cross-disciplinary angle positions you as a rare thinker rather than a niche specialist.`
    : `Explore the tension between two seemingly unrelated aspects of your profile. Show how resolving that tension led to your clearest insight about ${major} — and why top programs in that field need that kind of synthesis.`;

  const angle2Prompt = `Common App #2 (Overcoming a challenge) or #5 (Accomplishment/growth)`;

  return { angle1Title, angle1Body, angle1Prompt, angle2Title, angle2Body, angle2Prompt };
}

function getEcLiftRecommendation(act: any): string {
  if (act.tier === 1) return 'Maintain elite metrics and document every quantifiable outcome for your application.';
  const cat = (act.category || '').toLowerCase();
  if (cat.includes('research') || cat.includes('science'))
    return 'Submit your findings to a peer-reviewed journal or a recognized competition like Regeneron ISEF or Siemens.';
  if (cat.includes('stem') || cat.includes('engineering') || cat.includes('technology') || cat.includes('robotics') || cat.includes('computer'))
    return 'Build an open-source project or enter USACO / national hackathons to gain verifiable national-level recognition.';
  if (cat.includes('debate') || cat.includes('speech'))
    return 'Qualify for or place at a national tournament (NSDA Nationals, TOC) and take on a district/national leadership role.';
  if (cat.includes('music') || cat.includes('art') || cat.includes('theatre') || cat.includes('creative'))
    return 'Compete at or perform in a state/national festival, publish original work, or earn an auditioned honors ensemble seat.';
  if (cat.includes('sport') || cat.includes('athletics'))
    return 'Pursue All-State recognition, recruit interest from college coaches, or found a youth coaching / outreach program.';
  if (cat.includes('community') || cat.includes('volunteer') || cat.includes('service'))
    return 'Scale the impact: grow to 3+ partner organizations, raise external funds, and become a named nonprofit or 501(c)(3).';
  if (cat.includes('academic') || cat.includes('math') || cat.includes('olympiad'))
    return 'Aim for USAMO, AMC 12 top-500, or national academic bowl. Publish or present original research at a university symposium.';
  if (cat.includes('business') || cat.includes('entrepreneur'))
    return 'Reach verifiable revenue, users, or press coverage; enter national business plan competitions like DECA ICDC or Conrad Challenge.';
  if (act.isLeadership)
    return 'Expand your leadership footprint: launch a regional chapter, mentor underclassmen, or host a publicly recognized event.';
  return 'Take on an officer role, produce a measurable external outcome (publication, competition placement, funds raised), and document it.';
}

export const AdmissionsCoachView: React.FC<AdmissionsCoachViewProps> = ({
  userProfile,
  analysis,
  onNavigate,
  onOpenContextNotes
}) => {
  const [activeMode, setActiveMode] = useState<CoachMode>('chat');

  // Quick Strategy Cards
  const strategyTools = [
    {
      id: 'chat' as CoachMode,
      title: 'Admission coach',
      desc: 'Ask custom questions to an AI model trained on top-tier admissions rubric',
      icon: 'psychology',
      badge: 'Live Gemini'
    },
    {
      id: 'weaknesses' as CoachMode,
      title: 'Weakness & Red Flags Clinic',
      desc: 'Proactively identify and neutralize application vulnerabilities before submitting',
      icon: 'gpp_maybe',
      badge: 'Critical'
    },
    {
      id: 'spike' as CoachMode,
      title: 'Spike & Narrative Architect',
      desc: 'Synthesize your activities into a memorable, distinctive admissions hook',
      icon: 'flare',
      badge: 'High Impact'
    },
    {
      id: 'essay' as CoachMode,
      title: 'Common App Essay Ideator',
      desc: 'Generate unique, non-cliché personal statement angles from your background',
      icon: 'auto_stories',
      badge: 'Essential'
    },
    {
      id: 'eclift' as CoachMode,
      title: 'EC Tier Accelerator',
      desc: 'Step-by-step roadmap to upgrade Tier 2 & 3 pursuits into Tier 1 distinction',
      icon: 'trending_up',
      badge: 'Actionable'
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 animate-fade-up text-left">
      {/* Essential Tool Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-[#0a0a0f] p-5 md:p-6 shadow-[0_8px_32px_rgba(99,102,241,0.25)] backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                Essential Strategy Engine
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini 3.7 Flash Online
              </span>
            </div>

            <h1 className="text-[22px] md:text-[26px] font-extrabold text-white tracking-tight">
              AI Admissions Coach &amp; Strategy Suite
            </h1>

            <p className="text-[13px] text-slate-300 leading-relaxed">
              Your personalized college strategist. Trained to stress-test your profile against criteria used by Ivy League, Stanford, and top-20 admissions committees.
            </p>
          </div>

          {/* Quick Profile Snapshot Badge */}
          <div className="flex flex-col gap-2 p-3 bg-white/[0.04] border border-white/10 rounded-xl backdrop-blur-md md:min-w-[240px]">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Target Profile:</span>
              <span className="font-bold text-indigo-300">{userProfile.intendedMajor}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Spike Archetype:</span>
              <span className="font-bold text-amber-300">{analysis.spikeCategory}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Narrative Cohesion:</span>
              <span className="font-bold text-emerald-400">{analysis.narrativeCohesionScore}%</span>
            </div>
            <button
              onClick={onOpenContextNotes}
              className="mt-1 text-[11px] text-indigo-300 hover:text-white font-semibold flex items-center justify-center gap-1 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">note_alt</span>
              Edit Admissions Context Notes
            </button>
          </div>
        </div>

        {/* Feature Mode Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-white/10">
          {strategyTools.map((tool) => {
            const isSelected = activeMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveMode(tool.id)}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? tool.id === 'weaknesses'
                      ? 'bg-rose-600/30 border border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.3)] text-white'
                      : 'bg-indigo-600/30 border border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white'
                    : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSelected
                        ? tool.id === 'weaknesses' ? 'text-rose-300' : 'text-indigo-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {tool.icon}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider ${
                      isSelected
                        ? tool.id === 'weaknesses' ? 'bg-rose-500 text-white' : 'bg-indigo-400 text-[#0a0a0f]'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </div>
                <div className="text-[12px] font-bold truncate">{tool.title}</div>
                <div className="text-[10.5px] text-slate-400 line-clamp-1 mt-0.5">
                  {tool.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Work Area based on Selected Mode */}
      {activeMode === 'chat' && (
        <div className="space-y-4">
          <AdmissionsCoachChat
            userProfile={userProfile}
            analysis={analysis}
          />
        </div>
      )}

      {activeMode === 'weaknesses' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 md:p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/25 via-[#0a0a0f] to-indigo-950/20 shadow-[0_8px_30px_rgba(244,63,94,0.15)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                  <span className="material-symbols-outlined text-[22px]">gpp_maybe</span>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-white flex items-center gap-2">
                    Application Vulnerability &amp; Red Flag Clinic
                  </h3>
                  <p className="text-[12px] text-slate-300">
                    Proactive mitigation ensures weak points are shielded before admissions committees review your file.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMode('chat')}
                className="glass-btn-primary px-3.5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                Open Live Coach Discussion →
              </button>
            </div>

            {/* Critical Priority Box */}
            {analysis.priorityRecommendation?.title && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-400 text-[20px] shrink-0 mt-0.5">priority_high</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                      #1 Priority Mitigation Target
                    </span>
                  </div>
                  <h4 className="text-[13.5px] font-bold text-white">
                    {analysis.priorityRecommendation.title}
                  </h4>
                  <p className="text-[12.5px] text-slate-300 leading-relaxed">
                    {analysis.priorityRecommendation.description}
                  </p>
                </div>
              </div>
            )}

            {/* Identified Gaps Grid */}
            <div className="space-y-3">
              <h4 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-rose-400 text-[16px]">crisis_alert</span>
                Identified Profile Vulnerabilities ({analysis.gapsToAddress?.length || 0})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(analysis.gapsToAddress && analysis.gapsToAddress.length > 0 ? analysis.gapsToAddress : [
                  {
                    title: 'Limited regional/national recognition in intended major',
                    suggestion: 'Target recognized state/national olympiads or competitions.'
                  },
                  {
                    title: 'Activity descriptions need greater quantification of impact',
                    suggestion: 'Revise bullets to include numbers, funds raised, or people reached.'
                  }
                ]).map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/[0.03] border border-rose-500/20 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Vulnerability #{idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-400">Committee Flag</span>
                      </div>
                      <h5 className="text-[13.5px] text-white font-semibold leading-snug">
                        {gap.title}
                      </h5>
                      <p className="text-[12px] text-slate-300 leading-relaxed">
                        {gap.suggestion}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveMode('chat')}
                      className="w-full text-left py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 hover:text-white border border-rose-500/30 text-[11.5px] font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span>Discuss &amp; Fix with Coach</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Advisory Note */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5 text-[12px] text-indigo-200">
              <span className="material-symbols-outlined text-[18px] text-indigo-400 shrink-0">info</span>
              <span>
                <strong>Admissions Strategy Insight:</strong> Top colleges do not expect perfection, but they do penalize unaddressed disconnects. Use the Coach Chat to formulate your <strong>Additional Information</strong> addendum or craft essay hooks that reframe your journey.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'spike' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">flare</span>
                <h3 className="text-[16px] font-bold text-white">Your Evaluated Spike: {analysis.spikeCategory}</h3>
              </div>
              <span className="text-[11px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                Distinctiveness: High
              </span>
            </div>

            <p className="text-[13px] text-slate-200 leading-relaxed">
              {analysis.spikeDescription}
            </p>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
              <h4 className="text-[12.5px] font-bold text-indigo-300 uppercase tracking-wider">
                Admissions Officer Perception
              </h4>
              <p className="text-[12.5px] text-slate-300 leading-relaxed">
                Rather than being viewed as a generic high-GPA applicant, this profile positions you as a builder at the intersection of technical execution ({userProfile.activities.find(a => a.category === 'STEM')?.title || 'Technical Projects'}) and public discourse ({userProfile.activities.find(a => a.category === 'Speech & Debate' || a.isLeadership)?.title || 'Leadership'}).
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveMode('chat')}
                className="glass-btn-primary px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                Ask Coach How to Amplify This Spike
              </button>
              <button
                onClick={() => onNavigate('results')}
                className="text-[12px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                View Full Diagnostic
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-400 text-[17px]">tips_and_updates</span>
              Spike Rules of Thumb
            </h4>
            <ul className="space-y-2.5 text-[12px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Depth over breadth:</strong> Top 20 colleges prefer 1 exceptional national hook over 10 uncommitted school clubs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Quantify proof:</strong> Use specific numbers (e.g. $12k raised, 350 active users, 1st place in state).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Unified theme:</strong> Ensure your letter of rec requests align with this spike archetype.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeMode === 'essay' && (() => {
        const { angle1Title, angle1Body, angle1Prompt, angle2Title, angle2Body, angle2Prompt } =
          buildEssayAngles(userProfile, analysis);
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[18px]">lightbulb</span>
                  Angle 1: {angle1Title}
                </h4>
                <span className="text-[10.5px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Narrative Arc
                </span>
              </div>
              <p className="text-[12.5px] text-slate-300 leading-relaxed">{angle1Body}</p>
              <div className="text-[11.5px] text-indigo-300 font-medium">
                Target Prompts: {angle1Prompt}.
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400 text-[18px]">balance</span>
                  Angle 2: {angle2Title}
                </h4>
                <span className="text-[10.5px] text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Intellectual Spike
                </span>
              </div>
              <p className="text-[12.5px] text-slate-300 leading-relaxed">{angle2Body}</p>
              <div className="text-[11.5px] text-purple-300 font-medium">
                Target Prompts: {angle2Prompt}.
              </div>
            </div>

            <div className="md:col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[13px] font-bold text-white">Want the AI Coach to brainstorm deeper essay angles?</div>
                <div className="text-[11.5px] text-slate-400">Get fully personalized prompts based on your exact profile, including supplemental essays.</div>
              </div>
              <button
                onClick={() => {
                  setActiveMode('chat');
                }}
                className="glass-btn-primary px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">psychology</span>
                Brainstorm Supplements with Coach
              </button>
            </div>
          </div>
        );
      })()}

      {activeMode === 'eclift' && (
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-white">Extracurricular Tier Accelerator Roadmap</h3>
              <p className="text-[12px] text-slate-400">How to convert high school activities from standard participation into Tier 1 standout impact.</p>
            </div>
            <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              4-Tier Rubric
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {userProfile.activities.map((act) => (
              <div key={act.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    act.tier === 1 ? 'bg-amber-400 text-black font-extrabold' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    Current: Tier {act.tier}
                  </span>
                  <span className="text-[11px] text-slate-400">{act.hoursPerWeek} hrs/wk</span>
                </div>
                <div className="text-[13px] font-bold text-white truncate">{act.title}</div>
                <div className="text-[11.5px] text-slate-400 line-clamp-2">{act.role}</div>

                <div className="pt-2 border-t border-white/5 text-[11.5px] text-emerald-300">
                  <strong>Coach Recommendation:</strong> {getEcLiftRecommendation(act)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
