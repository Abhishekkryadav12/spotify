export interface ArtistItem {
  id: string;
  name: string;
  image: string;
  languages: string[];
  genre: string;
  verified?: boolean;
}

export const POPULAR_ARTISTS: ArtistItem[] = [
  {
    id: 'diljit-dosanjh',
    name: 'Diljit Dosanjh',
    image: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_004_20221006184540_500x500.jpg',
    languages: ['Punjabi', 'Hindi'],
    genre: 'Punjabi Pop & Bhangra',
    verified: true,
  },
  {
    id: 'ap-dhillon',
    name: 'AP Dhillon',
    image: 'https://c.saavncdn.com/artists/AP_Dhillon_002_20210603073934_500x500.jpg',
    languages: ['Punjabi'],
    genre: 'Punjabi Hip-hop & Trap',
    verified: true,
  },
  {
    id: 'sidhu-moose-wala',
    name: 'Sidhu Moose Wala',
    image: 'https://c.saavncdn.com/artists/Sidhu_Moose_Wala_004_20230609101217_500x500.jpg',
    languages: ['Punjabi'],
    genre: 'Gangsta Rap & Folk',
    verified: true,
  },
  {
    id: 'karan-aujla',
    name: 'Karan Aujla',
    image: 'https://c.saavncdn.com/artists/Karan_Aujla_002_20230818091807_500x500.jpg',
    languages: ['Punjabi'],
    genre: 'Punjabi Rap & RnB',
    verified: true,
  },
  {
    id: 'shubh',
    name: 'Shubh',
    image: 'https://c.saavncdn.com/artists/Shubh_000_20220914101140_500x500.jpg',
    languages: ['Punjabi'],
    genre: 'Indie Punjabi Trap',
    verified: true,
  },
  {
    id: 'arijit-singh',
    name: 'Arijit Singh',
    image: 'https://c.saavncdn.com/artists/Arijit_Singh_002_20230323062147_500x500.jpg',
    languages: ['Hindi', 'Bengali'],
    genre: 'Bollywood Soul & Romantic',
    verified: true,
  },
  {
    id: 'atif-aslam',
    name: 'Atif Aslam',
    image: 'https://c.saavncdn.com/artists/Atif_Aslam_004_20220311105151_500x500.jpg',
    languages: ['Urdu', 'Hindi', 'Punjabi'],
    genre: 'Pop Rock & Sufi',
    verified: true,
  },
  {
    id: 'shreya-ghoshal',
    name: 'Shreya Ghoshal',
    image: 'https://c.saavncdn.com/artists/Shreya_Ghoshal_004_20230713075253_500x500.jpg',
    languages: ['Hindi', 'Bengali', 'Tamil', 'Telugu'],
    genre: 'Bollywood & Classical',
    verified: true,
  },
  {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    image: 'https://c.saavncdn.com/artists/Taylor_Swift_500x500.jpg',
    languages: ['English'],
    genre: 'Pop & Country',
    verified: true,
  },
  {
    id: 'ed-sheeran',
    name: 'Ed Sheeran',
    image: 'https://c.saavncdn.com/artists/Ed_Sheeran_500x500.jpg',
    languages: ['English'],
    genre: 'Acoustic Pop & Folk',
    verified: true,
  },
  {
    id: 'the-weeknd',
    name: 'The Weeknd',
    image: 'https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg',
    languages: ['English'],
    genre: 'Synth-Pop & RnB',
    verified: true,
  },
  {
    id: 'badshah',
    name: 'Badshah',
    image: 'https://c.saavncdn.com/artists/Badshah_005_20230609101235_500x500.jpg',
    languages: ['Hindi', 'Punjabi', 'Haryanvi'],
    genre: 'Desi Hip-Hop & Party',
    verified: true,
  },
  {
    id: 'billie-eilish',
    name: 'Billie Eilish',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
    languages: ['English'],
    genre: 'Alt-Pop & Electropop',
    verified: true,
  },
  {
    id: 'anuv-jain',
    name: 'Anuv Jain',
    image: 'https://c.saavncdn.com/artists/Anuv_Jain_500x500.jpg',
    languages: ['Hindi'],
    genre: 'Acoustic Indie & Poetry',
    verified: true,
  },
  {
    id: 'prateek-kuhad',
    name: 'Prateek Kuhad',
    image: 'https://c.saavncdn.com/artists/Prateek_Kuhad_500x500.jpg',
    languages: ['Hindi', 'English'],
    genre: 'Indie Folk & Acoustic',
    verified: true,
  },
  {
    id: 'b-praak',
    name: 'B Praak',
    image: 'https://c.saavncdn.com/artists/B_Praak_003_20220616110821_500x500.jpg',
    languages: ['Punjabi', 'Hindi'],
    genre: 'Emotional Ballads',
    verified: true,
  },
  {
    id: 'neha-kakkar',
    name: 'Neha Kakkar',
    image: 'https://c.saavncdn.com/artists/Neha_Kakkar_006_20201021074853_500x500.jpg',
    languages: ['Hindi', 'Punjabi'],
    genre: 'Bollywood Dance & Pop',
    verified: true,
  },
  {
    id: 'sonu-nigam',
    name: 'Sonu Nigam',
    image: 'https://c.saavncdn.com/artists/Sonu_Nigam_002_20220208112217_500x500.jpg',
    languages: ['Hindi', 'Kannada', 'Bengali'],
    genre: 'Evergreen Bollywood',
    verified: true,
  },
  {
    id: 'drake',
    name: 'Drake',
    image: 'https://c.saavncdn.com/artists/Drake_500x500.jpg',
    languages: ['English'],
    genre: 'Hip-Hop & Trap',
    verified: true,
  },
  {
    id: 'dua-lipa',
    name: 'Dua Lipa',
    image: 'https://c.saavncdn.com/artists/Dua_Lipa_500x500.jpg',
    languages: ['English'],
    genre: 'Nu-Disco & Pop',
    verified: true,
  },
];

/**
 * Search for artists dynamically from curated list and live music catalog
 */
export async function searchArtists(query: string): Promise<ArtistItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return POPULAR_ARTISTS;

  // 1. Filter local curated list first
  const localMatches = POPULAR_ARTISTS.filter(a =>
    a.name.toLowerCase().includes(trimmed) ||
    a.languages.some(l => l.toLowerCase().includes(trimmed)) ||
    a.genre.toLowerCase().includes(trimmed)
  );

  // 2. Fetch live matching songs from JioSaavn and extract real artists
  try {
    const res = await fetch(`http://127.0.0.1:5000/search?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.result)) {
        const liveArtists: ArtistItem[] = [];
        const seenNames = new Set(localMatches.map(m => m.name.toLowerCase()));

        for (const item of data.result) {
          const rawArtists = item.artistMap?.primary_artists || [];
          for (const art of rawArtists) {
            const name = (art.name || '').trim();
            if (name && !seenNames.has(name.toLowerCase())) {
              seenNames.add(name.toLowerCase());
              liveArtists.push({
                id: `saavn-art-${art.id || name.toLowerCase().replace(/\s+/g, '-')}`,
                name,
                image: art.image || item.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop',
                languages: [item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music'],
                genre: item.album || 'Studio Artist',
              });
            }
          }
        }
        return [...localMatches, ...liveArtists.slice(0, 8)];
      }
    }
  } catch {
    // If live search fails, return curated matches
  }

  return localMatches;
}
