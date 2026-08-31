import React, { useState } from 'react';
import { CollegeTarget, CollegeCategory, CollegeApplicationStatus, UserProfile } from '../types';
import { getUniversityInfoByName, UniversityInfo } from '../data/universitiesDatabase';

interface UniversityDetailModalProps {
  college: CollegeTarget;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCollege: (updated: CollegeTarget) => void;
  onDeleteCollege: (collegeId: string, name: string) => void;
  onShowToast?: (msg: string) => void;
}

export const UniversityDetailModal: React.FC<UniversityDetailModalProps> = ({
  college,
  userProfile,
  isOpen,
  onClose,
  onUpdateCollege,
  onDeleteCollege,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'strategy'>('info');
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [editingNotes, setEditingNotes] = useState(college.notes || '');
  const [selectedRound, setSelectedRound] = useState(college.round || 'Regular Decision (RD)');
  const [selectedDeadline, setSelectedDeadline] = useState(college.deadline || 'Jan 1');

  if (!isOpen) return null;

  const dbInfo: UniversityInfo | undefined = getUniversityInfoByName(college.name);

  const checklist = college.checklist || [
    { id: 'chk-1', label: 'Complete Common Application Profile', completed: false },
    { id: 'chk-2', label: 'Draft Supplemental Essays', completed: false },
    { id: 'chk-3', label: 'Request Teacher & Counselor Recommendations', completed: false },
    { id: 'chk-4', label: 'Send Official High School Transcripts', completed: false },
    { id: 'chk-5', label: 'Submit FAFSA / CSS Profile for Financial Aid', completed: false }
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  const handleToggleTask = (taskId: string) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    const updatedCollege = { ...college, checklist: updatedChecklist };
    onUpdateCollege(updatedCollege);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskLabel.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      label: newTaskLabel.trim(),
      completed: false
    };
    const updatedChecklist = [...checklist, newTask];
    onUpdateCollege({ ...college, checklist: updatedChecklist });
    setNewTaskLabel('');
    onShowToast?.('Added milestone task!');
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedChecklist = checklist.filter((item) => item.id !== taskId);
    onUpdateCollege({ ...college, checklist: updatedChecklist });
  };

  const handleSaveNotesAndRound = () => {
    onUpdateCollege({
      ...college,
      notes: editingNotes,
      round: selectedRound,
      deadline: selectedDeadline
    });
    onShowToast?.(`Saved details for ${college.name}`);
  };

  const tierBg =
    college.category === 'reach'
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      : college.category === 'target'
      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="glass-card rounded-2xl border border-white/20 bg-[#0d0d14] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-transparent to-transparent">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[26px]">school</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[20px] md:text-[22px] font-extrabold text-white tracking-tight">
                  {college.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase border ${tierBg}`}>
                  {college.category} School
                </span>
              </div>
              <p className="text-[12.5px] text-slate-400 mt-0.5">
                {college.location} • Admit Rate: <strong className="text-white">{college.acceptanceRate}</strong> • Deadline:{' '}
                <strong className="text-amber-300">{college.deadline}</strong> ({college.round || 'RD'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-white/10 px-6 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-indigo-400 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">info</span>
            <span>University Information</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-indigo-400 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">checklist</span>
            <span>Application Checklist ({completedCount}/{checklist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'strategy'
                ? 'border-indigo-400 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">psychology</span>
            <span>Admissions Strategy &amp; Notes</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* TAB 1: Detailed University Information */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fade-in">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acceptance Rate</div>
                  <div className="text-[18px] font-extrabold text-white mt-1">
                    {dbInfo?.acceptanceRate || college.acceptanceRate}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Overall Undergraduate</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Middle 50% SAT</div>
                  <div className="text-[18px] font-extrabold text-white mt-1">
                    {dbInfo?.middleSat || '1480 - 1570'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Middle Range</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Middle 50% ACT</div>
                  <div className="text-[18px] font-extrabold text-white mt-1">
                    {dbInfo?.middleAct || '33 - 35'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Composite Score</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campus Setting</div>
                  <div className="text-[18px] font-extrabold text-white mt-1">
                    {dbInfo?.setting || 'Urban / Suburban'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{college.location}</div>
                </div>
              </div>

              {/* University Profile Description */}
              {dbInfo?.overview && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    Institution Profile
                  </div>
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    {dbInfo.overview}
                  </p>
                </div>
              )}

              {/* Requirements & Application Logistics */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-400 text-[16px]">description</span>
                  Application Requirements &amp; Testing Policy
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase">Application Platform</div>
                    <div className="font-semibold text-white">
                      {dbInfo?.requirements.applicationSystem || 'Common Application / Coalition'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase">Standardized Testing Policy</div>
                    <div className="font-semibold text-amber-300">
                      {dbInfo?.requirements.testingPolicy || 'Test-Optional (SAT/ACT accepted)'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase">Supplemental Essays</div>
                    <div className="font-semibold text-white">
                      {dbInfo?.requirements.supplementCount || '2-4 institutional short answer essays'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase">Letters of Recommendation</div>
                    <div className="font-semibold text-white">
                      {dbInfo?.requirements.recsRequired || '1 Counselor + 2 Academic Teacher letters'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Aid and Tuition */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-[12px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[16px]">payments</span>
                  Tuition &amp; Financial Aid
                </div>
                <div className="text-[13px] text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400">Estimated Cost of Attendance: </span>
                    <strong className="text-white">{dbInfo?.tuition || '$58,000 - $65,000 / yr'}</strong>
                  </div>
                  {dbInfo?.financialAid.aidNote && (
                    <div className="text-[12px] text-emerald-300/90 italic">
                      💡 {dbInfo.financialAid.aidNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Majors & Programs */}
              {dbInfo?.popularMajors && (
                <div className="space-y-2">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Top Ranked Departments &amp; Majors
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dbInfo.popularMajors.map((major) => (
                      <span
                        key={major}
                        className="px-3 py-1 rounded-lg text-[12px] font-semibold bg-white/5 border border-white/10 text-slate-200"
                      >
                        {major}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Application Checklist & Milestones */}
          {activeTab === 'checklist' && (
            <div className="space-y-5 animate-fade-in">
              {/* Progress Summary */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-400 text-[18px]">task_alt</span>
                    Application Milestone Completion
                  </span>
                  <span className="font-extrabold text-indigo-300">{progressPercent}% Done</span>
                </div>
                <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="text-[11.5px] text-slate-400">
                  {completedCount} of {checklist.length} application items completed for {college.name}.
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      item.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleTask(item.id)}
                        className="rounded text-indigo-500 focus:ring-indigo-400 border-white/20 w-4 h-4 bg-white/10 cursor-pointer"
                      />
                      <span className={`text-[13px] ${item.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                        {item.label}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteTask(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Remove task"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom milestone (e.g. Schedule campus interview)..."
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  className="input-minimal flex-1 px-3 py-2 text-[12.5px]"
                />
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add Task</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Strategy & Student Notes */}
          {activeTab === 'strategy' && (
            <div className="space-y-5 animate-fade-in">
              {/* Insider Admissions Tip */}
              {dbInfo?.admissionsStrategyTip && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    Admissions Strategy Advisor Tip
                  </div>
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    {dbInfo.admissionsStrategyTip}
                  </p>
                </div>
              )}

              {/* Application Round & Deadline Customizer */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-slate-300">
                  Application Timeline Configuration
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">Application Round</label>
                    <input
                      type="text"
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      placeholder="e.g. Early Action (EA), Early Decision (ED), RD"
                      className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">Target Deadline</label>
                    <input
                      type="text"
                      value={selectedDeadline}
                      onChange={(e) => setSelectedDeadline(e.target.value)}
                      placeholder="e.g. Nov 1, Jan 1, Nov 30"
                      className="input-minimal w-full px-3 py-1.5 text-[12.5px]"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Strategy Notes */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-400 text-[16px]">edit_note</span>
                    My Strategy, Essay Brainstorms &amp; Faculty Interests
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Record why you love this university, specific professors, research labs, student clubs, or essay angles..."
                  className="input-minimal w-full p-3 text-[12.5px] rounded-xl resize-none leading-relaxed"
                />
                <button
                  onClick={handleSaveNotesAndRound}
                  className="glass-btn-primary px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Notes &amp; Strategy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove ${college.name} from your target list?`)) {
                onDeleteCollege(college.id, college.name);
                onClose();
              }
            }}
            className="text-rose-400 hover:text-rose-300 text-[12px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            <span>Remove from College List</span>
          </button>

          <button
            onClick={onClose}
            className="glass-btn-secondary px-4 py-2 rounded-xl text-[12.5px] font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
