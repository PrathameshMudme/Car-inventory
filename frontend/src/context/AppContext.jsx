import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'enabled') {
      setDarkMode(true)
      document.body.classList.add('dark-mode')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.body.classList.add('dark-mode')
      localStorage.setItem('darkMode', 'enabled')
    } else {
      document.body.classList.remove('dark-mode')
      localStorage.setItem('darkMode', 'disabled')
    }
  }

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev])
  }

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    )
  }

  const value = {
    darkMode,
    toggleDarkMode,
    notifications,
    addNotification,
    markNotificationAsRead,
    activeSection,
    setActiveSection
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
