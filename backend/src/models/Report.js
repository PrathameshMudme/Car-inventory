const mongoose = require('mongoose')

/**
 * Report Generation History and Audit Trail
 * Tracks all report generations with comparison matrices
 */
const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['sales', 'purchase', 'financial', 'inventory', 'profit_loss', 'expenses', 'comparison'],
    required: true
  },
  periodType: {
    type: String,
    enum: ['6months', 'quarterly', 'yearly', 'custom'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  filename: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    trim: true
  },
  format: {
    type: String,
    enum: ['pdf', 'csv', 'excel'],
    default: 'pdf'
  },
  // Comparison matrix data (for comparison reports)
  comparisonData: {
    type: {
      periods: [{
        period: String, // e.g., "Q1 2024", "Jan-Jun 2024"
        startDate: Date,
        endDate: Date,
        metrics: {
          totalRevenue: Number,
          totalCost: Number,
          netProfit: Number,
          profitMargin: Number,
          vehiclesSold: Number,
          vehiclesPurchased: Number,
          totalExpenses: Number,
          avgSalePrice: Number
        }
      }]
    },
    default: undefined
  },
  // Report metadata
  metadata: {
    totalRecords: Number,
    filters: mongoose.Schema.Types.Mixed, // Store any filters applied
    summary: mongoose.Schema.Types.Mixed // Store summary statistics
  }
}, {
  timestamps: true
})

// Indexes for faster queries
reportSchema.index({ reportType: 1, generatedAt: -1 })
reportSchema.index({ generatedBy: 1, generatedAt: -1 })
reportSchema.index({ periodType: 1, startDate: 1, endDate: 1 })

module.exports = mongoose.model('Report', reportSchema)
