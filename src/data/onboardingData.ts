export interface LanguageOption {
  id: string;
  name: string;
  native: string;
  flag: string;
  description: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'Punjabi', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🌾', description: 'Bhangra, folk, pop & trap' },
  { id: 'Hindi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', description: 'Bollywood, indie pop & ghazals' },
  { id: 'English', name: 'English', native: 'English', flag: '🌍', description: 'Global pop, hip-hop & rock' },
  { id: 'Haryanvi', name: 'Haryanvi', native: 'हरियाणवी', flag: '🚜', description: 'Folk beats & desi ragni' },
  { id: 'Urdu', name: 'Urdu', native: 'اردو', flag: '🌙', description: 'Qawwali, Sufi & ghazals' },
  { id: 'Tamil', name: 'Tamil', native: 'தமிழ்', flag: '🪘', description: 'Kollywood, Carnatic & kuthu' },
  { id: 'Telugu', name: 'Telugu', native: 'తెలుగు', flag: '🎶', description: 'Tollywood anthems & melodies' },
  { id: 'Bengali', name: 'Bengali', native: 'বাংলা', flag: '🌸', description: 'Rabindra Sangeet & modern indie' },
  { id: 'Marathi', name: 'Marathi', native: 'मराठी', flag: '🚩', description: 'Lavani, bhavgeet & retro hits' },
  { id: 'Bhojpuri', name: 'Bhojpuri', native: 'भोजपुरी', flag: '🥁', description: 'Desi folk, wedding & dance' },
  { id: 'Gujarati', name: 'Gujarati', native: 'ગુજરાતી', flag: '🪕', description: 'Garba, sugam & folk' },
  { id: 'Malayalam', name: 'Malayalam', native: 'മലയാളം', flag: '🌴', description: 'Mollywood melody & indie' },
  { id: 'Kannada', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🪗', description: 'Sandalwood classics & rhythm' },
];

export interface GenreOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const GENRE_OPTIONS: GenreOption[] = [
  { id: 'Pop', name: 'Pop', emoji: '🎤', color: 'from-pink-500 to-rose-600' },
  { id: 'Hip-hop', name: 'Hip-hop', emoji: '🎧', color: 'from-amber-500 to-orange-600' },
  { id: 'Punjabi', name: 'Punjabi Beats', emoji: '🪘', color: 'from-yellow-500 to-amber-600' },
  { id: 'Bollywood', name: 'Bollywood', emoji: '🎬', color: 'from-purple-500 to-indigo-600' },
  { id: 'Romantic', name: 'Romantic', emoji: '💖', color: 'from-rose-500 to-pink-600' },
  { id: 'Rock', name: 'Rock / Metal', emoji: '🎸', color: 'from-red-600 to-stone-800' },
  { id: 'Lo-Fi', name: 'Lo-Fi / Chillhop', emoji: '☕', color: 'from-teal-500 to-emerald-700' },
  { id: 'EDM', name: 'EDM & Dance', emoji: '⚡', color: 'from-cyan-500 to-blue-600' },
  { id: 'Indie', name: 'Indie Acoustic', emoji: '🌿', color: 'from-emerald-500 to-teal-700' },
];

export interface MoodOption {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'Happy', name: 'Happy', emoji: '😊', gradient: 'from-amber-400 to-orange-500' },
  { id: 'Sad', name: 'Sad', emoji: '😢', gradient: 'from-blue-600 to-slate-800' },
  { id: 'Relaxed', name: 'Relaxed', emoji: '😌', gradient: 'from-emerald-500 to-teal-700' },
  { id: 'Romantic', name: 'Romantic', emoji: '💖', gradient: 'from-rose-500 to-pink-600' },
  { id: 'Energetic', name: 'Energetic', emoji: '🔥', gradient: 'from-orange-500 to-red-600' },
  { id: 'Chill', name: 'Chill', emoji: '☕', gradient: 'from-amber-600 to-stone-800' },
  { id: 'Workout', name: 'Workout', emoji: '🏋️', gradient: 'from-red-600 to-stone-900' },
  { id: 'Party', name: 'Party', emoji: '🥳', gradient: 'from-fuchsia-500 to-pink-600' },
  { id: 'Focus', name: 'Focus', emoji: '🧠', gradient: 'from-indigo-600 to-violet-800' },
];
