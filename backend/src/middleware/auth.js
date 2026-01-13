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

    // Map role names
    const roleMap = {
      'admin': 'admin',
      'Purchase Manager': 'purchase',
      'Sales Manager': 'sales',
      'purchase': 'purchase',
      'sales': 'sales'
    }

    const userRole = roleMap[req.user.role] || req.user.role

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      })
    }

    next()
  }
}

module.exports = { authenticate, authorize }
