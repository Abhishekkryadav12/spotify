import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Info, User, LogOut, Sliders, ChevronDown, WifiOff, ArrowDownToLine } from 'lucide-react';
import type { ActiveView } from '../types/music';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenInfoModal: () => void;
  canGoBack: boolean;
  onGoBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  onOpenInfoModal,
  canGoBack,
  onGoBack,
}) => {
  const {
    user,
    isAuthenticated,
    openAuthModal,
    openProfileModal,
    openOnboarding,
    signOut,
  } = useAuth();
  const { isOnline } = useLibrary();

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 px-8 flex items-center justify-between gap-4 sticky top-0 bg-[#121212]/80 backdrop-blur-md z-30 select-none">
      {/* Navigation history controls & Search bar */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`w-8 h-8 rounded-full bg-black/60 flex items-center justify-center transition-colors ${
              canGoBack ? 'text-white hover:bg-black/90 cursor-pointer' : 'text-neutral-600 cursor-not-allowed'
            }`}
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            disabled
            className="w-8 h-8 rounded-full bg-black/40 text-neutral-600 flex items-center justify-center cursor-not-allowed"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search Input (Active or redirecting to Search View) */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="What do you want to play? (Songs, artists, podcasts...)"
            value={searchQuery}
            onFocus={() => {
              if (activeView.type !== 'search') {
                setActiveView({ type: 'search' });
              }
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeView.type !== 'search') {
                setActiveView({ type: 'search' });
              }
            }}
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-full pl-10 pr-4 py-2 border border-transparent focus:border-neutral-500 focus:outline-hidden transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Right: API Sources & Auth / User Profile */}
      <div className="flex items-center gap-3">
        {!isOnline && (
          <button
            onClick={() => setActiveView({ type: 'library', tab: 'downloads' })}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer animate-pulse"
            title="You are currently offline. Click to view downloaded songs."
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Offline Mode</span>
          </button>
        )}

        <button
          onClick={onOpenInfoModal}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-[#1db954]" />
          <span>Music Sources & APIs</span>
        </button>

        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full bg-black/40 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
              title="Account menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-300 flex items-center justify-center text-black font-extrabold text-xs shadow">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-white max-w-[100px] truncate hidden sm:inline">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#282828] border border-neutral-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-neutral-700/60">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      openProfileModal();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#1db954]" />
                    <span>Profile & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      openOnboarding();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Music Languages & Artists</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveView({ type: 'library', tab: 'downloads' });
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                    <span>SoundWave Downloads</span>
                  </button>

                  <div className="h-px bg-neutral-700/60 my-1" />

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openAuthModal('signup')}
              className="text-xs font-bold text-neutral-300 hover:text-white px-3 py-2 transition-colors cursor-pointer"
            >
              Sign up
            </button>
            <button
              onClick={() => openAuthModal('signin')}
              className="bg-white hover:bg-neutral-200 text-black font-extrabold text-xs px-5 py-2.5 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
