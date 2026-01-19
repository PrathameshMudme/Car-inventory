const mongoose = require('mongoose')

const vehicleSchema = new mongoose.Schema({
  // ============================================
  // VEHICLE IDENTIFICATION
  // ============================================
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
  vehicleMonth: {
    type: Number,
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  vehicleYear: {
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

  // ============================================
  // PURCHASE INFORMATION
  // ============================================
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative']
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

  // ============================================
  // PURCHASE PAYMENT (To Seller)
  // ============================================
  // Structured purchase payment methods - key-value pairs
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
  // DEPRECATED: Legacy payment method summary string
  // Kept for backward compatibility, but use purchasePaymentMethods instead
  // This is auto-generated from purchasePaymentMethods in routes
  paymentMethod: {
    type: String,
    trim: true,
    default: null
  },

  // ============================================
  // SELLER & AGENT INFORMATION
  // ============================================
  sellerName: {
    type: String,
    trim: true
  },
  sellerContact: {
    type: String,
    trim: true
  },
  // Agent fields (primary fields)
  agentName: {
    type: String,
    trim: true,
    default: null
  },
  agentPhone: {
    type: String,
    trim: true,
    default: null
    // Admin-only field for editing, but can be set during vehicle creation
  },
  agentCommission: {
    type: Number,
    default: 0, // Default to 0 for calculations (display shows "NIL" when 0)
    min: [0, 'Commission cannot be negative']
    // Admin-only field - cannot be set by purchase manager
  },
  // LEGACY FIELDS: Kept for backward compatibility only
  // DO NOT USE - Use agentName and agentPhone instead
  // These fields are automatically synced with agentName/agentPhone in routes
  dealerName: {
    type: String,
    trim: true,
    default: null
  },
  dealerPhone: {
    type: String,
    trim: true,
    default: null
  },

  // ============================================
  // ADDRESS INFORMATION (Maharashtra)
  // ============================================
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

  // ============================================
  // PRICING & MODIFICATION WORKFLOW
  // ============================================
  askingPrice: {
    type: Number,
    min: [0, 'Asking price cannot be negative']
  },
  lastPrice: {
    type: Number,
    min: [0, 'Last price cannot be negative']
  },
  modificationCost: {
    type: Number,
    default: 0, // Default to 0 for calculations (display shows "NIL" when 0)
    min: [0, 'Modification cost cannot be negative']
  },
  modificationNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing', 'DELETED'],
    default: 'On Modification'
  },
  modificationComplete: {
    type: Boolean,
    default: false
    // Track if vehicle is ready for stock (all modification fields filled)
  },

  // ============================================
  // SALE INFORMATION (Customer Details)
  // ============================================
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
  customerAddressLine1: {
    type: String,
    trim: true
  },
  customerDistrict: {
    type: String,
    trim: true
  },
  customerTaluka: {
    type: String,
    trim: true
  },
  customerPincode: {
    type: String,
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
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

  // ============================================
  // SALE PAYMENT (From Customer)
  // ============================================
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
    default: 0, // Default to 0 for calculations (display shows "NIL" when 0 or not sold)
    min: [0, 'Remaining amount cannot be negative']
    // Remaining amount from customer (only used when vehicle is sold)
  },
  saleNotes: {
    type: String,
    trim: true
  },

  // ============================================
  // AUDIT & METADATA
  // ============================================
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
    // General notes about the vehicle
  },
  // Audit trail for chassis number changes (admin-only edits)
  // Only created when chassis number is actually changed
  chassisNoHistory: {
    type: [{
      oldValue: { type: String },
      newValue: { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now }
    }],
    default: undefined // Don't create empty array by default
  },
  // Audit trail for engine number changes (admin-only edits)
  // Only created when engine number is actually changed
  engineNoHistory: {
    type: [{
      oldValue: { type: String },
      newValue: { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now }
    }],
    default: undefined // Don't create empty array by default
  },
  // Purchase note generation history
  // Tracks when purchase notes were generated for this vehicle
  purchaseNoteHistory: {
    type: [{
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      generatedAt: { type: Date, default: Date.now },
      filename: { type: String, trim: true }
    }],
    default: undefined // Don't create empty array by default
  },
  // Delivery note generation history
  // Tracks when delivery notes were generated for this vehicle (sales managers only)
  deliveryNoteHistory: {
    type: [{
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      generatedAt: { type: Date, default: Date.now },
      filename: { type: String, trim: true }
    }],
    default: undefined // Don't create empty array by default
  },
  // Payment settlement history
  // Tracks when pending payments were settled and how they were paid
  paymentSettlementHistory: {
    type: [{
      settlementType: { 
        type: String, 
        enum: ['FROM_CUSTOMER', 'TO_SELLER'], 
        required: true 
      }, // FROM_CUSTOMER: Customer paid remaining amount, TO_SELLER: Company paid seller
      amount: { type: Number, required: true, min: [0, 'Settlement amount cannot be negative'] },
      paymentMode: { 
        type: String, 
        enum: ['cash', 'bankTransfer', 'online', 'loan'], 
        required: true 
      },
      settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      settledAt: { type: Date, default: Date.now },
      notes: { type: String, trim: true } // Optional notes about the settlement
    }],
    default: undefined // Don't create empty array by default
  },
  // Soft deletion audit
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
})

// Pre-save hook to auto-set purchaseMonth and purchaseYear from createdAt if not already set
vehicleSchema.pre('save', function(next) {
  // Auto-set purchaseMonth and purchaseYear from createdAt (when vehicle was added to system)
  // This happens automatically for all new vehicles
  // For existing vehicles, only update if not already set (allows manual override if needed)
  if (!this.purchaseMonth || !this.purchaseYear) {
    // Priority: purchaseDate > createdAt > current date
    const dateToUse = this.purchaseDate || this.createdAt || new Date()
    const date = new Date(dateToUse)
    this.purchaseMonth = date.getMonth() + 1
    this.purchaseYear = date.getFullYear()
    
    // Also set purchaseDate if not already set (for consistency)
    if (!this.purchaseDate) {
      this.purchaseDate = new Date(dateToUse)
    }
  }
  next()
})

// Index for faster queries
// Note: vehicleNo index is automatically created by unique: true, so we don't need to add it here
vehicleSchema.index({ status: 1 })
vehicleSchema.index({ createdBy: 1 })
vehicleSchema.index({ agentName: 1 })
vehicleSchema.index({ dealerName: 1 }) // Legacy index - use agentName instead

module.exports = mongoose.model('Vehicle', vehicleSchema)
