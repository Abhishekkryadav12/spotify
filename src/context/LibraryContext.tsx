import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Track, Playlist } from '../types/music';
import { StorageService } from '../services/storage';

interface LibraryContextType {
  likedTracks: Track[];
  playlists: Playlist[];
  recentlyPlayed: Track[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  const refreshLibrary = useCallback(async () => {
    const [liked, pls, recent] = await Promise.all([
      StorageService.getLikedTracks(),
      StorageService.getPlaylists(),
      StorageService.getRecentlyPlayed(),
    ]);
    setLikedTracks(liked);
    setPlaylists(pls);
    setRecentlyPlayed(recent);
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const isLiked = useCallback((trackId: string): boolean => {
    return likedTracks.some(t => t.id === trackId);
  }, [likedTracks]);

  const toggleLike = useCallback(async (track: Track) => {
    const exists = likedTracks.some(t => t.id === track.id);
    let updated: Track[];
    if (exists) {
      updated = likedTracks.filter(t => t.id !== track.id);
    } else {
      updated = [track, ...likedTracks];
    }
    setLikedTracks(updated);
    await StorageService.saveLikedTracks(updated);
  }, [likedTracks]);

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: name.trim() || 'My Playlist',
      description: description || 'Created on mobile',
      artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newPlaylist, ...playlists];
    setPlaylists(updated);
    await StorageService.savePlaylists(updated);
    return newPlaylist;
  }, [playlists]);

  const deletePlaylist = useCallback(async (id: string) => {
    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
    await StorageService.savePlaylists(updated);
  }, [playlists]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, track: Track) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      if (p.tracks.some(t => t.id === track.id)) return p;
      return {
        ...p,
        tracks: [...p.tracks, track],
        updatedAt: new Date().toISOString(),
      };
    });
    setPlaylists(updated);
    await StorageService.savePlaylists(updated);
  }, [playlists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: p.tracks.filter(t => t.id !== trackId),
        updatedAt: new Date().toISOString(),
      };
    });
    setPlaylists(updated);
    await StorageService.savePlaylists(updated);
  }, [playlists]);

  return (
    <LibraryContext.Provider
      value={{
        likedTracks,
        playlists,
        recentlyPlayed,
        isLiked,
        toggleLike,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        refreshLibrary,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
};
