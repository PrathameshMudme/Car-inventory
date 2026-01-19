/**
 * Comprehensive Test Data Seeding Script
 * 
 * This script creates test data covering:
 * - All user roles (admin, purchase, sales)
 * - All vehicle statuses (On Modification, In Stock, Reserved, Sold, Processing, DELETED)
 * - All payment scenarios (full payment, partial payment, pending payments, settlements)
 * - All vehicle fields and edge cases
 * - Payment settlement history
 * - Purchase note history
 * - Chassis/Engine number history
 * - Various date ranges for testing reports
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
  const states = ['MH', 'GJ', 'DL', 'KA', 'TN']
  const state = states[Math.floor(Math.random() * states.length)]
  const district = String(Math.floor(Math.random() * 50) + 1).padStart(2, '0')
  const series = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const number = String(index).padStart(4, '0')
  return `${state}${district}${series}${number}`
}

// Helper function to generate chassis/engine number
const generateChassisNo = (index) => `CHASSIS${String(index).padStart(10, '0')}`
const generateEngineNo = (index) => `ENGINE${String(index).padStart(10, '0')}`

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
        password: 'admin123',
        role: 'admin',
        contact: '+91 99999 99999',
        status: 'Active'
      },
      {
        name: 'Rajesh Kumar',
        email: 'purchase1@test.com',
        password: 'password123',
        role: 'purchase',
        contact: '+91 98765 43210',
        status: 'Active'
      },
      {
        name: 'Amit Patil',
        email: 'purchase2@test.com',
        password: 'password123',
        role: 'purchase',
        contact: '+91 87654 32109',
        status: 'Active'
      },
      {
        name: 'Priya Sharma',
        email: 'sales1@test.com',
        password: 'password123',
        role: 'sales',
        contact: '+91 76543 21098',
        status: 'Active'
      },
      {
        name: 'Sneha Desai',
        email: 'sales2@test.com',
        password: 'password123',
        role: 'sales',
        contact: '+91 65432 10987',
        status: 'Active'
      },
      {
        name: 'Vikram Singh',
        email: 'purchase3@test.com',
        password: 'password123',
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
    const purchaseUsers = createdUsers.filter(u => u.role === 'purchase')
    const salesUsers = createdUsers.filter(u => u.role === 'sales')

    // ============================================
    // CREATE VEHICLES (All Statuses & Scenarios)
    // ============================================
    console.log('🚗 Creating vehicles...')

    const makes = ['Maruti Suzuki', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra', 'Ford', 'Volkswagen']
    const models = {
      'Maruti Suzuki': ['Swift', 'Dzire', 'Baleno', 'Wagon R', 'Alto'],
      'Hyundai': ['i20', 'Creta', 'Verna', 'Grand i10', 'Venue'],
      'Honda': ['City', 'Amaze', 'WR-V', 'Jazz'],
      'Toyota': ['Innova', 'Fortuner', 'Glanza', 'Urban Cruiser'],
      'Tata': ['Nexon', 'Tiago', 'Harrier', 'Safari'],
      'Mahindra': ['XUV700', 'Scorpio', 'Bolero', 'Thar'],
      'Ford': ['EcoSport', 'Endeavour', 'Figo'],
      'Volkswagen': ['Polo', 'Vento', 'Virtus']
    }
    const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Brown']
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
    
    // Helper to get talukas for a district
    const getTalukasForDistrict = (district) => {
      return talukasMap[district] || ['City']
    }

    const vehicles = []
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const oneYearAgo = new Date(now.getFullYear() - 1, 0, 1)
    const twoYearsAgo = new Date(now.getFullYear() - 2, 0, 1)

    // ============================================
    // 1. VEHICLES ON MODIFICATION (10 vehicles)
    // ============================================
    for (let i = 1; i <= 10; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      // Mix dates: some in current month for testing
      const dateRangeEnd = i <= 3 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 5)) // Current month
        : sixMonthsAgo
      const purchaseDate = randomDate(twoYearsAgo, dateRangeEnd)
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2018 + Math.floor(Math.random() * 6),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2018 + Math.floor(Math.random() * 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 100000) + 10000} km`,
        
        // Purchase info
        purchasePrice: Math.floor(Math.random() * 500000) + 200000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        ownerTypeCustom: Math.random() > 0.7 ? '4th Owner' : '',
        
        // Purchase payment
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 200000) + 100000],
          ['bank_transfer', Math.floor(Math.random() * 300000) + 200000]
        ]),
        remainingAmountToSeller: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0,
        pendingPaymentType: Math.random() > 0.5 ? 'PENDING_TO_SELLER' : '',
        
        // Seller & Agent
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        
        // Address
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        // Modification
        askingPrice: Math.floor(Math.random() * 600000) + 300000,
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification work in progress for vehicle ${i}`,
        status: 'On Modification',
        modificationComplete: false,
        
        // Audit
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${i} - On Modification`
      })
      
      vehicle.createdAt = purchaseDate // Set createdAt to control purchase month/year
      try {
        await vehicle.save()
        vehicles.push(vehicle)
        console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status}`)
      } catch (error) {
        console.error(`   ❌ Failed to create vehicle ${i}:`, error.message)
        throw error
      }
    }

    // ============================================
    // 2. VEHICLES IN STOCK (15 vehicles)
    // ============================================
    for (let i = 11; i <= 25; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      // Mix dates: some in current month, some in past months for better test coverage
      const dateRangeEnd = i <= 15 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 10)) // Current month
        : new Date(now.getFullYear(), now.getMonth() - 1, 1) // Last month
      const purchaseDate = randomDate(sixMonthsAgo, dateRangeEnd)
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2019 + Math.floor(Math.random() * 5),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2019 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 80000) + 15000} km`,
        
        purchasePrice: Math.floor(Math.random() * 600000) + 250000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 250000) + 150000],
          ['bank_transfer', Math.floor(Math.random() * 400000) + 200000]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 60000) + 15000,
        
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(Math.random() * 700000) + 350000,
        lastPrice: Math.floor(Math.random() * 700000) + 350000,
        modificationCost: Math.floor(Math.random() * 60000) + 20000,
        modificationNotes: `Modification completed for vehicle ${i}`,
        status: 'In Stock',
        modificationComplete: true,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${i} - In Stock`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status}`)
    }

    // ============================================
    // 3. RESERVED VEHICLES (5 vehicles)
    // ============================================
    for (let i = 26; i <= 30; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const purchaseDate = randomDate(sixMonthsAgo, new Date(now.getFullYear(), now.getMonth() - 2, 1))
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2020 + Math.floor(Math.random() * 4),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 60000) + 20000} km`,
        
        purchasePrice: Math.floor(Math.random() * 700000) + 300000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * 3)], // 1st, 2nd, 3rd only
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 300000) + 200000],
          ['bank_transfer', Math.floor(Math.random() * 500000) + 300000]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 70000) + 20000,
        
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(Math.random() * 800000) + 400000,
        lastPrice: Math.floor(Math.random() * 800000) + 400000,
        modificationCost: Math.floor(Math.random() * 70000) + 25000,
        modificationNotes: `Modification completed`,
        status: 'Reserved',
        modificationComplete: true,
        
        // Customer info (reserved)
        customerName: `Customer ${i}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerAddressLine1: `Customer Building ${i}, Street ${i}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${i} - Reserved`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status}`)
    }

    // ============================================
    // 4. SOLD VEHICLES - Full Payment (10 vehicles)
    // ============================================
    for (let i = 31; i <= 40; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const purchaseDate = randomDate(oneYearAgo, sixMonthsAgo)
      // Mix sale dates: some in current month for testing
      const saleDateRangeEnd = i <= 33 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 10)) // Current month
        : now // Past months
      const saleDate = randomDate(purchaseDate, saleDateRangeEnd)
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2018 + Math.floor(Math.random() * 6),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2018 + Math.floor(Math.random() * 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 100000) + 10000} km`,
        
        purchasePrice: Math.floor(Math.random() * 500000) + 200000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 200000) + 100000],
          ['bank_transfer', Math.floor(Math.random() * 300000) + 200000]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(Math.random() * 600000) + 300000,
        lastPrice: Math.floor(Math.random() * 600000) + 300000,
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification completed`,
        status: 'Sold',
        modificationComplete: true,
        
        // Customer info
        customerName: `Customer ${i}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${i}@test.com`,
        customerAddress: `Customer Address ${i}`,
        customerAddressLine1: `Customer Building ${i}, Street ${i}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerAadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        saleDate,
        
        // Full payment
        paymentType: 'full',
        paymentCash: Math.floor(Math.random() * 200000) + 100000,
        paymentBankTransfer: Math.floor(Math.random() * 300000) + 200000,
        paymentOnline: Math.floor(Math.random() * 100000) + 50000,
        paymentLoan: 0,
        remainingAmount: 0,
        saleNotes: `Full payment received for vehicle ${i}`,
        
        // Some sold vehicles should be created by sales managers (for delivery notes testing)
        createdBy: Math.random() > 0.5 
          ? salesUsers[Math.floor(Math.random() * salesUsers.length)]._id 
          : purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${i} - Sold (Full Payment)`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status} (Full Payment)`)
    }

    // ============================================
    // 5. SOLD VEHICLES - With Pending Payment from Customer (8 vehicles)
    // ============================================
    for (let i = 41; i <= 48; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const purchaseDate = randomDate(oneYearAgo, sixMonthsAgo)
      // Mix sale dates: some in current month for testing
      const saleDateRangeEnd = i <= 43 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 10)) // Current month
        : new Date(now.getFullYear(), now.getMonth() - 1, 1) // Last month
      const saleDate = randomDate(purchaseDate, saleDateRangeEnd)
      const totalPrice = Math.floor(Math.random() * 600000) + 300000
      const paidAmount = Math.floor(totalPrice * 0.7) // 70% paid
      const remaining = totalPrice - paidAmount
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2019 + Math.floor(Math.random() * 5),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2019 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 80000) + 15000} km`,
        
        purchasePrice: Math.floor(Math.random() * 500000) + 200000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 200000) + 100000],
          ['bank_transfer', Math.floor(Math.random() * 300000) + 200000]
        ]),
        remainingAmountToSeller: 0,
        pendingPaymentType: 'PENDING_FROM_CUSTOMER',
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        
        addressLine1: `Address Line 1, Building ${i}`,
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
        customerName: `Customer ${i}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${i}@test.com`,
        customerAddress: `Customer Address ${i}`,
        customerAddressLine1: `Customer Building ${i}, Street ${i}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerAadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        saleDate,
        
        // Partial payment with security cheque
        paymentType: 'custom',
        paymentCash: Math.floor(paidAmount * 0.4),
        paymentBankTransfer: Math.floor(paidAmount * 0.4),
        paymentOnline: Math.floor(paidAmount * 0.2),
        paymentLoan: 0,
        paymentSecurityCheque: {
          enabled: true,
          bankName: 'Test Bank',
          accountNumber: `ACC${i}`,
          chequeNumber: `CHQ${i}`,
          amount: remaining
        },
        remainingAmount: remaining,
        saleNotes: `Partial payment received, security cheque for remaining amount`,
        
        // Payment settlement history (some settled, some pending)
        paymentSettlementHistory: Math.random() > 0.5 ? [{
          settlementType: 'FROM_CUSTOMER',
          amount: Math.floor(remaining * 0.5),
          paymentMode: ['cash', 'bankTransfer', 'online'][Math.floor(Math.random() * 3)],
          settledBy: adminUser._id,
          settledAt: randomDate(saleDate, now),
          notes: `Partial settlement of pending payment`
        }] : [],
        
        // Some sold vehicles should be created by sales managers (for delivery notes testing)
        createdBy: Math.random() > 0.5 
          ? salesUsers[Math.floor(Math.random() * salesUsers.length)]._id 
          : purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${i} - Sold (Pending Payment)`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status} (Pending Payment)`)
    }

    // ============================================
    // 6. SOLD VEHICLES - With Pending Payment to Seller (5 vehicles)
    // ============================================
    for (let i = 49; i <= 53; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const purchaseDate = randomDate(oneYearAgo, sixMonthsAgo)
      const saleDate = randomDate(purchaseDate, new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const remainingToSeller = Math.floor(Math.random() * 100000) + 50000
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const customerDistrict = districts[Math.floor(Math.random() * districts.length)]
      const customerTaluka = getTalukasForDistrict(customerDistrict)[Math.floor(Math.random() * getTalukasForDistrict(customerDistrict).length)]
      
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2018 + Math.floor(Math.random() * 6),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2018 + Math.floor(Math.random() * 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 100000) + 10000} km`,
        
        purchasePrice: Math.floor(Math.random() * 500000) + 200000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 200000) + 100000],
          ['bank_transfer', Math.floor(Math.random() * 300000) + 200000]
        ]),
        remainingAmountToSeller: remainingToSeller,
        pendingPaymentType: 'PENDING_TO_SELLER',
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(Math.random() * 600000) + 300000,
        lastPrice: Math.floor(Math.random() * 600000) + 300000,
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification completed`,
        status: 'Sold',
        modificationComplete: true,
        
        // Customer info
        customerName: `Customer ${i}`,
        customerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${i}@test.com`,
        customerAddress: `Customer Address ${i}`,
        customerAddressLine1: `Customer Building ${i}, Street ${i}`,
        customerDistrict: customerDistrict,
        customerTaluka: customerTaluka,
        customerPincode: String(Math.floor(Math.random() * 900000) + 100000),
        customerAadhaar: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        customerPAN: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
        customerSource: ['agent', 'walkin', 'online'][Math.floor(Math.random() * 3)],
        saleDate,
        
        // Full payment from customer
        paymentType: 'full',
        paymentCash: Math.floor(Math.random() * 200000) + 100000,
        paymentBankTransfer: Math.floor(Math.random() * 300000) + 200000,
        paymentOnline: Math.floor(Math.random() * 100000) + 50000,
        paymentLoan: 0,
        remainingAmount: 0,
        saleNotes: `Full payment from customer, pending payment to seller`,
        
        // Payment settlement history (some settled, some pending)
        paymentSettlementHistory: Math.random() > 0.5 ? [{
          settlementType: 'TO_SELLER',
          amount: Math.floor(remainingToSeller * 0.5),
          paymentMode: ['cash', 'bankTransfer', 'online'][Math.floor(Math.random() * 3)],
          settledBy: adminUser._id,
          settledAt: randomDate(purchaseDate, now),
          notes: `Partial settlement to seller`
        }] : [],
        
        // Some sold vehicles should be created by sales managers (for delivery notes testing)
        createdBy: Math.random() > 0.5 
          ? salesUsers[Math.floor(Math.random() * salesUsers.length)]._id 
          : purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        modifiedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
        notes: `Test vehicle ${i} - Sold (Pending to Seller)`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status} (Pending to Seller)`)
    }

    // ============================================
    // 7. PROCESSING VEHICLES (3 vehicles)
    // ============================================
    for (let i = 54; i <= 56; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const purchaseDate = randomDate(sixMonthsAgo, new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2020 + Math.floor(Math.random() * 4),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2020 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 60000) + 20000} km`,
        
        purchasePrice: Math.floor(Math.random() * 700000) + 300000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * 3)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 300000) + 200000],
          ['bank_transfer', Math.floor(Math.random() * 500000) + 300000]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 70000) + 20000,
        
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(Math.random() * 800000) + 400000,
        lastPrice: Math.floor(Math.random() * 800000) + 400000,
        modificationCost: Math.floor(Math.random() * 70000) + 25000,
        modificationNotes: `Modification completed`,
        status: 'Processing',
        modificationComplete: true,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${i} - Processing`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status}`)
    }

    // ============================================
    // 8. DELETED VEHICLES (2 vehicles - soft delete)
    // ============================================
    for (let i = 57; i <= 58; i++) {
      const make = makes[Math.floor(Math.random() * makes.length)]
      const purchaseDate = randomDate(twoYearsAgo, oneYearAgo)
      const deletedDate = randomDate(purchaseDate, now)
      const selectedDistrict = districts[Math.floor(Math.random() * districts.length)]
      const selectedTaluka = getTalukasForDistrict(selectedDistrict)[Math.floor(Math.random() * getTalukasForDistrict(selectedDistrict).length)]
      const vehicle = new Vehicle({
        vehicleNo: generateVehicleNo(i),
        chassisNo: generateChassisNo(i),
        engineNo: generateEngineNo(i),
        make,
        model: models[make][Math.floor(Math.random() * models[make].length)],
        year: 2017 + Math.floor(Math.random() * 5),
        vehicleMonth: Math.floor(Math.random() * 12) + 1, // 1-12
        vehicleYear: 2017 + Math.floor(Math.random() * 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        kilometers: `${Math.floor(Math.random() * 120000) + 20000} km`,
        
        purchasePrice: Math.floor(Math.random() * 500000) + 200000,
        purchaseDate,
        ownerType: ownerTypes[Math.floor(Math.random() * ownerTypes.length)],
        
        purchasePaymentMethods: new Map([
          ['cash', Math.floor(Math.random() * 200000) + 100000],
          ['bank_transfer', Math.floor(Math.random() * 300000) + 200000]
        ]),
        remainingAmountToSeller: 0,
        
        sellerName: `Seller ${i}`,
        sellerContact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentName: `Agent ${i % 5 + 1}`,
        agentPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        agentCommission: Math.floor(Math.random() * 50000) + 10000,
        
        addressLine1: `Address Line 1, Building ${i}`,
        district: selectedDistrict,
        taluka: selectedTaluka,
        pincode: String(Math.floor(Math.random() * 900000) + 100000),
        
        askingPrice: Math.floor(Math.random() * 600000) + 300000,
        modificationCost: Math.floor(Math.random() * 50000) + 10000,
        modificationNotes: `Modification completed`,
        status: 'DELETED',
        modificationComplete: true,
        
        deletedAt: deletedDate,
        deletedBy: adminUser._id,
        
        createdBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
        notes: `Test vehicle ${i} - Deleted`
      })
      
      vehicle.createdAt = purchaseDate
      await vehicle.save()
      vehicles.push(vehicle)
      console.log(`   ✓ Created vehicle ${i}: ${vehicle.vehicleNo} - ${vehicle.status}`)
    }

    // ============================================
    // ADD PURCHASE NOTE HISTORY (for some vehicles created by purchase managers)
    // ============================================
    console.log('\n📄 Adding purchase note history...')
    const vehiclesForPurchaseNotes = vehicles.filter(v => 
      purchaseUsers.some(pu => pu._id.toString() === v.createdBy.toString())
    ).slice(0, 20)
    for (const vehicle of vehiclesForPurchaseNotes) {
      if (Math.random() > 0.3) { // 70% chance
        vehicle.purchaseNoteHistory = [{
          generatedBy: purchaseUsers[Math.floor(Math.random() * purchaseUsers.length)]._id,
          generatedAt: randomDate(vehicle.createdAt, now),
          filename: `Purchase_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`
        }]
        await vehicle.save()
        console.log(`   ✓ Added purchase note history to ${vehicle.vehicleNo}`)
      }
    }

    // ============================================
    // ADD DELIVERY NOTE HISTORY (for some sold vehicles created by sales managers)
    // ============================================
    console.log('\n📦 Adding delivery note history...')
    const soldVehiclesBySales = vehicles.filter(v => 
      v.status === 'Sold' && salesUsers.some(su => su._id.toString() === v.createdBy.toString())
    ).slice(0, 10)
    for (const vehicle of soldVehiclesBySales) {
      if (Math.random() > 0.4) { // 60% chance
        vehicle.deliveryNoteHistory = [{
          generatedBy: salesUsers[Math.floor(Math.random() * salesUsers.length)]._id,
          generatedAt: randomDate(vehicle.saleDate || vehicle.createdAt, now),
          filename: `Delivery_Note_${vehicle.vehicleNo}_${Date.now()}.pdf`
        }]
        await vehicle.save()
        console.log(`   ✓ Added delivery note history to ${vehicle.vehicleNo}`)
      }
    }

    // ============================================
    // ADD CHASSIS/ENGINE NUMBER HISTORY (for some vehicles)
    // ============================================
    console.log('\n🔧 Adding chassis/engine number history...')
    const vehiclesForHistory = vehicles.slice(0, 10) // First 10 vehicles
    for (const vehicle of vehiclesForHistory) {
      if (Math.random() > 0.5) { // 50% chance
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
