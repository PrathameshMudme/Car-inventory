/**
 * Script to verify expenses and commission data in the database
 * Checks that vehicles have agentCommission and modificationCost populated
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Vehicle = require('../models/Vehicle')
const connectDB = require('../config/database')

dotenv.config()

const verifyExpensesData = async () => {
  try {
    await connectDB()
    console.log('✅ MongoDB Connected')
    console.log('\n🔍 Verifying Expenses & Commission Data...\n')

    const vehicles = await Vehicle.find({ status: { $ne: 'DELETED' } })

    console.log(`Total vehicles (excluding deleted): ${vehicles.length}\n`)

    // Check vehicles with agent commission
    const vehiclesWithCommission = vehicles.filter(v => (parseFloat(v.agentCommission) || 0) > 0)
    console.log(`✅ Vehicles with Agent Commission: ${vehiclesWithCommission.length}`)
    
    const totalCommission = vehiclesWithCommission.reduce((sum, v) => sum + (parseFloat(v.agentCommission) || 0), 0)
    console.log(`   Total Commission: ₹${totalCommission.toLocaleString('en-IN')}`)
    console.log(`   Average Commission: ₹${Math.round(totalCommission / vehiclesWithCommission.length).toLocaleString('en-IN')}\n`)

    // Check vehicles with modification cost
    const vehiclesWithModification = vehicles.filter(v => (parseFloat(v.modificationCost) || 0) > 0)
    console.log(`✅ Vehicles with Modification Cost: ${vehiclesWithModification.length}`)
    
    const totalModification = vehiclesWithModification.reduce((sum, v) => sum + (parseFloat(v.modificationCost) || 0), 0)
    console.log(`   Total Modification Cost: ₹${totalModification.toLocaleString('en-IN')}`)
    console.log(`   Average Modification Cost: ₹${Math.round(totalModification / vehiclesWithModification.length).toLocaleString('en-IN')}\n`)

    // Check by status
    console.log('📊 Breakdown by Status:')
    const statuses = ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing']
    statuses.forEach(status => {
      const statusVehicles = vehicles.filter(v => v.status === status)
      const withCommission = statusVehicles.filter(v => (parseFloat(v.agentCommission) || 0) > 0).length
      const withModification = statusVehicles.filter(v => (parseFloat(v.modificationCost) || 0) > 0).length
      console.log(`   ${status}: ${statusVehicles.length} vehicles (${withCommission} with commission, ${withModification} with modification)`)
    })

    // Check by time period (for expenses table filters)
    console.log('\n📅 Breakdown by Time Period:')
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // This Month
    const thisMonthVehicles = vehicles.filter(v => {
      const date = v.purchaseDate || v.createdAt
      if (!date) return false
      const vehicleDate = new Date(date)
      return vehicleDate.getMonth() === currentMonth && vehicleDate.getFullYear() === currentYear
    })
    const thisMonthExpenses = thisMonthVehicles.reduce((sum, v) => 
      sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0), 0)
    console.log(`   This Month: ${thisMonthVehicles.length} vehicles, ₹${thisMonthExpenses.toLocaleString('en-IN')} in expenses`)

    // Last Month
    const lastMonthVehicles = vehicles.filter(v => {
      const date = v.purchaseDate || v.createdAt
      if (!date) return false
      const vehicleDate = new Date(date)
      return vehicleDate.getMonth() === lastMonth && vehicleDate.getFullYear() === lastMonthYear
    })
    const lastMonthExpenses = lastMonthVehicles.reduce((sum, v) => 
      sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0), 0)
    console.log(`   Last Month: ${lastMonthVehicles.length} vehicles, ₹${lastMonthExpenses.toLocaleString('en-IN')} in expenses`)

    // Last 3 Months
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(now.getMonth() - 3)
    const last3MonthsVehicles = vehicles.filter(v => {
      const date = v.purchaseDate || v.createdAt
      if (!date) return false
      const vehicleDate = new Date(date)
      return vehicleDate >= threeMonthsAgo
    })
    const last3MonthsExpenses = last3MonthsVehicles.reduce((sum, v) => 
      sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0), 0)
    console.log(`   Last 3 Months: ${last3MonthsVehicles.length} vehicles, ₹${last3MonthsExpenses.toLocaleString('en-IN')} in expenses`)

    // This Year
    const thisYearVehicles = vehicles.filter(v => {
      const date = v.purchaseDate || v.createdAt
      if (!date) return false
      const vehicleDate = new Date(date)
      return vehicleDate.getFullYear() === currentYear
    })
    const thisYearExpenses = thisYearVehicles.reduce((sum, v) => 
      sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0), 0)
    console.log(`   This Year: ${thisYearVehicles.length} vehicles, ₹${thisYearExpenses.toLocaleString('en-IN')} in expenses`)

    // Sample expenses entries
    console.log('\n📋 Sample Expenses Entries:')
    const sampleVehicles = vehicles.filter(v => 
      (parseFloat(v.agentCommission) || 0) > 0 || (parseFloat(v.modificationCost) || 0) > 0
    ).slice(0, 5)

    sampleVehicles.forEach(v => {
      const date = v.purchaseDate || v.createdAt
      const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'N/A'
      
      console.log(`\n   Vehicle: ${v.vehicleNo}`)
      console.log(`   Date: ${formattedDate}`)
      if (v.agentCommission > 0) {
        console.log(`   - Commission: ₹${v.agentCommission.toLocaleString('en-IN')} (Agent: ${v.agentName || 'N/A'})`)
      }
      if (v.modificationCost > 0) {
        console.log(`   - Modification: ₹${v.modificationCost.toLocaleString('en-IN')} (${v.modificationNotes || 'N/A'})`)
      }
    })

    console.log('\n✅ Expenses & Commission data verification complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error verifying expenses data:', error)
    process.exit(1)
  }
}

verifyExpensesData()
