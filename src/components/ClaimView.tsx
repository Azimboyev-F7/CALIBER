import React from 'react';
import { setPendingClaimCode } from '../utils/proClaim';

// Page the webinar QR code opens (/claim?code=...). Uzbek, Latin script.
export const ClaimView: React.FC = () => {
  const code = new URLSearchParams(window.location.search).get('code')?.trim() || '';

  const start = () => {
    setPendingClaimCode(code);
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen min-h-dvh bg-[#0a0a0f] text-[#f1f5f9] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-purple-600/15 blur-[150px] pointer-events-none" />

      <main className="glass-modal max-w-md w-full p-7 md:p-8 space-y-6 text-center shadow-2xl relative">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-indigo-400 text-[24px]">workspace_premium</span>
          <span className="text-[15px] font-bold tracking-wide text-white">Caliber Pro</span>
        </div>

        {code ? (
          <>
            <div className="space-y-2">
              <h1 className="text-[26px] leading-tight font-extrabold text-white">Tabriklaymiz! 🎉</h1>
              <p className="text-[14px] text-slate-300 leading-relaxed">
                Webinarni oxirigacha ko&apos;rganingiz uchun sovg&apos;a: Caliber Pro obunasi siz uchun bepul.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-400/40 bg-gradient-to-b from-indigo-500/20 to-transparent py-5 px-4">
              <div className="flex items-end justify-center gap-4">
                <span className="text-[30px] font-bold text-slate-400 line-through decoration-rose-400 decoration-[3px]">$27</span>
                <span className="text-[56px] leading-none font-extrabold text-white">$0</span>
              </div>
              <p className="text-[12.5px] text-indigo-200 mt-3">3 oy davomida to&apos;liq Pro imkoniyatlari</p>
            </div>

            <button onClick={start} className="w-full py-3.5 glass-btn-primary font-bold rounded-xl text-[15px] cursor-pointer">
              Pro&apos;ni bepul olish
            </button>
            <p className="text-[12.5px] text-slate-400 leading-relaxed">
              Davom etish uchun Caliber hisobingizga kiring yoki ro&apos;yxatdan o&apos;ting. Pro hisobingizga avtomatik qo&apos;shiladi.
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-[14px] text-slate-300">Havola yaroqsiz yoki muddati tugagan.</p>
            <a href="/" className="inline-block text-[13px] font-semibold text-indigo-300 underline underline-offset-2">Caliber&apos;ga o&apos;tish</a>
          </div>
        )}
      </main>
    </div>
  );
};
