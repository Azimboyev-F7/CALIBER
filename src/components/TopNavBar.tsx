import React from 'react';
import { ActiveScreen, AuthUser } from '../types';

interface TopNavBarProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenPricing?: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onNavigate,
  onOpenPricing,
  currentUser,
  onSignOut
}) => {
  return (
    <nav className="sticky bg-white/[0.03] backdrop-blur-xl top-0 z-50 transition-all duration-300 border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <div className="flex justify-between items-center w-full px-5 md:px-7 max-w-[1140px] mx-auto h-14">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('landing')}>
          <span className="text-[20px] font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            ProfileLens
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <a 
            href="#features" 
            className="text-[13.5px] text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 px-3 py-1.5 rounded-lg font-medium"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-[13.5px] text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 px-3 py-1.5 rounded-lg font-medium"
          >
            How it Works
          </a>
          <button 
            onClick={onOpenPricing ? onOpenPricing : () => onNavigate('dashboard')}
            className="text-[13.5px] text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 px-3 py-1.5 rounded-lg font-medium cursor-pointer"
          >
            Pricing
          </button>
        </div>

        <div className="flex items-center space-x-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer text-left"
              >
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt={currentUser.name || 'User'}
                  className="w-6 h-6 rounded-full border border-white/20 object-cover"
                />
                <span className="text-[12.5px] font-semibold text-white max-w-[100px] truncate hidden sm:inline">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="font-bold text-[13px] glass-btn-primary px-3.5 py-1.5 rounded-lg cursor-pointer"
              >
                Dashboard
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer text-[12px]"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <button 
                onClick={() => onNavigate('auth')}
                className="font-semibold text-[13px] glass-btn-secondary px-3.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-400">login</span>
                <span>Log In</span>
              </button>
              <button 
                onClick={() => onNavigate('auth')}
                className="font-bold text-[13px] glass-btn-primary px-4 py-1.5 rounded-lg cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

