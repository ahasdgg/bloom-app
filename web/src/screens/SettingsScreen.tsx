import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { useTranslation } from '../i18n/useTranslation'
import './SettingsScreen.css'

const ACTIVITY_CATEGORIES = [
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
]

const CATEGORY_EMOJIS: Record<string, string> = {
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
}

export interface UserSettings {
  notificationsEnabled: boolean
  selectedCategories: string[]
  budgetMin: number
  budgetMax: number
  maxDistance: number
  shareLocation: boolean
  shareCalendar: boolean
  allowAnalytics: boolean
}

export default function SettingsScreen() {
  const store = useAppStore()
  const { t } = useTranslation()
  const [clearConfirm, setClearConfirm] = useState(false)
  const [cleared, setCleared] = useState(false)
  const isRu = store.language === 'ru'

  const handleClearHistory = () => {
    store.reset()
    setClearConfirm(false)
    setCleared(true)
    setTimeout(() => setCleared(false), 2500)
  }

  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    selectedCategories: ['yoga', 'nature', 'relaxation'],
    budgetMin: 0,
    budgetMax: 100,
    maxDistance: 5,
    shareLocation: true,
    shareCalendar: true,
    allowAnalytics: false,
  })

  const [isSaved, setIsSaved] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('userSettings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleCategoryToggle = (category: string) => {
    setSettings(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category],
    }))
  }

  const handleNotificationsToggle = () => {
    setSettings(prev => ({
      ...prev,
      notificationsEnabled: !prev.notificationsEnabled,
    }))
  }

  const handleBudgetMinChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      budgetMin: Math.min(value, prev.budgetMax),
    }))
  }

  const handleBudgetMaxChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      budgetMax: Math.max(value, prev.budgetMin),
    }))
  }

  const handleDistanceChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      maxDistance: value,
    }))
  }

  const handlePrivacyToggle = (key: 'shareLocation' | 'shareCalendar' | 'allowAnalytics') => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <h1 className="settings-title">{t('settings')}</h1>

        {/* Language Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('language')}</h2>
          <div className="language-buttons">
            <button
              className={`language-button ${store.language === 'en' ? 'active' : ''}`}
              onClick={() => store.setLanguage('en')}
            >
              🇬🇧 English
            </button>
            <button
              className={`language-button ${store.language === 'ru' ? 'active' : ''}`}
              onClick={() => store.setLanguage('ru')}
            >
              🇷🇺 Русский
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('notifications')}</h2>
          <div className="setting-item">
            <label className="setting-label">{t('notifications')}</label>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={handleNotificationsToggle}
              className="setting-checkbox"
            />
          </div>
        </div>

        {/* Activity Preferences Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('activityCategories')}</h2>
          <p className="section-description">
            {t('selectFavoriteActivities')}
          </p>
          <div className="categories-grid">
            {ACTIVITY_CATEGORIES.map(category => (
              <button
                key={category}
                className={`category-button ${
                  settings.selectedCategories.includes(category) ? 'active' : ''
                }`}
                onClick={() => handleCategoryToggle(category)}
              >
                <span className="category-emoji">
                  {CATEGORY_EMOJIS[category]}
                </span>
                <span className="category-name">
                  {category.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('budget')}</h2>
          <div className="budget-container">
            <div className="budget-item">
              <label className="budget-label">Min ($)</label>
              <input
                type="number"
                min="0"
                max={settings.budgetMax}
                value={settings.budgetMin}
                onChange={e => handleBudgetMinChange(Number(e.target.value))}
                className="budget-input"
              />
            </div>
            <div className="budget-item">
              <label className="budget-label">Max ($)</label>
              <input
                type="number"
                min={settings.budgetMin}
                max="10000"
                value={settings.budgetMax}
                onChange={e => handleBudgetMaxChange(Number(e.target.value))}
                className="budget-input"
              />
            </div>
          </div>
        </div>

        {/* Distance Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('distance')}</h2>
          <div className="distance-container">
            <input
              type="range"
              min="1"
              max="50"
              value={settings.maxDistance}
              onChange={e => handleDistanceChange(Number(e.target.value))}
              className="distance-slider"
            />
            <div className="distance-value">{settings.maxDistance} km</div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('privacy')}</h2>
          <div className="privacy-item">
            <span className="privacy-label">{t('shareLocation')}</span>
            <input
              type="checkbox"
              checked={settings.shareLocation}
              onChange={() => handlePrivacyToggle('shareLocation')}
              className="setting-checkbox"
            />
          </div>
          <div className="privacy-item">
            <span className="privacy-label">{t('shareCalendar')}</span>
            <input
              type="checkbox"
              checked={settings.shareCalendar}
              onChange={() => handlePrivacyToggle('shareCalendar')}
              className="setting-checkbox"
            />
          </div>
          <div className="privacy-item">
            <span className="privacy-label">{t('allowAnalytics')}</span>
            <input
              type="checkbox"
              checked={settings.allowAnalytics}
              onChange={() => handlePrivacyToggle('allowAnalytics')}
              className="setting-checkbox"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-section">
          <button className="save-button" onClick={saveSettings}>
            {isSaved ? '✓ ' + t('settingsSaved') : t('saveSettings')}
          </button>
        </div>

        {/* Clear History Section */}
        <div className="settings-section">
          <h2 className="section-title">{isRu ? 'Данные' : 'Data'}</h2>
          {cleared ? (
            <div className="clear-success">
              ✓ {isRu ? 'История очищена' : 'History cleared'}
            </div>
          ) : clearConfirm ? (
            <div className="clear-confirm-box">
              <p className="clear-confirm-text">
                {isRu
                  ? 'Удалить всю историю активностей и события? Это действие нельзя отменить.'
                  : 'Delete all activity history and events? This cannot be undone.'}
              </p>
              <div className="clear-confirm-btns">
                <button className="clear-btn-cancel" onClick={() => setClearConfirm(false)}>
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button className="clear-btn-confirm" onClick={handleClearHistory}>
                  {isRu ? 'Удалить' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button className="clear-history-btn" onClick={() => setClearConfirm(true)}>
              🗑 {isRu ? 'Очистить историю' : 'Clear History'}
            </button>
          )}
        </div>

        <div className="settings-footer">
          <p className="footer-text">
            {t('allChangesSaved')}
          </p>
        </div>
      </div>
    </div>
  )
}
