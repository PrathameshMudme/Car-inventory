import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminExpenses = () => {
  const [timeFilter, setTimeFilter] = useState('This Month')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      loadVehicles()
    } else {
      setLoading(false)
    }
  }, [token, timeFilter])

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

  // Filter vehicles based on time filter
  const getFilteredVehicles = () => {
    const now = new Date()
    let filteredVehicles = vehicles

    if (timeFilter === 'This Month') {
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      filteredVehicles = vehicles.filter(v => {
        const date = v.purchaseDate || v.createdAt
        if (!date) return false
        const vehicleDate = new Date(date)
        return vehicleDate.getMonth() === currentMonth && 
               vehicleDate.getFullYear() === currentYear
      })
    } else if (timeFilter === 'Last Month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      filteredVehicles = vehicles.filter(v => {
        const date = v.purchaseDate || v.createdAt
        if (!date) return false
        const vehicleDate = new Date(date)
        return vehicleDate.getMonth() === lastMonth && 
               vehicleDate.getFullYear() === year
      })
    } else if (timeFilter === 'Last 3 Months') {
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(now.getMonth() - 3)
      filteredVehicles = vehicles.filter(v => {
        const date = v.purchaseDate || v.createdAt
        if (!date) return false
        const vehicleDate = new Date(date)
        return vehicleDate >= threeMonthsAgo
      })
    } else if (timeFilter === 'This Year') {
      const currentYear = now.getFullYear()
      filteredVehicles = vehicles.filter(v => {
        const date = v.purchaseDate || v.createdAt
        if (!date) return false
        const vehicleDate = new Date(date)
        return vehicleDate.getFullYear() === currentYear
      })
    }

    return filteredVehicles
  }

  // Calculate expenses from vehicles
  const calculateExpenses = () => {
    const filteredVehicles = getFilteredVehicles()
    const expenses = []

    filteredVehicles.forEach(vehicle => {
      const date = vehicle.purchaseDate || vehicle.createdAt || vehicle.updatedAt
      const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'N/A'

      // Add agent commission expense
      const agentCommission = parseFloat(vehicle.agentCommission) || 0
      if (agentCommission > 0) {
        expenses.push({
          id: `${vehicle._id}-commission`,
          date: formattedDate,
          vehicle: vehicle.vehicleNo || 'N/A',
          expenseType: 'Commission',
          description: `Agent Commission - ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Agent Commission',
          amount: agentCommission,
          badgeClass: 'badge-purple'
        })
      }

      // Add modification cost expense
      const modificationCost = parseFloat(vehicle.modificationCost) || 0
      if (modificationCost > 0) {
        expenses.push({
          id: `${vehicle._id}-modification`,
          date: formattedDate,
          vehicle: vehicle.vehicleNo || 'N/A',
          expenseType: 'Modification',
          description: vehicle.modificationNotes || 'Vehicle Modification',
          amount: modificationCost,
          badgeClass: 'badge-blue'
        })
      }
    })

    // Sort by date (most recent first)
    return expenses.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB - dateA
    })
  }

  const expenses = calculateExpenses()

  // Calculate summary statistics
  const calculateSummary = () => {
    const filteredVehicles = getFilteredVehicles()
    
    let totalExpenses = 0
    let totalCommission = 0
    let totalModifications = 0

    filteredVehicles.forEach(vehicle => {
      const commission = parseFloat(vehicle.agentCommission) || 0
      const modification = parseFloat(vehicle.modificationCost) || 0
      
      totalCommission += commission
      totalModifications += modification
      totalExpenses += commission + modification
    })

    return {
      totalExpenses,
      totalCommission,
      totalModifications,
      otherExpenses: 0 // Currently no other expenses tracked
    }
  }

  const summary = calculateSummary()

  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0'
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const handleExport = async (format = 'pdf') => {
    if (!token) {
      showToast('Please login to export reports', 'error')
      return
    }

    try {
      showToast('Generating expenses report...', 'info')

      // Determine period based on time filter
      let periodType = '6months'
      const now = new Date()
      let startDate, endDate

      if (timeFilter === 'This Month') {
        periodType = 'custom'
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      } else if (timeFilter === 'Last Month') {
        periodType = 'custom'
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        startDate = new Date(year, lastMonth, 1)
        endDate = new Date(year, lastMonth + 1, 0)
      } else if (timeFilter === 'Last 3 Months') {
        periodType = 'custom'
        endDate = now
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      } else if (timeFilter === 'This Year') {
        periodType = 'yearly'
      }

      const params = new URLSearchParams({
        periodType,
        format,
        includeComparison: 'false'
      })

      if (periodType === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString())
        params.append('endDate', endDate.toISOString())
      }

      const response = await fetch(`${API_URL}/reports/expenses?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentType = response.headers.get('content-type')
      let extension = 'pdf'
      if (contentType && contentType.includes('spreadsheetml')) {
        extension = 'xlsx'
      } else if (contentType && contentType.includes('csv')) {
        extension = 'csv'
      }
      const filterLabel = timeFilter.toLowerCase().replace(/\s+/g, '_')
      a.download = `expenses_report_${filterLabel}_${Date.now()}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast('Expenses report downloaded successfully!', 'success')
    } catch (error) {
      console.error('Error exporting report:', error)
      showToast(error.message || 'Failed to export report', 'error')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading expenses data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Expenses & Commission Report</h2>
          <p>Track all expenses and commissions</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
          <button className="btn btn-secondary" onClick={loadVehicles} title="Refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
              <i className="fas fa-download"></i> Export PDF
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('excel')}>
              <i className="fas fa-file-excel"></i> Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="fas fa-money-bill-wave"
          iconClass="red"
          title="Total Expenses"
          value={formatPrice(summary.totalExpenses)}
          label={timeFilter.toLowerCase()}
        />
        <StatCard
          icon="fas fa-handshake"
          iconClass="purple"
          title="Agent Commission"
          value={formatPrice(summary.totalCommission)}
          label={timeFilter.toLowerCase()}
        />
        <StatCard
          icon="fas fa-tools"
          iconClass="blue"
          title="Modifications"
          value={formatPrice(summary.totalModifications)}
          label={timeFilter.toLowerCase()}
        />
        <StatCard
          icon="fas fa-file-invoice"
          iconClass="orange"
          title="Other Expenses"
          value={formatPrice(summary.otherExpenses)}
          label={timeFilter.toLowerCase()}
        />
      </div>

      <Table sx={{ minWidth: 700 }} aria-label="expenses table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Expense Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" style={{ padding: '40px', color: '#999' }}>
                <i className="fas fa-file-invoice-dollar" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
                <p>No expenses found for {timeFilter.toLowerCase()}</p>
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell><strong>{formatVehicleNumber(expense.vehicle)}</strong></TableCell>
                <TableCell>
                  <span className={`badge ${expense.badgeClass}`}>
                    {expense.expenseType}
                  </span>
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell><strong>{formatPrice(expense.amount)}</strong></TableCell>
                <TableCell align="center">
                  <button className="btn-icon-small" title="View Receipt">
                    <i className="fas fa-file-pdf"></i>
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminExpenses
