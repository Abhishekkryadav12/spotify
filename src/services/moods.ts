export type MoodLanguage = 'all' | 'hindi' | 'punjabi' | 'english';

export interface MoodConfig {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  bgGlow: string;
  borderGlow: string;
  tagline: string;
  description: string;
  tags: string[];
  queries: {
    all: string;
    hindi: string;
    punjabi: string;
    english: string;
  };
}

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    id: 'happy',
    name: 'Happy',
    emoji: '😊',
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    bgGlow: 'bg-amber-500/15',
    borderGlow: 'hover:border-amber-400/50 hover:shadow-amber-500/20',
    tagline: 'Feel-good anthems, sunny melodies & joyful celebrations',
    description: 'Bright pop beats, joyful Bollywood choruses, and upbeat party tracks to lift your spirits.',
    tags: ['Feel Good', 'Upbeat', 'Sunshine', 'Pop Hits'],
    queries: {
      all: 'Happy Upbeat Feel Good Hits',
      hindi: 'Happy Bollywood Upbeat Hits Gallan Goodiyaan',
      punjabi: 'Happy Upbeat Punjabi Hits Diljit',
      english: 'Happy Pop Feel Good Hits Pharrell',
    },
  },
  {
    id: 'sad',
    name: 'Sad',
    emoji: '😢',
    gradient: 'from-blue-600 via-indigo-700 to-slate-800',
    bgGlow: 'bg-blue-600/15',
    borderGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/20',
    tagline: 'Deep emotional ballads, heartbreak & reflective acoustic chords',
    description: 'Heart-touching melancholic ballads and soft acoustic melodies for when words fail.',
    tags: ['Heartbreak', 'Tears', 'Melancholy', 'Ballads'],
    queries: {
      all: 'Broken Heart Sad Songs Ballads',
      hindi: 'Sad Hindi Songs Arijit Channa Mereya',
      punjabi: 'Sad Punjabi Songs B Praak Jaani',
      english: 'Sad Melancholy Acoustic Pop Adele Lewis',
    },
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    emoji: '😌',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    bgGlow: 'bg-teal-500/15',
    borderGlow: 'hover:border-teal-500/50 hover:shadow-teal-500/20',
    tagline: 'Gentle acoustic strings, calm breezes & soothing soundscapes',
    description: 'Unwind with smooth rhythms, delicate acoustic strums, and peaceful serene vocals.',
    tags: ['Peaceful', 'Gentle', 'Calm', 'Acoustic'],
    queries: {
      all: 'Relaxing Acoustic Peaceful Chill',
      hindi: 'Relaxing Hindi Melodies Iktara Sham',
      punjabi: 'Soft Relaxing Punjabi Melodies',
      english: 'Acoustic Relaxing Peaceful Indie Folk',
    },
  },
  {
    id: 'romantic',
    name: 'Romantic',
    emoji: '💖',
    gradient: 'from-rose-500 via-pink-600 to-purple-700',
    bgGlow: 'bg-rose-500/15',
    borderGlow: 'hover:border-pink-500/50 hover:shadow-pink-500/20',
    tagline: 'Passionate duets, love confessions & tender serenades',
    description: 'The ultimate love soundscape: heartwarming duets, acoustic love songs, and romantic cinema tracks.',
    tags: ['Love', 'Duet', 'Sweetheart', 'Candlelight'],
    queries: {
      all: 'Romantic Love Hits Songs',
      hindi: 'Romantic Bollywood Love Songs Tum Hi Ho',
      punjabi: 'Romantic Punjabi Love Songs Sharry Mann',
      english: 'Romantic Pop Love Songs Ed Sheeran',
    },
  },
  {
    id: 'energetic',
    name: 'Energetic',
    emoji: '🔥',
    gradient: 'from-orange-500 via-red-600 to-amber-600',
    bgGlow: 'bg-orange-500/15',
    borderGlow: 'hover:border-orange-500/50 hover:shadow-orange-500/20',
    tagline: 'High-voltage drops, pumping BPM & unstoppable adrenaline',
    description: 'Electrifying electronic drops, fast tempos, and high-octane bangers to charge your battery.',
    tags: ['Adrenaline', 'EDM', 'Hype', 'High BPM'],
    queries: {
      all: 'High Energy EDM Dance Pop',
      hindi: 'High Energy Bollywood Dance Hits Apna Time Aayega',
      punjabi: 'High Energy Punjabi Bhangra Sidhu Moosewala',
      english: 'High Energy Workout EDM Pop Hits',
    },
  },
  {
    id: 'emotional',
    name: 'Emotional',
    emoji: '🌧️',
    gradient: 'from-sky-600 via-blue-700 to-indigo-900',
    bgGlow: 'bg-sky-600/15',
    borderGlow: 'hover:border-sky-500/50 hover:shadow-sky-500/20',
    tagline: 'Soul-stirring Sufi, cinematic strings & moving melodies',
    description: 'Deeply expressive compositions, timeless Sufi prayers, and cinematic melodies that touch the core.',
    tags: ['Soulful', 'Sufi', 'Cinematic', 'Moving'],
    queries: {
      all: 'Soulful Emotional Sufi Hits',
      hindi: 'Soulful Emotional Hindi Songs Kabira Kun Faya Kun',
      punjabi: 'Emotional Punjabi Sufi Satinder Sartaaj',
      english: 'Emotional Soulful Piano Ballads Lewis Capaldi',
    },
  },
  {
    id: 'night_vibes',
    name: 'Night Vibes',
    emoji: '🌙',
    gradient: 'from-indigo-900 via-purple-950 to-slate-950',
    bgGlow: 'bg-purple-900/15',
    borderGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/20',
    tagline: 'Midnight cruisers, moody synthwave & neon highway rhythms',
    description: 'Dark synth textures, midnight R&B basslines, and dreamy nocturnal beats for late-night city drives.',
    tags: ['Midnight', 'Drive', 'Synthwave', 'Dark R&B'],
    queries: {
      all: 'Late Night Drive Midnight Vibes',
      hindi: 'Late Night Hindi Drive Songs Baarishein',
      punjabi: 'Late Night Punjabi Drive AP Dhillon',
      english: 'Late Night Synthwave R&B The Weeknd',
    },
  },
  {
    id: 'focus',
    name: 'Focus / Study',
    emoji: '🧠',
    gradient: 'from-indigo-600 via-blue-700 to-violet-800',
    bgGlow: 'bg-indigo-600/15',
    borderGlow: 'hover:border-indigo-400/50 hover:shadow-indigo-500/20',
    tagline: 'Distraction-free lo-fi, warm beats & deep concentration',
    description: 'Lo-fi chillhop, gentle ambient textures, and instrumental grooves designed to keep your mind locked in.',
    tags: ['Lo-Fi', 'Study', 'Instrumental', 'Deep Flow'],
    queries: {
      all: 'Lofi Hip Hop Study Beats Instrumental',
      hindi: 'Instrumental Lofi Bollywood Study',
      punjabi: 'Lofi Punjabi Beats Instrumental',
      english: 'Lofi Study Chillhop Beats Instrumental',
    },
  },
  {
    id: 'workout',
    name: 'Workout',
    emoji: '🏋️',
    gradient: 'from-red-600 via-rose-700 to-stone-900',
    bgGlow: 'bg-red-600/15',
    borderGlow: 'hover:border-red-500/50 hover:shadow-red-500/20',
    tagline: 'Heavy bass, beast-mode motivation & iron-pumping bangers',
    description: 'Punchy 808s, aggressive drops, and motivational rap power tracks built for hitting PRs.',
    tags: ['Gym', 'Heavy Bass', 'Beast Mode', 'Motivation'],
    queries: {
      all: 'Gym Workout Motivation Bass Trap',
      hindi: 'Gym Workout Motivation Bollywood Zinda Brothers',
      punjabi: 'Hardcore Punjabi Workout Gym Sidhu',
      english: 'Workout Motivation Heavy Bass Trap Rock Neffex',
    },
  },
  {
    id: 'party',
    name: 'Party',
    emoji: '🥳',
    gradient: 'from-fuchsia-500 via-pink-600 to-amber-500',
    bgGlow: 'bg-fuchsia-500/15',
    borderGlow: 'hover:border-pink-500/50 hover:shadow-pink-500/20',
    tagline: 'Club anthems, non-stop dancefloors & celebration fireworks',
    description: 'Turn the volume to max with chart-topping club anthems, wedding dance hits, and DJ remixed tracks.',
    tags: ['Club', 'Dancefloor', 'Celebration', 'DJ Remix'],
    queries: {
      all: 'Party Dance Club Hits Non Stop',
      hindi: 'Bollywood Party Dance Hits Kala Chashma',
      punjabi: 'Punjabi Party Dancefloor Bhangra Hits Diljit',
      english: 'Top Global Party Dance Hits Dua Lipa',
    },
  },
  {
    id: 'chill',
    name: 'Chill',
    emoji: '☕',
    gradient: 'from-amber-600 via-amber-800 to-stone-800',
    bgGlow: 'bg-amber-600/15',
    borderGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/20',
    tagline: 'Coffeehouse acoustics, cozy indie folk & mellow afternoon sips',
    description: 'Warm cafe rhythms, acoustic guitars, and laid-back indie vibes perfect for lazy afternoons and hot coffee.',
    tags: ['Coffeehouse', 'Cozy', 'Indie Folk', 'Mellow'],
    queries: {
      all: 'Cozy Coffeehouse Chill Indie',
      hindi: 'Cozy Indie Hindi Cold Mess Prateek Kuhad',
      punjabi: 'Mellow Chill Punjabi Indie',
      english: 'Coffeehouse Chill Indie Pop Acoustic',
    },
  },
  {
    id: 'angry',
    name: 'Angry / Release Stress',
    emoji: '😡',
    gradient: 'from-red-700 via-neutral-900 to-black',
    bgGlow: 'bg-red-700/15',
    borderGlow: 'hover:border-red-600/50 hover:shadow-red-600/20',
    tagline: 'Raw distorted guitars, cathartic screams & explosive stress relief',
    description: 'Crush stress with heavy metal riffs, ferocious rap bars, and raw rock energy for intense emotional release.',
    tags: ['Hard Rock', 'Metal', 'Stress Release', 'Catharsis'],
    queries: {
      all: 'Hard Rock Heavy Metal Rage Catharsis',
      hindi: 'Angry Cathartic Hindi Rock Sadda Haq Bhaag DK Bose',
      punjabi: 'Aggressive Punjabi Rap Rage Sidhu',
      english: 'Heavy Metal Hard Rock Nu Metal Linkin Park Metallica',
    },
  },
];
