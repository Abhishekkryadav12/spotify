import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { PlayerProvider, usePlayer } from './src/context/PlayerContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { RadioScreen } from './src/screens/RadioScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { BottomPlayer } from './src/components/BottomPlayer';
import { PlayerModal } from './src/components/PlayerModal';

const Tab = createBottomTabNavigator();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#121212',
    text: '#ffffff',
    border: '#282828',
  },
};

function ToastBanner() {
  const { toastMessage } = usePlayer();
  if (!toastMessage) return null;

  return (
    <View style={styles.toastContainer} pointerEvents="none">
      <View style={styles.toastPill}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </View>
    </View>
  );
}

function MainNavigation() {
  return (
    <View style={styles.appContainer}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1db954',
          tabBarInactiveTintColor: '#888888',
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopColor: '#252525',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 62,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Radio') {
              iconName = focused ? 'radio' : 'radio-outline';
            } else {
              iconName = focused ? 'library' : 'library-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Radio" component={RadioScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
      </Tab.Navigator>

      {/* Docked Mini Player right above bottom tab bar */}
      <BottomPlayer />

      {/* Full-Screen Player Modal */}
      <PlayerModal />

      {/* Floating Feedback Notification */}
      <ToastBanner />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <LibraryProvider>
          <PlayerProvider>
            <NavigationContainer theme={customDarkTheme}>
              <MainNavigation />
            </NavigationContainer>
          </PlayerProvider>
        </LibraryProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastPill: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderColor: '#1db954',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
