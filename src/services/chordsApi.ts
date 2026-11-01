import type { Track } from '../types/music';

export interface ChordTiming {
  chord: string;
  time: number; // in seconds
  lyricsSnippet?: string;
}

export interface SongSection {
  name: string; // e.g. "Intro", "Verse 1", "Chorus", "Bridge", "Outro"
  startTime: number;
  endTime: number;
  chords: ChordTiming[];
}

export interface ChordDiagramData {
  name: string;
  strings: (number | 'x')[]; // 6 strings from low E to high e: fret number, 0 for open, 'x' for muted
  baseFret?: number;
  fingers?: number[];
}

export interface GuitarSongData {
  songTitle: string;
  artist: string;
  key: string;
  capo: string;
  tuning: string;
  tempoBpm: number;
  strummingPattern: string; // e.g. "D - D U - U D U"
  uniqueChords: string[];
  sections: SongSection[];
  tabSnippet?: string[];
}

// Common Guitar Chord Fingering Dictionary
export const CHORD_DIAGRAMS: Record<string, ChordDiagramData> = {
  'Em': { name: 'Em', strings: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'E': { name: 'E', strings: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'G': { name: 'G', strings: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
  'C': { name: 'C', strings: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'D': { name: 'D', strings: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'Am': { name: 'Am', strings: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'A': { name: 'A', strings: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'F': { name: 'F', strings: [1, 3, 3, 2, 1, 1], baseFret: 1, fingers: [1, 3, 4, 2, 1, 1] },
  'Bm': { name: 'Bm', strings: ['x', 2, 4, 4, 3, 2], baseFret: 2, fingers: [0, 1, 3, 4, 2, 1] },
  'Dm': { name: 'Dm', strings: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'Bb': { name: 'Bb', strings: ['x', 1, 3, 3, 3, 1], baseFret: 1, fingers: [0, 1, 2, 3, 4, 1] },
  'Gm': { name: 'Gm', strings: [3, 5, 5, 3, 3, 3], baseFret: 3, fingers: [1, 3, 4, 1, 1, 1] },
  'F#m': { name: 'F#m', strings: [2, 4, 4, 2, 2, 2], baseFret: 2, fingers: [1, 3, 4, 1, 1, 1] },
  'C#m': { name: 'C#m', strings: ['x', 4, 6, 6, 5, 4], baseFret: 4, fingers: [0, 1, 3, 4, 2, 1] },
};

// Preset catalog for popular tracks
const SONG_PRESETS: Record<string, Partial<GuitarSongData>> = {
  'shape of you': {
    key: 'C# Minor (Capo 2nd Fret: Bm)',
    capo: '2nd Fret',
    tuning: 'Standard (E A D G B E)',
    tempoBpm: 96,
    strummingPattern: '↓  ↓ ↑  ↑ ↓ ↑ (D - D U - U D U)',
    uniqueChords: ['Bm', 'Em', 'G', 'A'],
    tabSnippet: [
      'e|---------------------------------|',
      'B|-----3-------3-------0-------2---|',
      'G|---4---4---0---0---0---0---2---2-|',
      'D|---------------------------------|',
      'A|-2-----------------------0-------|',
      'E|---------0-------3---------------|',
    ],
  },
  'perfect': {
    key: 'Ab Major (Capo 1st Fret: G)',
    capo: '1st Fret',
    tuning: 'Standard (E A D G B E)',
    tempoBpm: 95,
    strummingPattern: '↓  ↓ ↑  ↓  ↓ ↑ (6/8 Time)',
    uniqueChords: ['G', 'Em', 'C', 'D'],
  },
  'gehra hua': {
    key: 'E Minor',
    capo: 'None (or Capo 2 for Dm shape)',
    tuning: 'Standard (E A D G B E)',
    tempoBpm: 88,
    strummingPattern: '↓ - ↓ ↑ - ↑ ↓ - (Soft Acoustic Ballad)',
    uniqueChords: ['Em', 'C', 'G', 'D', 'Am'],
  },
  'born to shine': {
    key: 'D Minor',
    capo: 'None',
    tuning: 'Standard (E A D G B E)',
    tempoBpm: 104,
    strummingPattern: '↓ ↑ ↓ ↑ (Punjabi Urban Beat)',
    uniqueChords: ['Dm', 'Bb', 'F', 'C'],
  },
};

export const ChordsApi = {
  /**
   * Generates or retrieves synchronized guitar chords and timeline for a given track
   */
  getGuitarData(track: Track): GuitarSongData {
    const titleLower = track.title.toLowerCase();
    const duration = track.duration && track.duration > 30 ? track.duration : 180;

    // Check presets
    let matchedPresetKey: string | null = null;
    for (const key of Object.keys(SONG_PRESETS)) {
      if (titleLower.includes(key)) {
        matchedPresetKey = key;
        break;
      }
    }

    const preset = matchedPresetKey ? SONG_PRESETS[matchedPresetKey] : null;

    const key = preset?.key || this.estimateKey(track);
    const capo = preset?.capo || (titleLower.includes('acoustic') ? '2nd Fret' : 'None');
    const tuning = preset?.tuning || 'Standard (E A D G B E)';
    const tempoBpm = preset?.tempoBpm || (track.genre?.includes('POP') ? 116 : 96);
    const strummingPattern = preset?.strummingPattern || '↓  ↓ ↑  ↑ ↓ ↑ (D - D U - U D U)';
    const uniqueChords = preset?.uniqueChords || this.getDefaultChordsForKey(key);

    // Build synchronized timeline sections
    const sections = this.buildSynchronizedSections(duration, uniqueChords);

    return {
      songTitle: track.title,
      artist: track.artist,
      key,
      capo,
      tuning,
      tempoBpm,
      strummingPattern,
      uniqueChords,
      sections,
      tabSnippet: preset?.tabSnippet || [
        'e|---------------------------------|',
        'B|-----0-------1-------0-------3---|',
        'G|---0---0---0---0---0---0---2---2-|',
        'D|-------------------------0-------|',
        'A|---------3-----------------------|',
        'E|-0---------------3---------------|',
      ],
    };
  },

  estimateKey(track: Track): string {
    const hash = (track.title + track.artist).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const keys = ['G Major', 'E Minor', 'C Major', 'D Major', 'A Minor', 'F Major', 'D Minor'];
    return keys[hash % keys.length];
  },

  getDefaultChordsForKey(key: string): string[] {
    if (key.includes('Em') || key.includes('E Minor')) return ['Em', 'C', 'G', 'D', 'Am'];
    if (key.includes('G')) return ['G', 'Em', 'C', 'D', 'Am'];
    if (key.includes('C')) return ['C', 'Am', 'F', 'G', 'Em'];
    if (key.includes('D Minor') || key.includes('Dm')) return ['Dm', 'Bb', 'F', 'C', 'Gm'];
    if (key.includes('Bm')) return ['Bm', 'G', 'D', 'A', 'Em'];
    return ['Em', 'C', 'G', 'D'];
  },

  buildSynchronizedSections(duration: number, chords: string[]): SongSection[] {
    const numChords = chords.length;
    const c = (idx: number) => chords[idx % numChords];

    // Standard structural percentage distribution
    const secDefs = [
      { name: 'Intro', pctStart: 0, pctEnd: 0.10, chordSeq: [c(0), c(1), c(2), c(3)] },
      { name: 'Verse 1', pctStart: 0.10, pctEnd: 0.32, chordSeq: [c(0), c(1), c(2), c(3), c(0), c(1), c(2), c(3)] },
      { name: 'Pre-Chorus', pctStart: 0.32, pctEnd: 0.42, chordSeq: [c(1), c(3), c(0), c(3)] },
      { name: 'Chorus', pctStart: 0.42, pctEnd: 0.60, chordSeq: [c(2), c(3), c(0), c(1), c(2), c(3), c(0), c(1)] },
      { name: 'Verse 2', pctStart: 0.60, pctEnd: 0.75, chordSeq: [c(0), c(1), c(2), c(3)] },
      { name: 'Bridge / Solo', pctStart: 0.75, pctEnd: 0.85, chordSeq: [c(4) || c(1), c(0), c(1), c(3)] },
      { name: 'Final Chorus & Outro', pctStart: 0.85, pctEnd: 1.0, chordSeq: [c(2), c(3), c(0), c(1), c(0)] },
    ];

    return secDefs.map((def) => {
      const startTime = Math.round(def.pctStart * duration);
      const endTime = Math.round(def.pctEnd * duration);
      const span = endTime - startTime;
      const step = span / def.chordSeq.length;

      const chordTimings: ChordTiming[] = def.chordSeq.map((chord, i) => ({
        chord,
        time: Math.round((startTime + i * step) * 10) / 10,
      }));

      return {
        name: def.name,
        startTime,
        endTime,
        chords: chordTimings,
      };
    });
  },
};
