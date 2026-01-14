const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    if (user.status === 'Disabled') {
      return res.status(403).json({ message: 'Account is disabled' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' })
  }
}

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    // Map role names to normalized values
    // Database stores: 'admin', 'purchase', 'sales' (lowercase)
    // Frontend may display: 'admin', 'Purchase Manager', 'Sales Manager'
    const roleMap = {
      'admin': 'admin',
      'Admin': 'admin',
      'ADMIN': 'admin',
      'Purchase Manager': 'purchase',
      'purchase manager': 'purchase',
      'Purchase': 'purchase',
      'purchase': 'purchase',
      'Sales Manager': 'sales',
      'sales manager': 'sales',
      'Sales': 'sales',
      'sales': 'sales'
    }

    // Normalize user role (case-insensitive lookup)
    const userRoleRaw = (req.user.role || '').trim()
    const userRole = roleMap[userRoleRaw] || roleMap[userRoleRaw.toLowerCase()] || userRoleRaw.toLowerCase()

    // Normalize required roles for comparison (also handle 'admin' -> 'admin')
    const normalizedRoles = roles.map(role => {
      const normalized = roleMap[role] || roleMap[role.toLowerCase()] || role.toLowerCase()
      return normalized
    })

    // Debug logging (remove in production if needed)
    console.log(`[AUTH] User: ${req.user.email}, Role: "${req.user.role}" (normalized: "${userRole}"), Required: ${roles.join(', ')} (normalized: ${normalizedRoles.join(', ')})`)

    if (!normalizedRoles.includes(userRole)) {
      console.error(`[AUTH] Authorization failed: User role "${req.user.role}" (mapped to "${userRole}") not in required roles: ${roles.join(', ')} (normalized: ${normalizedRoles.join(', ')})`)
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
      })
    }

    next()
  }
}

module.exports = { authenticate, authorize }
