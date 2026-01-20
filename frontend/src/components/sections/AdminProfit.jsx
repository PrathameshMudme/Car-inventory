import React, { useState, useEffect, useMemo } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Typography,
  Box,
  Divider,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton
} from '@mui/material'
import { 
  Info as InfoIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
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
  const [showFilters, setShowFilters] = useState(false)
  
  // Advanced filter states
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [profitFilter, setProfitFilter] = useState('all')
  const [marginFilter, setMarginFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all')
  const [minSalePrice, setMinSalePrice] = useState('')
  const [maxSalePrice, setMaxSalePrice] = useState('')
  
  const { showToast } = useToast()
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      loadVehicles()
    } else {
      setLoading(false)
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

  // Get unique companies and fuel types for filters
  const uniqueCompanies = useMemo(() => {
    const companies = new Set()
    vehicles.forEach(v => {
      if (v.company && v.status === 'Sold') companies.add(v.company)
    })
    return Array.from(companies).sort()
  }, [vehicles])

  const uniqueFuelTypes = useMemo(() => {
    const fuelTypes = new Set()
    vehicles.forEach(v => {
      if (v.fuelType && v.status === 'Sold') fuelTypes.add(v.fuelType)
    })
    return Array.from(fuelTypes).sort()
  }, [vehicles])

  // Calculate profit data for each vehicle
  const calculateProfitData = () => {
    let filteredVehicles = vehicles.filter(v => v.status === 'Sold' && v.lastPrice)

    // Apply date filter
    if (dateFilter === 'thisMonth') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      filteredVehicles = filteredVehicles.filter(v => {
        if (!v.saleDate) return false
        const saleDate = new Date(v.saleDate)
        return saleDate.getMonth() === currentMonth && 
               saleDate.getFullYear() === currentYear
      })
    } else if (dateFilter === 'last3Months') {
      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      filteredVehicles = filteredVehicles.filter(v => {
        if (!v.saleDate) return false
        return new Date(v.saleDate) >= threeMonthsAgo
      })
    } else if (dateFilter === 'last6Months') {
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      filteredVehicles = filteredVehicles.filter(v => {
        if (!v.saleDate) return false
        return new Date(v.saleDate) >= sixMonthsAgo
      })
    } else if (dateFilter === 'lastYear') {
      const now = new Date()
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      filteredVehicles = filteredVehicles.filter(v => {
        if (!v.saleDate) return false
        return new Date(v.saleDate) >= oneYearAgo
      })
    } else if (dateFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include entire end date
      filteredVehicles = filteredVehicles.filter(v => {
        if (!v.saleDate) return false
        const saleDate = new Date(v.saleDate)
        return saleDate >= start && saleDate <= end
      })
    }

    // Apply company filter
    if (companyFilter !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => v.company === companyFilter)
    }

    // Apply fuel type filter
    if (fuelTypeFilter !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => v.fuelType === fuelTypeFilter)
    }

    // Calculate profit data first
    const profitData = filteredVehicles.map(vehicle => {
      const purchasePrice = parseFloat(vehicle.purchasePrice) || 0
      const modificationCost = parseFloat(vehicle.modificationCost) || 0
      const agentCommission = parseFloat(vehicle.agentCommission) || 0
      const otherCost = parseFloat(vehicle.otherCost) || 0
      const salePrice = parseFloat(vehicle.lastPrice) || 0
      
      // Total payment received (EXCLUDING security cheque)
      const totalPayment = calculateTotalPayment(vehicle)
      
      // Total cost (includes full purchasePrice, even if not fully paid to seller yet)
      // Note: remainingAmountToSeller is already included in purchasePrice, so it's already counted in cost
      const totalCost = purchasePrice + modificationCost + agentCommission + otherCost
      
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
        company: vehicle.company || '',
        model: vehicle.model || '',
        fuelType: vehicle.fuelType || '',
        purchasePrice,
        modificationCost,
        agentCommission,
        otherCost,
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
        pendingFromCustomer, // Pending amount from customer (for icon display logic)
        saleDate: vehicle.saleDate
      }
    })

    // Apply profit-based filters
    let filteredProfitData = profitData

    if (profitFilter === 'profitable') {
      filteredProfitData = filteredProfitData.filter(item => item.netProfit > 0)
    } else if (profitFilter === 'loss') {
      filteredProfitData = filteredProfitData.filter(item => item.netProfit < 0)
    }

    // Apply margin filters
    if (marginFilter === 'high') {
      filteredProfitData = filteredProfitData.filter(item => item.margin > 20)
    } else if (marginFilter === 'low') {
      filteredProfitData = filteredProfitData.filter(item => item.margin < 10 && item.margin >= 0)
    } else if (marginFilter === 'negative') {
      filteredProfitData = filteredProfitData.filter(item => item.margin < 0)
    }

    // Apply sale price range filter
    if (minSalePrice) {
      const min = parseFloat(minSalePrice)
      if (!isNaN(min)) {
        filteredProfitData = filteredProfitData.filter(item => item.salePrice >= min)
      }
    }
    if (maxSalePrice) {
      const max = parseFloat(maxSalePrice)
      if (!isNaN(max)) {
        filteredProfitData = filteredProfitData.filter(item => item.salePrice <= max)
      }
    }

    // Sort by sale date (most recent first)
    return filteredProfitData.sort((a, b) => {
      const dateA = a.saleDate ? new Date(a.saleDate) : new Date(0)
      const dateB = b.saleDate ? new Date(b.saleDate) : new Date(0)
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

  const profitData = calculateProfitData() || []

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

  const clearFilters = () => {
    setDateFilter('all')
    setStartDate('')
    setEndDate('')
    setProfitFilter('all')
    setMarginFilter('all')
    setCompanyFilter('all')
    setFuelTypeFilter('all')
    setMinSalePrice('')
    setMaxSalePrice('')
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (dateFilter !== 'all') count++
    if (profitFilter !== 'all') count++
    if (marginFilter !== 'all') count++
    if (companyFilter !== 'all') count++
    if (fuelTypeFilter !== 'all') count++
    if (minSalePrice || maxSalePrice) count++
    return count
  }

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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.08)'
                }
              }}
            >
              Filters
              {getActiveFiltersCount() > 0 && (
                <Chip
                  label={getActiveFiltersCount()}
                  size="small"
                  sx={{
                    ml: 1,
                    height: '20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                />
              )}
            </Button>
            <button className="btn btn-secondary" onClick={() => handleDownload('pdf')}>
              <i className="fas fa-download"></i> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={() => handleDownload('excel')}>
              <i className="fas fa-file-excel"></i> Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Collapse in={showFilters}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid #e0e0e0'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filter Options
            </Typography>
            {getActiveFiltersCount() > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ color: '#e74c3c' }}
              >
                Clear All
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {/* Date Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={dateFilter}
                label="Time Period"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="thisMonth">This Month</MenuItem>
                <MenuItem value="last3Months">Last 3 Months</MenuItem>
                <MenuItem value="last6Months">Last 6 Months</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}

            {/* Profit Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Profit Status</InputLabel>
              <Select
                value={profitFilter}
                label="Profit Status"
                onChange={(e) => setProfitFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="profitable">Profitable Only</MenuItem>
                <MenuItem value="loss">Loss-Making Only</MenuItem>
              </Select>
            </FormControl>

            {/* Margin Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Margin Range</InputLabel>
              <Select
                value={marginFilter}
                label="Margin Range"
                onChange={(e) => setMarginFilter(e.target.value)}
              >
                <MenuItem value="all">All Margins</MenuItem>
                <MenuItem value="high">High Margin (&gt;20%)</MenuItem>
                <MenuItem value="low">Low Margin (&lt;10%)</MenuItem>
                <MenuItem value="negative">Negative Margin</MenuItem>
              </Select>
            </FormControl>

            {/* Company Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select
                value={companyFilter}
                label="Company"
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <MenuItem value="all">All Companies</MenuItem>
                {uniqueCompanies.map(company => (
                  <MenuItem key={company} value={company}>{company}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Fuel Type Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Fuel Type</InputLabel>
              <Select
                value={fuelTypeFilter}
                label="Fuel Type"
                onChange={(e) => setFuelTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Fuel Types</MenuItem>
                {uniqueFuelTypes.map(fuelType => (
                  <MenuItem key={fuelType} value={fuelType}>{fuelType}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sale Price Range */}
            <TextField
              fullWidth
              size="small"
              label="Min Sale Price (₹)"
              type="number"
              value={minSalePrice}
              onChange={(e) => setMinSalePrice(e.target.value)}
              inputProps={{ min: 0 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Max Sale Price (₹)"
              type="number"
              value={maxSalePrice}
              onChange={(e) => setMaxSalePrice(e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Box>
        </Paper>
      </Collapse>

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
            {getActiveFiltersCount() > 0
              ? 'No vehicles match the selected filters. Try adjusting your filter criteria.'
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
              <TableCell>Other Cost</TableCell>
              <TableCell>Total Cost</TableCell>
              <TableCell>Sale Price</TableCell>
              <TableCell>Payment Received</TableCell>
              <TableCell>Net Profit</TableCell>
              <TableCell align="center">Margin %</TableCell>
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
                <TableCell>{formatPrice(row.otherCost || 0)}</TableCell>
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
                  color: row.margin >= 0 ? '#28a745' : '#dc3545',
                  textAlign: 'center',
                  fontWeight: 600
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
                    {[selectedRow.company, selectedRow.model].filter(Boolean).join(' ')}
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
