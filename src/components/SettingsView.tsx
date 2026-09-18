import React, { useState } from 'react';
import { ActiveScreen, AuthUser, CollegeTarget, UserProfile } from '../types';
import { INITIAL_USER_PROFILE } from '../data/initialData';
import { updateSupabaseAccount } from '../lib/supabaseClient';

interface SettingsViewProps {
  userProfile: UserProfile;
  currentUser: AuthUser | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAccountChange: (updated: AuthUser) => void;
  onNavigate: (screen: ActiveScreen) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  currentUser,
  onUpdateProfile,
  onAccountChange,
}) => {
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCategory, setNewCollegeCategory] = useState<'reach' | 'target' | 'safety'>('reach');
  const [newCollegeRate, setNewCollegeRate] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [accountName, setAccountName] = useState(currentUser?.name || '');
  const [accountUsername, setAccountUsername] = useState(currentUser?.username || '');
  const [accountEmail, setAccountEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  React.useEffect(() => {
    setAccountName(currentUser?.name || '');
    setAccountUsername(currentUser?.username || '');
    setAccountEmail(currentUser?.email || '');
  }, [currentUser?.id, currentUser?.name, currentUser?.username, currentUser?.email]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const name = accountName.trim();
    const username = accountUsername.trim().replace(/^@/, '');
    const email = accountEmail.trim();
    setAccountError(null);

    if (!name || !username || !email) {
      setAccountError('Name, username, and email are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setAccountError('Please enter a valid email address.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setAccountError('Your new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountError('The passwords do not match.');
      return;
    }

    const updates = {
      ...(name !== (currentUser.name || '') ? { name } : {}),
      ...(username !== (currentUser.username || '') ? { username } : {}),
      ...(email.toLowerCase() !== (currentUser.email || '').toLowerCase() ? { email } : {}),
      ...(newPassword ? { password: newPassword } : {}),
    };
    if (Object.keys(updates).length === 0) {
      showToast('No account changes to save.');
      return;
    }

    setIsSavingAccount(true);
    const result = await updateSupabaseAccount(updates);
    setIsSavingAccount(false);
    if (result.error || !result.user) {
      setAccountError(result.error || 'Could not update your account.');
      return;
    }

    onAccountChange(result.user);
    setNewPassword('');
    setConfirmPassword('');
    showToast(result.emailChangePending ? 'Account updated. Confirm your new email address.' : 'Account updated successfully.');
  };

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    const newCollege: CollegeTarget = {
      id: `col-${Date.now()}`,
      name: newCollegeName.trim(),
      category: newCollegeCategory,
      acceptanceRate: newCollegeRate ? `${newCollegeRate}%` : '15%',
      location: 'United States',
      deadline: 'Nov 1 / Jan 5',
      status: 'not_started',
      checklist: [
        { id: `chk-1-${Date.now()}`, label: 'Main Application Profile', completed: false },
        { id: `chk-2-${Date.now()}`, label: 'Supplement Essays', completed: false },
        { id: `chk-3-${Date.now()}`, label: 'Transcripts & Recs Sent', completed: false }
      ]
    };
    onUpdateProfile({
      targetColleges: [...userProfile.targetColleges, newCollege]
    });
    setNewCollegeName('');
    setNewCollegeRate('');
    showToast(`Added ${newCollege.name} to target list!`);
  };

  const handleDeleteCollege = (id: string) => {
    onUpdateProfile({
      targetColleges: userProfile.targetColleges.filter(c => c.id !== id)
    });
  };

  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleResetToDefault = () => {
    onUpdateProfile(INITIAL_USER_PROFILE);
    setIsConfirmingReset(false);
    showToast('Profile inputs reset to sample Alex Student dataset.');
  };

  return (
    <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 text-[#f1f5f9]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 glass-modal text-white font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-up text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-indigo-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-[24px] md:text-[28px] font-extrabold text-white tracking-tight mb-1.5">
          Admissions Strategy &amp; Settings
        </h2>
        <p className="text-[13.5px] md:text-[14.5px] text-slate-300">
          Configure your target college list, admissions cycle dates, and profile preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleSaveAccount} className="glass-card rounded-2xl p-5 md:p-6 space-y-4 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
            <div>
              <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">manage_accounts</span>
                Account Settings
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Update the account details connected to Supabase.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">Name</label>
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="input-minimal w-full px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">Username</label>
                <input type="text" value={accountUsername} onChange={(e) => setAccountUsername(e.target.value)} className="input-minimal w-full px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">Email</label>
                <input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} className="input-minimal w-full px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">New Password</label>
                <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" className="input-minimal w-full px-3 py-2 text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">Confirm New Password</label>
                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-minimal w-full px-3 py-2 text-[13px]" />
              </div>
            </div>

            {accountError && <p className="text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{accountError}</p>}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={isSavingAccount} className="px-4 py-2 glass-btn-primary text-[12px] font-bold rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {isSavingAccount ? 'Saving...' : 'Save Account Changes'}
              </button>
            </div>
          </form>

          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
            <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">person</span>
              Student Information
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="input-minimal w-full px-3 py-2 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">
                  High School Graduation Year
                </label>
                <input
                  type="text"
                  value={userProfile.graduationYear}
                  onChange={(e) => onUpdateProfile({ graduationYear: e.target.value })}
                  className="input-minimal w-full px-3 py-2 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-slate-300 font-medium mb-1">
                  Strategic Profile Notes / Essay Themes
                </label>
                <textarea
                  rows={4}
                  value={userProfile.contextNotes}
                  onChange={(e) => onUpdateProfile({ contextNotes: e.target.value })}
                  placeholder="e.g. Aiming to connect robotics algorithms with social healthcare equity."
                  className="input-minimal w-full p-3 text-[13px]"
                />
              </div>
            </div>

            <div className="pt-3.5 border-t border-white/10 flex justify-between items-center">
              {isConfirmingReset ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetToDefault}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11.5px] font-bold cursor-pointer transition-all"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setIsConfirmingReset(false)}
                    className="text-[11.5px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingReset(true)}
                  className="text-[12px] text-rose-300 hover:text-rose-200 hover:underline cursor-pointer"
                >
                  Reset to Sample Dataset
                </button>
              )}
              <button
                onClick={() => showToast('Student preferences updated!')}
                className="px-4 py-2 glass-btn-primary text-[12px] font-bold rounded-xl cursor-pointer"
              >
                Save Info
              </button>
            </div>
          </div>
        </div>

        {/* Target College List */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4 shadow-[0_6px_24px_0_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">account_balance</span>
                Target Colleges List
              </h3>
              <span className="text-[11px] font-medium text-slate-400">
                {userProfile.targetColleges.length} Institutions Tracked
              </span>
            </div>

            {/* Add College Form */}
            <form onSubmit={handleAddCollege} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-white/[0.04] p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="University Name (e.g. Cornell)"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="input-minimal w-full px-3 py-1.5 text-[12px]"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={newCollegeCategory}
                  onChange={(e) => setNewCollegeCategory(e.target.value as any)}
                  className="input-minimal w-full px-3 py-1.5 text-[12px] bg-[#0a0a0f] text-white cursor-pointer"
                >
                  <option value="reach">Reach</option>
                  <option value="target">Target</option>
                  <option value="safety">Safety</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-1.5 glass-btn-primary font-bold rounded-lg text-[12px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  Add School
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2.5">
              {userProfile.targetColleges.map((college) => {
                const badgeColor =
                  college.category === 'reach'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : college.category === 'target'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                return (
                  <div
                    key={college.id}
                    className="flex items-center justify-between p-3.5 bg-white/[0.04] border border-white/10 rounded-xl hover:border-white/20 transition-all backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                        school
                      </span>
                      <div>
                        <h4 className="text-[13.5px] font-bold text-white">{college.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          Acceptance Rate: {college.acceptanceRate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <select
                        value={college.category}
                        onChange={(e) => {
                          const updated = userProfile.targetColleges.map((c) =>
                            c.id === college.id ? { ...c, category: e.target.value as any } : c
                          );
                          onUpdateProfile({ targetColleges: updated });
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase border bg-[#0a0a0f] cursor-pointer ${badgeColor}`}
                      >
                        <option value="reach">Reach</option>
                        <option value="target">Target</option>
                        <option value="safety">Safety</option>
                      </select>
                      <button
                        onClick={() => handleDeleteCollege(college.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove from target list"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

