import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../utils/format';
import { LyricsView } from './LyricsView';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(width - 80, height * 0.30);

export const PlayerModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    shuffle,
    repeat,
    isPlayerModalVisible,
    setPlayerModalVisible,
    togglePlay,
    next,
    previous,
    seek,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const [showFullLyrics, setShowFullLyrics] = useState<boolean>(false);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);

  return (
    <Modal
      visible={isPlayerModalVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setPlayerModalVisible(false)}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setPlayerModalVisible(false)}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.closeBtn}
          >
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.headerSubtitle}>PLAYING FROM</Text>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {currentTrack.sourceLabel || 'SoundWave Masters'}
            </Text>
          </View>

          {/* Quick Lyrics / Cover Toggle */}
          <TouchableOpacity
            onPress={() => setShowFullLyrics((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.lyricsToggleBtn, showFullLyrics && styles.lyricsToggleBtnActive]}
          >
            <Ionicons
              name={showFullLyrics ? 'musical-notes' : 'mic'}
              size={18}
              color={showFullLyrics ? '#1db954' : '#fff'}
            />
            <Text style={[styles.lyricsToggleText, showFullLyrics && styles.lyricsToggleTextActive]}>
              {showFullLyrics ? 'Cover' : 'Lyrics'}
            </Text>
          </TouchableOpacity>
        </View>

        {showFullLyrics ? (
          /* FULL-SCREEN LYRICS MODE WITH BOTTOM CONTROLS */
          <View style={styles.fullLyricsContainer}>
            {/* Compact Header Details */}
            <View style={styles.compactTrackHeader}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text numberOfLines={1} style={styles.compactTrackTitle}>
                  {currentTrack.title}
                </Text>
                <Text numberOfLines={1} style={styles.compactTrackArtist}>
                  {currentTrack.artist}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleLike(currentTrack)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={liked ? '#1db954' : '#888'}
                />
              </TouchableOpacity>
            </View>

            {/* Live Auto-scrolling Synced Lyrics Body */}
            <View style={styles.fullLyricsBody}>
              <LyricsView
                track={currentTrack}
                currentTime={currentTime}
                duration={duration}
                seek={seek}
                isFullScreen={true}
                onToggleFullScreen={() => setShowFullLyrics(false)}
              />
            </View>

            {/* Bottom Scrubber & Minimal Controls */}
            <View style={styles.compactBottomControls}>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  value={currentTime}
                  minimumValue={0}
                  maximumValue={duration > 0 ? duration : 1}
                  minimumTrackTintColor="#1db954"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#fff"
                  onSlidingComplete={seek}
                />
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
                  <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                </View>
              </View>

              <View style={styles.compactControlsRow}>
                <TouchableOpacity onPress={toggleShuffle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="shuffle" size={22} color={shuffle ? '#1db954' : '#888'} />
                </TouchableOpacity>

                <TouchableOpacity onPress={previous} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="play-skip-back" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={togglePlay}
                  style={styles.compactPlayBtn}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={28}
                      color="#000"
                      style={{ marginLeft: isPlaying ? 0 : 2 }}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={next} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="play-skip-forward" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="repeat" size={22} color={repeat !== 'off' ? '#1db954' : '#888'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* STANDARD ARTWORK + EMBEDDED AUTO-SCROLLING LYRICS CARD */
          <View style={styles.standardViewContainer}>
            {/* Big Artwork */}
            <View style={styles.artworkContainer}>
              <Image
                source={{
                  uri:
                    currentTrack.artwork ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop',
                }}
                style={styles.artwork}
              />
            </View>

            {/* Track Details & Heart */}
            <View style={styles.trackDetailsContainer}>
              <View style={styles.titleArtistBox}>
                <Text numberOfLines={1} style={styles.trackTitle}>
                  {currentTrack.title}
                </Text>
                <Text numberOfLines={1} style={styles.trackArtist}>
                  {currentTrack.artist}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => toggleLike(currentTrack)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.likeBtn}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={28}
                  color={liked ? '#1db954' : '#b3b3b3'}
                />
              </TouchableOpacity>
            </View>

            {/* Scrubber / Slider */}
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                value={currentTime}
                minimumValue={0}
                maximumValue={duration > 0 ? duration : 1}
                minimumTrackTintColor="#1db954"
                maximumTrackTintColor="#555"
                thumbTintColor="#fff"
                onSlidingComplete={seek}
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
                <Text style={styles.timeText}>{formatDuration(duration)}</Text>
              </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={toggleShuffle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name="shuffle"
                  size={24}
                  color={shuffle ? '#1db954' : '#b3b3b3'}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={previous} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="play-skip-back" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={togglePlay}
                style={styles.playPauseBtn}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={34}
                    color="#000"
                    style={{ marginLeft: isPlaying ? 0 : 3 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={next} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="play-skip-forward" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleRepeat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name="repeat"
                  size={24}
                  color={repeat !== 'off' ? '#1db954' : '#b3b3b3'}
                />
              </TouchableOpacity>
            </View>

            {/* Auto-scrolling Lyrics Card Preview */}
            <LyricsView
              track={currentTrack}
              currentTime={currentTime}
              duration={duration}
              seek={seek}
              isFullScreen={false}
              onToggleFullScreen={() => setShowFullLyrics(true)}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  standardViewContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  closeBtn: {
    padding: 6,
  },
  headerTitles: {
    alignItems: 'center',
    maxWidth: '55%',
  },
  headerSubtitle: {
    color: '#a0a0a0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  lyricsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#242424',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  lyricsToggleBtnActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderColor: '#1db954',
  },
  lyricsToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lyricsToggleTextActive: {
    color: '#1db954',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 14,
    backgroundColor: '#202020',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  trackDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  titleArtistBox: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 15,
  },
  likeBtn: {
    padding: 6,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomBadgeContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  fullQualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
    borderColor: 'rgba(29, 185, 84, 0.3)',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  fullQualityText: {
    color: '#1db954',
    fontSize: 11,
    fontWeight: '600',
  },
  // Fullscreen lyrics mode styles
  fullLyricsContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
  },
  compactTrackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  compactTrackTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  compactTrackArtist: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  fullLyricsBody: {
    flex: 1,
  },
  compactBottomControls: {
    backgroundColor: '#161616',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#282828',
    paddingTop: 8,
    paddingBottom: 20,
  },
  compactControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 4,
  },
  compactPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
