import React, { useEffect, useState } from 'react';
import { clearPendingClaimCode, claimFreePro, formatUzDate, getPendingClaimCode } from '../utils/proClaim';

interface Props {
  userId: string | null;
}

// Redeems a webinar code left by /claim as soon as the student is signed in, and says what happened.
export const ProClaimBanner: React.FC<Props> = ({ userId }) => {
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);

  useEffect(() => {
    const code = getPendingClaimCode();
    if (!userId || !code) return;
    let cancelled = false;
    claimFreePro(code).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        clearPendingClaimCode();
        const until = formatUzDate(result.proUntil);
        setMessage({
          good: true,
          text: result.alreadyClaimed
            ? `Siz Pro'ni allaqachon olgansiz. U ${until} gacha amal qiladi.`
            : `Tabriklaymiz! Caliber Pro faollashtirildi: ${until} gacha bepul.`,
        });
      } else if ('reason' in result && result.reason === 'invalid') {
        clearPendingClaimCode();
        setMessage({ good: false, text: "Havola yaroqsiz yoki muddati tugagan. Iltimos, tashkilotchiga murojaat qiling." });
      }
      // 'unavailable': keep the code and try again on the next visit.
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (!message) return null;
  return (
    <div role="status" className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[calc(100%-2rem)] rounded-xl border px-4 py-3 text-[13px] shadow-2xl backdrop-blur-xl flex items-start gap-3 ${message.good ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-100' : 'bg-amber-950/90 border-amber-400/50 text-amber-100'}`}>
      <span className="flex-1 leading-relaxed">{message.text}</span>
      <button onClick={() => setMessage(null)} aria-label="Yopish" className="text-current opacity-70 hover:opacity-100 cursor-pointer">✕</button>
    </div>
  );
};
