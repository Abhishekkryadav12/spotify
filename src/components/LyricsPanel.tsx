import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Mic2, Music, Sparkles, Loader2, ArrowDownCircle, CheckCircle } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { LyricsApi, type LyricsData } from '../services/lyricsApi';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ isOpen, onClose }) => {
  const { currentTrack, currentTime, seek } = usePlayer();

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics whenever currentTrack changes or when lyrics panel opens
  useEffect(() => {
    if (!isOpen || !currentTrack) {
      return;
    }

    let isMounted = true;
    setLoading(true);

    LyricsApi.getLyrics(currentTrack)
      .then((data) => {
        if (isMounted) {
          setLyricsData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load lyrics:', err);
        if (isMounted) {
          setLyricsData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentTrack?.id]);

  // Compute active lyric line index for synced lyrics
  const activeIndex = useMemo(() => {
    if (!lyricsData || !lyricsData.isSynced || lyricsData.lines.length === 0) {
      return -1;
    }

    const lines = lyricsData.lines;
    // Find the last line whose timestamp <= currentTime
    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime + 0.2) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [lyricsData, currentTime]);

  // Smoothly scroll active line to center when index changes
  useEffect(() => {
    if (autoScroll && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, autoScroll]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col select-none animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="h-20 px-6 sm:px-10 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-900/60">
        <div className="flex items-center gap-4 min-w-0">
          {currentTrack ? (
            <>
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover shadow-lg border border-white/10 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
                  <span>{currentTrack.title}</span>
                  {lyricsData?.isSynced && (
                    <span className="shrink-0 px-2 py-0.5 text-[10px] bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Live Karaoke
                    </span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 truncate">
                  {currentTrack.artist} • {currentTrack.album}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-neutral-400">
              <Music className="w-5 h-5" />
              <span>No track playing</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {lyricsData?.isSynced && (
            <button
              onClick={() => setAutoScroll(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                autoScroll
                  ? 'bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40'
                  : 'bg-white/10 text-neutral-400 hover:text-white border border-transparent'
              }`}
              title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
            >
              <ArrowDownCircle className={`w-3.5 h-3.5 ${autoScroll ? 'text-[#1db954]' : ''}`} />
              <span className="hidden sm:inline">Auto-scroll</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close Lyrics"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Lyrics Display Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 sm:px-16 md:px-24 py-16 scroll-smooth space-y-6 text-center sm:text-left max-w-5xl mx-auto w-full"
      >
        {loading ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 text-neutral-400 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-[#1db954]" />
            <p className="text-sm font-medium">Finding and synchronizing lyrics...</p>
          </div>
        ) : !lyricsData || lyricsData.lines.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Mic2 className="w-12 h-12 text-neutral-600 mb-2" />
            <h3 className="text-xl font-bold text-white">Lyrics unavailable</h3>
            <p className="text-sm text-neutral-500 max-w-md text-center">
              We couldn't find synchronized lyrics for "{currentTrack?.title}". Enjoy the audio stream!
            </p>
          </div>
        ) : lyricsData.isSynced ? (
          /* Synced Live Karaoke Lines */
          <div className="space-y-6 py-10">
            {lyricsData.lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`transition-all duration-300 cursor-pointer select-none leading-relaxed tracking-tight ${
                    isActive
                      ? 'text-white font-extrabold text-2xl sm:text-4xl scale-102 origin-left text-glow-green'
                      : isPast
                      ? 'text-neutral-400/80 font-bold text-lg sm:text-2xl hover:text-white/90'
                      : 'text-neutral-600/90 font-semibold text-base sm:text-xl hover:text-neutral-300'
                  }`}
                  title={`Click to jump to ${Math.floor(line.time / 60)}:${Math.floor(line.time % 60).toString().padStart(2, '0')}`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        ) : (
          /* Plain Unsynced Lyrics */
          <div className="space-y-4 py-8 max-w-2xl">
            <div className="mb-6 flex items-center gap-2 text-xs text-neutral-400 bg-white/5 border border-white/10 w-fit px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-[#1db954]" />
              <span>Full Song Lyrics ({lyricsData.source === 'jiosaavn' ? 'JioSaavn Official' : 'Community'})</span>
            </div>
            {lyricsData.lines.map((line, idx) => (
              <p
                key={idx}
                className="text-lg sm:text-2xl font-semibold text-neutral-300 leading-relaxed hover:text-white transition-colors"
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {lyricsData?.isSynced && (
        <div className="h-10 px-6 border-t border-white/5 flex items-center justify-center text-[11px] text-neutral-500 bg-black/40">
          <span>Click any line to jump to that moment in the song</span>
        </div>
      )}
    </div>
  );
};
