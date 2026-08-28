import React, { useState, useEffect } from 'react';
import { ActiveScreen, ActivityItem, AwardItem, UserProfile, AnalysisResult, AuthUser } from './types';
import { INITIAL_USER_PROFILE, INITIAL_ANALYSIS_RESULT, computeLocalAnalysis } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { ProfileBuilderView } from './components/ProfileBuilderView';
import { ResultsView } from './components/ResultsView';
import { ActivitiesView } from './components/ActivitiesView';
import { AdmissionsCoachView } from './components/AdmissionsCoachView';
import { FloatingCoachWidget } from './components/FloatingCoachWidget';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { AddActivityModal } from './components/AddActivityModal';
import { AddAwardModal } from './components/AddAwardModal';
import { ContextNotesModal } from './components/ContextNotesModal';
import { ReviewDraftsModal } from './components/ReviewDraftsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { CoachChatProvider } from './context/CoachChatContext';
import { getStoredAuthUser, signOutUser } from './lib/supabaseClient';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('landing');
  const [pendingScreen, setPendingScreen] = useState<ActiveScreen | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(INITIAL_ANALYSIS_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Central Navigation handler with auth enforcement
  const handleNavigate = (targetScreen: ActiveScreen) => {
    if (!currentUser && targetScreen !== 'landing' && targetScreen !== 'auth') {
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
    if (!currentUser && activeScreen !== 'landing' && activeScreen !== 'auth') {
      setPendingScreen(activeScreen);
      setActiveScreen('auth');
    }
  }, [currentUser, activeScreen]);

  // Sync stored user name if present
  useEffect(() => {
    const stored = getStoredAuthUser();
    if (stored) {
      setCurrentUser(stored);
      if (stored.name) {
        setUserProfile((prev) => ({ ...prev, name: stored.name || prev.name }));
      }
    }
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setActiveScreen('landing');
  };

  const handleUserChange = (user: AuthUser | null) => {
    setCurrentUser(user);
    if (user?.name) {
      setUserProfile((prev) => ({ ...prev, name: user.name || prev.name }));
    }
  };

  // Modals
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false);
  const [isContextNotesOpen, setIsContextNotesOpen] = useState(false);
  const [isReviewDraftsOpen, setIsReviewDraftsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Profile update handler
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
  };

  // Activity handlers
  const handleAddActivity = (activity: ActivityItem) => {
    setUserProfile((prev) => ({
      ...prev,
      activities: [...prev.activities, activity]
    }));
  };

  const handleDeleteActivity = (id: string) => {
    setUserProfile((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== id)
    }));
  };

  const handleUpdateActivities = (activities: ActivityItem[]) => {
    setUserProfile((prev) => ({ ...prev, activities }));
  };

  // Award handlers
  const handleAddAward = (award: AwardItem) => {
    setUserProfile((prev) => ({
      ...prev,
      awards: [...prev.awards, award]
    }));
  };

  const handleDeleteAward = (id: string) => {
    setUserProfile((prev) => ({
      ...prev,
      awards: prev.awards.filter((a) => a.id !== id)
    }));
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
    try {
      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: userProfile })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setAnalysisResult(data.analysis);
        } else {
          // Fallback to local heuristic evaluation engine
          const localResult = computeLocalAnalysis(userProfile);
          setAnalysisResult(localResult);
        }
      } else {
        const localResult = computeLocalAnalysis(userProfile);
        setAnalysisResult(localResult);
      }
    } catch (err) {
      console.warn('Backend call failed, using local model:', err);
      const localResult = computeLocalAnalysis(userProfile);
      setAnalysisResult(localResult);
    } finally {
      setIsAnalyzing(false);
      setUserProfile((prev) => ({
        ...prev,
        lastAnalyzedDate: 'Just now'
      }));
      setActiveScreen('results');
    }
  };

  return (
    <CoachChatProvider userProfile={userProfile} analysis={analysisResult}>
      <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex flex-col font-sans relative selection:bg-indigo-500/30 selection:text-white">
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
          />
        ) : activeScreen === 'auth' ? (
          <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
            <LandingView
              onNavigate={handleNavigate}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              currentUser={currentUser}
              onSignOut={handleSignOut}
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
            />

            {/* Mobile Navigation Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-4">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setActiveScreen('landing')}
              >
                <span className="text-[20px] font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Caliber</span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">
                  {mobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
              <div className="md:hidden fixed inset-0 top-16 z-50 bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-white/10 p-6 space-y-3.5 flex flex-col overflow-y-auto">
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


            {/* Main Content Area */}
            <main className="flex-1 ml-0 md:ml-56 h-full overflow-y-auto bg-transparent pt-14 md:pt-0">
              {activeScreen === 'dashboard' && (
                <DashboardView
                  userProfile={userProfile}
                  analysis={analysisResult}
                  onNavigate={setActiveScreen}
                  onUpdateProfile={handleUpdateProfile}
                  onReanalyze={handleRunAnalysis}
                  isAnalyzing={isAnalyzing}
                  onOpenContextNotes={() => setIsContextNotesOpen(true)}
                  onOpenReviewDrafts={() => setIsReviewDraftsOpen(true)}
                />
              )}

              {activeScreen === 'coach' && (
                <AdmissionsCoachView
                  userProfile={userProfile}
                  analysis={analysisResult}
                  onNavigate={setActiveScreen}
                  onOpenContextNotes={() => setIsContextNotesOpen(true)}
                />
              )}

              {activeScreen === 'builder' && (
                <ProfileBuilderView
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onNavigate={setActiveScreen}
                  onRunAnalysis={handleRunAnalysis}
                  isAnalyzing={isAnalyzing}
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
                  onNavigate={setActiveScreen}
                  onToggleStep={handleToggleStep}
                  onAddCustomStep={handleAddCustomStep}
                />
              )}

              {activeScreen === 'activities' && (
                <ActivitiesView
                  userProfile={userProfile}
                  onUpdateActivities={handleUpdateActivities}
                  onOpenAddActivity={() => setIsAddActivityOpen(true)}
                  onNavigate={setActiveScreen}
                />
              )}

              {activeScreen === 'settings' && (
                <SettingsView
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onNavigate={setActiveScreen}
                />
              )}
            </main>

            {/* Floating AI Coach Quick Access Widget */}
            <FloatingCoachWidget
              currentScreen={activeScreen}
              onNavigate={setActiveScreen}
              userProfile={userProfile}
              analysis={analysisResult}
            />
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
