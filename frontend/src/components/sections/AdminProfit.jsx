import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Typography,
  Box,
  Divider
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import { ActionButton } from '../forms'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminProfit = () => {
  const [filter, setFilter] = useState('All Vehicles')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRow, setSelectedRow] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
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

  // Calculate total payment received (EXCLUDING security cheque, INCLUDING settled payments)
  const calculateTotalPayment = (vehicle) => {
    const cash = parseFloat(vehicle.paymentCash) || 0
    const bankTransfer = parseFloat(vehicle.paymentBankTransfer) || 0
    const online = parseFloat(vehicle.paymentOnline) || 0
    const loan = parseFloat(vehicle.paymentLoan) || 0
    
    // Base payment received (excluding security cheque)
    let totalPayment = cash + bankTransfer + online + loan
    
    // Add settled payments from customers (when pending payments were marked as paid)
    // These are payments that were received later and should be included in revenue
    if (vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0) {
      const settledFromCustomer = vehicle.paymentSettlementHistory
        .filter(settlement => settlement.settlementType === 'FROM_CUSTOMER')
        .reduce((sum, settlement) => sum + (parseFloat(settlement.amount) || 0), 0)
      totalPayment += settledFromCustomer
    }
    
    return totalPayment
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
        
        // Total cost (includes full purchasePrice, even if not fully paid to seller yet)
        // Note: remainingAmountToSeller is already included in purchasePrice, so it's already counted in cost
        const totalCost = purchasePrice + modificationCost + agentCommission
        
        // Track pending costs (amounts owed but not yet paid)
        const pendingToSeller = parseFloat(vehicle.remainingAmountToSeller) || 0
        
        // Net profit = Total payment received - Total cost
        // Note: We use totalPayment (not salePrice) because security cheque is excluded
        // Note: Cost includes full purchasePrice (even if remainingAmountToSeller is pending)
        const netProfit = totalPayment - totalCost
        
        // Margin = (Net Profit / Total Payment) * 100
        const margin = totalPayment > 0 ? ((netProfit / totalPayment) * 100) : 0

        // Calculate settled payments for display
        const settledFromCustomer = vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0
          ? vehicle.paymentSettlementHistory
              .filter(s => s.settlementType === 'FROM_CUSTOMER')
              .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
          : 0

        const settledToSeller = vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0
          ? vehicle.paymentSettlementHistory
              .filter(s => s.settlementType === 'TO_SELLER')
              .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
          : 0

        // Check for pending payments from customer
        const pendingFromCustomer = parseFloat(vehicle.remainingAmount) || 0

        return {
          vehicleNo: vehicle.vehicleNo || 'N/A',
          make: vehicle.make || '',
          model: vehicle.model || '',
          purchasePrice,
          modificationCost,
          agentCommission,
          totalCost,
          salePrice,
          totalPayment, // Actual payment received (excluding security cheque, including settled payments from customer)
          netProfit,
          margin,
          hasSecurityCheque: vehicle.paymentSecurityCheque?.enabled || false,
          securityChequeAmount: vehicle.paymentSecurityCheque?.amount || 0,
          settledFromCustomer, // Settled payments from customer (included in revenue)
          pendingToSeller, // Pending amount to seller (already included in cost via purchasePrice)
          settledToSeller, // Settled payments to seller (for display/audit, doesn't change cost)
          pendingFromCustomer // Pending amount from customer (for icon display logic)
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

  const handleDownload = async (format = 'pdf') => {
    if (!token) {
      showToast('Please login to download reports', 'error')
      return
    }

    try {
      showToast('Generating profit & loss report...', 'info')

      // Determine period based on filter
      let periodType = '6months'
      const now = new Date()
      let startDate, endDate

      if (filter === 'This Month') {
        periodType = 'custom'
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      } else if (filter === 'Sold Only') {
        periodType = '6months' // Default to 6 months for sold vehicles
      } else {
        periodType = '6months'
      }

      const params = new URLSearchParams({
        periodType,
        format,
        includeComparison: 'true'
      })

      if (periodType === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString())
        params.append('endDate', endDate.toISOString())
      }

      const response = await fetch(`${API_URL}/reports/profit_loss?${params}`, {
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
      const periodLabel = filter === 'This Month' ? 'this_month' : filter === 'Sold Only' ? 'sold_only' : 'all'
      a.download = `profit_loss_report_${periodLabel}_${Date.now()}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast('Profit & Loss report downloaded successfully!', 'success')
    } catch (error) {
      console.error('Error downloading report:', error)
      showToast(error.message || 'Failed to download report', 'error')
    }
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => handleDownload('pdf')}>
              <i className="fas fa-download"></i> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={() => handleDownload('excel')}>
              <i className="fas fa-file-excel"></i> Download Excel
            </button>
          </div>
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
          <h4 style={{ color: 'white' }}>Net Profit</h4>
          <p className="profit-amount" style={{ 
            color: 'white'
          }}>
            {formatCurrency(summary.netProfit)}
          </p>
          <span className="profit-margin" style={{ color: 'white' }}>{overallMargin}% margin</span>
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
                </TableCell>
                <TableCell>{formatPrice(row.purchasePrice)}</TableCell>
                <TableCell>{formatPrice(row.modificationCost)}</TableCell>
                <TableCell>{formatPrice(row.agentCommission)}</TableCell>
                <TableCell>
                  <strong>{formatPrice(row.totalCost)}</strong>
                </TableCell>
                <TableCell>{formatPrice(row.salePrice)}</TableCell>
                <TableCell>
                  <strong>{formatPrice(row.totalPayment)}</strong>
                </TableCell>
                <TableCell style={{ 
                  color: row.netProfit >= 0 ? '#28a745' : '#dc3545',
                  fontWeight: 'bold'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{formatPrice(row.netProfit)}</span>
                    {/* Only show icon if there are ACTUAL pending payments or active security cheque
                        Historical settlements (settledToSeller/settledFromCustomer) are audit records 
                        and should not trigger the icon display */}
                    {(row.pendingFromCustomer > 0 || row.pendingToSeller > 0 || row.hasSecurityCheque) && (
                      <ActionButton
                        variant="icon"
                        icon={<InfoIcon />}
                        title="View Payment Details"
                        onClick={() => {
                          setSelectedRow(row)
                          setShowDetailsModal(true)
                        }}
                        sx={{ 
                          padding: '0',
                          minWidth: 'auto',
                          width: '18px',
                          height: '18px',
                          marginLeft: '4px',
                          opacity: 0.6,
                          '& svg': { fontSize: '14px', color: 'inherit' },
                          '&:hover': {
                            opacity: 1,
                            '& svg': { color: '#667eea' }
                          }
                        }}
                      />
                    )}
                  </div>
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

      {/* Payment Details Modal */}
      <Dialog 
        open={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6">Payment Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRow && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Vehicle: {formatVehicleNumber(selectedRow.vehicleNo)}
                </Typography>
                {(selectedRow.make || selectedRow.model) && (
                  <Typography variant="body2" color="text.secondary">
                    {[selectedRow.make, selectedRow.model].filter(Boolean).join(' ')}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedRow.pendingToSeller > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800', mb: 0.5 }}>
                      <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                      Pending to Seller
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff9800' }}>
                      {formatPrice(selectedRow.pendingToSeller)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Amount still owed to the seller
                    </Typography>
                  </Box>
                )}
                
                {selectedRow.settledToSeller > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#6c757d', mb: 0.5 }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#28a745' }}></i>
                      Settled to Seller
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#28a745' }}>
                      {formatPrice(selectedRow.settledToSeller)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Amount already paid to the seller
                    </Typography>
                  </Box>
                )}

                {selectedRow.settledFromCustomer > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#28a745', mb: 0.5 }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                      Settled from Customer
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#28a745' }}>
                      {formatPrice(selectedRow.settledFromCustomer)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Additional payment received from customer (included in revenue)
                    </Typography>
                  </Box>
                )}

                {selectedRow.hasSecurityCheque && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800', mb: 0.5 }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                      Security Cheque
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff9800' }}>
                      {formatPrice(selectedRow.securityChequeAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Security cheque amount (excluded from revenue)
                    </Typography>
                  </Box>
                )}

                {selectedRow.pendingToSeller === 0 && 
                 selectedRow.settledToSeller === 0 && 
                 selectedRow.settledFromCustomer === 0 && 
                 !selectedRow.hasSecurityCheque && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No additional payment details available
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AdminProfit
