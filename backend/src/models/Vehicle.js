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
    trim: true
    // Stores payment method summary string (e.g., "Cash: ₹50,000, Bank Transfer: ₹30,000")
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
  },
  // Customer information (when vehicle is sold)
  customerName: {
    type: String,
    trim: true
  },
  customerContact: {
    type: String,
    trim: true
  },
  customerAlternateContact: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  customerAadhaar: {
    type: String,
    trim: true
  },
  customerPAN: {
    type: String,
    trim: true,
    uppercase: true
  },
  customerSource: {
    type: String,
    enum: ['agent', 'walkin', 'online', ''],
    trim: true
  },
  saleDate: {
    type: Date
  },
  // Payment details
  paymentType: {
    type: String,
    enum: ['full', 'custom', ''],
    trim: true
  },
  paymentCash: {
    type: Number,
    default: 0,
    min: [0, 'Cash amount cannot be negative']
  },
  paymentBankTransfer: {
    type: Number,
    default: 0,
    min: [0, 'Bank transfer amount cannot be negative']
  },
  paymentOnline: {
    type: Number,
    default: 0,
    min: [0, 'Online payment amount cannot be negative']
  },
  paymentLoan: {
    type: Number,
    default: 0,
    min: [0, 'Loan amount cannot be negative']
  },
  paymentSecurityCheque: {
    type: {
      enabled: { type: Boolean, default: false },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      chequeNumber: { type: String, trim: true },
      amount: { type: Number, default: 0, min: [0, 'Cheque amount cannot be negative'] }
    },
    default: {}
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Remaining amount cannot be negative']
  },
  saleNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Index for faster queries
// Note: vehicleNo index is automatically created by unique: true, so we don't need to add it here
vehicleSchema.index({ status: 1 })
vehicleSchema.index({ createdBy: 1 })
vehicleSchema.index({ dealerName: 1 })

module.exports = mongoose.model('Vehicle', vehicleSchema)
