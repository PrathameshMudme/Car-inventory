/**
 * Comprehensive Test Data Seeding Script
 * Creates test data to verify all functionality:
 * - Vehicles for different Purchase Managers (to test filtering)
 * - Vehicles with various statuses
 * - Vehicles added in different months (for monthly insights)
 * - Vehicles with/without documents (for pending documents feature)
 * - Vehicles with different payment scenarios
 * - Vehicles with different modification states
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../models/User')
const Vehicle = require('../models/Vehicle')
const VehicleImage = require('../models/VehicleImage')
const VehicleDocument = require('../models/VehicleDocument')
const connectDB = require('../config/database')

dotenv.config()

// Maharashtra districts and talukas
const districts = [
  'Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 
  'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli'
]

const talukas = {
  'Mumbai City': ['Mumbai City'],
  'Mumbai Suburban': ['Kurla', 'Andheri', 'Borivali'],
  'Pune': ['Pune City', 'Baramati', 'Daund', 'Haveli'],
  'Nagpur': ['Nagpur (Urban)', 'Nagpur (Rural)', 'Kamptee'],
  'Thane': ['Thane', 'Kalyan', 'Bhiwandi'],
  'Nashik': ['Nashik', 'Malegaon', 'Sinnar'],
  'Aurangabad': ['Aurangabad', 'Gangapur', 'Paithan'],
  'Solapur': ['Solapur North', 'Solapur South', 'Pandharpur'],
  'Kolhapur': ['Kolhapur', 'Karveer', 'Hatkanangle'],
  'Sangli': ['Sangli', 'Miraj', 'Tasgaon']
}

// Vehicle makes and models
const makes = ['Maruti Suzuki', 'Hyundai', 'Honda', 'Toyota', 'Mahindra', 'Tata', 'Ford', 'Volkswagen']
const models = {
  'Maruti Suzuki': ['Swift', 'Dzire', 'Baleno', 'Wagon R', 'Alto', 'Ertiga', 'Vitara Brezza'],
  'Hyundai': ['i20', 'i10', 'Creta', 'Verna', 'Venue', 'Grand i10'],
  'Honda': ['City', 'Amaze', 'WR-V', 'Jazz'],
  'Toyota': ['Innova', 'Fortuner', 'Glanza', 'Urban Cruiser'],
  'Mahindra': ['XUV300', 'Scorpio', 'Bolero', 'XUV500'],
  'Tata': ['Nexon', 'Tiago', 'Harrier', 'Safari'],
  'Ford': ['EcoSport', 'Figo', 'Aspire'],
  'Volkswagen': ['Polo', 'Vento', 'Virtus']
}

const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Brown', 'Golden']
const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
const ownerTypes = ['1st Owner', '2nd Owner', '3rd Owner', 'Custom']

// Agent names
const agentNames = [
  'Rajesh Auto', 'Priya Motors', 'Amit Car Sales', 'Sneha Vehicles', 
  'Vikram Auto', 'Kiran Motors', 'Sunil Car World', 'Meera Auto'
]

// Generate random vehicle number
const generateVehicleNo = (index) => {
  const districtCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '12', '13', '14', '15']
  const letters = ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST']
  const numbers = String(1000 + index).padStart(4, '0')
  const districtCode = districtCodes[Math.floor(Math.random() * districtCodes.length)]
  const letterPair = letters[Math.floor(Math.random() * letters.length)]
  return `MH${districtCode}${letterPair}${numbers}`
}

// Generate random chassis number
const generateChassisNo = () => {
  const prefix = 'MA3'
  const random = Math.random().toString(36).substring(2, 12).toUpperCase()
  return `${prefix}${random}`
}

// Generate random engine number
const generateEngineNo = () => {
  const prefix = 'ENG'
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `${prefix}${random}`
}

// Generate random phone number
const generatePhone = () => {
  const prefixes = ['98765', '87654', '76543', '65432', '54321', '99887', '88776', '77665']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
  return `+91 ${prefix} ${suffix}`
}

// Generate date in specific month (for testing monthly insights)
const getDateInMonth = (year, month, day = 15) => {
  return new Date(year, month, day)
}

const seedTestData = async () => {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

    // Get users
    const users = await User.find()
    if (users.length === 0) {
      console.log('❌ No users found. Please run: npm run seed')
      process.exit(1)
    }

    const admin = users.find(u => u.role === 'admin')
    const purchaseManagers = users.filter(u => u.role === 'purchase' && u.status === 'Active')
    const salesManagers = users.filter(u => u.role === 'sales' && u.status === 'Active')

    if (!admin) {
      console.log('❌ Admin user not found. Please run: npm run seed')
      process.exit(1)
    }

    if (purchaseManagers.length === 0) {
      console.log('❌ No purchase managers found. Please run: npm run seed')
      process.exit(1)
    }

    console.log(`\nFound ${purchaseManagers.length} purchase manager(s)`)
    console.log(`Found ${salesManagers.length} sales manager(s)`)

    // Clear existing test vehicles (optional - uncomment to clear)
    // await Vehicle.deleteMany({})
    // await VehicleImage.deleteMany({})
    // await VehicleDocument.deleteMany({})
    // console.log('Cleared existing vehicles')

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    let vehicleIndex = 0
    const createdVehicles = []

    // ============================================
    // TEST DATA SCENARIOS
    // ============================================

    console.log('\n📦 Creating comprehensive test data...\n')

    // 1. VEHICLES ADDED THIS MONTH BY PURCHASE MANAGER 1 (for "This Month" insights)
    console.log('1. Creating vehicles added THIS MONTH by Purchase Manager 1...')
    const pm1 = purchaseManagers[0]
    for (let i = 0; i < 5; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const purchasePrice = Math.floor(Math.random() * 500000) + 200000
      const purchaseDate = getDateInMonth(currentYear, currentMonth, 1 + i * 5)
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
        purchasePrice,
        purchaseDate,
        purchaseMonth: currentMonth + 1,
        purchaseYear: currentYear,
        sellerName: `Seller ${i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        dealerName: agentNames[Math.floor(Math.random() * agentNames.length)], // Legacy
        dealerPhone: generatePhone(), // Legacy
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
        district: districts[Math.floor(Math.random() * districts.length)],
        taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.6)],
          ['bank_transfer', Math.floor(purchasePrice * 0.4)],
          ['deductions', 0]
        ]),
        paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.6).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.4).toLocaleString('en-IN')}`,
        status: i < 2 ? 'On Modification' : 'In Stock',
        modificationComplete: i >= 2,
        askingPrice: i >= 2 ? Math.floor(purchasePrice * 1.3) : undefined,
        lastPrice: i >= 2 ? Math.floor(purchasePrice * 1.25) : undefined,
        modificationCost: i >= 2 ? Math.floor(purchasePrice * 0.1) : 0,
        modificationNotes: i >= 2 ? `Complete modification: ${make} ${model}` : undefined,
        agentCommission: i >= 2 ? Math.floor(purchasePrice * 0.02) : 0,
        createdBy: pm1._id
      })

      await vehicle.save()
      createdVehicles.push({ vehicle, user: pm1.name, scenario: 'This Month - PM1' })
      console.log(`   ✓ Created: ${vehicle.vehicleNo} - ${make} ${model} (${vehicle.status})`)
    }

    // 2. VEHICLES ADDED LAST MONTH BY PURCHASE MANAGER 1 (for month comparison)
    console.log('\n2. Creating vehicles added LAST MONTH by Purchase Manager 1...')
    for (let i = 0; i < 3; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const purchasePrice = Math.floor(Math.random() * 500000) + 200000
      const purchaseDate = getDateInMonth(lastMonthYear, lastMonth, 10 + i * 5)
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
        purchasePrice,
        purchaseDate,
        purchaseMonth: lastMonth + 1,
        purchaseYear: lastMonthYear,
        sellerName: `Seller ${i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        dealerName: agentNames[Math.floor(Math.random() * agentNames.length)],
        dealerPhone: generatePhone(),
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
        district: districts[Math.floor(Math.random() * districts.length)],
        taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.5)],
          ['bank_transfer', Math.floor(purchasePrice * 0.5)],
          ['deductions', 0]
        ]),
        paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.5).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.5).toLocaleString('en-IN')}`,
        status: 'In Stock',
        modificationComplete: true,
        askingPrice: Math.floor(purchasePrice * 1.3),
        lastPrice: Math.floor(purchasePrice * 1.25),
        modificationCost: Math.floor(purchasePrice * 0.1),
        modificationNotes: `Complete modification: ${make} ${model}`,
        agentCommission: Math.floor(purchasePrice * 0.02),
        createdBy: pm1._id
      })

      await vehicle.save()
      createdVehicles.push({ vehicle, user: pm1.name, scenario: 'Last Month - PM1' })
      console.log(`   ✓ Created: ${vehicle.vehicleNo} - ${make} ${model}`)
    }

    // 3. VEHICLES WITH PENDING DOCUMENTS (for Upload Documents feature)
    console.log('\n3. Creating vehicles with PENDING DOCUMENTS by Purchase Manager 1...')
    for (let i = 0; i < 4; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const purchasePrice = Math.floor(Math.random() * 500000) + 200000
      const purchaseDate = getDateInMonth(currentYear, currentMonth, 5 + i * 3)
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
        purchasePrice,
        purchaseDate,
        purchaseMonth: currentMonth + 1,
        purchaseYear: currentYear,
        sellerName: `Seller ${i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        dealerName: agentNames[Math.floor(Math.random() * agentNames.length)],
        dealerPhone: generatePhone(),
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
        district: districts[Math.floor(Math.random() * districts.length)],
        taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.7)],
          ['bank_transfer', Math.floor(purchasePrice * 0.3)],
          ['deductions', 0]
        ]),
        paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.7).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.3).toLocaleString('en-IN')}`,
        status: 'On Modification',
        modificationComplete: false,
        createdBy: pm1._id
      })

      await vehicle.save()
      
      // Add some documents but not all (to create pending documents)
      const documentTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record']
      const documentsToAdd = documentTypes.slice(0, 3 + i) // Varying number of missing documents
      
      for (const docType of documentsToAdd) {
        await VehicleDocument.create({
          vehicleId: vehicle._id,
          documentUrl: `/uploads/vehicles/test-${docType}-${vehicle._id}.pdf`,
          documentType: docType,
          documentName: `${docType}_${vehicle.vehicleNo}.pdf`,
          uploadedBy: pm1._id
        })
      }
      
      createdVehicles.push({ vehicle, user: pm1.name, scenario: 'Pending Documents - PM1', missingDocs: documentTypes.length - documentsToAdd.length })
      console.log(`   ✓ Created: ${vehicle.vehicleNo} - ${make} ${model} (Missing ${documentTypes.length - documentsToAdd.length} documents)`)
    }

    // 4. VEHICLES WITH ALL DOCUMENTS (for comparison)
    console.log('\n4. Creating vehicles with ALL DOCUMENTS by Purchase Manager 1...')
    for (let i = 0; i < 2; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const purchasePrice = Math.floor(Math.random() * 500000) + 200000
      const purchaseDate = getDateInMonth(currentYear, currentMonth, 10 + i * 5)
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
        purchasePrice,
        purchaseDate,
        purchaseMonth: currentMonth + 1,
        purchaseYear: currentYear,
        sellerName: `Seller ${i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        dealerName: agentNames[Math.floor(Math.random() * agentNames.length)],
        dealerPhone: generatePhone(),
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
        district: districts[Math.floor(Math.random() * districts.length)],
        taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.6)],
          ['bank_transfer', Math.floor(purchasePrice * 0.4)],
          ['deductions', 0]
        ]),
        paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.6).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.4).toLocaleString('en-IN')}`,
        status: 'In Stock',
        modificationComplete: true,
        askingPrice: Math.floor(purchasePrice * 1.3),
        lastPrice: Math.floor(purchasePrice * 1.25),
        modificationCost: Math.floor(purchasePrice * 0.1),
        modificationNotes: `Complete modification: ${make} ${model}`,
        agentCommission: Math.floor(purchasePrice * 0.02),
        createdBy: pm1._id
      })

      await vehicle.save()
      
      // Add ALL documents
      const documentTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record']
      for (const docType of documentTypes) {
        await VehicleDocument.create({
          vehicleId: vehicle._id,
          documentUrl: `/uploads/vehicles/test-${docType}-${vehicle._id}.pdf`,
          documentType: docType,
          documentName: `${docType}_${vehicle.vehicleNo}.pdf`,
          uploadedBy: pm1._id
        })
      }
      
      createdVehicles.push({ vehicle, user: pm1.name, scenario: 'All Documents - PM1' })
      console.log(`   ✓ Created: ${vehicle.vehicleNo} - ${make} ${model} (All documents uploaded)`)
    }

    // 5. VEHICLES WITH DIFFERENT STATUSES (for Status Distribution chart)
    console.log('\n5. Creating vehicles with DIFFERENT STATUSES by Purchase Manager 1...')
    const statuses = ['On Modification', 'In Stock', 'Sold', 'Reserved', 'Processing']
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i]
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const purchasePrice = Math.floor(Math.random() * 500000) + 200000
      const purchaseDate = getDateInMonth(currentYear, currentMonth - 2, 10 + i * 3)
      
      const vehicleData = {
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
        purchasePrice,
        purchaseDate,
        purchaseMonth: (currentMonth - 2 + 12) % 12 + 1,
        purchaseYear: currentMonth - 2 < 0 ? currentYear - 1 : currentYear,
        sellerName: `Seller ${i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        dealerName: agentNames[Math.floor(Math.random() * agentNames.length)],
        dealerPhone: generatePhone(),
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
        district: districts[Math.floor(Math.random() * districts.length)],
        taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.6)],
          ['bank_transfer', Math.floor(purchasePrice * 0.4)],
          ['deductions', 0]
        ]),
        paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.6).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.4).toLocaleString('en-IN')}`,
        status,
        modificationComplete: status !== 'On Modification',
        askingPrice: status !== 'On Modification' ? Math.floor(purchasePrice * 1.3) : undefined,
        lastPrice: status === 'Sold' ? Math.floor(purchasePrice * 1.25) : (status !== 'On Modification' ? Math.floor(purchasePrice * 1.25) : undefined),
        modificationCost: status !== 'On Modification' ? Math.floor(purchasePrice * 0.1) : 0,
        modificationNotes: status !== 'On Modification' ? `Complete modification: ${make} ${model}` : undefined,
        agentCommission: status !== 'On Modification' ? Math.floor(purchasePrice * 0.02) : 0,
        createdBy: pm1._id
      }

      // Add sale data for Sold vehicles
      if (status === 'Sold') {
        vehicleData.customerName = `Customer ${i + 1}`
        vehicleData.customerContact = generatePhone()
        vehicleData.saleDate = getDateInMonth(currentYear, currentMonth - 1, 15 + i)
        vehicleData.paymentCash = Math.floor(purchasePrice * 1.25 * 0.6)
        vehicleData.paymentBankTransfer = Math.floor(purchasePrice * 1.25 * 0.4)
        vehicleData.paymentOnline = 0
        vehicleData.paymentLoan = 0
        vehicleData.remainingAmount = 0
        vehicleData.paymentType = 'full'
      }

      // Add customer data for Reserved vehicles
      if (status === 'Reserved') {
        vehicleData.customerName = `Customer ${i + 1}`
        vehicleData.customerContact = generatePhone()
      }

      const vehicle = new Vehicle(vehicleData)
      await vehicle.save()
      createdVehicles.push({ vehicle, user: pm1.name, scenario: `Status: ${status} - PM1` })
      console.log(`   ✓ Created: ${vehicle.vehicleNo} - ${make} ${model} (${status})`)
    }

    // 6. VEHICLES BY PURCHASE MANAGER 2 (to test filtering - PM1 shouldn't see these)
    if (purchaseManagers.length > 1) {
      console.log('\n6. Creating vehicles by Purchase Manager 2 (PM1 should NOT see these)...')
      const pm2 = purchaseManagers[1]
      for (let i = 0; i < 3; i++) {
        const make = makes[Math.floor(Math.random() * makes.length)]
        const model = models[make][Math.floor(Math.random() * models[make].length)]
        const purchasePrice = Math.floor(Math.random() * 500000) + 200000
        const purchaseDate = getDateInMonth(currentYear, currentMonth, 8 + i * 2)
        
        const vehicle = new Vehicle({
          vehicleNo: generateVehicleNo(vehicleIndex++),
          chassisNo: generateChassisNo(),
          engineNo: generateEngineNo(),
          make,
          model,
          year: 2020 + Math.floor(Math.random() * 4),
          color: colors[Math.floor(Math.random() * colors.length)],
          fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
          kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
          purchasePrice,
          purchaseDate,
          purchaseMonth: currentMonth + 1,
          purchaseYear: currentYear,
          sellerName: `Seller ${i + 1}`,
          sellerContact: generatePhone(),
          agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
          agentPhone: generatePhone(),
          dealerName: agentNames[Math.floor(Math.random() * agentNames.length)],
          dealerPhone: generatePhone(),
          ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
          addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
          district: districts[Math.floor(Math.random() * districts.length)],
          taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
          pincode: String(Math.floor(Math.random() * 900000) + 100000),
          purchasePaymentMethods: new Map([
            ['cash', Math.floor(purchasePrice * 0.5)],
            ['bank_transfer', Math.floor(purchasePrice * 0.5)],
            ['deductions', 0]
          ]),
          paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.5).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.5).toLocaleString('en-IN')}`,
          status: 'In Stock',
          modificationComplete: true,
          askingPrice: Math.floor(purchasePrice * 1.3),
          lastPrice: Math.floor(purchasePrice * 1.25),
          modificationCost: Math.floor(purchasePrice * 0.1),
          modificationNotes: `Complete modification: ${make} ${model}`,
          agentCommission: Math.floor(purchasePrice * 0.02),
          createdBy: pm2._id
        })

        await vehicle.save()
        createdVehicles.push({ vehicle, user: pm2.name, scenario: 'PM2 Vehicles (PM1 should NOT see)' })
        console.log(`   ✓ Created: ${vehicle.vehicleNo} - ${make} ${model} (by ${pm2.name})`)
      }
    }

    // 7. VEHICLES FROM PREVIOUS MONTHS (for 6-month trend chart)
    console.log('\n7. Creating vehicles from PREVIOUS MONTHS for trend chart...')
    for (let monthOffset = 2; monthOffset <= 5; monthOffset++) {
      const targetMonth = (currentMonth - monthOffset + 12) % 12
      const targetYear = currentMonth - monthOffset < 0 ? currentYear - 1 : currentYear
      
      for (let i = 0; i < 2; i++) {
        const make = makes[Math.floor(Math.random() * makes.length)]
        const model = models[make][Math.floor(Math.random() * models[make].length)]
        const purchasePrice = Math.floor(Math.random() * 500000) + 200000
        const purchaseDate = getDateInMonth(targetYear, targetMonth, 10 + i * 5)
        
        const vehicle = new Vehicle({
          vehicleNo: generateVehicleNo(vehicleIndex++),
          chassisNo: generateChassisNo(),
          engineNo: generateEngineNo(),
          make,
          model,
          year: 2020 + Math.floor(Math.random() * 4),
          color: colors[Math.floor(Math.random() * colors.length)],
          fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
          kilometers: `${Math.floor(Math.random() * 50000) + 10000} km`,
          purchasePrice,
          purchaseDate,
          purchaseMonth: targetMonth + 1,
          purchaseYear: targetYear,
          sellerName: `Seller ${i + 1}`,
          sellerContact: generatePhone(),
          agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
          agentPhone: generatePhone(),
          dealerName: agentNames[Math.floor(Math.random() * agentNames.length)],
          dealerPhone: generatePhone(),
          ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
          addressLine1: `${Math.floor(Math.random() * 100) + 1} Main Street`,
          district: districts[Math.floor(Math.random() * districts.length)],
          taluka: talukas[districts[Math.floor(Math.random() * districts.length)]][0],
          pincode: String(Math.floor(Math.random() * 900000) + 100000),
          purchasePaymentMethods: new Map([
            ['cash', Math.floor(purchasePrice * 0.6)],
            ['bank_transfer', Math.floor(purchasePrice * 0.4)],
            ['deductions', 0]
          ]),
          paymentMethod: `Cash: ₹${Math.floor(purchasePrice * 0.6).toLocaleString('en-IN')}, Bank Transfer: ₹${Math.floor(purchasePrice * 0.4).toLocaleString('en-IN')}`,
          status: 'In Stock',
          modificationComplete: true,
          askingPrice: Math.floor(purchasePrice * 1.3),
          lastPrice: Math.floor(purchasePrice * 1.25),
          modificationCost: Math.floor(purchasePrice * 0.1),
          modificationNotes: `Complete modification: ${make} ${model}`,
          agentCommission: Math.floor(purchasePrice * 0.02),
          createdBy: pm1._id
        })

        await vehicle.save()
        createdVehicles.push({ vehicle, user: pm1.name, scenario: `Month ${monthOffset} ago - PM1` })
      }
      console.log(`   ✓ Created 2 vehicles for ${new Date(targetYear, targetMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ TEST DATA CREATION COMPLETE!')
    console.log('='.repeat(60))
    console.log(`\nTotal vehicles created: ${createdVehicles.length}`)
    console.log(`\nBreakdown by Purchase Manager:`)
    const byPM = {}
    createdVehicles.forEach(v => {
      byPM[v.user] = (byPM[v.user] || 0) + 1
    })
    Object.entries(byPM).forEach(([pm, count]) => {
      console.log(`  - ${pm}: ${count} vehicles`)
    })
    console.log(`\nBreakdown by Status:`)
    const byStatus = {}
    createdVehicles.forEach(v => {
      const status = v.vehicle.status
      byStatus[status] = (byStatus[status] || 0) + 1
    })
    Object.entries(byStatus).forEach(([status, count]) => {
      if (['On Modification', 'In Stock', 'Sold', 'Reserved', 'Processing'].includes(status)) {
        console.log(`  - ${status}: ${count} vehicles`)
      }
    })
    console.log(`\n📊 Test Scenarios Created:`)
    console.log(`  ✓ Vehicles added this month (for "This Month" card)`)
    console.log(`  ✓ Vehicles added last month (for month comparison)`)
    console.log(`  ✓ Vehicles with pending documents (for Upload Documents feature)`)
    console.log(`  ✓ Vehicles with all documents (for comparison)`)
    console.log(`  ✓ Vehicles with different statuses (for Status Distribution chart)`)
    console.log(`  ✓ Vehicles from previous months (for 6-month trend chart)`)
    if (purchaseManagers.length > 1) {
      console.log(`  ✓ Vehicles by different Purchase Managers (to test filtering)`)
    }
    console.log(`\n🔑 Login as Purchase Manager 1:`)
    console.log(`   Email: ${pm1.email}`)
    console.log(`   Password: password123`)
    console.log(`\n   Expected insights:`)
    console.log(`   - Total Purchases: ${createdVehicles.filter(v => v.user === pm1.name).length}`)
    console.log(`   - This Month: ${createdVehicles.filter(v => v.user === pm1.name && v.scenario.includes('This Month')).length}`)
    console.log(`   - Pending Documents: ${createdVehicles.filter(v => v.user === pm1.name && v.missingDocs > 0).length}`)
    console.log(`\n✅ All test data created successfully!`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating test data:', error)
    process.exit(1)
  }
}

seedTestData()
