import React, { useState } from 'react';
import { AwardItem } from '../types';

interface AddAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (award: AwardItem) => void;
}

export const AddAwardModal: React.FC<AddAwardModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<'National' | 'International' | 'State' | 'Regional' | 'School'>('State');
  const [year, setYear] = useState('2025');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAward: AwardItem = {
      id: `awd-${Date.now()}`,
      title: title.trim(),
      level,
      year
    };

    onAdd(newAward);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-modal max-w-md w-full p-5 md:p-6 space-y-4 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">emoji_events</span>
            <h3 className="text-[16px] font-bold text-white">Add Award or Honor</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-[12px] text-slate-300 font-medium mb-1">
              Honor / Award Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. USAMO Qualifier / AP Scholar with Distinction"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-minimal w-full px-3 py-2 text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-slate-300 font-medium mb-1">
                Level of Recognition
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="input-minimal w-full px-3 py-2 text-[13px] bg-[#0a0a0f] text-white cursor-pointer"
              >
                <option value="National">National</option>
                <option value="International">International</option>
                <option value="State">State</option>
                <option value="Regional">Regional</option>
                <option value="School">School</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] text-slate-300 font-medium mb-1">
                Year Received
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-minimal w-full px-3 py-2 text-[13px]"
              />
            </div>
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
              Add Award
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
