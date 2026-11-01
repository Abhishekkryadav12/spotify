import type { Track } from '../types/music';

// Jamendo Client ID can be supplied in .env as VITE_JAMENDO_CLIENT_ID
const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || '';

interface JamendoTrackResult {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  album_image: string;
  audio: string;
  audiodl: string;
  shareurl: string;
  image: string;
  releasedate: string;
}

interface JamendoApiResponse {
  headers: {
    status: string;
    code: number;
    error_message?: string;
  };
  results: JamendoTrackResult[];
}

export const JamendoApi = {
  isConfigured(): boolean {
    return Boolean(JAMENDO_CLIENT_ID && JAMENDO_CLIENT_ID.trim().length > 0);
  },

  async searchTracks(query: string, limit = 15): Promise<Track[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=${limit}&audioformat=mp32&search=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Jamendo API HTTP ${res.status}`);
      }

      const data: JamendoApiResponse = await res.json();
      if (data.headers.status !== 'success') {
        console.warn('Jamendo API warning:', data.headers.error_message);
        return [];
      }

      return data.results.map((item) => ({
        id: `jamendo-${item.id}`,
        title: item.name,
        artist: item.artist_name,
        album: item.album_name || 'Single',
        artwork: item.image || item.album_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        audioUrl: item.audio,
        duration: item.duration,
        sourceType: 'jamendo',
        playbackMode: 'full',
        externalUrl: item.shareurl,
        releaseDate: item.releasedate,
        sourceLabel: 'Jamendo Music (Full Song)',
      }));
    } catch (err) {
      console.warn('Jamendo search failed:', err);
      return [];
    }
  }
};
