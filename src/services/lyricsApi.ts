import type { Track } from '../types/music';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  trackId: string;
  isSynced: boolean;
  lines: LyricLine[];
  plainLyrics?: string;
  source: 'lrclib' | 'jiosaavn' | 'none';
  copyright?: string;
}

const lyricsCache = new Map<string, LyricsData>();

function cleanSearchTerm(text: string): string {
  if (!text) return '';
  return text
    .replace(/\(.*?\)/g, '') // remove (feat. ...), (From "...")
    .replace(/\[.*?\]/g, '')
    .replace(/- Single/i, '')
    .replace(/- Radio Edit/i, '')
    .replace(/- Remastered/i, '')
    .replace(/ft\..*/i, '')
    .replace(/feat\..*/i, '')
    .trim();
}

/**
 * Parse standard LRC format string into timestamped lyric lines
 * e.g. [00:12.34] Hello darkness my old friend
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/;

  for (const line of lines) {
    const match = line.trim().match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      const time = minutes * 60 + seconds;

      // Filter out meta tags like [by:...] or empty lines with music notes
      if (!line.startsWith('[ar:') && !line.startsWith('[ti:') && !line.startsWith('[al:')) {
        result.push({ time, text: text || '♪' });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export const LyricsApi = {
  /**
   * Fetch synced or plain lyrics for a track from LRCLIB or JioSaavn
   */
  async getLyrics(track: Track): Promise<LyricsData | null> {
    if (!track) return null;

    const cacheKey = `lyrics:${track.id}`;
    if (lyricsCache.has(cacheKey)) {
      return lyricsCache.get(cacheKey)!;
    }

    const cleanTitle = cleanSearchTerm(track.title);
    const cleanArtist = cleanSearchTerm(track.artist.split(',')[0].split('&')[0]);

    // 1. Try LRCLIB first (primary for synced lyrics worldwide)
    try {
      const lrclibParams = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: cleanArtist,
      });

      if (track.duration && track.duration > 0) {
        lrclibParams.append('duration', Math.round(track.duration).toString());
      }

      const lrcRes = await fetch(`https://lrclib.net/api/get?${lrclibParams.toString()}`, {
        headers: {
          'User-Agent': 'SoundWaveMusic/1.0',
        },
      });

      if (lrcRes.ok) {
        const data = await lrcRes.json();
        if (data.syncedLyrics) {
          const parsedLines = parseLrc(data.syncedLyrics);
          if (parsedLines.length > 0) {
            const result: LyricsData = {
              trackId: track.id,
              isSynced: true,
              lines: parsedLines,
              plainLyrics: data.plainLyrics || undefined,
              source: 'lrclib',
            };
            lyricsCache.set(cacheKey, result);
            return result;
          }
        } else if (data.plainLyrics) {
          const plainLines = data.plainLyrics
            .split('\n')
            .map((text: string) => ({ time: -1, text: text.trim() }))
            .filter((l: LyricLine) => l.text.length > 0);

          const result: LyricsData = {
            trackId: track.id,
            isSynced: false,
            lines: plainLines,
            plainLyrics: data.plainLyrics,
            source: 'lrclib',
          };
          lyricsCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('LRCLIB exact fetch failed, trying search fallback...', e);
    }

    // 2. Try LRCLIB search fallback if exact match failed
    try {
      const searchRes = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`,
        { headers: { 'User-Agent': 'SoundWaveMusic/1.0' } }
      );

      if (searchRes.ok) {
        const searchResults = await searchRes.json();
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          const best = searchResults.find(r => r.syncedLyrics) || searchResults[0];
          if (best.syncedLyrics) {
            const parsedLines = parseLrc(best.syncedLyrics);
            if (parsedLines.length > 0) {
              const result: LyricsData = {
                trackId: track.id,
                isSynced: true,
                lines: parsedLines,
                plainLyrics: best.plainLyrics || undefined,
                source: 'lrclib',
              };
              lyricsCache.set(cacheKey, result);
              return result;
            }
          } else if (best.plainLyrics) {
            const plainLines = best.plainLyrics
              .split('\n')
              .map((text: string) => ({ time: -1, text: text.trim() }))
              .filter((l: LyricLine) => l.text.length > 0);

            const result: LyricsData = {
              trackId: track.id,
              isSynced: false,
              lines: plainLines,
              plainLyrics: best.plainLyrics,
              source: 'lrclib',
            };
            lyricsCache.set(cacheKey, result);
            return result;
          }
        }
      }
    } catch (e) {
      console.warn('LRCLIB search fallback failed:', e);
    }

    // 3. Try JioSaavn backend lyrics if track is from JioSaavn or has song ID
    const saavnSongId = track.id.startsWith('saavn_') ? track.id.replace('saavn_', '') : null;
    if (saavnSongId) {
      try {
        const endpoints = [
          `/api/saavn/lyrics/${saavnSongId}`,
          `http://127.0.0.1:5000/lyrics/${saavnSongId}`,
        ];

        for (const ep of endpoints) {
          try {
            const saavnRes = await fetch(ep);
            if (saavnRes.ok) {
              const saavnData = await saavnRes.json();
              if (saavnData && saavnData.lyrics) {
                // Decode HTML & clean <br> tags
                const formattedLyrics = saavnData.lyrics
                  .replace(/<br\s*[\/]?>/gi, '\n')
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, '&')
                  .replace(/&#039;/g, "'")
                  .trim();

                const lines = formattedLyrics
                  .split('\n')
                  .map((t: string) => ({ time: -1, text: t.trim() }))
                  .filter((l: LyricLine) => l.text.length > 0);

                const result: LyricsData = {
                  trackId: track.id,
                  isSynced: false,
                  lines,
                  plainLyrics: formattedLyrics,
                  source: 'jiosaavn',
                  copyright: saavnData.lyrics_copyright,
                };
                lyricsCache.set(cacheKey, result);
                return result;
              }
            }
          } catch {
            continue;
          }
        }
      } catch (err) {
        console.warn('JioSaavn lyrics fetch error:', err);
      }
    }

    return null;
  },
};
