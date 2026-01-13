const mongoose = require('mongoose')

const vehicleSchema = new mongoose.Schema({
  vehicleNo: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  chassisNo: {
    type: String,
    trim: true,
    uppercase: true
  },
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  color: {
    type: String,
    trim: true
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', ''],
    default: 'Petrol'
  },
  kilometers: {
    type: String,
    trim: true
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative']
  },
  askingPrice: {
    type: Number,
    min: [0, 'Asking price cannot be negative']
  },
  lastPrice: {
    type: Number,
    min: [0, 'Last price cannot be negative']
  },
  purchaseDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment', '']
  },
  agentCommission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative']
  },
  sellerName: {
    type: String,
    trim: true
  },
  sellerContact: {
    type: String,
    trim: true
  },
  dealerName: {
    type: String,
    trim: true
  },
  dealerPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing'],
    default: 'On Modification'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Index for faster queries
vehicleSchema.index({ vehicleNo: 1 })
vehicleSchema.index({ status: 1 })
vehicleSchema.index({ createdBy: 1 })
vehicleSchema.index({ dealerName: 1 })

module.exports = mongoose.model('Vehicle', vehicleSchema)
