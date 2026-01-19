/**
 * Script to clean up vehicle data:
 * - Remove empty strings, set to null/undefined
 * - Remove unused default values
 * - Ensure data consistency
 */

const mongoose = require('mongoose')
const Vehicle = require('../models/Vehicle')
require('dotenv').config()

const cleanupVehicles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle-management')
    console.log('Connected to MongoDB')

    const vehicles = await Vehicle.find({})
    console.log(`Found ${vehicles.length} vehicles to process`)

    let updated = 0
    let cleaned = 0

    for (const vehicle of vehicles) {
      let needsUpdate = false
      const updates = {}

      // Clean up empty strings - set to null for optional fields
      const stringFields = [
        'agentPhone', 'dealerPhone', 'sellerContact', 'customerContact',
        'customerAlternateContact', 'customerEmail', 'customerAddress',
        'customerAadhaar', 'customerPAN', 'notes', 'modificationNotes',
        'saleNotes', 'deductionsNotes', 'ownerTypeCustom'
      ]

      stringFields.forEach(field => {
        if (vehicle[field] === '' || vehicle[field] === 'N/A') {
          updates[field] = null
          needsUpdate = true
        }
      })

      // Clean up empty arrays
      if (Array.isArray(vehicle.chassisNoHistory) && vehicle.chassisNoHistory.length === 0) {
        updates.chassisNoHistory = undefined
        needsUpdate = true
      }
      if (Array.isArray(vehicle.engineNoHistory) && vehicle.engineNoHistory.length === 0) {
        updates.engineNoHistory = undefined
        needsUpdate = true
      }

      // Clean up empty paymentSecurityCheque object
      if (vehicle.paymentSecurityCheque && 
          (!vehicle.paymentSecurityCheque.enabled || 
           (!vehicle.paymentSecurityCheque.bankName && 
            !vehicle.paymentSecurityCheque.accountNumber && 
            !vehicle.paymentSecurityCheque.chequeNumber && 
            vehicle.paymentSecurityCheque.amount === 0))) {
        updates.paymentSecurityCheque = { enabled: false }
        needsUpdate = true
      }

      // Keep sale payment fields as 0 (used in calculations) - don't remove
      // Only update if they're string "NIL" (shouldn't happen, but handle it)
      if (vehicle.status !== 'Sold') {
        if (vehicle.paymentCash === 'NIL') {
          updates.paymentCash = 0
          needsUpdate = true
        }
        if (vehicle.paymentBankTransfer === 'NIL') {
          updates.paymentBankTransfer = 0
          needsUpdate = true
        }
        if (vehicle.paymentOnline === 'NIL') {
          updates.paymentOnline = 0
          needsUpdate = true
        }
        if (vehicle.paymentLoan === 'NIL') {
          updates.paymentLoan = 0
          needsUpdate = true
        }
        if (vehicle.remainingAmount === 'NIL') {
          updates.remainingAmount = 0
          needsUpdate = true
        }
        // Remove customer fields if vehicle is not sold
        if (vehicle.customerName) {
          updates.customerName = undefined
          updates.customerContact = undefined
          updates.customerAlternateContact = undefined
          updates.customerEmail = undefined
          updates.customerAddress = undefined
          updates.customerAadhaar = undefined
          updates.customerPAN = undefined
          updates.customerSource = undefined
          updates.saleDate = undefined
          updates.saleNotes = undefined
          needsUpdate = true
        }
      }

      // Keep modificationCost as 0 (used in calculations) - don't remove
      // Only update if it's a string "NIL" (shouldn't happen, but handle it)
      if (vehicle.modificationCost === 'NIL') {
        updates.modificationCost = 0
        needsUpdate = true
      }

      // Keep agentCommission as 0 (used in calculations) - don't remove
      // Only update if it's a string "NIL" (shouldn't happen, but handle it)
      if (vehicle.agentCommission === 'NIL') {
        updates.agentCommission = 0
        needsUpdate = true
      }

      // Ensure legacy dealerName/dealerPhone fields match agentName/agentPhone (for consistency)
      if (vehicle.agentName && !vehicle.dealerName) {
        updates.dealerName = vehicle.agentName
        needsUpdate = true
      }
      if (vehicle.agentPhone && !vehicle.dealerPhone) {
        updates.dealerPhone = vehicle.agentPhone
        needsUpdate = true
      }

      // Remove deprecated paymentMethod if purchasePaymentMethods exists
      if (vehicle.paymentMethod && vehicle.purchasePaymentMethods && 
          Object.keys(vehicle.purchasePaymentMethods).length > 0) {
        // Keep paymentMethod for backward compatibility, but could remove if desired
        // updates.paymentMethod = undefined
        // needsUpdate = true
      }

      if (needsUpdate) {
        // Use $unset for undefined values, $set for null/other values
        const unsetFields = {}
        const setFields = {}

        Object.keys(updates).forEach(key => {
          if (updates[key] === undefined) {
            unsetFields[key] = ''
          } else {
            setFields[key] = updates[key]
          }
        })

        const updateQuery = {}
        if (Object.keys(setFields).length > 0) {
          updateQuery.$set = setFields
        }
        if (Object.keys(unsetFields).length > 0) {
          updateQuery.$unset = unsetFields
        }

        await Vehicle.updateOne({ _id: vehicle._id }, updateQuery)
        updated++
        cleaned += Object.keys(updates).length
      }
    }

    console.log(`\nCleanup complete!`)
    console.log(`- Vehicles updated: ${updated}`)
    console.log(`- Total fields cleaned: ${cleaned}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error cleaning up vehicles:', error)
    process.exit(1)
  }
}

cleanupVehicles()
