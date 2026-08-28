import React, { useState } from 'react';
import { ActivityCategory, ActivityItem } from '../types';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: ActivityItem) => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('STEM');
  const [hoursPerWeek, setHoursPerWeek] = useState(6);
  const [isLeadership, setIsLeadership] = useState(false);
  const [tier, setTier] = useState<1 | 2 | 3 | 4>(2);
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState<'tertiary' | 'secondary' | 'primary'>('tertiary');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: title.trim(),
      role: role.trim() || 'Member',
      category,
      hoursPerWeek: Number(hoursPerWeek) || 5,
      isLeadership,
      tier,
      description: description.trim(),
      accentColor
    };

    onAdd(newActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-modal max-w-md w-full p-5 md:p-6 space-y-4 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">add_circle</span>
            <h3 className="text-[16px] font-bold text-white">Add New Extracurricular</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-[12px] text-slate-300 font-medium mb-1">
              Activity Name / Organization
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Model United Nations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-minimal w-full px-3 py-2 text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-slate-300 font-medium mb-1">
                Your Position / Role
              </label>
              <input
                type="text"
                placeholder="e.g. President / Captain"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-minimal w-full px-3 py-2 text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] text-slate-300 font-medium mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="input-minimal w-full px-3 py-2 text-[13px] bg-[#0a0a0f] text-white cursor-pointer"
              >
                <option value="Speech & Debate">Speech & Debate</option>
                <option value="STEM">STEM</option>
                <option value="Community Service">Community Service</option>
                <option value="Athletics">Athletics</option>
                <option value="Arts & Music">Arts & Music</option>
                <option value="Academic Club">Academic Club</option>
                <option value="Work / Internship">Work / Internship</option>
                <option value="Student Government">Student Government</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-slate-300 font-medium mb-1">
                Hours per Week
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="input-minimal w-full px-3 py-2 text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] text-slate-300 font-medium mb-1">
                Accent Highlight Color
              </label>
              <select
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value as any)}
                className="input-minimal w-full px-3 py-2 text-[13px] bg-[#0a0a0f] text-white cursor-pointer"
              >
                <option value="tertiary">Amber / Gold</option>
                <option value="secondary">Slate / Silver</option>
                <option value="primary">Electric Indigo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="leadershipCheck"
              checked={isLeadership}
              onChange={(e) => setIsLeadership(e.target.checked)}
              className="rounded text-indigo-400 focus:ring-indigo-400 w-3.5 h-3.5 bg-white/10"
            />
            <label htmlFor="leadershipCheck" className="text-[12px] text-slate-200 font-medium cursor-pointer">
              Mark as Leadership / Officer Position
            </label>
          </div>

          <div>
            <label className="block text-[12px] text-slate-300 font-medium mb-1">
              Short Description / Key Accomplishments (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Led team of 15; organized annual conference with 200+ attendees."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-minimal w-full p-2.5 text-[12px]"
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
              Add Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
