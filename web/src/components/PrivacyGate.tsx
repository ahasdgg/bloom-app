import React from 'react'
import { useAppStore } from '../store'
import './PrivacyGate.css'

type PrivacyGateProps = {
  children: React.ReactNode
  className?: string
  title?: string
  revealLabel?: string
}

export default function PrivacyGate({
  children,
  className,
  title = 'Контент скрыт',
  revealLabel = 'Показать',
}: PrivacyGateProps) {
  const unlocked = useAppStore(s => s.privacyUnlocked)
  const enabled = useAppStore(s => s.privacyBlurEnabled)
  const setUnlocked = useAppStore(s => s.setPrivacyUnlocked)

  if (!enabled || unlocked) {
    return <>{children}</>
  }

  return (
    <div className={['pg', className].filter(Boolean).join(' ')}>
      <div className="pg__blur" aria-hidden="true">
        {children}
      </div>
      <div className="pg__overlay">
        <div className="pg__title">{title}</div>
        <button className="pg__btn" onClick={() => setUnlocked(true)}>
          {revealLabel}
        </button>
      </div>
    </div>
  )
}

