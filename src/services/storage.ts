import type { Track, Playlist, RepeatMode } from '../types/music';

const BASE_KEYS = {
  LIKED: 'soundwave_liked_tracks',
  PLAYLISTS: 'soundwave_playlists',
  RECENT: 'soundwave_recent_tracks',
  VOLUME: 'soundwave_volume',
  SHUFFLE: 'soundwave_shuffle',
  REPEAT: 'soundwave_repeat',
};

function getKey(base: string, userId?: string): string {
  if (!userId || userId === 'guest') {
    return `${base}_guest`;
  }
  return `${base}_${userId}`;
}

export const StorageService = {
  getLikedTracks(userId?: string): Track[] {
    try {
      const userKey = getKey(BASE_KEYS.LIKED, userId);
      let data = localStorage.getItem(userKey);

      // Backwards-compatibility fallback to root key
      if (!data) {
        data = localStorage.getItem(BASE_KEYS.LIKED);
        if (data) {
          // Migrate to scoped key
          localStorage.setItem(userKey, data);
        }
      }

      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load liked tracks from localStorage:', e);
      return [];
    }
  },

  saveLikedTracks(tracks: Track[], userId?: string): void {
    try {
      const userKey = getKey(BASE_KEYS.LIKED, userId);
      localStorage.setItem(userKey, JSON.stringify(tracks));
      // Also update root key for legacy compatibility if guest
      if (!userId || userId === 'guest') {
        localStorage.setItem(BASE_KEYS.LIKED, JSON.stringify(tracks));
      }
      window.dispatchEvent(new CustomEvent('soundwave_liked_updated', { detail: { userId } }));
    } catch (e) {
      console.warn('Failed to save liked tracks to localStorage:', e);
    }
  },

  getPlaylists(userId?: string): Playlist[] {
    try {
      const userKey = getKey(BASE_KEYS.PLAYLISTS, userId);
      let data = localStorage.getItem(userKey);

      if (!data) {
        data = localStorage.getItem(BASE_KEYS.PLAYLISTS);
        if (data) {
          localStorage.setItem(userKey, data);
          return JSON.parse(data);
        }
      } else {
        return JSON.parse(data);
      }

      // Default sample playlists for initial setup
      const defaultPlaylists: Playlist[] = [
        {
          id: 'pl-favorites',
          name: 'My Heavy Rotation',
          description: 'Your favorite handpicked tracks in high quality.',
          artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pl-lofi',
          name: 'Late Night Chill',
          description: 'Relaxing beats to study, code and unwind to.',
          artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      this.savePlaylists(defaultPlaylists, userId);
      return defaultPlaylists;
    } catch (e) {
      console.warn('Failed to load playlists from localStorage:', e);
      return [];
    }
  },

  savePlaylists(playlists: Playlist[], userId?: string): void {
    try {
      const userKey = getKey(BASE_KEYS.PLAYLISTS, userId);
      localStorage.setItem(userKey, JSON.stringify(playlists));
      if (!userId || userId === 'guest') {
        localStorage.setItem(BASE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      }
      window.dispatchEvent(new CustomEvent('soundwave_playlists_updated', { detail: { userId } }));
    } catch (e) {
      console.warn('Failed to save playlists to localStorage:', e);
    }
  },

  getRecentlyPlayed(userId?: string): Track[] {
    try {
      const userKey = getKey(BASE_KEYS.RECENT, userId);
      let data = localStorage.getItem(userKey);

      if (!data) {
        data = localStorage.getItem(BASE_KEYS.RECENT);
        if (data) {
          localStorage.setItem(userKey, data);
        }
      }

      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load recently played tracks from localStorage:', e);
      return [];
    }
  },

  saveRecentlyPlayed(tracks: Track[], userId?: string): void {
    try {
      const userKey = getKey(BASE_KEYS.RECENT, userId);
      // Keep maximum 60 recent items with valid timestamps
      const slice = tracks.slice(0, 60);
      localStorage.setItem(userKey, JSON.stringify(slice));
      if (!userId || userId === 'guest') {
        localStorage.setItem(BASE_KEYS.RECENT, JSON.stringify(slice));
      }
      window.dispatchEvent(new CustomEvent('soundwave_recent_updated', { detail: { userId } }));
    } catch (e) {
      console.warn('Failed to save recently played tracks to localStorage:', e);
    }
  },

  clearRecentlyPlayed(userId?: string): void {
    try {
      const userKey = getKey(BASE_KEYS.RECENT, userId);
      localStorage.removeItem(userKey);
      if (!userId || userId === 'guest') {
        localStorage.removeItem(BASE_KEYS.RECENT);
      }
      window.dispatchEvent(new CustomEvent('soundwave_recent_updated', { detail: { userId } }));
    } catch (e) {
      console.warn('Failed to clear recently played tracks:', e);
    }
  },

  getVolume(defaultValue = 0.8): number {
    try {
      const v = localStorage.getItem(BASE_KEYS.VOLUME);
      return v !== null ? parseFloat(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  saveVolume(volume: number): void {
    try {
      localStorage.setItem(BASE_KEYS.VOLUME, volume.toString());
    } catch (e) {
      console.warn('Failed to save volume preference:', e);
    }
  },

  getShuffle(): boolean {
    try {
      return localStorage.getItem(BASE_KEYS.SHUFFLE) === 'true';
    } catch {
      return false;
    }
  },

  saveShuffle(shuffle: boolean): void {
    try {
      localStorage.setItem(BASE_KEYS.SHUFFLE, shuffle ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to save shuffle preference:', e);
    }
  },

  getRepeat(): RepeatMode {
    try {
      const rep = localStorage.getItem(BASE_KEYS.REPEAT);
      if (rep === 'one' || rep === 'all' || rep === 'off') return rep;
      return 'off';
    } catch {
      return 'off';
    }
  },

  saveRepeat(repeat: RepeatMode): void {
    try {
      localStorage.setItem(BASE_KEYS.REPEAT, repeat);
    } catch (e) {
      console.warn('Failed to save repeat preference:', e);
    }
  }
};
