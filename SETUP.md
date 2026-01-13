# 🚀 Quick Setup Guide

This is a quick reference guide for setting up the Vehicle Management System.

## Prerequisites Checklist

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm v9+ installed (`npm --version`)
- [ ] MongoDB installed and running OR MongoDB Atlas account
- [ ] Git installed

## Quick Start (5 Minutes)

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd vI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Backend

```bash
cd backend

# Create .env file (copy the template below)
```

**backend/.env:**
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vehicle-management
JWT_SECRET=change-this-to-a-random-32-character-string
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configure Frontend

```bash
cd frontend

# Create .env file
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Seed Database (Optional)

```bash
cd backend
npm run seed
```

This creates default users:
- Admin: `admin@vehicle.com` / `admin123`
- Purchase: `purchase@vehicle.com` / `purchase123`
- Sales: `sales@vehicle.com` / `sales123`
- Delivery: `delivery@vehicle.com` / `delivery123`

### 5. Start Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api
- Health Check: http://localhost:5001/api/health

## MongoDB Setup

### Local MongoDB

**Windows:**
```bash
net start MongoDB
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vehicle-management
   ```

## Troubleshooting

### Port Already in Use

Change port in backend `.env`:
```env
PORT=5002
```

Update frontend `.env`:
```env
VITE_API_URL=http://localhost:5002/api
```

### MongoDB Connection Failed

1. Check MongoDB is running
2. Verify connection string in `.env`
3. For Atlas: Check IP whitelist

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read full [README.md](./README.md) for detailed documentation
- Check [API Documentation](./README.md#api-documentation) for endpoints
- Review [Troubleshooting](./README.md#troubleshooting) for common issues

---

**Need Help?** Check the main README.md for comprehensive documentation.
