/**
 * Path Screen
 * Timeline view of past and upcoming activities
 */

import React, {useMemo} from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppStore} from '../state/store';
import type {Recommendation} from '../types';

interface TimelineItem {
  id: string;
  recommendation: Recommendation;
  isPast: boolean;
  isToday: boolean;
}

const PathScreen: React.FC = () => {
  const store = useAppStore();
  const history = store.recommendationHistory;

  const timelineItems = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    return history
      .map(rec => {
        const isPast = rec.expiresAt < now;
        const isToday = rec.createdAt >= todayTime && rec.createdAt < todayTime + 24 * 60 * 60 * 1000;

        return {
          id: rec.id,
          recommendation: rec,
          isPast,
          isToday,
        };
      })
      .sort((a, b) => b.recommendation.createdAt - a.recommendation.createdAt);
  }, [history]);

  const renderTimelineItem = ({item}: {item: TimelineItem}) => {
    const {recommendation, isPast, isToday} = item;
    const {activity, createdAt} = recommendation;
    const date = new Date(createdAt);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.timelineItemContainer}>
        <View style={[styles.timelineMarker, isPast && styles.pastMarker]}>
          <View style={styles.markerDot} />
        </View>

        <TouchableOpacity
          style={[
            styles.timelineCard,
            isPast && styles.pastCard,
            isToday && styles.todayCard,
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.activityName, isPast && styles.pastText]}>
              {activity.name}
            </Text>
            {isToday && <Text style={styles.todayBadge}>Today</Text>}
          </View>

          <Text style={[styles.location, isPast && styles.pastText]}>
            📍 {activity.location.name}
          </Text>

          <View style={styles.cardMeta}>
            <Text style={[styles.metaText, isPast && styles.pastText]}>
              ⏱️ {activity.duration} min
            </Text>
            <Text style={[styles.metaText, isPast && styles.pastText]}>
              💰 {activity.cost}
            </Text>
          </View>

          <Text style={styles.dateText}>{dateStr}</Text>

          {isPast && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Your Journey Begins</Text>
      <Text style={styles.emptyDescription}>
        Activities you discover will appear here, creating your personal path of adventures.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f5f1e8', '#e8dcc8', '#dcc9b0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Path</Text>
          <Text style={styles.headerSubtitle}>
            {timelineItems.length} {timelineItems.length === 1 ? 'activity' : 'activities'}
          </Text>
        </View>

        <FlatList
          data={timelineItems}
          renderItem={renderTimelineItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineMarker: {
    width: 40,
    alignItems: 'center',
    paddingTop: 8,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b8944e',
    borderWidth: 3,
    borderColor: '#f5f1e8',
  },
  pastMarker: {
    opacity: 0.5,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pastCard: {
    backgroundColor: '#f9f7f3',
    opacity: 0.7,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#b8944e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d3d3d',
    flex: 1,
  },
  pastText: {
    color: '#999',
  },
  todayBadge: {
    backgroundColor: '#b8944e',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  location: {
    fontSize: 13,
    color: '#6b6b6b',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  dateText: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 8,
  },
  completedBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0d5c7',
  },
  completedText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3d3d3d',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PathScreen;
