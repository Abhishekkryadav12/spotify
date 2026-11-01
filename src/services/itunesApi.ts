import type { Track } from '../types/music';

// In-memory cache for queries and charts
const cache = new Map<string, { data: Track[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  trackViewUrl?: string;
  trackExplicitness?: string;
  releaseDate?: string;
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesResult[];
}

function mapITunesItemToTrack(item: ITunesResult): Track | null {
  // If there's no previewUrl, we cannot provide audio playback
  if (!item.previewUrl || !item.trackName || !item.artistName) {
    return null;
  }

  // Get high-resolution artwork (replace 100x100 with 600x600 in the URL)
  let highResArtwork = item.artworkUrl100 || '';
  if (highResArtwork.includes('100x100bb.jpg')) {
    highResArtwork = highResArtwork.replace('100x100bb.jpg', '600x600bb.jpg');
  } else if (highResArtwork.includes('100x100')) {
    highResArtwork = highResArtwork.replace('100x100', '600x600');
  }

  return {
    id: `itunes-${item.trackId}`,
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName || 'Single',
    artwork: highResArtwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: item.previewUrl,
    // Official Apple iTunes preview duration is 30 seconds
    duration: 30,
    sourceType: 'itunes',
    playbackMode: 'preview',
    externalUrl: item.trackViewUrl,
    genre: item.primaryGenreName,
    isExplicit: item.trackExplicitness === 'explicit',
    releaseDate: item.releaseDate,
    sourceLabel: 'Apple iTunes (30s Preview)',
  };
}

export const ITunesApi = {
  /**
   * Search tracks by query string (song, artist, or album)
   */
  async searchTracks(query: string, limit = 25): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cacheKey = `search:${trimmed.toLowerCase()}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`iTunes API responded with status ${response.status}`);
      }

      const data: ITunesSearchResponse = await response.json();
      const tracks: Track[] = (data.results || [])
        .map(mapITunesItemToTrack)
        .filter((t): t is Track => t !== null);

      cache.set(cacheKey, { data: tracks, timestamp: Date.now() });
      return tracks;
    } catch (error) {
      console.error('Error fetching from iTunes API:', error);
      throw error;
    }
  },

  /**
   * Fetch curated popular/trending tracks by genre or keyword
   */
  async getTopTracksByGenre(genre: string, limit = 15): Promise<Track[]> {
    const cacheKey = `genre:${genre}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(genre)}&entity=song&attribute=genreIndex&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        // Fallback to general term search if attribute is too restrictive
        return await this.searchTracks(genre, limit);
      }

      const data: ITunesSearchResponse = await response.json();
      let tracks: Track[] = (data.results || [])
        .map(mapITunesItemToTrack)
        .filter((t): t is Track => t !== null);

      // If genreIndex returned empty, do a standard term search
      if (tracks.length === 0) {
        tracks = await this.searchTracks(`${genre} hits`, limit);
      }

      cache.set(cacheKey, { data: tracks, timestamp: Date.now() });
      return tracks;
    } catch (error) {
      console.warn(`Failed to fetch top tracks for genre "${genre}", falling back to term search:`, error);
      return this.searchTracks(genre, limit);
    }
  },

  /**
   * Get tracks by artist name
   */
  async getArtistTracks(artistName: string, limit = 10): Promise<Track[]> {
    const cacheKey = `artist:${artistName}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&attribute=artistTerm&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        return this.searchTracks(artistName, limit);
      }

      const data: ITunesSearchResponse = await response.json();
      const tracks: Track[] = (data.results || [])
        .map(mapITunesItemToTrack)
        .filter((t): t is Track => t !== null);

      cache.set(cacheKey, { data: tracks, timestamp: Date.now() });
      return tracks;
    } catch (error) {
      console.warn(`Failed to fetch artist tracks for "${artistName}":`, error);
      return this.searchTracks(artistName, limit);
    }
  }
};
