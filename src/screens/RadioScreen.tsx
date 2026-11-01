import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RadioStation } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { RadioApi, convertStationToTrack } from '../services/radioApi';

const COUNTRY_TAGS = ['All', 'India', 'USA', 'UK', 'Dance', 'Jazz', 'Classical', 'Rock', 'News'];

export const RadioScreen: React.FC = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadStations() {
      setLoading(true);
      try {
        let res: RadioStation[] = [];
        if (search.trim()) {
          res = await RadioApi.searchStations(search.trim(), 20);
        } else if (selectedTag === 'All') {
          res = await RadioApi.getTopStations(20);
        } else {
          res = await RadioApi.getStationsByCountry(selectedTag, 20);
        }

        if (isMounted) setStations(res);
      } catch (e) {
        console.warn('Radio load error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStations();
    return () => {
      isMounted = false;
    };
  }, [selectedTag, search]);

  const handleStationPress = (st: RadioStation) => {
    const track = convertStationToTrack(st);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, [track]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Global Radio</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE BROADCASTS</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations, cities, or tags..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {COUNTRY_TAGS.map((tag) => {
            const isSel = selectedTag === tag && !search;
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => {
                  setSearch('');
                  setSelectedTag(tag);
                }}
                style={[styles.tagChip, isSel && styles.tagChipActive]}
              >
                <Text style={[styles.tagText, isSel && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stations List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1db954" />
            <Text style={styles.loadingText}>Tuning into live radio frequencies...</Text>
          </View>
        ) : stations.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="radio" size={48} color="#444" />
            <Text style={styles.emptyTitle}>No radio stations found</Text>
            <Text style={styles.emptySubtitle}>Try searching for another country or tag.</Text>
          </View>
        ) : (
          stations.map((st) => {
            const track = convertStationToTrack(st);
            const isCurrent = currentTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <TouchableOpacity
                key={st.id}
                activeOpacity={0.7}
                onPress={() => handleStationPress(st)}
                style={[styles.stationRow, isCurrent && styles.stationRowActive]}
              >
                <View style={styles.faviconContainer}>
                  {st.favicon ? (
                    <Image source={{ uri: st.favicon }} style={styles.favicon} />
                  ) : (
                    <Ionicons name="radio" size={24} color="#e11d48" />
                  )}
                </View>

                <View style={styles.stationInfo}>
                  <Text numberOfLines={1} style={[styles.stationName, isCurrent && styles.activeText]}>
                    {st.name}
                  </Text>
                  <Text style={styles.stationCountry}>
                    {st.country || 'Global'} {st.codec ? `• ${st.codec}` : ''} {st.bitrate ? `• ${st.bitrate}kbps` : ''}
                  </Text>
                </View>

                <View style={styles.playBtn}>
                  <Ionicons
                    name={isCurrentPlaying ? 'pause-circle' : 'play-circle'}
                    size={32}
                    color={isCurrent ? '#1db954' : '#fff'}
                  />
                </View>
              </TouchableOpacity>
            );
          })
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
  headerTitleRow: {
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444',
    fontSize: 9.5,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  tagsContainer: {
    gap: 8,
    paddingBottom: 6,
  },
  tagChip: {
    backgroundColor: '#202020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  tagText: {
    color: '#bbb',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 8,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 13,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  stationRowActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
  },
  faviconContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  favicon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  activeText: {
    color: '#1db954',
  },
  stationCountry: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  playBtn: {
    padding: 4,
  },
});
