import React, { useState, useEffect } from 'react';
import { Play, Pause, Radio, Loader2, Music2, Heart, Plus, CheckCircle } from 'lucide-react';
import type { Track, RadioStation } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { ArchiveMusicApi } from '../services/archiveMusicApi';
import { JamendoApi } from '../services/jamendoApi';
import { SaavnApi } from '../services/saavnApi';
import { RadioApi, convertStationToTrack } from '../services/radioApi';
import { TrackRow } from '../components/TrackRow';

interface SearchViewProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddToPlaylist: (track: Track) => void;
}

const GENRE_TILES = [
  { name: 'Pop', color: 'from-pink-600 to-rose-500', query: 'Pop hits' },
  { name: 'Hip-Hop', color: 'from-orange-600 to-amber-600', query: 'Hip Hop' },
  { name: 'Rock', color: 'from-red-700 to-rose-700', query: 'Rock classics' },
  { name: 'Electronic', color: 'from-teal-600 to-emerald-600', query: 'Electronic Dance' },
  { name: 'Lofi / Chill', color: 'from-indigo-600 to-blue-600', query: 'Lofi chill' },
  { name: 'Jazz & Soul', color: 'from-blue-700 to-cyan-700', query: 'Jazz' },
  { name: 'Classical', color: 'from-amber-700 to-yellow-600', query: 'Classical orchestra' },
  { name: 'Indie & Alt', color: 'from-purple-700 to-violet-600', query: 'Indie alternative' },
  { name: 'Synthwave', color: 'from-fuchsia-600 to-pink-700', query: 'Synthwave 80s' },
  { name: 'Acoustic', color: 'from-emerald-700 to-teal-800', query: 'Acoustic guitar' },
  { name: 'R&B', color: 'from-violet-800 to-indigo-900', query: 'R&B' },
  { name: 'Metal', color: 'from-neutral-700 to-neutral-900', query: 'Heavy Metal' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  setSearchQuery,
  onAddToPlaylist,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'full' | 'radio'>('all');

  // Debounced search effect across JioSaavn (Full Studio Masters), Archive.org, and Jamendo
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTracks([]);
      setStations([]);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const [saavnRes, archiveRes, jamendoRes, stationRes] = await Promise.allSettled([
          SaavnApi.searchTracks(searchQuery, 25),
          ArchiveMusicApi.searchFullTracks(searchQuery, 10),
          JamendoApi.searchTracks(searchQuery, 10),
          RadioApi.searchStations(searchQuery, 8)
        ]);

        const fullSongs: Track[] = [
          ...(saavnRes.status === 'fulfilled' ? saavnRes.value : []),
          ...(archiveRes.status === 'fulfilled' ? archiveRes.value : []),
          ...(jamendoRes.status === 'fulfilled' ? jamendoRes.value : [])
        ].filter(t => t.playbackMode === 'full' && (t.duration === 0 || t.duration > 30));

        // Deduplicate songs by title + artist to ensure high quality results
        const seen = new Set<string>();
        const uniqueFullSongs: Track[] = [];
        for (const song of fullSongs) {
          const key = `${song.title.toLowerCase().trim()}_${song.artist.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFullSongs.push(song);
          }
        }

        setTracks(uniqueFullSongs);
        if (stationRes.status === 'fulfilled') setStations(stationRes.value);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const displayedTracks =
    filter === 'radio'
      ? []
      : tracks;

  const topTrack = displayedTracks[0] || null;

  return (
    <div className="p-8 pb-32 space-y-8 select-none max-w-7xl mx-auto">
      {/* Category filter pills when query is present */}
      {searchQuery.trim() && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            All Results ({tracks.length + stations.length})
          </button>
          <button
            onClick={() => setFilter('full')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filter === 'full'
                ? 'bg-[#1db954] text-black font-bold'
                : 'bg-neutral-800 text-[#1db954] hover:bg-neutral-700 border border-[#1db954]/30'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Full Songs ({tracks.length})</span>
          </button>
          <button
            onClick={() => setFilter('radio')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === 'radio' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Radio Stations ({stations.length})
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#1db954]" />
          <span className="text-sm">Searching music catalogs and radio streams...</span>
        </div>
      )}

      {/* Search Results Display */}
      {!loading && searchQuery.trim() && (
        <>
          {tracks.length === 0 && stations.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <Music2 className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
              <h3 className="text-lg font-bold text-white mb-1">No results found for "{searchQuery}"</h3>
              <p className="text-xs">Please verify your spelling, or try searching for another artist or song title.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Result + Top 4 Songs Grid */}
              {filter !== 'radio' && topTrack && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Top Result Card */}
                  <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Top Result</h2>
                    <div
                      onClick={() => {
                        if (currentTrack?.id === topTrack.id) togglePlay();
                        else playTrack(topTrack, tracks);
                      }}
                      className="group relative bg-[#181818] hover:bg-[#282828] p-5 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
                    >
                      <img
                        src={topTrack.artwork}
                        alt={topTrack.title}
                        className="w-24 h-24 rounded-lg object-cover shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                        }}
                      />

                      <div className="min-w-0">
                        <h3 className="text-2xl font-bold text-white truncate tracking-tight mb-1">
                          {topTrack.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <span className="text-white font-medium">{topTrack.artist}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-wider text-[10px] text-white">
                            Song
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(topTrack);
                            }}
                            className={`p-2 rounded-full hover:scale-110 transition-transform ${
                              isLiked(topTrack.id) ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${isLiked(topTrack.id) ? 'fill-[#1db954]' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToPlaylist(topTrack);
                            }}
                            className="p-2 rounded-full text-neutral-400 hover:text-white hover:scale-110 transition-transform"
                            title="Add to Playlist"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentTrack?.id === topTrack.id) togglePlay();
                            else playTrack(topTrack, tracks);
                          }}
                          className="w-12 h-12 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                          {currentTrack?.id === topTrack.id && isPlaying ? (
                            <Pause className="w-5 h-5 fill-black" />
                          ) : (
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Songs List */}
                  <div className="lg:col-span-3">
                    <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Songs</h2>
                    <div className="space-y-1">
                      {displayedTracks.slice(0, 4).map((track, idx) => (
                        <TrackRow
                          key={track.id}
                          track={track}
                          index={idx}
                          playlistContext={displayedTracks}
                          onAddToPlaylist={onAddToPlaylist}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Extended Track List */}
              {filter !== 'radio' && displayedTracks.length > 4 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-3 tracking-tight">All Song Matches</h2>
                  <div className="space-y-1">
                    {displayedTracks.slice(4).map((track, idx) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={idx + 4}
                        playlistContext={displayedTracks}
                        onAddToPlaylist={onAddToPlaylist}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Live Radio Stations */}
              {(filter === 'all' || filter === 'radio') && stations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Matching Radio Streams</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {stations.map((st) => {
                      const track = convertStationToTrack(st);
                      const isCurrent = currentTrack?.id === track.id;
                      const isCurrentPlaying = isCurrent && isPlaying;

                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (isCurrent) togglePlay();
                            else playTrack(track, [track]);
                          }}
                          className="group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col"
                        >
                          <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-lg bg-neutral-900 flex items-center justify-center p-2">
                            {st.favicon ? (
                              <img
                                src={st.favicon}
                                alt={st.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=80';
                                }}
                              />
                            ) : (
                              <Radio className="w-10 h-10 text-neutral-600" />
                            )}
                            <button
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
                            {st.name}
                          </h3>
                          <p className="text-xs text-neutral-400 truncate mt-1">
                            {st.country || 'Global Stream'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Default Browse All Section when no query is typed */}
      {!searchQuery.trim() && (
        <section>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-4">Browse All Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GENRE_TILES.map((genre) => (
              <div
                key={genre.name}
                onClick={() => setSearchQuery(genre.query)}
                className={`aspect-square p-4 rounded-xl bg-gradient-to-br ${genre.color} hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg relative overflow-hidden flex flex-col justify-between`}
              >
                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                  {genre.name}
                </h3>
                <div className="self-end opacity-20 transform translate-x-2 translate-y-2">
                  <Music2 className="w-16 h-16" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
