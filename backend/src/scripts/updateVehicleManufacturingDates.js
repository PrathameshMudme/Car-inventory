/**
 * Script to update existing vehicles with vehicleMonth and vehicleYear
 * This populates manufacturing month/year for vehicles that only have year field
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Vehicle = require('../models/Vehicle')
const connectDB = require('../config/database')

dotenv.config()

const updateVehicleManufacturingDates = async () => {
  try {
    await connectDB()
    console.log('✅ MongoDB Connected')
    console.log('\n🔄 Updating vehicle manufacturing dates...\n')

    // Find all vehicles that don't have vehicleMonth or vehicleYear
    const vehicles = await Vehicle.find({
      $or: [
        { vehicleMonth: { $exists: false } },
        { vehicleYear: { $exists: false } },
        { vehicleMonth: null },
        { vehicleYear: null }
      ]
    })

    console.log(`Found ${vehicles.length} vehicles without manufacturing month/year\n`)

    if (vehicles.length === 0) {
      console.log('✅ All vehicles already have manufacturing month/year')
      process.exit(0)
    }

    let updated = 0
    for (const vehicle of vehicles) {
      // Use year field to set vehicleYear, and random month for vehicleMonth
      if (vehicle.year) {
        vehicle.vehicleYear = vehicle.year
        // If vehicleMonth is not set, assign a random month (1-12)
        if (!vehicle.vehicleMonth) {
          vehicle.vehicleMonth = Math.floor(Math.random() * 12) + 1
        }
        await vehicle.save()
        updated++
        console.log(`   ✓ Updated ${vehicle.vehicleNo}: ${vehicle.vehicleMonth}/${vehicle.vehicleYear}`)
      } else {
        console.log(`   ⚠ Skipped ${vehicle.vehicleNo}: No year field`)
      }
    }

    console.log(`\n✅ Updated ${updated} vehicles with manufacturing month/year`)
    
    // Verify
    const vehiclesWithMonthYear = await Vehicle.countDocuments({
      vehicleMonth: { $exists: true, $ne: null },
      vehicleYear: { $exists: true, $ne: null }
    })
    const totalVehicles = await Vehicle.countDocuments()
    
    console.log(`\n📊 Verification:`)
    console.log(`   - Total vehicles: ${totalVehicles}`)
    console.log(`   - Vehicles with month/year: ${vehiclesWithMonthYear}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating vehicles:', error)
    process.exit(1)
  }
}

updateVehicleManufacturingDates()
