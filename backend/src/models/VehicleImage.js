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
    enum: ['front', 'back', 'right_side', 'left_side', 'interior', 'interior_2', 'engine', 'other'],
    required: [true, 'Image category is required']
  },
  stage: {
    type: String,
    enum: ['before', 'after'],
    required: [true, 'Image stage is required'],
    default: 'before'
  },
  // Image order/sequence for maintaining display order
  // For after-modification images: 1=Front, 2=Back, 3=Right, 4=Left, 5=Interior 1, 6=Interior 2, 7=Engine, 8+=Other
  order: {
    type: Number,
    default: 0
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
vehicleImageSchema.index({ vehicleId: 1, stage: 1, order: 1 }) // For ordered image retrieval

module.exports = mongoose.model('VehicleImage', vehicleImageSchema)
