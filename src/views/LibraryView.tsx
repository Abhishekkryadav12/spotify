import React, { useState } from 'react';
import {
  Heart,
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  ArrowDownToLine,
  FolderOpen,
  Shuffle,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import type { Track, ActiveView } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from '../components/TrackRow';
import { OfflineStorage } from '../services/offlineStorage';

interface LibraryViewProps {
  initialTab?: 'playlists' | 'liked' | 'recent' | 'downloads';
  setActiveView: (view: ActiveView) => void;
  onOpenCreatePlaylist: () => void;
  onAddToPlaylist: (track: Track) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  initialTab = 'playlists',
  setActiveView,
  onOpenCreatePlaylist,
  onAddToPlaylist,
}) => {
  const {
    playlists,
    likedTracks,
    recentlyPlayed,
    downloadedTracks,
    totalDownloadSize,
    deletePlaylist,
    clearHistory,
    openDownloadsFolder,
    isOnline,
  } = useLibrary();

  const { currentTrack, isPlaying, playTrack, togglePlay, playShuffled } = usePlayer();

  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'recent' | 'downloads'>(initialTab);
  const [folderOpenFeedback, setFolderOpenFeedback] = useState<string | null>(null);

  const downloadedTrackList = downloadedTracks.map(r => r.track);

  const handlePlayLikedAll = () => {
    if (likedTracks.length === 0) return;
    if (currentTrack && likedTracks.some(t => t.id === currentTrack.id)) {
      togglePlay();
    } else {
      playTrack(likedTracks[0], likedTracks);
    }
  };

  const handleShuffleLikedAll = () => {
    if (likedTracks.length === 0) return;
    playShuffled(likedTracks);
  };

  const handlePlayRecentAll = () => {
    if (recentlyPlayed.length === 0) return;
    if (currentTrack && recentlyPlayed.some(t => t.id === currentTrack.id)) {
      togglePlay();
    } else {
      playTrack(recentlyPlayed[0], recentlyPlayed);
    }
  };

  const handlePlayDownloadsAll = () => {
    if (downloadedTrackList.length === 0) return;
    if (currentTrack && downloadedTrackList.some(t => t.id === currentTrack.id)) {
      togglePlay();
    } else {
      playTrack(downloadedTrackList[0], downloadedTrackList);
    }
  };

  const handleOpenFolder = async () => {
    const success = await openDownloadsFolder();
    if (success) {
      setFolderOpenFeedback('Opened "SoundWave Downloads" folder');
      setTimeout(() => setFolderOpenFeedback(null), 3500);
    } else {
      setFolderOpenFeedback('Folder located at: SoundWave Downloads in your project directory');
      setTimeout(() => setFolderOpenFeedback(null), 4000);
    }
  };

  return (
    <div className="p-8 pb-32 space-y-6 select-none max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'playlists' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
          }`}
        >
          Playlists ({playlists.length})
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'liked' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${activeTab === 'liked' ? 'fill-black' : 'text-[#1db954]'}`} />
          <span>Liked Songs ({likedTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'downloads' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
          }`}
        >
          <ArrowDownToLine className={`w-4 h-4 ${activeTab === 'downloads' ? 'text-black' : 'text-emerald-400'}`} />
          <span>Downloads ({downloadedTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'recent' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Listening History ({recentlyPlayed.length})</span>
        </button>
      </div>

      {/* Tab 1: Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Your Playlists</h2>
            <button
              onClick={onOpenCreatePlaylist}
              className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold text-xs px-4 py-2 rounded-full transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Create Playlist
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActiveView({ type: 'playlist', playlistId: pl.id })}
                className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden shadow-lg bg-neutral-900 relative">
                  <img
                    src={pl.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {pl.tracks.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(pl.tracks[0], pl.tracks);
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-110 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </button>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{pl.name}</h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">
                    {pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                  <span>Playlist</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete playlist "${pl.name}"?`)) {
                        deletePlaylist(pl.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-400 p-1"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 bg-gradient-to-t from-black/80 to-indigo-900/40 p-6 rounded-2xl border border-indigo-900/30">
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-[#1db954] flex items-center justify-center shadow-2xl shrink-0">
              <Heart className="w-16 h-16 fill-white text-white drop-shadow" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs uppercase tracking-widest font-bold text-neutral-300">Playlist</span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mt-1 mb-2">Liked Songs</h1>
              <p className="text-xs text-neutral-300">
                {likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'} saved to your personal library
              </p>
            </div>

            {likedTracks.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleShuffleLikedAll}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Shuffle Liked Songs"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePlayLikedAll}
                  className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                  title="Play Liked Songs"
                >
                  {isPlaying && currentTrack && likedTracks.some(t => t.id === currentTrack.id) ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black ml-1" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Track List */}
          {likedTracks.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <Heart className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
              <h3 className="text-lg font-bold text-white mb-1">Songs you like will appear here</h3>
              <p className="text-xs">Save songs by tapping the heart icon on any track row or in the bottom player.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {likedTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={likedTracks}
                  onAddToPlaylist={onAddToPlaylist}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Downloads & Offline Library */}
      {activeTab === 'downloads' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 bg-gradient-to-t from-black/80 to-emerald-950/40 p-6 rounded-2xl border border-emerald-900/30">
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-[#1db954] flex items-center justify-center shadow-2xl shrink-0">
              <ArrowDownToLine className="w-16 h-16 text-white drop-shadow" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-400">Offline Collection</span>
                {!isOnline && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Offline Mode Active
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mt-1 mb-2">SoundWave Downloads</h1>
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <span>{downloadedTracks.length} {downloadedTracks.length === 1 ? 'song' : 'songs'} downloaded</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  {OfflineStorage.formatBytes(totalDownloadSize)} storage used
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/10"
                title="Open SoundWave Downloads folder in File Explorer"
              >
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Open Folder</span>
              </button>

              {downloadedTrackList.length > 0 && (
                <button
                  onClick={handlePlayDownloadsAll}
                  className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                  title="Play Downloaded Songs"
                >
                  {isPlaying && currentTrack && downloadedTrackList.some(t => t.id === currentTrack.id) ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black ml-1" />
                  )}
                </button>
              )}
            </div>
          </div>

          {folderOpenFeedback && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{folderOpenFeedback}</span>
            </div>
          )}

          {/* Downloads Track List */}
          {downloadedTracks.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <ArrowDownToLine className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
              <h3 className="text-lg font-bold text-white mb-1">No downloaded songs yet</h3>
              <p className="text-xs max-w-md mx-auto text-neutral-400">
                Click the download icon on any song to save it for offline playback. Songs are saved both inside the app and into your dedicated <strong className="text-neutral-200">SoundWave Downloads</strong> folder.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {downloadedTracks.map((record, idx) => (
                <TrackRow
                  key={record.id}
                  track={record.track}
                  index={idx}
                  playlistContext={downloadedTrackList}
                  onAddToPlaylist={onAddToPlaylist}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Recently Played / Listening History */}
      {activeTab === 'recent' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Listening History</h2>
              <p className="text-xs text-neutral-400 mt-1">
                {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'song' : 'songs'} recently played on your account
              </p>
            </div>
            {recentlyPlayed.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (confirm('Clear your listening history?')) {
                      clearHistory();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
                <button
                  onClick={handlePlayRecentAll}
                  className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-transform hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-black" /> Play History
                </button>
              </div>
            )}
          </div>

          {recentlyPlayed.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
              <h3 className="text-lg font-bold text-white mb-1">No listening history yet</h3>
              <p className="text-xs">Play songs from Search, Home, or Live Radio to start building your listening history.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentlyPlayed.map((track, idx) => (
                <TrackRow
                  key={`${track.id}-${idx}`}
                  track={track}
                  index={idx}
                  playlistContext={recentlyPlayed}
                  onAddToPlaylist={onAddToPlaylist}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
