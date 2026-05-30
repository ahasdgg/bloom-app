import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'
const DARK_THEME = 'dark-green'

interface Props { inline?: boolean }

const ThemeToggle: React.FC<Props> = ({ inline = false }) => {
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' }
  })

  useEffect(() => {
    try {
      if (theme === DARK_THEME) document.documentElement.setAttribute('data-theme', DARK_THEME)
      else document.documentElement.removeAttribute('data-theme')
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      // ignore
    }
  }, [theme])

  const toggle = () => setTheme(t => (t === DARK_THEME ? '' : DARK_THEME))

  const cls = `theme-toggle ${inline ? 'theme-toggle--inline' : 'theme-toggle--fixed'}`

  return (
    <button className={cls} onClick={toggle} aria-label="Toggle theme">
      {theme === DARK_THEME ? '🟢 Dark' : '⚪ Light'}
    </button>
  )
}

export default ThemeToggle
