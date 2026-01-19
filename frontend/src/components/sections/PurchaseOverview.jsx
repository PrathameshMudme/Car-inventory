import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApp } from '../../context/AppContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import { Box, Paper, Typography, Chip, Button } from '@mui/material'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import '../../styles/Sections.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const PurchaseOverview = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const { setActiveSection } = useApp()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (token) {
      loadVehicles()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      console.log('PurchaseOverview: Loaded vehicles from API', data.length)
      console.log('PurchaseOverview: Sample vehicle', data[0] ? {
        vehicleNo: data[0].vehicleNo,
        createdBy: data[0].createdBy,
        createdByType: typeof data[0].createdBy
      } : 'No vehicles')
      console.log('PurchaseOverview: Current user', { _id: user?._id, role: user?.role })
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get user's vehicles
  // Note: Backend already filters by createdBy for purchase managers, so for purchase managers
  // we can use vehicles directly. For admin, show all vehicles.
  const getUserVehicles = () => {
    // Backend already filters by createdBy for purchase managers (see backend/src/routes/vehicles.js line 507-509)
    // So for purchase managers, all returned vehicles are vehicles they added
    // For admin, show all vehicles
    if (isAdmin) {
      return vehicles
    }
    
    // For purchase managers: Backend already filtered, so trust the backend
    // Return all vehicles since backend already filtered by createdBy
    console.log('PurchaseOverview: getUserVehicles - returning', vehicles.length, 'vehicles for purchase manager')
    return vehicles
  }

  // Helper function to get vehicle purchase date (for purchase notes - uses purchaseMonth/purchaseYear or purchaseDate)
  const getVehiclePurchaseDate = (vehicle) => {
    // First try purchaseDate
    if (vehicle.purchaseDate) {
      return new Date(vehicle.purchaseDate)
    }
    // Then try purchaseMonth and purchaseYear (used for generating purchase notes)
    if (vehicle.purchaseMonth && vehicle.purchaseYear) {
      return new Date(vehicle.purchaseYear, vehicle.purchaseMonth - 1, 1)
    }
    return null
  }

  // Helper function to get when vehicle was added by Purchase Manager (for insights)
  const getVehicleAddedDate = (vehicle) => {
    // Use createdAt - when the Purchase Manager added the vehicle to the system
    if (vehicle.createdAt) {
      return new Date(vehicle.createdAt)
    }
    return null
  }

  // Get monthly data for last 6 months (based on when vehicles were added by Purchase Manager)
  const getMonthlyData = () => {
    const userVehicles = getUserVehicles()
    const months = []
    const data = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-IN', { month: 'short' })
      months.push(monthName)
      
      const count = userVehicles.filter(vehicle => {
        const addedDate = getVehicleAddedDate(vehicle)
        if (!addedDate) return false
        return addedDate.getMonth() === date.getMonth() && 
               addedDate.getFullYear() === date.getFullYear()
      }).length
      
      data.push(count)
    }
    
    return { months, data }
  }

  // Calculate comprehensive statistics
  const calculateStats = () => {
    const userVehicles = getUserVehicles()
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // This month - vehicles added by Purchase Manager this month (based on createdAt)
    const thisMonthVehicles = userVehicles.filter(vehicle => {
      const addedDate = getVehicleAddedDate(vehicle)
      if (!addedDate) return false
      return addedDate.getMonth() === currentMonth && 
             addedDate.getFullYear() === currentYear
    })

    // Last month for comparison - vehicles added by Purchase Manager last month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const lastMonthVehicles = userVehicles.filter(vehicle => {
      const addedDate = getVehicleAddedDate(vehicle)
      if (!addedDate) return false
      return addedDate.getMonth() === lastMonth && 
             addedDate.getFullYear() === lastMonthYear
    })

    // Total purchases
    const totalPurchases = userVehicles.length

    // Status breakdown
    const statusCounts = {
      'On Modification': userVehicles.filter(v => v.status === 'On Modification').length,
      'In Stock': userVehicles.filter(v => v.status === 'In Stock').length,
      'Sold': userVehicles.filter(v => v.status === 'Sold').length,
      'Reserved': userVehicles.filter(v => v.status === 'Reserved').length,
      'Processing': userVehicles.filter(v => v.status === 'Processing').length
    }

    // Pending documents
    const pendingDocs = userVehicles.filter(vehicle => {
      return vehicle.missingDocuments && vehicle.missingDocuments.length > 0
    }).length

    // Financial stats
    const totalInvestment = thisMonthVehicles.reduce((sum, vehicle) => {
      return sum + (parseFloat(vehicle.purchasePrice) || 0)
    }, 0)

    const avgPurchasePrice = thisMonthVehicles.length > 0
      ? totalInvestment / thisMonthVehicles.length
      : 0

    // Month-over-month change
    const monthChange = lastMonthVehicles.length > 0
      ? ((thisMonthVehicles.length - lastMonthVehicles.length) / lastMonthVehicles.length * 100).toFixed(1)
      : thisMonthVehicles.length > 0 ? '100' : '0'

    return {
      totalPurchases,
      purchasedThisMonth: thisMonthVehicles.length,
      lastMonthPurchases: lastMonthVehicles.length,
      monthChange: parseFloat(monthChange),
      totalInvestment,
      avgPurchasePrice,
      pendingDocs,
      statusCounts
    }
  }

  // Get top agents
  const getTopAgents = () => {
    const userVehicles = getUserVehicles()
    const agentMap = new Map()

    userVehicles.forEach(vehicle => {
      const agentName = vehicle.agentName || vehicle.dealerName || 'Unknown'
      if (!agentMap.has(agentName)) {
        agentMap.set(agentName, { name: agentName, count: 0 })
      }
      agentMap.get(agentName).count++
    })

    return Array.from(agentMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Get recent purchases (vehicles added by Purchase Manager, sorted by when they were added)
  const getRecentPurchases = () => {
    const userVehicles = getUserVehicles()
    
    return userVehicles
      .filter(vehicle => getVehicleAddedDate(vehicle) !== null)
      .sort((a, b) => {
        const dateA = getVehicleAddedDate(a)
        const dateB = getVehicleAddedDate(b)
        if (!dateA || !dateB) return 0
        return dateB - dateA // Most recently added first
      })
      .slice(0, 5)
      .map(vehicle => {
        const addedDate = getVehicleAddedDate(vehicle)
        if (!addedDate) return null
        const formattedDate = addedDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
        
        // For display, also show vehicle purchase date if available
        const vehiclePurchaseDate = getVehiclePurchaseDate(vehicle)
        const purchaseDateDisplay = vehiclePurchaseDate 
          ? vehiclePurchaseDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : 'N/A'

        const amount = vehicle.purchasePrice !== undefined
          ? new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            }).format(vehicle.purchasePrice || 0)
          : 'N/A'

        let status = vehicle.status || 'On Modification'
        let badgeClass = 'badge-warning'
        
        if (status === 'In Stock') {
          badgeClass = 'badge-success'
        } else if (status === 'Sold') {
          badgeClass = 'badge-info'
        } else if (status === 'On Modification') {
          badgeClass = 'badge-warning'
        }

        return {
          id: vehicle._id || vehicle.id,
          vehicleNo: formatVehicleNumber(vehicle.vehicleNo || 'N/A'),
          makeModel: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'N/A',
          purchaseDate: formattedDate, // Date when added by Purchase Manager
          vehiclePurchaseDate: purchaseDateDisplay, // Vehicle's actual purchase date
          amount: amount,
          status: status,
          badgeClass: badgeClass,
          agentName: vehicle.agentName || vehicle.dealerName || 'N/A'
        }
      })
      .filter(purchase => purchase !== null) // Remove null entries
  }

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0'
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else {
      return `₹${amount.toLocaleString('en-IN')}`
    }
  }

  const stats = calculateStats()
  const recentPurchases = getRecentPurchases()
  const topAgents = getTopAgents()
  const monthlyData = getMonthlyData()

  // Chart data for monthly trend
  const monthlyTrendData = {
    labels: monthlyData.months,
    datasets: [{
      label: 'Purchases',
      data: monthlyData.data,
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  }

  // Chart data for status distribution
  const statusData = {
    labels: Object.keys(stats.statusCounts).filter(key => stats.statusCounts[key] > 0),
    datasets: [{
      data: Object.values(stats.statusCounts).filter(val => val > 0),
      backgroundColor: [
        '#f39c12',
        '#27ae60',
        '#3498db',
        '#9b59b6',
        '#e67e22'
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }

  const quickActions = [
    { 
      icon: 'fas fa-plus-circle', 
      label: 'Add Vehicle', 
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: () => setActiveSection('add')
    },
    { 
      icon: 'fas fa-warehouse', 
      label: 'View Inventory', 
      gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
      action: () => setActiveSection('inventory')
    },
    { 
      icon: 'fas fa-file-invoice', 
      label: 'Purchase Notes', 
      gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
      action: () => setActiveSection('notes')
    }
  ]

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading overview...</p>
      </div>
    )
  }

  // Get user's vehicles for all insights (only vehicles added by this Purchase Manager)
  const userVehicles = getUserVehicles()

  return (
    <div className="purchase-overview-container">
      {/* Header with vehicle count info */}
      {!isAdmin && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px 16px', 
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          borderRadius: '8px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          fontSize: '14px',
          color: '#2c3e50'
        }}>
          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Showing insights for <strong>{userVehicles.length}</strong> vehicle{userVehicles.length !== 1 ? 's' : ''} you added
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <StatCard
          icon="fas fa-car"
          iconClass="blue"
          title="Total Purchases"
          value={stats.totalPurchases.toString()}
          label="All time"
        />
        <StatCard
          icon="fas fa-calendar-plus"
          iconClass="purple"
          title="This Month"
          value={stats.purchasedThisMonth.toString()}
          label={stats.monthChange !== 0 ? `${stats.monthChange > 0 ? '+' : ''}${stats.monthChange}% vs last month` : 'No change'}
        />
        {isAdmin && (
          <>
            <StatCard
              icon="fas fa-wallet"
              iconClass="green"
              title="Total Investment"
              value={formatCurrency(stats.totalInvestment)}
              label="This month"
            />
            {stats.avgPurchasePrice > 0 && (
              <StatCard
                icon="fas fa-tag"
                iconClass="orange"
                title="Avg Purchase Price"
                value={formatCurrency(stats.avgPurchasePrice)}
                label="This month"
              />
            )}
          </>
        )}
        <StatCard
          icon="fas fa-file-circle-exclamation"
          iconClass="red"
          title="Pending Documents"
          value={stats.pendingDocs.toString()}
          label="Need attention"
        />
        <StatCard
          icon="fas fa-warehouse"
          iconClass="teal"
          title="In Stock"
          value={stats.statusCounts['In Stock'].toString()}
          label="Ready for sale"
        />
      </div>

      {/* Quick Actions - Enhanced Design */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '1px solid #e9ecef'
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#2c3e50', fontWeight: 600 }}>
          <i className="fas fa-bolt" style={{ color: '#667eea', fontSize: '20px' }}></i>
          Quick Actions
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 2 
        }}>
          {quickActions.map((action, idx) => (
            <Box
              key={idx}
              onClick={action.action}
              sx={{
                position: 'relative',
                p: 2.5,
                borderRadius: 2,
                background: action.gradient,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px) scale(1.02)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  '& .action-icon': {
                    transform: 'scale(1.2) rotate(5deg)'
                  },
                  '& .action-shine': {
                    left: '100%'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.5s'
                }
              }}
              className="action-shine"
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 1.5,
                position: 'relative',
                zIndex: 1
              }}>
                <Box 
                  className="action-icon"
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <i className={action.icon} style={{ fontSize: '24px', color: 'white' }}></i>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '15px',
                    textAlign: 'center'
                  }}
                >
                  {action.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Monthly Trend Chart */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#2c3e50', fontWeight: 600 }}>
            <i className="fas fa-chart-line" style={{ color: '#667eea' }}></i>
            Purchase Trend (6 Months)
          </Typography>
          <Box sx={{ height: '250px', position: 'relative' }}>
            <Line 
              data={monthlyTrendData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 8
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </Box>
        </Paper>

        {/* Status Distribution Chart */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#2c3e50', fontWeight: 600 }}>
            <i className="fas fa-chart-pie" style={{ color: '#9b59b6' }}></i>
            Status Distribution
          </Typography>
          <Box sx={{ height: '250px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Object.values(stats.statusCounts).some(val => val > 0) ? (
              <Doughnut 
                data={statusData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 15,
                        font: { size: 12 },
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8
                    }
                  },
                  cutout: '60%'
                }}
              />
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>No data available</Typography>
            )}
          </Box>
        </Paper>
      </div>

      {/* Bottom Grid - Recent Purchases & Top Agents */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '20px' 
      }}>
        {/* Recent Purchases */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#2c3e50', fontWeight: 600 }}>
            <i className="fas fa-clock" style={{ color: '#3498db' }}></i>
            Recent Purchases
          </Typography>
          {recentPurchases.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}></i>
              <Typography variant="body2">No purchases found</Typography>
            </Box>
          ) : (
            <Table sx={{ minWidth: 400 }} aria-label="recent purchases table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Added Date</TableCell>
                  {isAdmin && <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>}
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPurchases.map((purchase, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{purchase.vehicleNo}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>{purchase.makeModel}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{purchase.purchaseDate}</Typography>
                      {purchase.vehiclePurchaseDate !== 'N/A' && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>
                          Purchase: {purchase.vehiclePurchaseDate}
                        </Typography>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{purchase.amount}</Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip 
                        label={purchase.status} 
                        size="small"
                        sx={{
                          bgcolor: purchase.badgeClass === 'badge-success' ? '#27ae60' :
                                   purchase.badgeClass === 'badge-info' ? '#3498db' :
                                   purchase.badgeClass === 'badge-warning' ? '#f39c12' : '#95a5a6',
                          color: 'white',
                          fontSize: '11px',
                          height: 22
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>

        {/* Top Agents */}
        {topAgents.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#2c3e50', fontWeight: 600 }}>
              <i className="fas fa-user-tie" style={{ color: '#9b59b6' }}></i>
              Top Agents
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {topAgents.map((agent, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: idx === 0 ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' : 'transparent',
                    background: idx === 0 ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' : 'transparent',
                    border: idx === 0 ? '2px solid #667eea' : '1px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                      transform: 'translateX(5px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      background: idx === 0 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 700,
                      boxShadow: idx === 0 ? '0 4px 8px rgba(102, 126, 234, 0.3)' : 'none'
                    }}>
                      {idx + 1}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: idx === 0 ? 600 : 400 }}>
                      {agent.name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${agent.count} vehicle(s)`} 
                    size="small"
                    sx={{ 
                      bgcolor: idx === 0 ? '#667eea' : '#667eea20',
                      color: idx === 0 ? 'white' : '#667eea',
                      fontWeight: 600
                    }} 
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </div>
    </div>
  )
}

export default PurchaseOverview
