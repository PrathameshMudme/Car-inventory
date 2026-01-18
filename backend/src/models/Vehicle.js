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
  engineNo: {
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
  purchaseMonth: {
    type: Number,
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  purchaseYear: {
    type: Number,
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  ownerType: {
    type: String,
    enum: ['1st Owner', '2nd Owner', '3rd Owner', 'Custom', ''],
    trim: true
  },
  ownerTypeCustom: {
    type: String,
    trim: true
    // Only used when ownerType is 'Custom'
  },
  // Structured address fields (Maharashtra only)
  addressLine1: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  taluka: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  paymentMethod: {
    type: String,
    trim: true
    // Stores payment method summary string (e.g., "Cash: ₹50,000, Bank Transfer: ₹30,000")
    // DEPRECATED: Use purchasePaymentMethods instead for structured data
  },
  // Structured purchase payment methods (to seller) - key-value pairs
  // Example: { "cash": 200000, "bank_transfer": 300000, "deductions": 10000 }
  purchasePaymentMethods: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Can be Number or String ("NIL")
    default: {}
  },
  // Notes for deductions - reason why deductions were made
  deductionsNotes: {
    type: String,
    trim: true
  },
  // Remaining amount payable by company to seller
  remainingAmountToSeller: {
    type: Number,
    default: 0,
    min: [0, 'Remaining amount to seller cannot be negative']
  },
  // Payment type categorization
  pendingPaymentType: {
    type: String,
    enum: ['PENDING_FROM_CUSTOMER', 'PENDING_TO_SELLER', ''],
    default: ''
    // PENDING_FROM_CUSTOMER: Customer owes money (security cheque, etc.)
    // PENDING_TO_SELLER: Company owes money to seller
  },
  agentCommission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative']
    // Admin-only field - cannot be set by purchase manager
  },
  agentPhone: {
    type: String,
    trim: true
    // Admin-only field - cannot be set by purchase manager
  },
  sellerName: {
    type: String,
    trim: true
  },
  sellerContact: {
    type: String,
    trim: true
  },
  // LEGACY FIELDS: Use agentName and agentPhone instead
  // Keeping dealerName/dealerPhone for backward compatibility during migration
  dealerName: {
    type: String,
    trim: true
  },
  dealerPhone: {
    type: String,
    trim: true
  },
  // Agent fields (primary fields, replaces legacy dealerName/dealerPhone)
  agentName: {
    type: String,
    trim: true
  },
  agentPhone: {
    type: String,
    trim: true
    // Note: This field also exists above as admin-only, but this one is set during vehicle creation
  },
  // Modification workflow fields
  modificationCost: {
    type: Number,
    default: 0,
    min: [0, 'Modification cost cannot be negative']
  },
  modificationNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing'],
    default: 'On Modification'
  },
  // Track if vehicle is ready for stock (all modification fields filled)
  modificationComplete: {
    type: Boolean,
    default: false
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
  },
  // Audit trail for chassis number changes
  chassisNoHistory: [{
    oldValue: { type: String },
    newValue: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
  // Audit trail for engine number changes
  engineNoHistory: [{
    oldValue: { type: String },
    newValue: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
  // Deletion audit
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Index for faster queries
// Note: vehicleNo index is automatically created by unique: true, so we don't need to add it here
vehicleSchema.index({ status: 1 })
vehicleSchema.index({ createdBy: 1 })
vehicleSchema.index({ agentName: 1 })
vehicleSchema.index({ dealerName: 1 }) // Legacy index, kept for backward compatibility

module.exports = mongoose.model('Vehicle', vehicleSchema)
