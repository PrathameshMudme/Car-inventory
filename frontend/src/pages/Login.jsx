import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Login.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Login = () => {
  const [email, setEmail] = useState('admin@vehicle.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        const userRole = result.user.role
        
        // Map role to route
        const roleRoutes = {
          admin: '/admin',
          purchase: '/purchase',
          sales: '/sales'
        }
        
        navigate(roleRoutes[userRole] || '/admin')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <i className="fas fa-car-side"></i>
          <h1>Vehicle Management System</h1>
          <p>Welcome back! Please login to continue</p>
        </div>
        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <i className="fas fa-envelope"></i> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Login
              </>
            )}
          </button>
        </form>
        <div className="login-footer">
          <p><strong>Demo Credentials:</strong></p>
          <p>Admin: admin@vehicle.com / admin123</p>
          <p>Purchase: rajesh@vehicle.com / password123</p>
          <p>Sales: priya@vehicle.com / password123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
