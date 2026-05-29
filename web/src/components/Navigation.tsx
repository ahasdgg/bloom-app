import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { useAppStore } from '../store'
import './Navigation.css'

const Navigation: React.FC = () => {
  const location = useLocation()
  const { t }    = useTranslation()
  const store    = useAppStore()
  const lang     = store.language

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navigation">
      <Link to="/path" className={`nav-item ${isActive('/path') ? 'active' : ''}`}>
        <span className="nav-icon">🗓️</span>
        <span className="nav-label">{t('path')}</span>
      </Link>

      <Link to="/discover" className={`nav-item ${isActive('/discover') ? 'active' : ''}`}>
        <span className="nav-icon">🎭</span>
        <span className="nav-label">{lang === 'ru' ? 'Афиша' : 'Events'}</span>
      </Link>

      <Link to="/active" className={`nav-item ${isActive('/active') ? 'active' : ''}`}>
        <span className="nav-icon">🔴</span>
        <span className="nav-label">{t('active')}</span>
      </Link>

      <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
        <span className="nav-icon">💬</span>
        <span className="nav-label">{lang === 'ru' ? 'AI Чат' : 'AI Chat'}</span>
      </Link>

      <Link to="/seed" className={`nav-item ${isActive('/seed') ? 'active' : ''}`}>
        <span className="nav-icon">🌱</span>
        <span className="nav-label">{t('discover')}</span>
      </Link>

      <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">{t('settings')}</span>
      </Link>
    </nav>
  )
}

export default Navigation
