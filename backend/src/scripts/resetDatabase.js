/**
 * Script to completely reset the database
 * Removes all vehicles, images, documents, and related data
 * Use this before seeding fresh test data
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Vehicle = require('../models/Vehicle')
const VehicleImage = require('../models/VehicleImage')
const VehicleDocument = require('../models/VehicleDocument')
const User = require('../models/User')
const Report = require('../models/Report')
const connectDB = require('../config/database')

dotenv.config()

const resetDatabase = async () => {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

    console.log('\n🗑️  Starting database reset...\n')

    // Count existing data
    const vehicleCount = await Vehicle.countDocuments()
    const imageCount = await VehicleImage.countDocuments()
    const documentCount = await VehicleDocument.countDocuments()
    const userCount = await User.countDocuments()
    const reportCount = await Report.countDocuments()

    console.log(`Found ${vehicleCount} vehicles`)
    console.log(`Found ${imageCount} images`)
    console.log(`Found ${documentCount} documents`)
    console.log(`Found ${userCount} users`)
    console.log(`Found ${reportCount} reports`)

    if (vehicleCount === 0 && imageCount === 0 && documentCount === 0 && userCount === 0 && reportCount === 0) {
      console.log('\n✅ Database is already empty. Nothing to delete.')
      process.exit(0)
    }

    // Delete in order (documents first due to foreign key references)
    console.log('\nDeleting reports...')
    const deletedReports = await Report.deleteMany({})
    console.log(`   ✓ Deleted ${deletedReports.deletedCount} reports`)

    console.log('Deleting documents...')
    const deletedDocuments = await VehicleDocument.deleteMany({})
    console.log(`   ✓ Deleted ${deletedDocuments.deletedCount} documents`)

    console.log('Deleting images...')
    const deletedImages = await VehicleImage.deleteMany({})
    console.log(`   ✓ Deleted ${deletedImages.deletedCount} images`)

    console.log('Deleting vehicles...')
    const deletedVehicles = await Vehicle.deleteMany({})
    console.log(`   ✓ Deleted ${deletedVehicles.deletedCount} vehicles`)

    console.log('Deleting users...')
    const deletedUsers = await User.deleteMany({})
    console.log(`   ✓ Deleted ${deletedUsers.deletedCount} users`)

    console.log('\n✅ Database reset complete!')
    console.log(`   - Vehicles deleted: ${deletedVehicles.deletedCount}`)
    console.log(`   - Images deleted: ${deletedImages.deletedCount}`)
    console.log(`   - Documents deleted: ${deletedDocuments.deletedCount}`)
    console.log(`   - Users deleted: ${deletedUsers.deletedCount}`)
    console.log(`   - Reports deleted: ${deletedReports.deletedCount}`)
    console.log('\n💡 You can now run: npm run seed')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  }
}

resetDatabase()
