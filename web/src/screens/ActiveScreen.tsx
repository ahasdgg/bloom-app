import React, { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, ActiveActivity } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './ActiveScreen.css'

export default function ActiveScreen() {
  const navigate = useNavigate()
  const store = useAppStore()
  const { t } = useTranslation()
  const activeActivities = store.activeActivities
  const currentActivity = store.currentActivity

  const handleAutoComplete = useCallback(
    (activity: ActiveActivity) => {
      // 1. Create recommendation for completion screen
      store.setCurrentRecommendation({
        id: activity.id,
        activity: {
          name: activity.name,
          description: `You completed ${activity.name}`,
          category: 'adventure',
          location: {
            name: activity.location,
            latitude: 0,
            longitude: 0,
          },
          duration: activity.duration,
          difficulty: 'medium',
          cost: activity.cost,
          indoor: false,
          imageUrl: activity.imageUrl,
        },
        relevanceScore: 0.9,
        reasoning: 'Great job completing this activity!',
        contextSnapshot: {
          temperature: 22,
          weather: 'Sunny',
          timeOfDay: 'Afternoon',
          availableTime: 120,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      })

      // 2. Complete activity in store
      store.completeActivity(activity.id)
      
      // 3. ✅ НОВОЕ: Hard reset current activity
      store.clearCurrentActivity()
      
      // 4. Remove from active list
      store.cancelActivity(activity.id)

      // 5. Navigate to completion
      navigate('/completion')
    },
    [store, navigate]
  )

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getElapsedTime = (activity: ActiveActivity): number => {
    if (activity.status === 'paused' && activity.pausedAt) {
      return Math.floor((activity.pausedAt - activity.startedAt) / 1000 / 60)
    }
    return Math.floor((Date.now() - activity.startedAt) / 1000 / 60)
  }

  const getProgressPercentage = (elapsed: number, total: number): number => {
    return Math.min((elapsed / total) * 100, 100)
  }

  const handleFinish = (activityId: string) => {
    const activity = activeActivities.find(a => a.id === activityId)
    if (activity) {
      // ✅ НОВОЕ: Set as current before completing
      store.setCurrentActivity(activity)
      handleAutoComplete(activity)
    }
  }

  const handlePause = (activityId: string) => {
    store.pauseActivity(activityId)
  }

  const handleResume = (activityId: string) => {
    store.resumeActivity(activityId)
  }

  const handleCancel = (activityId: string) => {
    store.cancelActivity(activityId)
  }

  return (
    <div className="active-screen">
      <div className="active-header">
        <h1 className="header-title">{t('activeNow')}</h1>
        <p className="header-subtitle">
          {activeActivities.filter(a => a.status === 'active').length} {t('active_count')},{' '}
          {activeActivities.filter(a => a.status === 'paused').length} {t('paused_count')}
        </p>
      </div>

      <div className="active-container">
        {activeActivities.length > 0 ? (
          <div className="active-list">
            {activeActivities.map(activity => {
              const elapsedTime = getElapsedTime(activity)
              const progress = getProgressPercentage(elapsedTime, activity.duration)
              const remainingTime = activity.duration - elapsedTime
              const isExpired = elapsedTime >= activity.duration

              return (
                <div
                  key={activity.id}
                  className={`active-card ${activity.status === 'paused' ? 'paused' : ''} ${
                    isExpired ? 'expired' : ''
                  }`}
                >
                  {activity.imageUrl && (
                    <img src={activity.imageUrl} alt={activity.name} className="activity-image" />
                  )}

                  <div className="activity-content">
                    <div className="activity-header">
                      <h2 className="activity-name">{activity.name}</h2>
                      <span className={`status-badge ${activity.status}`}>
                        {activity.status === 'active' && `🔴 ${t('statusLive')}`}
                        {activity.status === 'paused' && `⏸ ${t('statusPaused')}`}
                        {activity.status === 'completed' && `✓ ${t('statusCompleted')}`}
                      </span>
                    </div>

                    <p className="location">📍 {activity.location}</p>

                    <div className="timer-section">
                      <div className="time-display">
                        <div className="elapsed">
                          <span className="label">{t('elapsed')}</span>
                          <span className="time">{formatTime(elapsedTime)}</span>
                        </div>
                        <div className="separator">/</div>
                        <div className="total">
                          <span className="label">{t('total')}</span>
                          <span className="time">{formatTime(activity.duration)}</span>
                        </div>
                      </div>

                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>

                      <div className="remaining-time">
                        {isExpired ? (
                          <span className="completed">{t('timesUp')}</span>
                        ) : activity.status === 'paused' ? (
                          <span className="paused-text">{t('activityPaused')}</span>
                        ) : (
                          <span className="remaining">
                            ⏱️ {formatTime(remainingTime)} {t('remaining')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="meta-info">
                      <span className="meta-item">💰 {activity.cost}</span>
                      <span className="meta-item">⏱️ {activity.duration} min total</span>
                    </div>

                    <div className="action-buttons">
                      {activity.status === 'active' ? (
                        <>
                          <button
                            className="button finish-button"
                            onClick={() => handleFinish(activity.id)}
                          >
                            ✓ {t('finishActivity')}
                          </button>
                          <button
                            className="button pause-button"
                            onClick={() => handlePause(activity.id)}
                          >
                            ⏸ {t('pause')}
                          </button>
                        </>
                      ) : activity.status === 'paused' ? (
                        <>
                          <button
                            className="button resume-button"
                            onClick={() => handleResume(activity.id)}
                          >
                            ▶ {t('resume')}
                          </button>
                          <button
                            className="button finish-button"
                            onClick={() => handleFinish(activity.id)}
                          >
                            ✓ {t('finishActivity')}
                          </button>
                        </>
                      ) : null}
                      <button
                        className="button cancel-button"
                        onClick={() => handleCancel(activity.id)}
                      >
                        ✕ {t('cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h2 className="empty-title">{t('noActiveActivities')}</h2>
            <p className="empty-description">
              {t('startActivityFromBloom')}
            </p>
            <button className="button primary-button" onClick={() => navigate('/seed')}>
              {t('getRecommendation')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
