import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Plus,
  MoreHorizontal,
  ListPlus,
  ListMusic,
  ArrowDownToLine,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { Track } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../utils/format';

interface TrackRowProps {
  track: Track;
  index: number;
  playlistContext?: Track[];
  onAddToPlaylist?: (track: Track) => void;
  onRemoveFromPlaylist?: (trackId: string) => void;
  showAlbum?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  playlistContext,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  showAlbum = true,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, playNext } = usePlayer();
  const { isLiked, toggleLike, isDownloaded, downloadTrack, removeDownload, downloadingTrackIds } = useLibrary();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const liked = isLiked(track.id);
  const downloaded = isDownloaded(track.id) || track.isDownloaded;
  const isDownloading = downloadingTrackIds.has(track.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext);
    }
  };

  return (
    <div
      onDoubleClick={handleRowClick}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
        isCurrent ? 'bg-white/10 text-[#1db954]' : 'hover:bg-white/5 text-[#b3b3b3]'
      }`}
    >
      {/* Index or Play Button */}
      <div className="w-6 flex items-center justify-center shrink-0">
        <span className={`block group-hover:hidden ${isCurrent ? 'text-[#1db954]' : 'text-neutral-400'}`}>
          {isCurrentPlaying ? (
            <div className="flex items-end gap-[2px] h-3">
              <span className="w-1 bg-[#1db954] h-full animate-[bounce_1s_infinite_100ms] rounded-xs" />
              <span className="w-1 bg-[#1db954] h-2/3 animate-[bounce_1s_infinite_300ms] rounded-xs" />
              <span className="w-1 bg-[#1db954] h-4/5 animate-[bounce_1s_infinite_200ms] rounded-xs" />
            </div>
          ) : (
            index + 1
          )}
        </span>
        <button
          onClick={handleRowClick}
          className="hidden group-hover:flex items-center justify-center text-white hover:scale-110 transition-transform"
          aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>
      </div>

      {/* Artwork */}
      <img
        src={track.artwork}
        alt={track.title}
        className="w-10 h-10 rounded object-cover shrink-0 shadow"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
        }}
      />

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-2">
        <p className={`font-medium truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
          <span className="truncate">{track.artist}</span>
          {track.isExplicit && (
            <span className="shrink-0 px-1 py-0.5 text-[9px] bg-neutral-700 text-neutral-300 rounded font-semibold">
              E
            </span>
          )}
          {track.playbackMode === 'full' ? (
            <span className="shrink-0 px-1.5 py-0.2 text-[9px] bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 rounded font-bold uppercase tracking-wider">
              Full Song
            </span>
          ) : null}
        </p>
      </div>

      {/* Album */}
      {showAlbum && (
        <div className="hidden md:block flex-1 min-w-0 pr-2">
          <p className="text-xs text-neutral-400 truncate hover:text-white cursor-pointer">
            {track.album}
          </p>
        </div>
      )}

      {/* Download Action */}
      {isDownloading ? (
        <span className="p-1.5 shrink-0 text-[#1db954]" title="Downloading for offline listening...">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      ) : downloaded ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeDownload(track.id);
          }}
          className="p-1.5 rounded-full text-[#1db954] hover:text-red-400 transition-colors shrink-0"
          title="Downloaded in SoundWave Downloads (Click to remove)"
          aria-label="Remove download"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadTrack(track);
          }}
          className="p-1.5 rounded-full text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all shrink-0"
          title="Download for offline listening"
          aria-label="Download song"
        >
          <ArrowDownToLine className="w-4 h-4" />
        </button>
      )}

      {/* Like Heart */}
      <button
        onClick={() => toggleLike(track)}
        className={`p-1.5 rounded-full transition-colors shrink-0 ${
          liked
            ? 'text-[#1db954] opacity-100'
            : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white'
        }`}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-[#1db954]' : ''}`} />
      </button>

      {/* Duration */}
      <span className="text-xs text-neutral-400 w-12 text-right shrink-0">
        {track.duration > 0 ? formatDuration(track.duration) : 'LIVE'}
      </span>

      {/* More / Add to Playlist Options */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-neutral-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#282828] border border-neutral-700 rounded-md shadow-xl z-50 py-1 text-xs text-neutral-200">
              <button
                onClick={() => {
                  setShowMenu(false);
                  playNext(track);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                <ListPlus className="w-3.5 h-3.5 text-[#1db954]" /> Play Next
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  addToQueue(track);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                <ListMusic className="w-3.5 h-3.5 text-neutral-300" /> Add to Queue
              </button>
              <div className="h-px bg-neutral-700/60 my-1" />
              {downloaded ? (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    removeDownload(track.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove from Downloads
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    downloadTrack(track);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 text-neutral-200"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-[#1db954]" /> Download for Offline
                </button>
              )}
              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAddToPlaylist(track);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Playlist
                </button>
              )}
              {onRemoveFromPlaylist && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onRemoveFromPlaylist(track.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-red-400 flex items-center gap-2"
                >
                  Remove from this playlist
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
