import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Radio,
  Sparkles,
  CheckCircle,
  Flame,
  History,
  Compass,
  Shuffle,
  Dices,
  Globe,
  Heart,
  MoreHorizontal,
  ListPlus,
  ListMusic,
  Plus,
  Sliders,
  Star,
} from 'lucide-react';
import type { Track, RadioStation, ActiveView } from '../types/music';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { DEMO_TRACKS } from '../services/demoTracks';
import { FULL_LENGTH_TRACKS } from '../services/fullLengthTracks';
import { SaavnApi } from '../services/saavnApi';
import { RadioApi, convertStationToTrack } from '../services/radioApi';
import { MOOD_CONFIGS, type MoodLanguage } from '../services/moods';
import { RecommendationService, type PersonalizedRecommendations } from '../services/recommendationService';

interface HomeViewProps {
  setActiveView: (view: ActiveView) => void;
  onAddToPlaylist: (track: Track) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveView, onAddToPlaylist }) => {
  const { user, isAuthenticated, openAuthModal, openOnboarding } = useAuth();
  const { currentTrack, isPlaying, playTrack, togglePlay, playAll, playShuffled, playNext, addToQueue, showToast } = usePlayer();
  const { playlists, recentlyPlayed, isLiked, toggleLike } = useLibrary();

  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [chillTracks, setChillTracks] = useState<Track[]>([]);
  const [saavnTracks, setSaavnTracks] = useState<Track[]>([]);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Personalized recommendations state
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations>({
    dailyMix: [],
    artistShelves: [],
    languageShelves: [],
    vibeMix: [],
    isLoading: false,
  });

  // Mood state
  const [selectedMoodId, setSelectedMoodId] = useState<string>('happy');
  const [selectedLanguage, setSelectedLanguage] = useState<MoodLanguage>('all');
  const [moodTracks, setMoodTracks] = useState<Record<string, Track[]>>({});
  const [moodLoading, setMoodLoading] = useState<boolean>(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    let isMounted = true;

    async function loadHomeContent() {
      try {
        setLoading(true);
        const [saavnHits, popular, chill, stations] = await Promise.allSettled([
          SaavnApi.searchTracks('Top Bollywood Hits', 6),
          SaavnApi.searchTracks('Top Global Pop Hits', 6).then(res => res.length > 0 ? res : FULL_LENGTH_TRACKS.slice(0, 6)),
          SaavnApi.searchTracks('Lo-Fi Acoustic Chill', 6).then(res => res.length > 0 ? res : FULL_LENGTH_TRACKS.slice(3, 9)),
          RadioApi.getTopStations(6)
        ]);

        if (isMounted) {
          if (saavnHits.status === 'fulfilled') setSaavnTracks(saavnHits.value.filter(t => t.playbackMode === 'full'));
          if (popular.status === 'fulfilled') setPopularTracks(popular.value.filter(t => t.playbackMode === 'full'));
          if (chill.status === 'fulfilled') setChillTracks(chill.value.filter(t => t.playbackMode === 'full'));
          if (stations.status === 'fulfilled') setRadioStations(stations.value);
        }
      } catch (err) {
        console.warn('Error loading home view items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load personalized recommendations based on active user profile & preferences
  useEffect(() => {
    let isMounted = true;

    async function loadPersonalized() {
      if (!user || !user.preferences?.onboardingCompleted) {
        setRecommendations({
          dailyMix: [],
          artistShelves: [],
          languageShelves: [],
          vibeMix: [],
          isLoading: false,
        });
        return;
      }

      try {
        setRecommendations(prev => ({ ...prev, isLoading: true }));
        const recs = await RecommendationService.getRecommendations(user);
        if (isMounted) {
          setRecommendations(recs);
        }
      } catch (e) {
        console.warn('Failed to load personalized recommendations:', e);
      } finally {
        if (isMounted) setRecommendations(prev => ({ ...prev, isLoading: false }));
      }
    }

    loadPersonalized();

    const handlePrefUpdate = () => {
      if (user?.id) RecommendationService.clearCache(user.id);
      loadPersonalized();
    };

    window.addEventListener('soundwave_preferences_updated', handlePrefUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('soundwave_preferences_updated', handlePrefUpdate);
    };
  }, [user]);

  // Load songs according to selected mood and language
  useEffect(() => {
    let isMounted = true;
    const currentCategory = MOOD_CONFIGS.find(m => m.id === selectedMoodId);
    if (!currentCategory) return;

    const cacheKey = `${selectedMoodId}_${selectedLanguage}`;
    if (moodTracks[cacheKey] && moodTracks[cacheKey].length > 0) {
      return;
    }

    setMoodLoading(true);
    const query = currentCategory.queries[selectedLanguage];
    SaavnApi.searchTracks(query, 12)
      .then((tracks) => {
        if (isMounted) {
          setMoodTracks((prev) => ({
            ...prev,
            [cacheKey]: tracks,
          }));
          setMoodLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load mood tracks:', err);
        if (isMounted) setMoodLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMoodId, selectedLanguage, moodTracks]);

  const activeMood = MOOD_CONFIGS.find(m => m.id === selectedMoodId) || MOOD_CONFIGS[0];
  const currentMoodSongs = moodTracks[`${selectedMoodId}_${selectedLanguage}`] || [];

  const handleSurpriseMe = () => {
    const otherMoods = MOOD_CONFIGS.filter(m => m.id !== selectedMoodId);
    const randomMood = otherMoods[Math.floor(Math.random() * otherMoods.length)];
    setSelectedMoodId(randomMood.id);
    showToast(`🎲 Surprise! Tuned to ${randomMood.emoji} ${randomMood.name}`);
  };

  const handlePlayAllMood = () => {
    if (currentMoodSongs.length > 0) {
      playAll(currentMoodSongs, 0);
    }
  };

  const handleShuffleMood = () => {
    if (currentMoodSongs.length > 0) {
      playShuffled(currentMoodSongs);
    }
  };

  // Quick play tracks (prioritize recently played if available, fallback to full length demo tracks)
  const quickPlayItems = recentlyPlayed.length > 0
    ? [...recentlyPlayed, ...FULL_LENGTH_TRACKS].slice(0, 6)
    : [...FULL_LENGTH_TRACKS, ...DEMO_TRACKS].slice(0, 6);

  const handleTrackCardClick = (track: Track, contextList: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, contextList);
    }
  };

  const handleStationClick = (station: RadioStation) => {
    const track = convertStationToTrack(station);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, [track]);
    }
  };

  const renderTrackCard = (track: Track, contextList: Track[], badgeText?: string) => {
    const isCurrent = currentTrack?.id === track.id;
    const isCurrentPlaying = isCurrent && isPlaying;
    const liked = isLiked(track.id);
    const showMenu = activeMenuTrackId === track.id;

    return (
      <div
        key={track.id}
        onClick={() => handleTrackCardClick(track, contextList)}
        className={`group relative bg-[#181818] hover:bg-[#252525] p-3.5 rounded-xl transition-all duration-300 cursor-pointer flex flex-col border ${
          isCurrent ? 'border-[#1db954]/50 shadow-lg shadow-[#1db954]/10' : 'border-white/5'
        }`}
      >
        <div className="relative aspect-square w-full mb-3 rounded-lg overflow-hidden shadow-lg bg-neutral-900">
          <img
            src={track.artwork}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
            }}
          />

          <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-[#1db954] text-[9px] font-bold px-2 py-0.5 rounded shadow border border-[#1db954]/30 flex items-center gap-1">
            <span>{badgeText || 'Full Song'}</span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(track);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xs transition-opacity ${
              liked ? 'opacity-100 text-[#1db954]' : 'opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-white'
            }`}
            title={liked ? 'Liked' : 'Like'}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#1db954]' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTrackCardClick(track, contextList);
            }}
            className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
              isCurrentPlaying
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
            }`}
            aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-start justify-between gap-1">
          <h4 className={`font-bold text-sm truncate flex-1 ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
            {track.title}
          </h4>
          {isCurrentPlaying && (
            <div className="flex items-end gap-[2px] h-3 shrink-0 pt-1">
              <span className="w-1 bg-[#1db954] h-full animate-[bounce_1s_infinite_100ms] rounded-xs" />
              <span className="w-1 bg-[#1db954] h-2/3 animate-[bounce_1s_infinite_300ms] rounded-xs" />
              <span className="w-1 bg-[#1db954] h-4/5 animate-[bounce_1s_infinite_200ms] rounded-xs" />
            </div>
          )}
        </div>

        <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>

        <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-neutral-500 relative">
          <span className="truncate pr-1 text-neutral-400">{track.album || 'Single'}</span>
          <div className="flex items-center gap-1 shrink-0">
            <span>
              {Math.floor(track.duration / 60)}:
              {(track.duration % 60).toString().padStart(2, '0')}
            </span>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuTrackId(showMenu ? null : track.id);
                }}
                className="p-1 text-neutral-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuTrackId(null);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 bottom-full mb-1 w-44 bg-[#282828] border border-neutral-700 rounded-lg shadow-2xl z-50 py-1 text-xs text-neutral-200"
                  >
                    <button
                      onClick={() => {
                        setActiveMenuTrackId(null);
                        playNext(track);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5 text-[#1db954]" /> Play Next
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenuTrackId(null);
                        addToQueue(track);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <ListMusic className="w-3.5 h-3.5 text-neutral-300" /> Add to Queue
                    </button>
                    <div className="h-px bg-neutral-700/60 my-1" />
                    <button
                      onClick={() => {
                        setActiveMenuTrackId(null);
                        onAddToPlaylist(track);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Playlist
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 pb-32 space-y-8 select-none max-w-7xl mx-auto">
      {/* Top Greeting & Authentication / Preferences Prompt Banner */}
      <div>
        {isAuthenticated && user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                {getGreeting()}, {user.name.split(' ')[0]}
              </h1>
              {user.preferences?.onboardingCompleted ? (
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-[#1db954]" />
                  <span>
                    Personalized for you in {user.preferences.preferredLanguages.join(', ')} •{' '}
                    {user.preferences.favouriteSingers.slice(0, 3).join(', ')}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-amber-400 mt-1">
                  Complete your preferences below to get your personalized daily mix!
                </p>
              )}
            </div>

            <button
              onClick={openOnboarding}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 transition-colors self-start sm:self-auto cursor-pointer border border-white/5 shadow-md"
              title="Update your languages and favourite singers"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Music Preferences</span>
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-4">
              {getGreeting()}
            </h1>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-neutral-900 border border-[#1db954]/25 p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1db954]/20 text-[#1db954] flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Personalized Music Recommendations
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                    Sign up to choose your favourite music languages (Punjabi, Hindi, English, etc.) and singers (Diljit, AP Dhillon, Taylor Swift) for an exclusively personalized feed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-5 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
              >
                Create Free Account
              </button>
            </div>
          </>
        )}

        {/* Top 6 Quick-Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPlayItems.map((item) => {
            const isCurrent = currentTrack?.id === item.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={item.id}
                onClick={() => handleTrackCardClick(item, quickPlayItems)}
                className="group relative flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-all duration-200 cursor-pointer shadow-md"
              >
                <img
                  src={item.artwork}
                  alt={item.title}
                  className="w-20 h-20 object-cover shrink-0 shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="flex-1 px-4 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{item.artist}</p>
                </div>

                <div className="pr-4 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackCardClick(item, quickPlayItems);
                    }}
                    className={`w-11 h-11 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isCurrentPlaying ? 'opacity-100 scale-100' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-5 h-5 fill-black" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized Section 1: SoundWave Daily Mix */}
      {recommendations.dailyMix.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1db954]" />
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Made For {user?.name ? user.name.split(' ')[0] : 'You'} • Daily Mix
                </h2>
                <p className="text-xs text-neutral-400">
                  Personalized mix matching your favourite singers & languages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => playAll(recommendations.dailyMix, 0)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                <span>Play Mix</span>
              </button>
              <button
                onClick={() => playShuffled(recommendations.dailyMix)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5 text-neutral-300" />
                <span>Shuffle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.dailyMix.map((track) => renderTrackCard(track, recommendations.dailyMix, 'Daily Mix'))}
          </div>
        </section>
      )}

      {/* Personalized Section 2: Because You Love [Singer] */}
      {recommendations.artistShelves.map((shelf) => (
        <section key={shelf.artist} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Because You Love {shelf.artist}
                </h2>
                <p className="text-xs text-neutral-400">Top studio recordings from your selected singer</p>
              </div>
            </div>
            <button
              onClick={() => playAll(shelf.tracks, 0)}
              className="text-xs text-neutral-400 hover:text-white font-semibold uppercase tracking-wider cursor-pointer"
            >
              Play All ({shelf.tracks.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shelf.tracks.map((track) => renderTrackCard(track, shelf.tracks, shelf.artist))}
          </div>
        </section>
      ))}

      {/* Personalized Section 3: Trending in [Language] */}
      {recommendations.languageShelves.map((shelf) => (
        <section key={shelf.language} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1db954]" />
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Top Picks in {shelf.language}
                </h2>
                <p className="text-xs text-neutral-400">Trending tracks in your preferred language</p>
              </div>
            </div>
            <button
              onClick={() => playAll(shelf.tracks, 0)}
              className="text-xs text-neutral-400 hover:text-white font-semibold uppercase tracking-wider cursor-pointer"
            >
              Play All ({shelf.tracks.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shelf.tracks.map((track) => renderTrackCard(track, shelf.tracks, shelf.language))}
          </div>
        </section>
      ))}

      {/* Personalized Section 4: Tailored to Your Vibes */}
      {recommendations.vibeMix.length > 0 && user?.preferences?.preferredMoods?.length && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Your Vibe Mix • {user.preferences.preferredMoods.slice(0, 2).join(' & ')}
                </h2>
                <p className="text-xs text-neutral-400">Tailored to your saved mood preferences</p>
              </div>
            </div>
            <button
              onClick={() => playAll(recommendations.vibeMix, 0)}
              className="text-xs text-neutral-400 hover:text-white font-semibold uppercase tracking-wider cursor-pointer"
            >
              Play All ({recommendations.vibeMix.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.vibeMix.map((track) => renderTrackCard(track, recommendations.vibeMix, 'Your Vibe'))}
          </div>
        </section>
      )}

      {/* Section: Recently Played / Viewed Songs */}
      {recentlyPlayed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#1db954]" />
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Recently Played</h2>
                <p className="text-xs text-neutral-400">Pick up right where you left off</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView({ type: 'library', tab: 'recent' })}
              className="text-xs text-neutral-400 hover:text-white font-semibold uppercase tracking-wider cursor-pointer"
            >
              See All ({recentlyPlayed.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyPlayed.slice(0, 6).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackCardClick(track, recentlyPlayed)}
                  className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                      }}
                    />
                    {track.playbackMode === 'full' ? (
                      <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-[#1db954] text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-[#1db954]/30">
                        Full Song
                      </span>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackCardClick(track, recentlyPlayed);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-neutral-500">
                    <span className="truncate pr-1">{track.album || 'Single'}</span>
                    <span className="shrink-0">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 0: Full-Length Songs (Free & Legal) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#1db954]" />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Full-Length Songs (Free & Legal)</h2>
              <p className="text-xs text-neutral-400">Stream complete 3–6 minute master recordings via Internet Archive & Netlabels</p>
            </div>
          </div>
          <span className="text-xs bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold text-[10px]">
            No 30s Limit
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {FULL_LENGTH_TRACKS.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackCardClick(track, FULL_LENGTH_TRACKS)}
                className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-[#1db954] text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-[#1db954]/30">
                    Full Track
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackCardClick(track, FULL_LENGTH_TRACKS);
                    }}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                      isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4 fill-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
                <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                  {track.title}
                </h3>
                <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>
                <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-neutral-500">
                  <span>{track.genre?.split('/')[0]}</span>
                  <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Trending JioSaavn Studio Masters */}
      {saavnTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Trending Studio Masters (JioSaavn)</h2>
                <p className="text-xs text-neutral-400">Full-length high-fidelity studio streaming tracks with zero 30s limits</p>
              </div>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold text-[10px]">
              Full Length 320kbps / AAC
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {saavnTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackCardClick(track, saavnTracks)}
                  className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-amber-400/40">
                      Full Studio
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackCardClick(track, saavnTracks);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-neutral-500">
                    <span className="text-neutral-400">{track.album}</span>
                    <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section: Mood Selection & Personalized Music */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#1db954]" />
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Mood Selection</h2>
              <p className="text-xs text-neutral-400">
                Choose how you want to feel — your personalized soundscape adapts in real-time
              </p>
            </div>
          </div>

          <button
            onClick={handleSurpriseMe}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all self-start sm:self-auto cursor-pointer border border-white/10"
            title="Pick a random mood"
          >
            <Dices className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Surprise Me 🎲</span>
          </button>
        </div>

        {/* 12 Attractive Mood Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MOOD_CONFIGS.map((mood) => {
            const isSelected = mood.id === selectedMoodId;
            return (
              <button
                key={mood.id}
                onClick={() => setSelectedMoodId(mood.id)}
                className={`group relative flex flex-col items-center justify-center p-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center ${
                  isSelected
                    ? `bg-gradient-to-br ${mood.gradient} text-white shadow-xl ring-2 ring-white/60 scale-[1.03]`
                    : `bg-[#181818] hover:bg-[#222222] text-neutral-300 hover:text-white border border-white/5 ${mood.borderGlow}`
                }`}
              >
                <span className="text-3xl mb-1.5 transform group-hover:scale-110 transition-transform">
                  {mood.emoji}
                </span>
                <span className="font-bold text-xs truncate max-w-full">{mood.name}</span>
                {isSelected && (
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Personalized Music Hero Banner for Selected Mood */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-6 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none bg-gradient-to-br ${activeMood.gradient}`}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div className="flex items-start gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeMood.gradient} flex items-center justify-center text-3xl shadow-xl shrink-0 ring-2 ring-white/20`}
              >
                {activeMood.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[#1db954]">
                    Personalized Soundscape
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-xs text-neutral-400 font-medium">{activeMood.tagline}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  {activeMood.emoji} {activeMood.name} Vibes
                </h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                  {activeMood.description}
                </p>

                {/* Mood Tags */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {activeMood.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-neutral-300 border border-white/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Play All, Shuffle & Surprise Controls */}
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
              <button
                onClick={handlePlayAllMood}
                disabled={currentMoodSongs.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-extrabold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black ml-0.5" />
                <span>Play All ({currentMoodSongs.length})</span>
              </button>

              <button
                onClick={handleShuffleMood}
                disabled={currentMoodSongs.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-xs border border-white/10 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Shuffle all songs in this mood"
              >
                <Shuffle className="w-4 h-4 text-neutral-300" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={handleSurpriseMe}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Select a random mood"
              >
                <Dices className="w-4 h-4 text-amber-400" />
                <span>Surprise</span>
              </button>
            </div>
          </div>

          {/* Language Selector Filter Tabs */}
          <div className="relative z-10 flex items-center gap-2 pt-4 flex-wrap">
            <span className="text-xs text-neutral-400 font-semibold mr-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <span>Language:</span>
            </span>

            {(
              [
                { id: 'all', label: 'All Languages (Hindi, Punjabi, English)' },
                { id: 'hindi', label: 'Hindi 🇮🇳' },
                { id: 'punjabi', label: 'Punjabi 🎵' },
                { id: 'english', label: 'English 🌍' },
              ] as const
            ).map((lang) => {
              const isActive = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood Tracks Grid Display */}
        {moodLoading && currentMoodSongs.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#181818] p-3.5 rounded-xl animate-pulse border border-white/5">
                <div className="aspect-square bg-neutral-800 rounded-lg mb-3" />
                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentMoodSongs.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;
              const liked = isLiked(track.id);
              const showMenu = activeMenuTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackCardClick(track, currentMoodSongs)}
                  className={`group relative bg-[#181818] hover:bg-[#252525] p-3.5 rounded-xl transition-all duration-300 cursor-pointer flex flex-col border ${
                    isCurrent ? 'border-[#1db954]/50 shadow-lg shadow-[#1db954]/10' : 'border-white/5'
                  }`}
                >
                  {/* Artwork + Play Status Visualizer */}
                  <div className="relative aspect-square w-full mb-3 rounded-lg overflow-hidden shadow-lg bg-neutral-900">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Mood & Full Song Badge */}
                    <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-[#1db954] text-[9px] font-bold px-2 py-0.5 rounded shadow border border-[#1db954]/30 flex items-center gap-1">
                      <span>{activeMood.emoji}</span>
                      <span>Full Song</span>
                    </span>

                    {/* Like button in top right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xs transition-opacity ${
                        liked ? 'opacity-100 text-[#1db954]' : 'opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-white'
                      }`}
                      title={liked ? 'Liked' : 'Like'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#1db954]' : ''}`} />
                    </button>

                    {/* Playing animated equalizer or Play/Pause Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackCardClick(track, currentMoodSongs);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isCurrentPlaying
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                      aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Playing Status */}
                  <div className="flex items-start justify-between gap-1">
                    <h4
                      className={`font-bold text-sm truncate flex-1 ${
                        isCurrent ? 'text-[#1db954]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </h4>

                    {isCurrentPlaying && (
                      <div className="flex items-end gap-[2px] h-3 shrink-0 pt-1">
                        <span className="w-1 bg-[#1db954] h-full animate-[bounce_1s_infinite_100ms] rounded-xs" />
                        <span className="w-1 bg-[#1db954] h-2/3 animate-[bounce_1s_infinite_300ms] rounded-xs" />
                        <span className="w-1 bg-[#1db954] h-4/5 animate-[bounce_1s_infinite_200ms] rounded-xs" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>

                  {/* Album, Duration & 3-Dots Menu */}
                  <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-neutral-500 relative">
                    <span className="truncate pr-1 text-neutral-400">{track.album || 'Single'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span>
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, '0')}
                      </span>

                      {/* 3-dots popup trigger */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuTrackId(showMenu ? null : track.id);
                          }}
                          className="p-1 text-neutral-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="More options"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {showMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTrackId(null);
                              }}
                            />
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-full mb-1 w-44 bg-[#282828] border border-neutral-700 rounded-lg shadow-2xl z-50 py-1 text-xs text-neutral-200"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuTrackId(null);
                                  playNext(track);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                              >
                                <ListPlus className="w-3.5 h-3.5 text-[#1db954]" /> Play Next
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuTrackId(null);
                                  addToQueue(track);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                              >
                                <ListMusic className="w-3.5 h-3.5 text-neutral-300" /> Add to Queue
                              </button>
                              <div className="h-px bg-neutral-700/60 my-1" />
                              <button
                                onClick={() => {
                                  setActiveMenuTrackId(null);
                                  onAddToPlaylist(track);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add to Playlist
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 1: SoundWave Originals (Guaranteed Full Demo Playback) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1db954]" />
            <h2 className="text-xl font-bold text-white tracking-tight">SoundWave Originals</h2>
          </div>
          <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
            Royalty-Free & High-Fidelity
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {DEMO_TRACKS.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackCardClick(track, DEMO_TRACKS)}
                className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackCardClick(track, DEMO_TRACKS);
                    }}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                      isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4 fill-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
                <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                  {track.title}
                </h3>
                <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>
                <span className="text-[10px] text-neutral-500 mt-auto pt-2">{track.genre}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Popular Hits (Full Songs) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Today's Popular Hits</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Full-length global pop hits streaming in master quality (No 30s limit)</p>
          </div>
          <button
            onClick={() => setActiveView({ type: 'search', initialQuery: 'Top Hits' })}
            className="text-xs text-neutral-400 hover:text-white font-semibold uppercase tracking-wider"
          >
            Show All
          </button>
        </div>

        {loading && popularTracks.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#181818] p-3.5 rounded-lg animate-pulse">
                <div className="aspect-square bg-neutral-800 rounded-md mb-3" />
                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularTracks.slice(0, 6).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackCardClick(track, popularTracks)}
                  className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackCardClick(track, popularTracks);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Live Internet Radio Stations */}
      {radioStations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Live Global Radio</h2>
                <p className="text-xs text-neutral-400">Stream non-stop live audio broadcasts worldwide via Radio Browser</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView({ type: 'radio' })}
              className="text-xs text-neutral-400 hover:text-white font-semibold uppercase tracking-wider"
            >
              Browse All Stations
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {radioStations.map((station) => {
              const track = convertStationToTrack(station);
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={station.id}
                  onClick={() => handleStationClick(station)}
                  className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900 flex items-center justify-center p-2">
                    {station.favicon ? (
                      <img
                        src={station.favicon}
                        alt={station.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <Radio className="w-12 h-12 text-neutral-600" />
                    )}

                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow uppercase">
                      Live
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStationClick(station);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {station.name}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">
                    {station.country || 'Global Stream'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 4: Chill & Ambient */}
      {chillTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Focus & Chill</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Atmospheric, lo-fi and ambient selections</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {chillTracks.slice(0, 6).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackCardClick(track, chillTracks)}
                  className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackCardClick(track, chillTracks);
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isCurrentPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                  <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">{track.artist}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 5: Your Playlists Shortcut */}
      {playlists.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white tracking-tight mb-4">Your Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActiveView({ type: 'playlist', playlistId: pl.id })}
                className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900">
                  <img
                    src={pl.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-bold text-sm text-white truncate">{pl.name}</h3>
                <p className="text-xs text-neutral-400 truncate mt-1">{pl.tracks.length} songs</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
