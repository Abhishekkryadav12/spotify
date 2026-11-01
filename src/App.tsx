import React, { useState, useCallback } from 'react';
import type { ActiveView, Track } from './types/music';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { LibraryProvider } from './context/LibraryContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomPlayer } from './components/BottomPlayer';
import { QueueDrawer } from './components/QueueDrawer';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { MusicSourcesModal } from './components/MusicSourcesModal';
import { LyricsPanel } from './components/LyricsPanel';
import { GuitarNotesPanel } from './components/GuitarNotesPanel';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { ProfileModal } from './components/auth/ProfileModal';

// Views
import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { PlaylistView } from './views/PlaylistView';
import { RadioView } from './views/RadioView';

export const AppContent: React.FC = () => {
  const [activeView, setActiveViewState] = useState<ActiveView>({ type: 'home' });
  const [viewHistory, setViewHistory] = useState<ActiveView[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isGuitarNotesOpen, setIsGuitarNotesOpen] = useState<boolean>(false);

  const setActiveView = useCallback((newView: ActiveView) => {
    setViewHistory(prev => [...prev, activeView]);
    setActiveViewState(newView);
  }, [activeView]);

  const handleGoBack = useCallback(() => {
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory(h => h.slice(0, h.length - 1));
      setActiveViewState(prev);
    }
  }, [viewHistory]);

  const renderCurrentView = () => {
    switch (activeView.type) {
      case 'home':
        return (
          <HomeView
            setActiveView={setActiveView}
            onAddToPlaylist={(track) => setSelectedTrackForPlaylist(track)}
          />
        );
      case 'search':
        return (
          <SearchView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddToPlaylist={(track) => setSelectedTrackForPlaylist(track)}
          />
        );
      case 'library':
        return (
          <LibraryView
            initialTab={activeView.tab || 'playlists'}
            setActiveView={setActiveView}
            onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
            onAddToPlaylist={(track) => setSelectedTrackForPlaylist(track)}
          />
        );
      case 'playlist':
        return (
          <PlaylistView
            playlistId={activeView.playlistId}
            setActiveView={setActiveView}
            onAddToPlaylist={(track) => setSelectedTrackForPlaylist(track)}
          />
        );
      case 'radio':
        return <RadioView />;
      default:
        return (
          <HomeView
            setActiveView={setActiveView}
            onAddToPlaylist={(track) => setSelectedTrackForPlaylist(track)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212]">
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenInfoModal={() => setIsInfoModalOpen(true)}
          canGoBack={viewHistory.length > 0}
          onGoBack={handleGoBack}
        />

        {/* Scrollable View Container with gradient top glow */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#1db954]/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Persistent Bottom Audio Player */}
      <BottomPlayer
        onToggleQueue={() => setIsQueueOpen(prev => !prev)}
        isQueueOpen={isQueueOpen}
        onToggleLyrics={() => setIsLyricsOpen(prev => !prev)}
        isLyricsOpen={isLyricsOpen}
        onToggleGuitarNotes={() => setIsGuitarNotesOpen(prev => !prev)}
        isGuitarNotesOpen={isGuitarNotesOpen}
      />

      {/* Full-Screen Synced Lyrics Panel */}
      <LyricsPanel
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
      />

      {/* Interactive Guitar Notes & Chords Panel */}
      <GuitarNotesPanel
        isOpen={isGuitarNotesOpen}
        onClose={() => setIsGuitarNotesOpen(false)}
      />

      {/* Right Drawer: Queue */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        setActiveView={setActiveView}
      />

      {/* Music Sources & API Docs Modal */}
      <MusicSourcesModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Music Preferences Onboarding Modal */}
      <OnboardingModal />

      {/* User Profile & Preferences Modal */}
      <ProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </LibraryProvider>
    </AuthProvider>
  );
}
