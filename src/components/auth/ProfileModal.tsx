import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  LogOut,
  Save,
  Globe,
  Music,
  Sparkles,
  Search,
  Check,
  Plus,
  Loader2,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGE_OPTIONS, GENRE_OPTIONS, MOOD_OPTIONS } from '../../data/onboardingData';
import { POPULAR_ARTISTS, searchArtists, type ArtistItem } from '../../data/artistsData';

export const ProfileModal: React.FC = () => {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    signOut,
    updateProfile,
    updatePreferences,
    isSupabase,
  } = useAuth();

  const [name, setName] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSingers, setSelectedSingers] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  // Singer search
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<ArtistItem[]>(POPULAR_ARTISTS.slice(0, 8));
  const [searching, setSearching] = useState(false);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSelectedLanguages(user.preferences?.preferredLanguages || []);
      setSelectedSingers(user.preferences?.favouriteSingers || []);
      setSelectedGenres(user.preferences?.preferredGenres || []);
      setSelectedMoods(user.preferences?.preferredMoods || []);
      setSaveSuccess(false);
      setError(null);
    }
  }, [user, isProfileModalOpen]);

  // Search artists
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!artistQuery.trim()) {
        setArtistResults(POPULAR_ARTISTS.slice(0, 8));
        return;
      }
      setSearching(true);
      try {
        const res = await searchArtists(artistQuery);
        if (active) setArtistResults(res);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [artistQuery]);

  if (!isProfileModalOpen || !user) return null;

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const removeSinger = (singer: string) => {
    setSelectedSingers(prev => prev.filter(s => s !== singer));
  };

  const addSinger = (singer: string) => {
    if (!selectedSingers.includes(singer)) {
      setSelectedSingers(prev => [...prev, singer]);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // 1. Update display name if changed
      if (name.trim() && name.trim() !== user.name) {
        await updateProfile({ name: name.trim() });
      }

      // 2. Update preferences
      await updatePreferences({
        preferredLanguages: selectedLanguages,
        favouriteSingers: selectedSingers,
        preferredGenres: selectedGenres,
        preferredMoods: selectedMoods,
        onboardingCompleted: true,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        closeProfileModal();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update preferences.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    closeProfileModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-400 text-black flex items-center justify-center font-extrabold text-base shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>{user.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px] text-[#1db954]">
                  <Database className="w-3 h-3" />
                  <span>{isSupabase ? 'Supabase Cloud' : 'Secure Local Profile'}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Preferences saved! Recommendations are updating...</span>
            </div>
          )}

          {/* 1. Account Info */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <div className="relative max-w-md">
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* 2. Preferred Languages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#1db954]" />
                <span>Preferred Languages ({selectedLanguages.length})</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = selectedLanguages.includes(lang.name);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => toggleLanguage(lang.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1db954] text-black shadow-md'
                        : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Favourite Singers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#1db954]" />
                <span>Favourite Singers ({selectedSingers.length})</span>
              </label>
            </div>

            {/* Selected Chips */}
            {selectedSingers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSingers.map((singer) => (
                  <span
                    key={singer}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1db954]/20 border border-[#1db954]/40 text-[#1db954] font-bold text-xs"
                  >
                    <span>{singer}</span>
                    <button
                      type="button"
                      onClick={() => removeSinger(singer)}
                      className="hover:text-red-400 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search and Add Singer */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search and add more singers..."
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                className="w-full bg-[#1e1e1e] text-white text-xs rounded-xl pl-10 pr-4 py-2 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden"
              />
              {searching && (
                <Loader2 className="w-3.5 h-3.5 text-[#1db954] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Quick add singer suggestions */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {artistResults.map((artist) => {
                const alreadySelected = selectedSingers.includes(artist.name);
                return (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => (alreadySelected ? removeSinger(artist.name) : addSinger(artist.name))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      alreadySelected
                        ? 'bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40 font-bold'
                        : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 border border-white/5'
                    }`}
                  >
                    <span>{artist.name}</span>
                    {alreadySelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Genres & Moods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Music className="w-3.5 h-3.5 text-[#1db954]" />
                <span>Genres</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GENRE_OPTIONS.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.name);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1db954] text-black font-bold'
                          : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 border border-white/5'
                      }`}
                    >
                      {genre.emoji} {genre.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Moods</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMoods.includes(mood.name);
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => toggleMood(mood.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-[#1e1e1e] hover:bg-[#282828] text-neutral-300 border border-white/5'
                      }`}
                    >
                      {mood.emoji} {mood.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-5 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-extrabold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Update Recommendations</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
