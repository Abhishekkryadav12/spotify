export type AudioSourceType = 'archive' | 'jamendo' | 'itunes' | 'radio' | 'demo' | 'spotify' | 'saavn';
export type PlaybackMode = 'full' | 'preview' | 'live';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  audioUrl: string;
  duration: number; // in seconds
  sourceType: AudioSourceType;
  playbackMode: PlaybackMode; // 'full' = full song, 'preview' = 30s sample, 'live' = continuous stream
  externalUrl?: string;
  genre?: string;
  isExplicit?: boolean;
  releaseDate?: string;
  sourceLabel?: string;
  isDownloaded?: boolean;
  fileSize?: number; // in bytes
  downloadedAt?: string; // ISO date string
  playedAt?: string; // ISO date string
  offlineUrl?: string; // Blob object URL for offline playback
}

export interface DownloadedTrackRecord {
  id: string; // track id
  userId?: string;
  track: Track;
  audioBlob: Blob;
  fileName: string;
  fileSize: number;
  downloadedAt: string;
  localPath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  country?: string;
  tags?: string;
  bitrate?: number;
  codec?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  error: string | null;
  queue: Track[];
  queueIndex: number;
  isLiveStream: boolean;
}

export type ActiveView = 
  | { type: 'home' }
  | { type: 'search'; initialQuery?: string }
  | { type: 'library'; tab?: 'playlists' | 'liked' | 'recent' | 'downloads' }
  | { type: 'playlist'; playlistId: string }
  | { type: 'radio' }
  | { type: 'album'; albumName: string; artistName: string; tracks: Track[]; artwork: string };
