/**
 * Settings Screen
 * User preferences and app settings
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppStore} from '../state/store';
import {preferenceEngine} from '../services/preferences';
import type {ActivityCategory} from '../types';

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'hiking',
  'cycling',
  'water_sports',
  'winter_sports',
  'climbing',
  'camping',
  'yoga',
  'fitness',
  'arts',
  'culture',
  'food',
  'social',
  'relaxation',
  'adventure',
  'nature',
];

const SettingsScreen: React.FC = () => {
  const store = useAppStore();
  const prefs = store.userPreferences;
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleCategory = useCallback(
    async (category: ActivityCategory) => {
      if (!store.userId || !prefs) return;

      try {
        setIsSaving(true);

        if (prefs.favoriteCategories.includes(category)) {
          await preferenceEngine.removeFavoriteCategory(store.userId, category);
        } else {
          await preferenceEngine.addFavoriteCategory(store.userId, category);
        }

        // Refresh preferences
        const updated = await preferenceEngine.getUserPreferences(store.userId);
        store.setUserPreferences(updated);

        setIsSaving(false);
      } catch (error) {
        console.error('Failed to update preferences:', error);
        Alert.alert('Error', 'Failed to update preferences');
        setIsSaving(false);
      }
    },
    [store, prefs],
  );

  const handleToggleNotifications = useCallback(
    async (enabled: boolean) => {
      if (!store.userId || !prefs) return;

      try {
        setIsSaving(true);

        await preferenceEngine.updateNotificationPreferences(store.userId, {
          enabled,
        });

        const updated = await preferenceEngine.getUserPreferences(store.userId);
        store.setUserPreferences(updated);

        setIsSaving(false);
      } catch (error) {
        console.error('Failed to update notifications:', error);
        Alert.alert('Error', 'Failed to update notifications');
        setIsSaving(false);
      }
    },
    [store, prefs],
  );

  if (!prefs) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f5f1e8', '#e8dcc8', '#dcc9b0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f5f1e8', '#e8dcc8', '#dcc9b0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Switch
                value={prefs.notificationPreferences.enabled}
                onValueChange={handleToggleNotifications}
                disabled={isSaving}
                trackColor={{false: '#ccc', true: '#b8944e'}}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Preferences</Text>
            <Text style={styles.sectionDescription}>
              Select your favorite activity types
            </Text>

            <View style={styles.categoriesGrid}>
              {ACTIVITY_CATEGORIES.map(category => {
                const isFavorite = prefs.favoriteCategories.includes(category);
                const categoryEmojis: Record<ActivityCategory, string> = {
                  hiking: '🏔️',
                  cycling: '🚴',
                  water_sports: '🏄',
                  winter_sports: '⛷️',
                  climbing: '🧗',
                  camping: '⛺',
                  yoga: '🧘',
                  fitness: '💪',
                  arts: '🎨',
                  culture: '🏛️',
                  food: '🍽️',
                  social: '👥',
                  relaxation: '🧖',
                  adventure: '🗺️',
                  nature: '🌿',
                };

                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      isFavorite && styles.categoryButtonActive,
                    ]}
                    onPress={() => handleToggleCategory(category)}
                    disabled={isSaving}
                  >
                    <Text style={styles.categoryEmoji}>
                      {categoryEmojis[category]}
                    </Text>
                    <Text
                      style={[
                        styles.categoryName,
                        isFavorite && styles.categoryNameActive,
                      ]}
                    >
                      {category.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Budget Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Range</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Min</Text>
                <Text style={styles.budgetValue}>
                  ${prefs.budgetRange.min}
                </Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Max</Text>
                <Text style={styles.budgetValue}>
                  ${prefs.budgetRange.max}
                </Text>
              </View>
            </View>
          </View>

          {/* Distance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Distance</Text>
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceValue}>
                {prefs.maxTravelDistance} km
              </Text>
            </View>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyLabel}>Share Location</Text>
              <Text style={styles.privacyValue}>
                {prefs.privacySettings.shareLocation ? '✓' : '✗'}
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyLabel}>Share Calendar</Text>
              <Text style={styles.privacyValue}>
                {prefs.privacySettings.shareCalendar ? '✓' : '✗'}
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyLabel}>Allow Analytics</Text>
              <Text style={styles.privacyValue}>
                {prefs.privacySettings.allowAnalytics ? '✓' : '✗'}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Last updated: {new Date(prefs.timestamp).toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3d3d3d',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d3d3d',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#3d3d3d',
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0d5c7',
  },
  categoryButtonActive: {
    backgroundColor: '#b8944e',
    borderColor: '#b8944e',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    color: '#6b6b6b',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameActive: {
    color: '#fff',
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  budgetItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b8944e',
  },
  distanceContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b8944e',
  },
  privacyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  privacyLabel: {
    fontSize: 14,
    color: '#3d3d3d',
    fontWeight: '500',
  },
  privacyValue: {
    fontSize: 16,
    color: '#b8944e',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b6b6b',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;
