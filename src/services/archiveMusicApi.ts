import type { Track } from '../types/music';
import { FULL_LENGTH_TRACKS } from './fullLengthTracks';

const searchCache = new Map<string, { data: Track[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string;
  description?: string;
  downloads?: number;
  year?: number;
}

interface ArchiveSearchResponse {
  response: {
    numFound: number;
    docs: ArchiveDoc[];
  };
}

interface ArchiveFileInfo {
  name: string;
  title?: string;
  creator?: string;
  artist?: string;
  album?: string;
  length?: string;
  format?: string;
}

interface ArchiveMetadataResponse {
  result: ArchiveFileInfo[];
}

function parseDuration(lengthStr?: string): number {
  if (!lengthStr) return 180; // default 3 minutes if not listed
  if (lengthStr.includes(':')) {
    const parts = lengthStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const parsed = parseFloat(lengthStr);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 180;
}

export const ArchiveMusicApi = {
  /**
   * Search Internet Archive for full-length free music tracks
   */
  async searchFullTracks(query: string, limit = 10): Promise<Track[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // Check in-memory cache
    const cacheKey = `archive:${trimmed}:${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Check curated full-length tracks for instant exact/fuzzy matches
    const curatedMatches = FULL_LENGTH_TRACKS.filter(t =>
      t.title.toLowerCase().includes(trimmed) ||
      t.artist.toLowerCase().includes(trimmed) ||
      t.album.toLowerCase().includes(trimmed) ||
      (t.genre && t.genre.toLowerCase().includes(trimmed))
    );

    try {
      const searchUrl = `https://archive.org/advancedsearch.php?q=mediatype:(audio)+AND+format:(VBR+MP3)+AND+(${encodeURIComponent(trimmed)})&fl[]=identifier,title,creator,description,downloads,year&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;
      const res = await fetch(searchUrl);
      if (!res.ok) {
        return curatedMatches;
      }

      const data: ArchiveSearchResponse = await res.json();
      const docs = data.response?.docs || [];

      const fetchedTracks: Track[] = [];

      // Query top items for their direct MP3 files
      for (const doc of docs.slice(0, 5)) {
        try {
          const metaUrl = `https://archive.org/metadata/${doc.identifier}/files`;
          const metaRes = await fetch(metaUrl);
          if (!metaRes.ok) continue;

          const metaData: ArchiveMetadataResponse = await metaRes.json();
          const mp3Files = (metaData.result || []).filter(
            f => f.name && (f.format?.includes('MP3') || f.name.endsWith('.mp3'))
          );

          if (mp3Files.length > 0) {
            const file = mp3Files[0];
            const durationSec = parseDuration(file.length);
            const audioUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(file.name)}`;
            const artworkUrl = `https://archive.org/services/img/${doc.identifier}`;

            fetchedTracks.push({
              id: `archive-${doc.identifier}-${encodeURIComponent(file.name)}`,
              title: file.title || doc.title || 'Untitled Track',
              artist: file.artist || file.creator || doc.creator || 'Independent Artist',
              album: file.album || doc.title || 'Internet Archive Netlabels',
              artwork: artworkUrl,
              audioUrl,
              duration: durationSec,
              sourceType: 'archive',
              playbackMode: 'full',
              genre: 'Creative Commons / Netlabel',
              sourceLabel: 'Internet Archive (Full Song)',
            });
          }
        } catch (e) {
          console.warn(`Error resolving files for ${doc.identifier}:`, e);
        }
      }

      // Combine curated matches and dynamic archive tracks without duplicate IDs
      const combined = [...curatedMatches];
      for (const t of fetchedTracks) {
        if (!combined.some(existing => existing.id === t.id || existing.audioUrl === t.audioUrl)) {
          combined.push(t);
        }
      }

      searchCache.set(cacheKey, { data: combined, timestamp: Date.now() });
      return combined;
    } catch (err) {
      console.warn('Archive search failed, using curated fallback:', err);
      return curatedMatches;
    }
  },

  /**
   * Get featured full-length showcase tracks
   */
  getFeaturedFullTracks(): Track[] {
    return FULL_LENGTH_TRACKS;
  }
};
