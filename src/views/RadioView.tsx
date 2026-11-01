import React, { useState, useEffect } from 'react';
import { Radio, Play, Pause, Search, Globe, Loader2 } from 'lucide-react';
import type { RadioStation } from '../types/music';
import { RadioApi, convertStationToTrack } from '../services/radioApi';
import { usePlayer } from '../context/PlayerContext';

const GENRE_TAGS = ['All', 'Pop', 'Dance', 'Rock', 'Jazz', 'Classical', 'News', 'Chill'];

export const RadioView: React.FC = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    let active = true;

    async function loadStations() {
      setLoading(true);
      try {
        const query = search.trim() || (selectedTag !== 'All' ? selectedTag : '');
        let results: RadioStation[] = [];
        if (query) {
          results = await RadioApi.searchStations(query, 24);
        } else {
          results = await RadioApi.getTopStations(24);
        }
        if (active) setStations(results);
      } catch (err) {
        console.warn('Radio load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    const handler = setTimeout(loadStations, search ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [search, selectedTag]);

  const handleStationClick = (station: RadioStation) => {
    const track = convertStationToTrack(station);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, [track]);
    }
  };

  return (
    <div className="p-8 pb-32 space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight text-white">Live Global Radio</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Over 30,000 community-curated radio stations streamed in real-time via Radio Browser API
          </p>
        </div>

        {/* Search Stations */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stations or genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#242424] text-white text-xs rounded-full pl-9 pr-4 py-2 border border-transparent focus:border-[#1db954] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Genre Tag Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {GENRE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setSelectedTag(tag);
              setSearch('');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTag === tag && !search
                ? 'bg-[#1db954] text-black'
                : 'bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#1db954]" />
          <span className="text-sm">Connecting to global radio streams...</span>
        </div>
      )}

      {/* Stations Grid */}
      {!loading && stations.length === 0 ? (
        <div className="py-20 text-center text-neutral-400">
          <Globe className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
          <h3 className="text-lg font-bold text-white mb-1">No stations found</h3>
          <p className="text-xs">Try selecting a different genre or searching for another country.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stations.map((st) => {
            const track = convertStationToTrack(st);
            const isCurrent = currentTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={st.id}
                onClick={() => handleStationClick(st)}
                className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full mb-3 rounded-lg overflow-hidden shadow-lg bg-neutral-900 flex items-center justify-center p-3">
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
                    <Radio className="w-12 h-12 text-neutral-600" />
                  )}

                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow uppercase">
                    Live
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStationClick(st);
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

                <div className="min-w-0">
                  <h3 className={`font-bold text-sm truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>
                    {st.name}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-1">
                    {st.country || 'Global'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500">
                  <span className="uppercase font-semibold">{st.codec || 'MP3'}</span>
                  <span>{st.bitrate ? `${st.bitrate} kbps` : 'Live'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
