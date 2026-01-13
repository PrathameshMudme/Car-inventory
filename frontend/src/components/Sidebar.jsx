import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Sidebar.css'

const Sidebar = ({ menuItems, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      purchase: 'Purchase Manager',
      sales: 'Sales Manager',
      delivery: 'Delivery Manager'
    }
    return roleNames[role] || role
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <i className="fas fa-car-side"></i>
        <h2>Vehicle Mgmt</h2>
        <div className="user-info">
          <div className="user-role">{getRoleDisplayName(user?.role)}</div>
          <div className="user-email">{user?.email}</div>
        </div>
      </div>
      <ul className="nav-menu">
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button className="btn btn-logout" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar
