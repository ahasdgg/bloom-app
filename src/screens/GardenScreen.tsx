/**
 * Garden Screen
 * Digital Garden gamification visualization
 */

import React, {useMemo} from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppStore} from '../state/store';

interface PlantItem {
  id: string;
  emoji: string;
  name: string;
  count: number;
}

const GardenScreen: React.FC = () => {
  const store = useAppStore();
  const gardenProgress = store.gardenProgress;
  const history = store.recommendationHistory;

  const plants = useMemo(() => {
    const categoryMap: Record<string, {emoji: string; name: string}> = {
      hiking: {emoji: '🏔️', name: 'Mountain'},
      cycling: {emoji: '🚴', name: 'Bicycle'},
      water_sports: {emoji: '🏄', name: 'Wave'},
      winter_sports: {emoji: '⛷️', name: 'Ski'},
      climbing: {emoji: '🧗', name: 'Climber'},
      camping: {emoji: '⛺', name: 'Tent'},
      yoga: {emoji: '🧘', name: 'Lotus'},
      fitness: {emoji: '💪', name: 'Strength'},
      arts: {emoji: '🎨', name: 'Palette'},
      culture: {emoji: '🏛️', name: 'Museum'},
      food: {emoji: '🍽️', name: 'Plate'},
      social: {emoji: '👥', name: 'People'},
      relaxation: {emoji: '🧖', name: 'Spa'},
      adventure: {emoji: '🗺️', name: 'Map'},
      nature: {emoji: '🌿', name: 'Leaf'},
    };

    const categoryCounts: Record<string, number> = {};

    history.forEach(rec => {
      const category = rec.activity.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        id: category,
        emoji: categoryMap[category]?.emoji || '🌱',
        name: categoryMap[category]?.name || category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const totalActivities = history.length;
  const points = gardenProgress.points || totalActivities * 10;
  const achievements = gardenProgress.achievements || [];

  const renderGardenGrid = () => {
    return (
      <View style={styles.gardenGrid}>
        {plants.map(plant => (
          <View key={plant.id} style={styles.plantContainer}>
            <View style={styles.plantEmoji}>
              <Text style={styles.emoji}>{plant.emoji}</Text>
              {plant.count > 1 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>×{plant.count}</Text>
                </View>
              )}
            </View>
            <Text style={styles.plantName}>{plant.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalActivities}</Text>
        <Text style={styles.statLabel}>Activities</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{points}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{plants.length}</Text>
        <Text style={styles.statLabel}>Species</Text>
      </View>
    </View>
  );

  const renderAchievements = () => {
    const achievementsList = [
      {id: 'first_activity', emoji: '🌱', name: 'First Bloom', condition: totalActivities >= 1},
      {id: 'five_activities', emoji: '🌿', name: 'Growing', condition: totalActivities >= 5},
      {id: 'ten_activities', emoji: '🌳', name: 'Flourishing', condition: totalActivities >= 10},
      {id: 'diverse', emoji: '🌺', name: 'Diverse', condition: plants.length >= 5},
      {id: 'explorer', emoji: '🗺️', name: 'Explorer', condition: totalActivities >= 20},
    ];

    return (
      <View style={styles.achievementsContainer}>
        <Text style={styles.achievementsTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievementsList.map(achievement => (
            <View
              key={achievement.id}
              style={[
                styles.achievementItem,
                !achievement.condition && styles.lockedAchievement,
              ]}
            >
              <Text style={styles.achievementEmoji}>
                {achievement.condition ? achievement.emoji : '🔒'}
              </Text>
              <Text style={styles.achievementName}>{achievement.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>Your Garden</Text>
            <Text style={styles.headerSubtitle}>
              Watch your digital garden grow with every adventure
            </Text>
          </View>

          {renderStats()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Plants</Text>
            {plants.length > 0 ? (
              renderGardenGrid()
            ) : (
              <View style={styles.emptyGarden}>
                <Text style={styles.emptyText}>
                  Your garden is waiting for its first plant. Start exploring!
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            {renderAchievements()}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Keep exploring to grow your garden and unlock achievements
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#b8944e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3d3d3d',
    marginBottom: 16,
  },
  gardenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  plantEmoji: {
    fontSize: 48,
    marginBottom: 8,
    position: 'relative',
  },
  emoji: {
    fontSize: 48,
  },
  countBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#b8944e',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  plantName: {
    fontSize: 12,
    color: '#6b6b6b',
    textAlign: 'center',
  },
  emptyGarden: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  achievementsContainer: {
    backgroundColor: 'rgba(212, 165, 116, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d3d3d',
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 11,
    color: '#6b6b6b',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default GardenScreen;
