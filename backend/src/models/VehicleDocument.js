const mongoose = require('mongoose')

const vehicleDocumentSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  documentUrl: {
    type: String,
    required: [true, 'Document URL is required']
  },
  documentType: {
    type: String,
    enum: ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record', 'other'],
    required: [true, 'Document type is required']
  },
  documentName: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Index for faster queries
vehicleDocumentSchema.index({ vehicleId: 1, documentType: 1 })

module.exports = mongoose.model('VehicleDocument', vehicleDocumentSchema)
