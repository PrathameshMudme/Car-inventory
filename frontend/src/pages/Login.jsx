import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import '../styles/Login.css'

const Login = () => {
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const performLogin = async (userEmail, userPassword) => {
    setError('')
    setLoading(true)

    try {
      const result = await login(userEmail, userPassword)
      
      if (result.success) {
        const userRole = result.user.role
        const userName = result.user.name || result.user.email
        
        // Show success toast
        showToast(`Welcome back, ${userName}!`, 'success')
        
        // Map role to route
        const roleRoutes = {
          admin: '/admin',
          purchase: '/purchase',
          sales: '/sales'
        }
        
        navigate(roleRoutes[userRole] || '/admin')
      } else {
        const errorMsg = result.error || 'Login failed'
        setError(errorMsg)
        showToast(errorMsg, 'error')
      }
    } catch (err) {
      const errorMsg = 'An error occurred. Please try again.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await performLogin(email, password)
  }

  const handleQuickLogin = async (role, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    try {
      if (loading) {
        return
      }

      const credentials = {
        admin: { email: 'admin@test.com', password: 'admin123' },
        purchase: { email: 'purchase1@test.com', password: 'password123' },
        sales: { email: 'sales1@test.com', password: 'password123' }
      }

      const creds = credentials[role]
      if (!creds) {
        setError(`Invalid role: ${role}`)
        showToast('Invalid login role', 'error')
        return
      }

      setEmail(creds.email)
      setPassword(creds.password)
      await performLogin(creds.email, creds.password)
    } catch (error) {
      console.error('Quick login error:', error)
      setError('Quick login failed. Please try again.')
      showToast('Quick login failed', 'error')
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

        {/* Quick Login Buttons for Testing */}
        <div className="quick-login-section">
          <div className="quick-login-divider">
            <span>Quick Login (Testing)</span>
          </div>
          <div className="quick-login-buttons">
            <button
              type="button"
              className="btn-quick-login btn-quick-admin"
              onClick={(e) => handleQuickLogin('admin', e)}
              disabled={loading}
              style={{ pointerEvents: loading ? 'none' : 'auto', zIndex: 1 }}
              title="Login as Admin (admin@test.com)"
            >
              <i className="fas fa-user-shield"></i>
              <span>Admin</span>
            </button>
            <button
              type="button"
              className="btn-quick-login btn-quick-purchase"
              onClick={(e) => handleQuickLogin('purchase', e)}
              disabled={loading}
              style={{ pointerEvents: loading ? 'none' : 'auto', zIndex: 1 }}
              title="Login as Purchase Manager (purchase1@test.com)"
            >
              <i className="fas fa-shopping-cart"></i>
              <span>Purchase</span>
            </button>
            <button
              type="button"
              className="btn-quick-login btn-quick-sales"
              onClick={(e) => handleQuickLogin('sales', e)}
              disabled={loading}
              style={{ pointerEvents: loading ? 'none' : 'auto', zIndex: 1 }}
              title="Login as Sales Manager (sales1@test.com)"
            >
              <i className="fas fa-handshake"></i>
              <span>Sales</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p><strong>Test Credentials:</strong></p>
          <p>Admin: admin@test.com / admin123</p>
          <p>Purchase Manager 1: purchase1@test.com / password123</p>
          <p>Purchase Manager 2: purchase2@test.com / password123</p>
          <p>Sales Manager 1: sales1@test.com / password123</p>
          <p>Sales Manager 2: sales2@test.com / password123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
