import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import ChartCard from '../ChartCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SalesOverview = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [revenueTrendPeriod, setRevenueTrendPeriod] = useState('6') // 3, 6, or 12 months
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (token) {
      loadVehicles()
    }
  }, [token])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Helper: Calculate total payment received for a vehicle
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

  // Helper: Calculate profit for a vehicle
  const calculateProfit = (vehicle) => {
    const totalPayment = calculateTotalPayment(vehicle)
    const purchasePrice = parseFloat(vehicle.purchasePrice) || 0
    const modificationCost = parseFloat(vehicle.modificationCost) || 0
    const agentCommission = parseFloat(vehicle.agentCommission) || 0
    const totalCost = purchasePrice + modificationCost + agentCommission
    return totalPayment - totalCost
  }

  // Get sold vehicles
  const getSoldVehicles = () => {
    return vehicles.filter(v => v.status === 'Sold' && v.saleDate)
  }

  // Calculate current month sales
  const getCurrentMonthSales = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const soldThisMonth = getSoldVehicles().filter(vehicle => {
      const soldDate = new Date(vehicle.saleDate)
      return soldDate.getMonth() === currentMonth && 
             soldDate.getFullYear() === currentYear
    })

    return soldThisMonth.length
  }

  // Calculate last month sales for comparison
  const getLastMonthSales = () => {
    const now = new Date()
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    const soldLastMonth = getSoldVehicles().filter(vehicle => {
      const soldDate = new Date(vehicle.saleDate)
      return soldDate.getMonth() === lastMonth && 
             soldDate.getFullYear() === lastMonthYear
    })

    return soldLastMonth.length
  }

  // Calculate statistics
  const calculateStats = () => {
    const salesCount = getCurrentMonthSales()
    const lastMonthSales = getLastMonthSales()
    const soldVehicles = getSoldVehicles()

    // In Stock vehicles
    const inStockCount = vehicles.filter(v => v.status === 'In Stock').length

    // On Modification vehicles
    const onModificationCount = vehicles.filter(v => v.status === 'On Modification').length

    // Reserved vehicles
    const reservedCount = vehicles.filter(v => v.status === 'Reserved').length

    // Sales trend
    const salesTrend = lastMonthSales > 0
      ? ((salesCount - lastMonthSales) / lastMonthSales * 100).toFixed(1)
      : salesCount > 0 ? 100 : 0

    // Financial metrics
    const totalRevenue = soldVehicles.reduce((sum, v) => sum + calculateTotalPayment(v), 0)
    const totalProfit = soldVehicles.reduce((sum, v) => sum + calculateProfit(v), 0)
    const revenuePerVehicle = soldVehicles.length > 0 ? totalRevenue / soldVehicles.length : 0
    const avgProfitPerSale = soldVehicles.length > 0 ? totalProfit / soldVehicles.length : 0

    // Payment collection rate
    const fullPayments = soldVehicles.filter(v => {
      const totalPayment = calculateTotalPayment(v)
      const salePrice = parseFloat(v.lastPrice) || 0
      return salePrice > 0 && totalPayment >= salePrice * 0.99 // 99% threshold for "full"
    }).length
    const partialPayments = soldVehicles.length - fullPayments
    const paymentCollectionRate = soldVehicles.length > 0 
      ? (fullPayments / soldVehicles.length * 100).toFixed(1) 
      : 0

    // Outstanding receivables
    const outstandingReceivables = soldVehicles.reduce((sum, v) => {
      const totalPayment = calculateTotalPayment(v)
      const salePrice = parseFloat(v.lastPrice) || 0
      const remaining = Math.max(0, salePrice - totalPayment)
      return sum + remaining
    }, 0)

    // Recent sales (last 5)
    const recentSales = soldVehicles
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
      .slice(0, 5)

    return {
      salesCount,
      inStockCount,
      onModificationCount,
      reservedCount,
      salesTrend: parseFloat(salesTrend),
      totalRevenue,
      totalProfit,
      revenuePerVehicle,
      avgProfitPerSale,
      paymentCollectionRate: parseFloat(paymentCollectionRate),
      outstandingReceivables,
      fullPayments,
      partialPayments,
      recentSales
    }
  }

  // Customer source breakdown
  const getCustomerSourceBreakdown = () => {
    const soldVehicles = getSoldVehicles()
    const sources = { agent: 0, walkin: 0, online: 0, other: 0 }
    
    soldVehicles.forEach(v => {
      const source = v.customerSource || 'other'
      if (sources.hasOwnProperty(source)) {
        sources[source]++
      } else {
        sources.other++
      }
    })

    // Sort by value for better visualization
    const sorted = Object.entries(sources)
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1).replace('walkin', 'Walk-in'),
        value
      }))
      .sort((a, b) => b.value - a.value)

    return {
      labels: sorted.map(item => item.label),
      datasets: [{
        label: 'Customers',
        data: sorted.map(item => item.value),
        backgroundColor: ['#667eea', '#f39c12', '#27ae60', '#95a5a6']
      }]
    }
  }

  // Top customer locations
  const getTopCustomerLocations = () => {
    const soldVehicles = getSoldVehicles()
    const locationCounts = {}
    
    soldVehicles.forEach(v => {
      if (v.customerDistrict) {
        const key = `${v.customerTaluka || 'N/A'}, ${v.customerDistrict}`
        locationCounts[key] = (locationCounts[key] || 0) + 1
      }
    })

    const sorted = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      labels: sorted.map(([location]) => location),
      datasets: [{
        label: 'Sales',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#667eea',
        borderRadius: 8
      }]
    }
  }

  // Top selling makes/models
  const getTopSellingMakes = () => {
    const soldVehicles = getSoldVehicles()
    const makeCounts = {}
    
    soldVehicles.forEach(v => {
      const make = v.make || 'Unknown'
      makeCounts[make] = (makeCounts[make] || 0) + 1
    })

    const sorted = Object.entries(makeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      labels: sorted.map(([make]) => make),
      datasets: [{
        label: 'Sales',
        data: sorted.map(([, count]) => count),
        backgroundColor: ['#667eea', '#f39c12', '#27ae60', '#e74c3c', '#9b59b6']
      }]
    }
  }

  // Make performance comparison (revenue by make)
  const getMakePerformanceComparison = () => {
    const soldVehicles = getSoldVehicles()
    const makeRevenue = {}
    
    soldVehicles.forEach(v => {
      const make = v.make || 'Unknown'
      const revenue = calculateTotalPayment(v)
      makeRevenue[make] = (makeRevenue[make] || 0) + revenue
    })

    const sorted = Object.entries(makeRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      labels: sorted.map(([make]) => make),
      datasets: [{
        label: 'Revenue (₹)',
        data: sorted.map(([, revenue]) => revenue),
        backgroundColor: '#27ae60',
        borderRadius: 8
      }]
    }
  }

  // Price range analysis
  const getPriceRangeAnalysis = () => {
    const soldVehicles = getSoldVehicles()
    const ranges = {
      '0-2L': 0,
      '2-5L': 0,
      '5-10L': 0,
      '10-15L': 0,
      '15L+': 0
    }
    
    soldVehicles.forEach(v => {
      const price = calculateTotalPayment(v) / 100000 // Convert to lakhs
      if (price < 2) ranges['0-2L']++
      else if (price < 5) ranges['2-5L']++
      else if (price < 10) ranges['5-10L']++
      else if (price < 15) ranges['10-15L']++
      else ranges['15L+']++
    })

    return {
      labels: Object.keys(ranges),
      datasets: [{
        label: 'Vehicles',
        data: Object.values(ranges),
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6']
      }]
    }
  }

  // Fuel type preference
  const getFuelTypePreference = () => {
    const soldVehicles = getSoldVehicles()
    const fuelCounts = {}
    
    soldVehicles.forEach(v => {
      const fuel = v.fuelType || 'Unknown'
      fuelCounts[fuel] = (fuelCounts[fuel] || 0) + 1
    })

    // Sort by value
    const sorted = Object.entries(fuelCounts)
      .sort((a, b) => b[1] - a[1])

    return {
      labels: sorted.map(([fuel]) => fuel),
      datasets: [{
        label: 'Vehicles',
        data: sorted.map(([, count]) => count),
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6']
      }]
    }
  }

  // Year preference
  const getYearPreference = () => {
    const soldVehicles = getSoldVehicles()
    const yearCounts = {}
    
    soldVehicles.forEach(v => {
      const year = v.vehicleYear || v.year || 'Unknown'
      yearCounts[year] = (yearCounts[year] || 0) + 1
    })

    const sorted = Object.entries(yearCounts)
      .sort((a, b) => {
        if (a[0] === 'Unknown') return 1
        if (b[0] === 'Unknown') return -1
        return parseInt(b[0]) - parseInt(a[0])
      })
      .slice(0, 5)

    return {
      labels: sorted.map(([year]) => year.toString()),
      datasets: [{
        label: 'Sales',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#667eea',
        borderRadius: 8
      }]
    }
  }

  // Revenue trend (3/6/12 months)
  const getRevenueTrend = () => {
    const soldVehicles = getSoldVehicles()
    const months = parseInt(revenueTrendPeriod)
    const now = new Date()
    const labels = []
    const data = []

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      labels.push(monthName)

      const monthRevenue = soldVehicles
        .filter(v => {
          const soldDate = new Date(v.saleDate)
          return soldDate.getMonth() === date.getMonth() && 
                 soldDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, v) => sum + calculateTotalPayment(v), 0)

      data.push(monthRevenue)
    }

    return {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  }

  // Sales heatmap (calendar view - last 30 days)
  const getSalesHeatmap = () => {
    const soldVehicles = getSoldVehicles()
    const now = new Date()
    const heatmapData = {}
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      heatmapData[dateKey] = 0
    }

    // Count sales per day
    soldVehicles.forEach(v => {
      if (v.saleDate) {
        const soldDate = new Date(v.saleDate)
        const dateKey = soldDate.toISOString().split('T')[0]
        if (heatmapData.hasOwnProperty(dateKey)) {
          heatmapData[dateKey]++
        }
      }
    })

    const sortedDates = Object.keys(heatmapData).sort()
    const maxSales = Math.max(...Object.values(heatmapData))

    return {
      labels: sortedDates.map(date => {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets: [{
        label: 'Sales',
        data: sortedDates.map(date => heatmapData[date]),
        backgroundColor: sortedDates.map(date => {
          const sales = heatmapData[date]
          const intensity = maxSales > 0 ? sales / maxSales : 0
          return `rgba(102, 126, 234, ${0.3 + intensity * 0.7})`
        }),
        borderRadius: 4
      }]
    }
  }

  // Revenue funnel (In Stock → Reserved → Sold)
  const getRevenueFunnel = () => {
    const inStock = vehicles.filter(v => v.status === 'In Stock').length
    const reserved = vehicles.filter(v => v.status === 'Reserved').length
    const sold = vehicles.filter(v => v.status === 'Sold').length

    return {
      labels: ['In Stock', 'Reserved', 'Sold'],
      datasets: [{
        data: [inStock, reserved, sold],
        backgroundColor: ['#3498db', '#f39c12', '#27ae60']
      }]
    }
  }

  // Performance radar chart
  const getPerformanceRadar = () => {
    const stats = calculateStats()
    const soldVehicles = getSoldVehicles()
    
    // Calculate various metrics (normalized to 0-100 scale)
    const maxRevenue = Math.max(...soldVehicles.map(v => calculateTotalPayment(v)), 1)
    const avgRevenue = stats.revenuePerVehicle
    const revenueScore = Math.min(100, (avgRevenue / maxRevenue) * 100)

    const maxProfit = Math.max(...soldVehicles.map(v => calculateProfit(v)), 1)
    const avgProfit = stats.avgProfitPerSale
    const profitScore = Math.min(100, (avgProfit / maxProfit) * 100)

    const conversionRate = vehicles.length > 0 ? (soldVehicles.length / vehicles.length) * 100 : 0
    const collectionRate = stats.paymentCollectionRate

    return {
      labels: ['Revenue', 'Profit', 'Conversion', 'Collection', 'Sales Volume'],
      datasets: [{
        label: 'Performance',
        data: [
          revenueScore,
          profitScore,
          Math.min(100, conversionRate * 10), // Scale conversion rate
          collectionRate,
          Math.min(100, (stats.salesCount / 20) * 100) // Scale sales volume (assuming 20 is good)
        ],
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: '#667eea',
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#667eea'
      }]
    }
  }

  // Sales velocity (days to sell)
  const getSalesVelocity = () => {
    const soldVehicles = getSoldVehicles()
    const velocityData = []
    
    soldVehicles.forEach(v => {
      if (v.createdAt && v.saleDate) {
        const createdDate = new Date(v.createdAt)
        const soldDate = new Date(v.saleDate)
        const daysToSell = Math.ceil((soldDate - createdDate) / (1000 * 60 * 60 * 24))
        velocityData.push(daysToSell)
      }
    })

    // Group into ranges
    const ranges = {
      '0-7 days': 0,
      '8-15 days': 0,
      '16-30 days': 0,
      '31-60 days': 0,
      '60+ days': 0
    }

    velocityData.forEach(days => {
      if (days <= 7) ranges['0-7 days']++
      else if (days <= 15) ranges['8-15 days']++
      else if (days <= 30) ranges['16-30 days']++
      else if (days <= 60) ranges['31-60 days']++
      else ranges['60+ days']++
    })

    return {
      labels: Object.keys(ranges),
      datasets: [{
        label: 'Vehicles',
        data: Object.values(ranges),
        backgroundColor: ['#27ae60', '#2ecc71', '#f39c12', '#e67e22', '#e74c3c']
      }]
    }
  }

  const stats = calculateStats()
  const formatPrice = (price) => {
    if (!price || price === 0) return '₹0'
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    } else {
      return `₹${price.toLocaleString('en-IN')}`
    }
  }

  // Weekly sales data for chart
  const getWeeklySalesData = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    const firstDay = new Date(currentYear, currentMonth, 1)
    const weeks = []
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(firstDay)
      weekStart.setDate(firstDay.getDate() + (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      const weekSales = getSoldVehicles().filter(v => {
        if (!v.saleDate) return false
        const soldDate = new Date(v.saleDate)
        return soldDate >= weekStart && soldDate <= weekEnd
      }).length
      
      weeks.push(weekSales)
    }
    
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Sales',
        data: weeks,
        backgroundColor: '#667eea',
        borderRadius: 8
      }]
    }
  }

  const performanceData = getWeeklySalesData()

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Sales Overview</h2>
          <p>Track your sales performance and inventory at a glance</p>
        </div>
        <button className="btn btn-secondary" onClick={loadVehicles} title="Refresh">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <StatCard
          icon="fas fa-handshake"
          iconClass="green"
          title="Sales This Month"
          value={stats.salesCount.toString()}
          label="Vehicles sold"
          trend={stats.salesTrend !== 0 ? {
            direction: stats.salesTrend > 0 ? 'up' : 'down',
            value: `${Math.abs(stats.salesTrend)}%`
          } : null}
        />
        <StatCard
          icon="fas fa-rupee-sign"
          iconClass="green"
          title="Revenue per Vehicle"
          value={formatPrice(stats.revenuePerVehicle)}
          label="Average revenue"
        />
        <StatCard
          icon="fas fa-chart-line"
          iconClass="orange"
          title="Avg Profit per Sale"
          value={formatPrice(stats.avgProfitPerSale)}
          label="Average profit"
        />
        <StatCard
          icon="fas fa-percentage"
          iconClass="blue"
          title="Payment Collection"
          value={`${stats.paymentCollectionRate}%`}
          label={`Full: ${stats.fullPayments} | Partial: ${stats.partialPayments}`}
        />
        <StatCard
          icon="fas fa-wallet"
          iconClass="red"
          title="Outstanding Receivables"
          value={formatPrice(stats.outstandingReceivables)}
          label="Pending from customers"
        />
        <StatCard
          icon="fas fa-car"
          iconClass="blue"
          title="In Stock"
          value={stats.inStockCount.toString()}
          label="Ready to sell"
        />
        <StatCard
          icon="fas fa-tools"
          iconClass="orange"
          title="On Modification"
          value={stats.onModificationCount.toString()}
          label="Under preparation"
        />
        <StatCard
          icon="fas fa-bookmark"
          iconClass="purple"
          title="Reserved Vehicles"
          value={stats.reservedCount.toString()}
          label="Pending confirmation"
        />
      </div>

      {/* Revenue Trend Section */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3><i className="fas fa-chart-line"></i> Revenue Trend</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${revenueTrendPeriod === '3' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRevenueTrendPeriod('3')}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              3M
            </button>
            <button
              className={`btn ${revenueTrendPeriod === '6' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRevenueTrendPeriod('6')}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              6M
            </button>
            <button
              className={`btn ${revenueTrendPeriod === '12' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRevenueTrendPeriod('12')}
              style={{ padding: '5px 15px', fontSize: '14px' }}
            >
              12M
            </button>
          </div>
        </div>
        <ChartCard
          title=""
          type="line"
          data={getRevenueTrend()}
        />
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="chart-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="chart-card">
          <h3><i className="fas fa-chart-bar"></i> Weekly Sales Performance</h3>
          <ChartCard
            title=""
            type="bar"
            data={performanceData}
          />
        </div>
        {/* Customer Source - Card-based visualization */}
        <div className="chart-card">
          <h3><i className="fas fa-users"></i> Customer Source Breakdown</h3>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {(() => {
              const sourceData = getCustomerSourceBreakdown()
              const total = sourceData.datasets[0].data.reduce((a, b) => a + b, 0)
              const icons = { 'Agent': 'fas fa-user-tie', 'Walk-in': 'fas fa-walking', 'Online': 'fas fa-globe', 'Other': 'fas fa-question-circle' }
              const colors = ['#667eea', '#f39c12', '#27ae60', '#95a5a6']
              return sourceData.labels.map((label, index) => {
                const value = sourceData.datasets[0].data[index]
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                return (
                  <div key={index} style={{
                    background: `linear-gradient(135deg, ${colors[index]} 0%, ${colors[index]}dd 100%)`,
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '120px'
                  }}>
                    <i className={icons[label] || 'fas fa-circle'} style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>{value}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>{label}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>{percentage}%</div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="chart-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="chart-card">
          <h3><i className="fas fa-map-marker-alt"></i> Top Customer Locations</h3>
          <ChartCard
            title=""
            type="bar"
            data={getTopCustomerLocations()}
            options={{
              indexAxis: 'y',
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
        <div className="chart-card">
          <h3><i className="fas fa-car"></i> Top Selling Makes</h3>
          <ChartCard
            title=""
            type="bar"
            data={getTopSellingMakes()}
            options={{
              indexAxis: 'y',
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>

      {/* Charts Grid - Row 3 */}
      <div className="chart-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="chart-card">
          <h3><i className="fas fa-chart-bar"></i> Make Performance (Revenue)</h3>
          <ChartCard
            title=""
            type="bar"
            data={getMakePerformanceComparison()}
          />
        </div>
        <div className="chart-card">
          <h3><i className="fas fa-tags"></i> Price Range Analysis</h3>
          <ChartCard
            title=""
            type="bar"
            data={getPriceRangeAnalysis()}
            options={{
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>

      {/* Charts Grid - Row 4 */}
      <div className="chart-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Fuel Type - Progress bar visualization */}
        <div className="chart-card">
          <h3><i className="fas fa-gas-pump"></i> Fuel Type Preference</h3>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(() => {
              const fuelData = getFuelTypePreference()
              const total = fuelData.datasets[0].data.reduce((a, b) => a + b, 0)
              const fuelIcons = { 'Petrol': 'fas fa-gas-pump', 'Diesel': 'fas fa-oil-can', 'CNG': 'fas fa-compress', 'Electric': 'fas fa-bolt', 'Hybrid': 'fas fa-leaf' }
              const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6']
              return fuelData.labels.map((fuel, index) => {
                const value = fuelData.datasets[0].data[index]
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                return (
                  <div key={index} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className={fuelIcons[fuel] || 'fas fa-circle'} style={{ color: colors[index], fontSize: '18px' }}></i>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{fuel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{value}</span>
                        <span style={{ color: '#666', fontSize: '12px' }}>({percentage}%)</span>
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '24px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: colors[index],
                        borderRadius: '12px',
                        transition: 'width 0.5s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px',
                        boxShadow: `0 2px 4px ${colors[index]}40`
                      }}>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
        <div className="chart-card">
          <h3><i className="fas fa-calendar"></i> Year Preference</h3>
          <ChartCard
            title=""
            type="bar"
            data={getYearPreference()}
          />
        </div>
      </div>

      {/* Charts Grid - Row 5 */}
      <div className="chart-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="chart-card">
          <h3><i className="fas fa-funnel-dollar"></i> Sales Pipeline</h3>
          <ChartCard
            title=""
            type="doughnut"
            data={getRevenueFunnel()}
          />
        </div>
        <div className="chart-card">
          <h3><i className="fas fa-tachometer-alt"></i> Sales Velocity</h3>
          <ChartCard
            title=""
            type="bar"
            data={getSalesVelocity()}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>

      {/* Sales Heatmap */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <h3><i className="fas fa-calendar-alt"></i> Sales Heatmap (Last 30 Days)</h3>
        <ChartCard
          title=""
          type="bar"
          data={getSalesHeatmap()}
        />
      </div>

      {/* Performance Radar Chart */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <h3><i className="fas fa-chart-area"></i> Performance Radar</h3>
        <ChartCard
          title=""
          type="radar"
          data={getPerformanceRadar()}
          options={{
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            }
          }}
        />
      </div>

      {/* Recent Sales Table */}
      <div className="recent-purchases">
        <h3><i className="fas fa-clock"></i> Recent Sales</h3>
        {stats.recentSales.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <p>No recent sales found</p>
          </div>
        ) : (
          <Table sx={{ minWidth: 700 }} aria-label="recent sales table">
            <TableHead>
              <TableRow>
                <TableCell>Vehicle No.</TableCell>
                <TableCell>Make/Model</TableCell>
                <TableCell>Sale Date</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recentSales.map((sale, index) => (
                <TableRow key={index}>
                  <TableCell><strong>{formatVehicleNumber(sale.vehicleNo)}</strong></TableCell>
                  <TableCell>{`${sale.make} ${sale.model || ''}`.trim()}</TableCell>
                  <TableCell>
                    {sale.saleDate 
                      ? new Date(sale.saleDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{formatPrice(calculateTotalPayment(sale))}</TableCell>
                  <TableCell>
                    <span className="badge badge-success">Sold</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export default SalesOverview
