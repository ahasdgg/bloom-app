/**
 * Bloom Screen
 * Displays recommendation with action buttons
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppStore} from '../state/store';
import {calendarService} from '../services/calendar';
import type {Recommendation} from '../types';

interface BloomScreenProps {
  recommendation?: Recommendation;
  onGetAnother?: () => void;
  onBack?: () => void;
}

const BloomScreen: React.FC<BloomScreenProps> = ({
  recommendation,
  onGetAnother,
  onBack,
}) => {
  const [isBooking, setIsBooking] = useState(false);
  const store = useAppStore();
  const currentRec = recommendation || store.currentRecommendation;

  if (!currentRec) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f5f1e8', '#e8dcc8', '#dcc9b0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradient}
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recommendation available</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={onBack}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const {activity, reasoning, contextSnapshot} = currentRec;

  const handleBook = useCallback(async () => {
    try {
      setIsBooking(true);

      if (activity.bookingUrl) {
        await Linking.openURL(activity.bookingUrl);
      } else {
        Alert.alert('Booking', 'No booking URL available for this activity');
      }

      // Add to calendar
      const userId = store.userId || 'default_user';
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + activity.duration * 60000);

      await calendarService.addEventToCalendar(
        activity.name,
        startDate,
        endDate,
        activity.location.address,
        activity.description,
      );

      Alert.alert('Success', 'Activity added to your calendar!');
      setIsBooking(false);
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to book activity');
      setIsBooking(false);
    }
  }, [activity, store.userId]);

  const handleNavigate = useCallback(async () => {
    try {
      const url = `https://maps.google.com/?q=${activity.location.latitude},${activity.location.longitude}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to open maps');
    }
  }, [activity.location]);

  const handleGetAnother = useCallback(() => {
    onGetAnother?.();
  }, [onGetAnother]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f5f1e8', '#e8dcc8', '#dcc9b0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Activity Image */}
            {activity.imageUrl && (
              <Image
                source={{uri: activity.imageUrl}}
                style={styles.image}
              />
            )}

            {/* Activity Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.location}>{activity.location.name}</Text>

              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Duration</Text>
                  <Text style={styles.metaValue}>{activity.duration} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Difficulty</Text>
                  <Text style={styles.metaValue}>{activity.difficulty}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Cost</Text>
                  <Text style={styles.metaValue}>
                    {activity.cost}
                    {activity.costAmount ? ` ($${activity.costAmount})` : ''}
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>{activity.description}</Text>

              {/* AI Reasoning */}
              <View style={styles.reasoningContainer}>
                <Text style={styles.reasoningLabel}>Why this activity?</Text>
                <Text style={styles.reasoning}>{reasoning}</Text>
              </View>

              {/* Context Info */}
              {contextSnapshot && (
                <View style={styles.contextContainer}>
                  <Text style={styles.contextLabel}>Current Conditions</Text>
                  {contextSnapshot.temperature && (
                    <Text style={styles.contextItem}>
                      🌡️ {contextSnapshot.temperature}°C
                    </Text>
                  )}
                  {contextSnapshot.weather && (
                    <Text style={styles.contextItem}>
                      ☁️ {contextSnapshot.weather}
                    </Text>
                  )}
                  {contextSnapshot.availableTime && (
                    <Text style={styles.contextItem}>
                      ⏱️ {contextSnapshot.availableTime} minutes available
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleBook}
            disabled={isBooking}
          >
            <Text style={styles.primaryButtonText}>
              {isBooking ? 'Booking...' : '🚀 Let\'s Go!'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleNavigate}
          >
            <Text style={styles.secondaryButtonText}>📍 Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={handleGetAnother}
          >
            <Text style={styles.tertiaryButtonText}>✨ Another</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0d5c7',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activityName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3d3d3d',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d5c7',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d3d3d',
  },
  description: {
    fontSize: 14,
    color: '#6b6b6b',
    lineHeight: 20,
    marginBottom: 20,
  },
  reasoningContainer: {
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reasoningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b8944e',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  reasoning: {
    fontSize: 13,
    color: '#6b6b6b',
    lineHeight: 18,
  },
  contextContainer: {
    backgroundColor: 'rgba(184, 148, 78, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b8944e',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  contextItem: {
    fontSize: 13,
    color: '#6b6b6b',
    marginBottom: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#b8944e',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#e0d5c7',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d3d3d',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#b8944e',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b8944e',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b6b6b',
    marginBottom: 20,
  },
});

export default BloomScreen;
