# 🚗 Vehicle Management System - Full Stack Application

A comprehensive vehicle management system built with React.js frontend and Node.js backend, designed for automotive dealerships to manage vehicle inventory, sales, purchases, and deliveries.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## ✨ Features

### Role-Based Access Control
- **Admin** - Complete system control, vehicle editing, agent management, user management
- **Purchase Manager** - Vehicle acquisition and documentation
- **Sales Manager** - Vehicle sales and customer management
- **Delivery Manager** - Delivery scheduling and execution

### Core Functionality
- ✅ Vehicle inventory management (Grid & Table views)
- ✅ Advanced search and filtering
- ✅ Vehicle comparison tool (Before/After modification)
- ✅ Vehicle details editing (Admin only)
- ✅ Document management and upload
- ✅ Agent management with purchase history
- ✅ Purchase and delivery notes generation (PDF)
- ✅ Dashboard analytics with charts
- ✅ Profit & Loss management
- ✅ Expense & commission tracking
- ✅ Notification system
- ✅ Responsive design

## 🛠 Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **React Router 6** - Routing
- **Material-UI (MUI) 7** - Component library
- **Chart.js 4** - Data visualization
- **Vite 5** - Build tool
- **Axios** - HTTP client
- **Font Awesome** - Icons

### Backend
- **Node.js 18+** - Runtime
- **Express.js 4** - Web framework
- **MongoDB/Mongoose 8** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **Bcrypt** - Password hashing
- **PDFKit** - PDF generation

## 📁 Project Structure

```
vehicle-management-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   ├── sections/   # Dashboard section components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── VehicleDetails.jsx
│   │   │   ├── EditVehicle.jsx
│   │   │   └── ...
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   └── dashboards/  # Dashboard pages
│   │   ├── context/         # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── AppContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # CSS files
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── vehicles.js
│   │   │   ├── agents.js
│   │   │   └── dealers.js (legacy, kept for backward compatibility)
│   │   ├── models/          # Database models
│   │   │   ├── User.js
│   │   │   ├── Vehicle.js
│   │   │   ├── VehicleImage.js
│   │   │   └── VehicleDocument.js
│   │   ├── middleware/      # Express middleware
│   │   │   └── auth.js
│   │   ├── config/          # Configuration files
│   │   │   └── database.js
│   │   ├── scripts/         # Utility scripts
│   │   │   └── seedUsers.js
│   │   └── server.js        # Entry point
│   ├── uploads/             # Uploaded files (gitignored)
│   └── package.json
│
├── database/                # Database schemas
│   └── schema.sql
│
├── .gitignore
└── README.md
```

## 🚀 Installation Guide

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download Node.js](https://nodejs.org/)
  - Recommended: Node.js v20 LTS or v22 LTS
  - Verify installation: `node --version`
- **npm** (v9.0.0 or higher) - Comes with Node.js
  - Verify installation: `npm --version`
- **MongoDB** - [Download MongoDB](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas (cloud): [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - Verify installation: `mongod --version` (if installed locally)

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd vI
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # On Windows (PowerShell)
   New-Item -Path .env -ItemType File
   
   # On Linux/Mac
   touch .env
   ```

4. **Configure environment variables:**
   
   Open the `.env` file and add the following:
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development

   # MongoDB Configuration
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/vehicle-management
   
   # For MongoDB Atlas (cloud):
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vehicle-management?retryWrites=true&w=majority

   # JWT Secret Key (Generate a strong random string)
   # Generate one using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
   ```

   **Important:** 
   - Replace `JWT_SECRET` with a strong random string (minimum 32 characters)
   - For MongoDB Atlas, replace `username` and `password` with your Atlas credentials
   - For local MongoDB, ensure MongoDB is running on your system

5. **Seed initial users (Optional but recommended):**
   ```bash
   npm run seed
   ```
   
   This creates default users:
   - Admin: `admin@vehicle.com` / `admin123`
   - Purchase Manager: `purchase@vehicle.com` / `purchase123`
   - Sales Manager: `sales@vehicle.com` / `sales123`
   - Delivery Manager: `delivery@vehicle.com` / `delivery123`

### Step 3: Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # On Windows (PowerShell)
   New-Item -Path .env -ItemType File
   
   # On Linux/Mac
   touch .env
   ```

4. **Configure environment variables:**
   
   Open the `.env` file and add the following:
   ```env
   # API Configuration
   # Backend API URL (should match backend PORT)
   VITE_API_URL=http://localhost:5001/api

   # Environment
   VITE_NODE_ENV=development
   ```

   **Important:** 
   - Ensure `VITE_API_URL` port matches the backend `PORT` in backend `.env`
   - Default is `5001` for backend and `http://localhost:5001/api` for frontend

## 🏃 Running the Application

### Start MongoDB (If using local MongoDB)

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or if installed as a service, it should start automatically
```

**Linux/Mac:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or
brew services start mongodb-community
```

**Verify MongoDB is running:**
- Open MongoDB Compass and connect to `mongodb://localhost:27017`
- Or check in terminal: `mongosh` (should connect successfully)

### Start Backend Server

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

3. **Verify backend is running:**
   - You should see: `✅ MongoDB Connected: ...`
   - Server running message: `Server running on port 5001`
   - Open browser: `http://localhost:5001/api/health` (should return JSON)

### Start Frontend Server

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend will be available at: `http://localhost:5173` (or the port shown in terminal)
   - The app will automatically open in your browser

### Default Login Credentials

After seeding users, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vehicle.com | admin123 |
| Purchase Manager | purchase@vehicle.com | purchase123 |
| Sales Manager | sales@vehicle.com | sales123 |
| Delivery Manager | delivery@vehicle.com | delivery123 |

## 📡 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

- `POST /api/auth/login` - User login
  ```json
  {
    "email": "admin@vehicle.com",
    "password": "admin123"
  }
  ```

- `GET /api/auth/me` - Get current user (requires auth token)

### Vehicle Endpoints

- `GET /api/vehicles` - Get all vehicles (with filters: `?status=In Stock&search=keyword`)
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle (Purchase Manager, Admin)
- `PUT /api/vehicles/:id` - Update vehicle (Admin only)
- `GET /api/vehicles/:id/purchase-note` - Generate purchase note PDF

### User Endpoints

- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `PUT /api/users/:id/password` - Change password (Admin only)
- `PUT /api/users/:id/status` - Enable/Disable user (Admin only)

### Dealer Endpoints

- `GET /api/dealers` - Get all dealers with vehicle counts (Admin only)
- `GET /api/dealers/:name/vehicles` - Get vehicles for a specific dealer (Admin only)

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5001` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/vehicle-management` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5001/api` |
| `VITE_NODE_ENV` | Environment | `development` |

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Problem:** `Error connecting to MongoDB`

**Solutions:**
1. **Check if MongoDB is running:**
   - Windows: Open Services and check MongoDB service
   - Linux/Mac: `sudo systemctl status mongod`

2. **Verify connection string:**
   - Check `.env` file has correct `MONGODB_URI`
   - For Atlas: Ensure IP whitelist includes your IP

3. **Check MongoDB port:**
   - Default is `27017`
   - Verify: `mongosh` should connect

### Port Already in Use

**Problem:** `Port 5001 is already in use`

**Solutions:**
1. **Change backend port in `.env`:**
   ```env
   PORT=5002
   ```

2. **Update frontend `.env` to match:**
   ```env
   VITE_API_URL=http://localhost:5002/api
   ```

3. **Or kill the process using the port:**
   ```bash
   # Windows
   netstat -ano | findstr :5001
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:5001 | xargs kill
   ```

### Module Not Found Errors

**Problem:** `Cannot find module 'xyz'`

**Solutions:**
1. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

### CORS Errors

**Problem:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Solutions:**
1. **Check backend CORS is enabled** (should be in `server.js`)
2. **Verify frontend URL matches** in backend CORS configuration
3. **Check environment variables** are correct

### Authentication Errors

**Problem:** `Unauthorized` or `Invalid token`

**Solutions:**
1. **Clear browser localStorage:**
   ```javascript
   localStorage.clear()
   ```
   Then login again

2. **Check JWT_SECRET** is set in backend `.env`
3. **Verify token expiration** (default is 7 days)

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the production bundle:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `dist` folder:**
   - **Vercel:** Connect GitHub repo, set build command: `npm run build`, output directory: `dist`
   - **Netlify:** Drag and drop `dist` folder or connect GitHub repo

3. **Set environment variables:**
   - `VITE_API_URL` = Your backend API URL (e.g., `https://api.yourdomain.com/api`)

### Backend Deployment (Railway/Heroku/Render)

1. **Set environment variables:**
   - `PORT` (usually auto-set by platform)
   - `MONGODB_URI` (your MongoDB connection string)
   - `JWT_SECRET` (generate a strong random string)
   - `NODE_ENV=production`

2. **Deploy:**
   - Connect GitHub repository
   - Set root directory to `backend`
   - Platform will auto-detect Node.js and run `npm start`

### Database Deployment

**MongoDB Atlas (Recommended for production):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in production environment

## 📝 Important Notes

- **Never commit `.env` files** - They are in `.gitignore`
- **Always use strong JWT_SECRET** in production
- **Upload files are stored in `backend/uploads/`** - Ensure proper backup
- **Default users are for development only** - Change passwords in production
- **MongoDB indexes** are created automatically on first run

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation

---

**Made with ❤️ for Vehicle Management**
