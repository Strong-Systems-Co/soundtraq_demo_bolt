import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PLAYING_TODAY: 'playing_today_data',
  LIVE_SONGS: 'live_songs_data',
  TOP_100_SONGS: 'top_100_songs_data',
  LAST_UPDATE: 'playing_today_last_update',
} as const;

interface CachedData<T> {
  data: T;
  timestamp: string;
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

export async function loadData<T>(key: string): Promise<CachedData<T> | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

export { STORAGE_KEYS };