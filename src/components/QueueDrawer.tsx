import React, { useState } from 'react';
import { X, Trash2, Play, Music, ChevronDown, ChevronRight, Volume2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/format';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { queue, queueIndex, currentTrack, isPlaying, jumpToQueueIndex, removeFromQueue, clearQueue } = usePlayer();
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  const previousTracks = queueIndex > 0 ? queue.slice(0, queueIndex) : [];
  const nextTracks = queueIndex >= 0 && queueIndex < queue.length - 1 ? queue.slice(queueIndex + 1) : [];

  const nextTracksDuration = nextTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="fixed right-0 top-0 bottom-24 w-88 max-w-[90vw] bg-[#121212]/95 backdrop-blur-md border-l border-neutral-800 shadow-2xl z-40 flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-[#1db954]" />
          <h2 className="font-bold text-white text-base">Play Queue</h2>
          <span className="text-xs text-neutral-400">({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-neutral-400 hover:text-red-400 p-1 flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear queue"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Queue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Now Playing Section */}
        {currentTrack && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#1db954]" />
                <span>Now Playing</span>
              </h3>
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-1 bg-[#1db954] h-full animate-[bounce_1s_infinite_100ms] rounded-xs" />
                  <span className="w-1 bg-[#1db954] h-2/3 animate-[bounce_1s_infinite_300ms] rounded-xs" />
                  <span className="w-1 bg-[#1db954] h-4/5 animate-[bounce_1s_infinite_200ms] rounded-xs" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-white/10 rounded-xl border border-white/5 shadow-md">
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1db954] truncate">{currentTrack.title}</p>
                <p className="text-xs text-neutral-300 truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-xs text-neutral-400 font-mono shrink-0">
                {currentTrack.duration > 0 ? formatDuration(currentTrack.duration) : 'LIVE'}
              </span>
            </div>
          </div>
        )}

        {/* Up Next Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400">
              Next Up ({nextTracks.length})
            </h3>
            {nextTracks.length > 0 && nextTracksDuration > 0 && (
              <span className="text-[11px] text-neutral-500 font-mono">
                {Math.ceil(nextTracksDuration / 60)} min
              </span>
            )}
          </div>

          {nextTracks.length === 0 ? (
            <div className="p-4 bg-white/5 rounded-xl text-center space-y-1 border border-white/5">
              <p className="text-xs text-neutral-300 font-medium">Your queue is empty</p>
              <p className="text-[11px] text-neutral-500">
                Click "Add to Queue" or "Play Next" on any song to line up tracks!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {nextTracks.map((track, i) => {
                const actualIndex = queueIndex + 1 + i;
                return (
                  <div
                    key={`${track.id}-${actualIndex}`}
                    onClick={() => jumpToQueueIndex(actualIndex)}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-xs cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        jumpToQueueIndex(actualIndex);
                      }}
                      className="w-5 text-neutral-400 group-hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>

                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-9 h-9 rounded object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{track.title}</p>
                      <p className="text-neutral-400 text-[11px] truncate">{track.artist}</p>
                    </div>

                    <span className="text-neutral-400 font-mono shrink-0 text-[11px]">
                      {track.duration > 0 ? formatDuration(track.duration) : 'LIVE'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(actualIndex);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity shrink-0 cursor-pointer"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Previous In Queue Section (Collapsible) */}
        {previousTracks.length > 0 && (
          <div className="pt-2 border-t border-neutral-800">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white py-1 transition-colors cursor-pointer"
            >
              <span className="uppercase tracking-wider font-bold">
                Previously Played ({previousTracks.length})
              </span>
              {showHistory ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {showHistory && (
              <div className="space-y-1 mt-2">
                {previousTracks.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => jumpToQueueIndex(idx)}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 opacity-60 hover:opacity-100 transition-all text-xs cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        jumpToQueueIndex(idx);
                      }}
                      className="w-5 text-neutral-400 group-hover:text-white flex items-center justify-center shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>

                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{track.title}</p>
                      <p className="text-neutral-400 text-[11px] truncate">{track.artist}</p>
                    </div>

                    <span className="text-neutral-500 font-mono text-[11px]">
                      {track.duration > 0 ? formatDuration(track.duration) : 'LIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
