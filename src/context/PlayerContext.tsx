import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Track, PlayerState, RepeatMode } from '../types/music';
import { StorageService } from '../services/storage';
import { OfflineStorage } from '../services/offlineStorage';
import { SaavnApi } from '../services/saavnApi';
import { useAuth } from './AuthContext';

interface PlayerContextType extends PlayerState {
  upgradedToast: string | null;
  convertToFullSong: (track: Track) => Promise<boolean>;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  playAll: (tracks: Track[], startIndex?: number) => Promise<void>;
  playShuffled: (tracks: Track[]) => Promise<void>;
  playNext: (track: Track) => void;
  jumpToQueueIndex: (index: number) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => Promise<void>;
  next: () => void;
  previous: () => void;
  seek: (timeInSeconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  showToast: (message: string) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Single persistent HTMLAudioElement
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { user } = useAuth();
  const userIdRef = useRef<string>(user?.id || 'guest');
  userIdRef.current = user?.id || 'guest';

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => StorageService.getVolume(0.8));
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(() => StorageService.getShuffle());
  const [repeat, setRepeat] = useState<RepeatMode>(() => StorageService.getRepeat());
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [upgradedToast, setUpgradedToast] = useState<string | null>(null);

  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;

  const queueIndexRef = useRef<number>(-1);
  queueIndexRef.current = queueIndex;

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setUpgradedToast(msg);
    toastTimeoutRef.current = setTimeout(() => setUpgradedToast(null), 3500);
  }, []);

  const isLiveStream = currentTrack?.playbackMode === 'live' || currentTrack?.sourceType === 'radio';

  // Initialize audio element once on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        setIsLoading(false);
        const audioDuration = audio.duration;
        if (Number.isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
        }
      }
    };

    const handleAudioError = async () => {
      const mediaError = audio.error;
      console.warn('Audio element error:', mediaError);

      // Attempt backend streaming proxy fallback if direct CDN fails
      const current = currentTrackRef.current;
      if (current && current.audioUrl && !audio.src.includes('/api/stream_proxy') && !audio.src.startsWith('blob:')) {
        try {
          const proxyUrl = `http://127.0.0.1:5000/api/stream_proxy?url=${encodeURIComponent(current.audioUrl)}`;
          audio.src = proxyUrl;
          audio.load();
          await audio.play();
          setIsPlaying(true);
          setIsLoading(false);
          setError(null);
          return;
        } catch (e) {
          console.warn('Streaming proxy fallback also failed:', e);
        }
      }

      setIsLoading(false);
      setIsPlaying(false);
      let msg = 'Failed to load audio track.';
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        msg = 'You are offline. Only downloaded tracks can be played without internet.';
      } else if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            msg = 'Playback aborted by user.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            msg = 'Network connection issue while streaming audio.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            msg = 'Audio decoding error.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = 'Stream unavailable. Please retry or play another track.';
            break;
        }
      }
      setError(msg);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleAudioError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume and mute on audio element when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Load and play a specific track (with offline playback support)
  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setIsLoading(true);

    const isNetworkOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    // Strict Full-Length Song Enforcement:
    // If a 30s preview track is received (e.g. from legacy history or cached playlists),
    // automatically upgrade it to a genuine full-length studio track before playing.
    let targetTrack = track;
    if (targetTrack.playbackMode === 'preview' || targetTrack.sourceType === 'itunes' || targetTrack.duration === 30) {
      if (!isNetworkOffline) {
        try {
          const upgraded = await SaavnApi.upgradePreviewToFullSong(targetTrack);
          if (upgraded && upgraded.playbackMode === 'full') {
            targetTrack = upgraded;
            setUpgradedToast(`⚡ Loaded Full Song: "${upgraded.title}"!`);
            setTimeout(() => setUpgradedToast(null), 3000);
          } else {
            setIsLoading(false);
            setIsPlaying(false);
            showToast(`⚠️ Only full songs are supported. 30s preview removed.`);
            return;
          }
        } catch {
          setIsLoading(false);
          setIsPlaying(false);
          showToast(`⚠️ Only full songs are supported.`);
          return;
        }
      } else {
        setIsLoading(false);
        setIsPlaying(false);
        showToast(`⚠️ Only full songs are supported.`);
        return;
      }
    }

    // Resolve audio source: check if downloaded locally in IndexedDB first
    let audioSrc = targetTrack.audioUrl;
    let isPlayingFromOffline = false;

    try {
      const offlineBlobUrl = await OfflineStorage.getOfflineAudioUrl(targetTrack.id);
      if (offlineBlobUrl) {
        audioSrc = offlineBlobUrl;
        isPlayingFromOffline = true;
      }
    } catch {
      // Fallback to targetTrack.audioUrl
    }

    // Check if network is offline and track is not downloaded
    if (isNetworkOffline && !isPlayingFromOffline) {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Offline mode: This track is not downloaded for offline playback.');
      showToast('⚠️ You are offline. Play downloaded songs or connect to internet.');
      return;
    }

    const activeTrack: Track = {
      ...targetTrack,
      isDownloaded: isPlayingFromOffline || targetTrack.isDownloaded,
      playedAt: new Date().toISOString(),
    };

    setCurrentTrack(activeTrack);
    setCurrentTime(0);
    setDuration(targetTrack.duration || 0);

    if (isPlayingFromOffline) {
      showToast('💾 Playing from SoundWave Downloads (Offline)');
    }

    // Update queue if provided, or preserve and insert track if not present
    if (newQueue && newQueue.length > 0) {
      const sanitizedQueue = newQueue.filter(t => t.playbackMode === 'full' || t.playbackMode === 'live');
      const queueToSet = sanitizedQueue.length > 0 ? sanitizedQueue : [activeTrack];
      setQueue(queueToSet);
      const idx = queueToSet.findIndex(t => t.id === activeTrack.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue(prevQueue => {
        const idx = prevQueue.findIndex(t => t.id === activeTrack.id);
        if (idx !== -1) {
          setQueueIndex(idx);
          return prevQueue;
        } else {
          const insertIdx = queueIndexRef.current >= 0 ? queueIndexRef.current + 1 : prevQueue.length;
          const updated = [...prevQueue.slice(0, insertIdx), activeTrack, ...prevQueue.slice(insertIdx)];
          setQueueIndex(insertIdx);
          return updated;
        }
      });
    }

    // Set audio source and play
    try {
      audio.pause();
      audio.src = audioSrc;
      audio.currentTime = 0;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      // If direct CDN stream failed, try proxying through backend stream proxy
      if (!isPlayingFromOffline && !isNetworkOffline && audioSrc.startsWith('http')) {
        try {
          const proxyUrl = `http://127.0.0.1:5000/api/stream_proxy?url=${encodeURIComponent(audioSrc)}`;
          audio.src = proxyUrl;
          audio.currentTime = 0;
          audio.load();
          await audio.play();
          setIsPlaying(true);
          setIsLoading(false);
          return;
        } catch {
          // Proxy also failed
        }
      }
      setIsLoading(false);
      setIsPlaying(false);
      const errorMsg = err instanceof Error ? err.message : 'Audio playback error';
      console.warn('Playback initiation error:', errorMsg);
      setError(`Audio playback error: ${errorMsg}`);
    }

    // Save to user listening history in background
    try {
      const recent = StorageService.getRecentlyPlayed(userIdRef.current);
      const filtered = recent.filter(t => t.id !== activeTrack.id && t.playbackMode === 'full');
      StorageService.saveRecentlyPlayed([activeTrack, ...filtered], userIdRef.current);
      window.dispatchEvent(new Event('soundwave_recent_updated'));
    } catch (e) {
      console.warn('Failed to update recent tracks:', e);
    }
  }, [showToast]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setError(null);
      setIsLoading(true);
      audio.play().catch(err => {
        setIsLoading(false);
        setError(`Playback error: ${err.message}`);
      });
    }
  }, [isPlaying, currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    try {
      setError(null);
      setIsLoading(true);
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch {
      // If direct playback fails, fallback to stream proxy
      if (currentTrack.audioUrl && currentTrack.audioUrl.startsWith('http') && !audio.src.includes('/api/stream_proxy')) {
        try {
          audio.src = `http://127.0.0.1:5000/api/stream_proxy?url=${encodeURIComponent(currentTrack.audioUrl)}`;
          audio.load();
          await audio.play();
          setIsPlaying(true);
          setIsLoading(false);
          return;
        } catch {
          // Both failed
        }
      }
      setIsLoading(false);
      setIsPlaying(false);
      setError('Playback failed. Please try another track.');
    }
  }, [currentTrack]);

  const next = useCallback(() => {
    if (queue.length === 0) return;

    if (shuffle && queue.length > 1) {
      let randIdx = Math.floor(Math.random() * queue.length);
      if (randIdx === queueIndex) {
        randIdx = (randIdx + 1) % queue.length;
      }
      setQueueIndex(randIdx);
      playTrack(queue[randIdx], queue);
      return;
    }

    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      playTrack(queue[nextIdx], queue);
    } else if (repeat === 'all') {
      setQueueIndex(0);
      playTrack(queue[0], queue);
    } else {
      // Reached end of queue without repeat-all
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [queue, queueIndex, shuffle, repeat, playTrack]);

  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;

    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      playTrack(queue[prevIdx], queue);
    } else {
      // Loop to end if repeat is all
      if (repeat === 'all') {
        const lastIdx = queue.length - 1;
        setQueueIndex(lastIdx);
        playTrack(queue[lastIdx], queue);
      } else {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        setCurrentTime(0);
      }
    }
  }, [queue, queueIndex, repeat, playTrack]);

  // Handle track ending logic (repeat one vs next track)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Repeat one failed:', e));
      } else {
        next();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeat, next]);

  const seek = useCallback((timeInSeconds: number) => {
    const audio = audioRef.current;
    if (!audio || isLiveStream) return;

    const clamped = Math.max(0, Math.min(timeInSeconds, duration || audio.duration || 0));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration, isLiveStream]);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    StorageService.saveVolume(clamped);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const nextVal = !prev;
      StorageService.saveShuffle(nextVal);
      return nextVal;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextMode = modes[(modes.indexOf(prev) + 1) % modes.length];
      StorageService.saveRepeat(nextMode);
      return nextMode;
    });
  }, []);

  const playAll = useCallback(async (tracks: Track[], startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    await playTrack(tracks[clampedIndex], tracks);
  }, [playTrack]);

  const playShuffled = useCallback(async (tracks: Track[]) => {
    if (!tracks || tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setShuffle(true);
    StorageService.saveShuffle(true);
    await playTrack(shuffled[0], shuffled);
  }, [playTrack]);

  const playNext = useCallback((track: Track) => {
    if (!currentTrack || queue.length === 0) {
      playTrack(track, [track]);
      return;
    }
    setQueue(prev => {
      // Remove any existing copy to prevent duplicate keys
      const filtered = prev.filter(t => t.id !== track.id);
      const currIdx = filtered.findIndex(t => t.id === currentTrack.id);
      const targetIdx = currIdx >= 0 ? currIdx + 1 : filtered.length;
      return [...filtered.slice(0, targetIdx), track, ...filtered.slice(targetIdx)];
    });
    showToast(`🎵 Queued next: "${track.title}"`);
  }, [currentTrack, queue.length, playTrack, showToast]);

  const addToQueue = useCallback((track: Track) => {
    if (!currentTrack || queue.length === 0) {
      playTrack(track, [track]);
      return;
    }
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) {
        return prev;
      }
      return [...prev, track];
    });
    showToast(`➕ Added to queue: "${track.title}"`);
  }, [currentTrack, queue.length, playTrack, showToast]);

  const jumpToQueueIndex = useCallback((index: number) => {
    if (index >= 0 && index < queue.length) {
      setQueueIndex(index);
      playTrack(queue[index], queue);
    }
  }, [queue, playTrack]);

  const removeFromQueue = useCallback((indexToRemove: number) => {
    setQueue(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setQueueIndex(prev => {
      if (indexToRemove < prev) return prev - 1;
      if (indexToRemove === prev) return Math.min(prev, queue.length - 2);
      return prev;
    });
  }, [queue.length]);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
    showToast('🗑️ Cleared queue');
  }, [currentTrack, showToast]);

  const convertToFullSong = useCallback(async (track: Track): Promise<boolean> => {
    if (track.playbackMode === 'full') return true;

    try {
      setIsLoading(true);
      const upgraded = await SaavnApi.upgradePreviewToFullSong(track);
      setIsLoading(false);
      if (upgraded) {
        // If current track is this track, update playback
        if (currentTrackRef.current?.id === track.id && audioRef.current) {
          const currentPos = audioRef.current.currentTime;
          audioRef.current.src = upgraded.audioUrl;
          audioRef.current.currentTime = currentPos;
          audioRef.current.play().catch(e => console.warn('Resume error:', e));
          setCurrentTrack(upgraded);
          currentTrackRef.current = upgraded;
          setDuration(upgraded.duration);
        }
        // Update queue
        setQueue(q => q.map(item => item.id === track.id ? upgraded : item));
        setUpgradedToast(`⚡ Converted "${track.title}" to Full Song!`);
        setTimeout(() => setUpgradedToast(null), 4000);
        return true;
      }
    } catch (e) {
      setIsLoading(false);
      console.warn('Manual full song conversion failed:', e);
    }
    return false;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
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
        queue,
        queueIndex,
        isLiveStream,
        upgradedToast,
        convertToFullSong,
        playTrack,
        playAll,
        playShuffled,
        playNext,
        jumpToQueueIndex,
        togglePlay,
        pause,
        resume,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        showToast,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
