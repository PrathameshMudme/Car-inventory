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

// @route   GET /api/agents
// @desc    Get all agents with vehicle counts and commission
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get all vehicles with agent info (prefer agentName, fallback to dealerName for backward compat)
    const vehicles = await Vehicle.find({
      $or: [
        { agentName: { $exists: true, $ne: null, $ne: '' } },
        { dealerName: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).lean()

    // Normalize agent names and group them
    const agentMap = new Map()

    vehicles.forEach(vehicle => {
      // Prefer agentName, fallback to dealerName for backward compatibility
      const agentName = vehicle.agentName || vehicle.dealerName || ''
      const agentPhone = vehicle.agentPhone || vehicle.dealerPhone || 'N/A'
      
      // Normalize agent name (capitalize first letter)
      const normalizedName = capitalizeName(agentName)
      const key = `${normalizedName}|${agentPhone}`

      if (!agentMap.has(key)) {
        agentMap.set(key, {
          name: normalizedName,
          phone: agentPhone,
          vehicleCount: 0,
          totalCommission: 0
        })
      }

      const agent = agentMap.get(key)
      agent.vehicleCount += 1
      
      // Sum up agent commission
      if (vehicle.agentCommission && !isNaN(parseFloat(vehicle.agentCommission))) {
        agent.totalCommission += parseFloat(vehicle.agentCommission)
      }
    })

    // Convert map to array and sort by vehicle count
    const formattedAgents = Array.from(agentMap.values())
      .sort((a, b) => b.vehicleCount - a.vehicleCount)
      .map(agent => ({
        name: agent.name,
        phone: agent.phone,
        vehicleCount: agent.vehicleCount,
        totalCommission: agent.totalCommission || 0
      }))

    res.json(formattedAgents)
  } catch (error) {
    console.error('Get agents error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/agents/:name/vehicles
// @desc    Get all vehicles for a specific agent (prefer agentName, fallback to dealerName)
// @access  Private (Admin)
router.get('/:name/vehicles', authenticate, authorize('admin'), async (req, res) => {
  try {
    const agentName = decodeURIComponent(req.params.name)
    
    // Search by both agentName and dealerName for backward compatibility
    const vehicles = await Vehicle.find({
      $or: [
        { agentName: agentName },
        { dealerName: agentName }
      ]
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
          .sort({ stage: 1, order: 1, createdAt: 1 }) // Maintain explicit image order
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
    console.error('Get agent vehicles error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
