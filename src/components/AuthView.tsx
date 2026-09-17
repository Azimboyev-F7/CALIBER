import React, { useState } from 'react';
import { ActiveScreen, AuthUser } from '../types';
import {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  isSupabaseConfigured,
  DEMO_USER
} from '../lib/supabaseClient';

interface AuthViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  currentUser: AuthUser | null;
  onUserChange: (user: AuthUser | null, targetScreen?: ActiveScreen) => void;
  pendingScreen?: ActiveScreen | null;
}

const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  builder: 'Profile Assessment',
  activities: 'Activities & Honors Evaluator',
  results: 'Spike Diagnostic Report',
  coach: 'Admission Coach',
  settings: 'Settings'
};

export const AuthView: React.FC<AuthViewProps> = ({
  onNavigate,
  currentUser,
  onUserChange,
  pendingScreen
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('Computer Science');
  const [highSchool, setHighSchool] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (mode: 'signin' | 'signup' | 'forgot') => {
    setAuthMode(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIdentifier('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setUsername('');
    setHighSchool('');
    setIntendedMajor('Computer Science');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const loginInput = identifier.trim();

    if (!loginInput || !password) {
      setErrorMsg('Please enter your username or email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await signInWithEmail(loginInput, password);
      if (error) {
        setErrorMsg(error);
      } else if (user) {
        const targetScreen = (pendingScreen && pendingScreen !== 'landing' && pendingScreen !== 'auth') ? pendingScreen : 'dashboard';
        const screenTitle = SCREEN_TITLES[targetScreen] || 'Dashboard';
        setSuccessMsg(`Successfully signed in! Opening ${screenTitle}...`);
        onUserChange(user, targetScreen);
        setTimeout(() => {
          onNavigate(targetScreen);
        }, 250);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please provide an email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await signUpWithEmail(email, password, {
        name: fullName,
        username,
        intendedMajor,
        highSchool
      });

      if (error) {
        setErrorMsg(error);
      } else if (user) {
        const targetScreen = (pendingScreen && pendingScreen !== 'landing' && pendingScreen !== 'auth') ? pendingScreen : 'dashboard';
        const screenTitle = SCREEN_TITLES[targetScreen] || 'Dashboard';
        setSuccessMsg(`Account created successfully! Directing to ${screenTitle}...`);
        onUserChange(user, targetScreen);
        setTimeout(() => {
          onNavigate(targetScreen);
        }, 250);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg('Please provide the email associated with your account.');
      return;
    }

    setIsLoading(true);
    try {
      const { success, error } = await resetPassword(email);
      if (error) {
        setErrorMsg(error);
      } else if (success) {
        setSuccessMsg('Check your email for a secure password reset link.');

      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const targetScreen = (pendingScreen && pendingScreen !== 'landing' && pendingScreen !== 'auth') ? pendingScreen : 'dashboard';
    onUserChange(DEMO_USER, targetScreen);
    onNavigate(targetScreen);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Background Accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2 relative">
          <button
            onClick={() => onNavigate('landing')}
            className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[12px]"
            title="Return to Home"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-1 shadow-lg shadow-indigo-500/10">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-white tracking-tight">
            {authMode === 'signin' && 'Welcome to Caliber'}
            {authMode === 'signup' && 'Create Applicant Profile'}
            {authMode === 'forgot' && 'Reset Access Password'}
          </h2>
          <p className="text-[13px] md:text-[14px] text-slate-300">
            {authMode === 'signin' && 'Sign in to access your admissions audit, spike engine, and AI advisor.'}
            {authMode === 'signup' && 'Start diagnosing your Ivy & T20 admissions standing today.'}
            {authMode === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]">
          {/* Pending Target Banner */}
          {pendingScreen && pendingScreen !== 'landing' && pendingScreen !== 'auth' && (
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[12.5px] flex items-center gap-2 animate-fade-in shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-indigo-400 shrink-0">lock</span>
              <span>
                Please log in or create an account to access <strong>{SCREEN_TITLES[pendingScreen] || pendingScreen}</strong>.
              </span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          {authMode !== 'forgot' && (
            <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12.5px] flex items-start gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[17px] shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[12.5px] flex items-start gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[17px] shrink-0 mt-0.5">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                  Username or Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    account_circle
                  </span>
                  <input
                    id="signin-identifier-input"
                    type="text"
                    required
                    placeholder="alexchen or student@example.edu"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-minimal w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11.5px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    lock
                  </span>
                  <input
                    id="signin-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-minimal w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
              </div>

              <button
                id="submit-signin-btn"
                type="submit"
                disabled={isLoading}
                className="w-full glass-btn-primary py-2.5 rounded-xl font-bold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      person
                    </span>
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      placeholder="Alex Chen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-minimal w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      alternate_email
                    </span>
                    <input
                      id="signup-username-input"
                      type="text"
                      placeholder="alexchen"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-minimal w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    mail
                  </span>
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    placeholder="alex@stanford.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-minimal w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                    Target Major
                  </label>
                  <select
                    value={intendedMajor}
                    onChange={(e) => setIntendedMajor(e.target.value)}
                    className="input-minimal w-full px-3 py-2.5 text-[13px] rounded-xl bg-[#0a0a0f] text-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Biomedical Engineering">Biomedical Engineering</option>
                    <option value="Economics & Finance">Economics & Finance</option>
                    <option value="Pre-Med / Biology">Pre-Med / Biology</option>
                    <option value="Political Science">Political Science</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                    High School (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cupertino High"
                    value={highSchool}
                    onChange={(e) => setHighSchool(e.target.value)}
                    className="input-minimal w-full px-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                    Password (min 6)
                  </label>
                  <input
                    id="signup-password-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-minimal w-full px-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirm-password-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-minimal w-full px-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
              </div>

              <button
                id="submit-signup-btn"
                type="submit"
                disabled={isLoading}
                className="w-full glass-btn-primary py-2.5 rounded-xl font-bold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50 mt-3"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="student@example.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-minimal w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 glass-btn-primary py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="glass-btn-secondary px-4 py-2.5 rounded-xl font-semibold text-[13px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative bg-[#0d0d14] px-3 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Or Fast Track
            </span>
          </div>

          {/* Demo 1-Click Login Button */}
          <button
            id="demo-login-btn"
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-400">bolt</span>
            <span>Continue with Demo Student Profile</span>
          </button>

          {/* Supabase connection status */}
          <div className={`flex items-center justify-center gap-1.5 pt-1 text-[11px] font-medium ${isSupabaseConfigured() ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            {isSupabaseConfigured() ? 'Connected to Supabase' : 'Offline mode — accounts saved locally'}
          </div>
        </div>
      </div>
    </div>
  );
};
