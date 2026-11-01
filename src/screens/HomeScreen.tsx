import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track, RadioStation } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { SaavnApi } from '../services/saavnApi';
import { RadioApi, convertStationToTrack } from '../services/radioApi';
import { FULL_LENGTH_TRACKS } from '../services/fullLengthTracks';
import { DEMO_TRACKS } from '../services/demoTracks';
import { MOOD_CONFIGS } from '../services/moods';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 145;

export const HomeScreen: React.FC = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { recentlyPlayed } = useLibrary();

  const [bollywoodHits, setBollywoodHits] = useState<Track[]>([]);
  const [globalHits, setGlobalHits] = useState<Track[]>([]);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('happy');
  const [moodTracks, setMoodTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [bollyRes, popRes, radioRes] = await Promise.allSettled([
          SaavnApi.searchTracks('Top Bollywood Hits', 8),
          SaavnApi.searchTracks('Top Global Pop Hits', 8),
          RadioApi.getTopStations(6),
        ]);

        if (isMounted) {
          if (bollyRes.status === 'fulfilled' && bollyRes.value.length > 0) {
            setBollywoodHits(bollyRes.value);
          } else {
            setBollywoodHits(FULL_LENGTH_TRACKS.slice(0, 6));
          }

          if (popRes.status === 'fulfilled' && popRes.value.length > 0) {
            setGlobalHits(popRes.value);
          } else {
            setGlobalHits(FULL_LENGTH_TRACKS.slice(3, 9));
          }

          if (radioRes.status === 'fulfilled') {
            setRadioStations(radioRes.value);
          }
        }
      } catch (e) {
        console.warn('Home data load error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load mood tracks
  useEffect(() => {
    const active = MOOD_CONFIGS.find(m => m.id === selectedMood) || MOOD_CONFIGS[0];
    SaavnApi.searchTracks(active.queries.all, 6).then(tracks => {
      if (tracks.length > 0) setMoodTracks(tracks);
      else setMoodTracks(FULL_LENGTH_TRACKS.slice(0, 5));
    }).catch(() => {
      setMoodTracks(FULL_LENGTH_TRACKS.slice(0, 5));
    });
  }, [selectedMood]);

  const quickPlayItems = recentlyPlayed.length > 0
    ? [...recentlyPlayed, ...FULL_LENGTH_TRACKS].slice(0, 6)
    : [...FULL_LENGTH_TRACKS, ...DEMO_TRACKS].slice(0, 6);

  const handleTrackPress = (track: Track, contextList: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, contextList);
    }
  };

  const handleStationPress = (station: RadioStation) => {
    const track = convertStationToTrack(station);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, [track]);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Greeting */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.appTitle}>SoundWave • Full Songs Only</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Play 2-column Grid */}
      <View style={styles.quickGrid}>
        {quickPlayItems.map((item) => {
          const isCurrent = currentTrack?.id === item.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => handleTrackPress(item, quickPlayItems)}
              style={styles.quickCard}
            >
              <Image
                source={{ uri: item.artwork }}
                style={styles.quickArtwork}
              />
              <Text numberOfLines={2} style={styles.quickTitle}>
                {item.title}
              </Text>
              {isCurrentPlaying && (
                <Ionicons name="volume-medium" size={16} color="#1db954" style={{ marginRight: 6 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mood Selector Pills */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tune Into Your Vibe</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodsScroll}
      >
        {MOOD_CONFIGS.map((m) => {
          const isSel = m.id === selectedMood;
          return (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.7}
              onPress={() => setSelectedMood(m.id)}
              style={[styles.moodChip, isSel && styles.moodChipActive]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodText, isSel && styles.moodTextActive]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Mood Songs Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {moodTracks.map((track) => (
          <TouchableOpacity
            key={track.id}
            activeOpacity={0.8}
            onPress={() => handleTrackPress(track, moodTracks)}
            style={styles.trackCard}
          >
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: track.artwork }} style={styles.cardArtwork} />
              <View style={styles.fullBadgeOverlay}>
                <Text style={styles.fullBadgeText}>Full Song</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.cardSubtitle}>
              {track.artist}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Top Hits Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Today's Popular Hits</Text>
          <Text style={styles.sectionDesc}>100% full studio recordings from JioSaavn Masters</Text>
        </View>
      </View>

      {loading && bollywoodHits.length === 0 ? (
        <ActivityIndicator size="small" color="#1db954" style={{ marginVertical: 20 }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        >
          {bollywoodHits.map((track) => (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.8}
              onPress={() => handleTrackPress(track, bollywoodHits)}
              style={styles.trackCard}
            >
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: track.artwork }} style={styles.cardArtwork} />
                <View style={styles.fullBadgeOverlay}>
                  <Text style={styles.fullBadgeText}>Full Song</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.cardTitle}>
                {track.title}
              </Text>
              <Text numberOfLines={1} style={styles.cardSubtitle}>
                {track.artist}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Curated Full Length Master Recordings */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Lossless Archive Masters</Text>
          <Text style={styles.sectionDesc}>Uncut full 3–6+ min tracks via Internet Archive</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {FULL_LENGTH_TRACKS.map((track) => (
          <TouchableOpacity
            key={track.id}
            activeOpacity={0.8}
            onPress={() => handleTrackPress(track, FULL_LENGTH_TRACKS)}
            style={styles.trackCard}
          >
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: track.artwork }} style={styles.cardArtwork} />
              <View style={styles.fullBadgeOverlay}>
                <Text style={styles.fullBadgeText}>Full Song</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.cardSubtitle}>
              {track.artist}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Global Radio Stations */}
      {radioStations.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Global Live Broadcasts</Text>
              <Text style={styles.sectionDesc}>Continuous uninterrupted radio streaming</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {radioStations.map((station) => (
              <TouchableOpacity
                key={station.id}
                activeOpacity={0.8}
                onPress={() => handleStationPress(station)}
                style={styles.trackCard}
              >
                <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop' }}
                    style={styles.cardArtwork}
                  />
                  <View style={[styles.fullBadgeOverlay, { backgroundColor: 'rgba(239, 68, 68, 0.85)', borderColor: 'rgba(239, 68, 68, 1)' }]}>
                    <Text style={[styles.fullBadgeText, { color: '#fff' }]}>LIVE</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {station.name}
                </Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                  {station.country || 'Worldwide Broadcast'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Padding at bottom for floating bottom player */}
      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  greetingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appTitle: {
    color: '#1db954',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 20,
  },
  quickCard: {
    width: (width - 32) / 2,
    height: 54,
    backgroundColor: '#242424',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  quickArtwork: {
    width: 54,
    height: 54,
    backgroundColor: '#333',
  },
  quickTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionDesc: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  moodsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  moodChipActive: {
    backgroundColor: '#1db954',
    borderColor: '#1db954',
  },
  moodEmoji: {
    fontSize: 15,
  },
  moodText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  moodTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 8,
  },
  trackCard: {
    width: CARD_WIDTH,
  },
  cardImageContainer: {
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#252525',
  },
  cardArtwork: {
    width: '100%',
    height: '100%',
  },
  fullBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.5)',
  },
  fullBadgeText: {
    color: '#1db954',
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#999',
    fontSize: 11,
  },
});
