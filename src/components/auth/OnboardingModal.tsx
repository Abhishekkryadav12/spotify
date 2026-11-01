import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Music,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGE_OPTIONS, GENRE_OPTIONS, MOOD_OPTIONS } from '../../data/onboardingData';
import { POPULAR_ARTISTS, searchArtists, type ArtistItem } from '../../data/artistsData';

export const OnboardingModal: React.FC = () => {
  const { user, isOnboardingOpen, completeOnboarding } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selections
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSingers, setSelectedSingers] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  // Artist search state
  const [artistQuery, setArtistQuery] = useState('');
  const [displayedArtists, setDisplayedArtists] = useState<ArtistItem[]>(POPULAR_ARTISTS);
  const [searchingArtists, setSearchingArtists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with any existing user preferences
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.preferredLanguages?.length > 0) {
        setSelectedLanguages(user.preferences.preferredLanguages);
      } else {
        // Default highlight popular languages
        setSelectedLanguages(['Punjabi', 'Hindi']);
      }
      if (user.preferences.favouriteSingers?.length > 0) {
        setSelectedSingers(user.preferences.favouriteSingers);
      }
      if (user.preferences.preferredGenres?.length > 0) {
        setSelectedGenres(user.preferences.preferredGenres);
      }
      if (user.preferences.preferredMoods?.length > 0) {
        setSelectedMoods(user.preferences.preferredMoods);
      }
    } else {
      setSelectedLanguages(['Punjabi', 'Hindi']);
    }
  }, [user, isOnboardingOpen]);

  // Debounced search for artists
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(async () => {
      if (!artistQuery.trim()) {
        setDisplayedArtists(POPULAR_ARTISTS);
        return;
      }
      setSearchingArtists(true);
      try {
        const results = await searchArtists(artistQuery);
        if (isCurrent) setDisplayedArtists(results);
      } finally {
        if (isCurrent) setSearchingArtists(false);
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [artistQuery]);

  if (!isOnboardingOpen) return null;

  const toggleLanguage = (langName: string) => {
    setSelectedLanguages(prev =>
      prev.includes(langName) ? prev.filter(l => l !== langName) : [...prev, langName]
    );
  };

  const toggleSinger = (singerName: string) => {
    setSelectedSingers(prev =>
      prev.includes(singerName) ? prev.filter(s => s !== singerName) : [...prev, singerName]
    );
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  const toggleMood = (moodId: string) => {
    setSelectedMoods(prev =>
      prev.includes(moodId) ? prev.filter(m => m !== moodId) : [...prev, moodId]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        preferredLanguages: selectedLanguages.length > 0 ? selectedLanguages : ['Hindi', 'Punjabi'],
        favouriteSingers: selectedSingers,
        preferredGenres: selectedGenres,
        preferredMoods: selectedMoods,
        onboardingCompleted: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden select-none"
      >
        {/* Top Progress Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1db954]/20 text-[#1db954] flex items-center justify-center font-bold text-sm">
              {step}/3
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-extrabold text-[#1db954]">
                Personalize SoundWave
              </p>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {step === 1 && 'What music languages do you listen to?'}
                {step === 2 && 'Who are your favourite singers?'}
                {step === 3 && 'Pick your favourite genres and moods'}
              </h2>
            </div>
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span
              className={`h-2 rounded-full transition-all ${
                step === 1 ? 'w-8 bg-[#1db954]' : 'w-2 bg-neutral-700'
              }`}
            />
            <span
              className={`h-2 rounded-full transition-all ${
                step === 2 ? 'w-8 bg-[#1db954]' : 'w-2 bg-neutral-700'
              }`}
            />
            <span
              className={`h-2 rounded-full transition-all ${
                step === 3 ? 'w-8 bg-[#1db954]' : 'w-2 bg-neutral-700'
              }`}
            />
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
          {/* STEP 1: LANGUAGES */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Select one or more languages. We'll tune your home feed and daily mixes to these languages.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.name);
                  return (
                    <button
                      key={lang.id}
                      onClick={() => toggleLanguage(lang.name)}
                      className={`group relative flex flex-col p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1db954]/15 border-[#1db954] shadow-lg shadow-[#1db954]/10'
                          : 'bg-[#1e1e1e] hover:bg-[#252525] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{lang.flag}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#1db954] text-black'
                              : 'bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      <span className="font-extrabold text-sm text-white">{lang.name}</span>
                      <span className="text-[11px] text-neutral-400 font-medium">{lang.native}</span>
                      <span className="text-[10px] text-neutral-500 mt-1 truncate">{lang.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: FAVOURITE SINGERS */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-neutral-400">
                Select your favourite artists to get dedicated shelves, daily artist mixes, and studio master tracks.
              </p>

              {/* Selected Artists Bar */}
              {selectedSingers.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {selectedSingers.map((singer) => (
                    <span
                      key={singer}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1db954] text-black font-extrabold text-xs shadow-md shrink-0"
                    >
                      <span>{singer}</span>
                      <button
                        onClick={() => toggleSinger(singer)}
                        className="hover:scale-125 transition-transform cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setSelectedSingers([])}
                    className="text-[11px] text-neutral-400 hover:text-red-400 font-medium px-2 shrink-0 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Artist Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search for any singer (e.g. Diljit, AP Dhillon, Taylor Swift, Arijit)..."
                  value={artistQuery}
                  onChange={(e) => setArtistQuery(e.target.value)}
                  className="w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white text-sm rounded-xl pl-11 pr-10 py-3 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all placeholder:text-neutral-500"
                />
                {searchingArtists && (
                  <Loader2 className="w-4 h-4 text-[#1db954] animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                )}
                {artistQuery && !searchingArtists && (
                  <button
                    onClick={() => setArtistQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Artists Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                {displayedArtists.map((artist) => {
                  const isSelected = selectedSingers.includes(artist.name);
                  return (
                    <button
                      key={artist.id}
                      onClick={() => toggleSinger(artist.name)}
                      className={`group relative flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1db954]/15 border-[#1db954] shadow-lg shadow-[#1db954]/10'
                          : 'bg-[#1e1e1e] hover:bg-[#252525] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Avatar with Selection Indicator */}
                      <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2.5 shadow-md bg-neutral-900 ring-2 ring-transparent group-hover:ring-white/20">
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#1db954]/40 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="font-bold text-xs text-white truncate max-w-full">
                        {artist.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate max-w-full mt-0.5">
                        {artist.genre}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: GENRES & MOODS */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Genres Section */}
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#1db954]" />
                  <span>Favourite Genres</span>
                </h3>
                <p className="text-xs text-neutral-400 mb-3">Choose genres you love exploring</p>

                <div className="flex flex-wrap gap-2.5">
                  {GENRE_OPTIONS.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.name);
                    return (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#1db954] to-emerald-500 text-black shadow-lg shadow-[#1db954]/20 scale-105 ring-2 ring-white/30'
                            : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 hover:text-white border border-white/5'
                        }`}
                      >
                        <span>{genre.emoji}</span>
                        <span>{genre.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Moods Section */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Everyday Moods & Vibes</span>
                </h3>
                <p className="text-xs text-neutral-400 mb-3">
                  We'll surface music tailored to how you feel throughout the day
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMoods.includes(mood.name);
                    return (
                      <button
                        key={mood.id}
                        onClick={() => toggleMood(mood.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? `bg-gradient-to-r ${mood.gradient} text-white shadow-lg ring-2 ring-white/40 scale-105`
                            : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 hover:text-white border border-white/5'
                        }`}
                      >
                        <span>{mood.emoji}</span>
                        <span>{mood.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="text-xs text-neutral-400 hover:text-white font-medium px-3 py-2 cursor-pointer"
              >
                Skip for now
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="text-xs text-neutral-400 hover:text-white font-medium px-3 py-2 cursor-pointer"
              >
                Skip preferences
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={step === 1 && selectedLanguages.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-40 text-black font-extrabold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-40 text-black font-extrabold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Personalizing...</span>
                  </>
                ) : (
                  <>
                    <span>Finish & Launch SoundWave</span>
                    <Sparkles className="w-4 h-4 fill-black ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
