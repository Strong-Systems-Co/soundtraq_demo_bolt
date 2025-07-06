import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { useUser } from './user';
import { api } from '@/constants/api';

// Define the shape of our auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
  setAuthenticated: () => {},
});

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { setUser } = useUser();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated users away from auth screens
      router.replace('/(tabs)/home');
    } else if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated users to login
      router.replace('/login');
    }
  }, [isAuthenticated, segments, navigationState?.key, isLoading]);

  const setupApiToken = (token: string | null) => {
    if (token) {
      // Set the token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Remove the token from API headers
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const clearAllData = async () => {
    try {
      console.log('Clearing all user data...');
      
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      
      // Reset API headers
      setupApiToken(null);
      
      // Reset user context
      setUser(null);
      
      // Reset authentication state
      setIsAuthenticated(false);
      
      console.log('All user data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      // Even if there's an error, ensure we reset the states
      setUser(null);
      setIsAuthenticated(false);
      setupApiToken(null);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      setupApiToken(token);
      const response = await api.get('/user');
      console.log('Auth Provider - User data fetched:', response.data);
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Error fetching user data:', error);
      await clearAllData();
      return false;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const success = await fetchUserData(token);
        setIsAuthenticated(success);
      } else {
        await clearAllData();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await clearAllData();
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      await clearAllData();
      router.replace('/login');
      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to clear everything
      await clearAllData();
      router.replace('/login');
    }
  };

  const setAuthenticated = async (value: boolean) => {
    if (!value) {
      await clearAllData();
    }
    setIsAuthenticated(value);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      signOut,
      setAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}