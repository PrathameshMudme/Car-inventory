const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const PDFDocument = require('pdfkit')
const Vehicle = require('../models/Vehicle')
const VehicleImage = require('../models/VehicleImage')
const VehicleDocument = require('../models/VehicleDocument')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// Helper function to check if vehicle modification is complete
const checkModificationComplete = async (vehicle) => {
  const hasPostModificationImages = await VehicleImage.findOne({ 
    vehicleId: vehicle._id, 
    stage: 'after' 
  })
  
  const hasAskingPrice = vehicle.askingPrice && parseFloat(vehicle.askingPrice) > 0
  const hasLastPrice = vehicle.lastPrice && parseFloat(vehicle.lastPrice) > 0
  const hasModificationCost = vehicle.modificationCost !== undefined && vehicle.modificationCost !== null
  const hasModificationNotes = vehicle.modificationNotes && vehicle.modificationNotes.trim()
  const hasAgentPhone = vehicle.agentPhone && vehicle.agentPhone.trim()
  const hasAgentCommission = vehicle.agentCommission !== undefined && vehicle.agentCommission !== null
  
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
    const allowedTypes = /jpeg|jpg|png|gif|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'))
    }
  }
})

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private (Purchase Manager, Admin)
router.post('/', authenticate, authorize('purchase', 'admin'), upload.fields([
  { name: 'front_images', maxCount: 5 },
  { name: 'back_images', maxCount: 5 },
  { name: 'right_side_images', maxCount: 5 },
  { name: 'left_side_images', maxCount: 5 },
  { name: 'interior_images', maxCount: 5 },
  { name: 'interior_2_images', maxCount: 5 },
  { name: 'engine_images', maxCount: 5 },
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
      year: 'Year',
      color: 'Color',
      kilometers: 'Kilometers',
      purchasePrice: 'Purchase Price',
      sellerName: 'Seller Name',
      sellerContact: 'Seller Contact',
      dealerName: 'Agent Name', // Legacy field name, kept for backward compatibility
      dealerPhone: 'Agent Phone', // Legacy field name, kept for backward compatibility
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

    // Validate purchase month/year or purchaseDate
    if (!req.body.purchaseMonth || !req.body.purchaseYear) {
      if (!req.body.purchaseDate) {
        return res.status(400).json({ 
          message: 'Purchase Month & Year or Purchase Date is required' 
        })
      }
    }

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
    let purchaseMonth = null
    let purchaseYear = null
    if (req.body.purchaseMonth && req.body.purchaseYear) {
      purchaseMonth = parseInt(req.body.purchaseMonth)
      purchaseYear = parseInt(req.body.purchaseYear)
      // Create purchaseDate as first day of the month for backward compatibility
      if (!purchaseDate) {
        purchaseDate = new Date(purchaseYear, purchaseMonth - 1, 1)
      }
    }

    // Create vehicle with all required fields
    const vehicleData = {
      vehicleNo: vehicleNo.toUpperCase(),
      chassisNo: chassisNo ? chassisNo.toUpperCase() : '',
      engineNo: engineNo ? engineNo.toUpperCase() : '',
      make,
      model,
      year: parseInt(year),
      color,
      fuelType: fuelType || 'Petrol',
      kilometers,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      sellerName: capitalizeName(sellerName),
      sellerContact,
      // Use agentName/agentPhone (also set dealerName/dealerPhone for backward compatibility)
      agentName: capitalizeName(agentName || req.body.agentName || ''),
      agentPhone: agentPhone || req.body.agentPhone || '',
      dealerName: capitalizeName(agentName || req.body.agentName || ''), // Legacy field, kept for backward compatibility
      dealerPhone: agentPhone || req.body.agentPhone || '', // Legacy field, kept for backward compatibility
      status: 'On Modification',
      modificationComplete: false,
      createdBy: req.user._id
    }

    // Store structured purchase payment methods
    vehicleData.purchasePaymentMethods = purchasePaymentMethods
    
    // Store deductions notes if provided
    if (req.body.deductionsNotes) {
      vehicleData.deductionsNotes = req.body.deductionsNotes.trim()
    }
    
    // Generate payment method summary string for backward compatibility
    const paymentMethodParts = []
    Object.entries(purchasePaymentMethods).forEach(([mode, amount]) => {
      if (amount === 'NIL' || amount === 'nil') {
        paymentMethodParts.push(`${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: NIL`)
      } else {
        const amountNum = typeof amount === 'number' ? amount : parseFloat(amount)
        if (!isNaN(amountNum) && amountNum > 0) {
          paymentMethodParts.push(`${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ₹${amountNum.toLocaleString('en-IN')}`)
        }
      }
    })
    vehicleData.paymentMethod = paymentMethodParts.join(', ') || 'No payment method specified'

    // Add purchase month and year if provided
    if (purchaseMonth) {
      vehicleData.purchaseMonth = purchaseMonth
    }
    if (purchaseYear) {
      vehicleData.purchaseYear = purchaseYear
    }

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
        if (req.body.agentCommission && !isNaN(parseFloat(req.body.agentCommission))) {
          vehicleData.agentCommission = parseFloat(req.body.agentCommission)
        }
        if (req.body.agentPhone) {
          vehicleData.agentPhone = req.body.agentPhone.trim()
        }
      }

    const vehicle = new Vehicle(vehicleData)

    await vehicle.save()

    // Handle image uploads (before modification)
    const imageCategories = ['front', 'back', 'right_side', 'left_side', 'interior', 'engine']
    const imagePromises = []

    imageCategories.forEach(category => {
      const fieldName = category === 'right_side' ? 'right_side_images' : 
                       category === 'left_side' ? 'left_side_images' :
                       `${category}_images`
      const files = req.files[fieldName] || []
      
      files.forEach((file, index) => {
        const imageUrl = `/uploads/vehicles/${file.filename}`
        const imagePromise = VehicleImage.create({
          vehicleId: vehicle._id,
          imageUrl,
          category,
          stage: 'before',
          order: 0, // Before modification images don't need specific ordering
          uploadedBy: req.user._id,
          isPrimary: category === 'front' && index === 0 // First front image is primary
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
  { name: 'front_images', maxCount: 5 },
  { name: 'back_images', maxCount: 5 },
  { name: 'right_side_images', maxCount: 5 },
  { name: 'left_side_images', maxCount: 5 },
  { name: 'interior_images', maxCount: 5 },
  { name: 'interior_2_images', maxCount: 5 },
  { name: 'engine_images', maxCount: 5 },
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
        'make', 'model', 'year', 'color', 'fuelType', 'kilometers',
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
        'customerAddress', 'customerAadhaar', 'customerPAN', 'customerSource', 'saleDate',
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
        'customerAddress', 'customerAadhaar', 'customerPAN', 'customerSource', 'saleDate',
        // Payment details
        'paymentType', 'paymentCash', 'paymentBankTransfer', 'paymentOnline', 'paymentLoan',
        'remainingAmount', 'saleNotes'
      ]
    }

    // Handle purchase payment methods update
    if (req.body.purchasePaymentMethods) {
      try {
        const purchasePaymentMethods = JSON.parse(req.body.purchasePaymentMethods)
        vehicle.purchasePaymentMethods = purchasePaymentMethods
        
        // Update payment method summary string for backward compatibility
        const paymentMethodParts = []
        Object.entries(purchasePaymentMethods).forEach(([mode, amount]) => {
          if (amount === 'NIL' || amount === 'nil') {
            paymentMethodParts.push(`${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: NIL`)
          } else {
            const amountNum = typeof amount === 'number' ? amount : parseFloat(amount)
            if (!isNaN(amountNum) && amountNum > 0) {
              paymentMethodParts.push(`${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ₹${amountNum.toLocaleString('en-IN')}`)
            }
          }
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

    // Handle agentName/agentPhone updates (also update dealerName/dealerPhone for backward compatibility)
    if (req.body.agentName !== undefined) {
      vehicle.agentName = capitalizeName(req.body.agentName)
      vehicle.dealerName = vehicle.agentName // Keep legacy field in sync for backward compatibility
    }
    if (req.body.agentPhone !== undefined) {
      vehicle.agentPhone = req.body.agentPhone.trim()
      vehicle.dealerPhone = vehicle.agentPhone // Keep legacy field in sync for backward compatibility
    }

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Additional restrictions for sales role
        if (isSales) {
          // Sales cannot modify purchase-related fields
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

        if (field === 'year' || field === 'purchaseMonth' || field === 'purchaseYear') {
          vehicle[field] = parseInt(req.body[field])
        } else if (['purchasePrice', 'askingPrice', 'lastPrice', 'agentCommission', 
                     'paymentCash', 'paymentBankTransfer', 'paymentOnline', 'paymentLoan', 
                     'remainingAmount', 'remainingAmountToSeller', 'modificationCost'].includes(field)) {
          const numValue = parseFloat(req.body[field])
          vehicle[field] = isNaN(numValue) ? (field === 'modificationCost' ? null : 0) : numValue
        } else if (field === 'dealerName' || field === 'sellerName' || field === 'customerName' || field === 'agentName') {
          // Normalize agent, seller, customer names
          vehicle[field] = capitalizeName(req.body[field])
          // Keep legacy dealerName field in sync with agentName for backward compatibility
          if (field === 'agentName') {
            vehicle.dealerName = vehicle.agentName
          }
        } else if (field === 'agentPhone') {
          vehicle[field] = req.body[field]?.trim() || ''
          // Keep legacy dealerPhone field in sync with agentPhone for backward compatibility
          vehicle.dealerPhone = vehicle.agentPhone
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

    // Handle after-modification image uploads with fixed order
    // Order: 1=Front, 2=Back, 3=Right, 4=Left, 5=Interior 1, 6=Interior 2, 7=Engine, 8+=Other
    const imageSlots = [
      { category: 'front', fieldName: 'front_images', order: 1 },
      { category: 'back', fieldName: 'back_images', order: 2 },
      { category: 'right_side', fieldName: 'right_side_images', order: 3 },
      { category: 'left_side', fieldName: 'left_side_images', order: 4 },
      { category: 'interior', fieldName: 'interior_images', order: 5 },
      { category: 'interior_2', fieldName: 'interior_2_images', order: 6 },
      { category: 'engine', fieldName: 'engine_images', order: 7 },
      { category: 'other', fieldName: 'other_images', order: 8 }
    ]
    
    const imagePromises = []
    let hasAfterImages = false
    let otherImageIndex = 0

    imageSlots.forEach(slot => {
      const files = req.files[slot.fieldName] || []
      
      if (files.length > 0) {
        hasAfterImages = true
      }
      
      files.forEach((file, index) => {
        const imageUrl = `/uploads/vehicles/${file.filename}`
        // Calculate order: for 'other' category, increment from 8
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
router.get('/:id/purchase-note', authenticate, authorize('purchase', 'admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')

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

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })
    const filename = `Purchase_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    doc.pipe(res)

    // Header
    doc.fontSize(20).font('Helvetica-Bold')
      .text('PURCHASE NOTE', { align: 'center' })
    doc.moveDown(0.5)
    
    doc.fontSize(12).font('Helvetica')
      .text(`Date: ${new Date(vehicle.purchaseDate).toLocaleDateString('en-IN')}`, { align: 'right' })
    doc.moveDown(1)

    // Vehicle Details Section
    doc.fontSize(16).font('Helvetica-Bold')
      .text('VEHICLE DETAILS', { underline: true })
    doc.moveDown(0.5)
    
    doc.fontSize(11).font('Helvetica')
    const vehicleDetails = [
      ['Vehicle Number:', vehicle.vehicleNo],
      ['Chassis Number:', vehicle.chassisNo || 'N/A'],
      ['Make:', vehicle.make],
      ['Model:', vehicle.model || 'N/A'],
      ['Year:', vehicle.year || 'N/A'],
      ['Color:', vehicle.color || 'N/A'],
      ['Fuel Type:', vehicle.fuelType || 'N/A'],
      ['Kilometers:', vehicle.kilometers || 'N/A']
    ]

    let startY = doc.y
    vehicleDetails.forEach(([label, value], index) => {
      doc.font('Helvetica-Bold').text(label, 50, startY + (index * 20), { width: 200 })
      doc.font('Helvetica').text(value || 'N/A', 250, startY + (index * 20), { width: 300 })
    })
    
    doc.y = startY + (vehicleDetails.length * 20) + 10
    doc.moveDown(1)

    // Purchase Details Section
    doc.fontSize(16).font('Helvetica-Bold')
      .text('PURCHASE DETAILS', { underline: true })
    doc.moveDown(0.5)
    
    doc.fontSize(11).font('Helvetica')
    const purchaseDetails = [
      ['Purchase Price:', `₹${vehicle.purchasePrice?.toLocaleString('en-IN') || '0'}`],
      ['Asking Price:', vehicle.askingPrice ? `₹${vehicle.askingPrice.toLocaleString('en-IN')}` : 'N/A'],
      ['Payment Method:', vehicle.paymentMethod || 'N/A'],
      ['Agent Commission:', vehicle.agentCommission ? `₹${vehicle.agentCommission.toLocaleString('en-IN')}` : 'N/A']
    ]

    startY = doc.y
    purchaseDetails.forEach(([label, value], index) => {
      doc.font('Helvetica-Bold').text(label, 50, startY + (index * 20), { width: 200 })
      doc.font('Helvetica').text(value || 'N/A', 250, startY + (index * 20), { width: 300 })
    })
    
    // Add Deductions Notes if deductions exist and notes are provided
    if (vehicle.purchasePaymentMethods?.get('deductions') && 
        parseFloat(vehicle.purchasePaymentMethods.get('deductions')) > 0 && 
        vehicle.deductionsNotes) {
      doc.y = startY + (purchaseDetails.length * 20) + 10
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold').text('Deductions Notes:', 50, doc.y, { width: 200 })
      doc.font('Helvetica').text(vehicle.deductionsNotes, 250, doc.y, { width: 300, align: 'left' })
      doc.moveDown(1)
    } else {
      doc.y = startY + (purchaseDetails.length * 20) + 10
      doc.moveDown(1)
    }

    // Seller/Agent Details Section
    if (vehicle.sellerName || vehicle.agentName || vehicle.dealerName) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('SELLER/AGENT DETAILS', { underline: true })
      doc.moveDown(0.5)
      
      doc.fontSize(11).font('Helvetica')
      const sellerAgentDetails = [
        ['Seller Name:', vehicle.sellerName || 'N/A'],
        ['Seller Contact:', vehicle.sellerContact || 'N/A'],
        ['Agent Name:', vehicle.agentName || vehicle.dealerName || 'N/A'],
        ['Agent Phone:', vehicle.agentPhone || vehicle.dealerPhone || 'N/A']
      ]

      startY = doc.y
      sellerAgentDetails.forEach(([label, value], index) => {
        doc.font('Helvetica-Bold').text(label, 50, startY + (index * 20), { width: 200 })
        doc.font('Helvetica').text(value || 'N/A', 250, startY + (index * 20), { width: 300 })
      })
      
      doc.y = startY + (sellerAgentDetails.length * 20) + 10
      doc.moveDown(1)
    }

    // Notes Section
    if (vehicle.notes) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('NOTES', { underline: true })
      doc.moveDown(0.5)
      
      doc.fontSize(11).font('Helvetica')
        .text(vehicle.notes, { width: 500 })
      doc.moveDown(1)
    }

    // Footer
    doc.fontSize(10).font('Helvetica')
      .text(`Generated by: ${vehicle.createdBy?.name || 'System'}`, 50, doc.page.height - 100)
      .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, doc.page.height - 85)

    doc.end()
  } catch (error) {
    console.error('Generate purchase note error:', error)
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

module.exports = router
