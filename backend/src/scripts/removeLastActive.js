const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../models/User')
const connectDB = require('../config/database')

dotenv.config()

const removeLastActive = async () => {
  try {
    await connectDB()

    // Remove lastActive field from all users
    const result = await User.updateMany(
      {},
      { $unset: { lastActive: '' } }
    )

    console.log(`✅ Successfully removed lastActive field from ${result.modifiedCount} users`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error removing lastActive field:', error)
    process.exit(1)
  }
}

removeLastActive()
