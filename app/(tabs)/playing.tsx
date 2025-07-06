import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Radio, Clock, RefreshCw } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/constants/api';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Song {
  id: number;
  title: string;
  artist: string;
  play_count: number;
}

const streamingServices = [
  {
    id: 'deezer',
    name: 'Deezer',
    icon: 'https://cdn-files.dzcdn.net/cache/images/common/favicon/apple-touch-icon.dc494e31ef5f888a087a.png'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png'
  },
  {
    id: 'youtube',
    name: 'YouTube Music',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Youtube_Music_icon.svg/512px-Youtube_Music_icon.svg.png'
  }
];

export default function Top100() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSongs = useCallback(async () => {
    try {
      setLoading(true);
      // Clear existing songs first
      setSongs([]);
      const response = await api.get('/top100');
      setSongs(response.data);
      setError(null);
      
      if (isRefreshing) {
        Toast.show({
          type: 'success',
          text1: 'Updated',
          text2: 'Top 100 list has been refreshed'
        });
      }
    } catch (err) {
      console.error('Error fetching top 100:', err);
      setError('Failed to load top 100 songs');
      if (isRefreshing) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to refresh top 100'
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Clear songs before refreshing
    setSongs([]);
    fetchSongs();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top 100 Songs</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, isRefreshing && styles.refreshing]}
          onPress={handleRefresh}
          disabled={isRefreshing || loading}
        >
          <RefreshCw size={20} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {loading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading top 100...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <Text style={styles.retryText}>
              {isRefreshing ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.songsList}
          showsVerticalScrollIndicator={false}
        >
          {songs.map((song, index) => (
            <View key={song.id} style={styles.songCard}>
              <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.songContent}>
                <View style={styles.songHeader}>
                  <View style={styles.songTitleContainer}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                      {song.artist}
                    </Text>
                  </View>
                  <Text style={styles.playCount}>
                    {song.play_count.toLocaleString()} plays
                  </Text>
                </View>
                
                <View style={styles.songFooter}>
                  <View style={styles.streamingServices}>
                    {streamingServices.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={styles.streamingButton}
                        onPress={() => console.log(`Opening ${service.name}...`)}
                      >
                        <Image 
                          source={{ uri: service.icon }}
                          style={styles.streamingIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshing: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFD700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songsList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  songCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  rankContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.05)',
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  songContent: {
    flex: 1,
    padding: 12,
  },
  songHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  songTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
  },
  playCount: {
    fontSize: 12,
    color: '#1E40AF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  songFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
  },
  streamingServices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streamingButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  streamingIcon: {
    width: 20,
    height: 20,
  },
});