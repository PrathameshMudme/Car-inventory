/**
 * Comprehensive Test Data Seeding Script
 * 
 * This script creates high-quality test data covering:
 * - All user roles (admin, purchase, sales)
 * - All vehicle statuses (On Modification, In Stock, Reserved, Sold, Processing, DELETED)
 * - All payment scenarios (full payment, partial payment, pending payments, settlements)
 * - All vehicle fields and edge cases
 * - Payment settlement history with various scenarios
 * - Purchase note history
 * - Delivery note history
 * - Chassis/Engine number history
 * - Various date ranges for testing reports and filters
 * - Customer data with different sources
 * - Agent data with commission tracking
 * - Expense scenarios (commission, modification, other costs)
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../models/User')
const Vehicle = require('../models/Vehicle')
const VehicleImage = require('../models/VehicleImage')
const VehicleDocument = require('../models/VehicleDocument')
const connectDB = require('../config/database')

dotenv.config()

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate vehicle number
const generateVehicleNo = (index) => {
  const states = ['MH', 'GJ', 'DL', 'KA', 'TN', 'RJ', 'UP', 'MP']
  const state = states[Math.floor(Math.random() * states.length)]
  const district = String(Math.floor(Math.random() * 50) + 1).padStart(2, '0')
  const series = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const number = String(index).padStart(4, '0')
  return `${state}${district}${series}${number}`
}

// Helper function to generate chassis/engine number
const generateChassisNo = (index) => `CH${String(index).padStart(12, '0')}`
const generateEngineNo = (index) => `EN${String(index).padStart(12, '0')}`

const seedComprehensiveData = async () => {
  try {
    await connectDB()
    console.log('📦 Starting comprehensive data seeding...\n')

    // Clear all existing data
    console.log('🗑️  Clearing existing data...')
    await VehicleDocument.deleteMany({})
    await VehicleImage.deleteMany({})
    await Vehicle.deleteMany({})
    await User.deleteMany({})
    console.log('✅ Cleared all existing data\n')

    // ============================================
    // CREATE USERS (All Roles)
    // ============================================
    console.log('👥 Creating users...')
    const users = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123', // Plain text - will be hashed by User model's pre-save hook
        role: 'admin',
        contact: '+91 99999 99999',
        status: 'Active'
      },
      {
        name: 'Rajesh Kumar',
        email: 'purchase1@test.com',
        password: 'password123', // Plain text - will be hashed by User model's pre-save hook
        role: 'purchase',
        contact: '+91 98765 43210',
        status: 'Active'
      },
      {
        name: 'Amit Patil',
        email: 'purchase2@test.com',
        password: 'password123', // Plain text - will be hashed by User model's pre-save hook
        role: 'purchase',
        contact: '+91 87654 32109',
        status: 'Active'
      },
      {
        name: 'Priya Sharma',
        email: 'sales1@test.com',
        password: 'password123', // Plain text - will be hashed by User model's pre-save hook
        role: 'sales',
        contact: '+91 76543 21098',
        status: 'Active'
      },
      {
        name: 'Sneha Desai',
        email: 'sales2@test.com',
        password: 'password123', // Plain text - will be hashed by User model's pre-save hook
        role: 'sales',
        contact: '+91 65432 10987',
        status: 'Active'
      },
      {
        name: 'Vikram Singh',
        email: 'purchase3@test.com',
        password: 'password123', // Plain text - will be hashed by User model's pre-save hook
        role: 'purchase',
        contact: '+91 54321 09876',
        status: 'Disabled' // Test disabled user
      }
    ]

    const createdUsers = []
    for (const userData of users) {
      const user = new User(userData)
      await user.save()
      createdUsers.push(user)
      console.log(`   ✓ Created ${user.role}: ${user.name} (${user.email})`)
    }
    console.log(`✅ Created ${createdUsers.length} users\n`)

    const adminUser = createdUsers.find(u => u.role === 'admin')
    const purchaseUsers = createdUsers.filter(u => u.role === 'purchase' && u.status === 'Active')
    const salesUsers = createdUsers.filter(u => u.role === 'sales')

    // ============================================
    // VEHICLE DATA CONFIGURATION
    // ============================================
    const companies = ['Maruti Suzuki', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra', 'Ford', 'Volkswagen', 'Kia', 'MG']
    const models = {
      'Maruti Suzuki': ['Swift', 'Dzire', 'Baleno', 'Wagon R', 'Alto', 'Ertiga'],
      'Hyundai': ['i20', 'Creta', 'Verna', 'Grand i10', 'Venue', 'i10'],
      'Honda': ['City', 'Amaze', 'WR-V', 'Jazz', 'Civic'],
      'Toyota': ['Innova', 'Fortuner', 'Glanza', 'Urban Cruiser', 'Camry'],
      'Tata': ['Nexon', 'Tiago', 'Harrier', 'Safari', 'Altroz'],
      'Mahindra': ['XUV700', 'Scorpio', 'Bolero', 'Thar', 'XUV300'],
      'Ford': ['EcoSport', 'Endeavour', 'Figo', 'Aspire'],
      'Volkswagen': ['Polo', 'Vento', 'Virtus', 'Taigun'],
      'Kia': ['Seltos', 'Sonet', 'Carnival', 'EV6'],
      'MG': ['Hector', 'Astor', 'Gloster', 'ZS EV']
    }
    const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Brown', 'Golden']
    const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
    const ownerTypes = ['1st Owner', '2nd Owner', '3rd Owner', 'Custom']
    const districts = ['Pune', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Kolhapur']
    const talukasMap = {
      'Pune': ['Pune City', 'Haveli', 'Baramati', 'Daund'],
      'Mumbai City': ['Mumbai City'],
      'Mumbai Suburban': ['Kurla', 'Andheri', 'Borivali'],
      'Nagpur': ['Nagpur (Urban)', 'Nagpur (Rural)', 'Kamptee'],
      'Nashik': ['Nashik', 'Malegaon', 'Sinnar'],
      'Aurangabad': ['Aurangabad', 'Gangapur', 'Paithan'],
      'Solapur': ['Solapur North', 'Solapur South', 'Pandharpur'],
      'Thane': ['Thane', 'Kalyan', 'Bhiwandi'],
      'Kolhapur': ['Kolhapur', 'Karveer', 'Hatkanangle']
    }
    
    const getTalukasForDistrict = (district) => {
      return talukasMap[district] || ['City']
    }

    const vehicles = []
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const oneYearAgo = new Date(now.getFullYear() - 1, 0, 1)
    const twoYearsAgo = new Date(now.getFullYear() - 2, 0, 1)

    // Agent phone numbers - consistent phone for same agent name to enable grouping
    const agentPhones = {
      'Agent 1': '+91 98765 43210',
      'Agent 2': '+91 98765 43211',
      'Agent 3': '+91 98765 43212',
      'Agent 4': '+91 98765 43213',
      'Agent 5': '+91 98765 43214'
    }

    let vehicleIndex = 1

    // ============================================
    // 1. VEHICLES ON MODIFICATION (8 vehicles)
    // Mix: Current month (3), Last month (2), Older (3)
    // Each vehicle will have different missing fields for testing Action Required tab
    // ============================================
    console.log('🔧 Creating vehicles on modification...')
    for (let i = 0; i < 8; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      let purchaseDate
      if (i < 3) {
        // Current month
        purchaseDate = randomDate(currentMonthStart, now)
      } else if (i < 5) {
        // Last month
        purchaseDate = randomDate(lastMonthStart, lastMonthEnd)
      } else {
        // Older
        purchaseDate = randomDate(sixMonthsAgo, lastMonthStart)
      }
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 500000) + 200000
      const hasPendingToSeller = Math.random() > 0.4
      const remainingToSeller = hasPendingToSeller ? Math.floor(Math.random() * 100000) + 20000 : 0
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2018 + Math.floor(Math.random() * 6),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2018 + Math.floor(Math.random() * 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 100000) + 10000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        ownerTypeCustom: Math.random() > 0.7 ? '4th Owner' : '',
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor((purchasePrice - remainingToSeller) * 0.4)],
          ['bank_transfer', Math.floor((purchasePrice - remainingToSeller) * 0.6)]
        ]),
        remainingAmountToSeller: remainingToSeller,
        pendingPaymentType: hasPendingToSeller ? 'PENDING_TO_SELLER' : '',
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        otherCost: Math.random() > 0.5 ? Math.floor(Math.random() * 30000) + 5000 : 0,
        otherCostNotes: Math.random() > 0.5 ? 'Insurance ₹8000, Registration ₹12000, Documentation ₹5000' : '',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        // Vary missing fields for different vehicles to test Action Required tab
        // Each vehicle will have different combinations of missing fields
        askingPrice: (i % 8 !== 0) ? Math.floor(purchasePrice * 1.3) + Math.floor(Math.random() * 100000) : undefined, // Missing for vehicle 0, 8, 16...
        lastPrice: (i % 8 !== 1 && i % 8 !== 0) ? Math.floor(purchasePrice * 1.2) + Math.floor(Math.random() * 50000) : undefined, // Missing for vehicle 1, 9, 17...
        modificationCost: (i % 8 !== 2 && i % 8 !== 0 && i % 8 !== 1) ? Math.floor(Math.random() * 50000) + 10000 : 0, // Missing (0) for vehicle 2, 10, 18...
        modificationNotes: (i % 8 !== 3 && i % 8 !== 0 && i % 8 !== 1 && i % 8 !== 2) ? `Modification work in progress - ${['Paint job', 'Interior upgrade', 'Engine service', 'Body repair'][Math.floor(Math.random() * 4)]}` : '', // Missing for vehicle 3, 11, 19...
        agentPhone: (i % 8 !== 4 && i % 8 !== 0 && i % 8 !== 1 && i % 8 !== 2 && i % 8 !== 3) ? agentPhones[`Agent ${(vehicleIndex % 5) + 1}`] : '', // Missing for vehicle 4, 12, 20...
        agentCommission: (i % 8 !== 5 && i % 8 !== 0 && i % 8 !== 1 && i % 8 !== 2 && i % 8 !== 3 && i % 8 !== 4) ? Math.floor(Math.random() * 50000) + 10000 : 0, // Missing (0) for vehicle 5, 13, 21...
        
        status: 'On Modification',
        modificationComplete: false,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - On Modification`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status})`)
    }

    // ============================================
    // 2. VEHICLES IN STOCK (12 vehicles)
    // Mix: Current month (4), Last month (3), Older (5)
    // ============================================
    console.log('\n📦 Creating vehicles in stock...')
    for (let i = 0; i < 12; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      let purchaseDate
      if (i < 4) {
        purchaseDate = randomDate(currentMonthStart, now)
      } else if (i < 7) {
        purchaseDate = randomDate(lastMonthStart, lastMonthEnd)
      } else {
        purchaseDate = randomDate(sixMonthsAgo, lastMonthStart)
      }
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 600000) + 250000
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2019 + Math.floor(Math.random() * 5),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2019 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 80000) + 15000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.4)],
          ['bank_transfer', Math.floor(purchasePrice * 0.6)]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        agentPhone: agentPhones[`Agent ${(vehicleIndex % 5) + 1}`],
        agentCommission: Math.floor(Math.random() * 60000) + 15000,
        otherCost: Math.random() > 0.4 ? Math.floor(Math.random() * 30000) + 5000 : 0,
        otherCostNotes: Math.random() > 0.4 ? 'Insurance ₹10000, Registration ₹15000' : '',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(purchasePrice * 1.4) + Math.floor(Math.random() * 100000),
        lastPrice: Math.floor(purchasePrice * 1.35) + Math.floor(Math.random() * 80000),
        modificationCost: Math.floor(Math.random() * 60000) + 20000,
        modificationNotes: `Modification completed - ${['Full service', 'Paint touch-up', 'Interior cleaning', 'AC service'][Math.floor(Math.random() * 4)]}`,
        status: 'In Stock',
        modificationComplete: true,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - In Stock`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status})`)
    }

    // ============================================
    // 3. RESERVED VEHICLES (6 vehicles)
    // Mix: Current month (2), Last month (2), Older (2)
    // ============================================
    console.log('\n🔒 Creating reserved vehicles...')
    for (let i = 0; i < 6; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      let purchaseDate
      if (i < 2) {
        purchaseDate = randomDate(currentMonthStart, now)
      } else if (i < 4) {
        purchaseDate = randomDate(lastMonthStart, lastMonthEnd)
      } else {
        purchaseDate = randomDate(sixMonthsAgo, lastMonthStart)
      }
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 700000) + 300000
      const lastPrice = Math.floor(purchasePrice * 1.4) + Math.floor(Math.random() * 100000)
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2020 + Math.floor(Math.random() * 4),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 60000) + 10000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.5)],
          ['bank_transfer', Math.floor(purchasePrice * 0.5)]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        agentPhone: agentPhones[`Agent ${(vehicleIndex % 5) + 1}`],
        agentCommission: Math.floor(Math.random() * 70000) + 20000,
        otherCost: Math.random() > 0.3 ? Math.floor(Math.random() * 30000) + 10000 : 0,
        otherCostNotes: Math.random() > 0.3 ? 'Insurance ₹12000, Registration ₹18000, Documentation ₹6000' : '',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(purchasePrice * 1.5),
        lastPrice,
        modificationCost: Math.floor(Math.random() * 70000) + 25000,
        modificationNotes: `Modification completed`,
        status: 'Reserved',
        modificationComplete: true,
        
        // Customer info
        customerName: `Customer ${vehicleIndex}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${vehicleIndex}@test.com`,
        customerAddressLine1: `Customer Building ${vehicleIndex}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - Reserved`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status})`)
    }

    // ============================================
    // 4. SOLD VEHICLES - FULL PAYMENT (10 vehicles)
    // Mix: Current month (4), Last month (3), Older (3)
    // ============================================
    console.log('\n💰 Creating sold vehicles (full payment)...')
    for (let i = 0; i < 10; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const purchaseDate = randomDate(oneYearAgo, sixMonthsAgo)
      
      let saleDate
      if (i < 4) {
        // Current month sales
        saleDate = randomDate(currentMonthStart, now)
      } else if (i < 7) {
        // Last month sales
        saleDate = randomDate(lastMonthStart, lastMonthEnd)
      } else {
        // Older sales
        saleDate = randomDate(sixMonthsAgo, lastMonthStart)
      }
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 600000) + 300000
      const totalPrice = Math.floor(purchasePrice * 1.4) + Math.floor(Math.random() * 100000)
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2018 + Math.floor(Math.random() * 6),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2018 + Math.floor(Math.random() * 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 90000) + 20000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.4)],
          ['bank_transfer', Math.floor(purchasePrice * 0.6)]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        agentPhone: agentPhones[`Agent ${(vehicleIndex % 5) + 1}`],
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        otherCost: Math.random() > 0.4 ? Math.floor(Math.random() * 30000) + 5000 : 0,
        otherCostNotes: Math.random() > 0.4 ? 'Insurance ₹10000, Registration ₹15000, Documentation ₹5000' : '',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(purchasePrice * 1.5),
        lastPrice: totalPrice,
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification completed`,
        status: 'Sold',
        modificationComplete: true,
        
        // Customer info
        customerName: `Customer ${vehicleIndex}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${vehicleIndex}@test.com`,
        customerAddressLine1: `Customer Building ${vehicleIndex}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerAadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        
        saleDate,
        
        // Full payment
        paymentType: 'full',
        paymentCash: Math.floor(totalPrice * 0.3),
        paymentBankTransfer: Math.floor(totalPrice * 0.4),
        paymentOnline: Math.floor(totalPrice * 0.2),
        paymentLoan: Math.floor(totalPrice * 0.1),
        remainingAmount: 0,
        saleNotes: `Full payment received for vehicle ${vehicleIndex}`,
        
        // Mix created by purchase and sales managers
        createdBy: Math.random() > 0.5 
          ? salesUsers[Math.floor(Math.random() * salesUsers.length)]._id 
          : purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - Sold (Full Payment)`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status}) - Sale: ${saleDate.toLocaleDateString()}`)
    }

    // ============================================
    // 5. SOLD VEHICLES - WITH PENDING FROM CUSTOMER (8 vehicles)
    // Mix: Current month (3), Last month (2), Older (3)
    // ============================================
    console.log('\n💳 Creating sold vehicles (pending from customer)...')
    for (let i = 0; i < 8; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const purchaseDate = randomDate(oneYearAgo, sixMonthsAgo)
      
      let saleDate
      if (i < 3) {
        saleDate = randomDate(currentMonthStart, now)
      } else if (i < 5) {
        saleDate = randomDate(lastMonthStart, lastMonthEnd)
      } else {
        saleDate = randomDate(sixMonthsAgo, lastMonthStart)
      }
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 600000) + 300000
      const totalPrice = Math.floor(purchasePrice * 1.4) + Math.floor(Math.random() * 100000)
      const paidAmount = Math.floor(totalPrice * (0.6 + Math.random() * 0.3)) // 60-90% paid
      const remaining = totalPrice - paidAmount
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2019 + Math.floor(Math.random() * 5),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2019 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 80000) + 15000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.4)],
          ['bank_transfer', Math.floor(purchasePrice * 0.6)]
        ]),
        remainingAmountToSeller: 0,
        pendingPaymentType: 'PENDING_FROM_CUSTOMER',
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        agentPhone: agentPhones[`Agent ${(vehicleIndex % 5) + 1}`],
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        otherCost: Math.random() > 0.4 ? Math.floor(Math.random() * 30000) + 5000 : 0,
        otherCostNotes: Math.random() > 0.4 ? 'Insurance ₹10000, Registration ₹15000' : '',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: totalPrice,
        lastPrice: totalPrice,
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification completed`,
        status: 'Sold',
        modificationComplete: true,
        
        // Customer info
        customerName: `Customer ${vehicleIndex}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${vehicleIndex}@test.com`,
        customerAddressLine1: `Customer Building ${vehicleIndex}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerAadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        
        saleDate,
        
        // Partial payment
        paymentType: 'custom',
        paymentCash: Math.floor(paidAmount * 0.4),
        paymentBankTransfer: Math.floor(paidAmount * 0.4),
        paymentOnline: Math.floor(paidAmount * 0.2),
        paymentLoan: 0,
        remainingAmount: remaining,
        saleNotes: `Partial payment received, remaining: ₹${remaining.toLocaleString('en-IN')}`,
        
        // Add settlement history for some vehicles
        paymentSettlementHistory: i < 3 ? [{
          settlementType: 'FROM_CUSTOMER',
          amount: Math.floor(remaining * 0.3),
          paymentMode: ['cash', 'bankTransfer', 'online'][Math.floor(Math.random() * 3)],
          settledBy: adminUser._id,
          settledAt: randomDate(saleDate, now),
          notes: 'Partial settlement received'
        }] : [],
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - Sold (Pending Payment)`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status}) - Pending: ₹${remaining.toLocaleString('en-IN')}`)
    }

    // ============================================
    // 6. SOLD VEHICLES - WITH SECURITY CHEQUE (4 vehicles)
    // ============================================
    console.log('\n📋 Creating sold vehicles (with security cheque)...')
    for (let i = 0; i < 4; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const purchaseDate = randomDate(oneYearAgo, sixMonthsAgo)
      const saleDate = randomDate(sixMonthsAgo, lastMonthStart)
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 700000) + 400000
      const totalPrice = Math.floor(purchasePrice * 1.5) + Math.floor(Math.random() * 150000)
      const securityChequeAmount = Math.floor(totalPrice * (0.2 + Math.random() * 0.2)) // 20-40%
      const paidAmount = totalPrice - securityChequeAmount
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2020 + Math.floor(Math.random() * 4),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 60000) + 10000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.5)],
          ['bank_transfer', Math.floor(purchasePrice * 0.5)]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        agentPhone: agentPhones[`Agent ${(vehicleIndex % 5) + 1}`],
        agentCommission: Math.floor(Math.random() * 70000) + 20000,
        otherCost: Math.floor(Math.random() * 30000) + 10000,
        otherCostNotes: 'Insurance ₹15000, Registration ₹20000, Documentation ₹8000',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: totalPrice,
        lastPrice: totalPrice,
        modificationCost: Math.floor(Math.random() * 70000) + 25000,
        modificationNotes: `Modification completed`,
        status: 'Sold',
        modificationComplete: true,
        
        // Customer info
        customerName: `Customer ${vehicleIndex}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${vehicleIndex}@test.com`,
        customerAddressLine1: `Customer Building ${vehicleIndex}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerAadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        
        saleDate,
        
        // Payment with security cheque
        paymentType: 'custom',
        paymentCash: Math.floor(paidAmount * 0.3),
        paymentBankTransfer: Math.floor(paidAmount * 0.4),
        paymentOnline: Math.floor(paidAmount * 0.2),
        paymentLoan: Math.floor(paidAmount * 0.1),
        remainingAmount: securityChequeAmount,
        securityChequeAmount: securityChequeAmount,
        saleNotes: `Payment received with security cheque of ₹${securityChequeAmount.toLocaleString('en-IN')}`,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - Sold (Security Cheque)`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status}) - Security Cheque: ₹${securityChequeAmount.toLocaleString('en-IN')}`)
    }

    // ============================================
    // 7. PROCESSING VEHICLES (3 vehicles)
    // ============================================
    console.log('\n⚙️  Creating processing vehicles...')
    for (let i = 0; i < 3; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const purchaseDate = randomDate(sixMonthsAgo, lastMonthStart)
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 800000) + 400000
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2020 + Math.floor(Math.random() * 4),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 50000) + 5000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.5)],
          ['bank_transfer', Math.floor(purchasePrice * 0.5)]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        agentPhone: agentPhones[`Agent ${(vehicleIndex % 5) + 1}`],
        agentCommission: Math.floor(Math.random() * 70000) + 20000,
        otherCost: Math.floor(Math.random() * 30000) + 10000,
        otherCostNotes: 'Insurance ₹15000, Registration ₹20000',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(purchasePrice * 1.5),
        lastPrice: Math.floor(purchasePrice * 1.45),
        modificationCost: Math.floor(Math.random() * 70000) + 25000,
        modificationNotes: `Modification completed`,
        status: 'Processing',
        modificationComplete: true,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - Processing`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status})`)
    }

    // ============================================
    // 8. DELETED VEHICLES (2 vehicles)
    // ============================================
    console.log('\n🗑️  Creating deleted vehicles...')
    for (let i = 0; i < 2; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const purchaseDate = randomDate(twoYearsAgo, oneYearAgo)
      const deletedDate = randomDate(purchaseDate, sixMonthsAgo)
      
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      
      const purchasePrice = Math.floor(Math.random() * 600000) + 300000
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(vehicleIndex++),
        chassisNo: generateChassisNo(vehicleIndex),
        engineNo: generateEngineNo(vehicleIndex),
        company,
        model: models[company][Math.floor(Math.random() * models[company].length)],
        year: 2017 + Math.floor(Math.random() * 5),
        vehicleMonth: Math.floor(Math.random() * 12) + 1,
        vehicleYear: 2017 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 120000) + 50000} km`,
        
        purchasePrice,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(purchasePrice * 0.4)],
          ['bank_transfer', Math.floor(purchasePrice * 0.6)]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${vehicleIndex}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${(vehicleIndex % 5) + 1}`,
        // agentPhone and agentCommission will be set conditionally below based on missing fields pattern
        otherCost: Math.random() > 0.5 ? Math.floor(Math.random() * 30000) + 5000 : 0,
        otherCostNotes: Math.random() > 0.5 ? 'Insurance, Registration' : '',
        
        addressLine1: `Building ${vehicleIndex}, Street ${vehicleIndex}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(purchasePrice * 1.3),
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification completed`,
        status: 'DELETED',
        modificationComplete: true,
        
        deletedAt: deletedDate,
        deletedBy: adminUser._id,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${vehicleIndex} - Deleted`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model} (${vehicle.status})`)
    }

    // ============================================
    // ADD PURCHASE NOTE HISTORY
    // ============================================
    console.log('\n📄 Adding purchase note history...')
    const vehiclesForPurchaseNotes = vehicles.filter(v => 
      purchaseUsers.some(pu => pu._id.toString() === v.createdBy.toString())
    ).slice(0, 15)
    
    for (const vehicle of vehiclesForPurchaseNotes) {
      if (Math.random() > 0.2) { // 80% chance
        vehicle.purchaseNoteHistory = [{
          generatedBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
          generatedAt: randomDate(vehicle.createdAt, now),
          filename: `Purchase_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`
        }]
        await vehicle.save()
        console.log(`   ✓ Added purchase note to ${vehicle.vehicleNo}`)
      }
    }

    // ============================================
    // ADD DELIVERY NOTE HISTORY
    // ============================================
    console.log('\n📦 Adding delivery note history...')
    const soldVehiclesBySales = vehicles.filter(v => 
      v.status === 'Sold' && salesUsers.some(su => su._id.toString() === v.createdBy.toString())
    ).slice(0, 8)
    
    for (const vehicle of soldVehiclesBySales) {
      if (Math.random() > 0.3) { // 70% chance
        vehicle.deliveryNoteHistory = [{
          generatedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
          generatedAt: randomDate(vehicle.saleDate || vehicle.createdAt, now),
          filename: `Delivery_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`
        }]
        await vehicle.save()
        console.log(`   ✓ Added delivery note to ${vehicle.vehicleNo}`)
      }
    }

    // ============================================
    // ADD CHASSIS/ENGINE NUMBER HISTORY
    // ============================================
    console.log('\n🔧 Adding chassis/engine number history...')
    const vehiclesForHistory = vehicles.slice(0, 8)
    for (const vehicle of vehiclesForHistory) {
      if (Math.random() > 0.4) { // 60% chance
        vehicle.chassisNoHistory = [{
          oldValue: `OLD${vehicle.chassisNo}`,
          newValue: vehicle.chassisNo,
          changedBy: adminUser._id,
          changedAt: randomDate(vehicle.createdAt, now)
        }]
        vehicle.engineNoHistory = [{
          oldValue: `OLD${vehicle.engineNo}`,
          newValue: vehicle.engineNo,
          changedBy: adminUser._id,
          changedAt: randomDate(vehicle.createdAt, now)
        }]
        await vehicle.save()
        console.log(`   ✓ Added chassis/engine history to ${vehicle.vehicleNo}`)
      }
    }

    // ============================================
    // ADD MORE SETTLEMENT HISTORY
    // ============================================
    console.log('\n💵 Adding additional settlement history...')
    const vehiclesWithPending = vehicles.filter(v => 
      v.status === 'Sold' && (parseFloat(v.remainingAmount) || 0) > 0
    ).slice(0, 5)
    
    for (const vehicle of vehiclesWithPending) {
      if (vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0) {
        // Add another settlement
        const remaining = parseFloat(vehicle.remainingAmount) || 0
        const settledAmount = Math.floor(remaining * 0.4)
        vehicle.paymentSettlementHistory.push({
          settlementType: 'FROM_CUSTOMER',
          amount: settledAmount,
          paymentMode: ['cash', 'bankTransfer', 'online'][Math.floor(Math.random() * 3)],
          settledBy: adminUser._id,
          settledAt: randomDate(vehicle.saleDate || vehicle.createdAt, now),
          notes: 'Additional settlement received'
        })
        vehicle.remainingAmount = remaining - settledAmount
        await vehicle.save()
        console.log(`   ✓ Added additional settlement to ${vehicle.vehicleNo}`)
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log(`\n✅ Successfully created ${vehicles.length} vehicles`)
    console.log('\n📊 Summary:')
    console.log(`   - On Modification: ${vehicles.filter(v => v.status === 'On Modification').length}`)
    console.log(`   - In Stock: ${vehicles.filter(v => v.status === 'In Stock').length}`)
    console.log(`   - Reserved: ${vehicles.filter(v => v.status === 'Reserved').length}`)
    console.log(`   - Sold: ${vehicles.filter(v => v.status === 'Sold').length}`)
    console.log(`   - Processing: ${vehicles.filter(v => v.status === 'Processing').length}`)
    console.log(`   - Deleted: ${vehicles.filter(v => v.status === 'DELETED').length}`)
    console.log(`   - With Pending Payments: ${vehicles.filter(v => v.pendingPaymentType).length}`)
    console.log(`   - With Settlement History: ${vehicles.filter(v => v.paymentSettlementHistory && v.paymentSettlementHistory.length > 0).length}`)
    console.log(`   - Current Month Purchases: ${vehicles.filter(v => {
      const date = new Date(v.createdAt)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length}`)
    console.log(`   - Current Month Sales: ${vehicles.filter(v => {
      if (v.status !== 'Sold' || !v.saleDate) return false
      const date = new Date(v.saleDate)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length}`)

    console.log('\n🔑 Login Credentials:')
    console.log('   Admin: admin@test.com / admin123')
    console.log('   Purchase Manager 1: purchase1@test.com / password123')
    console.log('   Purchase Manager 2: purchase2@test.com / password123')
    console.log('   Sales Manager 1: sales1@test.com / password123')
    console.log('   Sales Manager 2: sales2@test.com / password123')
    console.log('   Disabled User: purchase3@test.com / password123 (Disabled)')

    console.log('\n✅ Comprehensive test data seeding completed!')
    
    // Verify data was created
    const finalUserCount = await User.countDocuments()
    const finalVehicleCount = await Vehicle.countDocuments()
    console.log(`\n📊 Final Database Counts:`)
    console.log(`   - Users: ${finalUserCount}`)
    console.log(`   - Vehicles: ${finalVehicleCount}`)
    
    if (finalUserCount === 0) {
      console.error('\n❌ WARNING: No users found in database after seeding!')
      process.exit(1)
    }
    if (finalVehicleCount === 0) {
      console.error('\n❌ WARNING: No vehicles found in database after seeding!')
      process.exit(1)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error seeding data:', error)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

seedComprehensiveData()
