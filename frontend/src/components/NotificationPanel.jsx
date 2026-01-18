import React, { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import '../styles/NotificationPanel.css'

const NotificationPanel = ({ onClose }) => {
  const { notifications, markNotificationAsRead } = useApp()

  useEffect(() => {
    // Mark notifications as read when panel opens
    const timer = setTimeout(() => {
      notifications.forEach(notif => {
        if (!notif.read) {
          markNotificationAsRead(notif.id)
        }
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="notification-panel active">
      <div className="notification-header">
        <h3>
          <i className="fas fa-bell"></i> Notifications
        </h3>
        <button className="btn-icon-small" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-item">
            <div className="notification-content">
              <p>No notifications</p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? '' : 'unread'}`}
            >
              <div className={`notification-icon ${notif.type || 'blue'}`}>
                <i className={notif.icon || 'fas fa-info-circle'}></i>
              </div>
              <div className="notification-content">
                <strong>{notif.title}</strong>
                <p>{notif.message}</p>
                <span className="notification-time">{notif.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="notification-footer">
        <a href="#" className="view-all-link">
          View All Notifications
        </a>
      </div>
    </div>
  )
}

export default NotificationPanel
