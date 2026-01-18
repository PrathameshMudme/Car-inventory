const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle-management')

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    console.log(`📊 Database: ${conn.connection.name}`)
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message)
    console.error('\n💡 Make sure MongoDB is running!')
    process.exit(1)
  }
}

module.exports = connectDB
