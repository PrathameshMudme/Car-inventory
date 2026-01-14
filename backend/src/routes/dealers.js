const express = require('express')
const Vehicle = require('../models/Vehicle')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// Helper function to capitalize first letter of each word
const capitalizeName = (name) => {
  if (!name) return ''
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// @route   GET /api/dealers
// @desc    Get all dealers with vehicle counts and commission
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    // First, get all vehicles with dealer info
    const vehicles = await Vehicle.find({
      dealerName: { $exists: true, $ne: null, $ne: '' }
    }).lean()

    // Normalize dealer names and group them
    const dealerMap = new Map()

    vehicles.forEach(vehicle => {
      // Normalize dealer name (capitalize first letter)
      const normalizedName = capitalizeName(vehicle.dealerName)
      const dealerPhone = vehicle.dealerPhone || 'N/A'
      const key = `${normalizedName}|${dealerPhone}`

      if (!dealerMap.has(key)) {
        dealerMap.set(key, {
          name: normalizedName,
          phone: dealerPhone,
          vehicleCount: 0,
          totalCommission: 0
        })
      }

      const dealer = dealerMap.get(key)
      dealer.vehicleCount += 1
      
      // Sum up agent commission
      if (vehicle.agentCommission && !isNaN(parseFloat(vehicle.agentCommission))) {
        dealer.totalCommission += parseFloat(vehicle.agentCommission)
      }
    })

    // Convert map to array and sort by vehicle count
    const formattedDealers = Array.from(dealerMap.values())
      .sort((a, b) => b.vehicleCount - a.vehicleCount)
      .map(dealer => ({
        name: dealer.name,
        phone: dealer.phone,
        vehicleCount: dealer.vehicleCount,
        totalCommission: dealer.totalCommission || 0
      }))

    res.json(formattedDealers)
  } catch (error) {
    console.error('Get dealers error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/dealers/:name/vehicles
// @desc    Get all vehicles for a specific dealer
// @access  Private (Admin)
router.get('/:name/vehicles', authenticate, authorize('admin'), async (req, res) => {
  try {
    const dealerName = decodeURIComponent(req.params.name)
    
    const vehicles = await Vehicle.find({
      dealerName: dealerName
    })
      .populate('createdBy', 'name email')
      .sort({ purchaseDate: -1 })
      .lean()

    // Get images and documents for each vehicle
    const VehicleImage = require('../models/VehicleImage')
    const VehicleDocument = require('../models/VehicleDocument')
    
    const vehiclesWithDetails = await Promise.all(
      vehicles.map(async (vehicle) => {
        const images = await VehicleImage.find({ vehicleId: vehicle._id })
        const documents = await VehicleDocument.find({ vehicleId: vehicle._id })
        
        return {
          ...vehicle,
          images,
          documents
        }
      })
    )

    res.json(vehiclesWithDetails)
  } catch (error) {
    console.error('Get dealer vehicles error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
