import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen, ActivityItem, AwardItem, UserProfile, AnalysisResult, AuthUser } from './types';
import { INITIAL_USER_PROFILE, INITIAL_ANALYSIS_RESULT, EMPTY_USER_PROFILE, computeLocalAnalysis } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { ProfileBuilderView } from './components/ProfileBuilderView';
import { ResultsView } from './components/ResultsView';
import { ActivitiesView } from './components/ActivitiesView';
import { AdmissionsCoachView } from './components/AdmissionsCoachView';
import { UniversitiesView } from './components/UniversitiesView';
import { FloatingCoachWidget, resetFloatingCoachMessageSession } from './components/FloatingCoachWidget';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { AddActivityModal } from './components/AddActivityModal';
import { AddAwardModal } from './components/AddAwardModal';
import { ContextNotesModal } from './components/ContextNotesModal';
import { ReviewDraftsModal } from './components/ReviewDraftsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { SaveStatusIndicator } from './components/SaveStatusIndicator';
import { ProfileGateOverlay } from './components/ProfileGateOverlay';
import { CoachChatProvider } from './context/CoachChatContext';
import { getStoredAuthUser, signOutUser, syncSessionFromSupabase, getSessionToken } from './lib/supabaseClient';
import { getApiHeaders } from './utils/apiClient';
import { AdminPanel } from './components/AdminPanel';
import { trackAuthenticatedVisit } from './utils/usageTracking';

const PROFILE_STORAGE_KEY = 'caliber_user_profile';

const profileFromAuthUser = (user: AuthUser): UserProfile => ({
  ...EMPTY_USER_PROFILE,
  name: user.name || '',
  intendedMajor: user.intendedMajor || '',
});

const getScreenTitle = (screen: ActiveScreen) => {
  switch (screen) {
    case 'dashboard':
      return 'Dashboard';
    case 'coach':
      return 'AI Admissions Coach';
    case 'colleges':
      return 'Target Universities';
    case 'builder':
      return 'Profile Builder';
    case 'activities':
      return 'My Activities';
    case 'results':
      return 'Results & Spike';
    case 'settings':
      return 'Settings';
    case 'admin':
      return 'Admin Panel';
    default:
      return 'Dashboard';
  }
};

const getScreenIcon = (screen: ActiveScreen) => {
  switch (screen) {
    case 'dashboard':
      return 'dashboard';
    case 'coach':
      return 'psychology';
    case 'colleges':
      return 'school';
    case 'builder':
      return 'edit_note';
    case 'activities':
      return 'history_edu';
    case 'results':
      return 'insights';
    case 'settings':
      return 'settings';
    case 'admin':
      return 'admin_panel_settings';
    default:
      return 'dashboard';
  }
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('landing');
  const [pendingScreen, setPendingScreen] = useState<ActiveScreen | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    // Start with empty profile — the real profile loads once auth resolves
    return EMPTY_USER_PROFILE;
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const currentUserRef = useRef<AuthUser | null>(currentUser);
  currentUserRef.current = currentUser;
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'faxriyor';

  useEffect(() => {
    if (!currentUser || currentUser.id.startsWith('demo-') || currentUser.id.startsWith('applicant-')) return;
    const controller = new AbortController();
    const visit = () => {
      if (document.visibilityState === 'visible') void trackAuthenticatedVisit(controller.signal);
    };
    visit();
    document.addEventListener('visibilitychange', visit);
    return () => { controller.abort(); document.removeEventListener('visibilitychange', visit); };
  }, [currentUser?.id, activeScreen]);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(INITIAL_ANALYSIS_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);


  // Central Navigation handler with auth enforcement
  const handleNavigate = (targetScreen: ActiveScreen) => {
    const user = currentUserRef.current || getStoredAuthUser();
    if (targetScreen === 'admin' && !isAdminUser) return;
    if (!user && targetScreen !== 'landing' && targetScreen !== 'auth') {
      setPendingScreen(targetScreen);
      setActiveScreen('auth');
    } else {
      if (targetScreen === 'auth') {
        if (!pendingScreen) {
          setPendingScreen('dashboard');
        }
      } else {
        setPendingScreen(null);
      }
      setActiveScreen(targetScreen);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guard protected screens if user becomes unauthenticated
  useEffect(() => {
    const user = currentUser || getStoredAuthUser();
    if (!user && activeScreen !== 'landing' && activeScreen !== 'auth') {
      setPendingScreen(activeScreen);
      setActiveScreen('auth');
    }
  }, [currentUser, activeScreen]);

  // Restore session on page reload — load the user's own saved profile
  useEffect(() => {
    syncSessionFromSupabase().then(async (user) => {
      if (user) {
        currentUserRef.current = user;
        setCurrentUser(user);

        const userProfileKey = `${PROFILE_STORAGE_KEY}_${user.id}`;
        let savedProfile: UserProfile | null = null;
        try {
          const stored = localStorage.getItem(userProfileKey);
          if (stored) savedProfile = JSON.parse(stored);
        } catch {}

        if (savedProfile) {
          // Already has a profile stored for this user — restore it
          const next = {
            ...savedProfile,
            name: user.name || savedProfile.name,
            intendedMajor: user.intendedMajor || savedProfile.intendedMajor,
            targetColleges: savedProfile.targetColleges?.length ? savedProfile.targetColleges : EMPTY_USER_PROFILE.targetColleges,
          };
          setUserProfile(next);
          syncExistingStudentData(next);
        } else {
          // Session restored but no local profile — fetch from Supabase
          const token = await getSessionToken();
          if (token) {
            const headers = { 'x-api-key': 'caliber-secret-key', Authorization: `Bearer ${token}` };
            const [actRes, honRes] = await Promise.allSettled([
              fetch('/api/student/activities', { headers }).then((r) => r.ok ? r.json() : null),
              fetch('/api/student/honors', { headers }).then((r) => r.ok ? r.json() : null),
            ]);
            const baseProfile = profileFromAuthUser(user);
            const remoteActivities = actRes.status === 'fulfilled' ? actRes.value?.activities : null;
            const remoteHonors    = honRes.status  === 'fulfilled' ? honRes.value?.honors    : null;
            const next = {
              ...baseProfile,
              activities: remoteActivities?.length ? remoteActivities : [],
              awards:     remoteHonors?.length     ? remoteHonors     : [],
            };
            setUserProfile(next);
            syncExistingStudentData(next);
            try { localStorage.setItem(userProfileKey, JSON.stringify(next)); } catch {}
          } else {
            setUserProfile(profileFromAuthUser(user));
          }
        }
      }
    });
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    resetFloatingCoachMessageSession();
    currentUserRef.current = null;
    setCurrentUser(null);
    setPendingScreen(null);
    setActiveScreen('landing');
  };

  const handleUserChange = async (user: AuthUser | null, targetScreen?: ActiveScreen) => {
    if (user) resetFloatingCoachMessageSession();
    currentUserRef.current = user;
    setCurrentUser(user);

    if (user) {
      // Check localStorage for a profile already saved under this user's ID
      const userProfileKey = `${PROFILE_STORAGE_KEY}_${user.id}`;
      let savedProfile: UserProfile | null = null;
      try {
        const stored = localStorage.getItem(userProfileKey);
        if (stored) savedProfile = JSON.parse(stored);
      } catch {}

      if (savedProfile) {
        // Returning user — restore their saved profile
        const next = {
          ...savedProfile,
          name: user.name || savedProfile.name,
          intendedMajor: user.intendedMajor || savedProfile.intendedMajor,
          targetColleges: savedProfile.targetColleges?.length ? savedProfile.targetColleges : EMPTY_USER_PROFILE.targetColleges,
        };
        setUserProfile(next);
        syncExistingStudentData(next);
        try { localStorage.setItem(userProfileKey, JSON.stringify(next)); } catch {}
      } else {
        // First login — start with a clean empty profile, then load Supabase data if any
        const baseProfile = profileFromAuthUser(user);
        setUserProfile(baseProfile);

        const token = await getSessionToken();
        if (token) {
          const headers = { 'x-api-key': 'caliber-secret-key', Authorization: `Bearer ${token}` };
          const [actRes, honRes] = await Promise.allSettled([
            fetch('/api/student/activities', { headers }).then((r) => r.ok ? r.json() : null),
            fetch('/api/student/honors', { headers }).then((r) => r.ok ? r.json() : null),
          ]);
          setUserProfile((prev) => {
            const next = { ...prev };
            const remoteActivities = actRes.status === 'fulfilled' ? actRes.value?.activities : null;
            const remoteHonors    = honRes.status  === 'fulfilled' ? honRes.value?.honors    : null;
            if (remoteActivities?.length) next.activities = remoteActivities;
            if (remoteHonors?.length)     next.awards     = remoteHonors;
            try { localStorage.setItem(userProfileKey, JSON.stringify(next)); } catch {}
            return next;
          });
        } else {
          try { localStorage.setItem(userProfileKey, JSON.stringify(baseProfile)); } catch {}
        }
      }
    }

    if (user && targetScreen) {
      setPendingScreen(null);
      setActiveScreen(targetScreen);
    }
  };

  // Modals
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false);
  const [isContextNotesOpen, setIsContextNotesOpen] = useState(false);
  const [isReviewDraftsOpen, setIsReviewDraftsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Helper to trigger real-time saving feedback and persistent storage
  const triggerAutoSave = (updatedProfile: UserProfile) => {
    setSaveStatus('saving');
    setHasUnsavedChanges(true);
    try {
      const userId = currentUserRef.current?.id;
      const key = userId ? `${PROFILE_STORAGE_KEY}_${userId}` : PROFILE_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Failed to persist profile:', e);
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 650);
  };

  // Profile update handler
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      triggerAutoSave(next);
      return next;
    });
  };

  // ── Supabase sync helpers (fire-and-forget, localStorage is still primary) ──

  const studentApiHeaders = async (): Promise<Record<string, string> | null> => {
    const token = await getSessionToken();
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const syncStudentChange = async (path: string, method: 'POST' | 'DELETE', body?: unknown) => {
    // Demo/offline accounts have no Supabase session, so their local profile
    // should not be reported as a failed cloud save.
    if (!currentUserRef.current || currentUserRef.current.id.startsWith('demo-') || currentUserRef.current.id.startsWith('applicant-')) return;
    const owner = currentUserRef.current?.id;
    try {
      const headers = await studentApiHeaders();
      if (!headers) return;
      const response = await fetch(path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok) throw new Error('Cloud save failed. Your changes are saved on this device; try saving again.');
    } catch (error) {
      if (currentUserRef.current?.id === owner) setSyncError(error instanceof Error ? error.message : 'Cloud save failed.');
    }
  };

  const handleAccountChange = (user: AuthUser) => {
    currentUserRef.current = user;
    setCurrentUser(user);
    if (user.name && user.name !== userProfile.name) {
      handleUpdateProfile({ name: user.name });
    }
  };
  const syncActivityToSupabase = (activity: ActivityItem) => syncStudentChange('/api/student/activities', 'POST', activity);
  const removeActivityFromSupabase = (id: string) => syncStudentChange('/api/student/activities/' + encodeURIComponent(id), 'DELETE');
  const syncHonorToSupabase = (honor: AwardItem) => syncStudentChange('/api/student/honors', 'POST', honor);
  const removeHonorFromSupabase = (id: string) => syncStudentChange('/api/student/honors/' + encodeURIComponent(id), 'DELETE');
  const syncExistingStudentData = (profile: UserProfile) => {
    profile.activities.forEach(syncActivityToSupabase);
    profile.awards.forEach(syncHonorToSupabase);
  };


  // Activity handlers
  const handleAddActivity = (activity: ActivityItem) => {
    setUserProfile((prev) => {
      const next = {
        ...prev,
        activities: [...prev.activities, activity]
      };
      triggerAutoSave(next);
      return next;
    });
    syncActivityToSupabase(activity);
  };

  const handleDeleteActivity = (id: string) => {
    setUserProfile((prev) => {
      const next = {
        ...prev,
        activities: prev.activities.filter((a) => a.id !== id)
      };
      triggerAutoSave(next);
      return next;
    });
    removeActivityFromSupabase(id);
  };

  const handleUpdateActivities = (activities: ActivityItem[]) => {
    setUserProfile((prev) => {
      const next = { ...prev, activities };
      triggerAutoSave(next);
      return next;
    });
    const previous = new Map(userProfile.activities.map((activity) => [activity.id, activity]));
    activities.forEach((activity) => {
      if (JSON.stringify(previous.get(activity.id)) !== JSON.stringify(activity)) syncActivityToSupabase(activity);
    });
  };

  // Award handlers
  const handleAddAward = (award: AwardItem) => {
    setUserProfile((prev) => {
      const next = {
        ...prev,
        awards: [...prev.awards, award]
      };
      triggerAutoSave(next);
      return next;
    });
    syncHonorToSupabase(award);
  };

  const handleDeleteAward = (id: string) => {
    setUserProfile((prev) => {
      const next = {
        ...prev,
        awards: prev.awards.filter((a) => a.id !== id)
      };
      triggerAutoSave(next);
      return next;
    });
    removeHonorFromSupabase(id);
  };

  // Checklist handler in Results
  const handleToggleStep = (stepId: string) => {
    setAnalysisResult((prev) => ({
      ...prev,
      immediateNextSteps: prev.immediateNextSteps.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    }));
  };

  const handleAddCustomStep = (text: string) => {
    setAnalysisResult((prev) => ({
      ...prev,
      immediateNextSteps: [
        ...prev.immediateNextSteps,
        { id: `step-${Date.now()}`, text, completed: false }
      ]
    }));
  };

  // Core AI Analysis runner
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    let finalAnalysis: AnalysisResult = INITIAL_ANALYSIS_RESULT;
    try {
      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: await getApiHeaders(),
        body: JSON.stringify({ profile: userProfile })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis && userProfile.activities.length > 0) {
          finalAnalysis = data.analysis;
          setAnalysisResult(data.analysis);
        } else {
          // Fallback to local heuristic evaluation engine
          finalAnalysis = computeLocalAnalysis(userProfile);
          setAnalysisResult(finalAnalysis);
        }
      } else {
        finalAnalysis = computeLocalAnalysis(userProfile);
        setAnalysisResult(finalAnalysis);
      }
    } catch (err) {
      console.warn('Backend call failed, using local model:', err);
      finalAnalysis = computeLocalAnalysis(userProfile);
      setAnalysisResult(finalAnalysis);
    } finally {
      setIsAnalyzing(false);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');

      // Compute latest snapshot metrics
      const leadershipCount = userProfile.activities.filter((a) => a.isLeadership || a.tier <= 2).length;
      const leadershipScore = Math.min(96, Math.max(50, 60 + leadershipCount * 8));
      const awardsScore = Math.min(95, Math.max(45, 55 + userProfile.awards.length * 12));
      const parsedSat = parseInt(userProfile.satScore, 10);
      let testingScore = 78;
      if (!isNaN(parsedSat) && parsedSat > 0) {
        testingScore = Math.min(99, Math.max(50, Math.round(((parsedSat - 1100) / 500) * 45 + 54)));
      }
      const overallScore = Math.round(
        (finalAnalysis.academicRigorScore +
          finalAnalysis.extracurricularDepthScore +
          leadershipScore +
          awardsScore +
          finalAnalysis.narrativeCohesionScore +
          testingScore) / 6
      );

      const newSnapshot = {
        id: `eval-${Date.now()}`,
        date: 'Current (Aug 2026)',
        timestamp: Date.now(),
        overallScore,
        academicRigorScore: finalAnalysis.academicRigorScore,
        extracurricularDepthScore: finalAnalysis.extracurricularDepthScore,
        narrativeCohesionScore: finalAnalysis.narrativeCohesionScore,
        leadershipScore,
        honorsScore: awardsScore,
        testingReadinessScore: testingScore,
        benchmarkTargetScore: 88,
        keyMilestoneEvent: `Updated Analysis: ${finalAnalysis.spikeCategory || 'Admissions Audit'}`,
        overallRating: finalAnalysis.overallRating,
        notes: finalAnalysis.aiInsight ? finalAnalysis.aiInsight.slice(0, 110) + '...' : 'Audited profile updates.'
      };

      setUserProfile((prev) => {
        const existingHistory = prev.analysisHistory || [];
        const filtered = existingHistory.filter((h) => !h.date.includes('Current'));
        const next = {
          ...prev,
          lastAnalyzedDate: 'Just now',
          analysisHistory: [...filtered, newSnapshot]
        };
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save updated history:', e);
        }
        return next;
      });
      setActiveScreen('results');
    }
  };

  const isProfileIncomplete =
    !userProfile.unweightedGpa ||
    !userProfile.intendedMajor ||
    !userProfile.graduationYear;
  const showProfileGate = isProfileIncomplete && activeScreen !== 'builder' && activeScreen !== 'admin';

  return (
    <CoachChatProvider key={currentUser?.id || 'guest'} userProfile={userProfile} analysis={analysisResult} storageScope={currentUser?.id || 'guest'}>
      <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex flex-col font-sans relative selection:bg-indigo-500/30 selection:text-white">
        {syncError && <div role="alert" className="fixed bottom-4 left-4 right-4 z-[100] rounded-xl bg-amber-950 border border-amber-500 p-4 text-amber-100">
          {syncError}<button className="ml-4 underline" onClick={() => setSyncError(null)}>Dismiss</button>
        </div>}
        {/* Global Ambient Glow Orbs for Frosted Glass depth */}
        <div className="fixed top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none -z-10 animate-float"></div>
        <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none -z-10 animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="fixed top-[40%] right-[20%] w-[450px] h-[450px] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none -z-10"></div>

        {/* If Landing view is selected, render full Landing page with top nav */}
        {activeScreen === 'landing' ? (
          <LandingView
            onNavigate={handleNavigate}
            onOpenUpgrade={() => setIsUpgradeOpen(true)}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            hasUnsavedChanges={hasUnsavedChanges}
            saveStatus={saveStatus}
            onReanalyze={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
          />
        ) : activeScreen === 'auth' ? (
          <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
            <LandingView
              onNavigate={handleNavigate}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              hasUnsavedChanges={hasUnsavedChanges}
              saveStatus={saveStatus}
              onReanalyze={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
            />
            <div className="fixed inset-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-2xl overflow-y-auto pt-10 pb-16">
              <AuthView
                onNavigate={handleNavigate}
                currentUser={currentUser}
                onUserChange={handleUserChange}
                pendingScreen={pendingScreen}
              />
            </div>
          </div>
        ) : (
          /* App View with Side Navigation */
          <div className="flex h-screen overflow-hidden bg-[#0a0a0f]/90 relative">
            {/* Desktop Left Sidebar */}
            <Sidebar
              currentScreen={activeScreen}
              onNavigate={handleNavigate}
              userProfile={userProfile}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              isAdmin={isAdminUser}
            />

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
              <div className="md:hidden fixed inset-0 top-14 z-50 bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-white/10 p-6 space-y-3.5 flex flex-col overflow-y-auto">
                <button
                  onClick={() => {
                    setActiveScreen('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all ${
                    activeScreen === 'dashboard' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveScreen('coach');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all flex items-center justify-between ${
                    activeScreen === 'coach' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/25 shadow-lg' : 'text-indigo-300 hover:text-white bg-indigo-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-indigo-400">psychology</span>
                    <span>AI Admissions Coach</span>
                  </div>
                  <span className="text-[9px] bg-indigo-500 text-white font-extrabold uppercase px-1.5 py-0.5 rounded">
                    AI LIVE
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveScreen('colleges');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all flex items-center gap-2 ${
                    activeScreen === 'colleges' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-indigo-400">school</span>
                  <span>Target Universities</span>
                </button>
                <button
                  onClick={() => {
                    setActiveScreen('builder');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all ${
                    activeScreen === 'builder' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Profile Builder
                </button>
                <button
                  onClick={() => {
                    setActiveScreen('activities');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all ${
                    activeScreen === 'activities' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My Activities
                </button>
                <button
                  onClick={() => {
                    setActiveScreen('results');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all ${
                    activeScreen === 'results' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Results &amp; Spike
                </button>
                {!currentUser && (
                  <button
                    onClick={() => {
                      setActiveScreen('auth');
                      setMobileMenuOpen(false);
                    }}
                    className="p-3 rounded-xl text-left font-semibold transition-all flex items-center gap-2 text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px] text-indigo-400">
                      login
                    </span>
                    <span>Sign In / Register</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveScreen('settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left font-semibold transition-all ${
                    activeScreen === 'settings' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Settings
                </button>
                {isAdminUser && (
                  <button
                    onClick={() => {
                      setActiveScreen('admin');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl text-left font-semibold transition-all flex items-center gap-2 ${
                      activeScreen === 'admin' ? 'glass-pill text-white font-bold border-indigo-500/40 bg-indigo-500/20' : 'text-indigo-200 hover:text-white bg-indigo-500/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-indigo-300">admin_panel_settings</span>
                    <span>Admin Panel</span>
                  </button>
                )}
                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => {
                      setIsUpgradeOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 glass-btn-primary font-bold rounded-xl"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            )}

            {/* Right Container: Global In-App Header + Main Content View */}
            <div className="flex-1 flex flex-col h-full ml-0 md:ml-56 overflow-hidden relative">
              {/* Global In-App Header Bar */}
              <header className="h-14 shrink-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-7 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
                {/* Left: Mobile Brand / Desktop Breadcrumb Path */}
                <div className="flex items-center gap-3">
                  <div
                    className="md:hidden flex items-center gap-2 cursor-pointer"
                    onClick={() => handleNavigate('landing')}
                  >
                    <span className="text-[19px] font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Caliber
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-[13px] select-none">
                    <span className="material-symbols-outlined text-[17px] text-indigo-400">
                      {getScreenIcon(activeScreen)}
                    </span>
                    <span className="text-slate-500 font-medium">Caliber</span>
                    <span className="text-slate-600 font-semibold">/</span>
                    <span className="text-white font-semibold">
                      {getScreenTitle(activeScreen)}
                    </span>
                  </div>
                </div>

                {/* Right: Real-Time Changes Saved / Saving Indicator & Mobile Menu Toggle */}
                <div className="flex items-center gap-3">
                  <SaveStatusIndicator
                    saveStatus={saveStatus}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onReanalyze={handleRunAnalysis}
                    isAnalyzing={isAnalyzing}
                  />

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    aria-label="Toggle Navigation Menu"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {mobileMenuOpen ? 'close' : 'menu'}
                    </span>
                  </button>
                </div>
              </header>

              {/* Main Content Area */}
              <main className="flex-1 h-full overflow-y-auto bg-transparent">
                {activeScreen === 'dashboard' && (
                  <DashboardView
                    userProfile={userProfile}
                    analysis={analysisResult}
                    onNavigate={handleNavigate}
                    onUpdateProfile={handleUpdateProfile}
                    onReanalyze={handleRunAnalysis}
                    isAnalyzing={isAnalyzing}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onOpenContextNotes={() => setIsContextNotesOpen(true)}
                    onOpenReviewDrafts={() => setIsReviewDraftsOpen(true)}
                  />
                )}

                {activeScreen === 'coach' && (
                  <AdmissionsCoachView
                    userProfile={userProfile}
                    analysis={analysisResult}
                    onNavigate={handleNavigate}
                    onOpenContextNotes={() => setIsContextNotesOpen(true)}
                  />
                )}

                {activeScreen === 'colleges' && (
                  <UniversitiesView
                    userProfile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeScreen === 'builder' && (
                  <ProfileBuilderView
                    userProfile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                    onNavigate={handleNavigate}
                    onRunAnalysis={handleRunAnalysis}
                    isAnalyzing={isAnalyzing}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onOpenAddActivity={() => setIsAddActivityOpen(true)}
                    onOpenAddAward={() => setIsAddAwardOpen(true)}
                    onDeleteActivity={handleDeleteActivity}
                    onDeleteAward={handleDeleteAward}
                  />
                )}

                {activeScreen === 'results' && (
                  <ResultsView
                    userProfile={userProfile}
                    analysis={analysisResult}
                    onNavigate={handleNavigate}
                    onToggleStep={handleToggleStep}
                    onAddCustomStep={handleAddCustomStep}
                  />
                )}

                {activeScreen === 'activities' && (
                  <ActivitiesView
                    userProfile={userProfile}
                    onUpdateActivities={handleUpdateActivities}
                    onOpenAddActivity={() => setIsAddActivityOpen(true)}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeScreen === 'settings' && (
                  <SettingsView
                    userProfile={userProfile}
                    currentUser={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                    onAccountChange={handleAccountChange}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeScreen === 'admin' && isAdminUser && <AdminPanel />}
              </main>

            {/* Profile completion gate — shown on all screens except builder */}
            {showProfileGate && (
              <ProfileGateOverlay onNavigateToBuilder={() => handleNavigate('builder')} />
            )}
            </div>

            {/* Floating AI Coach Quick Access Widget appears after the profile is started. */}
            {!isProfileIncomplete && (
              <FloatingCoachWidget
                key={currentUser?.id || 'guest'}
                currentScreen={activeScreen}
                onNavigate={handleNavigate}
                userProfile={userProfile}
                analysis={analysisResult}
                username={currentUser?.username || currentUser?.name}
              />
            )}
          </div>
        )}

        {/* Interactive Modals */}
        <AddActivityModal
          isOpen={isAddActivityOpen}
          onClose={() => setIsAddActivityOpen(false)}
          onAdd={handleAddActivity}
        />

        <AddAwardModal
          isOpen={isAddAwardOpen}
          onClose={() => setIsAddAwardOpen(false)}
          onAdd={handleAddAward}
        />

        <ContextNotesModal
          isOpen={isContextNotesOpen}
          onClose={() => setIsContextNotesOpen(false)}
          currentNotes={userProfile.contextNotes}
          onSave={(notes) => handleUpdateProfile({ contextNotes: notes })}
        />

        <ReviewDraftsModal
          isOpen={isReviewDraftsOpen}
          onClose={() => setIsReviewDraftsOpen(false)}
        />

        <UpgradeModal
          isOpen={isUpgradeOpen}
          onClose={() => setIsUpgradeOpen(false)}
        />
      </div>
    </CoachChatProvider>
  );
}
