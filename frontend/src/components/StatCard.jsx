import React from 'react'
import '../styles/StatCard.css'

const StatCard = ({ icon, iconClass, title, value, label, trend }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <i className={icon}></i>
      </div>
      <div className="stat-details">
        <h3>{title}</h3>
        <div className="stat-number">{value}</div>
        <div className="stat-label">
          {trend && (
            <span className={`trend ${trend.direction}`}>
              <i className={`fas fa-arrow-${trend.direction}`}></i> {trend.value}
            </span>
          )}
          {label}
        </div>
      </div>
    </div>
  )
}

export default StatCard
