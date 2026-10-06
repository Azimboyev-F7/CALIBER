import React from 'react';
import { motion, type Variants } from 'motion/react';
import { ActiveScreen, AuthUser } from '../types';
import { TopNavBar } from './TopNavBar';
import DarkVeil from './DarkVeil';
import { CollegeDiscoveryExplorer } from './CollegeDiscoveryExplorer';
import { UniversityHeroBackground } from './UniversityHeroBackground';

interface LandingViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenUpgrade: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  hasUnsavedChanges?: boolean;
  saveStatus?: 'saved' | 'saving';
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenUpgrade,
  currentUser,
  onSignOut,
  hasUnsavedChanges = false,
  saveStatus = 'saved',
  onReanalyze,
  isAnalyzing = false,
}) => {
  // Stagger animation variants for hero container
  const heroContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const heroItemVariants: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: 'easeOut' },
    },
  };

  // University logos for the social proof strip
  const targetUniversities = [
    { name: 'MIT', motto: 'Mens et Manus' },
    { name: 'HARVARD', motto: 'Veritas' },
    { name: 'STANFORD', motto: 'Die Luft der Freiheit' },
    { name: 'YALE', motto: 'Lux et Veritas' },
    { name: 'PRINCETON', motto: 'Dei Sub Numine Viget' },
    { name: 'OXFORD', motto: 'Dominus Illuminatio Mea' },
    { name: 'COLUMBIA', motto: 'In Lumine Tuo' },
  ];

  // 4 Phase Journey Cards
  const phases = [
    {
      phase: 'PHASE 01',
      title: 'Define Profile',
      desc: 'Input your GPA, standardized test scores (SAT/ACT/IELTS), target budget, and intended major.',
      action: 'Build Baseline',
      icon: 'badge',
      screen: 'builder' as ActiveScreen,
      accent: 'from-indigo-500/20 to-indigo-600/5',
      border: 'hover:border-indigo-500/50',
      iconColor: 'text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',
      badgeColor: 'text-slate-500 group-hover:text-indigo-300',
      arrowColor: 'text-indigo-400 group-hover:text-indigo-300',
      glow: 'hover:shadow-[0_12px_30px_rgba(99,102,241,0.25)]',
    },
    {
      phase: 'PHASE 02',
      title: 'Activities & Honors',
      desc: 'Structure and tier extracurriculars, leadership initiatives, competitions, and research projects.',
      action: 'Score Activities',
      icon: 'workspace_premium',
      screen: 'activities' as ActiveScreen,
      accent: 'from-purple-500/20 to-purple-600/5',
      border: 'hover:border-purple-500/50',
      iconColor: 'text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
      badgeColor: 'text-slate-500 group-hover:text-purple-300',
      arrowColor: 'text-purple-400 group-hover:text-purple-300',
      glow: 'hover:shadow-[0_12px_30px_rgba(168,85,247,0.25)]',
    },
    {
      phase: 'PHASE 03',
      title: 'Spike Diagnostic',
      desc: 'Uncover your narrative archetype, Ivy rigor score, vulnerability gaps, and college tier matches.',
      action: 'View Diagnostic',
      icon: 'insights',
      screen: 'results' as ActiveScreen,
      accent: 'from-pink-500/20 to-pink-600/5',
      border: 'hover:border-pink-500/50',
      iconColor: 'text-pink-400 group-hover:bg-pink-500 group-hover:text-white',
      badgeColor: 'text-slate-500 group-hover:text-pink-300',
      arrowColor: 'text-pink-400 group-hover:text-pink-300',
      glow: 'hover:shadow-[0_12px_30px_rgba(244,114,182,0.25)]',
    },
    {
      phase: 'PHASE 04',
      title: 'Admission Coach',
      desc: 'Get instant essay feedback, brainstorm spike initiatives, and refine Common App descriptions.',
      action: 'Chat With Coach',
      icon: 'psychology',
      screen: 'coach' as ActiveScreen,
      accent: 'from-indigo-600/30 to-purple-600/10',
      border: 'border-indigo-500/40 hover:border-indigo-400',
      iconColor: 'text-white bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30',
      arrowColor: 'text-indigo-300 group-hover:text-white',
      glow: 'shadow-[0_4px_25px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.4)]',
      isAi: true,
    },
  ];

  return (
    <div className="bg-[#06020E] text-[#f1f5f9] flex flex-col min-h-screen relative overflow-hidden">
      <TopNavBar
        onNavigate={onNavigate}
        onOpenPricing={onOpenUpgrade}
        currentUser={currentUser}
        onSignOut={onSignOut}
        hasUnsavedChanges={hasUnsavedChanges}
        saveStatus={saveStatus}
        onReanalyze={onReanalyze}
        isAnalyzing={isAnalyzing}
      />

      <main className="flex-grow relative">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <section className="relative pt-12 md:pt-20 pb-16 overflow-hidden">
          <UniversityHeroBackground />

          {/* DarkVeil Animated Background Container */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
          >
            <DarkVeil
              hueShift={0}
              noiseIntensity={0}
              scanlineIntensity={0}
              speed={0.5}
              scanlineFrequency={0}
              warpAmount={0}
            />
            {/* Subtle dot matrix grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          {/* Ambient Floating Gradient Orbs */}
          <motion.div
            animate={{
              x: [-20, 20, -20],
              y: [-15, 20, -15],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] md:w-[750px] h-[550px] md:h-[750px] bg-gradient-to-br from-indigo-500/18 via-purple-500/12 to-pink-500/8 rounded-full blur-[130px] -z-10 pointer-events-none"
          />

          <motion.div
            animate={{
              x: [25, -20, 25],
              y: [20, -15, 20],
              scale: [1.1, 1, 1.1],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-gradient-to-bl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-[110px] -z-10 pointer-events-none"
          />

          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-[1050px] mx-auto px-5 text-center relative z-10"
          >
            {/* Hero Pill Beacon */}
            <motion.div variants={heroItemVariants} className="inline-block mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-[11.5px] font-semibold tracking-wide backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <span>AI Admissions Intelligence · Class of 2026 Calibrated</span>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={heroItemVariants}
              className="text-[34px] sm:text-[44px] md:text-[54px] font-extrabold text-white max-w-3xl mx-auto leading-[1.15] tracking-tight mb-4"
            >
              Get an honest read on your{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  college profile
                </span>
                {/* Subtle radiant underline glow */}
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-70" />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={heroItemVariants}
              className="text-[15.5px] md:text-[17px] text-slate-300 max-w-xl mx-auto mb-7 leading-relaxed font-normal"
            >
              A structured, AI-powered analysis of your academic and extracurricular profile to help you stand out.
            </motion.p>

            {/* CTA Buttons with Spring Physics & Hover Glow */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10"
            >
              <motion.button
                onClick={() => onNavigate('builder')}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  boxShadow: '0 0 35px rgba(99, 102, 241, 0.6)',
                }}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden w-full sm:w-auto glass-btn-primary font-bold text-[14px] px-7 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 group"
              >
                {/* Shimmer sweep effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span>Get Started</span>
                <span className="material-symbols-outlined text-[17px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </motion.button>

              <motion.a
                href="#how-it-works"
                whileHover={{
                  scale: 1.03,
                  y: -2,
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto glass-btn-secondary font-semibold text-[14px] px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[19px] text-indigo-400 group-hover:scale-110 transition-transform">
                  play_circle
                </span>
                <span>See How It Works</span>
              </motion.a>
            </motion.div>

            {/* Floating Value Highlights Bar */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap items-center justify-center gap-3 md:gap-5 text-[12px] md:text-[13px] text-slate-300"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">bolt</span>
                <span>Instant 10-Second Audit</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px] text-indigo-400">military_tech</span>
                <span>Ivy &amp; Top-30 Calibration</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px] text-purple-400">lock</span>
                <span>100% Private &amp; Client-Side</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* COLLEGE DISCOVERY EXPLORER                                               */}
        {/* ========================================================================= */}
        <CollegeDiscoveryExplorer onNavigate={onNavigate} />

        {/* ========================================================================= */}
        {/* SOCIAL PROOF UNIVERSITY LOGO STRIP                                       */}
        {/* ========================================================================= */}
        <section className="py-10 bg-white/[0.02] backdrop-blur-md border-y border-white/10 relative overflow-hidden">
          {/* Subtle horizontal gradient shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent pointer-events-none" />

          <div className="max-w-[1100px] mx-auto px-5 text-center relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11.5px] text-slate-400 font-bold tracking-[0.25em] uppercase mb-6"
            >
              Calibrated for applicant pools at leading universities
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 md:gap-14"
            >
              {targetUniversities.map((uni, idx) => (
                <motion.div
                  key={uni.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  whileHover={{
                    scale: 1.14,
                    y: -3,
                    color: '#a5b4fc',
                    filter: 'drop-shadow(0 0 15px rgba(129, 140, 248, 0.7))',
                  }}
                  className="group cursor-default flex flex-col items-center"
                >
                  <span className="text-[18px] md:text-[22px] font-serif font-black text-slate-300 group-hover:text-indigo-300 tracking-tight transition-colors duration-200">
                    {uni.name}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-sans tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {uni.motto}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4-PHASE JOURNEY ROADMAP                                                   */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-24 relative overflow-hidden">
          {/* Ambient Glows */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.08, 0.16, 0.08],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/15 blur-[140px] pointer-events-none rounded-full"
          />

          <div className="max-w-[1100px] mx-auto px-5 relative z-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-semibold tracking-wider uppercase mb-3.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                End-to-End Admissions Architecture
              </div>
              <h2 className="text-[30px] md:text-[42px] font-extrabold text-white mb-3.5 tracking-tight">
                The Journey to Your{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Dream College
                </span>
              </h2>
              <p className="text-[14.5px] md:text-[16px] text-slate-400 max-w-xl mx-auto leading-relaxed">
                A calibrated, four-phase path designed to highlight your spike and optimize admissions odds at top-tier universities.
              </p>
            </motion.div>

            {/* Connecting Timeline Beam (Desktop) */}
            <div className="hidden lg:block relative mb-8">
              <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500/20 via-purple-500/40 to-indigo-500/20 rounded-full" />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-12 pointer-events-none">
                <span className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                <span className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                <span className="w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-500/20" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
              </div>
            </div>

            {/* Grid of 4 Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {phases.map((item, idx) => (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.6, delay: idx * 0.12, ease: 'easeOut' }}
                  whileHover={{ y: -9, scale: 1.025 }}
                  onClick={() => onNavigate(item.screen)}
                  className={`group relative bg-[#0f101c]/85 hover:bg-[#141628] border border-white/10 ${item.border} rounded-2xl p-5 transition-colors duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${item.glow} flex flex-col justify-between cursor-pointer`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${item.iconColor}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </div>
                      <span className={`text-[11px] font-mono font-bold tracking-widest transition-colors ${item.badgeColor}`}>
                        {item.phase}
                      </span>
                    </div>

                    <h3 className="font-bold text-[17px] text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[12.5px] text-slate-400 leading-relaxed mb-4">
                      {item.desc}
                    </p>
                  </div>

                  <div className={`pt-3 border-t border-white/5 flex items-center justify-between text-[11.5px] font-medium ${item.arrowColor}`}>
                    <span>{item.action}</span>
                    <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1.5 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* THE CALIBER ADVANTAGE COMPARISON                                         */}
        {/* ========================================================================= */}
        <section className="py-16 md:py-20 relative overflow-hidden bg-white/[0.01] border-t border-white/5">
          <div className="max-w-[1050px] mx-auto px-5 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold tracking-widest uppercase mb-3">
                <span className="material-symbols-outlined text-[15px]">diamond</span>
                The Caliber Edge
              </span>
              <h2 className="text-[28px] md:text-[38px] font-extrabold text-white tracking-tight mb-3">
                Why Top Applicants Choose Caliber
              </h2>
              <p className="text-[14px] text-slate-400 leading-relaxed">
                Traditional admissions consulting is expensive and subjective. Caliber brings transparent, data-driven intelligence to every step.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Traditional Route */}
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl bg-[#0c0d18]/80 border border-white/10 p-6 md:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <h3 className="text-[17px] font-bold text-slate-300">Traditional Consulting</h3>
                      <p className="text-[12px] text-slate-500">Outdated &amp; Cost-Prohibitive</p>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center font-bold text-[14px]">
                      ✕
                    </span>
                  </div>

                  <ul className="space-y-3.5 text-[13px] text-slate-400">
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-rose-400 text-[18px] shrink-0 mt-0.5">cancel</span>
                      <span><strong>$5,000 to $15,000+</strong> private counselor retainers.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-rose-400 text-[18px] shrink-0 mt-0.5">cancel</span>
                      <span>Weeks waiting for email feedback on essays and activity lists.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-rose-400 text-[18px] shrink-0 mt-0.5">cancel</span>
                      <span>Subjective opinions that do not model multi-dimensional applicant pools.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-rose-400 text-[18px] shrink-0 mt-0.5">cancel</span>
                      <span>Generic resume advice that blends in with thousands of other applicants.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Caliber Route */}
              <motion.div
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-gradient-to-b from-indigo-950/40 via-[#0d0e20] to-[#0d0e20] border-2 border-indigo-500/40 p-6 md:p-7 flex flex-col justify-between shadow-[0_15px_40px_rgba(99,102,241,0.2)] relative overflow-hidden"
              >
                {/* Subtle top glow line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500" />

                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[17px] font-bold text-white">Caliber AI Intelligence</h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-bold text-indigo-300">
                          PROVEN
                        </span>
                      </div>
                      <p className="text-[12px] text-indigo-300">Continuous 2026 Admissions Modeling</p>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[14px]">
                      ✓
                    </span>
                  </div>

                  <ul className="space-y-3.5 text-[13px] text-slate-200">
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span><strong>Free to start</strong> — instant, accessible admissions intelligence for all students.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span><strong>24/7 AI Admissions Coach</strong> ready with instant essay critique and actionable next steps.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span><strong>Common App 10-Slot Optimizer</strong> that critiques impact verbs and activity tiering.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span><strong>Holistic Spike Analysis</strong> to craft a distinctive personal narrative archetype.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5 mt-5 border-t border-indigo-500/20">
                  <button
                    onClick={() => onNavigate('builder')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-[13px] shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Run Your Diagnostic Now</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FINAL CALL TO ACTION BANNER                                               */}
        {/* ========================================================================= */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-[1000px] mx-auto px-5 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative bg-gradient-to-b from-[#14162e] to-[#0c0d1c] border border-indigo-500/30 rounded-3xl p-8 md:p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3.5 py-1 rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Start Your Admissions Journey Today
              </span>

              <h2 className="text-[30px] md:text-[44px] font-black text-white mb-4 tracking-tight">
                Ready to evaluate your{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  admissions odds?
                </span>
              </h2>

              <p className="text-[15px] md:text-[16.5px] text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
                Take the guess-work out of college admissions. Build your profile, uncover your spike, and optimize your application strategy today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(99, 102, 241, 0.6)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate('builder')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-[14.5px] shadow-[0_6px_25px_rgba(99,102,241,0.4)] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>Launch Free Profile Assessment</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('colleges')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-[14px] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-indigo-400">school</span>
                  <span>Browse Universities</span>
                </motion.button>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-[11.5px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[15px]">check</span>
                  100% Free to Begin
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[15px]">check</span>
                  No Credit Card Required
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[15px]">check</span>
                  Instant AI Diagnostic
                </span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="bg-white/[0.02] backdrop-blur-xl border-t border-white/10 py-9 mt-auto">
        <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="text-[18px] font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Caliber
            </div>
            <span className="text-[11px] text-slate-500 font-medium border-l border-white/10 pl-3">
              College Admissions Intelligence
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-7">
            <button
              onClick={() => alert('Caliber respects student privacy. All inputs are stored locally in session or encrypted.')}
              className="text-[12.5px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => alert('Caliber Terms of Service: Admissions evaluations are advisory models.')}
              className="text-[12.5px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => alert('Contact our admissions advisory team: contact@caliber.ai')}
              className="text-[12.5px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Contact Advisory Team
            </button>
          </div>

          <div className="text-[12px] text-slate-500">
            © 2026 Caliber. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
