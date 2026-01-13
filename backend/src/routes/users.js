const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// Generate avatar URL
const generateAvatar = (name) => {
  const colors = ['3498db', 'e74c3c', '27ae60', 'f39c12', '9b59b6', '1abc9c']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff`
}

// Map role names
const mapRole = (role) => {
  const roleMap = {
    'Admin': 'admin',
    'Purchase Manager': 'purchase',
    'Sales Manager': 'sales',
    'admin': 'admin',
    'purchase': 'purchase',
    'sales': 'sales'
  }
  return roleMap[role] || role
}

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    
    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'Admin' : 
            user.role === 'purchase' ? 'Purchase Manager' : 
            'Sales Manager',
      contact: user.contact,
      status: user.status,
      avatar: user.avatar || generateAvatar(user.name),
      badgeClass: user.role === 'admin' ? 'badge-danger' :
                  user.role === 'purchase' ? 'badge-purple' :
                  'badge-blue'
    }))

    res.json(formattedUsers)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, contact, password } = req.body

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const mappedRole = mapRole(role)

    const user = new User({
      name,
      email: email.toLowerCase(),
      role: mappedRole,
      contact: contact || 'N/A',
      password,
      status: 'Active',
      avatar: generateAvatar(name)
    })

    await user.save()

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        contact: user.contact,
        status: user.status,
        avatar: user.avatar,
        badgeClass: mappedRole === 'admin' ? 'badge-danger' :
                    mappedRole === 'purchase' ? 'badge-purple' :
                    'badge-blue'
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/users/:id/password
// @desc    Change user password
// @access  Private (Admin only)
// NOTE: This route MUST come before /:id route to avoid route conflicts
router.put('/:id/password', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide new password and confirmation' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/users/:id/status
// @desc    Toggle user status (Active/Disabled)
// @access  Private (Admin only)
// NOTE: This route MUST come before /:id route to avoid route conflicts
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.status = user.status === 'Active' ? 'Disabled' : 'Active'
    await user.save()

    res.json({
      message: `User ${user.status === 'Active' ? 'enabled' : 'disabled'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'Admin' : 
              user.role === 'purchase' ? 'Purchase Manager' : 
              'Sales Manager',
        contact: user.contact,
        status: user.status,
        avatar: user.avatar,
        badgeClass: user.role === 'admin' ? 'badge-danger' :
                    user.role === 'purchase' ? 'badge-purple' :
                    'badge-blue'
      }
    })
  } catch (error) {
    console.error('Toggle status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
// NOTE: This route must come AFTER specific routes like /:id/password and /:id/status
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, contact } = req.body

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' })
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID format' })
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: req.params.id }
    })
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const mappedRole = mapRole(role)

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email: email.toLowerCase(),
        role: mappedRole,
        contact: contact || 'N/A',
        avatar: generateAvatar(name)
      },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        contact: user.contact,
        status: user.status,
        avatar: user.avatar,
        badgeClass: mappedRole === 'admin' ? 'badge-danger' :
                    mappedRole === 'purchase' ? 'badge-purple' :
                    'badge-blue'
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
