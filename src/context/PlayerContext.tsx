import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import type { Track, RepeatMode } from '../types/music';
import { SaavnApi } from '../services/saavnApi';
import { StorageService } from '../services/storage';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Track[];
  queueIndex: number;
  toastMessage: string | null;
  isPlayerModalVisible: boolean;
  playTrack: (track: Track, contextQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionSeconds: number) => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  setPlayerModalVisible: (visible: boolean) => void;
  showToast: (msg: string) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlayerModalVisible, setPlayerModalVisible] = useState<boolean>(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;
  const queueRef = useRef<Track[]>(queue);
  queueRef.current = queue;
  const queueIndexRef = useRef<number>(queueIndex);
  queueIndexRef.current = queueIndex;
  const repeatRef = useRef<RepeatMode>(repeat);
  repeatRef.current = repeat;
  const shuffleRef = useRef<boolean>(shuffle);
  shuffleRef.current = shuffle;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Configure Expo Audio mode on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(e => console.warn('Audio.setAudioModeAsync error:', e));

    StorageService.getShuffle().then(setShuffle);
    StorageService.getRepeat().then(setRepeat);

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.warn('Playback error:', status.error);
        setIsLoading(false);
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setIsLoading(status.isBuffering);
    setCurrentTime(status.positionMillis / 1000);

    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }

    // Auto advance when song finishes
    if (status.didJustFinish && !status.isLooping) {
      handleSongEnd();
    }
  }, []);

  const handleSongEnd = () => {
    const rep = repeatRef.current;
    if (rep === 'one') {
      if (soundRef.current) {
        soundRef.current.replayAsync().catch(() => {});
      }
      return;
    }

    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;

    if (currentQ.length === 0) return;

    if (currentIdx < currentQ.length - 1) {
      const nextIdx = currentIdx + 1;
      playTrack(currentQ[nextIdx], currentQ);
    } else if (rep === 'all') {
      playTrack(currentQ[0], currentQ);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const playTrack = useCallback(async (track: Track, contextQueue?: Track[]) => {
    try {
      setIsLoading(true);

      // Strict Full Song Enforcement:
      // If a 30s preview was clicked, automatically upgrade it to full length track
      let targetTrack = track;
      if (targetTrack.playbackMode === 'preview' || targetTrack.duration === 30 || targetTrack.sourceType === 'itunes') {
        const upgraded = await SaavnApi.upgradePreviewToFullSong(targetTrack);
        if (upgraded && upgraded.playbackMode === 'full') {
          targetTrack = upgraded;
          showToast(`⚡ Loaded Full Song: "${upgraded.title}"`);
        } else {
          setIsLoading(false);
          showToast('⚠️ Only full length songs are playable.');
          return;
        }
      }

      // Unload previous audio sound
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      setCurrentTrack(targetTrack);
      setCurrentTime(0);
      setDuration(targetTrack.duration || 0);

      // Manage queue
      if (contextQueue && contextQueue.length > 0) {
        const sanitized = contextQueue.filter(t => t.playbackMode === 'full' || t.playbackMode === 'live');
        const qToSet = sanitized.length > 0 ? sanitized : [targetTrack];
        setQueue(qToSet);
        const idx = qToSet.findIndex(t => t.id === targetTrack.id);
        setQueueIndex(idx !== -1 ? idx : 0);
      } else {
        setQueue(prev => {
          const idx = prev.findIndex(t => t.id === targetTrack.id);
          if (idx !== -1) {
            setQueueIndex(idx);
            return prev;
          }
          const newQ = [...prev, targetTrack];
          setQueueIndex(newQ.length - 1);
          return newQ;
        });
      }

      // Create and play sound with Expo Audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: targetTrack.audioUrl },
        {
          shouldPlay: true,
          volume: volume,
          isLooping: repeatRef.current === 'one',
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsLoading(false);
      setIsPlaying(true);

      // Save to recent tracks
      StorageService.getRecentlyPlayed().then(recent => {
        const filtered = recent.filter(t => t.id !== targetTrack.id && t.playbackMode === 'full');
        StorageService.saveRecentlyPlayed([targetTrack, ...filtered].slice(0, 50));
      });
    } catch (err) {
      console.warn('Error in playTrack:', err);
      setIsLoading(false);
      setIsPlaying(false);
      showToast('⚠️ Playback error, please try another track.');
    }
  }, [volume, onPlaybackStatusUpdate, showToast]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) {
      if (currentTrack) {
        await playTrack(currentTrack, queue);
      }
      return;
    }

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('togglePlay error:', e);
    }
  }, [isPlaying, currentTrack, queue, playTrack]);

  const pause = useCallback(async () => {
    if (soundRef.current && isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(async () => {
    if (soundRef.current && !isPlaying) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const next = useCallback(async () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    if (shuffleRef.current) {
      const randomIdx = Math.floor(Math.random() * q.length);
      await playTrack(q[randomIdx], q);
      return;
    }

    if (idx < q.length - 1) {
      await playTrack(q[idx + 1], q);
    } else if (repeatRef.current === 'all') {
      await playTrack(q[0], q);
    }
  }, [playTrack]);

  const previous = useCallback(async () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    // If more than 3 seconds in, restart current song
    if (currentTime > 3 && soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      return;
    }

    if (idx > 0) {
      await playTrack(q[idx - 1], q);
    } else {
      await playTrack(q[0], q);
    }
  }, [currentTime, playTrack]);

  const seek = useCallback(async (positionSeconds: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(positionSeconds * 1000);
        setCurrentTime(positionSeconds);
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
  }, []);

  const setVolume = useCallback(async (vol: number) => {
    setVolumeState(vol);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(vol);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const nextVal = !prev;
      StorageService.saveShuffle(nextVal);
      showToast(nextVal ? '🔀 Shuffle On' : '➡️ Shuffle Off');
      return nextVal;
    });
  }, [showToast]);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      const nextVal: RepeatMode = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      StorageService.saveRepeat(nextVal);
      if (soundRef.current) {
        soundRef.current.setIsLoopingAsync(nextVal === 'one');
      }
      showToast(nextVal === 'all' ? '🔁 Repeat All' : nextVal === 'one' ? '🔂 Repeat One' : '➡️ Repeat Off');
      return nextVal;
    });
  }, [showToast]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      return [...prev, track];
    });
    showToast(`➕ Added "${track.title}" to Queue`);
  }, [showToast]);

  const playNext = useCallback((track: Track) => {
    setQueue(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const currIdx = queueIndexRef.current;
      const targetIdx = currIdx >= 0 ? currIdx + 1 : 0;
      return [...filtered.slice(0, targetIdx), track, ...filtered.slice(targetIdx)];
    });
    showToast(`🎵 Up Next: "${track.title}"`);
  }, [showToast]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        queue,
        queueIndex,
        toastMessage,
        isPlayerModalVisible,
        playTrack,
        togglePlay,
        pause,
        resume,
        next,
        previous,
        seek,
        setVolume,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        playNext,
        setPlayerModalVisible,
        showToast,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};
