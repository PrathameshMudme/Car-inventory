import React, { createContext, useContext } from 'react'
import { toast } from 'react-toastify'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const showToast = (message, type = 'info', options = {}) => {
    const defaultOptions = {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
      ...options
    }

    switch (type) {
      case 'success':
        toast.success(message, defaultOptions)
        break
      case 'error':
        toast.error(message, defaultOptions)
        break
      case 'warning':
        toast.warn(message, defaultOptions)
        break
      case 'info':
      default:
        toast.info(message, defaultOptions)
        break
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  )
}
