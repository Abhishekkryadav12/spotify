import React, { useState } from 'react';
import { Play, Pause, Shuffle, Trash2, Edit3, Music2, Clock } from 'lucide-react';
import type { Track, ActiveView } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from '../components/TrackRow';

interface PlaylistViewProps {
  playlistId: string;
  setActiveView: (view: ActiveView) => void;
  onAddToPlaylist: (track: Track) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  setActiveView,
  onAddToPlaylist,
}) => {
  const { playlists, renamePlaylist, deletePlaylist, removeTrackFromPlaylist } = useLibrary();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  const playlist = playlists.find(p => p.id === playlistId);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!playlist) {
    return (
      <div className="p-8 text-center py-20 text-neutral-400">
        <h2 className="text-xl font-bold text-white mb-2">Playlist Not Found</h2>
        <button
          onClick={() => setActiveView({ type: 'library' })}
          className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-full mt-4"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const isCurrentPlaylistPlaying =
    isPlaying && currentTrack && playlist.tracks.some(t => t.id === currentTrack.id);

  const totalDurationSeconds = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return;
    if (isCurrentPlaylistPlaying) {
      togglePlay();
    } else {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.tracks.length === 0) return;
    const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      renamePlaylist(playlist.id, editName.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="p-8 pb-32 space-y-6 select-none max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 bg-gradient-to-t from-black/80 to-neutral-800/60 p-6 rounded-2xl border border-neutral-800">
        <div className="w-44 h-44 rounded-xl overflow-hidden shadow-2xl bg-neutral-900 shrink-0">
          <img
            src={playlist.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs uppercase tracking-widest font-bold text-neutral-400">Playlist</span>

          {isEditing ? (
            <form onSubmit={handleSaveRename} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="bg-neutral-900 border border-neutral-700 text-white text-2xl font-bold px-3 py-1.5 rounded-lg focus:outline-hidden focus:border-[#1db954]"
              />
              <button
                type="submit"
                className="bg-[#1db954] text-black text-xs font-semibold px-3 py-2 rounded-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-lg"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-4xl font-extrabold text-white tracking-tight truncate">
                {playlist.name}
              </h1>
              <button
                onClick={() => {
                  setEditName(playlist.name);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Rename playlist"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-xs text-neutral-300 mt-2">{playlist.description}</p>

          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-3">
            <span className="font-semibold text-white">SoundWave User</span>
            <span>•</span>
            <span>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</span>
            <span>•</span>
            <span>about {Math.round(totalDurationSeconds / 60)} min</span>
          </div>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center gap-4 py-2">
        <button
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className={`w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 ${
            playlist.tracks.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#1ed760]'
          }`}
          title={isCurrentPlaylistPlaying ? 'Pause' : 'Play all'}
        >
          {isCurrentPlaylistPlaying ? (
            <Pause className="w-6 h-6 fill-black" />
          ) : (
            <Play className="w-6 h-6 fill-black ml-1" />
          )}
        </button>

        <button
          onClick={handleShufflePlay}
          disabled={playlist.tracks.length === 0}
          className="p-3 text-neutral-400 hover:text-white hover:scale-110 transition-transform disabled:opacity-40"
          title="Shuffle play"
        >
          <Shuffle className="w-6 h-6" />
        </button>

        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete playlist "${playlist.name}"?`)) {
              deletePlaylist(playlist.id);
              setActiveView({ type: 'library' });
            }
          }}
          className="p-3 text-neutral-400 hover:text-red-400 transition-colors ml-auto"
          title="Delete playlist"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Track List Table Header */}
      <div className="border-b border-neutral-800 pb-2 px-3 flex items-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        <span className="w-6 text-center">#</span>
        <span className="flex-1 ml-13">Title</span>
        <span className="hidden md:block flex-1">Album</span>
        <span className="w-12 text-right flex items-center justify-end">
          <Clock className="w-4 h-4" />
        </span>
        <span className="w-8"></span>
      </div>

      {/* Tracks */}
      {playlist.tracks.length === 0 ? (
        <div className="py-16 text-center text-neutral-400">
          <Music2 className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
          <h3 className="text-lg font-bold text-white mb-1">This playlist is empty</h3>
          <p className="text-xs mb-4">Search for songs and tap "Add to Playlist" to populate your playlist.</p>
          <button
            onClick={() => setActiveView({ type: 'search' })}
            className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-full hover:scale-105 transition-transform"
          >
            Find Songs to Add
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.tracks.map((track, idx) => (
            <TrackRow
              key={`${track.id}-${idx}`}
              track={track}
              index={idx}
              playlistContext={playlist.tracks}
              onAddToPlaylist={onAddToPlaylist}
              onRemoveFromPlaylist={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
