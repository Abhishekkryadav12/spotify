import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Music2, BookOpen, Layers } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { ChordsApi, CHORD_DIAGRAMS, type GuitarSongData, type ChordDiagramData } from '../services/chordsApi';
import { formatDuration } from '../utils/format';

interface GuitarNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom Guitar Icon component
export const GuitarIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11.5 12.5l5.5 -5.5" />
    <path d="M16.5 4.5l3 3" />
    <path d="M19 3l2 2" />
    <path d="M15 7l2 2" />
    <path d="M14 6l-1.5 -1.5" />
    <path d="M7.5 13.5l-3 3a3.536 3.536 0 0 0 5 5l3 -3" />
    <path d="M12.5 18.5a4 4 0 0 0 -4 -4" />
    <circle cx="8" cy="16" r="1" fill="currentColor" />
  </svg>
);

export const GuitarNotesPanel: React.FC<GuitarNotesPanelProps> = ({ isOpen, onClose }) => {
  const { currentTrack, currentTime, isPlaying, seek } = usePlayer();

  const [activeTab, setActiveTab] = useState<'timeline' | 'diagrams' | 'tabs'>('timeline');
  const [transpose, setTranspose] = useState<number>(0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const activeChordRef = useRef<HTMLButtonElement | null>(null);

  // Compute song chords data
  const guitarData: GuitarSongData | null = useMemo(() => {
    if (!currentTrack) return null;
    return ChordsApi.getGuitarData(currentTrack);
  }, [currentTrack]);

  // Find active section and active chord based on currentTime
  const { activeSectionIndex, activeChordGlobalIndex } = useMemo(() => {
    if (!guitarData) return { activeSectionIndex: -1, activeChordGlobalIndex: -1 };

    let secIdx = -1;
    let chordIdx = -1;

    for (let s = 0; s < guitarData.sections.length; s++) {
      const sec = guitarData.sections[s];
      if (currentTime >= sec.startTime && currentTime <= sec.endTime) {
        secIdx = s;
        // Find chord within section
        for (let c = sec.chords.length - 1; c >= 0; c--) {
          if (currentTime >= sec.chords[c].time) {
            chordIdx = s * 100 + c;
            break;
          }
        }
        break;
      }
    }

    return { activeSectionIndex: secIdx, activeChordGlobalIndex: chordIdx };
  }, [guitarData, currentTime]);

  // Auto-scroll to active chord
  useEffect(() => {
    if (autoScroll && activeChordRef.current) {
      activeChordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeChordGlobalIndex, autoScroll]);

  if (!isOpen || !currentTrack || !guitarData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between animate-in fade-in duration-200 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-[#121212]/90">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg shrink-0 bg-neutral-800">
            <img
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <GuitarIcon className="w-3 h-3 text-[#1db954]" />
                Guitar Notes & Chords
              </span>
              {isPlaying && (
                <span className="text-[10px] font-semibold text-emerald-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]" /> Synced Playback
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white truncate mt-1">{currentTrack.title}</h2>
            <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-3">
          {/* Transpose Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 text-xs text-neutral-300">
            <span className="text-[11px] text-neutral-400 mr-1">Transpose:</span>
            <button
              onClick={() => setTranspose((t) => t - 1)}
              className="px-1.5 py-0.5 hover:bg-white/10 rounded text-neutral-300 hover:text-white"
              title="Transpose half-step down"
            >
              -1
            </button>
            <span className="font-mono text-white text-[11px] px-1 font-bold">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button
              onClick={() => setTranspose((t) => t + 1)}
              className="px-1.5 py-0.5 hover:bg-white/10 rounded text-neutral-300 hover:text-white"
              title="Transpose half-step up"
            >
              +1
            </button>
            {transpose !== 0 && (
              <button
                onClick={() => setTranspose(0)}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 ml-1 underline"
              >
                Reset
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Guitar Notes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Track Musical Signature Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#181818] border border-neutral-800 p-4 rounded-xl text-xs">
          <div>
            <span className="text-neutral-400 block text-[11px] mb-0.5">Key Signature</span>
            <span className="font-bold text-white text-sm">{guitarData.key}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px] mb-0.5">Capo Position</span>
            <span className="font-bold text-amber-400 text-sm">{guitarData.capo}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px] mb-0.5">Guitar Tuning</span>
            <span className="font-bold text-neutral-200 text-sm">{guitarData.tuning}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px] mb-0.5">Strumming Pattern</span>
            <span className="font-bold text-[#1db954] text-sm tracking-wide">
              {guitarData.strummingPattern}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'timeline'
                ? 'bg-white text-black'
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Synced Progression</span>
          </button>

          <button
            onClick={() => setActiveTab('diagrams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'diagrams'
                ? 'bg-white text-black'
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chord Diagrams ({guitarData.uniqueChords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tabs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'tabs'
                ? 'bg-white text-black'
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Guitar Tabs & Riffs</span>
          </button>

          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-[#1db954] w-3.5 h-3.5"
              />
              <span>Follow Playback</span>
            </label>
          </div>
        </div>

        {/* Tab 1: Synced Progression Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400">
              💡 Chords highlight in real-time as the song plays. Click any chord or timestamp to seek playback.
            </p>

            <div className="space-y-3">
              {guitarData.sections.map((section, sIdx) => {
                const isSectionActive = activeSectionIndex === sIdx;

                return (
                  <div
                    key={`${section.name}-${sIdx}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isSectionActive
                        ? 'bg-emerald-950/20 border-[#1db954]/40 shadow-lg'
                        : 'bg-[#181818] border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-xs uppercase tracking-wider ${
                            isSectionActive ? 'text-[#1db954]' : 'text-neutral-300'
                          }`}
                        >
                          {section.name}
                        </span>
                        {isSectionActive && (
                          <span className="w-2 h-2 rounded-full bg-[#1db954] animate-ping" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {formatDuration(section.startTime)} - {formatDuration(section.endTime)}
                      </span>
                    </div>

                    {/* Chord Bars */}
                    <div className="flex flex-wrap gap-2.5">
                      {section.chords.map((chordItem, cIdx) => {
                        const globalKey = sIdx * 100 + cIdx;
                        const isCurrentChord = activeChordGlobalIndex === globalKey;

                        return (
                          <button
                            key={`${chordItem.chord}-${cIdx}`}
                            ref={isCurrentChord ? activeChordRef : null}
                            onClick={() => seek(chordItem.time)}
                            className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                              isCurrentChord
                                ? 'bg-[#1db954] text-black border-[#1db954] font-extrabold scale-105 shadow-md shadow-[#1db954]/40 animate-pulse'
                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10 font-bold'
                            }`}
                            title={`Click to jump to ${formatDuration(chordItem.time)}`}
                          >
                            <span className="text-base tracking-wide">{chordItem.chord}</span>
                            <span
                              className={`text-[9px] font-mono mt-0.5 ${
                                isCurrentChord ? 'text-black/80 font-bold' : 'text-neutral-500'
                              }`}
                            >
                              {formatDuration(chordItem.time)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Chord Diagrams */}
        {activeTab === 'diagrams' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">Chords Used in this Song</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Standard 6-string guitar fingering diagrams (Nut at top, E A D G B E strings).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {guitarData.uniqueChords.map((chordName) => {
                const diagram: ChordDiagramData = CHORD_DIAGRAMS[chordName] || {
                  name: chordName,
                  strings: [0, 2, 2, 0, 0, 0],
                };

                return (
                  <div
                    key={chordName}
                    className="bg-[#181818] border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-between"
                  >
                    <span className="font-extrabold text-lg text-white mb-2">{chordName}</span>

                    {/* Fretboard SVG Diagram */}
                    <svg viewBox="0 0 100 120" className="w-24 h-28">
                      {/* Nut */}
                      <line x1="15" y1="20" x2="85" y2="20" stroke="#888" strokeWidth="4" />

                      {/* 4 Frets */}
                      <line x1="15" y1="42" x2="85" y2="42" stroke="#444" strokeWidth="1" />
                      <line x1="15" y1="64" x2="85" y2="64" stroke="#444" strokeWidth="1" />
                      <line x1="15" y1="86" x2="85" y2="86" stroke="#444" strokeWidth="1" />
                      <line x1="15" y1="108" x2="85" y2="108" stroke="#444" strokeWidth="1" />

                      {/* 6 Strings */}
                      {[15, 29, 43, 57, 71, 85].map((x, i) => (
                        <line
                          key={i}
                          x1={x}
                          y1="20"
                          x2={x}
                          y2="108"
                          stroke="#666"
                          strokeWidth={1.5}
                        />
                      ))}

                      {/* Finger Dots / Open (O) / Muted (X) */}
                      {diagram.strings.map((val, strIdx) => {
                        const x = 15 + strIdx * 14;
                        if (val === 'x') {
                          return (
                            <text
                              key={strIdx}
                              x={x}
                              y="12"
                              fill="#ef4444"
                              fontSize="10"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              ✕
                            </text>
                          );
                        }
                        if (val === 0) {
                          return (
                            <circle
                              key={strIdx}
                              cx={x}
                              cy="10"
                              r="3.5"
                              fill="none"
                              stroke="#1db954"
                              strokeWidth="1.5"
                            />
                          );
                        }
                        // Fretted note: 1, 2, 3, 4
                        const fret = typeof val === 'number' ? val : 1;
                        const y = 20 + (fret - 0.5) * 22;
                        return (
                          <circle
                            key={strIdx}
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#1db954"
                            stroke="#000"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>

                    <div className="flex justify-between w-full text-[9px] font-mono text-neutral-400 mt-2 px-1">
                      <span>E</span>
                      <span>A</span>
                      <span>D</span>
                      <span>G</span>
                      <span>B</span>
                      <span>e</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Guitar Tabs */}
        {activeTab === 'tabs' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Signature Riff & Intro Tab</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Play along with the acoustic/lead guitar riff in standard tuning.
              </p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 p-6 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
              {guitarData.tabSnippet?.map((line, idx) => (
                <div key={idx} className="whitespace-pre">
                  {line}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
              <span className="font-bold text-[#1db954] block mb-1">Strumming Technique Tip:</span>
              <span>
                Maintain a relaxed wrist rhythm. Emphasize downbeats on beats 1 and 3, and accent the backbeat on beat 2 and 4.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Player Scrub Sync Notice */}
      <div className="p-4 border-t border-neutral-900 bg-[#121212] text-xs text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse" />
          <span>Playback Position: {formatDuration(currentTime)}</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
        >
          Back to Player
        </button>
      </div>
    </div>
  );
};
