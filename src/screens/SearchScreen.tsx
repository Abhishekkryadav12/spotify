import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track, RadioStation } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { SaavnApi } from '../services/saavnApi';
import { ArchiveMusicApi } from '../services/archiveMusicApi';
import { JamendoApi } from '../services/jamendoApi';
import { RadioApi, convertStationToTrack } from '../services/radioApi';
import { TrackItem } from '../components/TrackItem';

const { width } = Dimensions.get('window');

const GENRES = [
  { name: 'Pop Hits', color: '#E13300', query: 'Top Pop Hits' },
  { name: 'Bollywood', color: '#1E3264', query: 'Bollywood Hits' },
  { name: 'Hip-Hop', color: '#BA5D07', query: 'Hip Hop Classics' },
  { name: 'Rock & Metal', color: '#8D67AB', query: 'Rock Classics' },
  { name: 'Lo-Fi Chill', color: '#431F47', query: 'Lofi Chill beats' },
  { name: 'Electronic', color: '#0D73EC', query: 'EDM Party' },
  { name: 'Romantic', color: '#E91429', query: 'Love Songs Hindi' },
  { name: 'Punjabi', color: '#8C1932', query: 'Top Punjabi Hits' },
  { name: 'Acoustic', color: '#27856A', query: 'Acoustic Guitar' },
  { name: 'Jazz & Soul', color: '#503750', query: 'Jazz Relaxing' },
];

export const SearchScreen: React.FC = () => {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const [query, setQuery] = useState<string>('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'radio'>('all');

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setTracks([]);
      setStations([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [saavnRes, archiveRes, jamendoRes, radioRes] = await Promise.allSettled([
          SaavnApi.searchTracks(trimmed, 25),
          ArchiveMusicApi.searchFullTracks(trimmed, 10),
          JamendoApi.searchTracks(trimmed, 10),
          RadioApi.searchStations(trimmed, 8),
        ]);

        const fullSongs: Track[] = [
          ...(saavnRes.status === 'fulfilled' ? saavnRes.value : []),
          ...(archiveRes.status === 'fulfilled' ? archiveRes.value : []),
          ...(jamendoRes.status === 'fulfilled' ? jamendoRes.value : []),
        ].filter(t => t.playbackMode === 'full' && (t.duration === 0 || t.duration > 30));

        // Deduplicate
        const seen = new Set<string>();
        const uniqueSongs: Track[] = [];
        for (const s of fullSongs) {
          const key = `${s.title.toLowerCase().trim()}_${s.artist.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueSongs.push(s);
          }
        }

        setTracks(uniqueSongs);

        if (radioRes.status === 'fulfilled') {
          setStations(radioRes.value);
        }
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search full songs, artists, moods..."
            placeholderTextColor="#555"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills when query present */}
        {query.trim().length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
                All ({tracks.length + stations.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('songs')}
              style={[styles.filterPill, activeFilter === 'songs' && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, activeFilter === 'songs' && styles.filterPillTextActive]}>
                Full Songs ({tracks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('radio')}
              style={[styles.filterPill, activeFilter === 'radio' && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, activeFilter === 'radio' && styles.filterPillTextActive]}>
                Radio ({stations.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1db954" />
            <Text style={styles.loadingText}>Searching millions of full songs...</Text>
          </View>
        )}

        {/* Browse Genres Grid when query is empty */}
        {query.trim().length === 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.subheading}>Explore Genres & Categories</Text>
            <View style={styles.genreGrid}>
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g.name}
                  activeOpacity={0.8}
                  onPress={() => setQuery(g.query)}
                  style={[styles.genreCard, { backgroundColor: g.color }]}
                >
                  <Text style={styles.genreTitle}>{g.name}</Text>
                  <Ionicons
                    name="musical-notes"
                    size={40}
                    color="rgba(0, 0, 0, 0.25)"
                    style={styles.genreIconBg}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Results List */}
        {!loading && query.trim().length > 0 && (
          <View style={styles.resultsContainer}>
            {activeFilter !== 'radio' && tracks.length > 0 && (
              <View>
                <Text style={styles.subheading}>Songs (100% Full-Length)</Text>
                {tracks.map((track, idx) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    index={idx}
                    playlistContext={tracks}
                  />
                ))}
              </View>
            )}

            {(activeFilter === 'all' || activeFilter === 'radio') && stations.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.subheading}>Matching Radio Stations</Text>
                {stations.map((st) => {
                  const track = convertStationToTrack(st);
                  const isCurrent = currentTrack?.id === track.id;
                  const isCurrentPlaying = isCurrent && isPlaying;

                  return (
                    <TouchableOpacity
                      key={st.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (isCurrent) togglePlay();
                        else playTrack(track, [track]);
                      }}
                      style={styles.radioRow}
                    >
                      <View style={styles.radioIconBox}>
                        <Ionicons name="radio" size={24} color="#ef4444" />
                      </View>
                      <View style={styles.radioInfo}>
                        <Text numberOfLines={1} style={[styles.radioName, isCurrent && { color: '#1db954' }]}>
                          {st.name}
                        </Text>
                        <Text style={styles.radioCountry}>{st.country || 'Global Stream'} • Live</Text>
                      </View>
                      <Ionicons
                        name={isCurrentPlaying ? 'pause-circle' : 'play-circle'}
                        size={28}
                        color={isCurrent ? '#1db954' : '#fff'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!loading && tracks.length === 0 && stations.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#444" />
                <Text style={styles.emptyTitle}>No songs found for "{query}"</Text>
                <Text style={styles.emptySubtitle}>Try searching by artist, title, or mood.</Text>
              </View>
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
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterPill: {
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterPillActive: {
    backgroundColor: '#1db954',
  },
  filterPillText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    color: '#888',
    fontSize: 13,
  },
  genresContainer: {
    paddingHorizontal: 16,
  },
  subheading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    width: (width - 44) / 2,
    height: 94,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  genreTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  genreIconBg: {
    position: 'absolute',
    right: -4,
    bottom: -6,
    transform: [{ rotate: '25deg' }],
  },
  resultsContainer: {
    paddingTop: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  radioIconBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInfo: {
    flex: 1,
  },
  radioName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  radioCountry: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
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
