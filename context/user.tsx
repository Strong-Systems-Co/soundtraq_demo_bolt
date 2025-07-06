import { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/constants/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'artist' | 'user';
  artist_stage_name?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
  isLoading: true,
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInterval = useRef<NodeJS.Timeout>();

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('UserProvider - Fetching user data with token');
      const response = await api.get('/user');
      
      console.log('UserProvider - User data response:', {
        status: response.status,
        data: response.data
      });
      
      if (response.data) {
        // Transform the response data to match our User interface
        const userData: User = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          avatar: response.data.avatar || '',
          role: response.data.role || 'user',
          artist_stage_name: response.data.artist_stage_name
        };

        console.log('UserProvider - Setting user data:', userData);
        setUser(userData);
        setIsLoading(false);

        // Clear the interval once we have the user data
        if (fetchInterval.current) {
          clearInterval(fetchInterval.current);
          fetchInterval.current = undefined;
        }
      }
    } catch (error) {
      console.error('UserProvider - Error fetching user data:', error);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  useEffect(() => {
    console.log('UserProvider - Initial fetch');
    fetchUser();

    // Set up interval to fetch every 5 seconds until we get the user data
    if (!user) {
      console.log('UserProvider - Setting up fetch interval');
      fetchInterval.current = setInterval(fetchUser, 5000);
    }

    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}