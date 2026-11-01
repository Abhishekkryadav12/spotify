import type { Track, DownloadedTrackRecord } from '../types/music';

const DB_NAME = 'soundwave_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'downloaded_tracks';

// Memory cache for active Blob URLs to avoid memory leaks while allowing instant offline audio playback
const blobUrlCache = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const OfflineStorage = {
  /**
   * Check if a specific track is downloaded for offline listening
   */
  async isDownloaded(trackId: string): Promise<boolean> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(trackId);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  /**
   * Get downloaded track record by ID
   */
  async getTrack(trackId: string): Promise<DownloadedTrackRecord | null> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(trackId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Get all downloaded tracks for a user (or all if no userId)
   */
  async getAllTracks(userId?: string): Promise<DownloadedTrackRecord[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results: DownloadedTrackRecord[] = req.result || [];
          if (!userId) {
            resolve(results);
          } else {
            // Filter by userId or include tracks downloaded before auth
            const filtered = results.filter(r => !r.userId || r.userId === userId);
            resolve(filtered);
          }
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Generate or retrieve an offline Object URL for playing from IndexedDB
   */
  async getOfflineAudioUrl(trackId: string): Promise<string | null> {
    if (blobUrlCache.has(trackId)) {
      return blobUrlCache.get(trackId)!;
    }

    const record = await this.getTrack(trackId);
    if (!record || !record.audioBlob) return null;

    try {
      const objectUrl = URL.createObjectURL(record.audioBlob);
      blobUrlCache.set(trackId, objectUrl);
      return objectUrl;
    } catch (e) {
      console.warn('Failed to create Blob URL for offline playback:', e);
      return null;
    }
  },

  /**
   * Save a downloaded track record into IndexedDB
   */
  async saveRecord(record: DownloadedTrackRecord): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => {
        // Cache object URL
        if (record.audioBlob) {
          const url = URL.createObjectURL(record.audioBlob);
          blobUrlCache.set(record.id, url);
        }
        window.dispatchEvent(new CustomEvent('soundwave_downloads_updated'));
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Delete a downloaded track from offline storage
   */
  async deleteTrack(trackId: string): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(trackId);
        req.onsuccess = () => {
          if (blobUrlCache.has(trackId)) {
            URL.revokeObjectURL(blobUrlCache.get(trackId)!);
            blobUrlCache.delete(trackId);
          }
          window.dispatchEvent(new CustomEvent('soundwave_downloads_updated'));
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Failed to delete offline track:', e);
    }
  },

  /**
   * Clear all downloaded tracks
   */
  async clearAll(userId?: string): Promise<void> {
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      if (!userId) {
        store.clear();
      } else {
        const tracks = await this.getAllTracks(userId);
        tracks.forEach(t => store.delete(t.id));
      }

      blobUrlCache.forEach(url => URL.revokeObjectURL(url));
      blobUrlCache.clear();
      window.dispatchEvent(new CustomEvent('soundwave_downloads_updated'));
    } catch (e) {
      console.warn('Failed to clear offline downloads:', e);
    }
  },

  /**
   * Download a track for offline listening:
   * 1. Fetches audio Blob into IndexedDB for 100% offline playback.
   * 2. Also saves the audio into the dedicated SoundWave Downloads folder on disk via backend API.
   */
  async downloadTrack(
    track: Track,
    userId?: string,
    onProgress?: (percent: number) => void
  ): Promise<DownloadedTrackRecord> {
    if (!track.audioUrl) {
      throw new Error('Track does not have a valid audio URL to download.');
    }

    onProgress?.(10);

    // 1. Fetch the audio binary stream in browser
    const response = await fetch(track.audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    onProgress?.(40);
    const audioBlob = await response.blob();
    onProgress?.(70);

    const safeTitle = track.title.replace(/[\\/*?:"<>|]/g, '').trim() || 'Track';
    const safeArtist = track.artist.replace(/[\\/*?:"<>|]/g, '').trim() || 'Artist';
    const ext = track.audioUrl.toLowerCase().includes('.mp3') ? '.mp3' : '.mp4';
    const fileName = `${safeArtist} - ${safeTitle}${ext}`;

    // 2. Also notify the backend to persist to the dedicated "SoundWave Downloads" folder on disk
    let localPath: string | undefined;
    try {
      const backendEndpoints = [
        '/api/saavn/api/save_download',
        'http://127.0.0.1:5000/api/save_download',
      ];

      for (const ep of backendEndpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              track_id: track.id,
              title: track.title,
              artist: track.artist,
              audio_url: track.audioUrl,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.filepath) {
              localPath = data.filepath;
              break;
            }
          }
        } catch {
          // Continue to next endpoint fallback
        }
      }
    } catch {
      // Backend folder save is best-effort; offline IndexedDB storage is guaranteed
    }

    onProgress?.(90);

    // 3. Create the record for IndexedDB
    const record: DownloadedTrackRecord = {
      id: track.id,
      userId: userId || 'guest',
      track: {
        ...track,
        isDownloaded: true,
        fileSize: audioBlob.size,
        downloadedAt: new Date().toISOString(),
      },
      audioBlob,
      fileName,
      fileSize: audioBlob.size,
      downloadedAt: new Date().toISOString(),
      localPath,
    };

    await this.saveRecord(record);

    // 4. Trigger direct file download to user's device
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const downloadUrl = URL.createObjectURL(audioBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
      }
    } catch (e) {
      console.warn('Browser direct file trigger skipped:', e);
    }

    onProgress?.(100);

    return record;
  },

  /**
   * Open the dedicated SoundWave Downloads folder in the user's system file manager (Windows Explorer)
   */
  async openDownloadsFolder(): Promise<boolean> {
    const endpoints = [
      '/api/saavn/api/open_downloads_folder',
      'http://127.0.0.1:5000/api/open_downloads_folder',
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep);
        if (res.ok) return true;
      } catch {
        continue;
      }
    }
    return false;
  },

  /**
   * Calculate total storage size used by downloaded tracks
   */
  async getTotalStorageUsed(userId?: string): Promise<number> {
    const tracks = await this.getAllTracks(userId);
    return tracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);
  },

  /**
   * Helper to format bytes to human-readable size
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
};
