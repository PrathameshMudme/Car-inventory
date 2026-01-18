# Dummy Data Seeding Guide

This guide will help you populate your database with comprehensive dummy data for testing all functionalities of the Vehicle Management System.

## Prerequisites

1. **MongoDB must be running** (local or remote)
2. **Users must be seeded first** - Run `npm run seed` to create test users
3. **Backend environment variables** should be configured (`.env` file)

## Quick Start

### Step 1: Seed Users (if not already done)
```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin@vehicle.com` / `admin123`
- Purchase Manager: `rajesh@vehicle.com` / `password123`
- Sales Manager: `priya@vehicle.com` / `password123`
- Additional test users

### Step 2: Seed Dummy Vehicle Data
```bash
npm run seed:dummy
```

Or directly:
```bash
node src/scripts/seedDummyData.js
```

## What Gets Created

The script creates **38 vehicles** across different statuses:

### 1. **On Modification** (8 vehicles)
- Vehicles pending modification completion
- Missing various fields (asking price, modification notes, agent phone, etc.)
- **Use Case**: Test the "Action Required" tab functionality
- **Status**: `On Modification`

### 2. **In Stock** (12 vehicles)
- Complete vehicles ready for sale
- All modification fields filled
- **Use Case**: Test inventory views, sales workflows
- **Status**: `In Stock`

### 3. **Reserved** (5 vehicles)
- Vehicles booked by customers
- Customer information included
- **Use Case**: Test reservation management
- **Status**: `Reserved`

### 4. **Sold** (10 vehicles)
- Completed sales with various payment scenarios:
  - Full cash payment (3 vehicles)
  - Mixed payment (cash + bank transfer + online) (3 vehicles)
  - Payment with loan (2 vehicles)
  - Payment with security cheque (pending) (2 vehicles)
- **Use Case**: Test sales reports, P&L calculations, pending payments
- **Status**: `Sold`

### 5. **Processing** (3 vehicles)
- Vehicles in documentation stage
- **Use Case**: Test processing workflows
- **Status**: `Processing`

## Data Variety

### Vehicle Makes & Models
- Maruti Suzuki (Swift, Dzire, Baleno, Wagon R, Alto, Ertiga, Vitara Brezza)
- Hyundai (i20, i10, Creta, Verna, Venue, Grand i10)
- Honda (City, Amaze, WR-V, Jazz)
- Toyota (Innova, Fortuner, Glanza, Urban Cruiser)
- Mahindra (XUV300, Scorpio, Bolero, XUV500)
- Tata (Nexon, Tiago, Harrier, Safari)
- Ford (EcoSport, Figo, Aspire)
- Volkswagen (Polo, Vento, Virtus)

### Other Varied Data
- **Colors**: White, Black, Silver, Red, Blue, Grey, Brown, Golden
- **Fuel Types**: Petrol, Diesel, CNG, Electric, Hybrid
- **Owner Types**: 1st Owner, 2nd Owner, 3rd Owner, Custom
- **Maharashtra Districts**: Mumbai, Pune, Nagpur, Thane, Nashik, etc.
- **Agents**: 8 different agent names with phone numbers
- **Years**: 2018-2024
- **Prices**: ₹3,00,000 - ₹11,00,000 range

## Testing Scenarios

### ✅ Admin Dashboard
- View overview with stats from all vehicles
- Check revenue and profit calculations
- Review action required items

### ✅ Action Required Tab
- See vehicles missing modification fields
- Complete vehicle modifications
- Test image upload workflows

### ✅ Inventory Management
- View vehicles in stock
- Filter and search vehicles
- Test vehicle details pages

### ✅ Sales Workflow
- Create sales for in-stock vehicles
- Test different payment methods
- Verify profit/loss calculations
- Test security cheque handling

### ✅ Purchase Management
- View purchase history
- Test purchase note generation
- Verify payment method tracking

### ✅ Reports & Analytics
- Test P&L reports
- View sales reports
- Check pending payments
- Verify agent commission tracking

### ✅ User Management
- Test role-based access
- Verify user permissions
- Test user creation/editing

## Important Notes

⚠️ **Warning**: The script will check for existing vehicles. If you want to clear existing data, uncomment the delete line in the script:
```javascript
// await Vehicle.deleteMany({})
```

⚠️ **Vehicle Numbers**: The script generates unique vehicle numbers. If you run it multiple times, duplicate vehicle numbers will be skipped.

⚠️ **Users Required**: Make sure you have at least one admin user and preferably some purchase/sales users before running the dummy data script.

## Troubleshooting

### Error: "No users found"
**Solution**: Run `npm run seed` first to create users.

### Error: "Admin user not found"
**Solution**: Make sure at least one user with role 'admin' exists.

### Error: "MongoDB connection failed"
**Solution**: 
- Check if MongoDB is running
- Verify your `.env` file has correct `MONGODB_URI`
- Check network connectivity if using remote MongoDB

### Duplicate Vehicle Numbers
**Solution**: This is normal if running the script multiple times. Duplicates are automatically skipped.

## Customization

You can modify the script to:
- Change the number of vehicles created per status
- Adjust price ranges
- Add more vehicle makes/models
- Modify payment scenarios
- Change agent names

Edit `backend/src/scripts/seedDummyData.js` to customize.

## Clean Up

To remove all dummy data:
```javascript
// In MongoDB shell or script
db.vehicles.deleteMany({ notes: /Test vehicle/ })
```

Or delete all vehicles:
```javascript
db.vehicles.deleteMany({})
```

## Support

If you encounter any issues:
1. Check MongoDB connection
2. Verify user data exists
3. Check console logs for specific errors
4. Ensure all required fields are present in the script

---

**Happy Testing! 🚗✨**
