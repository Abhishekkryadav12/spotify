import type { Track } from '../types/music';
import type { UserProfile } from '../types/auth';
import { SaavnApi } from './saavnApi';

export interface ArtistShelf {
  artist: string;
  tracks: Track[];
}

export interface LanguageShelf {
  language: string;
  tracks: Track[];
}

export interface PersonalizedRecommendations {
  dailyMix: Track[];
  artistShelves: ArtistShelf[];
  languageShelves: LanguageShelf[];
  vibeMix: Track[];
  isLoading: boolean;
}

const recCache = new Map<string, { data: PersonalizedRecommendations; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

export const RecommendationService = {
  /**
   * Generate personalized recommendations based on the user's profile and preferences
   */
  async getRecommendations(user: UserProfile | null): Promise<PersonalizedRecommendations> {
    if (!user || !user.preferences) {
      return {
        dailyMix: [],
        artistShelves: [],
        languageShelves: [],
        vibeMix: [],
        isLoading: false,
      };
    }

    const cacheKey = `user_rec_${user.id}_${user.updatedAt}`;
    const cached = recCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const { preferredLanguages = [], favouriteSingers = [], preferredGenres = [], preferredMoods = [] } = user.preferences;

    // 1. Fetch Daily Mix (Blend of top favourite singers and primary languages)
    const dailyMixQueries: string[] = [];
    if (favouriteSingers.length > 0) {
      const primarySinger = favouriteSingers[0];
      const secondSinger = favouriteSingers[1] || '';
      dailyMixQueries.push(`${primarySinger} top hits`);
      if (secondSinger) dailyMixQueries.push(`${secondSinger} top hits`);
    } else if (preferredLanguages.length > 0) {
      dailyMixQueries.push(`Top ${preferredLanguages[0]} Hits`);
    } else {
      dailyMixQueries.push('Top Trending Hits');
    }

    // 2. Artist Shelves: For each top favourite singer (up to 3)
    const topSingers = favouriteSingers.slice(0, 3);

    // 3. Language Shelves: For each selected language (up to 2)
    const topLanguages = preferredLanguages.slice(0, 3);

    // 4. Vibe Mix: Preferred genre + mood combination
    const primaryGenre = preferredGenres[0] || '';
    const primaryMood = preferredMoods[0] || '';
    let vibeQuery = 'Top Trending Hits';
    if (primaryMood && primaryGenre) {
      vibeQuery = `${primaryGenre} ${primaryMood} Songs`;
    } else if (primaryMood) {
      vibeQuery = `${primaryMood} Vibe Hits`;
    } else if (primaryGenre) {
      vibeQuery = `Top ${primaryGenre} Hits`;
    }

    // Execute queries in parallel with Promise.allSettled
    const [dailyMixResults, artistResults, languageResults, vibeResults] = await Promise.allSettled([
      // Daily Mix
      Promise.all(dailyMixQueries.map(q => SaavnApi.searchTracks(q, 6))).then(res => {
        const flattened = res.flat();
        // Deduplicate tracks by id
        const unique = Array.from(new Map(flattened.map(t => [t.id, t])).values());
        return unique.slice(0, 8);
      }),

      // Artist shelves
      Promise.all(
        topSingers.map(async singer => {
          const tracks = await SaavnApi.searchTracks(`${singer} best songs`, 6);
          return { artist: singer, tracks };
        })
      ),

      // Language shelves
      Promise.all(
        topLanguages.map(async lang => {
          const tracks = await SaavnApi.searchTracks(`Top ${lang} Hits 2026`, 6);
          return { language: lang, tracks };
        })
      ),

      // Vibe mix
      SaavnApi.searchTracks(vibeQuery, 6),
    ]);

    const dailyMix = dailyMixResults.status === 'fulfilled' ? dailyMixResults.value : [];
    const artistShelves = artistResults.status === 'fulfilled' ? artistResults.value.filter(s => s.tracks.length > 0) : [];
    const languageShelves = languageResults.status === 'fulfilled' ? languageResults.value.filter(s => s.tracks.length > 0) : [];
    const vibeMix = vibeResults.status === 'fulfilled' ? vibeResults.value : [];

    const result: PersonalizedRecommendations = {
      dailyMix,
      artistShelves,
      languageShelves,
      vibeMix,
      isLoading: false,
    };

    recCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  },

  /**
   * Clear cached recommendations when user updates preferences
   */
  clearCache(userId: string): void {
    for (const key of recCache.keys()) {
      if (key.includes(userId)) {
        recCache.delete(key);
      }
    }
  },
};
