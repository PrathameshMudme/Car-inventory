const express = require('express')
const router = express.Router()
const Vehicle = require('../models/Vehicle')
const Report = require('../models/Report')
const { authenticate, authorize } = require('../middleware/auth')
const ReportService = require('../services/reportService')
const { generateComparisonMatrix } = require('../utils/comparisonMatrix')
const { formatDate } = require('../utils/dateFormatter')

// @route   GET /api/reports/:type
// @desc    Generate and download report
// @access  Private (All authenticated users - role-based filtering)
// @query   periodType - 6months, quarterly, yearly, custom
// @query   startDate - Start date (for custom period)
// @query   endDate - End date (for custom period)
// @query   format - pdf, csv, excel
// @query   includeComparison - true/false (admin only)
router.get('/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params
    const { periodType = '6months', startDate, endDate, format: formatParam = 'pdf', includeComparison = 'true' } = req.query
    
    // Normalize format parameter - handle undefined, null, or string values
    let format = 'pdf'
    if (formatParam !== undefined && formatParam !== null) {
      format = String(formatParam).toLowerCase().trim()
    }
    
    // Validate format - support pdf, csv, and excel
    if (format !== 'pdf' && format !== 'csv' && format !== 'excel') {
      console.warn('Invalid format parameter:', formatParam, 'defaulting to pdf')
      format = 'pdf'
    }
    
    // Map csv to excel for backward compatibility
    if (format === 'csv') {
      format = 'excel'
    }
    
    console.log('Report request - type:', type, 'format:', format, 'formatParam (raw):', formatParam, 'all query params:', JSON.stringify(req.query))

    // Validate report type
    const validTypes = ['sales', 'purchase', 'financial', 'inventory', 'profit_loss', 'expenses']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' })
    }

    // Role-based report type access control
    const userRole = req.user.role
    if (userRole === 'sales') {
      // Sales managers can only access sales reports
      if (type !== 'sales') {
        return res.status(403).json({ message: 'You can only download sales reports' })
      }
    } else if (userRole === 'purchase') {
      // Purchase managers can only access purchase and expenses reports
      if (type !== 'purchase' && type !== 'expenses') {
        return res.status(403).json({ message: 'You can only download purchase and expenses reports' })
      }
    }
    // Admin can access all report types

    // Determine date range
    let periodStart, periodEnd
    const now = new Date()
    
    if (periodType === 'custom' && startDate && endDate) {
      periodStart = new Date(startDate)
      periodEnd = new Date(endDate)
    } else if (periodType === '6months') {
      periodEnd = now
      periodStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    } else if (periodType === 'quarterly') {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const year = now.getFullYear()
      periodStart = new Date(year, currentQuarter * 3, 1)
      periodEnd = new Date(year, (currentQuarter + 1) * 3, 0)
    } else if (periodType === 'yearly') {
      periodStart = new Date(now.getFullYear(), 0, 1)
      periodEnd = new Date(now.getFullYear(), 11, 31)
    } else {
      return res.status(400).json({ message: 'Invalid period type' })
    }

    // Fetch vehicles with role-based filtering
    let vehicleQuery = {}
    
    // Role-based vehicle filtering
    if (userRole === 'sales') {
      // Sales managers can only see vehicles they created
      vehicleQuery.createdBy = req.user._id
    } else if (userRole === 'purchase') {
      // Purchase managers can only see vehicles they created
      vehicleQuery.createdBy = req.user._id
    }
    // Admin can see all vehicles (no filter)
    
    const vehicles = await Vehicle.find(vehicleQuery)
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .populate('paymentSettlementHistory.settledBy', 'name email')

    // Filter vehicles by date range based on report type
    let filteredVehicles = vehicles
    if (type === 'sales' || type === 'financial' || type === 'profit_loss') {
      // For sales reports, filter by saleDate
      filteredVehicles = vehicles.filter(v => {
        if (v.status !== 'Sold' || !v.saleDate) return false
        const saleDate = new Date(v.saleDate)
        return saleDate >= periodStart && saleDate <= periodEnd
      })
    } else if (type === 'purchase' || type === 'expenses') {
      // For purchase reports, filter by createdAt
      filteredVehicles = vehicles.filter(v => {
        if (!v.createdAt) return false
        const createdDate = new Date(v.createdAt)
        return createdDate >= periodStart && createdDate <= periodEnd
      })
    } else if (type === 'inventory') {
      // Inventory report shows current state, no date filtering needed
      filteredVehicles = vehicles
    }

    // Generate comparison matrix if requested (admin only)
    let comparisonData = null
    if (includeComparison === 'true' && userRole === 'admin') {
      comparisonData = generateComparisonMatrix(vehicles, periodType, periodEnd)
    }

    // Generate report
    const reportService = new ReportService()
    const period = {
      startDate: formatDate(periodStart),
      endDate: formatDate(periodEnd)
    }

    let doc, csvData, filename

    console.log('Report generation request:', { type, format, formatParam, periodType, vehicleCount: filteredVehicles.length })

    // Handle Excel format - must check before PDF generation
    if (format === 'excel') {
      console.log('Generating Excel report for type:', type)
      const excelBuffer = reportService.generateExcel(type, filteredVehicles, period)
      filename = `${type}_report_${periodType}_${Date.now()}.xlsx`
      
      console.log('Excel data generated, buffer size:', excelBuffer ? excelBuffer.length : 0)
      
      // Set headers and send Excel response - return immediately to prevent PDF generation
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Cache-Control', 'no-cache')
      
      // Send Excel buffer and return immediately - do not continue to PDF generation
      return res.send(excelBuffer)
    }
    
    // Handle PDF format (default)
    console.log('Generating PDF report for type:', type)
    
    // Generate PDF
    if (type === 'sales') {
      doc = reportService.generateSalesReport(filteredVehicles, period, comparisonData)
    } else if (type === 'financial') {
      doc = reportService.generateFinancialReport(filteredVehicles, period, comparisonData)
    } else if (type === 'profit_loss') {
      doc = reportService.generateProfitLossReport(filteredVehicles, period, comparisonData)
    } else if (type === 'purchase') {
      doc = reportService.generatePurchaseReport(filteredVehicles, period, comparisonData)
    } else if (type === 'inventory') {
      doc = reportService.generateInventoryReport(filteredVehicles, period)
    } else if (type === 'expenses') {
      doc = reportService.generateExpensesReport(filteredVehicles, period, comparisonData)
    } else {
      return res.status(400).json({ message: 'Report type not yet implemented' })
    }

    filename = `${type}_report_${periodType}_${Date.now()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    doc.pipe(res)
    doc.end()
    
    // Save report generation to audit trail (only for PDF, CSV returns early)
    try {
      const report = new Report({
        reportType: type,
        periodType,
        startDate: periodStart,
        endDate: periodEnd,
        generatedBy: req.user._id,
        filename,
        format,
        comparisonData: comparisonData ? {
          periods: comparisonData.periods
        } : undefined,
        metadata: {
          totalRecords: filteredVehicles.length,
          filters: { periodType, startDate: periodStart, endDate: periodEnd },
          summary: {
            totalVehicles: filteredVehicles.length
          }
        }
      })
      await report.save()
    } catch (auditError) {
      console.error('Error saving report audit:', auditError)
      // Don't fail the request if audit save fails
    }
    
    return // PDF response is piped, so we return here

    // This should never be reached, but just in case
    return res.status(400).json({ message: 'Invalid format or report type' })

  } catch (error) {
    console.error('Generate report error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/reports/audit/history
// @desc    Get report generation history
// @access  Private (All authenticated users - role-based filtering)
// @query   periodType - Filter by period type
// @query   reportType - Filter by report type
// @query   limit - Number of records to return
router.get('/audit/history', authenticate, async (req, res) => {
  try {
    const { periodType, reportType, limit = 50 } = req.query
    
    const query = {}
    if (periodType) query.periodType = periodType
    if (reportType) query.reportType = reportType

    // Role-based filtering for report history
    const userRole = req.user.role
    if (userRole === 'sales') {
      // Sales managers can only see their own sales reports
      query.generatedBy = req.user._id
      query.reportType = 'sales'
    } else if (userRole === 'purchase') {
      // Purchase managers can only see their own purchase/expenses reports
      query.generatedBy = req.user._id
      query.reportType = { $in: ['purchase', 'expenses'] }
    }
    // Admin can see all reports (no additional filter)

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit))

    res.json(reports)
  } catch (error) {
    console.error('Get report history error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/reports/comparison/:periodType
// @desc    Get comparison matrix data
// @access  Private (Admin only - comparison data is admin-only feature)
router.get('/comparison/:periodType', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { periodType } = req.params
    const validPeriods = ['6months', 'quarterly', 'yearly']
    
    if (!validPeriods.includes(periodType)) {
      return res.status(400).json({ message: 'Invalid period type. Use: 6months, quarterly, yearly' })
    }

    const vehicles = await Vehicle.find({})
      .populate('paymentSettlementHistory.settledBy', 'name email')

    const comparisonData = generateComparisonMatrix(vehicles, periodType)

    res.json(comparisonData)
  } catch (error) {
    console.error('Get comparison matrix error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router
