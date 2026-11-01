import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Track, Playlist, DownloadedTrackRecord } from '../types/music';
import { StorageService } from '../services/storage';
import { OfflineStorage } from '../services/offlineStorage';
import { useAuth } from './AuthContext';

interface LibraryContextType {
  likedTracks: Track[];
  playlists: Playlist[];
  recentlyPlayed: Track[];
  downloadedTracks: DownloadedTrackRecord[];
  downloadingTrackIds: Set<string>;
  isOnline: boolean;
  totalDownloadSize: number;
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  createPlaylist: (name: string, description?: string) => Playlist;
  renamePlaylist: (id: string, newName: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  refreshRecent: () => void;
  clearHistory: () => void;
  downloadTrack: (track: Track) => Promise<void>;
  removeDownload: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
  openDownloadsFolder: () => Promise<boolean>;
  refreshDownloads: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const userIdRef = useRef<string>(userId);
  userIdRef.current = userId;

  // Network online/offline state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Core library states scoped to active account
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => StorageService.getLikedTracks(userId));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => StorageService.getPlaylists(userId));
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => StorageService.getRecentlyPlayed(userId));
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrackRecord[]>([]);
  const [downloadingTrackIds, setDownloadingTrackIds] = useState<Set<string>>(new Set());
  const [totalDownloadSize, setTotalDownloadSize] = useState<number>(0);

  // Fetch downloaded tracks from IndexedDB
  const loadDownloadedTracks = useCallback(async () => {
    try {
      const records = await OfflineStorage.getAllTracks(userIdRef.current);
      setDownloadedTracks(records);
      const totalSize = records.reduce((acc, r) => acc + (r.fileSize || 0), 0);
      setTotalDownloadSize(totalSize);
    } catch (e) {
      console.warn('Failed to load downloaded tracks from IndexedDB:', e);
    }
  }, []);

  // Reload data when active user changes (switching account or login/logout)
  useEffect(() => {
    setLikedTracks(StorageService.getLikedTracks(userId));
    setPlaylists(StorageService.getPlaylists(userId));
    setRecentlyPlayed(StorageService.getRecentlyPlayed(userId));
    loadDownloadedTracks();
  }, [userId, loadDownloadedTracks]);

  // Online / offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLikedTracks(StorageService.getLikedTracks(userIdRef.current));
      setRecentlyPlayed(StorageService.getRecentlyPlayed(userIdRef.current));
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for storage and custom events without self-referential loops
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('soundwave_recent_tracks')) {
        setRecentlyPlayed(StorageService.getRecentlyPlayed(userIdRef.current));
      } else if (e.key?.includes('soundwave_liked_tracks')) {
        setLikedTracks(StorageService.getLikedTracks(userIdRef.current));
      }
    };

    const handleRecentEvent = () => {
      setRecentlyPlayed(StorageService.getRecentlyPlayed(userIdRef.current));
    };

    const handleDownloadsEvent = () => {
      loadDownloadedTracks();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('soundwave_recent_updated', handleRecentEvent);
    window.addEventListener('soundwave_downloads_updated', handleDownloadsEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('soundwave_recent_updated', handleRecentEvent);
      window.removeEventListener('soundwave_downloads_updated', handleDownloadsEvent);
    };
  }, [loadDownloadedTracks]);

  const refreshRecent = useCallback(() => {
    setRecentlyPlayed(StorageService.getRecentlyPlayed(userIdRef.current));
  }, []);

  const clearHistory = useCallback(() => {
    StorageService.clearRecentlyPlayed(userIdRef.current);
    setRecentlyPlayed([]);
  }, []);

  const isLiked = useCallback((trackId: string): boolean => {
    return likedTracks.some(t => t.id === trackId);
  }, [likedTracks]);

  const toggleLike = useCallback((track: Track) => {
    setLikedTracks(prev => {
      const exists = prev.some(t => t.id === track.id);
      const updated = exists
        ? prev.filter(t => t.id !== track.id)
        : [{ ...track, playedAt: new Date().toISOString() }, ...prev];
      StorageService.saveLikedTracks(updated, userIdRef.current);
      return updated;
    });
  }, []);

  const createPlaylist = useCallback((name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim() || 'My Playlist',
      description: description || 'Created with SoundWave',
      artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPlaylists(prev => {
      const updated = [newPlaylist, ...prev];
      StorageService.savePlaylists(updated, userIdRef.current);
      return updated;
    });
    return newPlaylist;
  }, []);

  const renamePlaylist = useCallback((id: string, newName: string) => {
    setPlaylists(prev => {
      const updated = prev.map(pl =>
        pl.id === id
          ? { ...pl, name: newName.trim(), updatedAt: new Date().toISOString() }
          : pl
      );
      StorageService.savePlaylists(updated, userIdRef.current);
      return updated;
    });
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(pl => pl.id !== id);
      StorageService.savePlaylists(updated, userIdRef.current);
      return updated;
    });
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id !== playlistId) return pl;
        if (pl.tracks.some(t => t.id === track.id)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, track],
          updatedAt: new Date().toISOString(),
          artwork: pl.tracks.length === 0 ? track.artwork : pl.artwork,
        };
      });
      StorageService.savePlaylists(updated, userIdRef.current);
      return updated;
    });
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter(t => t.id !== trackId),
          updatedAt: new Date().toISOString(),
        };
      });
      StorageService.savePlaylists(updated, userIdRef.current);
      return updated;
    });
  }, []);

  // Offline Downloads Management
  const isDownloaded = useCallback((trackId: string): boolean => {
    return downloadedTracks.some(r => r.id === trackId);
  }, [downloadedTracks]);

  const downloadTrack = useCallback(async (track: Track) => {
    if (downloadingTrackIds.has(track.id)) return;

    setDownloadingTrackIds(prev => new Set(prev).add(track.id));
    try {
      await OfflineStorage.downloadTrack(track, userIdRef.current);
      await loadDownloadedTracks();
    } catch (err) {
      console.error('Download failed:', err);
      throw err;
    } finally {
      setDownloadingTrackIds(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  }, [downloadingTrackIds, loadDownloadedTracks]);

  const removeDownload = useCallback(async (trackId: string) => {
    try {
      await OfflineStorage.deleteTrack(trackId);
      await loadDownloadedTracks();
    } catch (err) {
      console.warn('Failed to remove download:', err);
    }
  }, [loadDownloadedTracks]);

  const openDownloadsFolder = useCallback(async (): Promise<boolean> => {
    return OfflineStorage.openDownloadsFolder();
  }, []);

  const refreshDownloads = useCallback(async () => {
    await loadDownloadedTracks();
  }, [loadDownloadedTracks]);

  return (
    <LibraryContext.Provider
      value={{
        likedTracks,
        playlists,
        recentlyPlayed,
        downloadedTracks,
        downloadingTrackIds,
        isOnline,
        totalDownloadSize,
        toggleLike,
        isLiked,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        refreshRecent,
        clearHistory,
        downloadTrack,
        removeDownload,
        isDownloaded,
        openDownloadsFolder,
        refreshDownloads,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextType => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
