import React from 'react';

export const TERMS_VERSION = '2026-11-07';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Advisory use only',
    body: 'Caliber provides AI-assisted estimates of admissions standing and Reach, Target and Safety university categories. These are advisory models. They are not predictions or guarantees of admission, and they do not replace advice from your school counselor.',
  },
  {
    title: '2. Your account',
    body: 'You must provide accurate information and keep your password secure. You are responsible for activity under your account. If you are under 18, you confirm that a parent or guardian is aware you are using Caliber.',
  },
  {
    title: '3. Data we process',
    body: 'To operate Caliber we process the profile information you enter (such as GPA, test scores, intended major, activities and honors) and the results Caliber generates for you. Profile details are stored in your browser, and activities and honors are synced to your account.',
  },
  {
    title: '4. Anonymous use for research',
    body: (
      <>
        By creating an account you agree that Caliber may use your profile inputs and the resulting recommendations
        in <strong>anonymized</strong> form for research about college admissions guidance, including academic papers
        and aggregate statistics. Anonymized records contain academic and activity measures (for example GPA, test
        scores, intended major, counts and tiers of activities and honors) and the universities recommended. They do{' '}
        <strong>not</strong> contain your name, email, username, school name, free-text notes or descriptions, or
        device identifiers, and they are linked to you only by a one-way code that cannot be reversed to identify
        you. Research results are reported in aggregate or as unidentifiable examples.
      </>
    ),
  },
  {
    title: '5. Your choices',
    body: 'If you do not agree to these Terms you cannot create an account. To stop your future activity from being included in research, or to ask about your data, contact us at the address below and we will act on a reasonable request. Records that have already been anonymized cannot be traced back to you and therefore cannot be individually removed.',
  },
  {
    title: '6. Changes',
    body: 'We may update these Terms. Material changes will be shown in the app, and the version date above will change.',
  },
  {
    title: '7. Contact',
    body: 'contact@caliber.ai',
  },
];

export const TermsView: React.FC = () => (
  <div className="min-h-screen bg-[#0a0a0f] text-slate-200 px-4 py-10">
    <div className="max-w-2xl mx-auto space-y-6">
      <a href="/" className="text-[12.5px] text-indigo-400 hover:text-indigo-300 font-semibold">← Back to Caliber</a>
      <div>
        <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Version {TERMS_VERSION}</p>
      </div>
      {sections.map((s) => (
        <section key={s.title} className="space-y-1.5">
          <h2 className="text-base font-bold text-white">{s.title}</h2>
          <p className="text-[13.5px] leading-relaxed text-slate-300">{s.body}</p>
        </section>
      ))}
    </div>
  </div>
);
