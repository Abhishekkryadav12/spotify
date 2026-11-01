import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '../types/music';
import { LyricsApi, LyricsData, LyricLine } from '../services/lyricsApi';

interface LyricsViewProps {
  track: Track;
  currentTime: number;
  duration: number;
  seek: (seconds: number) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

const { width } = Dimensions.get('window');

export const LyricsView: React.FC<LyricsViewProps> = ({
  track,
  currentTime,
  duration,
  seek,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList<LyricLine>>(null);

  // Fetch lyrics whenever track ID changes
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setLyricsData(null);

    LyricsApi.getLyrics(track)
      .then((data) => {
        if (!isCancelled) {
          if (data && data.lines && data.lines.length > 0) {
            setLyricsData(data);
          } else {
            setError('Lyrics not available for this track');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Lyrics fetch error:', err);
          setError('Could not load lyrics');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [track.id, track.title, track.artist]);

  // Compute currently active lyric line index
  const activeIndex = useMemo(() => {
    if (!lyricsData || !lyricsData.lines || lyricsData.lines.length === 0) {
      return -1;
    }

    if (lyricsData.isSynced) {
      // Find highest index where line.time <= currentTime
      let bestIdx = -1;
      for (let i = 0; i < lyricsData.lines.length; i++) {
        if (lyricsData.lines[i].time <= currentTime + 0.25) {
          bestIdx = i;
        } else {
          break;
        }
      }
      return bestIdx;
    } else {
      // Unsynced/plain lyrics: calculate proportional index based on track progress
      if (!duration || duration <= 0) return 0;
      const progress = Math.min(Math.max(currentTime / duration, 0), 1);
      return Math.min(
        Math.floor(progress * lyricsData.lines.length),
        lyricsData.lines.length - 1
      );
    }
  }, [lyricsData, currentTime, duration]);

  // Auto-scroll effect whenever activeIndex changes
  useEffect(() => {
    if (isUserScrolling || activeIndex < 0 || !flatListRef.current) return;

    try {
      flatListRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
        viewPosition: isFullScreen ? 0.35 : 0.25,
      });
    } catch {
      // Fallback handled by onScrollToIndexFailed
    }
  }, [activeIndex, isUserScrolling, isFullScreen]);

  // Handle user manual scroll interaction to temporarily pause auto-scroll
  const handleScrollBeginDrag = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // Resume auto-scroll after 3 seconds of inactivity
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  };

  const handleLinePress = (line: LyricLine) => {
    if (line.time >= 0) {
      seek(line.time);
      setIsUserScrolling(false);
    }
  };

  const resumeAutoScroll = () => {
    setIsUserScrolling(false);
    if (activeIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
        viewPosition: 0.35,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, isFullScreen && styles.fullScreenContainer]}>
        <ActivityIndicator size="small" color="#1db954" />
        <Text style={styles.loadingText}>Loading lyrics & timing...</Text>
      </View>
    );
  }

  if (error || !lyricsData) {
    return (
      <View style={[styles.centerContainer, isFullScreen && styles.fullScreenContainer]}>
        <Ionicons name="mic-off-outline" size={32} color="#666" />
        <Text style={styles.emptyText}>{error || 'Lyrics not available'}</Text>
        <Text style={styles.emptySubtext}>We couldn't find verified lyrics for this track.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullScreen ? styles.fullScreenContainer : styles.cardContainer]}>
      {/* Header bar for lyrics view */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Ionicons
            name={lyricsData.isSynced ? 'flash' : 'musical-notes'}
            size={14}
            color="#1db954"
          />
          <Text style={styles.badgeText}>
            {lyricsData.isSynced ? 'LIVE SYNCED LYRICS' : 'LYRICS • AUTO SCROLL'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {isUserScrolling && (
            <TouchableOpacity onPress={resumeAutoScroll} style={styles.syncBtn}>
              <Ionicons name="locate" size={14} color="#fff" />
              <Text style={styles.syncBtnText}>Sync</Text>
            </TouchableOpacity>
          )}

          {onToggleFullScreen && (
            <TouchableOpacity
              onPress={onToggleFullScreen}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.expandBtn}
            >
              <Ionicons
                name={isFullScreen ? 'contract' : 'expand'}
                size={18}
                color="#b3b3b3"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Auto-scrolling lyrics list */}
      <FlatList
        ref={flatListRef}
        data={lyricsData.lines}
        keyExtractor={(_, index) => `line_${index}`}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScrollEndDrag}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        contentContainerStyle={[
          styles.listContent,
          isFullScreen ? styles.fullListContent : styles.cardListContent,
        ]}
        renderItem={({ item, index }) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <TouchableOpacity
              activeOpacity={item.time >= 0 ? 0.7 : 1}
              onPress={() => handleLinePress(item)}
              style={[
                styles.lineBox,
                isActive && styles.activeLineBox,
              ]}
            >
              <Text
                style={[
                  styles.lineText,
                  isFullScreen ? styles.fullScreenLineText : styles.cardLineText,
                  isActive && styles.activeLineText,
                  isPast && styles.pastLineText,
                ]}
              >
                {item.text}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    height: 160,
    backgroundColor: '#1e1e1e',
    borderColor: '#282828',
    borderWidth: 1,
    paddingTop: 10,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 12,
    height: 140,
    backgroundColor: '#1e1e1e',
  },
  loadingText: {
    color: '#b3b3b3',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  emptyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#1db954',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1db954',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  expandBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  cardListContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  fullListContent: {
    paddingTop: 12,
    paddingBottom: 80,
  },
  lineBox: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeLineBox: {
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
  },
  lineText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '600',
    lineHeight: 28,
  },
  cardLineText: {
    fontSize: 15,
    lineHeight: 22,
  },
  fullScreenLineText: {
    fontSize: 22,
    lineHeight: 34,
  },
  activeLineText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 36,
  },
  pastLineText: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
});
