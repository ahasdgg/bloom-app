/**
 * Seed Screen
 * Main interaction screen with animated sphere
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppStore} from '../state/store';
import {contextEngine} from '../services/contextEngine';
import {llmRecommendationEngine} from '../services/llmRecommendationEngine';
import AnimatedSphere from '../components/AnimatedSphere';
import type {RecommendationRequest} from '../types';

interface SeedScreenProps {
  onRecommendationGenerated?: () => void;
}

const SeedScreen: React.FC<SeedScreenProps> = ({onRecommendationGenerated}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const store = useAppStore();

  const handleSpherePress = useCallback(async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      const userId = store.userId || 'default_user';

      // Gather context
      const context = await contextEngine.gatherContext(userId, false);

      if (!context.location || !context.weather || !context.preferences) {
        Alert.alert(
          'Missing Context',
          'Unable to gather complete context for recommendation',
        );
        setIsGenerating(false);
        return;
      }

      // Build recommendation request
      const request: RecommendationRequest = {
        userId,
        location: {
          latitude: context.location.latitude,
          longitude: context.location.longitude,
        },
        weather: {
          condition: context.weather.condition,
          temperature: context.weather.temperature,
          humidity: context.weather.humidity,
          windSpeed: context.weather.windSpeed,
        },
        availableTime: context.calendar?.nextFreeSlot?.duration || 120,
        preferences: {
          favoriteCategories: context.preferences.favoriteCategories,
          dislikedCategories: context.preferences.dislikedCategories,
          budgetRange: context.preferences.budgetRange,
          maxDistance: context.preferences.maxTravelDistance,
          difficulty: context.preferences.preferredDifficultyLevels,
        },
        calendar: context.calendar
          ? {
              nextFreeSlot: context.calendar.nextFreeSlot,
              busyUntil: context.calendar.busyUntil,
            }
          : undefined,
      };

      // Generate recommendation
      const recommendation = await llmRecommendationEngine.generateRecommendation(
        request,
        false,
      );

      // Update store
      store.setCurrentRecommendation(recommendation);
      store.addToRecommendationHistory(recommendation);

      setIsGenerating(false);
      onRecommendationGenerated?.();
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate recommendation',
      );
      setIsGenerating(false);
    }
  }, [isGenerating, store, onRecommendationGenerated]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f5f1e8', '#e8dcc8', '#dcc9b0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {store.userId || 'Friend'}
            </Text>
            <Text style={styles.subtitle}>How are you feeling today?</Text>
            <Text style={styles.description}>
              Let's find something perfect for you
            </Text>
          </View>

          <View style={styles.sphereContainer}>
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#b8944e" />
                <Text style={styles.loadingText}>Finding your perfect activity...</Text>
              </View>
            ) : (
              <AnimatedSphere
                onPress={handleSpherePress}
                isLoading={isGenerating}
                size={200}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Hold the sphere to discover your next adventure
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: '#3d3d3d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b6b6b',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  sphereContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b6b6b',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default SeedScreen;
