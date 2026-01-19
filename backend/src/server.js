const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const multer = require('multer')
const connectDB = require('./config/database')

dotenv.config()

const app = express()

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/vehicles', require('./routes/vehicles'))
app.use('/api/agents', require('./routes/agents'))
// Keep /api/dealers route for backward compatibility only (delegates to agents route - use /api/agents instead)
app.use('/api/dealers', require('./routes/agents'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Error handling middleware (must be after routes)
app.use((error, req, res, next) => {
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ 
      message: 'File upload error', 
      error: error.message 
    })
  }
  
  // Handle file filter errors
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      message: error.message,
      error: 'File type validation failed'
    })
  }
  
  // Handle other errors
  console.error('Server error:', error)
  res.status(error.status || 500).json({ 
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
