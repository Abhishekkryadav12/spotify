import type { Track, RadioStation } from '../types/music';

const RADIO_API_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

interface RawRadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved?: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  codec?: string;
  bitrate?: number;
}

function mapRawToRadioStation(raw: RawRadioStation): RadioStation {
  return {
    id: raw.stationuuid,
    name: raw.name.trim(),
    url: raw.url_resolved || raw.url,
    favicon: raw.favicon && raw.favicon.startsWith('http') ? raw.favicon : undefined,
    country: raw.country,
    tags: raw.tags,
    bitrate: raw.bitrate,
    codec: raw.codec,
  };
}

export function convertStationToTrack(station: RadioStation): Track {
  return {
    id: `radio-${station.id}`,
    title: station.name,
    artist: `Live Broadcast • ${station.country || 'Global Radio'}`,
    album: station.tags ? station.tags.split(',').slice(0, 3).join(', ') : 'Internet Radio Stream',
    artwork: station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    audioUrl: station.url,
    duration: 0, // Indicates continuous live stream
    sourceType: 'radio',
    playbackMode: 'live',
    genre: station.tags ? station.tags.split(',')[0] : 'Radio',
    sourceLabel: 'Radio Browser (Live Broadcast)',
  };
}

export const RadioApi = {
  async getTopStations(limit = 15): Promise<RadioStation[]> {
    for (const server of RADIO_API_SERVERS) {
      try {
        const res = await fetch(`${server}/json/stations/topclick?limit=${limit}&hidebroken=true`);
        if (!res.ok) continue;
        const data: RawRadioStation[] = await res.json();
        return data
          // Filter to mp3 or aac streams which play natively in all browsers
          .filter(s => s.url && (s.codec === 'MP3' || s.codec === 'AAC' || s.url.endsWith('.mp3')))
          .map(mapRawToRadioStation);
      } catch (err) {
        console.warn(`Radio API server ${server} failed, trying next mirror:`, err);
      }
    }
    return [];
  },

  async searchStations(query: string, limit = 15): Promise<RadioStation[]> {
    if (!query.trim()) return [];
    for (const server of RADIO_API_SERVERS) {
      try {
        const res = await fetch(`${server}/json/stations/byname/${encodeURIComponent(query.trim())}?limit=${limit}&hidebroken=true`);
        if (!res.ok) continue;
        const data: RawRadioStation[] = await res.json();
        return data
          .filter(s => s.url && (s.codec === 'MP3' || s.codec === 'AAC' || s.url.endsWith('.mp3')))
          .map(mapRawToRadioStation);
      } catch (err) {
        console.warn(`Radio API search failed on ${server}:`, err);
      }
    }
    return [];
  },

  async getStationsByCountry(country: string, limit = 15): Promise<RadioStation[]> {
    if (!country.trim()) return [];
    for (const server of RADIO_API_SERVERS) {
      try {
        const res = await fetch(`${server}/json/stations/bycountry/${encodeURIComponent(country.trim())}?limit=${limit}&hidebroken=true`);
        if (!res.ok) continue;
        const data: RawRadioStation[] = await res.json();
        return data
          .filter(s => s.url && (s.codec === 'MP3' || s.codec === 'AAC' || s.url.endsWith('.mp3')))
          .map(mapRawToRadioStation);
      } catch (err) {
        console.warn(`Radio API country search failed on ${server}:`, err);
      }
    }
    return [];
  }
};
