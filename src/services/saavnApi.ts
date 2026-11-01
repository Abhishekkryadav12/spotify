import type { Track } from '../types/music';

const searchCache = new Map<string, { data: Track[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

interface SaavnArtist {
  id: number | string;
  name: string;
  role?: string;
  image?: string;
}

interface SaavnSongResult {
  id: string;
  title: string;
  subtitle?: string;
  music?: string;
  album: string;
  album_id?: string;
  image: string;
  language?: string;
  duration: number;
  is_320kbps?: boolean;
  media_url?: string;
  media_url_default?: string;
  vlink?: string;
  release_date?: string;
  year?: number;
  artistMap?: {
    primary_artists?: SaavnArtist[];
    featured_artists?: SaavnArtist[];
    artists?: SaavnArtist[];
  };
}

interface SaavnSearchResponse {
  type: string;
  result: SaavnSongResult[];
}

function isValidAudioUrl(url?: string): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  return !/[\x00-\x1F\x7F]/.test(url);
}

function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function mapSongToTrack(song: SaavnSongResult): Track {
  const primaryArtists = song.artistMap?.primary_artists?.map(a => a.name).filter(Boolean) || [];
  const artist = primaryArtists.length > 0 
    ? primaryArtists.join(', ')
    : cleanHtmlEntities(song.subtitle || song.music || 'Unknown Artist');

  // Select best audio URL: direct high-quality AAC/MP4 stream
  const audioUrl = (song.media_url_default || song.media_url || song.vlink || '').trim();

  // Upgrade image to high quality 500x500
  let artwork = song.image || '';
  if (artwork.includes('150x150')) {
    artwork = artwork.replace('150x150', '500x500');
  }

  return {
    id: `saavn_${song.id}`,
    title: cleanHtmlEntities(song.title),
    artist,
    album: cleanHtmlEntities(song.album || 'Single'),
    artwork: artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop',
    audioUrl,
    duration: song.duration || 180,
    sourceType: 'saavn',
    playbackMode: 'full',
    sourceLabel: 'JioSaavn • Full Song',
    releaseDate: song.release_date || (song.year ? String(song.year) : undefined),
    genre: song.language ? song.language.toUpperCase() : undefined,
  };
}

export const SaavnApi = {
  /**
   * Search JioSaavn catalog for full-length songs
   */
  async searchTracks(query: string, limit = 15): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cacheKey = `saavn:${trimmed.toLowerCase()}:${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      // First try via Vite proxy, fallback to direct port 5000 if needed
      const endpoints = [
        `/api/saavn/search?query=${encodeURIComponent(trimmed)}`,
        `http://127.0.0.1:5000/search?query=${encodeURIComponent(trimmed)}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
          });

          if (!res.ok) continue;

          const data: SaavnSearchResponse = await res.json();
          if (data && Array.isArray(data.result)) {
            const tracks = data.result
              .filter(song => isValidAudioUrl(song.media_url_default || song.media_url || song.vlink))
              .slice(0, limit)
              .map(mapSongToTrack);

            searchCache.set(cacheKey, { data: tracks, timestamp: Date.now() });
            return tracks;
          }
        } catch {
          // Try next endpoint fallback
          continue;
        }
      }

      return [];
    } catch (err) {
      console.warn('JioSaavn search error:', err);
      return [];
    }
  },

  /**
   * Get trending full-length songs
   */
  async getTrendingTracks(): Promise<Track[]> {
    const queries = ['Top Hindi Hits', 'Trending International Pop', 'Bollywood Romance'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    return this.searchTracks(randomQuery, 12);
  },

  /**
   * Automatically resolve any preview track to its genuine full-length studio track
   */
  async upgradePreviewToFullSong(track: Track): Promise<Track | null> {
    if (track.playbackMode === 'full') return track;

    try {
      // Clean title and get primary artist for highest matching accuracy
      const cleanTitle = track.title
        .replace(/\(feat\..*?\)/i, '')
        .replace(/\[feat\..*?\]/i, '')
        .replace(/- Single/i, '')
        .trim();
      const primaryArtist = track.artist.split(',')[0].split('&')[0].trim();

      const queries = [
        `${track.title} ${primaryArtist}`,
        `${cleanTitle} ${primaryArtist}`,
        cleanTitle,
      ];

      for (const q of queries) {
        const results = await this.searchTracks(q, 5);
        if (results.length > 0) {
          // Find closest matching title or take first result
          const match = results.find(r => 
            r.title.toLowerCase().includes(cleanTitle.toLowerCase()) || 
            cleanTitle.toLowerCase().includes(r.title.toLowerCase())
          ) || results[0];

          return {
            ...track,
            audioUrl: match.audioUrl,
            duration: match.duration || track.duration,
            playbackMode: 'full',
            sourceType: 'saavn',
            sourceLabel: 'JioSaavn • Full Song (Upgraded)',
            artwork: match.artwork || track.artwork,
          };
        }
      }
    } catch (e) {
      console.warn('Could not upgrade preview track to full song:', e);
    }
    return null;
  },

  clearCache(): void {
    searchCache.clear();
  },
};
