const express = require('express')
const Vehicle = require('../models/Vehicle')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/dealers
// @desc    Get all dealers with vehicle counts
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Aggregate dealers from vehicles
    const dealers = await Vehicle.aggregate([
      {
        // Filter out vehicles without dealer information
        $match: {
          dealerName: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        // Group by dealer name and phone to get unique dealers
        $group: {
          _id: {
            name: '$dealerName',
            phone: '$dealerPhone'
          },
          vehicleCount: { $sum: 1 },
          // Get some additional info
          firstPurchaseDate: { $min: '$purchaseDate' },
          lastPurchaseDate: { $max: '$purchaseDate' },
          totalPurchaseValue: { $sum: '$purchasePrice' }
        }
      },
      {
        // Project the results in a cleaner format
        $project: {
          _id: 0,
          name: '$_id.name',
          phone: '$_id.phone',
          vehicleCount: 1,
          firstPurchaseDate: 1,
          lastPurchaseDate: 1,
          totalPurchaseValue: 1
        }
      },
      {
        // Sort by vehicle count descending
        $sort: { vehicleCount: -1 }
      }
    ])

    // Format the response
    const formattedDealers = dealers.map(dealer => ({
      name: dealer.name,
      phone: dealer.phone || 'N/A',
      vehicleCount: dealer.vehicleCount,
      firstPurchaseDate: dealer.firstPurchaseDate,
      lastPurchaseDate: dealer.lastPurchaseDate,
      totalPurchaseValue: dealer.totalPurchaseValue || 0
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
