import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import ChartCard from '../ChartCard'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminOverview = () => {
  const { token } = useAuth()
  const { setActiveSection } = useApp()
  const { showToast } = useToast()
  const [stats, setStats] = useState({
    totalVehicles: 0,
    inStock: 0,
    sold: 0,
    onModification: 0,
    reserved: 0,
    totalRevenue: 0,
    netProfit: 0,
    profitMargin: 0,
    avgSalePrice: 0,
    thisMonthRevenue: 0,
    thisMonthNetProfit: 0,
    thisMonthExpenses: 0,
    thisMonthInvestment: 0,
    revenueChange: 0,
    totalPendingFromCustomer: 0,
    totalPendingToSeller: 0,
    conversionRate: 0,
    pendingModifications: 0,
    lowStock: 0,
    topMakes: []
  })
  const [topAgents, setTopAgents] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, agentsRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/agents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Check if responses are ok
      if (!vehiclesRes.ok) {
        throw new Error(`Failed to fetch vehicles: ${vehiclesRes.statusText}`)
      }
      if (!agentsRes.ok) {
        throw new Error(`Failed to fetch agents: ${agentsRes.statusText}`)
      }

      const vehiclesData = await vehiclesRes.json()
      const agents = await agentsRes.json()

      // Validate that vehiclesData is an array
      if (!Array.isArray(vehiclesData)) {
        console.error('Vehicles data is not an array:', vehiclesData)
        // If it's an error object, show the message
        if (vehiclesData && vehiclesData.message) {
          throw new Error(vehiclesData.message)
        }
        throw new Error('Invalid vehicles data format received from server')
      }

      // Validate that agents is an array, default to empty array if not
      const agentsArray = Array.isArray(agents) ? agents : []

      setVehicles(vehiclesData)

      // Calculate stats
      const inStock = vehiclesData.filter(v => v.status === 'In Stock').length
      const sold = vehiclesData.filter(v => v.status === 'Sold').length
      const onModification = vehiclesData.filter(v => v.status === 'On Modification').length
      const reserved = vehiclesData.filter(v => v.status === 'Reserved').length
      
      // Calculate financial stats
      const soldVehicles = vehiclesData.filter(v => v.status === 'Sold')
      
      // Calculate total payment received (excluding security cheques, including settled payments)
      const calculateTotalPayment = (vehicle) => {
        const cash = parseFloat(vehicle.paymentCash) || 0
        const bankTransfer = parseFloat(vehicle.paymentBankTransfer) || 0
        const online = parseFloat(vehicle.paymentOnline) || 0
        const loan = parseFloat(vehicle.paymentLoan) || 0
        let totalPayment = cash + bankTransfer + online + loan
        
        // Add settled payments from customers
        if (vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0) {
          const settledFromCustomer = vehicle.paymentSettlementHistory
            .filter(s => s.settlementType === 'FROM_CUSTOMER')
            .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
          totalPayment += settledFromCustomer
        }
        return totalPayment
      }
      
      const totalRevenue = soldVehicles
        .filter(v => v.lastPrice)
        .reduce((sum, v) => sum + calculateTotalPayment(v), 0)
      
      const totalCost = soldVehicles.reduce((sum, v) => 
        sum + (parseFloat(v.purchasePrice) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.otherCost) || 0), 0)
      
      const netProfit = totalRevenue - totalCost
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0
      const avgSalePrice = soldVehicles.length > 0 
        ? soldVehicles.filter(v => v.lastPrice).reduce((sum, v) => sum + calculateTotalPayment(v), 0) / soldVehicles.filter(v => v.lastPrice).length
        : 0

      // Calculate this month revenue and profit
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const thisMonthSold = vehiclesData.filter(v => {
        if (v.status !== 'Sold') return false
        // Use saleDate if available, otherwise fall back to updatedAt (when status was changed to Sold)
        const soldDate = v.saleDate ? new Date(v.saleDate) : (v.updatedAt ? new Date(v.updatedAt) : null)
        if (!soldDate) return false
        return soldDate.getMonth() === currentMonth && soldDate.getFullYear() === currentYear
      })
      
      const lastMonthSold = vehiclesData.filter(v => {
        if (v.status !== 'Sold') return false
        // Use saleDate if available, otherwise fall back to updatedAt (when status was changed to Sold)
        const soldDate = v.saleDate ? new Date(v.saleDate) : (v.updatedAt ? new Date(v.updatedAt) : null)
        if (!soldDate) return false
        return soldDate.getMonth() === lastMonth && soldDate.getFullYear() === lastMonthYear
      })
      
      const thisMonthRevenue = thisMonthSold.reduce((sum, v) => sum + calculateTotalPayment(v), 0)
      const thisMonthCost = thisMonthSold.reduce((sum, v) => 
        sum + (parseFloat(v.purchasePrice) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.agentCommission) || 0), 0)
      const thisMonthNetProfit = thisMonthRevenue - thisMonthCost
      
      const lastMonthRevenue = lastMonthSold.reduce((sum, v) => sum + calculateTotalPayment(v), 0)
      const revenueChange = lastMonthRevenue > 0 
        ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
        : thisMonthRevenue > 0 ? 100 : 0
      
      // Calculate pending payments
      const totalPendingFromCustomer = vehiclesData.reduce((sum, v) => 
        sum + (parseFloat(v.remainingAmount) || 0), 0)
      const totalPendingToSeller = vehiclesData.reduce((sum, v) => 
        sum + (parseFloat(v.remainingAmountToSeller) || 0), 0)
      
      // Calculate expenses this month
      const thisMonthVehicles = vehiclesData.filter(v => {
        if (!v.createdAt) return false
        const createdDate = new Date(v.createdAt)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      })
      
      const thisMonthExpenses = thisMonthVehicles.reduce((sum, v) => 
        sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.otherCost) || 0), 0)
      
      // Calculate total investment this month
      const thisMonthInvestment = thisMonthVehicles.reduce((sum, v) => 
        sum + (parseFloat(v.purchasePrice) || 0), 0)
      
      // Calculate conversion rate
      const conversionRate = vehiclesData.length > 0 
        ? ((sold / vehiclesData.length) * 100).toFixed(1)
        : 0
      
      // Get top selling companies
      const companyCounts = {}
      soldVehicles.forEach(v => {
        const company = v.company || 'Unknown'
        companyCounts[company] = (companyCounts[company] || 0) + 1
      })
      const topMakes = Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([company, count]) => ({ company, count }))

      setStats({
        totalVehicles: vehiclesData.length,
        inStock,
        sold,
        onModification,
        reserved,
        totalRevenue,
        netProfit,
        profitMargin,
        avgSalePrice,
        thisMonthRevenue,
        thisMonthNetProfit,
        thisMonthExpenses,
        thisMonthInvestment,
        revenueChange,
        totalPendingFromCustomer,
        totalPendingToSeller,
        conversionRate,
        pendingModifications: onModification,
        lowStock: inStock < 10 ? inStock : 0,
        topMakes
      })

      // Get top 5 agents
      setTopAgents(agentsArray.slice(0, 5))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      showToast(error.message || 'Failed to load dashboard data', 'error')
      // Set empty arrays to prevent further errors
      setVehicles([])
      setTopAgents([])
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    // Handle undefined, null, or NaN values
    if (price === undefined || price === null || isNaN(price)) {
      return '₹0'
    }
    
    const numPrice = Number(price)
    if (isNaN(numPrice)) {
      return '₹0'
    }
    
    if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(2)}Cr`
    if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(1)}L`
    return `₹${numPrice.toLocaleString('en-IN')}`
  }

  const quickActions = [
    { icon: 'fas fa-exclamation-triangle', label: 'Action Required', color: '#f39c12', action: () => setActiveSection('actionRequired') },
    { icon: 'fas fa-warehouse', label: 'Inventory', color: '#3498db', action: () => setActiveSection('inventory') },
    { icon: 'fas fa-users', label: 'Manage Users', color: '#667eea', action: () => setActiveSection('users') },
    { icon: 'fas fa-user-tie', label: 'View Agents', color: '#9b59b6', action: () => setActiveSection('agents') },
    { icon: 'fas fa-chart-bar', label: 'Reports', color: '#e67e22', action: () => setActiveSection('reports') }
  ]

  // Calculate monthly sales data for last 6 months
  const getMonthlySalesData = () => {
    const months = []
    const salesCounts = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-IN', { month: 'short' })
      months.push(monthName)
      
      const monthSales = vehicles.filter(v => {
        if (v.status !== 'Sold' || !v.updatedAt) return false
        const soldDate = new Date(v.updatedAt)
        return soldDate.getMonth() === date.getMonth() && 
               soldDate.getFullYear() === date.getFullYear()
      }).length
      
      salesCounts.push(monthSales)
    }
    
    return {
      labels: months,
      datasets: [{
        label: 'Sales',
        data: salesCounts,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  }

  const salesData = getMonthlySalesData()

  const statusData = {
    labels: ['In Stock', 'Sold', 'On Modification', 'Reserved'],
    datasets: [{
      data: [
        stats.inStock, 
        stats.sold, 
        stats.onModification, 
        vehicles.filter(v => v.status === 'Reserved').length
      ],
      backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#9b59b6']
    }]
  }

  // Get recent activity from vehicles
  const getRecentActivity = () => {
    const activities = []
    const now = new Date()
    
    // Get recently sold vehicles
    const recentSold = vehicles
      .filter(v => v.status === 'Sold' && v.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3)
      .map(v => ({
        type: 'sold',
        message: `Vehicle ${formatVehicleNumber(v.vehicleNo)} sold`,
        time: v.updatedAt,
        color: '#27ae60'
      }))
    
    // Get recently added vehicles
    const recentAdded = vehicles
      .filter(v => v.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2)
      .map(v => ({
        type: 'added',
        message: `New vehicle ${formatVehicleNumber(v.vehicleNo)} added`,
        time: v.createdAt,
        color: '#3498db'
      }))
    
    // Get recently modified vehicles (status changed to In Stock)
    const recentModified = vehicles
      .filter(v => v.status === 'In Stock' && v.updatedAt && v.modificationComplete)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 2)
      .map(v => ({
        type: 'modified',
        message: `Modification complete for ${formatVehicleNumber(v.vehicleNo)}`,
        time: v.updatedAt,
        color: '#9b59b6'
      }))
    
    // Combine and sort by time
    const allActivities = [...recentSold, ...recentAdded, ...recentModified]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
    
    return allActivities.map(activity => {
      const timeDiff = now - new Date(activity.time)
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
      const daysAgo = Math.floor(hoursAgo / 24)
      
      let timeText = ''
      if (hoursAgo < 1) timeText = 'Just now'
      else if (hoursAgo < 24) timeText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
      else if (daysAgo < 7) timeText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
      else timeText = new Date(activity.time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      
      return { ...activity, timeText }
    })
  }

  const recentActivity = getRecentActivity()

  return (
    <div className="admin-overview-container">
      {/* Stats Grid - 5 cards (first row) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <StatCard
          icon="fas fa-car"
          iconClass="blue"
          title="Total Vehicles"
          value={loading ? '...' : stats.totalVehicles.toString()}
          label="in inventory"
        />
        <StatCard
          icon="fas fa-box-open"
          iconClass="green"
          title="In Stock"
          value={loading ? '...' : stats.inStock.toString()}
          label="ready for sale"
        />
        <StatCard
          icon="fas fa-handshake"
          iconClass="info"
          title="Sold"
          value={loading ? '...' : stats.sold.toString()}
          label="total sales"
        />
        <StatCard
          icon="fas fa-rupee-sign"
          iconClass="green"
          title="Total Revenue"
          value={loading ? '...' : formatPrice(stats.totalRevenue)}
          label="all time"
        />
        <StatCard
          icon="fas fa-chart-line"
          iconClass="orange"
          title="Net Profit"
          value={loading ? '...' : formatPrice(stats.thisMonthNetProfit)}
          label="this month"
        />
      </div>

      {/* Additional Stats Grid - 5 more cards (second row) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <StatCard
          icon="fas fa-bookmark"
          iconClass="purple"
          title="Reserved"
          value={loading ? '...' : stats.reserved.toString()}
          label="booked vehicles"
        />
        <StatCard
          icon="fas fa-tag"
          iconClass="teal"
          title="Avg Sale Price"
          value={loading ? '...' : formatPrice(stats.avgSalePrice)}
          label="per vehicle"
        />
        <StatCard
          icon="fas fa-percentage"
          iconClass="indigo"
          title="Profit Margin"
          value={loading ? '...' : `${stats.profitMargin.toFixed(1)}%`}
          label="overall margin"
        />
        <StatCard
          icon="fas fa-wallet"
          iconClass="red"
          title="Pending Payments"
          value={loading ? '...' : formatPrice(stats.totalPendingFromCustomer + stats.totalPendingToSeller)}
          label={`From: ${formatPrice(stats.totalPendingFromCustomer)} | To: ${formatPrice(stats.totalPendingToSeller)}`}
        />
        <StatCard
          icon="fas fa-chart-pie"
          iconClass="orange"
          title="Conversion Rate"
          value={loading ? '...' : `${stats.conversionRate}%`}
          label="sold vs total"
        />
      </div>

      {/* Main Content - 3 column layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Left Column - Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ChartCard
            title="Monthly Sales Trend"
            type="line"
            data={salesData}
          />
          <ChartCard
            title="Vehicle Status Distribution"
            type="doughnut"
            data={statusData}
          />
        </div>

        {/* Middle Column - Quick Actions & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Financial Summary Card */}
          <div style={{
            background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 16px rgba(39,174,96,0.3)',
            color: 'white'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              opacity: 0.95
            }}>
              <i className="fas fa-chart-line"></i>
              This Month Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Revenue</span>
                <strong>{formatPrice(stats.thisMonthRevenue)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Investment</span>
                <strong>{formatPrice(stats.thisMonthInvestment)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Expenses</span>
                <strong>{formatPrice(stats.thisMonthExpenses)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <span>Net Profit</span>
                <strong style={{ fontSize: '16px' }}>{formatPrice(stats.thisMonthNetProfit)}</strong>
              </div>
              {stats.revenueChange !== 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  paddingTop: '8px', 
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className={`fas fa-arrow-${stats.revenueChange > 0 ? 'up' : 'down'}`}></i>
                  <span>{Math.abs(stats.revenueChange)}% vs last month</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-bolt" style={{ color: '#667eea' }}></i>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: `${action.color}10`,
                    border: `2px solid ${action.color}30`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: action.color
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = action.color
                    e.target.style.color = 'white'
                    e.target.style.transform = 'translateX(5px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `${action.color}10`
                    e.target.style.color = action.color
                    e.target.style.transform = 'translateX(0)'
                  }}
                >
                  <i className={action.icon} style={{ fontSize: '16px' }}></i>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-bell" style={{ color: '#e67e22' }}></i>
              Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.pendingModifications > 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#f39c12' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    <strong>{stats.pendingModifications}</strong> vehicles pending modification
                  </div>
                </div>
              )}
              {stats.lowStock > 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: '#f8d7da',
                  border: '2px solid #f5c2c7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-box" style={{ color: '#e74c3c' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    <strong>Low stock alert:</strong> Only {stats.lowStock} vehicles
                  </div>
                </div>
              )}
              {stats.pendingModifications === 0 && stats.lowStock === 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: '#d1e7dd',
                  border: '2px solid #badbcc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    All systems running smoothly
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
            color: 'white'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              opacity: 0.95
            }}>
              <i className="fas fa-warehouse"></i>
              Inventory Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Available</span>
                <strong>{stats.inStock}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Processing</span>
                <strong>{stats.onModification}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <span>Total Active</span>
                <strong>{stats.inStock + stats.onModification}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Top Agents & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Agents */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-trophy" style={{ color: '#f39c12' }}></i>
              Top Agents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <p style={{ fontSize: '14px', color: '#6c757d' }}>Loading...</p>
              ) : topAgents.length > 0 ? (
                topAgents.map((agent, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#f39c12' : idx === 1 ? '#95a5a6' : idx === 2 ? '#cd7f32' : '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                        {agent.vehicleCount} vehicles
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#27ae60' }}>
                      {formatPrice(agent.totalCommission)}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>No agents data available</p>
              )}
            </div>
          </div>

          {/* Top Selling Makes */}
          {stats.topMakes && stats.topMakes.length > 0 && (
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                marginBottom: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                color: '#2c3e50'
              }}>
                <i className="fas fa-star" style={{ color: '#f39c12' }}></i>
                Top Selling Companies
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.topMakes.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#f39c12' : idx === 1 ? '#95a5a6' : '#cd7f32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '12px',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                        {item.company}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#667eea' }}>
                      {item.count} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            flex: 1
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-history" style={{ color: '#3498db' }}></i>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <p style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>Loading...</p>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${activity.color}`
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                      {activity.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{activity.timeText}</div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
