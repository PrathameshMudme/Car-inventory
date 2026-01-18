const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../models/User')
const Vehicle = require('../models/Vehicle')
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
const statuses = ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing']

// Agent names
const agentNames = [
  'Rajesh Auto', 'Priya Motors', 'Amit Car Sales', 'Sneha Vehicles', 
  'Vikram Auto', 'Kiran Motors', 'Sunil Car World', 'Meera Auto'
]

// Generate random vehicle number
const generateVehicleNo = (index) => {
  const series = ['MH', 'MH', 'MH', 'MH', 'MH', 'MH', 'MH', 'MH', 'MH', 'MH']
  const districtCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50']
  const letters = ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST', 'UV', 'WX', 'YZ']
  const numbers = String(1000 + index).padStart(4, '0')
  const districtCode = districtCodes[Math.floor(Math.random() * districtCodes.length)]
  const letterPair = letters[Math.floor(Math.random() * letters.length)]
  return `${series[0]}${districtCode}${letterPair}${numbers}`
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

// Generate random date within last 2 years
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const seedDummyData = async () => {
  try {
    await connectDB()

    // Get or create users
    let users = await User.find()
    if (users.length === 0) {
      console.log('No users found. Please run seedUsers.js first!')
      process.exit(1)
    }

    const adminUser = users.find(u => u.role === 'admin')
    const purchaseUsers = users.filter(u => u.role === 'purchase')
    const salesUsers = users.filter(u => u.role === 'sales')

    if (!adminUser) {
      console.log('Admin user not found. Please create an admin user first!')
      process.exit(1)
    }

    // Clear existing vehicles (optional - comment out if you want to keep existing vehicles)
    const existingVehicles = await Vehicle.countDocuments()
    if (existingVehicles > 0) {
      console.log(`Found ${existingVehicles} existing vehicles.`)
      console.log('Do you want to delete them? (This will clear all vehicle data)')
      console.log('To keep existing vehicles, comment out the delete line in the script.')
      // Uncomment the next line to delete existing vehicles
      // await Vehicle.deleteMany({})
      // console.log('Cleared existing vehicles')
    }

    const vehicles = []

    // 1. Vehicles "On Modification" - Missing modification fields (for Action Required tab)
    console.log('\n📝 Creating vehicles "On Modification"...')
    for (let i = 0; i < 8; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const year = 2018 + Math.floor(Math.random() * 6)
      const purchasePrice = 300000 + Math.floor(Math.random() * 700000)
      const district = districts[Math.floor(Math.random() * districts.length)]
      const taluka = talukas[district][Math.floor(Math.random() * talukas[district].length)]
      const purchaseDate = randomDate(new Date(2023, 0, 1), new Date())
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()

      const vehicle = {
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year,
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: String(10000 + Math.floor(Math.random() * 90000)),
        purchasePrice,
        purchaseDate,
        purchaseMonth,
        purchaseYear,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        district,
        taluka,
        pincode: String(400000 + Math.floor(Math.random() * 100000)),
        sellerName: `Seller ${i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.4)],
          ['bank_transfer', Math.floor(purchasePrice * 0.6)]
        ]),
        status: 'On Modification',
        modificationComplete: false,
        createdBy: purchaseUsers.length > 0 
          ? purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id 
          : adminUser._id,
        notes: `Test vehicle ${i + 1} - On Modification`
      }

      // Some missing fields to test Action Required
      if (i < 3) {
        // Missing asking price
      } else if (i < 5) {
        // Missing modification notes
        vehicle.askingPrice = purchasePrice * 1.2
        vehicle.lastPrice = purchasePrice * 1.15
        vehicle.modificationCost = Math.floor(purchasePrice * 0.1)
      } else if (i < 7) {
        // Missing agent phone
        vehicle.askingPrice = purchasePrice * 1.2
        vehicle.lastPrice = purchasePrice * 1.15
        vehicle.modificationCost = Math.floor(purchasePrice * 0.1)
        vehicle.modificationNotes = `Modification completed: ${make} ${model}`
      } else {
        // Missing agent commission
        vehicle.askingPrice = purchasePrice * 1.2
        vehicle.lastPrice = purchasePrice * 1.15
        vehicle.modificationCost = Math.floor(purchasePrice * 0.1)
        vehicle.modificationNotes = `Modification completed: ${make} ${model}`
        vehicle.agentPhone = generatePhone()
      }

      vehicles.push(vehicle)
    }

    // 2. Vehicles "In Stock" - Complete modification, ready for sale
    console.log('✅ Creating vehicles "In Stock"...')
    for (let i = 0; i < 12; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const year = 2019 + Math.floor(Math.random() * 5)
      const purchasePrice = 400000 + Math.floor(Math.random() * 800000)
      const district = districts[Math.floor(Math.random() * districts.length)]
      const taluka = talukas[district][Math.floor(Math.random() * talukas[district].length)]
      const purchaseDate = randomDate(new Date(2023, 0, 1), new Date())
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()

      const vehicle = {
        vehicleNo: generateVehicleNo(8 + i),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year,
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: String(15000 + Math.floor(Math.random() * 85000)),
        purchasePrice,
        askingPrice: Math.floor(purchasePrice * 1.25),
        lastPrice: Math.floor(purchasePrice * 1.2),
        purchaseDate,
        purchaseMonth,
        purchaseYear,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        district,
        taluka,
        pincode: String(400000 + Math.floor(Math.random() * 100000)),
        sellerName: `Seller ${8 + i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        agentCommission: Math.floor(purchasePrice * 0.02),
        modificationCost: Math.floor(purchasePrice * 0.08),
        modificationNotes: `Complete modification: ${make} ${model} - All parts checked and serviced. Engine tuned, brakes serviced, interior cleaned.`,
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.5)],
          ['bank_transfer', Math.floor(purchasePrice * 0.5)]
        ]),
        status: 'In Stock',
        modificationComplete: true,
        createdBy: purchaseUsers.length > 0 
          ? purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id 
          : adminUser._id,
        modifiedBy: adminUser._id,
        notes: `Test vehicle ${8 + i + 1} - In Stock`
      }

      vehicles.push(vehicle)
    }

    // 3. Vehicles "Reserved" - Booked by customers
    console.log('🔒 Creating vehicles "Reserved"...')
    for (let i = 0; i < 5; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const year = 2020 + Math.floor(Math.random() * 4)
      const purchasePrice = 500000 + Math.floor(Math.random() * 700000)
      const district = districts[Math.floor(Math.random() * districts.length)]
      const taluka = talukas[district][Math.floor(Math.random() * talukas[district].length)]
      const purchaseDate = randomDate(new Date(2023, 6, 1), new Date())
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()

      const vehicle = {
        vehicleNo: generateVehicleNo(20 + i),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year,
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: String(20000 + Math.floor(Math.random() * 80000)),
        purchasePrice,
        askingPrice: Math.floor(purchasePrice * 1.3),
        lastPrice: Math.floor(purchasePrice * 1.25),
        purchaseDate,
        purchaseMonth,
        purchaseYear,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        district,
        taluka,
        pincode: String(400000 + Math.floor(Math.random() * 100000)),
        sellerName: `Seller ${20 + i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        agentCommission: Math.floor(purchasePrice * 0.02),
        modificationCost: Math.floor(purchasePrice * 0.1),
        modificationNotes: `Complete modification: ${make} ${model} - Ready for delivery.`,
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.6)],
          ['bank_transfer', Math.floor(purchasePrice * 0.4)]
        ]),
        status: 'Reserved',
        modificationComplete: true,
        createdBy: purchaseUsers.length > 0 
          ? purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id 
          : adminUser._id,
        modifiedBy: adminUser._id,
        customerName: `Customer ${i + 1}`,
        customerContact: generatePhone(),
        customerEmail: `customer${i + 1}@example.com`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        notes: `Test vehicle ${20 + i + 1} - Reserved`
      }

      vehicles.push(vehicle)
    }

    // 4. Vehicles "Sold" - Completed sales with payment details
    console.log('💰 Creating vehicles "Sold"...')
    for (let i = 0; i < 10; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const year = 2019 + Math.floor(Math.random() * 5)
      const purchasePrice = 450000 + Math.floor(Math.random() * 750000)
      const salePrice = Math.floor(purchasePrice * 1.3)
      const district = districts[Math.floor(Math.random() * districts.length)]
      const taluka = talukas[district][Math.floor(Math.random() * talukas[district].length)]
      const purchaseDate = randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31))
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()
      const saleDate = randomDate(new Date(2023, 0, 1), new Date())

      // Different payment scenarios
      let paymentCash = 0
      let paymentBankTransfer = 0
      let paymentOnline = 0
      let paymentLoan = 0
      let remainingAmount = 0
      let paymentSecurityCheque = { enabled: false }

      if (i < 3) {
        // Full cash payment
        paymentCash = salePrice
      } else if (i < 6) {
        // Mixed payment
        paymentCash = Math.floor(salePrice * 0.4)
        paymentBankTransfer = Math.floor(salePrice * 0.4)
        paymentOnline = Math.floor(salePrice * 0.2)
      } else if (i < 8) {
        // With loan
        paymentCash = Math.floor(salePrice * 0.3)
        paymentLoan = Math.floor(salePrice * 0.7)
      } else {
        // With security cheque (pending payment)
        paymentCash = Math.floor(salePrice * 0.6)
        paymentBankTransfer = Math.floor(salePrice * 0.2)
        remainingAmount = Math.floor(salePrice * 0.2)
        paymentSecurityCheque = {
          enabled: true,
          bankName: 'HDFC Bank',
          accountNumber: '1234567890',
          chequeNumber: `CHQ${1000 + i}`,
          amount: remainingAmount
        }
      }

      const vehicle = {
        vehicleNo: generateVehicleNo(25 + i),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year,
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: String(25000 + Math.floor(Math.random() * 75000)),
        purchasePrice,
        askingPrice: Math.floor(purchasePrice * 1.25),
        lastPrice: salePrice,
        purchaseDate,
        purchaseMonth,
        purchaseYear,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        district,
        taluka,
        pincode: String(400000 + Math.floor(Math.random() * 100000)),
        sellerName: `Seller ${25 + i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        agentCommission: Math.floor(purchasePrice * 0.02),
        modificationCost: Math.floor(purchasePrice * 0.08),
        modificationNotes: `Complete modification: ${make} ${model} - Sold successfully.`,
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.5)],
          ['bank_transfer', Math.floor(purchasePrice * 0.5)]
        ]),
        status: 'Sold',
        modificationComplete: true,
        createdBy: purchaseUsers.length > 0 
          ? purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id 
          : adminUser._id,
        modifiedBy: adminUser._id,
        customerName: `Customer ${i + 1}`,
        customerContact: generatePhone(),
        customerAlternateContact: generatePhone(),
        customerEmail: `customer${i + 1}@example.com`,
        customerAddress: `${Math.floor(Math.random() * 999) + 1} Customer Street, ${district}`,
        customerAadhaar: `${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        saleDate,
        paymentType: remainingAmount > 0 ? 'custom' : 'full',
        paymentCash,
        paymentBankTransfer,
        paymentOnline,
        paymentLoan,
        paymentSecurityCheque,
        remainingAmount,
        saleNotes: `Sold to ${make} ${model} customer. ${remainingAmount > 0 ? 'Security cheque pending.' : 'Full payment received.'}`,
        notes: `Test vehicle ${25 + i + 1} - Sold`
      }

      vehicles.push(vehicle)
    }

    // 5. Vehicles "Processing" - In various stages
    console.log('⚙️  Creating vehicles "Processing"...')
    for (let i = 0; i < 3; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const model = models[make][Math.floor(Math.random() * models[make].length)]
      const year = 2020 + Math.floor(Math.random() * 4)
      const purchasePrice = 400000 + Math.floor(Math.random() * 600000)
      const district = districts[Math.floor(Math.random() * districts.length)]
      const taluka = talukas[district][Math.floor(Math.random() * talukas[district].length)]
      const purchaseDate = randomDate(new Date(2024, 0, 1), new Date())
      const purchaseMonth = purchaseDate.getMonth() + 1
      const purchaseYear = purchaseDate.getFullYear()

      const vehicle = {
        vehicleNo: generateVehicleNo(35 + i),
        chassisNo: generateChassisNo(),
        engineNo: generateEngineNo(),
        make,
        model,
        year,
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: String(10000 + Math.floor(Math.random() * 50000)),
        purchasePrice,
        askingPrice: Math.floor(purchasePrice * 1.2),
        lastPrice: Math.floor(purchasePrice * 1.15),
        purchaseDate,
        purchaseMonth,
        purchaseYear,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        addressLine1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        district,
        taluka,
        pincode: String(400000 + Math.floor(Math.random() * 100000)),
        sellerName: `Seller ${35 + i + 1}`,
        sellerContact: generatePhone(),
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        agentPhone: generatePhone(),
        agentCommission: Math.floor(purchasePrice * 0.02),
        modificationCost: Math.floor(purchasePrice * 0.1),
        modificationNotes: `Processing: ${make} ${model} - Under documentation.`,
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.4)],
          ['bank_transfer', Math.floor(purchasePrice * 0.6)]
        ]),
        status: 'Processing',
        modificationComplete: true,
        createdBy: purchaseUsers.length > 0 
          ? purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id 
          : adminUser._id,
        modifiedBy: adminUser._id,
        notes: `Test vehicle ${35 + i + 1} - Processing`
      }

      vehicles.push(vehicle)
    }

    // Insert all vehicles
    console.log('\n💾 Inserting vehicles into database...')
    for (const vehicleData of vehicles) {
      try {
        const vehicle = new Vehicle(vehicleData)
        await vehicle.save()
        console.log(`✅ Created: ${vehicle.vehicleNo} - ${vehicle.make} ${vehicle.model} [${vehicle.status}]`)
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Skipped duplicate: ${vehicleData.vehicleNo}`)
        } else {
          console.error(`❌ Error creating ${vehicleData.vehicleNo}:`, error.message)
        }
      }
    }

    // Summary
    const summary = await Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    console.log('\n✅ Successfully seeded dummy data!')
    console.log('\n📊 Vehicle Summary:')
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count} vehicles`)
    })
    console.log(`\n   Total: ${vehicles.length} vehicles created`)
    console.log('\n🎯 Test Scenarios Created:')
    console.log('   • Vehicles "On Modification" with missing fields (Action Required tab)')
    console.log('   • Vehicles "In Stock" ready for sale')
    console.log('   • Vehicles "Reserved" by customers')
    console.log('   • Vehicles "Sold" with various payment methods')
    console.log('   • Vehicles "Processing" in documentation')
    console.log('   • Different payment scenarios (cash, bank transfer, loan, security cheque)')
    console.log('   • Various vehicle makes, models, and years')
    console.log('   • Different agents and sellers')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding dummy data:', error)
    process.exit(1)
  }
}

seedDummyData()
