import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import SeedScreen from './src/screens/SeedScreen';
import BloomScreen from './src/screens/BloomScreen';
import PathScreen from './src/screens/PathScreen';
import GardenScreen from './src/screens/GardenScreen';
import {useAppStore} from './src/state/store';
import {contextEngine} from './src/services/contextEngine';
import {checkRequiredEnv, env} from './src/config/env';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SeedStack = () => {
  const [showBloom, setShowBloom] = useState(false);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Seed"
        component={SeedScreen}
        initialParams={{onRecommendationGenerated: () => setShowBloom(true)}}
      />
      {showBloom && (
        <Stack.Screen
          name="Bloom"
          component={BloomScreen}
          options={{
            animationEnabled: true,
          }}
        />
      )}
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#b8944e',
        tabBarInactiveTintColor: '#ccc',
        tabBarStyle: {
          backgroundColor: '#f5f1e8',
          borderTopColor: '#e0d5c7',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="SeedTab"
        component={SeedStack}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({color}) => <Text style={{fontSize: 20, color}}>🌱</Text>,
        }}
      />
      <Tab.Screen
        name="PathTab"
        component={PathScreen}
        options={{
          tabBarLabel: 'Path',
          tabBarIcon: ({color}) => <Text style={{fontSize: 20, color}}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="GardenTab"
        component={GardenScreen}
        options={{
          tabBarLabel: 'Garden',
          tabBarIcon: ({color}) => <Text style={{fontSize: 20, color}}>🌿</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const store = useAppStore();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Soft env check (do not crash, avoid leaking stack traces)
        const check = checkRequiredEnv();
        if (!check.ok) {
          console.warn(
            `[TimeBloom] Missing env vars: ${check.missing.join(
              ', ',
            )}. App will run in degraded/mock mode.`,
          );
        }
        if (env.flags.demoMode) {
          console.warn('[TimeBloom] DEMO_MODE is enabled. Personal data will be anonymized.');
        }

        // Set default user ID if not set
        if (!store.userId) {
          store.setUserId('user_' + Date.now());
        }

        // Start context auto-refresh
        contextEngine.startAutoRefresh(store.userId || 'default_user');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();

    return () => {
      contextEngine.destroy();
    };
  }, [store]);

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
