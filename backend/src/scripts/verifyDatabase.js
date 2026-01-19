/**
 * Script to verify database contents
 * Shows counts and sample data from all collections
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../models/User')
const Vehicle = require('../models/Vehicle')
const VehicleImage = require('../models/VehicleImage')
const VehicleDocument = require('../models/VehicleDocument')
const connectDB = require('../config/database')

dotenv.config()

const verifyDatabase = async () => {
  try {
    await connectDB()
    console.log('\n📊 Verifying Database Contents...\n')

    // Check Users
    const userCount = await User.countDocuments()
    console.log(`👥 Users: ${userCount}`)
    if (userCount > 0) {
      const users = await User.find().select('name email role status').limit(10)
      console.log('   Sample users:')
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.status}`)
      })
    }

    // Check Vehicles
    const vehicleCount = await Vehicle.countDocuments()
    console.log(`\n🚗 Vehicles: ${vehicleCount}`)
    if (vehicleCount > 0) {
      const vehicles = await Vehicle.find().select('vehicleNo make model status purchasePrice').limit(10)
      console.log('   Sample vehicles:')
      vehicles.forEach(vehicle => {
        console.log(`   - ${vehicle.vehicleNo} - ${vehicle.make} ${vehicle.model || ''} - ${vehicle.status}`)
      })
      
      // Status breakdown
      const statusCounts = await Vehicle.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      console.log('\n   Status breakdown:')
      statusCounts.forEach(stat => {
        console.log(`   - ${stat._id}: ${stat.count}`)
      })
    }

    // Check Images
    const imageCount = await VehicleImage.countDocuments()
    console.log(`\n🖼️  Vehicle Images: ${imageCount}`)

    // Check Documents
    const documentCount = await VehicleDocument.countDocuments()
    console.log(`\n📄 Vehicle Documents: ${documentCount}`)

    // Database info
    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()
    console.log(`\n📦 Collections in database: ${collections.length}`)
    collections.forEach(col => {
      console.log(`   - ${col.name}`)
    })

    console.log(`\n✅ Database verification complete!`)
    console.log(`\n💡 To view in MongoDB Compass:`)
    console.log(`   1. Open MongoDB Compass`)
    console.log(`   2. Connect to: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle-management'}`)
    console.log(`   3. Browse collections`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error verifying database:', error)
    process.exit(1)
  }
}

verifyDatabase()
