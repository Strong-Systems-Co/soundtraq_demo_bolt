import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Radio as Live, Play, User } from 'lucide-react-native';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useUser } from '@/context/user';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const { user, isLoading } = useUser();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('TabLayout - User data:', {
          isLoading,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          } : null
        });

        if (!isLoading) {
          setIsReady(!!user);
        }
      } catch (error) {
        console.error('TabLayout - Error:', error);
      }
    };

    initializeUser();
  }, [user, isLoading]);

  // Show loading indicator while initializing
  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  const tabScreenOptions = {
    headerShown: false,
    tabBarStyle: styles.tabBar,
    tabBarItemStyle: styles.tabBarItem,
    tabBarActiveTintColor: '#FFD700',
    tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
    tabBarLabelStyle: styles.tabBarLabel,
  };

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Home size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.liveIconContainer, focused && styles.liveIconContainerActive]}>
              {focused && <View style={styles.liveIndicator} />}
              <Live size={focused ? 32 : 24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="playing"
        options={{
          title: 'Top 100',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Play size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabBar: {
    backgroundColor: '#1E40AF',
    borderTopWidth: 0,
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    shadowOpacity: 0,
    ...Platform.select({
      ios: {
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  tabBarItem: {
    marginTop: 5,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 10,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  liveIconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  liveIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
});