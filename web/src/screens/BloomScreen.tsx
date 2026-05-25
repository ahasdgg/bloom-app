import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './BloomScreen.css'

const BloomScreen: React.FC = () => {
  const navigate = useNavigate()
  const store = useAppStore()
  const { t } = useTranslation()
  const recommendation = store.currentRecommendation

  if (!recommendation) {
    return (
      <div className="bloom-screen">
        <div className="empty-state">
          <p>{t('noRecommendation')}</p>
          <button onClick={() => navigate('/seed')}>{t('getRecommendation')}</button>
        </div>
      </div>
    )
  }

  const { activity, reasoning, contextSnapshot } = recommendation

  const handleGetAnother = () => {
    navigate('/seed')
  }

  const handleNavigate = () => {
    const mapsUrl = `https://www.google.com/maps/search/${activity.location.latitude},${activity.location.longitude}`
    window.open(mapsUrl, '_blank')
  }

  const handleBook = () => {
    // Start activity in store
    if (store.currentRecommendation) {
      const activity = store.currentRecommendation.activity
      const newActivity = {
        id: 'active_' + Date.now(),
        name: activity.name,
        location: activity.location.name,
        duration: activity.duration,
        cost: activity.cost,
        startedAt: Date.now(),
        imageUrl: activity.imageUrl,
        status: 'active' as const,
      }
      
      // ✅ НОВОЕ: Set as current activity
      store.setCurrentActivity(newActivity)
      
      // Add to active list
      store.startActivity(newActivity)
      navigate('/active')
    }
  }

  const handleCompleteActivity = () => {
    navigate('/completion')
  }

  return (
    <div className="bloom-screen">
      <div className="bloom-content">
        {activity.imageUrl && (
          <img src={activity.imageUrl} alt={activity.name} className="activity-image" />
        )}

        <div className="activity-info">
          <h1 className="activity-name">{activity.name}</h1>
          <p className="location">📍 {activity.location.name}</p>

          <div className="meta-container">
            <div className="meta-item">
              <span className="meta-label">{t('duration')}</span>
              <span className="meta-value">{activity.duration} min</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">{t('difficulty')}</span>
              <span className="meta-value">{activity.difficulty}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">{t('cost')}</span>
              <span className="meta-value">
                {activity.cost}
                {activity.costAmount ? ` (${activity.costAmount})` : ''}
              </span>
            </div>
          </div>

          <p className="description">{activity.description}</p>

          <div className="reasoning-container">
            <h3 className="reasoning-label">{t('whyThisActivity')}</h3>
            <p className="reasoning">{reasoning}</p>
          </div>

          {contextSnapshot && (
            <div className="context-container">
              <h3 className="context-label">{t('currentConditions')}</h3>
              {contextSnapshot.temperature && (
                <p className="context-item">🌡️ {contextSnapshot.temperature}°C</p>
              )}
              {contextSnapshot.weather && (
                <p className="context-item">☁️ {contextSnapshot.weather}</p>
              )}
              {contextSnapshot.availableTime && (
                <p className="context-item">⏱️ {contextSnapshot.availableTime} {t('minutesAvailable')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="button-container">
        <button className="button primary-button" onClick={handleBook}>
          🚀 {t('letsGo')}
        </button>
        <button className="button secondary-button" onClick={handleNavigate}>
          📍 {t('navigate')}
        </button>
        <button className="button tertiary-button" onClick={handleGetAnother}>
          ✨ {t('another')}
        </button>
        <button className="button completion-button" onClick={handleCompleteActivity}>
          ✓ {t('iCompletedIt')}
        </button>
      </div>
    </div>
  )
}

export default BloomScreen
