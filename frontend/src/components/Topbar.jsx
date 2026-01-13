import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import NotificationPanel from './NotificationPanel'
import '../styles/Topbar.css'

const Topbar = ({ title, quickStats }) => {
  const { darkMode, toggleDarkMode, notifications } = useApp()
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div className="topbar-actions">
        {quickStats && (
          <div className="quick-stats-mini">
            {quickStats.map((stat, index) => (
              <div key={index} className="mini-stat">
                <i className={stat.icon}></i>
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
        <button
          className="btn-icon"
          title="Dark Mode"
          onClick={toggleDarkMode}
        >
          <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
        </button>
        <button
          className="btn-icon"
          title="Notifications"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
        </button>
        <div className="user-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <img
            src={`https://ui-avatars.com/api/?name=${user?.name}&background=667eea&color=fff`}
            alt={user?.name}
          />
          {showProfileMenu && (
            <div className="profile-dropdown active">
              <div className="profile-info">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <hr />
              <a href="#">
                <i className="fas fa-user"></i> Profile
              </a>
              <a href="#">
                <i className="fas fa-cog"></i> Settings
              </a>
            </div>
          )}
        </div>
      </div>
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  )
}

export default Topbar
