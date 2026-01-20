import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material'
import {
  BarChart as BarChartIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Warehouse as WarehouseIcon,
  Download as DownloadIcon,
  History as HistoryIcon
} from '@mui/icons-material'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminReports = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [includeComparison, setIncludeComparison] = useState(true)
  const [comparisonData, setComparisonData] = useState(null)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [generating, setGenerating] = useState({})
  const [reportHistory, setReportHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const reports = [
    {
      id: 1,
      type: 'sales',
      name: 'Sales Report',
      description: 'Monthly sales performance and trends',
      icon: 'fas fa-chart-bar',
      iconClass: 'blue'
    },
    {
      id: 2,
      type: 'purchase',
      name: 'Purchase Report',
      description: 'Vehicle purchase history and costs',
      icon: 'fas fa-shopping-cart',
      iconClass: 'green'
    },
    {
      id: 3,
      type: 'financial',
      name: 'Financial Report',
      description: 'Comprehensive financial statements',
      icon: 'fas fa-money-bill-wave',
      iconClass: 'purple'
    },
    {
      id: 4,
      type: 'inventory',
      name: 'Inventory Report',
      description: 'Current stock and valuation',
      icon: 'fas fa-warehouse',
      iconClass: 'orange'
    }
  ]

  useEffect(() => {
    if (token && includeComparison) {
      loadComparisonData()
    }
  }, [selectedPeriod, token, includeComparison])

  const loadReportHistory = async () => {
    if (!token) return
    
    setLoadingHistory(true)
    try {
      const response = await fetch(`${API_URL}/reports/audit/history?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load report history')
      }

      const data = await response.json()
      setReportHistory(data)
    } catch (error) {
      console.error('Error loading report history:', error)
      showToast('Failed to load report history', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadComparisonData = async () => {
    setLoadingComparison(true)
    try {
      const response = await fetch(`${API_URL}/reports/comparison/${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load comparison data')
      }

      const data = await response.json()
      setComparisonData(data)
    } catch (error) {
      console.error('Error loading comparison data:', error)
      showToast('Failed to load comparison data', 'error')
    } finally {
      setLoadingComparison(false)
    }
  }

  const handleGenerate = async (reportType, reportName) => {
    if (!token) {
      showToast('Please login to generate reports', 'error')
      return
    }

    setGenerating(prev => ({ ...prev, [reportType]: true }))
    showToast(`Generating ${reportName}...`, 'info')

    try {
      const params = new URLSearchParams({
        periodType: selectedPeriod,
        format: selectedFormat,
        includeComparison: includeComparison.toString()
      })

      const response = await fetch(`${API_URL}/reports/${reportType}?${params}`, {
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
      const extension = contentType === 'text/csv' ? 'csv' : 'pdf'
      a.download = `${reportType}_report_${selectedPeriod}_${Date.now()}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast(`${reportName} generated and downloaded successfully!`, 'success')
      
      // Reload history after generating
      if (showHistory) {
        loadReportHistory()
      }
    } catch (error) {
      console.error('Error generating report:', error)
      showToast(error.message || 'Failed to generate report', 'error')
    } finally {
      setGenerating(prev => ({ ...prev, [reportType]: false }))
    }
  }

  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0'
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)}Cr`
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Generate comprehensive business reports with comparison matrices</p>
        </div>
      </div>

      {/* Report Options */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className="fas fa-cog" style={{ color: '#667eea' }}></i>
          Report Options
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                label="Period"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={selectedFormat}
                label="Format"
                onChange={(e) => setSelectedFormat(e.target.value)}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Include Comparison</InputLabel>
              <Select
                value={includeComparison.toString()}
                label="Include Comparison"
                onChange={(e) => setIncludeComparison(e.target.value === 'true')}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Comparison Matrix */}
      {includeComparison && comparisonData && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="fas fa-chart-line" style={{ color: '#667eea' }}></i>
            Comparison Matrix ({selectedPeriod === '6months' ? '6 Months' : selectedPeriod === 'quarterly' ? 'Quarterly' : 'Yearly'})
          </Typography>
          {loadingComparison ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="right">Sold</TableCell>
                    <TableCell align="right">Purchased</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonData.periods.map((period, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Chip 
                          label={period.period} 
                          size="small" 
                          color={idx === comparisonData.periods.length - 1 ? 'primary' : 'default'}
                          sx={{ fontSize: '14px', fontWeight: '600', height: '28px' }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatPrice(period.metrics.totalRevenue)}</TableCell>
                      <TableCell align="right">{formatPrice(period.metrics.totalCost)}</TableCell>
                      <TableCell align="right">
                        <span style={{ 
                          color: period.metrics.netProfit >= 0 ? '#27ae60' : '#e74c3c',
                          fontWeight: '600',
                          fontSize: '15px'
                        }}>
                          {formatPrice(period.metrics.netProfit)}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span style={{ 
                          color: period.metrics.profitMargin >= 0 ? '#27ae60' : '#e74c3c',
                          fontWeight: '600',
                          fontSize: '15px'
                        }}>
                          {period.metrics.profitMargin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell align="right">{period.metrics.vehiclesSold}</TableCell>
                      <TableCell align="right">{period.metrics.vehiclesPurchased}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </Paper>
      )}

      {/* Report Cards */}
      <div className="reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className={`report-icon ${report.iconClass}`}>
              <i className={report.icon}></i>
            </div>
            <h3>{report.name}</h3>
            <p>{report.description}</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleGenerate(report.type, report.name)}
              disabled={generating[report.type]}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                justifyContent: 'center',
                minWidth: '120px'
              }}
            >
              {generating[report.type] ? (
                <>
                  <CircularProgress size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <DownloadIcon sx={{ fontSize: 16 }} />
                  Generate {selectedFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Report History */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#667eea' }} />
            Report Generation History
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory && reportHistory.length === 0) {
                loadReportHistory()
              }
            }}
            startIcon={<i className="fas fa-history"></i>}
          >
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
        </Box>

        {showHistory && (
          <>
            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : reportHistory.length > 0 ? (
              <Table sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Type</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Date Range</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Generated By</TableCell>
                      <TableCell>Generated At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportHistory.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>
                          <Chip 
                            label={report.reportType.toUpperCase()} 
                            size="small" 
                            color="primary"
                            sx={{ fontSize: '14px', fontWeight: '600', height: '28px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={report.periodType === '6months' ? '6 Months' : 
                                   report.periodType === 'quarterly' ? 'Quarterly' : 
                                   report.periodType === 'yearly' ? 'Yearly' : 'Custom'} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '14px', fontWeight: '600', height: '28px' }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(report.startDate)} - {formatDate(report.endDate)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={report.format.toUpperCase()} 
                            size="small" 
                            sx={{ fontSize: '14px', fontWeight: '600', height: '28px' }}
                          />
                        </TableCell>
                        <TableCell>
                          {report.generatedBy?.name || report.generatedBy?.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(report.generatedAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                No report history available
              </Typography>
            )}
          </>
        )}
      </Paper>
    </div>
  )
}

export default AdminReports
