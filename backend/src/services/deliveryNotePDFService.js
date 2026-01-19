/**
 * Service for generating Delivery Note PDFs
 * TODO: Implement actual delivery note template
 */

const PDFDocument = require('pdfkit')

class DeliveryNotePDFService {
  constructor() {
    this.leftMargin = 50
    this.rightMargin = 50
    this.topMargin = 50
    this.lineHeight = 20
  }

  /**
   * Generate delivery note PDF
   * @param {Object} vehicle - Vehicle document with populated fields
   * @returns {PDFDocument} PDF document stream
   */
  generatePDF(vehicle) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.topMargin,
        bottom: 50,
        left: this.leftMargin,
        right: this.rightMargin
      }
    })

    // TODO: Implement actual delivery note template
    // For now, create a placeholder PDF
    
    doc.fontSize(20).font('Times-Bold')
      .text('DELIVERY NOTE', this.leftMargin, this.topMargin, { align: 'center' })
    
    doc.moveDown(2)
    
    doc.fontSize(12).font('Times-Roman')
      .text(`Vehicle Number: ${vehicle.vehicleNo || 'N/A'}`, this.leftMargin)
      .text(`Make/Model: ${vehicle.make || 'N/A'} ${vehicle.model || ''}`, this.leftMargin)
      .text(`Customer Name: ${vehicle.customerName || 'N/A'}`, this.leftMargin)
      .text(`Sale Date: ${vehicle.saleDate ? new Date(vehicle.saleDate).toLocaleDateString('en-IN') : 'N/A'}`, this.leftMargin)
    
    doc.moveDown(2)
    
    doc.fontSize(10).font('Times-Italic')
      .text('Note: This is a placeholder delivery note. The actual template will be implemented later.', this.leftMargin, { align: 'center' })

    return doc
  }
}

module.exports = DeliveryNotePDFService
