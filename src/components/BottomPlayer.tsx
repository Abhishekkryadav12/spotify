import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  ListMusic,
  AlertCircle,
  Loader2,
  Radio as RadioIcon,
  Sparkles,
  Mic2,
  ArrowDownToLine,
  CheckCircle2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../utils/format';
import { GuitarIcon } from './GuitarNotesPanel';

interface BottomPlayerProps {
  onToggleQueue: () => void;
  isQueueOpen: boolean;
  onToggleLyrics: () => void;
  isLyricsOpen: boolean;
  onToggleGuitarNotes?: () => void;
  isGuitarNotesOpen?: boolean;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  onToggleQueue,
  isQueueOpen,
  onToggleLyrics,
  isLyricsOpen,
  onToggleGuitarNotes,
  isGuitarNotesOpen = false,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    error,
    isLiveStream,
    upgradedToast,
    queue,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    resume,
    showToast,
  } = usePlayer();

  const { isLiked, toggleLike, isDownloaded, downloadTrack, downloadingTrackIds } = useLibrary();
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);

  const liked = currentTrack ? isLiked(currentTrack.id) : false;
  const downloaded = currentTrack ? (isDownloaded(currentTrack.id) || currentTrack.isDownloaded) : false;
  const isDownloading = currentTrack ? downloadingTrackIds.has(currentTrack.id) : false;

  const handleDownloadClick = async () => {
    if (!currentTrack || isLiveStream) return;
    if (isDownloading) return;

    try {
      showToast(`⬇️ Downloading "${currentTrack.title}" to device...`);
      await downloadTrack(currentTrack);
      showToast(`✅ Saved "${currentTrack.title}" to SoundWave Downloads folder!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      showToast(`⚠️ ${msg}`);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#181818] border-t border-neutral-800 px-4 flex flex-col justify-center z-50 select-none shadow-2xl">
      {/* Upgraded full-song toast notification */}
      {upgradedToast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1db954] text-black font-bold text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          <span>{upgradedToast}</span>
        </div>
      )}

      {/* Error alert toast if stream/file encounters an issue */}
      {error && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/50 text-red-200 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{error}</span>
          <button
            onClick={resume}
            className="ml-2 underline text-white hover:text-red-300 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        {/* Left: Current Track Details */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[180px]">
          {currentTrack ? (
            <>
              <div className="relative group shrink-0">
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-14 h-14 rounded object-cover shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                  }}
                />
                {isLiveStream && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold px-1 rounded-sm shadow uppercase">
                    Live
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
                  {currentTrack.title}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                  <span className="truncate">{currentTrack.artist}</span>
                  {downloaded && (
                    <span className="shrink-0 px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase tracking-wider">
                      Offline
                    </span>
                  )}
                  {currentTrack.playbackMode === 'full' ? (
                    <span className="shrink-0 px-1.5 py-0.2 text-[9px] bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 rounded font-bold uppercase tracking-wider">
                      Full Song
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Like action */}
              <button
                onClick={() => toggleLike(currentTrack)}
                className={`p-1.5 rounded-full transition-colors shrink-0 ${
                  liked ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
                }`}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-[#1db954]' : ''}`} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-neutral-400 text-xs">
              <div className="w-14 h-14 rounded bg-neutral-800 flex items-center justify-center">
                <RadioIcon className="w-6 h-6 text-neutral-600" />
              </div>
              <span>No track selected. Click any song to play!</span>
            </div>
          )}
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center max-w-2xl w-2/4">
          {/* Button Row */}
          <div className="flex items-center gap-5 mb-1.5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              disabled={isLiveStream}
              className={`p-1.5 transition-colors relative ${
                shuffle ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              } ${isLiveStream ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={shuffle ? 'Shuffle is on' : 'Shuffle is off'}
            >
              <Shuffle className="w-4 h-4" />
              {shuffle && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />}
            </button>

            {/* Previous */}
            <button
              onClick={previous}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors hover:scale-105"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className={`w-9 h-9 rounded-full bg-white text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md ${
                !currentTrack ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={next}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors hover:scale-105"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              disabled={isLiveStream}
              className={`p-1.5 transition-colors relative ${
                repeat !== 'off' ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              } ${isLiveStream ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={`Repeat: ${repeat}`}
            >
              {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {repeat !== 'off' && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
              )}
            </button>

            {/* Guitar Notes Button beside playback controls */}
            <button
              onClick={onToggleGuitarNotes}
              disabled={!currentTrack || isLiveStream}
              className={`p-1.5 transition-colors relative hover:scale-105 ${
                !currentTrack || isLiveStream
                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                  : isGuitarNotesOpen
                  ? 'text-[#1db954]'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Guitar Notes & Chords (Synced)"
              aria-label="Guitar Notes & Chords"
            >
              <GuitarIcon className="w-4 h-4" />
              {isGuitarNotesOpen && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
              )}
            </button>

            {/* Download Button right beside playback controls */}
            {isDownloading ? (
              <span className="p-1.5 text-[#1db954] shrink-0" title="Downloading for offline listening...">
                <Loader2 className="w-4 h-4 animate-spin" />
              </span>
            ) : downloaded ? (
              <button
                onClick={handleDownloadClick}
                className="p-1.5 text-[#1db954] hover:text-[#1ed760] transition-colors relative hover:scale-105"
                title="Downloaded to SoundWave Downloads (Click to re-download to device)"
                aria-label="Downloaded to SoundWave Downloads"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
              </button>
            ) : (
              <button
                onClick={handleDownloadClick}
                disabled={!currentTrack || isLiveStream}
                className={`p-1.5 transition-colors relative hover:scale-105 ${
                  !currentTrack || isLiveStream
                    ? 'opacity-30 cursor-not-allowed text-neutral-600'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Download current song to device for offline listening"
                aria-label="Download current song"
              >
                <ArrowDownToLine className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scrubber Progress Bar */}
          <div className="w-full flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span>{isLiveStream ? '0:00' : formatDuration(currentTime)}</span>
            
            <div className="relative flex-1 group flex items-center h-4">
              {/* Custom background track */}
              <div className="w-full h-1 bg-neutral-700 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                  style={{ width: `${isLiveStream ? 100 : progressPercent}%` }}
                />
              </div>

              {/* Range input */}
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 100}
                step={0.1}
                value={currentTime}
                disabled={isLiveStream || duration <= 0}
                onChange={handleSeekChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onMouseMove={(e) => {
                  if (duration > 0 && !isLiveStream) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    setHoverSeekTime(Math.max(0, Math.min(duration, ratio * duration)));
                  }
                }}
                onMouseLeave={() => setHoverSeekTime(null)}
              />

              {/* Hover Tooltip */}
              {hoverSeekTime !== null && !isLiveStream && (
                <div
                  className="absolute -top-7 -translate-x-1/2 bg-neutral-900 border border-neutral-700 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none"
                  style={{ left: `${(hoverSeekTime / duration) * 100}%` }}
                >
                  {formatDuration(hoverSeekTime)}
                </div>
              )}
            </div>

            <span>{isLiveStream ? 'LIVE' : formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Queue */}
        <div className="flex items-center justify-end gap-3.5 w-1/4 min-w-[160px]">
          {/* Lyrics toggle button */}
          <button
            onClick={onToggleLyrics}
            disabled={!currentTrack || isLiveStream}
            className={`p-1.5 rounded transition-colors ${
              !currentTrack || isLiveStream
                ? 'opacity-30 cursor-not-allowed text-neutral-600'
                : isLyricsOpen
                ? 'text-[#1db954]'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Lyrics (Live Karaoke)"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={onToggleQueue}
            className={`relative p-1.5 rounded transition-colors ${
              isQueueOpen ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
            title={`Play Queue (${queue.length} songs)`}
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 bg-[#1db954] text-black font-extrabold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                {queue.length > 99 ? '99+' : queue.length}
              </span>
            )}
          </button>

          {/* Volume button & slider */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <div className="relative w-24 flex items-center h-4">
              <div className="w-full h-1 bg-neutral-700 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
