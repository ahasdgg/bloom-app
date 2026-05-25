import React, { useMemo } from 'react'
import { useAppStore } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './GardenScreen.css'

const GardenScreen: React.FC = () => {
  const store = useAppStore()
  const { t } = useTranslation()
  const gardenProgress = store.gardenProgress
  // Web store keeps activity history in `completedActivities`
  const history = store.completedActivities

  const plants = useMemo(() => {
    const categoryMap: Record<string, { emoji: string; name: string }> = {
      hiking: { emoji: '🏔️', name: 'Mountain' },
      cycling: { emoji: '🚴', name: 'Bicycle' },
      water_sports: { emoji: '🏄', name: 'Wave' },
      winter_sports: { emoji: '⛷️', name: 'Ski' },
      climbing: { emoji: '🧗', name: 'Climber' },
      camping: { emoji: '⛺', name: 'Tent' },
      yoga: { emoji: '🧘', name: 'Lotus' },
      fitness: { emoji: '💪', name: 'Strength' },
      arts: { emoji: '🎨', name: 'Palette' },
      culture: { emoji: '🏛️', name: 'Museum' },
      food: { emoji: '🍽️', name: 'Plate' },
      social: { emoji: '👥', name: 'People' },
      relaxation: { emoji: '🧖', name: 'Spa' },
      adventure: { emoji: '🗺️', name: 'Map' },
      nature: { emoji: '🌿', name: 'Leaf' },
    }

    const categoryCounts: Record<string, number> = {}

    history.forEach(rec => {
      const category = rec.activity.category
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        id: category,
        emoji: categoryMap[category]?.emoji || '🌱',
        name: categoryMap[category]?.name || category,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [history])

  const totalActivities = history.length
  const points = gardenProgress.points || totalActivities * 10

  const achievements = [
    { id: 'first_activity', emoji: '🌱', name: 'First Bloom', condition: totalActivities >= 1 },
    { id: 'five_activities', emoji: '🌿', name: 'Growing', condition: totalActivities >= 5 },
    { id: 'ten_activities', emoji: '🌳', name: 'Flourishing', condition: totalActivities >= 10 },
    { id: 'diverse', emoji: '🌺', name: 'Diverse', condition: plants.length >= 5 },
    { id: 'explorer', emoji: '🗺️', name: 'Explorer', condition: totalActivities >= 20 },
  ]

  return (
    <div className="garden-screen">
      <div className="garden-header">
        <h1 className="header-title">{t('gardenTitle')}</h1>
        <p className="header-subtitle">{t('gardenSubtitle')}</p>
      </div>

      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{totalActivities}</div>
          <div className="stat-label">{t('totalActivities')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{points}</div>
          <div className="stat-label">{t('totalPoints')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{plants.length}</div>
          <div className="stat-label">{t('species')}</div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">{t('yourPlants')}</h2>
        {plants.length > 0 ? (
          <div className="garden-grid">
            {plants.map(plant => (
              <div key={plant.id} className="plant-container">
                <div className="plant-emoji">{plant.emoji}</div>
                {plant.count > 1 && <div className="count-badge">×{plant.count}</div>}
                <div className="plant-name">{plant.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-garden">
            <p>{t('emptyGarden')}</p>
          </div>
        )}
      </div>

      <div className="section">
        <h2 className="section-title">{t('achievements')}</h2>
        <div className="achievements-grid">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`achievement-item ${!achievement.condition ? 'locked' : ''}`}
            >
              <div className="achievement-emoji">
                {achievement.condition ? achievement.emoji : '🔒'}
              </div>
              <div className="achievement-name">{achievement.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="garden-footer">
        <p>{t('gardenFooter')}</p>
      </div>
    </div>
  )
}

export default GardenScreen
