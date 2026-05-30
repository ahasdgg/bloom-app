import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import SeedScreen from './screens/SeedScreen'
import BloomScreen from './screens/BloomScreen'
import ActiveScreen from './screens/ActiveScreen'
import PathScreen from './screens/PathScreen'
import SettingsScreen from './screens/SettingsScreen'
import CompletionScreen from './screens/CompletionScreen'
import DiscoverScreen from './screens/DiscoverScreen'
import ChatScreen from './screens/ChatScreen'
import { useAppStore } from './store'
import './theme.css'
import './App.css'

function App() {
  const { userId, setUserId } = useAppStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!userId) {
      setUserId('user_' + Date.now())
    }
    setIsInitialized(true)
  }, [setUserId, userId])

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Breath of Fresh Air...</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/path" replace />} />
          <Route path="/seed" element={<SeedScreen />} />
          <Route path="/discover" element={<DiscoverScreen />} />
          <Route path="/bloom" element={<BloomScreen />} />
          <Route path="/active" element={<ActiveScreen />} />
          <Route path="/path" element={<PathScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/completion" element={<CompletionScreen />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  )
}

export default App
