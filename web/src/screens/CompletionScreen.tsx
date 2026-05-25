import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './CompletionScreen.css'

interface CompletionData {
  activityName: string
  location: string
  duration: number
  cost: string
  category: string
  imageUrl?: string
}

export default function CompletionScreen() {
  const navigate = useNavigate()
  const store = useAppStore()
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [recommendation, setRecommendation] = useState<'yes' | 'maybe' | 'no' | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [plantUnlocked, setPlantUnlocked] = useState<string | null>(null)

  // Get activity from store or use default
  const activity = store.currentRecommendation?.activity || {
    name: 'Activity',
    location: { name: 'Location' },
    duration: 60,
    cost: 'free',
    category: 'adventure',
  }

  const handleRating = (stars: number) => {
    setRating(stars)
  }

  const handleSubmit = () => {
    // Calculate points based on rating and duration
    const basePoints = Math.floor(store.currentRecommendation?.activity.duration || 60 / 30)
    const ratingBonus = rating * 10
    const totalPoints = basePoints + ratingBonus

    setPointsEarned(totalPoints)

    // Determine if plant is unlocked (every 100 points)
    const currentPoints = store.gardenProgress.points
    const newTotal = currentPoints + totalPoints
    if (Math.floor(newTotal / 100) > Math.floor(currentPoints / 100)) {
      const plants = ['🌱', '🌿', '🌾', '🌳', '🌲', '🎋', '🌴', '🌵']
      setPlantUnlocked(plants[Math.floor(newTotal / 100) % plants.length])
    }

    // Update garden progress
    store.updateGardenProgress({
      totalActivities: store.gardenProgress.totalActivities + 1,
      points: newTotal,
      achievements: updateAchievements(
        store.gardenProgress.achievements,
        store.gardenProgress.totalActivities + 1,
        rating
      ),
    })

    // Add to completed activities (not just history)
    if (store.currentRecommendation) {
      store.addCompletedActivity({
        ...store.currentRecommendation,
        id: 'completed_' + Date.now(),
        rating,
        feedback,
        recommendation: recommendation || 'yes',
        pointsEarned,
        completedAt: Date.now(),
      })
    }

    setShowReward(true)
  }

  const updateAchievements = (
    current: string[],
    totalActivities: number,
    rating: number
  ): string[] => {
    const achievements = [...current]

    // Milestone achievements
    if (totalActivities === 1 && !achievements.includes('first_activity')) {
      achievements.push('first_activity')
    }
    if (totalActivities === 5 && !achievements.includes('five_activities')) {
      achievements.push('five_activities')
    }
    if (totalActivities === 10 && !achievements.includes('ten_activities')) {
      achievements.push('ten_activities')
    }

    // Rating achievements
    if (rating === 5 && !achievements.includes('perfect_rating')) {
      achievements.push('perfect_rating')
    }

    return achievements
  }

  const getAchievementName = (id: string): string => {
    const names: Record<string, string> = {
      first_activity: '🌱 First Step',
      five_activities: '🌿 Growing',
      ten_activities: '🌳 Flourishing',
      perfect_rating: '⭐ Perfect Day',
    }
    return names[id] || id
  }

  const handleContinue = () => {
    // ✅ НОВОЕ: Full state reset
    store.setCurrentRecommendation(null)
    store.clearCurrentActivity()  // ← Hard reset
    navigate('/garden')
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

            {plantUnlocked && (
              <div className="plant-unlocked">
                <div className="plant-emoji">{plantUnlocked}</div>
                <div className="plant-label">{t('newPlantUnlocked')}</div>
              </div>
            )}

            {store.gardenProgress.achievements.length > 0 && (
              <div className="achievements-section">
                <h3 className="achievements-title">{t('yourAchievements')}</h3>
                <div className="achievements-list">
                  {store.gardenProgress.achievements.map((achievement, idx) => (
                    <div key={idx} className="achievement-badge">
                      {getAchievementName(achievement)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-label">{t('totalActivities')}</span>
                <span className="stat-value">{store.gardenProgress.totalActivities}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('totalPoints')}</span>
                <span className="stat-value">{store.gardenProgress.points}</span>
              </div>
            </div>
          </div>

          <button className="button primary-button" onClick={handleContinue}>
            {t('viewYourGarden')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="completion-screen">
      <div className="completion-container">
        <h1 className="completion-title">{t('howWasYourActivity')}</h1>

        {/* Activity Summary */}
        <div className="activity-summary">
          {activity.imageUrl && (
            <img src={activity.imageUrl} alt={activity.name} className="summary-image" />
          )}
          <div className="summary-info">
            <h2 className="summary-name">{activity.name}</h2>
            <p className="summary-location">📍 {activity.location.name}</p>
            <div className="summary-meta">
              <span>⏱️ {activity.duration} min</span>
              <span>💰 {activity.cost}</span>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="rating-section">
          <h3 className="rating-label">{t('rateYourExperience')}</h3>
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => handleRating(star)}
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

        {/* Feedback Section */}
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

        {/* Would You Recommend */}
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

        {/* Submit Button */}
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
