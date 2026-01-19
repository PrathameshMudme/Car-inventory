const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Vehicle = require('../models/Vehicle')
const VehicleImage = require('../models/VehicleImage')
const VehicleDocument = require('../models/VehicleDocument')
const { authenticate, authorize } = require('../middleware/auth')
const PurchaseNotePDFService = require('../services/purchaseNotePDFService')
const { saveHistoryIfNeeded } = require('../services/purchaseNoteHistoryService')

const router = express.Router()

// Image slots configuration - fixed order for all image uploads
// Order: 0=Front, 1=Back, 2=Right, 3=Left, 4=Interior 1, 5=Interior 2, 6=Engine, 7+=Other
const IMAGE_SLOTS = [
  { category: 'front', fieldName: 'front_images', order: 0 },
  { category: 'back', fieldName: 'back_images', order: 1 },
  { category: 'right_side', fieldName: 'right_side_images', order: 2 },
  { category: 'left_side', fieldName: 'left_side_images', order: 3 },
  { category: 'interior', fieldName: 'interior_images', order: 4 },
  { category: 'interior_2', fieldName: 'interior_2_images', order: 5 },
  { category: 'engine', fieldName: 'engine_images', order: 6 },
  { category: 'other', fieldName: 'other_images', order: 7 }
]

// Helper function to check if vehicle modification is complete
const checkModificationComplete = async (vehicle) => {
  const hasPostModificationImages = await VehicleImage.findOne({ 
    vehicleId: vehicle._id, 
    stage: 'after' 
  })
  
  const hasAskingPrice = vehicle.askingPrice && parseFloat(vehicle.askingPrice) > 0
  const hasLastPrice = vehicle.lastPrice && parseFloat(vehicle.lastPrice) > 0
  const hasModificationCost = vehicle.modificationCost && vehicle.modificationCost > 0
  const hasModificationNotes = vehicle.modificationNotes && vehicle.modificationNotes.trim()
  const hasAgentPhone = vehicle.agentPhone && vehicle.agentPhone.trim()
  const hasAgentCommission = vehicle.agentCommission && vehicle.agentCommission > 0
  
  return hasAskingPrice && hasLastPrice && 
         hasModificationCost !== null && hasModificationNotes && 
         hasAgentPhone && hasAgentCommission !== null && 
         hasPostModificationImages !== null
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'vehicles')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file extensions
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|webp)$/i
    // Allowed MIME types (more comprehensive)
    const allowedMimeTypes = /^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf)$/i
    
    const ext = path.extname(file.originalname).toLowerCase()
    const hasValidExtension = allowedExtensions.test(ext)
    const hasValidMimeType = allowedMimeTypes.test(file.mimetype)
    
    // Accept if either extension OR mimetype is valid (more lenient)
    // This handles cases where browsers send different mimetypes
    if (hasValidExtension || hasValidMimeType) {
      return cb(null, true)
    } else {
      cb(new Error(`Invalid file type: ${file.originalname} (${file.mimetype}). Only images (JPEG, JPG, PNG, GIF, WEBP) and PDFs are allowed.`))
    }
  }
})

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private (Purchase Manager, Admin)
router.post('/', authenticate, authorize('purchase', 'admin'), upload.fields([
  { name: 'front_images', maxCount: 1 },
  { name: 'back_images', maxCount: 1 },
  { name: 'right_side_images', maxCount: 1 },
  { name: 'left_side_images', maxCount: 1 },
  { name: 'interior_images', maxCount: 1 },
  { name: 'interior_2_images', maxCount: 1 },
  { name: 'engine_images', maxCount: 1 },
  { name: 'other_images', maxCount: 10 },
  { name: 'insurance', maxCount: 1 },
  { name: 'rc', maxCount: 1 },
  { name: 'bank_noc', maxCount: 1 },
  { name: 'kyc', maxCount: 5 },
  { name: 'tt_form', maxCount: 1 },
  { name: 'papers_on_hold', maxCount: 5 },
  { name: 'puc', maxCount: 1 },
  { name: 'service_record', maxCount: 5 },
  { name: 'other', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      vehicleNo,
      chassisNo,
      engineNo,
      make,
      model,
      year,
      color,
      fuelType,
      kilometers,
      purchasePrice,
      askingPrice,
      purchaseDate,
      sellerName,
      sellerContact,
      agentName,
      agentPhone,
      notes
    } = req.body

    // Validate required fields (all fields except documents are required)
    const requiredFields = {
      vehicleNo: 'Vehicle Number',
      chassisNo: 'Chassis Number',
      engineNo: 'Engine Number',
      make: 'Make',
      model: 'Model',
      color: 'Color',
      kilometers: 'Kilometers',
      purchasePrice: 'Purchase Price',
      sellerName: 'Seller Name',
      sellerContact: 'Seller Contact',
      agentName: 'Agent Name', // Legacy dealerName field is kept for backward compatibility only
      addressLine1: 'Address Line 1',
      district: 'District',
      taluka: 'Taluka',
      pincode: 'Pincode'
    }

    // Validate purchase payment methods
    if (!req.body.purchasePaymentMethods) {
      return res.status(400).json({ 
        message: 'At least one payment method is required' 
      })
    }

    let purchasePaymentMethods = {}
    try {
      purchasePaymentMethods = JSON.parse(req.body.purchasePaymentMethods)
      if (Object.keys(purchasePaymentMethods).length === 0) {
        return res.status(400).json({ 
          message: 'At least one payment method must be selected' 
        })
      }
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid purchase payment methods format' 
      })
    }

    // purchaseMonth and purchaseYear are now auto-set from createdAt
    // No validation needed - they will be set automatically when vehicle is saved

    // Validate pincode format
    if (req.body.pincode && !/^\d{6}$/.test(req.body.pincode)) {
      return res.status(400).json({ 
        message: 'Pincode must be exactly 6 digits' 
      })
    }

    // Validate owner type custom
    if (req.body.ownerType === 'Custom' && !req.body.ownerTypeCustom?.trim()) {
      return res.status(400).json({ 
        message: 'Custom owner description is required when Owner Type is Custom' 
      })
    }

    const missingFields = []
    for (const [field, label] of Object.entries(requiredFields)) {
      // Special handling for agentName - also check legacy dealerName field for backward compatibility
      if (field === 'agentName') {
        if (!req.body.agentName && !req.body.dealerName) {
          missingFields.push(label)
        }
        continue
      }
      
      if (!req.body[field] || (typeof req.body[field] === 'string' && !req.body[field].trim())) {
        missingFields.push(label)
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      })
    }

    // Check if vehicle number already exists
    const existingVehicle = await Vehicle.findOne({ vehicleNo: vehicleNo.toUpperCase() })
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this number already exists' })
    }

    // Helper function to capitalize first letter of each word
    const capitalizeName = (name) => {
      if (!name) return ''
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    // Handle purchase month and year
    // Get agentName from req.body (prefer agentName over legacy dealerName field)
    const finalAgentName = req.body.agentName || req.body.dealerName || agentName || ''
    const finalAgentPhone = req.body.agentPhone || req.body.dealerPhone || agentPhone || ''
    
    // Get vehicle manufacturing month and year (from vehicleMonth/vehicleYear or year field)
    let vehicleMonth = undefined
    let vehicleYear = undefined
    
    if (req.body.vehicleMonth) {
      const parsedMonth = parseInt(req.body.vehicleMonth)
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        vehicleMonth = parsedMonth
      }
    }
    
    if (req.body.vehicleYear) {
      const parsedYear = parseInt(req.body.vehicleYear)
      if (!isNaN(parsedYear) && parsedYear >= 1900) {
        vehicleYear = parsedYear
      }
    } else if (req.body.year) {
      const parsedYear = parseInt(req.body.year)
      if (!isNaN(parsedYear) && parsedYear >= 1900) {
        vehicleYear = parsedYear
      }
    }
    
    // Purchase month and year will be auto-set from createdAt after vehicle creation
    // No longer accepting purchaseMonth/purchaseYear as input

    // Create vehicle with all required fields
    const vehicleData = {
      vehicleNo: vehicleNo.toUpperCase(),
      chassisNo: chassisNo ? chassisNo.toUpperCase() : '',
      engineNo: engineNo ? engineNo.toUpperCase() : '',
      make,
      model,
      color,
      fuelType: fuelType || 'Petrol',
      kilometers,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      sellerName: capitalizeName(sellerName),
      sellerContact,
      // Use agentName/agentPhone (also set dealerName/dealerPhone for backward compatibility)
      agentName: finalAgentName ? capitalizeName(finalAgentName) : null,
      agentPhone: finalAgentPhone || null,
      dealerName: finalAgentName ? capitalizeName(finalAgentName) : null, // Legacy field, kept for backward compatibility
      dealerPhone: finalAgentPhone || null, // Legacy field, kept for backward compatibility
      status: 'On Modification',
      modificationComplete: false,
      createdBy: req.user._id
    }
    
    // Add manufacturing month and year if valid
    if (vehicleMonth && !isNaN(vehicleMonth) && vehicleMonth >= 1 && vehicleMonth <= 12) {
      vehicleData.vehicleMonth = vehicleMonth
    }
    
    if (vehicleYear && !isNaN(vehicleYear) && vehicleYear >= 1900) {
      vehicleData.vehicleYear = vehicleYear
      // Also set year field for backward compatibility
      vehicleData.year = vehicleYear
    }

    // purchaseMonth and purchaseYear will be auto-set from createdAt in pre-save hook
    // No need to set them manually here

    // Process purchase payment methods - convert "NIL" to 0 for calculations
    const processedPaymentMethods = {}
    Object.entries(purchasePaymentMethods).forEach(([mode, amount]) => {
      if (amount === 'NIL' || amount === 'nil' || (typeof amount === 'string' && amount.trim().toUpperCase() === 'NIL')) {
        processedPaymentMethods[mode] = 0 // Use 0 for calculations
      } else {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount)
        processedPaymentMethods[mode] = isNaN(numAmount) ? 0 : numAmount
      }
    })
    vehicleData.purchasePaymentMethods = processedPaymentMethods
    
    // Store deductions notes if provided
    if (req.body.deductionsNotes) {
      vehicleData.deductionsNotes = req.body.deductionsNotes.trim()
    }
    
    // Generate payment method summary string for backward compatibility
    const paymentMethodParts = []
    Object.entries(processedPaymentMethods).forEach(([mode, amount]) => {
      const amountNum = typeof amount === 'number' ? amount : parseFloat(amount)
      if (!isNaN(amountNum) && amountNum > 0) {
        paymentMethodParts.push(`${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ₹${amountNum.toLocaleString('en-IN')}`)
      }
      // Don't include 0 amounts in the summary (they show as "NIL" in UI)
    })
    vehicleData.paymentMethod = paymentMethodParts.join(', ') || 'No payment method specified'

    // purchaseMonth and purchaseYear are auto-set from createdAt in pre-save hook
    // No need to set them manually here

    // Add owner type fields
    if (req.body.ownerType) {
      vehicleData.ownerType = req.body.ownerType
      if (req.body.ownerType === 'Custom' && req.body.ownerTypeCustom) {
        vehicleData.ownerTypeCustom = req.body.ownerTypeCustom.trim()
      }
    }

    // Add address fields (Maharashtra)
    if (req.body.addressLine1) {
      vehicleData.addressLine1 = req.body.addressLine1.trim()
    }
    if (req.body.district) {
      vehicleData.district = req.body.district.trim()
    }
    if (req.body.taluka) {
      vehicleData.taluka = req.body.taluka.trim()
    }
    if (req.body.pincode) {
      vehicleData.pincode = req.body.pincode.trim()
    }

    // Add remaining amount to seller
    if (req.body.remainingAmountToSeller && !isNaN(parseFloat(req.body.remainingAmountToSeller))) {
      const remainingToSeller = parseFloat(req.body.remainingAmountToSeller)
      if (remainingToSeller > 0) {
        vehicleData.remainingAmountToSeller = remainingToSeller
        vehicleData.pendingPaymentType = 'PENDING_TO_SELLER'
      }
    }

    // Add optional fields
    if (notes) {
      vehicleData.notes = notes
    }
    
      // Only admin can set asking price and agent commission
      if (req.user.role === 'admin') {
        if (askingPrice && !isNaN(parseFloat(askingPrice))) {
          vehicleData.askingPrice = parseFloat(askingPrice)
        }
        // Agent commission and phone are admin-only - purchase manager cannot set them
        if (req.body.agentCommission !== undefined && req.body.agentCommission !== null) {
          const commissionValue = req.body.agentCommission
          if (commissionValue === '' || commissionValue === 'NIL' || commissionValue === 'nil' || 
              (typeof commissionValue === 'string' && commissionValue.trim().toUpperCase() === 'NIL')) {
            vehicleData.agentCommission = 0 // Default to 0 for calculations
          } else {
            const parsedCommission = parseFloat(commissionValue)
            vehicleData.agentCommission = isNaN(parsedCommission) ? 0 : parsedCommission
          }
        }
        if (req.body.agentPhone) {
          vehicleData.agentPhone = req.body.agentPhone.trim()
        }
      }

    const vehicle = new Vehicle(vehicleData)

    await vehicle.save()

    // Handle image uploads (before modification) - using shared IMAGE_SLOTS configuration
    const imagePromises = []
    let otherImageIndex = 0

    IMAGE_SLOTS.forEach(slot => {
      const files = req.files[slot.fieldName] || []
      
      files.forEach((file, index) => {
        const imageUrl = `/uploads/vehicles/${file.filename}`
        // Calculate order: for 'other' category, increment from 7
        const imageOrder = slot.category === 'other' ? slot.order + otherImageIndex : slot.order
        if (slot.category === 'other') {
          otherImageIndex++
        }
        
        const imagePromise = VehicleImage.create({
          vehicleId: vehicle._id,
          imageUrl,
          category: slot.category,
          stage: 'before',
          order: imageOrder, // Maintain explicit order
          uploadedBy: req.user._id,
          isPrimary: slot.category === 'front' && index === 0 // First front image is primary
        })
        imagePromises.push(imagePromise)
      })
    })

    // Handle document uploads
    const documentTypes = {
      'insurance': 'insurance',
      'rc': 'rc',
      'bank_noc': 'bank_noc',
      'kyc': 'kyc',
      'tt_form': 'tt_form',
      'papers_on_hold': 'papers_on_hold',
      'puc': 'puc',
      'service_record': 'service_record',
      'other': 'other'
    }

    const documentPromises = []
    Object.entries(documentTypes).forEach(([fieldName, docType]) => {
      const files = req.files[fieldName] || []
      files.forEach(file => {
        const docUrl = `/uploads/vehicles/${file.filename}`
        const docPromise = VehicleDocument.create({
          vehicleId: vehicle._id,
          documentUrl: docUrl,
          documentType: docType,
          documentName: file.originalname,
          uploadedBy: req.user._id
        })
        documentPromises.push(docPromise)
      })
    })

    // Wait for all images and documents to be saved
    await Promise.all([...imagePromises, ...documentPromises])

    // Fetch the complete vehicle with images and documents
    const vehicleWithDetails = await Vehicle.findById(vehicle._id)
      .populate('createdBy', 'name email')
      .lean()

    // Get images sorted by order (for after-modification) or by creation date (for before-modification)
    const images = await VehicleImage.find({ vehicleId: vehicle._id })
      .sort({ stage: 1, order: 1, createdAt: 1 })
    const documents = await VehicleDocument.find({ vehicleId: vehicle._id })

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: {
        ...vehicleWithDetails,
        images,
        documents
      }
    })
  } catch (error) {
    console.error('Create vehicle error:', error)
    
    // Handle multer file filter errors
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        message: error.message,
        error: 'File validation failed'
      })
    }
    
    // Handle duplicate vehicle number
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vehicle number already exists' })
    }
    
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/vehicles
// @desc    Get all vehicles (excludes DELETED by default)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, includeDeleted } = req.query
    let query = {}

    // Exclude deleted vehicles by default (unless explicitly requested by admin)
    if (includeDeleted !== 'true' || req.user.role !== 'admin') {
      query.status = { $ne: 'DELETED' }
    }

    if (status) {
      query.status = status === 'DELETED' && req.user.role === 'admin' ? 'DELETED' : status
    }

    if (search) {
      query.$or = [
        { vehicleNo: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ]
    }

    // For Purchase Managers: Only show vehicles they created
    // For Admin: Show all vehicles
    if (req.user.role === 'purchase') {
      query.createdBy = req.user._id
    }

    const vehicles = await Vehicle.find(query)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .populate('paymentSettlementHistory.settledBy', 'name email')
      .populate('purchaseNoteHistory.generatedBy', 'name email')
      .populate('deliveryNoteHistory.generatedBy', 'name email')
      .sort({ createdAt: -1 })

    // Get images and documents for each vehicle
    const vehiclesWithDetails = await Promise.all(
      vehicles.map(async (vehicle) => {
        const images = await VehicleImage.find({ vehicleId: vehicle._id })
          .sort({ stage: 1, order: 1, createdAt: 1 }) // Maintain explicit image order
        const documents = await VehicleDocument.find({ vehicleId: vehicle._id })
        
        // Track missing documents
        const allDocumentTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record']
        const uploadedDocTypes = documents.map(doc => doc.documentType)
        const missingDocuments = allDocumentTypes.filter(docType => !uploadedDocTypes.includes(docType))
        
        const vehicleObj = vehicle.toObject()
        
        // Hide purchase price from non-admin users
        if (req.user.role !== 'admin') {
          delete vehicleObj.purchasePrice
        }
        
        return {
          ...vehicleObj,
          images,
          documents,
          missingDocuments
        }
      })
    )

    res.json(vehiclesWithDetails)
  } catch (error) {
    console.error('Get vehicles error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .populate('paymentSettlementHistory.settledBy', 'name email')
      .populate('purchaseNoteHistory.generatedBy', 'name email')
      .populate('deliveryNoteHistory.generatedBy', 'name email')

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Get images sorted by order (for after-modification) or by creation date for before-modification)
    const images = await VehicleImage.find({ vehicleId: vehicle._id })
      .sort({ stage: 1, order: 1, createdAt: 1 })
    const documents = await VehicleDocument.find({ vehicleId: vehicle._id })
    
    // Track missing documents
    const allDocumentTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record']
    const uploadedDocTypes = documents.map(doc => doc.documentType)
    const missingDocuments = allDocumentTypes.filter(docType => !uploadedDocTypes.includes(docType))

    const vehicleObj = vehicle.toObject()
    
    // Hide purchase price from non-admin users
    if (req.user.role !== 'admin') {
      delete vehicleObj.purchasePrice
    }

    res.json({
      ...vehicleObj,
      images,
      documents,
      missingDocuments
    })
  } catch (error) {
    console.error('Get vehicle error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle (Admin can edit all fields, Sales can mark as sold and update payment)
// @access  Private (Admin, Sales)
router.put('/:id', authenticate, authorize('admin', 'sales'), upload.fields([
  { name: 'front_images', maxCount: 1 },
  { name: 'back_images', maxCount: 1 },
  { name: 'right_side_images', maxCount: 1 },
  { name: 'left_side_images', maxCount: 1 },
  { name: 'interior_images', maxCount: 1 },
  { name: 'interior_2_images', maxCount: 1 },
  { name: 'engine_images', maxCount: 1 },
  { name: 'other_images', maxCount: 10 },
  { name: 'insurance', maxCount: 1 },
  { name: 'rc', maxCount: 1 },
  { name: 'bank_noc', maxCount: 1 },
  { name: 'kyc', maxCount: 5 },
  { name: 'tt_form', maxCount: 1 },
  { name: 'papers_on_hold', maxCount: 5 },
  { name: 'puc', maxCount: 1 },
  { name: 'service_record', maxCount: 5 },
  { name: 'other', maxCount: 5 }
]), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Helper function to capitalize first letter of each word
    const capitalizeName = (name) => {
      if (!name) return ''
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    // Role-based field restrictions
    const isAdmin = req.user.role === 'admin'
    const isSales = req.user.role === 'sales'

    // Define updateable fields based on role
    let updateFields = []
    
    if (isAdmin) {
      // Admin can update all fields
      updateFields = [
        'make', 'model', 'year', 'vehicleMonth', 'vehicleYear', 'color', 'fuelType', 'kilometers',
        'purchasePrice', 'askingPrice', 'lastPrice', 'purchaseDate', 'paymentMethod',
        'agentCommission', 'sellerName', 'sellerContact', 'agentName',
        'agentPhone', 'dealerName', 'dealerPhone', 'notes', 'status',
        // Purchase month/year and owner type
        'purchaseMonth', 'purchaseYear', 'ownerType', 'ownerTypeCustom',
        // Address fields
        'addressLine1', 'district', 'taluka', 'pincode',
        // Modification workflow fields
        'modificationCost', 'modificationNotes',
        // Chassis and engine numbers (admin only for chassis)
        'chassisNo', 'engineNo',
        // Customer information
        'customerName', 'customerContact', 'customerAlternateContact', 'customerEmail',
        'customerAddress', 'customerAddressLine1', 'customerDistrict', 'customerTaluka', 'customerPincode',
        'customerAadhaar', 'customerPAN', 'customerSource', 'saleDate',
        // Payment details
        'paymentType', 'paymentCash', 'paymentBankTransfer', 'paymentOnline', 'paymentLoan',
        'remainingAmount', 'saleNotes'
      ]
    } else if (isSales) {
      // Sales can only update sale-related fields and mark as paid
      updateFields = [
        'lastPrice', 'status',
        // Customer information
        'customerName', 'customerContact', 'customerAlternateContact', 'customerEmail',
        'customerAddress', 'customerAddressLine1', 'customerDistrict', 'customerTaluka', 'customerPincode',
        'customerAadhaar', 'customerPAN', 'customerSource', 'saleDate',
        // Payment details
        'paymentType', 'paymentCash', 'paymentBankTransfer', 'paymentOnline', 'paymentLoan',
        'remainingAmount', 'saleNotes'
      ]
    }

    // Handle purchase payment methods update
    if (req.body.purchasePaymentMethods) {
      try {
        const purchasePaymentMethods = JSON.parse(req.body.purchasePaymentMethods)
        // Convert "NIL" strings to null for storage
        const processedPaymentMethods = {}
        Object.entries(purchasePaymentMethods).forEach(([mode, amount]) => {
          if (amount === 'NIL' || amount === 'nil' || (typeof amount === 'string' && amount.trim().toUpperCase() === 'NIL')) {
            processedPaymentMethods[mode] = 0 // Use 0 for calculations
          } else {
            const numAmount = typeof amount === 'number' ? amount : parseFloat(amount)
            processedPaymentMethods[mode] = isNaN(numAmount) ? 0 : numAmount
          }
        })
        vehicle.purchasePaymentMethods = processedPaymentMethods
        
        // Update payment method summary string for backward compatibility
        const paymentMethodParts = []
        Object.entries(processedPaymentMethods).forEach(([mode, amount]) => {
          const amountNum = typeof amount === 'number' ? amount : parseFloat(amount)
          if (!isNaN(amountNum) && amountNum > 0) {
            paymentMethodParts.push(`${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ₹${amountNum.toLocaleString('en-IN')}`)
          }
          // Don't include 0 amounts in the summary (they show as "NIL" in UI)
        })
        vehicle.paymentMethod = paymentMethodParts.join(', ') || 'No payment method specified'
      } catch (error) {
        console.error('Error parsing purchase payment methods:', error)
      }
    }
    
    // Handle deductions notes update
    if (req.body.deductionsNotes !== undefined) {
      vehicle.deductionsNotes = req.body.deductionsNotes.trim() || ''
    }

    // Handle agentName/agentPhone updates (also update legacy dealerName/dealerPhone fields for backward compatibility)
    if (req.body.agentName !== undefined) {
      vehicle.agentName = req.body.agentName ? capitalizeName(req.body.agentName) : null
      vehicle.dealerName = vehicle.agentName // Keep legacy field in sync for backward compatibility
    }
    if (req.body.agentPhone !== undefined) {
      vehicle.agentPhone = req.body.agentPhone && req.body.agentPhone.trim() ? req.body.agentPhone.trim() : null
      vehicle.dealerPhone = vehicle.agentPhone // Keep legacy field in sync for backward compatibility
    }

    // Store old values for settlement tracking (before updates)
    const oldRemainingFromCustomer = parseFloat(vehicle.remainingAmount) || 0
    const oldRemainingToSeller = parseFloat(vehicle.remainingAmountToSeller) || 0
    const oldCash = parseFloat(vehicle.paymentCash) || 0
    const oldBank = parseFloat(vehicle.paymentBankTransfer) || 0
    const oldOnline = parseFloat(vehicle.paymentOnline) || 0
    const oldLoan = parseFloat(vehicle.paymentLoan) || 0

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Additional restrictions for sales role
        if (isSales) {
          // Sales cannot modify purchase-related fields
          // Note: purchaseMonth/purchaseYear are auto-set from createdAt, so they're not editable anyway
          if (['purchasePrice', 'askingPrice', 'purchaseDate', 'purchaseMonth', 'purchaseYear',
               'paymentMethod', 'purchasePaymentMethods', 'agentCommission', 'agentPhone',
               'sellerName', 'sellerContact', 'dealerName', 'dealerPhone', 'ownerType', 
               'ownerTypeCustom', 'addressLine1', 'district', 'taluka', 'pincode',
               'remainingAmountToSeller', 'pendingPaymentType', 'chassisNo', 'engineNo'].includes(field)) {
            return // Skip this field for sales role
          }
        }
        
        // Chassis number can only be edited by admin (with audit logging)
        if (field === 'chassisNo' && !isAdmin) {
          return // Skip chassis number update for non-admin
        }
        
        // Engine number can only be edited by admin after creation
        if (field === 'engineNo' && !isAdmin) {
          return // Skip engine number update for non-admin
        }
        
        // Agent commission and agent phone can only be edited by admin
        if ((field === 'agentCommission' || field === 'agentPhone') && !isAdmin) {
          return // Skip agent commission and phone update for non-admin
        }

        // purchaseMonth and purchaseYear are auto-set from createdAt, don't allow manual editing
        if (field === 'purchaseMonth' || field === 'purchaseYear') {
          return // Skip - these are auto-set from createdAt
        }
        
        if (field === 'year' || field === 'vehicleYear') {
          const parsedValue = parseInt(req.body[field])
          if (!isNaN(parsedValue) && parsedValue >= 1900) {
            vehicle[field] = parsedValue
            // Keep year and vehicleYear in sync
            if (field === 'vehicleYear') {
              vehicle.year = parsedValue
            } else if (field === 'year') {
              vehicle.vehicleYear = parsedValue
            }
          }
        } else if (field === 'vehicleMonth') {
          const parsedValue = parseInt(req.body[field])
          if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 12) {
            vehicle[field] = parsedValue
          }
        } else if (['purchasePrice', 'askingPrice', 'lastPrice', 'agentCommission', 
                     'paymentCash', 'paymentBankTransfer', 'paymentOnline', 'paymentLoan', 
                     'remainingAmount', 'remainingAmountToSeller', 'modificationCost'].includes(field)) {
          // Handle "NIL" string values and empty strings - convert to 0 for calculation fields
          const value = req.body[field]
          
          // All payment fields default to 0 for calculations (UI shows "NIL" for display)
          // Fields used in calculations: modificationCost, agentCommission, paymentCash, etc.
          if (value === 'NIL' || value === 'nil' || value === '' || 
              (typeof value === 'string' && value.trim().toUpperCase() === 'NIL') ||
              value === null || value === undefined) {
            // Convert empty/NIL to 0 (for calculations)
            vehicle[field] = 0
          } else {
            const numValue = parseFloat(value)
            if (isNaN(numValue)) {
              vehicle[field] = 0 // Default to 0 for invalid values
            } else {
              vehicle[field] = numValue
            }
          }
        } else if (field === 'dealerName' || field === 'sellerName' || field === 'customerName' || field === 'agentName') {
          // Normalize agent, seller, customer names
          vehicle[field] = capitalizeName(req.body[field])
          // Keep legacy dealerName field in sync with agentName (use agentName instead)
          if (field === 'agentName') {
            vehicle.dealerName = vehicle.agentName
          }
        } else if (field === 'agentPhone') {
          vehicle[field] = req.body[field]?.trim() || ''
          // Keep legacy dealerPhone field in sync with agentPhone (use agentPhone instead)
          vehicle.dealerPhone = vehicle.agentPhone
        } else if (field === 'customerPincode') {
          // Validate pincode format (6 digits)
          const pincode = req.body[field]?.trim() || ''
          if (pincode && !/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ 
              message: 'Customer pincode must be exactly 6 digits' 
            })
          }
          vehicle[field] = pincode
        } else if (field === 'chassisNo') {
          // Admin-only field with audit logging
          const oldValue = vehicle.chassisNo || ''
          const newValue = req.body[field] ? req.body[field].trim().toUpperCase() : ''
          if (oldValue !== newValue) {
            vehicle.chassisNoHistory = vehicle.chassisNoHistory || []
            vehicle.chassisNoHistory.push({
              oldValue,
              newValue,
              changedBy: req.user._id,
              changedAt: new Date()
            })
            vehicle.chassisNo = newValue
          }
        } else if (field === 'engineNo') {
          // Admin-only field with audit logging
          const oldValue = vehicle.engineNo || ''
          const newValue = req.body[field] ? req.body[field].trim().toUpperCase() : ''
          if (oldValue !== newValue) {
            vehicle.engineNoHistory = vehicle.engineNoHistory || []
            vehicle.engineNoHistory.push({
              oldValue,
              newValue,
              changedBy: req.user._id,
              changedAt: new Date()
            })
            vehicle.engineNo = newValue
          }
        } else if (field === 'saleDate' || field === 'purchaseDate') {
          vehicle[field] = req.body[field] ? new Date(req.body[field]) : undefined
        } else if (field === 'ownerTypeCustom' && req.body.ownerType !== 'Custom') {
          // Clear custom owner type if owner type is not Custom
          vehicle[field] = ''
        } else if (field === 'pendingPaymentType') {
          // Handle pending payment type
          vehicle[field] = req.body[field] || ''
        } else {
          vehicle[field] = req.body[field]
        }
      }
    })
    
    // For sales role, also update modifiedBy
    if (isSales) {
      vehicle.modifiedBy = req.user._id
    }

    // Track payment settlements for audit (after all fields are updated)
    const newRemainingFromCustomer = parseFloat(vehicle.remainingAmount) || 0
    const newRemainingToSeller = parseFloat(vehicle.remainingAmountToSeller) || 0
    const newCash = parseFloat(vehicle.paymentCash) || 0
    const newBank = parseFloat(vehicle.paymentBankTransfer) || 0
    const newOnline = parseFloat(vehicle.paymentOnline) || 0
    const newLoan = parseFloat(vehicle.paymentLoan) || 0

    // Track settlement when remaining amount from customer decreases
    if (oldRemainingFromCustomer > newRemainingFromCustomer && oldRemainingFromCustomer > 0) {
      const settlementAmount = oldRemainingFromCustomer - newRemainingFromCustomer
      
      // Determine payment mode by checking which payment method increased
      let paymentMode = 'cash' // default
      if (newCash > oldCash) paymentMode = 'cash'
      else if (newBank > oldBank) paymentMode = 'bankTransfer'
      else if (newOnline > oldOnline) paymentMode = 'online'
      else if (newLoan > oldLoan) paymentMode = 'loan'
      
      // Initialize settlement history if it doesn't exist
      if (!vehicle.paymentSettlementHistory) {
        vehicle.paymentSettlementHistory = []
      }
      
      // Add settlement record
      vehicle.paymentSettlementHistory.push({
        settlementType: 'FROM_CUSTOMER',
        amount: settlementAmount,
        paymentMode,
        settledBy: req.user._id,
        settledAt: new Date(),
        notes: req.body.settlementNotes || ''
      })
    }

    // Track settlement when remaining amount to seller decreases
    if (oldRemainingToSeller > newRemainingToSeller && oldRemainingToSeller > 0) {
      const settlementAmount = oldRemainingToSeller - newRemainingToSeller
      
      // Determine payment mode by checking which payment method increased
      let paymentMode = 'cash' // default
      if (newCash > oldCash) paymentMode = 'cash'
      else if (newBank > oldBank) paymentMode = 'bankTransfer'
      else if (newOnline > oldOnline) paymentMode = 'online'
      else if (newLoan > oldLoan) paymentMode = 'loan'
      
      // Initialize settlement history if it doesn't exist
      if (!vehicle.paymentSettlementHistory) {
        vehicle.paymentSettlementHistory = []
      }
      
      // Add settlement record
      vehicle.paymentSettlementHistory.push({
        settlementType: 'TO_SELLER',
        amount: settlementAmount,
        paymentMode,
        settledBy: req.user._id,
        settledAt: new Date(),
        notes: req.body.settlementNotes || ''
      })
    }

    // Handle security cheque payment
    if (req.body['paymentSecurityCheque[enabled]'] === 'true') {
      const chequeAmount = parseFloat(req.body['paymentSecurityCheque[amount]']) || 0
      vehicle.paymentSecurityCheque = {
        enabled: true,
        bankName: req.body['paymentSecurityCheque[bankName]'] || '',
        accountNumber: req.body['paymentSecurityCheque[accountNumber]'] || '',
        chequeNumber: req.body['paymentSecurityCheque[chequeNumber]'] || '',
        amount: chequeAmount
      }
      // When security cheque is enabled, remaining amount = security cheque amount
      // This is handled in the updateFields loop above, but we ensure it here
      if (req.body.remainingAmount === undefined) {
        vehicle.remainingAmount = chequeAmount
      }
    } else if (req.body['paymentSecurityCheque[enabled]'] === 'false') {
      // Reset security cheque if explicitly disabled
      vehicle.paymentSecurityCheque = {
        enabled: false,
        bankName: '',
        accountNumber: '',
        chequeNumber: '',
        amount: 0
      }
      // If remaining amount becomes 0, security cheque should be disabled
      if (req.body.remainingAmount !== undefined && parseFloat(req.body.remainingAmount) === 0) {
        vehicle.paymentSecurityCheque.enabled = false
      }
    }

    vehicle.modifiedBy = req.user._id
    await vehicle.save()

    // Handle after-modification image uploads - using shared IMAGE_SLOTS configuration
    const imagePromises = []
    let hasAfterImages = false
    let otherImageIndex = 0

    IMAGE_SLOTS.forEach(slot => {
      const files = req.files[slot.fieldName] || []
      
      if (files.length > 0) {
        hasAfterImages = true
      }
      
      files.forEach((file, index) => {
        const imageUrl = `/uploads/vehicles/${file.filename}`
        // Calculate order: for 'other' category, increment from 7
        const imageOrder = slot.category === 'other' ? slot.order + otherImageIndex : slot.order
        if (slot.category === 'other') {
          otherImageIndex++
        }
        
        const imagePromise = VehicleImage.create({
          vehicleId: vehicle._id,
          imageUrl,
          category: slot.category,
          stage: 'after', // Admin uploads are "after" modification
          order: imageOrder, // Maintain explicit order
          uploadedBy: req.user._id,
          isPrimary: false
        })
        imagePromises.push(imagePromise)
      })
    })

    // Handle document deletions (if provided)
    if (req.body.deletedDocumentIds) {
      try {
        const deletedIds = JSON.parse(req.body.deletedDocumentIds)
        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
          // Find documents to delete and remove their files
          const documentsToDelete = await VehicleDocument.find({
            _id: { $in: deletedIds },
            vehicleId: vehicle._id
          })
          
          // Delete physical files
          documentsToDelete.forEach(doc => {
            const filePath = path.join(__dirname, '..', '..', 'public', doc.documentUrl)
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath)
              } catch (err) {
                console.error(`Error deleting file ${filePath}:`, err)
              }
            }
          })
          
          // Delete document records from database
          await VehicleDocument.deleteMany({
            _id: { $in: deletedIds },
            vehicleId: vehicle._id
          })
        }
      } catch (error) {
        console.error('Error parsing deletedDocumentIds:', error)
      }
    }

    // Handle additional document uploads
    const documentTypes = {
      'insurance': 'insurance',
      'rc': 'rc',
      'bank_noc': 'bank_noc',
      'kyc': 'kyc',
      'tt_form': 'tt_form',
      'papers_on_hold': 'papers_on_hold',
      'puc': 'puc',
      'service_record': 'service_record',
      'other': 'other'
    }

    const documentPromises = []
    Object.entries(documentTypes).forEach(([fieldName, docType]) => {
      const files = req.files[fieldName] || []
      files.forEach(file => {
        const docUrl = `/uploads/vehicles/${file.filename}`
        const docPromise = VehicleDocument.create({
          vehicleId: vehicle._id,
          documentUrl: docUrl,
          documentType: docType,
          documentName: file.originalname,
          uploadedBy: req.user._id
        })
        documentPromises.push(docPromise)
      })
    })

    // Wait for all images and documents to be saved
    await Promise.all([...imagePromises, ...documentPromises])

    // Check if modification is complete and auto-transition status (after all uploads are saved)
    const isModificationComplete = await checkModificationComplete(vehicle)
    
    if (isModificationComplete && vehicle.status === 'On Modification') {
      vehicle.status = 'In Stock'
      vehicle.modificationComplete = true
      await vehicle.save()
    }

    // Fetch updated vehicle with images and documents
    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .populate('paymentSettlementHistory.settledBy', 'name email')
      .lean()

    // Get images sorted by order (for after-modification) or by creation date (for before-modification)
    const images = await VehicleImage.find({ vehicleId: vehicle._id })
      .sort({ stage: 1, order: 1, createdAt: 1 })
    const documents = await VehicleDocument.find({ vehicleId: vehicle._id })

    const statusMessage = updatedVehicle.status === 'In Stock' 
      ? 'Vehicle updated successfully! Status changed to "In Stock" as all modification fields are complete.'
      : 'Vehicle updated successfully!'

    res.json({
      message: statusMessage,
      vehicle: {
        ...updatedVehicle,
        images,
        documents
      }
    })
  } catch (error) {
    console.error('Update vehicle error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/vehicles/:id/purchase-note
// @desc    Generate and download purchase note PDF
// @access  Private (Purchase Manager for own vehicles, Admin for all)
// @query   downloadOnly - If true, only downloads without creating new history entry
router.get('/:id/purchase-note', authenticate, authorize('purchase', 'admin'), async (req, res) => {
  try {
    const { downloadOnly } = req.query
    const isDownloadOnly = downloadOnly === 'true'
    
    // Fetch vehicle with populated fields
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .populate('paymentSettlementHistory.settledBy', 'name email')

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Check if purchase manager can access this vehicle (only their own vehicles)
    if (req.user.role === 'purchase') {
      const createdById = vehicle.createdBy?._id?.toString() || vehicle.createdBy?.toString()
      if (createdById !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only generate purchase notes for vehicles you added' })
      }
    }

    // Save history if needed (handles role-based logic internally)
    await saveHistoryIfNeeded(vehicle, req.user, isDownloadOnly)

    // Generate PDF filename
    const filename = `Purchase_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Generate PDF using service
    const pdfService = new PurchaseNotePDFService()
    const doc = pdfService.generatePDF(vehicle)
    
    // Pipe PDF to response
    doc.pipe(res)
    doc.end()
  } catch (error) {
    console.error('Generate purchase note error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/vehicles/:id/delivery-note
// @desc    Generate and download delivery note PDF
// @access  Private (Sales Manager for own vehicles, Admin for all)
// @query   downloadOnly - If true, only downloads without creating new history entry
router.get('/:id/delivery-note', authenticate, authorize('sales', 'admin'), async (req, res) => {
  try {
    const { downloadOnly } = req.query
    const isDownloadOnly = downloadOnly === 'true'
    
    // Fetch vehicle with populated fields
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .populate('paymentSettlementHistory.settledBy', 'name email')
      .populate('deliveryNoteHistory.generatedBy', 'name email')

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Check if vehicle is sold (delivery notes can only be generated for sold vehicles)
    if (vehicle.status !== 'Sold') {
      return res.status(400).json({ message: 'Delivery notes can only be generated for sold vehicles' })
    }

    // Check if sales manager can access this vehicle (only their own vehicles)
    if (req.user.role === 'sales') {
      const createdById = vehicle.createdBy?._id?.toString() || vehicle.createdBy?.toString()
      if (createdById !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only generate delivery notes for vehicles you added' })
      }
    }

    // Import delivery note history service
    const { saveHistoryIfNeeded } = require('../services/deliveryNoteHistoryService')
    
    // Save history if needed (handles role-based logic internally)
    await saveHistoryIfNeeded(vehicle, req.user, isDownloadOnly)

    // Generate PDF filename
    const filename = `Delivery_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Generate PDF using service
    const DeliveryNotePDFService = require('../services/deliveryNotePDFService')
    const pdfService = new DeliveryNotePDFService()
    const doc = pdfService.generatePDF(vehicle)
    
    // Pipe PDF to response
    doc.pipe(res)
    doc.end()
  } catch (error) {
    console.error('Generate delivery note error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   DELETE /api/vehicles/:id
// @desc    Soft delete a vehicle (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Soft delete: set status to DELETED and record deletion info
    vehicle.status = 'DELETED'
    vehicle.deletedAt = new Date()
    vehicle.deletedBy = req.user._id

    await vehicle.save()

    res.json({
      message: 'Vehicle deleted successfully',
      vehicle: {
        _id: vehicle._id,
        vehicleNo: vehicle.vehicleNo,
        status: vehicle.status,
        deletedAt: vehicle.deletedAt
      }
    })
  } catch (error) {
    console.error('Delete vehicle error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   PUT /api/vehicles/:id/documents
// @desc    Upload documents only (Purchase Manager can only upload documents for vehicles they added)
// @access  Private (Purchase Manager only)
router.put('/:id/documents', authenticate, authorize('purchase'), upload.fields([
  { name: 'insurance', maxCount: 1 },
  { name: 'rc', maxCount: 1 },
  { name: 'bank_noc', maxCount: 1 },
  { name: 'kyc', maxCount: 5 },
  { name: 'tt_form', maxCount: 1 },
  { name: 'papers_on_hold', maxCount: 5 },
  { name: 'puc', maxCount: 1 },
  { name: 'service_record', maxCount: 5 },
  { name: 'other', maxCount: 5 }
]), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Check if the vehicle was created by the current Purchase Manager
    const createdById = vehicle.createdBy?._id?.toString() || vehicle.createdBy?.toString()
    if (createdById !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only upload documents for vehicles you added' 
      })
    }

    // Reject any attempts to modify other fields
    const allowedFields = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record', 'other']
    const bodyFields = Object.keys(req.body).filter(key => !key.startsWith('payment') && !key.includes('['))
    
    // Check if any non-document fields are being sent
    const hasNonDocumentFields = bodyFields.some(field => !allowedFields.includes(field))
    if (hasNonDocumentFields) {
      return res.status(400).json({ 
        message: 'This endpoint only accepts document uploads. Other fields cannot be modified.' 
      })
    }

    // Handle document uploads only
    const documentTypes = {
      'insurance': 'insurance',
      'rc': 'rc',
      'bank_noc': 'bank_noc',
      'kyc': 'kyc',
      'tt_form': 'tt_form',
      'papers_on_hold': 'papers_on_hold',
      'puc': 'puc',
      'service_record': 'service_record',
      'other': 'other'
    }

    const documentPromises = []
    let documentsUploaded = 0

    Object.entries(documentTypes).forEach(([fieldName, docType]) => {
      const files = req.files[fieldName] || []
      files.forEach(file => {
        const docUrl = `/uploads/vehicles/${file.filename}`
        const docPromise = VehicleDocument.create({
          vehicleId: vehicle._id,
          documentUrl: docUrl,
          documentType: docType,
          documentName: file.originalname,
          uploadedBy: req.user._id
        })
        documentPromises.push(docPromise)
        documentsUploaded++
      })
    })

    // Wait for all documents to be saved
    if (documentPromises.length > 0) {
      await Promise.all(documentPromises)
    }

    // Fetch updated vehicle with documents
    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('createdBy', 'name email')
      .lean()

    // Get all documents for the vehicle
    const documents = await VehicleDocument.find({ vehicleId: vehicle._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })

    res.json({
      message: documentsUploaded > 0 
        ? `${documentsUploaded} document(s) uploaded successfully` 
        : 'No documents were uploaded',
      vehicle: {
        ...updatedVehicle,
        documents
      }
    })
  } catch (error) {
    console.error('Upload documents error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
