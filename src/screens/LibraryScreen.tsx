import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track, Playlist } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { TrackItem } from '../components/TrackItem';

type Tab = 'playlists' | 'liked' | 'history';

export const LibraryScreen: React.FC = () => {
  const { likedTracks, playlists, recentlyPlayed, createPlaylist, deletePlaylist } = useLibrary();
  const { playTrack, showToast } = usePlayer();

  const [activeTab, setActiveTab] = useState<Tab>('playlists');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
    showToast('✨ Created new playlist');
  };

  const handlePlayAllLiked = () => {
    if (likedTracks.length > 0) {
      playTrack(likedTracks[0], likedTracks);
    }
  };

  const handlePlayAllPlaylist = (pl: Playlist) => {
    if (pl.tracks.length > 0) {
      playTrack(pl.tracks[0], pl.tracks);
    } else {
      showToast('⚠️ Playlist is empty. Add songs from search!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Your Library</Text>
          {activeTab === 'playlists' && (
            <TouchableOpacity onPress={() => setIsCreating(true)} style={styles.addBtn}>
              <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab pills */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('playlists');
              setSelectedPlaylist(null);
            }}
            style={[styles.tabPill, activeTab === 'playlists' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'playlists' && styles.tabTextActive]}>
              Playlists ({playlists.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('liked');
              setSelectedPlaylist(null);
            }}
            style={[styles.tabPill, activeTab === 'liked' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'liked' && styles.tabTextActive]}>
              Liked Songs ({likedTracks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('history');
              setSelectedPlaylist(null);
            }}
            style={[styles.tabPill, activeTab === 'history' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Recent ({recentlyPlayed.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Playlist Input Box */}
      {isCreating && (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            placeholder="Playlist name..."
            placeholderTextColor="#888"
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            autoFocus
          />
          <View style={styles.createActions}>
            <TouchableOpacity onPress={() => setIsCreating(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Playlist Detail View */}
        {selectedPlaylist ? (
          <View>
            <TouchableOpacity
              onPress={() => setSelectedPlaylist(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.backButtonText}>Back to Playlists</Text>
            </TouchableOpacity>

            <View style={styles.playlistHero}>
              <Image source={{ uri: selectedPlaylist.artwork }} style={styles.playlistHeroImg} />
              <View style={styles.playlistHeroInfo}>
                <Text style={styles.playlistHeroTitle}>{selectedPlaylist.name}</Text>
                <Text style={styles.playlistHeroCount}>
                  {selectedPlaylist.tracks.length} songs • 100% Full-Length
                </Text>
              </View>
            </View>

            {selectedPlaylist.tracks.length > 0 && (
              <TouchableOpacity
                onPress={() => handlePlayAllPlaylist(selectedPlaylist)}
                style={styles.playAllButton}
              >
                <Ionicons name="play" size={18} color="#000" />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
            )}

            {selectedPlaylist.tracks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes" size={44} color="#444" />
                <Text style={styles.emptyTitle}>This playlist is empty</Text>
                <Text style={styles.emptySubtitle}>Search full songs and add them here!</Text>
              </View>
            ) : (
              selectedPlaylist.tracks.map((track, idx) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={selectedPlaylist.tracks}
                />
              ))
            )}
          </View>
        ) : activeTab === 'playlists' ? (
          /* Playlists List */
          <View>
            {playlists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                activeOpacity={0.7}
                onPress={() => setSelectedPlaylist(pl)}
                style={styles.playlistRow}
              >
                <Image source={{ uri: pl.artwork }} style={styles.playlistThumb} />
                <View style={styles.playlistMeta}>
                  <Text numberOfLines={1} style={styles.playlistName}>{pl.name}</Text>
                  <Text style={styles.playlistSub}>Playlist • {pl.tracks.length} tracks</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        ) : activeTab === 'liked' ? (
          /* Liked Songs */
          <View>
            {likedTracks.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePlayAllLiked}
                style={styles.playAllButton}
              >
                <Ionicons name="play" size={18} color="#000" />
                <Text style={styles.playAllText}>Play All Liked Songs ({likedTracks.length})</Text>
              </TouchableOpacity>
            )}

            {likedTracks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={48} color="#444" />
                <Text style={styles.emptyTitle}>No liked songs yet</Text>
                <Text style={styles.emptySubtitle}>Tap the heart icon on any song to save it here.</Text>
              </View>
            ) : (
              likedTracks.map((track, idx) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={likedTracks}
                />
              ))
            )}
          </View>
        ) : (
          /* History */
          <View>
            {recentlyPlayed.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color="#444" />
                <Text style={styles.emptyTitle}>No listening history</Text>
                <Text style={styles.emptySubtitle}>Songs you play will show up here.</Text>
              </View>
            ) : (
              recentlyPlayed.map((track, idx) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={recentlyPlayed}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    padding: 6,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  tabPillActive: {
    backgroundColor: '#1db954',
  },
  tabText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  createBox: {
    backgroundColor: '#222',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  createInput: {
    backgroundColor: '#181818',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 8,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    padding: 6,
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#1db954',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingTop: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  playlistThumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#242424',
  },
  playlistMeta: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  playlistSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1db954',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playAllText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#1db954',
    fontSize: 13,
    fontWeight: '600',
  },
  playlistHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playlistHeroImg: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#242424',
  },
  playlistHeroInfo: {
    marginLeft: 14,
    flex: 1,
  },
  playlistHeroTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  playlistHeroCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 13,
  },
});
