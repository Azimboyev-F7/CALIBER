import React, { useState } from 'react';

interface ContextNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNotes: string;
  onSave: (notes: string) => void;
}

export const ContextNotesModal: React.FC<ContextNotesModalProps> = ({
  isOpen,
  onClose,
  currentNotes,
  onSave
}) => {
  const [notes, setNotes] = useState(currentNotes);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-modal max-w-md w-full p-5 md:p-6 space-y-4 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">note_add</span>
            <h3 className="text-[16px] font-bold text-white">Add Context &amp; Narrative Notes</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <p className="text-[12.5px] text-slate-300">
            Provide context on family circumstances, unusual school constraints, or the core philosophical question driving your academic spike.
          </p>

          <div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. My robotics programming and debate work both stem from my fascination with algorithmic fairness in assistive technology..."
              className="input-minimal w-full p-3 text-[13px] leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[12px] text-slate-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 glass-btn-primary font-bold rounded-xl text-[12px] cursor-pointer"
            >
              Save Context Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
