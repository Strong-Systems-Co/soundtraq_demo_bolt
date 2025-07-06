import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { PhoneIncoming as HomeIcon, FileText, Settings, Music, LogOut, Library } from 'lucide-react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/constants/api';
import { saveData, loadData, STORAGE_KEYS } from '@/utils/storage';
import { useUser } from '@/context/user';
import { useAuth } from '@/context/auth';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const UPDATE_INTERVAL = 30000;

interface PlayingToday {
  id: number;
  title: string;
  artist: string;
  stream_name: string;
  image: string;
}

interface StreamingService {
  id: string;
  name: string;
  icon: any;
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

const fallbackData: PlayingToday[] = [
  {
    id: 1,
    title: 'What Did You Do?',
    artist: 'Fille & Nutty Neithan',
    stream_name: 'X-FM Radio',
    image: 'https://images.unsplash.com/photo-1505672984986-b7c468c7a134?w=400&fit=crop',
  },
  {
    id: 2,
    title: 'Blessings',
    artist: 'Nutty Neithan',
    stream_name: 'Bukedde TV',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&fit=crop',
  },
];

export default function Home() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [playingToday, setPlayingToday] = useState<PlayingToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const updateInterval = useRef<NodeJS.Timeout>();

  const loadCachedData = useCallback(async () => {
    // Clear cached data on every reload
    await AsyncStorage.removeItem(STORAGE_KEYS.PLAYING_TODAY);
    return false;
  }, []);

  const fetchPlayingToday = useCallback(async () => {
    try {
      const response = await api.get('/playingToday');
      const newData = response.data;
      setPlayingToday(newData);
      setError(null);
      const now = new Date();
      setLastUpdate(now);
      
      await saveData(STORAGE_KEYS.PLAYING_TODAY, newData);
      
    } catch (err) {
      console.error('Error fetching playing today:', err);
      setError('Failed to load playing today data');
      
      if (playingToday.length === 0) {
        const hasCachedData = await loadCachedData();
        if (!hasCachedData) {
          setPlayingToday(fallbackData);
          setLastUpdate(new Date());
          await saveData(STORAGE_KEYS.PLAYING_TODAY, fallbackData);
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [playingToday.length, loadCachedData]);

  useEffect(() => {
    const initializeData = async () => {
      // Clear any cached data first
      await loadCachedData();
      // Always fetch fresh data
      fetchPlayingToday();
    };

    initializeData();

    updateInterval.current = setInterval(fetchPlayingToday, UPDATE_INTERVAL);

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [fetchPlayingToday, loadCachedData]);

  const handleScroll = (event: any) => {
    const slideWidth = width - 48;
    const offset = event.nativeEvent.contentOffset.x;
    const activeIndex = Math.round(offset / slideWidth);
    setActiveSlide(activeIndex);
  };

  const handleStreamingPress = (service: StreamingService) => {
    console.log(`Opening ${service.name}...`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPlayingToday();
  };

  const handleSongsPress = () => {
    router.push('/songs');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop' }}
            style={styles.avatar}
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user?.artist_stage_name || user?.name || 'Guest'}</Text>
              <View style={[
                styles.rolePill,
                user?.role === 'artist' ? styles.artistPill : styles.userPill
              ]}>
                <Text style={[
                  styles.roleText,
                  user?.role === 'artist' ? styles.artistText : styles.userText
                ]}>
                  {user?.role === 'artist' ? 'Artist' : 'User'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerButtons}>
            {user?.role === 'artist' && (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleSongsPress}
              >
                <Library size={24} color="#FFD700" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={signOut}
            >
              <LogOut size={24} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sliderSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Playing Today</Text>
            {lastUpdate && (
              <TouchableOpacity 
                onPress={handleRefresh} 
                style={[styles.refreshButton, isRefreshing && styles.refreshing]}
                disabled={isRefreshing}
              >
                <Text style={styles.lastUpdateText}>
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {error ? (
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
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 48}
                decelerationRate="fast"
                contentContainerStyle={styles.slider}
                onScroll={handleScroll}
                scrollEventThrottle={16}>
                {loading ? (
                  <View style={[styles.slide, styles.loadingSlide]}>
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  playingToday.map((slide) => (
                    <View key={`slide-${slide.id}`} style={styles.slide}>
                      <View style={styles.slideContent}>
                        <View style={styles.slideTextContent}>
                          <View style={styles.streamNameContainer}>
                            <Text style={styles.streamName}>{slide.stream_name}</Text>
                          </View>
                          <Text style={styles.slideTitle}>{slide.title}</Text>
                          <Text style={styles.artist}>{slide.artist}</Text>
                          
                          <View style={styles.buttonContainer}>
                            {streamingServices.map((service) => (
                              <TouchableOpacity
                                key={service.id}
                                onPress={() => handleStreamingPress(service)}>
                                <Image 
                                  source={{ uri: service.icon }}
                                  style={styles.serviceIcon}
                                  resizeMode="contain"
                                />
                              </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.moreButton}>
                              <Text style={styles.moreButtonText}>More</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Image source={{ uri: slide.image }} style={styles.slideImage} />
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
              <View style={styles.pagination}>
                {playingToday.map((slide) => (
                  <View
                    key={`dot-${slide.id}`}
                    style={[
                      styles.paginationDot,
                      playingToday.indexOf(slide) === activeSlide && styles.activeDot
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.servicesGrid}>
            <View style={styles.serviceItem}>
              <View style={styles.serviceIconContainer}>
                <FileText color="#1E40AF" size={24} />
              </View>
              <Text style={styles.serviceText}>UPRS Portal</Text>
            </View>
            <View style={styles.serviceItem}>
              <View style={styles.serviceIconContainer}>
                <HomeIcon color="#1E40AF" size={24} />
              </View>
              <Text style={styles.serviceText}>Reports</Text>
            </View>
            <View style={styles.serviceItem}>
              <View style={styles.serviceIconContainer}>
                <Music color="#1E40AF" size={24} />
              </View>
              <Text style={styles.serviceText}>Vibe</Text>
            </View>
            <View style={styles.serviceItem}>
              <View style={styles.serviceIconContainer}>
                <Settings color="#1E40AF" size={24} />
              </View>
              <Text style={styles.serviceText}>Settings</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Royalties</Text>
            <Text style={styles.statValue}>UGX 149,868</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Playtime</Text>
            <Text style={styles.statValue}>400 Minutes</Text>
            <Text style={styles.statBadge}>Last 24h</Text>
          </View>
        </View>

        <View style={styles.topPlayedSection}>
          <Text style={styles.sectionTitle}>Top Played Song</Text>
          <View style={styles.songCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&fit=crop' }}
              style={styles.songImage}
            />
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>What did you do?</Text>
              <Text style={styles.songArtist}>Fille & Nutty Neithan</Text>
              <Text style={styles.songStats}>5.7k (17 Reviews)</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1E40AF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#FFD700',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  artistPill: {
    backgroundColor: '#FFD700',
  },
  userPill: {
    backgroundColor: '#E3F2FD',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  artistText: {
    color: '#1E40AF',
  },
  userText: {
    color: '#1E40AF',
  },
  content: {
    flex: 1,
    paddingBottom: 30,
  },
  sliderSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
  },
  refreshing: {
    opacity: 0.7,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666',
  },
  slider: {
    paddingHorizontal: 24,
  },
  slide: {
    width: width - 48,
    marginRight: 16,
  },
  loadingSlide: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    height: 160,
    backgroundColor: '#f0f9ff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  slideContent: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    height: 180,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  slideTextContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  streamNameContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  streamName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    color: '#1E40AF',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
  serviceIcon: {
    width: 32,
    height: 32,
  },
  moreButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  moreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  slideImage: {
    width: 140,
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E40AF',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  activeDot: {
    opacity: 1,
  },
  servicesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  serviceItem: {
    alignItems: 'center',
    width: '23%',
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 12,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  statCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 15,
    padding: 16,
    width: '48%',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginTop: 5,
  },
  statBadge: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  topPlayedSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  songCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  songImage: {
    width: 100,
    height: 100,
  },
  songInfo: {
    padding: 15,
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  songStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});