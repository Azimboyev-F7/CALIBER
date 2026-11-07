import React, { useState } from 'react';
import { AuthUser } from '../types';
import { acceptTerms, SESSION_EXPIRED_ERROR } from '../lib/supabaseClient';
import { TERMS_VERSION } from './TermsView';

interface Props {
  onAccepted: (user: AuthUser) => void;
  onDecline: () => void;
}

export const TermsAcceptanceModal: React.FC<Props> = ({ onAccepted, onDecline }) => {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checked) return;
    setSaving(true);
    setError(null);
    const { user, error: failure } = await acceptTerms(TERMS_VERSION);
    setSaving(false);
    if (user) onAccepted(user);
    else if (failure === SESSION_EXPIRED_ERROR) onDecline(); // back to the landing page to sign in again
    else setError(failure || 'Could not save your acceptance.');
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="terms-modal-title" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="w-full max-w-md glass-card rounded-2xl p-6 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]">
        <h2 id="terms-modal-title" className="text-xl font-extrabold text-white">Updated Terms of Service</h2>
        <p className="text-[13px] text-slate-300 leading-relaxed">
          We've added Terms of Service. They explain that your profile inputs and Caliber's recommendations may be used
          in anonymized form for research, without your name, email or free-text notes. Please review and accept to continue.
        </p>
        <label className="flex items-start gap-2.5 text-[12.5px] text-slate-300 cursor-pointer">
          <input
            id="terms-modal-checkbox"
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
          />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
              Terms of Service
            </a>
            , including the anonymous use of my profile data for research.
          </span>
        </label>
        {error && <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12.5px]">{error}</div>}
        <div className="flex gap-2">
          <button
            id="terms-modal-accept"
            type="submit"
            disabled={!checked || saving}
            className="flex-1 glass-btn-primary py-2.5 rounded-xl font-bold text-[13.5px] disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Accept and continue'}
          </button>
          <button type="button" onClick={onDecline} className="glass-btn-secondary px-4 py-2.5 rounded-xl font-semibold text-[13px] cursor-pointer">
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
};
