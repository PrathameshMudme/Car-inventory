/**
 * Report Generation Service
 * Handles PDF/CSV generation for various report types
 */

const PDFDocument = require('pdfkit')
const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs')
const { formatDate, formatDateTime } = require('../utils/dateFormatter')

class ReportService {
  constructor() {
    this.leftMargin = 50
    this.rightMargin = 50
    this.lineHeight = 18
    this.paragraphSpacing = 20
  }

  /**
   * Draw a table with borders
   * @param {PDFDocument} doc - PDF document
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {Array} columns - Array of {header, width, align} objects
   * @param {Array} rows - Array of row data arrays
   * @param {Object} options - Options {fontSize, headerFontSize, rowHeight, headerBackground}
   * @returns {number} Final Y position after table
   */
  drawTable(doc, startX, startY, columns, rows, options = {}) {
    const fontSize = options.fontSize || 9
    const headerFontSize = options.headerFontSize || 10
    const rowHeight = options.rowHeight || 20
    const headerBackground = options.headerBackground || '#f8f9fa'
    const borderColor = options.borderColor || '#000000'
    const borderWidth = options.borderWidth || 0.5

    let currentY = startY
    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0)

    // Draw header
    doc.save()
    doc.rect(startX, currentY, tableWidth, rowHeight)
      .fillColor(headerBackground)
      .fill()
      .strokeColor(borderColor)
      .lineWidth(borderWidth)
      .stroke()
    
    let currentX = startX
    columns.forEach((col, idx) => {
      // Draw column border
      if (idx > 0) {
        doc.moveTo(currentX, currentY)
          .lineTo(currentX, currentY + rowHeight)
          .stroke()
      }

      // Draw header text
      doc.fontSize(headerFontSize).font('Times-Bold')
        .fillColor('#000000')
      const textY = currentY + (rowHeight / 2) - (headerFontSize / 2)
      const align = col.align || 'left'
      const textX = align === 'right' 
        ? currentX + col.width - 5
        : align === 'center'
        ? currentX + (col.width / 2)
        : currentX + 5

      doc.text(col.header, textX, textY, {
        width: col.width - 10,
        align: align
      })

      currentX += col.width
    })
    doc.restore()
    currentY += rowHeight

    // Draw rows
    rows.forEach((row, rowIdx) => {
      // Check if we need a new page
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage()
        currentY = 50
        // Redraw header on new page
        doc.save()
        doc.rect(startX, currentY, tableWidth, rowHeight)
          .fillColor(headerBackground)
          .fill()
          .strokeColor(borderColor)
          .lineWidth(borderWidth)
          .stroke()
        
        let headerX = startX
        columns.forEach((col, idx) => {
          if (idx > 0) {
            doc.moveTo(headerX, currentY)
              .lineTo(headerX, currentY + rowHeight)
              .stroke()
          }
          doc.fontSize(headerFontSize).font('Times-Bold')
            .fillColor('#000000')
          const textY = currentY + (rowHeight / 2) - (headerFontSize / 2)
          const align = col.align || 'left'
          const textX = align === 'right' 
            ? headerX + col.width - 5
            : align === 'center'
            ? headerX + (col.width / 2)
            : headerX + 5
          doc.text(col.header, textX, textY, {
            width: col.width - 10,
            align: align
          })
          headerX += col.width
        })
        doc.restore()
        currentY += rowHeight
      }

      // Draw row border
      doc.save()
      doc.rect(startX, currentY, tableWidth, rowHeight)
        .strokeColor(borderColor)
        .lineWidth(borderWidth)
        .stroke()
      
      currentX = startX
      row.forEach((cell, cellIdx) => {
        // Draw column border
        if (cellIdx > 0) {
          doc.moveTo(currentX, currentY)
            .lineTo(currentX, currentY + rowHeight)
            .stroke()
        }

        // Draw cell text
        doc.fontSize(fontSize).font('Times-Roman')
          .fillColor('#000000')
        const align = columns[cellIdx].align || 'left'
        const textY = currentY + (rowHeight / 2) - (fontSize / 2)
        const textX = align === 'right' 
          ? currentX + columns[cellIdx].width - 5
          : align === 'center'
          ? currentX + (columns[cellIdx].width / 2)
          : currentX + 5

        doc.text(String(cell || ''), textX, textY, {
          width: columns[cellIdx].width - 10,
          align: align
        })

        currentX += columns[cellIdx].width
      })
      doc.restore()
      currentY += rowHeight
    })

    return currentY
  }

  /**
   * Find logo file
   */
  findLogoPath() {
    const possibleLogoPaths = [
      path.join(__dirname, '..', '..', 'frontend', 'src', 'images', 'logo.png'),
      path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'images', 'logo.png'),
      path.join(__dirname, '..', 'images', 'logo.png'),
      path.join(__dirname, '..', '..', 'images', 'logo.png')
    ]
    
    for (const logoPath of possibleLogoPaths) {
      if (fs.existsSync(logoPath)) {
        return logoPath
      }
    }
    
    return null
  }

  /**
   * Generate Sales Report PDF
   */
  generateSalesReport(vehicles, period, comparisonData = null) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin
    let currentY = 50

    // Add logo
    const logoPath = this.findLogoPath()
    if (logoPath) {
      try {
        const logoWidth = 100
        doc.image(logoPath, this.leftMargin, currentY, { width: logoWidth })
        currentY += 40
      } catch (err) {
        console.log('Error loading logo:', err.message)
      }
    }

    // Title
    doc.fontSize(20).font('Times-Bold')
      .text('SALES REPORT', this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Period
    doc.fontSize(12).font('Times-Roman')
      .text(`Period: ${period.startDate} to ${period.endDate}`, this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 20

    // Summary
    const soldVehicles = vehicles.filter(v => v.status === 'Sold')
    const totalRevenue = soldVehicles.reduce((sum, v) => {
      const cash = parseFloat(v.paymentCash) || 0
      const bank = parseFloat(v.paymentBankTransfer) || 0
      const online = parseFloat(v.paymentOnline) || 0
      const loan = parseFloat(v.paymentLoan) || 0
      let payment = cash + bank + online + loan
      
      if (v.paymentSettlementHistory) {
        const settled = v.paymentSettlementHistory
          .filter(s => s.settlementType === 'FROM_CUSTOMER')
          .reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
        payment += settled
      }
      return sum + payment
    }, 0)

    doc.fontSize(14).font('Times-Bold')
      .text('Summary', this.leftMargin, currentY)
    currentY += 20

    doc.fontSize(11).font('Times-Roman')
      .text(`Total Vehicles Sold: ${soldVehicles.length}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += 30

    // Vehicle details table
    if (soldVehicles.length > 0) {
      doc.fontSize(12).font('Times-Bold')
        .text('Vehicle Details', this.leftMargin, currentY)
      currentY += 20

      doc.fontSize(9).font('Times-Roman')
      soldVehicles.forEach((vehicle, idx) => {
        if (currentY > doc.page.height - 100) {
          doc.addPage()
          currentY = 50
        }

        const saleDate = vehicle.saleDate ? formatDate(vehicle.saleDate) : 'N/A'
        const salePrice = vehicle.lastPrice || 0
        
        doc.text(`${idx + 1}. ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model || ''}`, this.leftMargin, currentY)
        currentY += 15
        doc.text(`   Sale Date: ${saleDate} | Price: ₹${salePrice.toLocaleString('en-IN')}`, this.leftMargin + 10, currentY)
        currentY += 20
      })
    }

    // Comparison matrix if provided
    if (comparisonData && comparisonData.periods.length > 0) {
      currentY += 20
      if (currentY > doc.page.height - 150) {
        doc.addPage()
        currentY = 50
      }

      doc.fontSize(14).font('Times-Bold')
        .text('Comparison Matrix', this.leftMargin, currentY)
      currentY += 25

      doc.fontSize(10).font('Times-Bold')
      doc.text('Period', this.leftMargin, currentY)
      doc.text('Revenue', this.leftMargin + 120, currentY)
      doc.text('Profit', this.leftMargin + 220, currentY)
      doc.text('Margin', this.leftMargin + 300, currentY)
      currentY += 15

      doc.fontSize(9).font('Times-Roman')
      comparisonData.periods.forEach(period => {
        if (currentY > doc.page.height - 50) {
          doc.addPage()
          currentY = 50
        }
        doc.text(period.period, this.leftMargin, currentY)
        doc.text(`₹${(period.metrics.totalRevenue || 0).toLocaleString('en-IN')}`, this.leftMargin + 120, currentY)
        doc.text(`₹${(period.metrics.netProfit || 0).toLocaleString('en-IN')}`, this.leftMargin + 220, currentY)
        doc.text(`${(period.metrics.profitMargin || 0).toFixed(1)}%`, this.leftMargin + 300, currentY)
        currentY += 15
      })
    }

    // Footer
    const footerY = doc.page.height - 40
    doc.fontSize(8).font('Times-Roman')
      .text(`Generated on ${formatDateTime(new Date())}`, this.leftMargin, footerY, { width: contentWidth, align: 'center' })

    return doc
  }

  /**
   * Generate Financial Report PDF
   */
  generateFinancialReport(vehicles, period, comparisonData = null) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin
    let currentY = 50

    // Add logo
    const logoPath = this.findLogoPath()
    if (logoPath) {
      try {
        const logoWidth = 100
        doc.image(logoPath, this.leftMargin, currentY, { width: logoWidth })
        currentY += 40
      } catch (err) {
        console.log('Error loading logo:', err.message)
      }
    }

    // Title
    doc.fontSize(20).font('Times-Bold')
      .text('FINANCIAL REPORT', this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Period
    doc.fontSize(12).font('Times-Roman')
      .text(`Period: ${period.startDate} to ${period.endDate}`, this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Calculate financial metrics
    const soldVehicles = vehicles.filter(v => v.status === 'Sold')
    
    const calculateTotalPayment = (vehicle) => {
      const cash = parseFloat(vehicle.paymentCash) || 0
      const bank = parseFloat(vehicle.paymentBankTransfer) || 0
      const online = parseFloat(vehicle.paymentOnline) || 0
      const loan = parseFloat(vehicle.paymentLoan) || 0
      let payment = cash + bank + online + loan
      
      if (vehicle.paymentSettlementHistory) {
        const settled = vehicle.paymentSettlementHistory
          .filter(s => s.settlementType === 'FROM_CUSTOMER')
          .reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
        payment += settled
      }
      return payment
    }

    const totalRevenue = soldVehicles.reduce((sum, v) => sum + calculateTotalPayment(v), 0)
    const totalCost = soldVehicles.reduce((sum, v) => 
      sum + (parseFloat(v.purchasePrice) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.otherCost) || 0), 0)
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0

    const totalExpenses = vehicles.reduce((sum, v) => 
      sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0), 0)

    // Financial Summary
    doc.fontSize(14).font('Times-Bold')
      .text('Financial Summary', this.leftMargin, currentY)
    currentY += 25

    doc.fontSize(11).font('Times-Roman')
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Cost: ₹${totalCost.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.font('Times-Bold')
      .text(`Net Profit: ₹${netProfit.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Profit Margin: ${profitMargin.toFixed(2)}%`, this.leftMargin, currentY)
    currentY += 30

    // Comparison matrix if provided
    if (comparisonData && comparisonData.periods.length > 0) {
      if (currentY > doc.page.height - 200) {
        doc.addPage()
        currentY = 50
      }

      doc.fontSize(14).font('Times-Bold')
        .text('Period Comparison', this.leftMargin, currentY)
      currentY += 25

      doc.fontSize(10).font('Times-Bold')
      doc.text('Period', this.leftMargin, currentY)
      doc.text('Revenue', this.leftMargin + 100, currentY)
      doc.text('Cost', this.leftMargin + 200, currentY)
      doc.text('Profit', this.leftMargin + 300, currentY)
      doc.text('Margin', this.leftMargin + 380, currentY)
      currentY += 15

      doc.fontSize(9).font('Times-Roman')
      comparisonData.periods.forEach(period => {
        if (currentY > doc.page.height - 50) {
          doc.addPage()
          currentY = 50
        }
        doc.text(period.period, this.leftMargin, currentY)
        doc.text(`₹${(period.metrics.totalRevenue || 0).toLocaleString('en-IN')}`, this.leftMargin + 100, currentY)
        doc.text(`₹${(period.metrics.totalCost || 0).toLocaleString('en-IN')}`, this.leftMargin + 200, currentY)
        doc.text(`₹${(period.metrics.netProfit || 0).toLocaleString('en-IN')}`, this.leftMargin + 300, currentY)
        doc.text(`${(period.metrics.profitMargin || 0).toFixed(1)}%`, this.leftMargin + 380, currentY)
        currentY += 15
      })
    }

    // Footer
    const footerY = doc.page.height - 40
    doc.fontSize(8).font('Times-Roman')
      .text(`Generated on ${formatDateTime(new Date())}`, this.leftMargin, footerY, { width: contentWidth, align: 'center' })

    return doc
  }

  /**
   * Generate Purchase Report PDF
   */
  generatePurchaseReport(vehicles, period, comparisonData = null) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin
    let currentY = 50

    // Add logo
    const logoPath = this.findLogoPath()
    if (logoPath) {
      try {
        const logoWidth = 100
        doc.image(logoPath, this.leftMargin, currentY, { width: logoWidth })
        currentY += 40
      } catch (err) {
        console.log('Error loading logo:', err.message)
      }
    }

    // Title
    doc.fontSize(20).font('Times-Bold')
      .text('PURCHASE REPORT', this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Period
    doc.fontSize(12).font('Times-Roman')
      .text(`Period: ${period.startDate} to ${period.endDate}`, this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Summary
    const totalInvestment = vehicles.reduce((sum, v) => sum + (parseFloat(v.purchasePrice) || 0), 0)
    const totalExpenses = vehicles.reduce((sum, v) => 
      sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0), 0)

    doc.fontSize(14).font('Times-Bold')
      .text('Summary', this.leftMargin, currentY)
    currentY += 25

    doc.fontSize(11).font('Times-Roman')
      .text(`Total Vehicles Purchased: ${vehicles.length}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Investment: ₹${totalInvestment.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += 30

    // Vehicle list
    if (vehicles.length > 0) {
      doc.fontSize(12).font('Times-Bold')
        .text('Purchase Details', this.leftMargin, currentY)
      currentY += 20

      doc.fontSize(9).font('Times-Roman')
      vehicles.slice(0, 50).forEach((vehicle, idx) => { // Limit to 50 for PDF
        if (currentY > doc.page.height - 100) {
          doc.addPage()
          currentY = 50
        }

        const purchaseDate = vehicle.createdAt ? formatDate(vehicle.createdAt) : 'N/A'
        const price = vehicle.purchasePrice || 0
        
        doc.text(`${idx + 1}. ${vehicle.vehicleNo} - ${vehicle.company} ${vehicle.model || ''}`, this.leftMargin, currentY)
        currentY += 15
        doc.text(`   Date: ${purchaseDate} | Price: ₹${price.toLocaleString('en-IN')}`, this.leftMargin + 10, currentY)
        currentY += 20
      })

      if (vehicles.length > 50) {
        doc.text(`... and ${vehicles.length - 50} more vehicles`, this.leftMargin, currentY)
      }
    }

    // Footer
    const footerY = doc.page.height - 40
    doc.fontSize(8).font('Times-Roman')
      .text(`Generated on ${formatDateTime(new Date())}`, this.leftMargin, footerY, { width: contentWidth, align: 'center' })

    return doc
  }

  /**
   * Generate Inventory Report PDF
   */
  generateInventoryReport(vehicles, period) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin
    let currentY = 50

    // Add logo
    const logoPath = this.findLogoPath()
    if (logoPath) {
      try {
        const logoWidth = 100
        doc.image(logoPath, this.leftMargin, currentY, { width: logoWidth })
        currentY += 40
      } catch (err) {
        console.log('Error loading logo:', err.message)
      }
    }

    // Title
    doc.fontSize(20).font('Times-Bold')
      .text('INVENTORY REPORT', this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Period
    doc.fontSize(12).font('Times-Roman')
      .text(`As of ${formatDate(new Date())}`, this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Status breakdown
    const inStock = vehicles.filter(v => v.status === 'In Stock').length
    const onModification = vehicles.filter(v => v.status === 'On Modification').length
    const reserved = vehicles.filter(v => v.status === 'Reserved').length
    const sold = vehicles.filter(v => v.status === 'Sold').length

    doc.fontSize(14).font('Times-Bold')
      .text('Inventory Status', this.leftMargin, currentY)
    currentY += 25

    doc.fontSize(11).font('Times-Roman')
      .text(`In Stock: ${inStock}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`On Modification: ${onModification}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Reserved: ${reserved}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Sold: ${sold}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total: ${vehicles.length}`, this.leftMargin, currentY)
    currentY += 30

    // Valuation
    const totalValuation = vehicles
      .filter(v => v.status !== 'Sold')
      .reduce((sum, v) => sum + (parseFloat(v.askingPrice) || parseFloat(v.purchasePrice) || 0), 0)

    doc.fontSize(14).font('Times-Bold')
      .text('Inventory Valuation', this.leftMargin, currentY)
    currentY += 25

    doc.fontSize(11).font('Times-Roman')
      .text(`Total Inventory Value: ₹${totalValuation.toLocaleString('en-IN')}`, this.leftMargin, currentY)

    // Footer
    const footerY = doc.page.height - 40
    doc.fontSize(8).font('Times-Roman')
      .text(`Generated on ${formatDateTime(new Date())}`, this.leftMargin, footerY, { width: contentWidth, align: 'center' })

    return doc
  }

  /**
   * Generate Profit & Loss Report PDF
   */
  generateProfitLossReport(vehicles, period, comparisonData = null) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin
    let currentY = 50

    // Add logo
    const logoPath = this.findLogoPath()
    if (logoPath) {
      try {
        const logoWidth = 100
        doc.image(logoPath, this.leftMargin, currentY, { width: logoWidth })
        currentY += 40
      } catch (err) {
        console.log('Error loading logo:', err.message)
      }
    }

    // Title
    doc.fontSize(20).font('Times-Bold')
      .text('PROFIT & LOSS REPORT', this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Period
    doc.fontSize(12).font('Times-Roman')
      .text(`Period: ${period.startDate} to ${period.endDate}`, this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Calculate profit data
    const calculateTotalPayment = (vehicle) => {
      const cash = parseFloat(vehicle.paymentCash) || 0
      const bank = parseFloat(vehicle.paymentBankTransfer) || 0
      const online = parseFloat(vehicle.paymentOnline) || 0
      const loan = parseFloat(vehicle.paymentLoan) || 0
      let payment = cash + bank + online + loan
      
      if (vehicle.paymentSettlementHistory) {
        const settled = vehicle.paymentSettlementHistory
          .filter(s => s.settlementType === 'FROM_CUSTOMER')
          .reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
        payment += settled
      }
      return payment
    }

    const soldVehicles = vehicles.filter(v => v.status === 'Sold' && v.lastPrice)
    const totalRevenue = soldVehicles.reduce((sum, v) => sum + calculateTotalPayment(v), 0)
    const totalCost = soldVehicles.reduce((sum, v) => 
      sum + (parseFloat(v.purchasePrice) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.otherCost) || 0), 0)
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0

    // Summary
    doc.fontSize(14).font('Times-Bold')
      .text('Summary', this.leftMargin, currentY)
    currentY += 25

    doc.fontSize(11).font('Times-Roman')
      .text(`Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Cost: ₹${totalCost.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.font('Times-Bold')
      .text(`Net Profit: ₹${netProfit.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Profit Margin: ${profitMargin.toFixed(2)}%`, this.leftMargin, currentY)
    currentY += 30

    // Vehicle details table
    if (soldVehicles.length > 0) {
      doc.fontSize(12).font('Times-Bold')
        .text('Vehicle Details', this.leftMargin, currentY)
      currentY += 25

      const tableColumns = [
        { header: 'Vehicle', width: 80, align: 'left' },
        { header: 'Purchase Price', width: 90, align: 'right' },
        { header: 'Modifications', width: 90, align: 'right' },
        { header: 'Commission', width: 80, align: 'right' },
        { header: 'Other Cost', width: 80, align: 'right' },
        { header: 'Total Cost', width: 85, align: 'right' },
        { header: 'Sale Price', width: 85, align: 'right' },
        { header: 'Payment Received', width: 100, align: 'right' },
        { header: 'Net Profit', width: 85, align: 'right' },
        { header: 'Margin %', width: 70, align: 'right' }
      ]

      const tableRows = soldVehicles.map(vehicle => {
        const payment = calculateTotalPayment(vehicle)
        const purchasePrice = parseFloat(vehicle.purchasePrice) || 0
        const modificationCost = parseFloat(vehicle.modificationCost) || 0
        const commission = parseFloat(vehicle.agentCommission) || 0
        const otherCost = parseFloat(vehicle.otherCost) || 0
        const cost = purchasePrice + modificationCost + commission + otherCost
        const salePrice = parseFloat(vehicle.lastPrice) || 0
        const profit = payment - cost
        const margin = payment > 0 ? ((profit / payment) * 100).toFixed(1) : '0.0'

        return [
          vehicle.vehicleNo || 'N/A',
          `₹${purchasePrice.toLocaleString('en-IN')}`,
          `₹${modificationCost.toLocaleString('en-IN')}`,
          `₹${commission.toLocaleString('en-IN')}`,
          `₹${cost.toLocaleString('en-IN')}`,
          `₹${salePrice.toLocaleString('en-IN')}`,
          `₹${payment.toLocaleString('en-IN')}`,
          `₹${profit.toLocaleString('en-IN')}`,
          `${margin}%`
        ]
      })

      currentY = this.drawTable(doc, this.leftMargin, currentY, tableColumns, tableRows, {
        fontSize: 8,
        headerFontSize: 9,
        rowHeight: 18
      })
      currentY += 10
    }

    // Comparison matrix if provided
    if (comparisonData && comparisonData.periods.length > 0) {
      currentY += 20
      if (currentY > doc.page.height - 150) {
        doc.addPage()
        currentY = 50
      }

      doc.fontSize(14).font('Times-Bold')
        .text('Period Comparison', this.leftMargin, currentY)
      currentY += 25

      doc.fontSize(10).font('Times-Bold')
      doc.text('Period', this.leftMargin, currentY)
      doc.text('Revenue', this.leftMargin + 100, currentY)
      doc.text('Profit', this.leftMargin + 200, currentY)
      doc.text('Margin', this.leftMargin + 300, currentY)
      currentY += 15

      doc.fontSize(9).font('Times-Roman')
      comparisonData.periods.forEach(period => {
        if (currentY > doc.page.height - 50) {
          doc.addPage()
          currentY = 50
        }
        doc.text(period.period, this.leftMargin, currentY)
        doc.text(`₹${(period.metrics.totalRevenue || 0).toLocaleString('en-IN')}`, this.leftMargin + 100, currentY)
        doc.text(`₹${(period.metrics.netProfit || 0).toLocaleString('en-IN')}`, this.leftMargin + 200, currentY)
        doc.text(`${(period.metrics.profitMargin || 0).toFixed(1)}%`, this.leftMargin + 300, currentY)
        currentY += 15
      })
    }

    // Footer
    const footerY = doc.page.height - 40
    doc.fontSize(8).font('Times-Roman')
      .text(`Generated on ${formatDateTime(new Date())}`, this.leftMargin, footerY, { width: contentWidth, align: 'center' })

    return doc
  }

  /**
   * Generate Expenses Report PDF
   */
  generateExpensesReport(vehicles, period, comparisonData = null) {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin
    let currentY = 50

    // Add logo
    const logoPath = this.findLogoPath()
    if (logoPath) {
      try {
        const logoWidth = 100
        doc.image(logoPath, this.leftMargin, currentY, { width: logoWidth })
        currentY += 40
      } catch (err) {
        console.log('Error loading logo:', err.message)
      }
    }

    // Title
    doc.fontSize(20).font('Times-Bold')
      .text('EXPENSES & COMMISSION REPORT', this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Period
    doc.fontSize(12).font('Times-Roman')
      .text(`Period: ${period.startDate} to ${period.endDate}`, this.leftMargin, currentY, { align: 'center', width: contentWidth })
    currentY += 30

    // Summary
    const totalCommission = vehicles.reduce((sum, v) => sum + (parseFloat(v.agentCommission) || 0), 0)
    const totalModifications = vehicles.reduce((sum, v) => sum + (parseFloat(v.modificationCost) || 0), 0)
    const totalOtherCosts = vehicles.reduce((sum, v) => sum + (parseFloat(v.otherCost) || 0), 0)
    const totalExpenses = totalCommission + totalModifications + totalOtherCosts

    doc.fontSize(14).font('Times-Bold')
      .text('Summary', this.leftMargin, currentY)
    currentY += 25

    doc.fontSize(11).font('Times-Roman')
      .text(`Total Agent Commission: ₹${totalCommission.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Modification Costs: ₹${totalModifications.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.text(`Total Other Costs: ₹${totalOtherCosts.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += this.lineHeight
    doc.font('Times-Bold')
      .text(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`, this.leftMargin, currentY)
    currentY += 30

    // Vehicle details table
    if (vehicles.length > 0) {
      doc.fontSize(12).font('Times-Bold')
        .text('Expense Details', this.leftMargin, currentY)
      currentY += 25

      const tableColumns = [
        { header: 'Date', width: 80, align: 'left' },
        { header: 'Vehicle', width: 100, align: 'left' },
        { header: 'Expense Type', width: 100, align: 'left' },
        { header: 'Description', width: 180, align: 'left' },
        { header: 'Amount', width: 100, align: 'right' }
      ]

      // Prepare expense rows
      const expenseRows = []
      vehicles.forEach(vehicle => {
        const date = vehicle.purchaseDate || vehicle.createdAt || vehicle.updatedAt
        const formattedDate = date ? formatDate(date) : 'N/A'
        const commission = parseFloat(vehicle.agentCommission) || 0
        const modification = parseFloat(vehicle.modificationCost) || 0

        if (commission > 0) {
          expenseRows.push([
            formattedDate,
            vehicle.vehicleNo || 'N/A',
            'Commission',
            `Agent Commission - ${vehicle.company || ''} ${vehicle.model || ''}`.trim() || 'Agent Commission',
            `₹${commission.toLocaleString('en-IN')}`
          ])
        }

        if (modification > 0) {
          expenseRows.push([
            formattedDate,
            vehicle.vehicleNo || 'N/A',
            'Modification',
            vehicle.modificationNotes || 'Vehicle Modification',
            `₹${modification.toLocaleString('en-IN')}`
          ])
        }
        if (otherCost > 0) {
          expenseRows.push([
            formattedDate,
            vehicle.vehicleNo || 'N/A',
            'Other Cost',
            vehicle.otherCostNotes || 'Other Expenses',
            `₹${otherCost.toLocaleString('en-IN')}`
          ])
        }
      })

      currentY = this.drawTable(doc, this.leftMargin, currentY, tableColumns, expenseRows, {
        fontSize: 8,
        headerFontSize: 9,
        rowHeight: 18
      })
      currentY += 10
    }

    // Footer
    const footerY = doc.page.height - 40
    doc.fontSize(8).font('Times-Roman')
      .text(`Generated on ${formatDateTime(new Date())}`, this.leftMargin, footerY, { width: contentWidth, align: 'center' })

    return doc
  }

  /**
   * Generate CSV data
   */
  generateCSV(reportType, vehicles, period) {
    let csv = ''
    
    // Helper to calculate total payment (including settled payments)
    const calculateTotalPayment = (vehicle) => {
      const cash = parseFloat(vehicle.paymentCash) || 0
      const bank = parseFloat(vehicle.paymentBankTransfer) || 0
      const online = parseFloat(vehicle.paymentOnline) || 0
      const loan = parseFloat(vehicle.paymentLoan) || 0
      let payment = cash + bank + online + loan
      
      if (vehicle.paymentSettlementHistory) {
        const settled = vehicle.paymentSettlementHistory
          .filter(s => s.settlementType === 'FROM_CUSTOMER')
          .reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
        payment += settled
      }
      return payment
    }
    
    // Helper to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    
    if (reportType === 'sales') {
      csv = 'Vehicle No,Make,Model,Sale Date,Sale Price,Payment Received\n'
      vehicles.filter(v => v.status === 'Sold').forEach(v => {
        const saleDate = v.saleDate ? formatDate(v.saleDate) : 'N/A'
        const payment = calculateTotalPayment(v)
        csv += `${escapeCSV(v.vehicleNo)},${escapeCSV(v.company || '')},${escapeCSV(v.model || '')},${escapeCSV(saleDate)},${v.lastPrice || 0},${payment}\n`
      })
    } else if (reportType === 'purchase') {
      csv = 'Vehicle No,Make,Model,Purchase Date,Purchase Price,Agent Commission,Modification Cost\n'
      vehicles.forEach(v => {
        const purchaseDate = v.createdAt ? formatDate(v.createdAt) : 'N/A'
        csv += `${escapeCSV(v.vehicleNo)},${escapeCSV(v.company || '')},${escapeCSV(v.model || '')},${escapeCSV(purchaseDate)},${v.purchasePrice || 0},${v.agentCommission || 0},${v.modificationCost || 0}\n`
      })
    } else if (reportType === 'financial' || reportType === 'profit_loss') {
      csv = 'Vehicle No,Company,Model,Purchase Price,Modification Cost,Commission,Other Cost,Total Cost,Sale Price,Payment Received,Net Profit,Margin\n'
      vehicles.filter(v => v.status === 'Sold').forEach(v => {
        const payment = calculateTotalPayment(v)
        const purchasePrice = parseFloat(v.purchasePrice) || 0
        const modificationCost = parseFloat(v.modificationCost) || 0
        const commission = parseFloat(v.agentCommission) || 0
        const otherCost = parseFloat(v.otherCost) || 0
        const cost = purchasePrice + modificationCost + commission + otherCost
        const profit = payment - cost
        const margin = payment > 0 ? ((profit / payment) * 100).toFixed(2) : '0.00'
        csv += `${escapeCSV(v.vehicleNo)},${escapeCSV(v.make || '')},${escapeCSV(v.model || '')},${purchasePrice},${modificationCost},${commission},${otherCost},${cost},${v.lastPrice || 0},${payment},${profit},${margin}%\n`
      })
    } else if (reportType === 'expenses') {
      csv = 'Date,Vehicle No,Company,Model,Expense Type,Description,Amount\n'
      vehicles.forEach(v => {
        const date = v.purchaseDate || v.createdAt || v.updatedAt
        const formattedDate = date ? formatDate(date) : 'N/A'
        const commission = parseFloat(v.agentCommission) || 0
        const modification = parseFloat(v.modificationCost) || 0

        if (commission > 0) {
          csv += `${escapeCSV(formattedDate)},${escapeCSV(v.vehicleNo || 'N/A')},${escapeCSV(v.make || '')},${escapeCSV(v.model || '')},Commission,${escapeCSV(`Agent Commission - ${v.make || ''} ${v.model || ''}`.trim() || 'Agent Commission')},${commission}\n`
        }

        if (modification > 0) {
          csv += `${escapeCSV(formattedDate)},${escapeCSV(v.vehicleNo || 'N/A')},${escapeCSV(v.company || '')},${escapeCSV(v.model || '')},Modification,${escapeCSV(v.modificationNotes || 'Vehicle Modification')},${modification}\n`
        }
      })
    }
    
    // Ensure we always return a string, even if empty
    return csv || 'No data available\n'
  }

  /**
   * Generate Excel file buffer
   */
  generateExcel(reportType, vehicles, period) {
    // Helper to calculate total payment (including settled payments)
    const calculateTotalPayment = (vehicle) => {
      const cash = parseFloat(vehicle.paymentCash) || 0
      const bank = parseFloat(vehicle.paymentBankTransfer) || 0
      const online = parseFloat(vehicle.paymentOnline) || 0
      const loan = parseFloat(vehicle.paymentLoan) || 0
      let payment = cash + bank + online + loan
      
      if (vehicle.paymentSettlementHistory) {
        const settled = vehicle.paymentSettlementHistory
          .filter(s => s.settlementType === 'FROM_CUSTOMER')
          .reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
        payment += settled
      }
      return payment
    }

    let worksheetData = []

    if (reportType === 'sales') {
      // Headers
      worksheetData.push(['Vehicle No', 'Make', 'Model', 'Sale Date', 'Sale Price', 'Payment Received'])
      
      // Data rows
      vehicles.filter(v => v.status === 'Sold').forEach(v => {
        const saleDate = v.saleDate ? formatDate(v.saleDate) : 'N/A'
        const payment = calculateTotalPayment(v)
        worksheetData.push([
          v.vehicleNo || '',
          v.company || '',
          v.model || '',
          saleDate,
          v.lastPrice || 0,
          payment
        ])
      })
    } else if (reportType === 'purchase') {
      worksheetData.push(['Vehicle No', 'Make', 'Model', 'Purchase Date', 'Purchase Price', 'Agent Commission', 'Modification Cost'])
      
      vehicles.forEach(v => {
        const purchaseDate = v.createdAt ? formatDate(v.createdAt) : 'N/A'
        worksheetData.push([
          v.vehicleNo || '',
          v.company || '',
          v.model || '',
          purchaseDate,
          v.purchasePrice || 0,
          v.agentCommission || 0,
          v.modificationCost || 0
        ])
      })
    } else if (reportType === 'financial' || reportType === 'profit_loss') {
      worksheetData.push(['Vehicle No', 'Company', 'Model', 'Purchase Price', 'Modification Cost', 'Commission', 'Other Cost', 'Total Cost', 'Sale Price', 'Payment Received', 'Net Profit', 'Margin %'])
      
      vehicles.filter(v => v.status === 'Sold').forEach(v => {
        const payment = calculateTotalPayment(v)
        const purchasePrice = parseFloat(v.purchasePrice) || 0
        const modificationCost = parseFloat(v.modificationCost) || 0
        const commission = parseFloat(v.agentCommission) || 0
        const otherCost = parseFloat(v.otherCost) || 0
        const cost = purchasePrice + modificationCost + commission + otherCost
        const profit = payment - cost
        const margin = payment > 0 ? ((profit / payment) * 100).toFixed(2) : '0.00'
        
        worksheetData.push([
          v.vehicleNo || '',
          v.company || '',
          v.model || '',
          purchasePrice,
          modificationCost,
          commission,
          otherCost,
          cost,
          v.lastPrice || 0,
          payment,
          profit,
          `${margin}%`
        ])
      })
    } else if (reportType === 'expenses') {
      worksheetData.push(['Date', 'Vehicle No', 'Company', 'Model', 'Expense Type', 'Description', 'Amount'])
      
      vehicles.forEach(v => {
        const date = v.purchaseDate || v.createdAt || v.updatedAt
        const formattedDate = date ? formatDate(date) : 'N/A'
        const commission = parseFloat(v.agentCommission) || 0
        const modification = parseFloat(v.modificationCost) || 0

        if (commission > 0) {
          worksheetData.push([
            formattedDate,
            v.vehicleNo || 'N/A',
            v.make || '',
            v.model || '',
            'Commission',
            `Agent Commission - ${v.company || ''} ${v.model || ''}`.trim() || 'Agent Commission',
            commission
          ])
        }

        if (modification > 0) {
          worksheetData.push([
            formattedDate,
            v.vehicleNo || 'N/A',
            v.make || '',
            v.model || '',
            'Modification',
            v.modificationNotes || 'Vehicle Modification',
            modification
          ])
        }
      })
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const maxWidths = worksheetData[0] ? worksheetData[0].map((_, colIndex) => {
      return Math.max(
        ...worksheetData.map(row => {
          const cellValue = row[colIndex]
          return cellValue ? String(cellValue).length : 10
        })
      )
    }) : []

    worksheet['!cols'] = maxWidths.map(width => ({ wch: Math.min(Math.max(width, 10), 50) }))

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    return excelBuffer
  }
}

module.exports = ReportService
