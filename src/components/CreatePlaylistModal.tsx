import React, { useState } from 'react';
import { X, Music2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import type { ActiveView } from '../types/music';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView: (view: ActiveView) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  setActiveView,
}) => {
  const { createPlaylist } = useLibrary();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPl = createPlaylist(name.trim(), desc.trim() || undefined);
    setName('');
    setDesc('');
    onClose();
    setActiveView({ type: 'playlist', playlistId: newPl.id });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#282828] border border-neutral-700 w-full max-w-md rounded-2xl shadow-2xl p-6 text-white flex flex-col gap-5">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-[#1db954]" />
            <h2 className="text-lg font-bold">Create New Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Playlist Name <span className="text-[#1db954]">*</span>
            </label>
            <input
              type="text"
              placeholder="My Awesome Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-[#1db954]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="Give your playlist a memorable vibe..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-[#1db954] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold text-xs px-6 py-2 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
