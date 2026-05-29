import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './CompletionScreen.css'

export default function CompletionScreen() {
  const navigate = useNavigate()
  const store = useAppStore()
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [recommendation, setRecommendation] = useState<'yes' | 'maybe' | 'no' | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)

  const activity = store.currentRecommendation?.activity || {
    name: 'Activity',
    location: { name: 'Location' },
    duration: 60,
    cost: 'free',
    category: 'adventure',
  }

  const handleSubmit = () => {
    const basePoints = Math.floor((store.currentRecommendation?.activity.duration || 60) / 30)
    const ratingBonus = rating * 10
    const total = basePoints + ratingBonus
    setPointsEarned(total)

    if (store.currentRecommendation) {
      store.addCompletedActivity({
        ...store.currentRecommendation,
        id: 'completed_' + Date.now(),
        rating,
        feedback,
        recommendation: recommendation || 'yes',
        pointsEarned: total,
        completedAt: Date.now(),
      })
    }

    setShowReward(true)
  }

  const handleContinue = () => {
    store.setCurrentRecommendation(null)
    store.clearCurrentActivity()
    navigate('/path')
  }

  if (showReward) {
    return (
      <div className="completion-screen reward-screen">
        <div className="reward-container">
          <div className="reward-header">
            <h1 className="reward-title">🎉 {t('amazing')}</h1>
            <p className="reward-subtitle">{t('youCompletedYourActivity')}</p>
          </div>

          <div className="reward-content">
            <div className="points-earned">
              <div className="points-number">+{pointsEarned}</div>
              <div className="points-label">{t('pointsEarned')}</div>
            </div>

            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-label">{t('totalActivities')}</span>
                <span className="stat-value">{store.completedActivities.length}</span>
              </div>
            </div>
          </div>

          <button className="button primary-button" onClick={handleContinue}>
            {t('path')} →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="completion-screen">
      <div className="completion-container">
        <h1 className="completion-title">{t('howWasYourActivity')}</h1>

        <div className="activity-summary">
          <div className="summary-info">
            <h2 className="summary-name">{activity.name}</h2>
            <p className="summary-location">📍 {activity.location.name}</p>
            <div className="summary-meta">
              <span>⏱️ {activity.duration} min</span>
              <span>💰 {activity.cost}</span>
            </div>
          </div>
        </div>

        <div className="rating-section">
          <h3 className="rating-label">{t('rateYourExperience')}</h3>
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ⭐
              </button>
            ))}
          </div>
          <p className="rating-text">
            {rating === 0 && t('clickToRate')}
            {rating === 1 && t('notGreat')}
            {rating === 2 && t('couldBeBetter')}
            {rating === 3 && t('good')}
            {rating === 4 && t('reallyGood')}
            {rating === 5 && t('perfect')}
          </p>
        </div>

        <div className="feedback-section">
          <label className="feedback-label">{t('shareYourThoughts')}</label>
          <textarea
            className="feedback-textarea"
            placeholder={t('feedbackPlaceholder')}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

        <div className="recommend-section">
          <h3 className="recommend-label">{t('wouldYouRecommend')}</h3>
          <div className="recommend-buttons">
            <button
              className={`recommend-button yes ${recommendation === 'yes' ? 'selected' : ''}`}
              onClick={() => setRecommendation('yes')}
            >
              👍 {t('yes')}
            </button>
            <button
              className={`recommend-button maybe ${recommendation === 'maybe' ? 'selected' : ''}`}
              onClick={() => setRecommendation('maybe')}
            >
              🤔 {t('maybe')}
            </button>
            <button
              className={`recommend-button no ${recommendation === 'no' ? 'selected' : ''}`}
              onClick={() => setRecommendation('no')}
            >
              👎 {t('no')}
            </button>
          </div>
        </div>

        <button
          className="button primary-button submit-button"
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          {t('completeActivity')}
        </button>

        <button className="button secondary-button" onClick={() => navigate('/bloom')}>
          {t('skip')}
        </button>
      </div>
    </div>
  )
}
