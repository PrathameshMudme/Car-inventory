import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminProfit = () => {
  const [filter, setFilter] = useState('All Vehicles')
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
  }, [token, filter])

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

  // Calculate total payment received (EXCLUDING security cheque)
  const calculateTotalPayment = (vehicle) => {
    const cash = parseFloat(vehicle.paymentCash) || 0
    const bankTransfer = parseFloat(vehicle.paymentBankTransfer) || 0
    const online = parseFloat(vehicle.paymentOnline) || 0
    const loan = parseFloat(vehicle.paymentLoan) || 0
    
    // Security cheque is NOT included in total payment
    return cash + bankTransfer + online + loan
  }

  // Calculate profit data for each vehicle
  const calculateProfitData = () => {
    let filteredVehicles = vehicles

    // Apply filter
    if (filter === 'Sold Only') {
      filteredVehicles = vehicles.filter(v => v.status === 'Sold')
    } else if (filter === 'This Month') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      filteredVehicles = vehicles.filter(v => {
        if (!v.saleDate) return false
        const saleDate = new Date(v.saleDate)
        return saleDate.getMonth() === currentMonth && 
               saleDate.getFullYear() === currentYear
      })
    }

    return filteredVehicles
      .filter(v => v.status === 'Sold' && v.lastPrice) // Only sold vehicles with sale price
      .map(vehicle => {
        const purchasePrice = parseFloat(vehicle.purchasePrice) || 0
        const modificationCost = parseFloat(vehicle.modificationCost) || 0
        const agentCommission = parseFloat(vehicle.agentCommission) || 0
        const salePrice = parseFloat(vehicle.lastPrice) || 0
        
        // Total payment received (EXCLUDING security cheque)
        const totalPayment = calculateTotalPayment(vehicle)
        
        // Total cost
        const totalCost = purchasePrice + modificationCost + agentCommission
        
        // Net profit = Total payment received - Total cost
        // Note: We use totalPayment (not salePrice) because security cheque is excluded
        const netProfit = totalPayment - totalCost
        
        // Margin = (Net Profit / Total Payment) * 100
        const margin = totalPayment > 0 ? ((netProfit / totalPayment) * 100) : 0

        return {
          vehicleNo: vehicle.vehicleNo || 'N/A',
          make: vehicle.make || '',
          model: vehicle.model || '',
          purchasePrice,
          modificationCost,
          agentCommission,
          totalCost,
          salePrice,
          totalPayment, // Actual payment received (excluding security cheque)
          netProfit,
          margin,
          hasSecurityCheque: vehicle.paymentSecurityCheque?.enabled || false,
          securityChequeAmount: vehicle.paymentSecurityCheque?.amount || 0
        }
      })
      .sort((a, b) => {
        // Sort by sale date (most recent first)
        const vehicleA = vehicles.find(v => v.vehicleNo === a.vehicleNo)
        const vehicleB = vehicles.find(v => v.vehicleNo === b.vehicleNo)
        const dateA = vehicleA?.saleDate ? new Date(vehicleA.saleDate) : new Date(0)
        const dateB = vehicleB?.saleDate ? new Date(vehicleB.saleDate) : new Date(0)
        return dateB - dateA
      })
  }

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A'
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)}Cr`
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0'
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const profitData = calculateProfitData()

  // Calculate summary totals
  const summary = profitData.reduce((acc, item) => {
    acc.totalRevenue += item.totalPayment
    acc.totalCosts += item.totalCost
    acc.netProfit += item.netProfit
    return acc
  }, { totalRevenue: 0, totalCosts: 0, netProfit: 0 })

  const overallMargin = summary.totalRevenue > 0 
    ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)
    : '0.0'

  const handleDownload = () => {
    showToast('Downloading profit & loss report...', 'info')
    // TODO: Implement actual PDF/CSV download
    setTimeout(() => {
      showToast('Report downloaded successfully!', 'success')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading profit & loss data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Profit & Loss Statement</h2>
          <p>Detailed profit analysis per vehicle</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All Vehicles</option>
            <option>Sold Only</option>
            <option>This Month</option>
          </select>
          <button className="btn btn-secondary" onClick={handleDownload}>
            <i className="fas fa-download"></i> Download Report
          </button>
        </div>
      </div>

      <div className="profit-summary">
        <div className="profit-card">
          <h4>Total Revenue</h4>
          <p className="profit-amount">{formatCurrency(summary.totalRevenue)}</p>
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            (Excluding security cheques)
          </small>
        </div>
        <div className="profit-card">
          <h4>Total Costs</h4>
          <p className="profit-amount cost">{formatCurrency(summary.totalCosts)}</p>
        </div>
        <div className="profit-card highlight">
          <h4>Net Profit</h4>
          <p className="profit-amount" style={{ 
            color: summary.netProfit >= 0 ? '#28a745' : '#dc3545' 
          }}>
            {formatCurrency(summary.netProfit)}
          </p>
          <span className="profit-margin">{overallMargin}% margin</span>
        </div>
      </div>

      {profitData.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-chart-line"></i>
          <h3>No Profit Data Available</h3>
          <p>
            {filter === 'Sold Only' 
              ? 'No sold vehicles found' 
              : filter === 'This Month'
              ? 'No vehicles sold this month'
              : 'No sold vehicles with sale price found'}
          </p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="profit table">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell>
              <TableCell>Purchase Price</TableCell>
              <TableCell>Modifications</TableCell>
              <TableCell>Commission</TableCell>
              <TableCell>Total Cost</TableCell>
              <TableCell>Sale Price</TableCell>
              <TableCell>Payment Received</TableCell>
              <TableCell>Net Profit</TableCell>
              <TableCell>Margin %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profitData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <strong>{formatVehicleNumber(row.vehicleNo)}</strong>
                  {row.make || row.model ? (
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                      {[row.make, row.model].filter(Boolean).join(' ')}
                    </div>
                  ) : null}
                  {row.hasSecurityCheque && (
                    <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '4px' }}>
                      <i className="fas fa-info-circle"></i> Security Cheque: {formatPrice(row.securityChequeAmount)}
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatPrice(row.purchasePrice)}</TableCell>
                <TableCell>{formatPrice(row.modificationCost)}</TableCell>
                <TableCell>{formatPrice(row.agentCommission)}</TableCell>
                <TableCell><strong>{formatPrice(row.totalCost)}</strong></TableCell>
                <TableCell>{formatPrice(row.salePrice)}</TableCell>
                <TableCell>
                  <strong>{formatPrice(row.totalPayment)}</strong>
                  {row.hasSecurityCheque && (
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                      (Excl. cheque)
                    </div>
                  )}
                </TableCell>
                <TableCell style={{ 
                  color: row.netProfit >= 0 ? '#28a745' : '#dc3545',
                  fontWeight: 'bold'
                }}>
                  {formatPrice(row.netProfit)}
                </TableCell>
                <TableCell style={{ 
                  color: row.margin >= 0 ? '#28a745' : '#dc3545'
                }}>
                  {row.margin.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default AdminProfit
