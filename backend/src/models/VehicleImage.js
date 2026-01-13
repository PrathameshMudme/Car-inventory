const mongoose = require('mongoose')

const vehicleImageSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  category: {
    type: String,
    enum: ['front', 'back', 'right_side', 'left_side', 'interior', 'engine'],
    required: [true, 'Image category is required']
  },
  stage: {
    type: String,
    enum: ['before', 'after'],
    required: [true, 'Image stage is required'],
    default: 'before'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for faster queries
vehicleImageSchema.index({ vehicleId: 1, category: 1, stage: 1 })

module.exports = mongoose.model('VehicleImage', vehicleImageSchema)
