import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    next,
    setPlayerModalVisible,
  } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = isLiked(currentTrack.id);

  return (
    <View style={styles.wrapper}>
      {/* Mini Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setPlayerModalVisible(true)}
        style={styles.playerContainer}
      >
        <Image
          source={{ uri: currentTrack.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop' }}
          style={styles.artwork}
        />

        <View style={styles.metaContainer}>
          <Text numberOfLines={1} style={styles.title}>
            {currentTrack.title}
          </Text>
          <View style={styles.artistRow}>
            <Text numberOfLines={1} style={styles.artist}>
              {currentTrack.artist}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Full Song</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => toggleLike(currentTrack)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.btn}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#1db954' : '#b3b3b3'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlay}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.btn}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={next}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.btn}
        >
          <Ionicons name="play-skip-forward" size={22} color="#b3b3b3" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#282828',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#383838',
    marginHorizontal: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBarBackground: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1db954',
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#181818',
  },
  metaContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 12,
    maxWidth: '65%',
  },
  badge: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  badgeText: {
    color: '#1db954',
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  btn: {
    padding: 6,
    marginLeft: 4,
  },
});
