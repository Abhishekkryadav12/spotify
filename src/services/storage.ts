import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Track, Playlist, RepeatMode } from '../types/music';

const KEYS = {
  LIKED: 'soundwave_liked_tracks',
  PLAYLISTS: 'soundwave_playlists',
  RECENT: 'soundwave_recent_tracks',
  SHUFFLE: 'soundwave_shuffle',
  REPEAT: 'soundwave_repeat',
};

export const StorageService = {
  async getLikedTracks(): Promise<Track[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LIKED);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load liked tracks:', e);
      return [];
    }
  },

  async saveLikedTracks(tracks: Track[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LIKED, JSON.stringify(tracks));
    } catch (e) {
      console.warn('Failed to save liked tracks:', e);
    }
  },

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PLAYLISTS);
      if (data) {
        return JSON.parse(data);
      }
      const defaultPlaylists: Playlist[] = [
        {
          id: 'pl-heavy-rotation',
          name: 'My Heavy Rotation',
          description: 'Your favorite handpicked tracks in high quality.',
          artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pl-late-night',
          name: 'Late Night Chill',
          description: 'Relaxing beats to study, code and unwind to.',
          artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      await this.savePlaylists(defaultPlaylists);
      return defaultPlaylists;
    } catch (e) {
      console.warn('Failed to load playlists:', e);
      return [];
    }
  },

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists:', e);
    }
  },

  async getRecentlyPlayed(): Promise<Track[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.RECENT);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load recent tracks:', e);
      return [];
    }
  },

  async saveRecentlyPlayed(tracks: Track[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.RECENT, JSON.stringify(tracks));
    } catch (e) {
      console.warn('Failed to save recent tracks:', e);
    }
  },

  async getShuffle(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SHUFFLE);
      return data ? JSON.parse(data) : false;
    } catch {
      return false;
    }
  },

  async saveShuffle(shuffle: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SHUFFLE, JSON.stringify(shuffle));
    } catch {}
  },

  async getRepeat(): Promise<RepeatMode> {
    try {
      const data = await AsyncStorage.getItem(KEYS.REPEAT);
      return (data as RepeatMode) || 'off';
    } catch {
      return 'off';
    }
  },

  async saveRepeat(mode: RepeatMode): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.REPEAT, mode);
    } catch {}
  }
};
