import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../utils/format';

interface TrackItemProps {
  track: Track;
  index?: number;
  playlistContext?: Track[];
  onOpenOptions?: (track: Track) => void;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  index,
  playlistContext,
  onOpenOptions,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const liked = isLiked(track.id);

  const handlePress = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext || [track]);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[styles.container, isCurrent && styles.activeContainer]}
    >
      {typeof index === 'number' && (
        <Text style={[styles.indexText, isCurrent && styles.activeText]}>
          {index + 1}
        </Text>
      )}

      <Image
        source={{ uri: track.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop' }}
        style={styles.artwork}
      />

      <View style={styles.infoContainer}>
        <Text
          numberOfLines={1}
          style={[styles.title, isCurrent && styles.activeText]}
        >
          {track.title}
        </Text>
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.artist}>
            {track.artist}
          </Text>
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>Full Song</Text>
          </View>
        </View>
      </View>

      <Text style={styles.durationText}>
        {formatDuration(track.duration)}
      </Text>

      <TouchableOpacity
        onPress={() => toggleLike(track)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.actionBtn}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={18}
          color={liked ? '#1db954' : '#888'}
        />
      </TouchableOpacity>

      {onOpenOptions && (
        <TouchableOpacity
          onPress={() => onOpenOptions(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.actionBtn}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#888" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeContainer: {
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
  },
  indexText: {
    color: '#888',
    fontSize: 13,
    width: 22,
    textAlign: 'center',
    marginRight: 8,
    fontWeight: '600',
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#282828',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeText: {
    color: '#1db954',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artist: {
    color: '#a0a0a0',
    fontSize: 12,
    maxWidth: '70%',
  },
  fullBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  fullBadgeText: {
    color: '#1db954',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  durationText: {
    color: '#777',
    fontSize: 12,
    marginRight: 10,
  },
  actionBtn: {
    padding: 6,
  },
});
