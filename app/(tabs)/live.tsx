import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Platform, Animated, Easing } from 'react-native';
import { LogOut, Radio, Clock, Volume2, Play, Music, Headphones, Calendar, ChevronDown, RefreshCw, Dot } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useUser } from '@/context/user';
import { api } from '@/constants/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

interface Station {
  id: number;
  stream_id: string;
  stream_name: string;
  stream_city: string;
  stream_country: string;
  stream_type: string;
  stream_url: string | null;
  created_at: string;
}

interface Song {
  id: number;
  acrid: string;
  album: string;
  artist: string;
  duration_ms: number;
  genre: string;
  isrc: string;
  label: string;
  play_offset_ms: number;
  release_date: string;
  stream_city: string;
  stream_country: string;
  stream_id: string;
  stream_name: string;
  stream_type: string;
  stream_url: string | null;
  timestamp_utc: string;
  title: string;
  upc: string;
  played_at: string;
  duration: string;
  artwork_url: string;
  logo: string;
}

interface StreamingService {
  id: string;
  name: string;
  icon: string;
}

const streamingServices: StreamingService[] = [
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

const getTimeDifference = (timestamp: string) => {
  const now = new Date();
  const played = new Date(timestamp);
  
  // Convert to Kampala timezone (UTC+3)
  const kampalaOffset = 3 * 60; // 3 hours in minutes
  const userOffset = now.getTimezoneOffset(); // Get user's timezone offset
  const offsetDiff = kampalaOffset + userOffset; // Calculate difference
  
  // Adjust times to Kampala timezone
  const kampalaTime = new Date(now.getTime() + offsetDiff * 60000);
  const kampalaPlayed = new Date(played.getTime() + offsetDiff * 60000);
  
  const diff = Math.floor((kampalaTime.getTime() - kampalaPlayed.getTime()) / 60000); // Convert to minutes
  
  // Show live indicator for songs played within the last minute
  if (diff <= 1) {
    return null; // Return null to show live indicator
  }
  
  // Show time for older songs
  if (diff < 60) {
    return `${diff} minutes ago`;
  }
  
  const hours = Math.floor(diff / 60);
  if (hours === 1) {
    return '1 hour ago';
  }
  return `${hours} hours ago`;
};

const formatKampalaTime = (timestamp: string) => {
  const date = new Date(timestamp);
  
  // Convert to Kampala timezone (UTC+3)
  const kampalaOffset = 3 * 60; // 3 hours in minutes
  const userOffset = date.getTimezoneOffset(); // Get user's timezone offset
  const offsetDiff = kampalaOffset + userOffset; // Calculate difference
  
  // Adjust time to Kampala timezone
  const kampalaTime = new Date(date.getTime() + offsetDiff * 60000);
  
  return kampalaTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Kampala'
  });
};

export default function Live() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStationPicker, setShowStationPicker] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const refreshInterval = useRef<NodeJS.Timeout>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get the current station's logo from the first song
  const currentStationLogo = songs.length > 0 ? songs[0].logo : null;

  const startRotationAnimation = () => {
    rotationAnim.setValue(0);
    Animated.timing(rotationAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const fetchStations = async () => {
    try {
      setLoading(true);
      // Clear any previously loaded songs when fetching stations
      setSongs([]);
      const response = await api.get('/locations');
      console.log('Stations API Response:', response.data);
      setStations(response.data);
      if (!selectedStation && response.data.length > 0) {
        setSelectedStation(response.data[0]);
        fetchSongs(response.data[0].id);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Failed to load stations');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load stations'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = useCallback(async (stationId: number) => {
    if (!stationId) return;
    
    try {
      setLoadingSongs(true);
      // Clear any existing songs first
      setSongs([]);
      // Clear existing songs before fetching new ones
      setSongs([]);
      startRotationAnimation();
      
      const response = await api.get(`/playToday/${stationId}`);
      console.log('Songs API Response:', response.data);
      setSongs(response.data);
      setLastUpdate(new Date());
      setError(null);
      
      if (isRefreshing) {
        Toast.show({
          type: 'success',
          text1: 'Updated',
          text2: 'Song list has been refreshed'
        });
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
      if (isRefreshing) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to refresh songs'
        });
      }
      setSongs([]);
    } finally {
      setLoadingSongs(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    // Clear songs on component mount
    setSongs([]);
    fetchStations();
  }, []);

    if (selectedStation?.id) {
      // Clear songs when station changes
      setSongs([]);
      fetchSongs(selectedStation.id);
    }
  }, [selectedStation, fetchSongs]);

  const handleStationChange = (station: Station) => {
    setSelectedStation(station);
    setShowStationPicker(false);
    setIsRefreshing(true);
    // Clear songs when changing stations
    setSongs([]);
    setLastUpdate(new Date());
    fetchSongs(station.id);
  };

  const handleManualRefresh = () => {
    if (selectedStation?.id && !loadingSongs) {
      setIsRefreshing(true);
      // Clear songs before refreshing
      setSongs([]);
      fetchSongs(selectedStation.id);
    }
  };

  const getNextUpdateTime = () => {
    if (!lastUpdate) return 'Soon';
    const nextUpdate = new Date(lastUpdate.getTime() + AUTO_REFRESH_INTERVAL);
    const now = new Date();
    const diff = Math.ceil((nextUpdate.getTime() - now.getTime()) / 1000);
    return `${diff}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {currentStationLogo ? (
            <Image
              source={{ uri: currentStationLogo }}
              style={styles.avatar}
              defaultSource={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop' }}
            />
          ) : (
            <Image
              source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop' }}
              style={styles.avatar}
            />
          )}
          <View style={styles.userTextContainer}>
            <Text style={styles.welcomeText}>Live Radio</Text>
            <Text style={styles.userName}>{selectedStation?.stream_name || 'Select a Station'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={signOut}
          >
            <LogOut color="#FFD700" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <View style={styles.headerRow}>
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={styles.stationPicker}
                onPress={() => setShowStationPicker(!showStationPicker)}
              >
                <Radio size={16} color="#1E40AF" />
                <Text style={styles.stationText} numberOfLines={1}>
                  {selectedStation?.stream_name || 'Select Station'}
                </Text>
                <ChevronDown size={16} color="#1E40AF" />
              </TouchableOpacity>

              {lastUpdate && (
                <View style={styles.timerContainer}>
                  <Text style={styles.updateText}>{getNextUpdateTime()}s</Text>
                  <TouchableOpacity 
                    style={[styles.refreshButton, loadingSongs && styles.refreshing]}
                    onPress={handleManualRefresh}
                    disabled={loadingSongs}
                  >
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <RefreshCw size={14} color="#1E40AF" />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {showStationPicker && (
            <View style={styles.stationDropdown}>
              <ScrollView style={styles.stationList} nestedScrollEnabled>
                {stations.map((station) => (
                  <TouchableOpacity
                    key={station.id}
                    style={[
                      styles.stationOption,
                      selectedStation?.id === station.id && styles.selectedOption
                    ]}
                    onPress={() => handleStationChange(station)}
                  >
                    <Radio size={16} color={selectedStation?.id === station.id ? '#FFD700' : '#1E40AF'} />
                    <Text style={[
                      styles.stationOptionText,
                      selectedStation?.id === station.id && styles.selectedOptionText
                    ]}>
                      {station.stream_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {loadingSongs && songs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading songs...</Text>
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Music size={48} color="#1E40AF" opacity={0.5} />
            <Text style={styles.emptyText}>No songs played recently</Text>
          </View>
        ) : (
          <ScrollView style={styles.songsList} showsVerticalScrollIndicator={false}>
            {songs.map((song) => (
              <View key={song.id} style={styles.songCard}>
                <Image 
                  source={{ uri: song.logo }} 
                  style={styles.songImage} 
                  defaultSource={{ uri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&fit=crop' }}
                />
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
                    <Text style={styles.songDuration}>
                      {formatKampalaTime(song.timestamp_utc)}
                    </Text>
                  </View>
                  
                  <View style={styles.songFooter}>
                    <View style={styles.timeInfo}>
                      {getTimeDifference(song.timestamp_utc) ? (
                        <>
                          <Clock size={12} color="#666" />
                          <Text style={styles.timeText}>
                            {getTimeDifference(song.timestamp_utc)}
                          </Text>
                        </>
                      ) : (
                        <View style={styles.liveContainer}>
                          <Dot size={12} color="#22C55E" style={styles.liveIcon} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      )}
                    </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  header: {
    backgroundColor: '#1E40AF',
    paddingTop: Platform.OS === 'ios' ? 65 : 40,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: '#FFD700',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
  },
  contentHeader: {
    marginBottom: 20,
    zIndex: 1000,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  stationText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  updateText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  refreshButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E40AF',
  },
  refreshing: {
    opacity: 0.7,
  },
  stationDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
    width: 200,
  },
  stationList: {
    flex: 1,
  },
  stationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#FFD700',
  },
  stationOptionText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#1E40AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  songsList: {
    flex: 1,
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
  songImage: {
    width: 80,
    height: 80,
  },
  songContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
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
  songDuration: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  songFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
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
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveIcon: {
    // Add animation here if needed
  },
  liveText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: 'bold',
  },
});