import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import ChartCard from '../ChartCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SalesOverview = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
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

  // Calculate current month sales
  const getCurrentMonthSales = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const soldThisMonth = vehicles.filter(vehicle => {
      if (vehicle.status !== 'Sold' || !vehicle.updatedAt) return false
      const soldDate = new Date(vehicle.updatedAt)
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

    const soldLastMonth = vehicles.filter(vehicle => {
      if (vehicle.status !== 'Sold' || !vehicle.updatedAt) return false
      const soldDate = new Date(vehicle.updatedAt)
      return soldDate.getMonth() === lastMonth && 
             soldDate.getFullYear() === lastMonthYear
    })

    return soldLastMonth.length
  }

  // Calculate statistics
  const calculateStats = () => {
    const salesCount = getCurrentMonthSales()
    const lastMonthSales = getLastMonthSales()

    // In Stock vehicles
    const inStockCount = vehicles.filter(v => v.status === 'In Stock').length

    // On Modification vehicles
    const onModificationCount = vehicles.filter(v => v.status === 'On Modification').length

    // Available stock (In Stock + Reserved)
    const availableStock = vehicles.filter(v => 
      v.status === 'In Stock' || v.status === 'Reserved'
    ).length

    // Reserved vehicles
    const reservedCount = vehicles.filter(v => v.status === 'Reserved').length

    // Sales trend
    const salesTrend = lastMonthSales > 0
      ? ((salesCount - lastMonthSales) / lastMonthSales * 100).toFixed(1)
      : salesCount > 0 ? 100 : 0

    // Recent sales (last 5)
    const recentSales = vehicles
      .filter(v => v.status === 'Sold' && v.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)

    return {
      salesCount,
      inStockCount,
      onModificationCount,
      availableStock,
      reservedCount,
      salesTrend: parseFloat(salesTrend),
      recentSales
    }
  }

  const stats = calculateStats()

  // Weekly sales data for chart
  const getWeeklySalesData = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1)
    const weeks = []
    
    // Calculate 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(firstDay)
      weekStart.setDate(firstDay.getDate() + (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      const weekSales = vehicles.filter(v => {
        if (v.status !== 'Sold' || !v.updatedAt) return false
        const soldDate = new Date(v.updatedAt)
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
          <h2><i className="fas fa-chart-line"></i> Sales Overview</h2>
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

      {/* Charts and Recent Sales */}
      <div className="chart-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="chart-card">
          <h3><i className="fas fa-chart-bar"></i> Weekly Sales Performance</h3>
          <ChartCard
            title=""
            type="bar"
            data={performanceData}
          />
        </div>
        <div className="chart-card">
          <h3><i className="fas fa-pie-chart"></i> Stock Status</h3>
          <ChartCard
            title=""
            type="doughnut"
            data={{
              labels: ['In Stock', 'Reserved', 'Sold', 'On Modification'],
              datasets: [{
                data: [
                  vehicles.filter(v => v.status === 'In Stock').length,
                  vehicles.filter(v => v.status === 'Reserved').length,
                  vehicles.filter(v => v.status === 'Sold').length,
                  vehicles.filter(v => v.status === 'On Modification').length
                ],
                backgroundColor: ['#667eea', '#f39c12', '#27ae60', '#e74c3c']
              }]
            }}
          />
        </div>
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
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recentSales.map((sale, index) => (
                <TableRow key={index}>
                  <TableCell><strong>{sale.vehicleNo}</strong></TableCell>
                  <TableCell>{`${sale.make} ${sale.model || ''}`.trim()}</TableCell>
                  <TableCell>
                    {sale.updatedAt 
                      ? new Date(sale.updatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </TableCell>
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
