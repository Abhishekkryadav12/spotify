import React, { useState } from 'react';
import { X, Plus, Check, Music2 } from 'lucide-react';
import type { Track } from '../types/music';
import { useLibrary } from '../context/LibraryContext';

interface AddToPlaylistModalProps {
  track: Track | null;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ track, onClose }) => {
  const { playlists, addTrackToPlaylist, createPlaylist } = useLibrary();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!track) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
    setAddedIds(prev => new Set(prev).add(playlistId));
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl = createPlaylist(newPlaylistName.trim());
    addTrackToPlaylist(newPl.id, track);
    setAddedIds(prev => new Set(prev).add(newPl.id));
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#282828] border border-neutral-700 w-full max-w-md rounded-xl shadow-2xl p-6 text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <img
              src={track.artwork}
              alt={track.title}
              className="w-10 h-10 rounded object-cover shadow"
            />
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-white truncate max-w-[260px]">{track.title}</h3>
              <p className="text-xs text-neutral-400">Add to Playlist</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create new playlist toggle/input */}
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> New Playlist
          </button>
        ) : (
          <form onSubmit={handleCreateAndAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-[#1db954]"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="bg-[#1db954] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="bg-neutral-800 text-neutral-300 px-3 py-2 rounded-lg text-sm hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Existing Playlists List */}
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
          {playlists.map((pl) => {
            const hasTrack = pl.tracks.some(t => t.id === track.id) || addedIds.has(pl.id);

            return (
              <div
                key={pl.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-sm text-white truncate">{pl.name}</p>
                    <p className="text-xs text-neutral-400">{pl.tracks.length} tracks</p>
                  </div>
                </div>

                {hasTrack ? (
                  <span className="flex items-center gap-1 text-xs text-[#1db954] font-medium px-2 py-1 rounded bg-[#1db954]/10">
                    <Check className="w-3.5 h-3.5" /> Added
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddToPlaylist(pl.id)}
                    className="text-xs bg-white text-black font-semibold px-3 py-1.5 rounded-full hover:scale-105 transition-transform"
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Done Button */}
        <div className="pt-2 border-t border-neutral-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
