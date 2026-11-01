import React from 'react';
import { X, ExternalLink, ShieldCheck, Radio, Key, CheckCircle, Disc, Flame } from 'lucide-react';

interface MusicSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicSourcesModal: React.FC<MusicSourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-neutral-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl p-6 text-white flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#1db954]" />
            <h2 className="text-xl font-bold text-white tracking-tight">Audio Providers & Full-Song Architecture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 pr-1 text-sm text-neutral-300">
          <p className="text-xs text-neutral-400">
            SoundWave streams 100% genuine full-length songs and continuous live radio broadcasts. 30-second preview limitations have been completely removed.
          </p>

          {/* Provider 0: JioSaavn (Full Songs) */}
          <div className="p-4 rounded-xl bg-white/5 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>1. JioSaavn Studio Masters (Full-Length Songs)</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Full Songs • 320kbps / AAC
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Streams full master recordings directly from JioSaavn CDN with complete byte-range seeking, genuine song durations (3–6+ mins), and zero 30s limits. Integrated via the included backend streaming service.
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
              <span>• Auth: None Required</span>
              <span>• Bitrate: 320kbps MP3 / High Quality AAC</span>
              <span>• Catalog: Millions of Bollywood, Pop & Regional Tracks</span>
            </div>
          </div>

          {/* Provider 1: Internet Archive (Full Songs) */}
          <div className="p-4 rounded-xl bg-white/5 border border-[#1db954]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle className="w-4 h-4 text-[#1db954]" />
                <span>2. Internet Archive & Netlabels (Full-Length Songs)</span>
              </div>
              <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Full Songs • No 30s Limit
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Streams full 3–6+ minute master recordings (e.g. ProleteR, Aydio, Netlabel releases) under Creative Commons licenses. Native MP3 streams with HTTP byte-range seeking and CORS.
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
              <span>• Auth: None Required</span>
              <span>• Playback: Complete Full Song</span>
              <a
                href="https://archive.org/details/netlabels"
                target="_blank"
                rel="noreferrer"
                className="text-[#1db954] hover:underline flex items-center gap-1 ml-auto"
              >
                Catalog <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Provider 2: Jamendo API (Full Songs with Client ID) */}
          <div className="p-4 rounded-xl bg-white/5 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Disc className="w-4 h-4 text-purple-400" />
                <span>2. Jamendo Music API (Full-Length Songs)</span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                Client ID Configurable
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Jamendo offers over 600,000 full-length tracks under Creative Commons. To enable live Jamendo search, obtain a free Client ID from <a href="https://devportal.jamendo.com/" target="_blank" rel="noreferrer" className="text-[#1db954] underline">devportal.jamendo.com</a> and add it to your <code className="text-neutral-200">.env</code>:
            </p>
            <div className="text-[11px] bg-black/50 p-2 rounded font-mono text-neutral-300">
              VITE_JAMENDO_CLIENT_ID=your_client_id_here
            </div>
          </div>

          {/* Provider 3: Zero 30s Snippets Policy */}
          <div className="p-4 rounded-xl bg-white/5 border border-[#1db954]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle className="w-4 h-4 text-[#1db954]" />
                <span>3. 100% Full-Length Songs Only (Zero 30s Snippets)</span>
              </div>
              <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Full Songs Only
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              SoundWave has completely eliminated 30-second preview snippets. All tracks stream uncut studio master recordings with full byte-range seeking, genuine song durations, and zero cutoffs.
            </p>
          </div>

          {/* Provider 4: Radio Browser (Live Continuous Streams) */}
          <div className="p-4 rounded-xl bg-white/5 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Radio className="w-4 h-4 text-red-400" />
                <span>4. Radio Browser API (Continuous Live Streaming)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                Continuous Stream
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Over 30,000 community-curated internet radio stations streaming continuous MP3/AAC live audio without any length limits.
            </p>
          </div>

          {/* Provider 5: Spotify Developer Integration (Optional) */}
          <div className="p-4 rounded-xl bg-white/5 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>5. Optional Spotify Web API & Web Playback SDK</span>
              </div>
              <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full font-semibold">
                Optional (Requires Premium)
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Spotify requires an active Spotify Premium account and approved Developer app quotas to stream full songs through its Web Playback SDK.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1db954] text-black font-semibold text-xs px-5 py-2 rounded-full hover:scale-105 transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
