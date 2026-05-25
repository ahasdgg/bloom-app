import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedSphere from '../components/AnimatedSphere'
import { useAppStore, Recommendation } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './SeedScreen.css'

const MOCK_ACTIVITIES = [
  {
    name: 'Yoga in the Park',
    description: 'Relaxing yoga session in a beautiful park setting with nature sounds',
    category: 'yoga',
    location: {
      name: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      address: 'Central Park, New York, NY',
    },
    duration: 60,
    difficulty: 'easy',
    cost: 'free',
    indoor: false,
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=300&fit=crop',
    reasoning: 'Perfect for a calm afternoon. The weather is beautiful, you have 2 hours free, and yoga is one of your favorite activities.',
  },
  {
    name: 'Mountain Hiking',
    description: 'Scenic hiking trail with breathtaking views and fresh mountain air',
    category: 'hiking',
    location: {
      name: 'Rocky Mountains',
      latitude: 39.7392,
      longitude: -104.9903,
      address: 'Rocky Mountains, Colorado',
    },
    duration: 180,
    difficulty: 'medium',
    cost: 'free',
    indoor: false,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    reasoning: 'Great weather for hiking! You have the whole afternoon free and hiking is perfect for your energy level.',
  },
  {
    name: 'Cycling Tour',
    description: 'Leisurely bike ride through scenic neighborhoods and parks',
    category: 'cycling',
    location: {
      name: 'Riverside Path',
      latitude: 40.7614,
      longitude: -73.9776,
      address: 'Hudson River Greenway, New York, NY',
    },
    duration: 90,
    difficulty: 'easy',
    cost: 'free',
    indoor: false,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
    reasoning: 'Perfect cycling weather! The path is beautiful this time of day and you have 2 hours available.',
  },
  {
    name: 'Art Gallery Visit',
    description: 'Explore contemporary art and cultural exhibitions',
    category: 'arts',
    location: {
      name: 'Modern Art Museum',
      latitude: 40.7614,
      longitude: -73.9776,
      address: 'Museum of Modern Art, New York, NY',
    },
    duration: 120,
    difficulty: 'easy',
    cost: '$25',
    costAmount: 25,
    indoor: true,
    imageUrl: 'https://images.unsplash.com/photo-1578926078328-123456789012?w=500&h=300&fit=crop',
    reasoning: 'Great indoor activity for today. New exhibitions just opened and it matches your interests.',
  },
  {
    name: 'Outdoor Picnic',
    description: 'Relaxing picnic with friends in a scenic location',
    category: 'social',
    location: {
      name: 'Riverside Park',
      latitude: 40.7505,
      longitude: -73.9972,
      address: 'Riverside Park, New York, NY',
    },
    duration: 120,
    difficulty: 'easy',
    cost: 'free',
    indoor: false,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561404?w=500&h=300&fit=crop',
    reasoning: 'Perfect weather for a picnic! You have plenty of time and it\'s a great way to relax.',
  },
  {
    name: 'Rock Climbing',
    description: 'Indoor rock climbing session with professional instructors',
    category: 'climbing',
    location: {
      name: 'Climbing Gym',
      latitude: 40.7489,
      longitude: -73.9680,
      address: 'Chelsea Piers, New York, NY',
    },
    duration: 120,
    difficulty: 'medium',
    cost: '$30',
    costAmount: 30,
    indoor: true,
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=500&h=300&fit=crop',
    reasoning: 'Great for an active afternoon! You have the time and climbing is perfect for your fitness level.',
  },
]

const SeedScreen: React.FC = () => {
  const navigate = useNavigate()
  const store = useAppStore()
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRecommendation = () => {
    // Pick random activity
    const randomActivity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)]

    // Create recommendation
    const mockRecommendation: Recommendation = {
      id: 'rec_' + Date.now(),
      activity: randomActivity,
      relevanceScore: 0.85 + Math.random() * 0.15,
      reasoning: randomActivity.reasoning,
      contextSnapshot: {
        temperature: 18 + Math.floor(Math.random() * 12),
        weather: [t('weatherSunny'), t('weatherCloudy'), t('weatherPartlyCloudy')][Math.floor(Math.random() * 3)],
        timeOfDay: t('timeAfternoon'),
        availableTime: 60 + Math.floor(Math.random() * 180),
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    }

    return mockRecommendation
  }

  const handleSpherePress = async () => {
    if (isGenerating) return

    try {
      setIsGenerating(true)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const recommendation = generateRecommendation()
      store.setCurrentRecommendation(recommendation)
      // НЕ добавляем в историю - это просто рекомендация, не завершенная активность

      setIsGenerating(false)
      navigate('/bloom')
    } catch (error) {
      console.error('Failed to generate recommendation:', error)
      setIsGenerating(false)
    }
  }

  return (
    <div className="seed-screen">
      <div className="seed-content">
        <div className="seed-header">
          <h1 className="greeting">{t('seedGreeting')}</h1>
          <p className="subtitle">{t('seedSubtitle')}</p>
          <p className="description">{t('seedDescription')}</p>
        </div>

        <div className="sphere-wrapper">
          {isGenerating ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t('loading')}</p>
            </div>
          ) : (
            <AnimatedSphere onPress={handleSpherePress} isLoading={isGenerating} />
          )}
        </div>

        <div className="seed-footer">
          <p className="footer-text">{t('seedFooter')}</p>
        </div>
      </div>
    </div>
  )
}

export default SeedScreen
