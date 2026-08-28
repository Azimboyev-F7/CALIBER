import React, { useState } from 'react';
import { ActiveScreen, AuthUser } from '../types';
import { TopNavBar } from './TopNavBar';

interface LandingViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenUpgrade: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenUpgrade,
  currentUser,
  onSignOut
}) => {
  const [demoGpa, setDemoGpa] = useState('3.9');
  const [demoAps, setDemoAps] = useState('8');
  const [demoMajor, setDemoMajor] = useState('Computer Science');

  return (
    <div className="bg-[#0a0a0f] text-[#f1f5f9] flex flex-col min-h-screen relative overflow-hidden">
      <TopNavBar
        onNavigate={onNavigate}
        onOpenPricing={onOpenUpgrade}
        currentUser={currentUser}
        onSignOut={onSignOut}
      />


      <main className="flex-grow relative">
        {/* Hero Section */}
        <section className="relative pt-12 md:pt-20 pb-16 overflow-hidden">
          {/* Decorative background frosted glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] md:w-[750px] h-[550px] md:h-[750px] bg-gradient-to-br from-indigo-500/15 via-purple-500/12 to-pink-500/8 rounded-full blur-[120px] -z-10 pointer-events-none animate-breathe origin-top"></div>

          <div className="max-w-[1050px] mx-auto px-5 text-center relative z-10">
            <h1 className="text-[32px] sm:text-[40px] md:text-[50px] font-extrabold text-white max-w-3xl mx-auto leading-[1.18] tracking-tight mb-4">
              Get an honest read on your{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                college profile
              </span>
            </h1>

            <p className="text-[15px] md:text-[16.5px] text-slate-300 max-w-xl mx-auto mb-7 leading-relaxed font-normal">
              A structured, AI-powered analysis of your academic and extracurricular profile to help you stand out.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <button
                onClick={() => onNavigate('auth')}
                className="w-full sm:w-auto glass-btn-primary font-bold text-[14px] px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Get Started
              </button>
              
              <a
                href="#how-it-works"
                className="w-full sm:w-auto glass-btn-secondary font-semibold text-[14px] px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-indigo-400">play_circle</span>
                See How It Works
              </a>
            </div>

            {/* Immersive Dashboard Showcase */}
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-purple-500/10 rounded-2xl blur-2xl -z-10 transform scale-105"></div>
              <div className="glass-panel rounded-2xl p-2.5 md:p-4 w-full relative shadow-[0_12px_36px_rgba(0,0,0,0.45)] border border-white/15">
                {/* Browser-like header */}
                <div className="flex items-center justify-between mb-2.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80"></div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-0.5 rounded-full border border-white/10 hidden sm:block">
                    profilelens.ai/app/dashboard
                  </div>
                  <div className="w-10"></div>
                </div>

                <div 
                  onClick={() => onNavigate('dashboard')} 
                  className="overflow-hidden rounded-xl shadow-xl border border-white/10 cursor-pointer relative group"
                >
                  <img
                    alt="College admissions dashboard mockup showing standout profile strength and university matches"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw6B4gJHOlbYDfR2YiJNAPGXJ3nP48Dou9cl4y41XXG6dbdVdbYv0RAStM8s3t1NNSZeaQFE4xYIo9uOwMA7c0DGqtD0iKYaCgk4XXPrnfPPpsFXaplQgnum2aqWMxXTqSoie1iFWZcPk0qVBVmxfE8d-jA3zmdsWBeFnRN9f-Q8CJM3cL_8TCqxiIJRaAuMqCvRPSPL7gHINhJp7CVCYlQ7ruC4lUNI0kkvcbVTw6voyCMzorJjwC"
                  />
                  <div className="absolute inset-0 bg-[#0a0a0f]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="glass-btn-primary font-bold px-5 py-2.5 rounded-xl text-[13px] shadow-xl">
                      Open Live Dashboard →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-8 bg-white/[0.02] backdrop-blur-md border-y border-white/10">
          <div className="max-w-[1050px] mx-auto px-5 text-center">
            <p className="text-[11.5px] text-slate-400 font-bold tracking-[0.2em] uppercase mb-5">
              Trusted by students aiming for
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-75 hover:opacity-100 transition-opacity duration-300">
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                MIT
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                HARVARD
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                STANFORD
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                YALE
              </div>
              <div className="text-[18px] md:text-[22px] font-serif font-black text-white tracking-tight hover:text-indigo-400 transition-colors">
                OXFORD
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Bento Grid Style) */}
        <section id="how-it-works" className="py-16 relative overflow-hidden">
          <div className="max-w-[1050px] mx-auto px-5">
            <div className="text-center mb-12">
              <h2 className="text-[26px] md:text-[36px] font-extrabold text-white mb-2.5 tracking-tight">
                The Journey to Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Dream</span>
              </h2>
              <p className="text-[14.5px] text-slate-400 max-w-xl mx-auto">
                A clear, data-driven path from where you are to where you belong.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div 
                onClick={() => onNavigate('builder')}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="h-36 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800"
                    alt="University campus vision"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
                  <div className="absolute bottom-2.5 left-3.5">
                    <span className="glass-pill text-[10px] font-bold text-indigo-300 tracking-widest uppercase px-2 py-0.5 rounded-md">
                      Step 01
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[16px] text-white mb-1.5 hover:text-indigo-400 transition-colors">
                    Define Profile
                  </h3>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed">
                    Input your GPA, standardized test scores, AP counts, and intended major target.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div 
                onClick={() => onNavigate('activities')}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="h-36 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1541339907198-e08756eaa589?auto=format&fit=crop&q=80&w=800"
                    alt="Strategic planning"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
                  <div className="absolute bottom-2.5 left-3.5">
                    <span className="glass-pill text-[10px] font-bold text-indigo-300 tracking-widest uppercase px-2 py-0.5 rounded-md">
                      Step 02
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[16px] text-white mb-1.5 hover:text-indigo-400 transition-colors">
                    Activities &amp; Honors
                  </h3>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed">
                    Categorize and tier your extracurricular commitments and leadership roles.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div 
                onClick={() => onNavigate('results')}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="h-36 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                    alt="Student success"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
                  <div className="absolute bottom-2.5 left-3.5">
                    <span className="glass-pill text-[10px] font-bold text-indigo-300 tracking-widest uppercase px-2 py-0.5 rounded-md">
                      Step 03
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[16px] text-white mb-1.5 hover:text-indigo-400 transition-colors">
                    Spike Diagnostic
                  </h3>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed">
                    Uncover your narrative archetype, academic rigor percentile, and profile gaps.
                  </p>
                </div>
              </div>

              {/* Step 4 - Essential AI Admissions Coach */}
              <div 
                onClick={() => onNavigate('coach')}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer border-2 border-indigo-500/50 bg-gradient-to-b from-indigo-950/40 to-transparent"
              >
                <div className="h-36 overflow-hidden relative bg-indigo-900/30 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/30">
                    <span className="material-symbols-outlined text-[32px] animate-pulse">psychology</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
                  <div className="absolute bottom-2.5 left-3.5 flex items-center gap-1.5">
                    <span className="bg-indigo-500 text-white text-[9.5px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-md shadow-sm">
                      Essential
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold">24/7 AI Coach</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[16px] text-white mb-1.5 hover:text-indigo-400 transition-colors flex items-center gap-1">
                    Admissions Coach
                  </h3>
                  <p className="text-[12.5px] text-slate-300 leading-relaxed">
                    Ask questions, refine Common App essay hooks, and upgrade activity descriptions live with Gemini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Quick Try Section */}
        <section id="features" className="py-12 relative">
          <div className="max-w-[900px] mx-auto px-5">
            <div className="glass-panel p-6 md:p-8 rounded-2xl text-center relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-400 mb-1.5 block">
                Instant Calibration
              </span>
              <h3 className="text-[22px] md:text-[26px] font-bold text-white mb-2">
                Ready to evaluate your admissions odds?
              </h3>
              <p className="text-slate-300 max-w-lg mx-auto mb-6 text-[14px]">
                Enter your target numbers to see where your application spike currently sits on the national curve.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-xl mx-auto mb-5 text-left">
                <div>
                  <label className="block text-[12px] text-slate-300 font-medium mb-1">Unweighted GPA</label>
                  <input 
                    type="text" 
                    value={demoGpa}
                    onChange={(e) => setDemoGpa(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-slate-300 font-medium mb-1">AP / IB Classes</label>
                  <input 
                    type="number" 
                    value={demoAps}
                    onChange={(e) => setDemoAps(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-slate-300 font-medium mb-1">Target Major</label>
                  <select 
                    value={demoMajor}
                    onChange={(e) => setDemoMajor(e.target.value)}
                    className="input-minimal w-full px-3 py-2 text-[13px] bg-[#0a0a0f]"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business / Finance">Business / Finance</option>
                    <option value="Pre-Med / Biology">Pre-Med / Biology</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => onNavigate(currentUser ? 'builder' : 'auth')}
                className="glass-btn-primary font-bold text-[13px] px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Launch Profile Assessment →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/[0.02] backdrop-blur-xl border-t border-white/10 py-8 mt-auto">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[16px] font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            ProfileLens
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => alert('ProfileLens respects student privacy. All inputs are stored locally in session or encrypted.')}
              className="text-[13px] text-slate-400 hover:text-white hover:underline transition-all"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => alert('ProfileLens Terms of Service: Admissions evaluations are advisory models.')}
              className="text-[13px] text-slate-400 hover:text-white hover:underline transition-all"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => alert('Contact our admissions advisory team: contact@profilelens.ai')}
              className="text-[13px] text-slate-400 hover:text-white hover:underline transition-all"
            >
              Contact
            </button>
          </div>
          <div className="text-[13px] text-slate-500">
            © 2026 ProfileLens. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
