import React, { useEffect } from 'react'
import '../styles/Toast.css'

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }

  return (
    <div className={`toast ${type}`}>
      <i className={`fas ${icons[type]}`}></i>
      <span>{message}</span>
      <i className="fas fa-times" onClick={onClose}></i>
    </div>
  )
}

export default Toast
