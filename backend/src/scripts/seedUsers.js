const mongoose = require('mongoose')
const dotenv = require('dotenv')
const User = require('../models/User')
const connectDB = require('../config/database')

dotenv.config()

const dummyUsers = [
  {
    name: 'Admin User',
    email: 'admin@vehicle.com',
    password: 'admin123',
    role: 'admin',
    contact: '+91 99999 99999',
    status: 'Active'
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@vehicle.com',
    password: 'password123',
    role: 'purchase',
    contact: '+91 98765 43210',
    status: 'Active'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@vehicle.com',
    password: 'password123',
    role: 'sales',
    contact: '+91 87654 32109',
    status: 'Active'
  },
  {
    name: 'Amit Patil',
    email: 'amit@vehicle.com',
    password: 'password123',
    role: 'purchase',
    contact: '+91 76543 21098',
    status: 'Active'
  },
  {
    name: 'Sneha Desai',
    email: 'sneha@vehicle.com',
    password: 'password123',
    role: 'sales',
    contact: '+91 65432 10987',
    status: 'Active'
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@vehicle.com',
    password: 'password123',
    role: 'purchase',
    contact: '+91 54321 09876',
    status: 'Disabled'
  }
]

const seedUsers = async () => {
  try {
    await connectDB()

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({})
    // console.log('Cleared existing users')

    // Check if users already exist
    const existingUsers = await User.find()
    if (existingUsers.length > 0) {
      console.log('Users already exist. Skipping seed.')
      console.log(`Found ${existingUsers.length} existing users`)
      process.exit(0)
    }

    // Insert dummy users
    for (const userData of dummyUsers) {
      const user = new User(userData)
      await user.save()
      console.log(`Created user: ${user.name} (${user.email})`)
    }

    console.log('\n✅ Successfully seeded users!')
    console.log('\nLogin credentials:')
    console.log('Admin: admin@vehicle.com / admin123')
    console.log('Purchase Manager: rajesh@vehicle.com / password123')
    console.log('Sales Manager: priya@vehicle.com / password123')
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding users:', error)
    process.exit(1)
  }
}

seedUsers()
