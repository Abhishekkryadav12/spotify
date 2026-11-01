import React from 'react';
import { Home, Search, Library, Radio, Plus, Heart, Music2, Disc, ArrowDownToLine, WifiOff } from 'lucide-react';
import type { ActiveView } from '../types/music';
import { useLibrary } from '../context/LibraryContext';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onOpenCreatePlaylist,
}) => {
  const { playlists, likedTracks, downloadedTracks, isOnline } = useLibrary();

  const isHome = activeView.type === 'home';
  const isSearch = activeView.type === 'search';
  const isLibrary = activeView.type === 'library' && activeView.tab !== 'downloads';
  const isDownloads = activeView.type === 'library' && activeView.tab === 'downloads';
  const isRadio = activeView.type === 'radio';
  const isPlaylist = (id: string) => activeView.type === 'playlist' && activeView.playlistId === id;

  return (
    <aside className="w-60 bg-[#121212] flex flex-col shrink-0 h-full border-r border-neutral-900 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-black shadow-lg shadow-[#1db954]/20">
          <Disc className="w-5 h-5 animate-spin [animation-duration:8s]" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-lg text-white">SoundWave</span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Real-Time Player</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="px-3 space-y-1">
        <button
          onClick={() => setActiveView({ type: 'home' })}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            isHome ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'text-[#1db954]' : ''}`} />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveView({ type: 'search' })}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            isSearch ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Search className={`w-5 h-5 ${isSearch ? 'text-[#1db954]' : ''}`} />
          <span>Search</span>
        </button>

        <button
          onClick={() => setActiveView({ type: 'library', tab: 'playlists' })}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            isLibrary ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Library className={`w-5 h-5 ${isLibrary ? 'text-[#1db954]' : ''}`} />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => setActiveView({ type: 'library', tab: 'downloads' })}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            isDownloads ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <ArrowDownToLine className={`w-5 h-5 ${isDownloads ? 'text-[#1db954]' : ''}`} />
            <span>Downloads</span>
          </div>
          {downloadedTracks.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {downloadedTracks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView({ type: 'radio' })}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            isRadio ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Radio className={`w-5 h-5 ${isRadio ? 'text-[#1db954]' : ''}`} />
          <span>Live Radio</span>
        </button>
      </nav>

      {/* Library & Playlists Actions */}
      <div className="mt-6 px-3">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-neutral-400">Playlists</span>
          <button
            onClick={onOpenCreatePlaylist}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Create Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors group"
        >
          <div className="w-7 h-7 rounded bg-white/10 group-hover:bg-[#1db954] group-hover:text-black flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="font-medium">Create Playlist</span>
        </button>

        <button
          onClick={() => setActiveView({ type: 'library', tab: 'liked' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors group"
        >
          <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-600 via-purple-600 to-[#1db954] flex items-center justify-center text-white shadow">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-medium">Liked Songs</span>
            <span className="text-[11px] text-neutral-400">{likedTracks.length} songs</span>
          </div>
        </button>
      </div>

      <div className="h-px bg-neutral-800 mx-6 my-3" />

      {/* User Playlists Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => setActiveView({ type: 'playlist', playlistId: pl.id })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors flex items-center gap-2.5 ${
              isPlaylist(pl.id) ? 'bg-white/10 text-[#1db954] font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Music2 className="w-4 h-4 shrink-0 text-neutral-500" />
            <span className="truncate">{pl.name}</span>
          </button>
        ))}
      </div>

      {/* Offline / Online Status Footer */}
      <div className="p-4 border-t border-neutral-900 bg-[#0d0d0d] text-xs text-neutral-400 flex items-center justify-between">
        {isOnline ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse" />
            <span className="text-neutral-300">Online • Ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-400">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-amber-300">Offline Mode</span>
          </div>
        )}
        <span className="text-[10px] text-neutral-500 font-medium">SoundWave</span>
      </div>
    </aside>
  );
};
