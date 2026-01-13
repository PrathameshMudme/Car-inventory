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
  { name: 'engine_images', maxCount: 5 },
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
      make,
      model,
      year,
      color,
      fuelType,
      kilometers,
      purchasePrice,
      askingPrice,
      purchaseDate,
      paymentMethod,
      agentCommission,
      sellerName,
      sellerContact,
      dealerName,
      dealerPhone,
      notes
    } = req.body

    // Validate required fields (all fields except documents are required)
    const requiredFields = {
      vehicleNo: 'Vehicle Number',
      chassisNo: 'Chassis Number',
      make: 'Make',
      model: 'Model',
      year: 'Year',
      color: 'Color',
      kilometers: 'Kilometers',
      purchasePrice: 'Purchase Price',
      purchaseDate: 'Purchase Date',
      paymentMethod: 'Payment Method',
      sellerName: 'Seller Name',
      sellerContact: 'Seller Contact',
      dealerName: 'Dealer Name',
      dealerPhone: 'Dealer Phone'
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

    // Create vehicle with all required fields
    const vehicleData = {
      vehicleNo: vehicleNo.toUpperCase(),
      chassisNo: chassisNo.toUpperCase(),
      make,
      model,
      year: parseInt(year),
      color,
      fuelType: fuelType || 'Petrol',
      kilometers,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      paymentMethod,
      sellerName,
      sellerContact,
      dealerName,
      dealerPhone,
      status: 'On Modification',
      createdBy: req.user._id
    }

    // Add optional fields
    if (agentCommission && !isNaN(parseFloat(agentCommission))) {
      vehicleData.agentCommission = parseFloat(agentCommission)
    }
    if (notes) {
      vehicleData.notes = notes
    }
    
    // Only admin can set asking price
    if (req.user.role === 'admin' && askingPrice && !isNaN(parseFloat(askingPrice))) {
      vehicleData.askingPrice = parseFloat(askingPrice)
    }

    const vehicle = new Vehicle(vehicleData)

    await vehicle.save()

    // Handle image uploads
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

    const images = await VehicleImage.find({ vehicleId: vehicle._id })
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
// @desc    Get all vehicles
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search } = req.query
    let query = {}

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { vehicleNo: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ]
    }

    const vehicles = await Vehicle.find(query)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .sort({ createdAt: -1 })

    // Get images and documents for each vehicle
    const vehiclesWithDetails = await Promise.all(
      vehicles.map(async (vehicle) => {
        const images = await VehicleImage.find({ vehicleId: vehicle._id })
        const documents = await VehicleDocument.find({ vehicleId: vehicle._id })
        
        // Track missing documents
        const allDocumentTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record']
        const uploadedDocTypes = documents.map(doc => doc.documentType)
        const missingDocuments = allDocumentTypes.filter(docType => !uploadedDocTypes.includes(docType))
        
        return {
          ...vehicle.toObject(),
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

    const images = await VehicleImage.find({ vehicleId: vehicle._id })
    const documents = await VehicleDocument.find({ vehicleId: vehicle._id })
    
    // Track missing documents
    const allDocumentTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record']
    const uploadedDocTypes = documents.map(doc => doc.documentType)
    const missingDocuments = allDocumentTypes.filter(docType => !uploadedDocTypes.includes(docType))

    res.json({
      ...vehicle.toObject(),
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
// @desc    Update vehicle (Admin only for now, can add after-modification images)
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin'), upload.fields([
  { name: 'front_images', maxCount: 5 },
  { name: 'back_images', maxCount: 5 },
  { name: 'right_side_images', maxCount: 5 },
  { name: 'left_side_images', maxCount: 5 },
  { name: 'interior_images', maxCount: 5 },
  { name: 'engine_images', maxCount: 5 },
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

    // Update vehicle fields
    const updateFields = [
      'make', 'model', 'year', 'color', 'fuelType', 'kilometers',
      'purchasePrice', 'askingPrice', 'lastPrice', 'purchaseDate', 'paymentMethod',
      'agentCommission', 'sellerName', 'sellerContact', 'dealerName',
      'dealerPhone', 'notes', 'status'
    ]

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'year') {
          vehicle[field] = parseInt(req.body[field])
        } else if (['purchasePrice', 'askingPrice', 'lastPrice', 'agentCommission'].includes(field)) {
          vehicle[field] = parseFloat(req.body[field])
        } else {
          vehicle[field] = req.body[field]
        }
      }
    })

    vehicle.modifiedBy = req.user._id
    await vehicle.save()

    // Handle after-modification image uploads
    const imageCategories = ['front', 'back', 'right_side', 'left_side', 'interior', 'engine']
    const imagePromises = []
    let hasAfterImages = false

    imageCategories.forEach(category => {
      const fieldName = category === 'right_side' ? 'right_side_images' : 
                       category === 'left_side' ? 'left_side_images' :
                       `${category}_images`
      const files = req.files[fieldName] || []
      
      if (files.length > 0) {
        hasAfterImages = true
      }
      
      files.forEach((file, index) => {
        const imageUrl = `/uploads/vehicles/${file.filename}`
        const imagePromise = VehicleImage.create({
          vehicleId: vehicle._id,
          imageUrl,
          category,
          stage: 'after', // Admin uploads are "after" modification
          uploadedBy: req.user._id,
          isPrimary: false
        })
        imagePromises.push(imagePromise)
      })
    })

    // Update status to "In Stock" if admin uploaded after images
    if (hasAfterImages && vehicle.status === 'On Modification') {
      vehicle.status = 'In Stock'
      await vehicle.save()
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

    await Promise.all([...imagePromises, ...documentPromises])

    // Fetch updated vehicle with images and documents
    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .lean()

    const images = await VehicleImage.find({ vehicleId: vehicle._id })
    const documents = await VehicleDocument.find({ vehicleId: vehicle._id })

    res.json({
      message: 'Vehicle updated successfully',
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
// @access  Private (Purchase Manager, Admin)
router.get('/:id/purchase-note', authenticate, authorize('purchase', 'admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
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
    
    doc.y = startY + (purchaseDetails.length * 20) + 10
    doc.moveDown(1)

    // Seller/Dealer Details Section
    if (vehicle.sellerName || vehicle.dealerName) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('SELLER/DEALER DETAILS', { underline: true })
      doc.moveDown(0.5)
      
      doc.fontSize(11).font('Helvetica')
      const sellerDetails = [
        ['Seller Name:', vehicle.sellerName || 'N/A'],
        ['Seller Contact:', vehicle.sellerContact || 'N/A'],
        ['Dealer Name:', vehicle.dealerName || 'N/A'],
        ['Dealer Phone:', vehicle.dealerPhone || 'N/A']
      ]

      startY = doc.y
      sellerDetails.forEach(([label, value], index) => {
        doc.font('Helvetica-Bold').text(label, 50, startY + (index * 20), { width: 200 })
        doc.font('Helvetica').text(value || 'N/A', 250, startY + (index * 20), { width: 300 })
      })
      
      doc.y = startY + (sellerDetails.length * 20) + 10
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

module.exports = router
