/**
 * Service for generating purchase note PDF documents
 */

const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')
const { mapVehicleToPurchaseNoteData } = require('../utils/vehicleDataMapper')

/**
 * Purchase Note PDF Generator Service
 */
class PurchaseNotePDFService {
  constructor() {
    this.leftMargin = 50
    this.rightMargin = 50
    this.lineHeight = 18
    this.paragraphSpacing = 20
    this.logoHeight = 150
  }

  /**
   * Find logo file in common locations
   * @returns {string|null} Path to logo file or null if not found
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
   * Add logo to PDF document
   * @param {PDFDocument} doc - PDF document instance
   * @returns {number} Height of logo (0 if not loaded)
   */
  addLogo(doc) {
    const logoPath = this.findLogoPath()
    if (!logoPath) {
      return 0
    }

    try {
      const logoWidth = doc.page.width - this.leftMargin - this.rightMargin
      doc.image(logoPath, this.leftMargin, 0, { 
        width: logoWidth, 
        fit: [logoWidth, this.logoHeight] 
      })
      return this.logoHeight
    } catch (err) {
      console.log('Error loading logo:', err.message)
      return 0
    }
  }

  /**
   * Generate purchase note PDF
   * @param {Object} vehicle - Vehicle document
   * @param {Object} options - Generation options
   * @returns {PDFDocument} PDF document stream
   */
  generatePDF(vehicle, options = {}) {
    const data = mapVehicleToPurchaseNoteData(vehicle)
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 0, bottom: 50, left: this.leftMargin, right: this.rightMargin }
    })

    // Add logo
    const logoHeight = this.addLogo(doc)
    let currentY = logoHeight > 0 ? logoHeight + 5 : 30
    const contentWidth = doc.page.width - this.leftMargin - this.rightMargin

    // Generate page 1
    currentY = this.generatePage1(doc, data, currentY, contentWidth)

    // Generate page 2
    doc.addPage()
    this.generatePage2(doc, data, contentWidth)

    return doc
  }

  /**
   * Generate page 1 of purchase note
   * @param {PDFDocument} doc - PDF document
   * @param {Object} data - Template data
   * @param {number} startY - Starting Y position
   * @param {number} contentWidth - Content width
   * @returns {number} Final Y position
   */
  generatePage1(doc, data, startY, contentWidth) {
    let currentY = startY

    doc.fontSize(12).font('Times-Roman')
    
    // Opening statement
    doc.text('I/we hereby,', this.leftMargin, currentY, { width: contentWidth })
    currentY += this.lineHeight + 5

    // Company information section
    currentY = this.addCompanyInfo(doc, data, currentY, contentWidth)
    
    // Purchase statement paragraphs
    currentY = this.addPurchaseStatements(doc, data, currentY, contentWidth)
    
    // Vehicle details section
    currentY = this.addVehicleDetails(doc, data, currentY, contentWidth)
    
    // Page number
    currentY += this.paragraphSpacing
    doc.fontSize(10).font('Times-Roman')
      .text('1 | OF 2 Page', this.leftMargin + contentWidth - 100, currentY, { 
        width: 100, 
        align: 'right' 
      })

    return currentY
  }

  /**
   * Add company information section
   */
  addCompanyInfo(doc, data, currentY, contentWidth) {
    doc.fontSize(12).font('Times-Roman')
    
    doc.text('Mr./Mrs.', this.leftMargin, currentY)
    doc.font('Times-Bold').text(data.companyName + '.', this.leftMargin + 55, currentY, { 
      width: contentWidth - 55 
    })
    
    currentY += this.lineHeight
    doc.font('Times-Roman').text('Address.:', this.leftMargin, currentY)
    doc.font('Times-Bold').text(data.companyAddress + '.', this.leftMargin + 65, currentY, { 
      width: contentWidth - 65 
    })
    
    currentY += this.lineHeight
    doc.text('Aadhar number: NA', this.leftMargin, currentY)
    doc.text('PAN number : NA.', this.leftMargin + 170, currentY, { width: contentWidth - 170 })
    
    currentY += this.lineHeight
    doc.text('Mobile no. :', this.leftMargin, currentY)
    doc.font('Times-Bold').text(data.companyMobile + '.', this.leftMargin + 65, currentY, { 
      width: contentWidth - 65 
    })
    
    return currentY + this.paragraphSpacing - 5
  }

  /**
   * Add purchase statement paragraphs
   */
  addPurchaseStatements(doc, data, currentY, contentWidth) {
    doc.font('Times-Roman')
    
    const para1 = 'I/we have purchased the car today and have taken it with all the documents. Its details are as follows. The said vehicle is in good condition and running condition.'
    doc.text(para1, this.leftMargin, currentY, { 
      width: contentWidth,
      align: 'justify',
      lineGap: 3
    })
    const para1Height = doc.heightOfString(para1, { width: contentWidth })
    currentY += Math.max(para1Height, this.lineHeight * 2)
    
    currentY += this.paragraphSpacing - 10
    const para2 = 'I am guaranteeing that the car will be transfered on my name in as it possible as fast. I will be responsible for the road tax, insurance, accident and other legal matters due at the time of sale regarding this car. If there are any RTO cases, court cases till today regarding the said vehicle, this vehicle\'s old owner will be responsible. And from the date of today I will be responsible for all taxes traffic fines and all court cases and penalties of this vehicle. I am doing the transaction voluntarily and taking the car myself.'
    doc.text(para2, this.leftMargin, currentY, { 
      width: contentWidth,
      align: 'justify',
      lineGap: 3
    })
    const para2Height = doc.heightOfString(para2, { width: contentWidth })
    currentY += Math.max(para2Height, this.lineHeight * 4)
    
    return currentY + this.paragraphSpacing - 5
  }

  /**
   * Add vehicle details section
   */
  addVehicleDetails(doc, data, currentY, contentWidth) {
    doc.font('Times-Roman')
    
    doc.text('Affidavit of reasons that I own', this.leftMargin, currentY, { width: contentWidth })
    currentY += this.lineHeight
    doc.font('Times-Bold').text(data.vehicleModel, this.leftMargin, currentY, { width: contentWidth })
    
    currentY += this.paragraphSpacing
    currentY = this.addDetailRow(doc, 'RTO No.:', data.vehicleNo, currentY, contentWidth, 60)
    currentY = this.addDetailRow(doc, 'Name:.', data.sellerName, currentY, contentWidth, 50)
    currentY = this.addDetailRow(doc, 'Colour.:', data.colour, currentY, contentWidth, 60)
    
    // Address (may wrap)
    doc.font('Times-Roman').text('Address .:', this.leftMargin, currentY)
    doc.font('Times-Bold').text(data.sellerAddress, this.leftMargin + 65, currentY, { 
      width: contentWidth - 65 
    })
    const addressHeight = doc.heightOfString(data.sellerAddress, { width: contentWidth - 65 })
    if (addressHeight > this.lineHeight) {
      currentY += addressHeight - this.lineHeight
    }
    currentY += this.lineHeight
    
    currentY = this.addDetailRow(doc, 'Chassis Number:. ,', data.chassisNo, currentY, contentWidth, 110)
    currentY = this.addDetailRow(doc, 'Engine Number:', data.engineNo, currentY, contentWidth, 110)
    currentY = this.addDetailRow(doc, 'Company:', data.company + '.', currentY, contentWidth, 60)
    
    doc.text('Mobile Number.:', this.leftMargin, currentY)
    doc.text('___________________.', this.leftMargin + 110, currentY, { width: contentWidth - 110 })
    currentY += this.lineHeight
    
    doc.text('Date / Time. :', this.leftMargin, currentY)
    doc.font('Times-Bold').text(data.purchaseDateTime, this.leftMargin + 95, currentY, { 
      width: contentWidth - 95 
    })
    currentY += this.lineHeight
    
    doc.font('Times-Roman').text('Model.:', this.leftMargin, currentY)
    doc.font('Times-Bold').text(data.modelYear.toString(), this.leftMargin + 50, currentY, { 
      width: contentWidth - 50 
    })
    currentY += this.lineHeight
    
    doc.text('Signature.:', this.leftMargin, currentY)
    doc.text('_____________________', this.leftMargin + 80, currentY, { width: 150 })
    doc.font('Times-Bold').text('Insurance.: VALID.', this.leftMargin + contentWidth - 150, currentY, { 
      width: 150, 
      align: 'right' 
    })
    
    return currentY
  }

  /**
   * Add a detail row (label + value)
   */
  addDetailRow(doc, label, value, currentY, contentWidth, labelWidth) {
    doc.font('Times-Roman').text(label, this.leftMargin, currentY)
    doc.font('Times-Bold').text(value, this.leftMargin + labelWidth, currentY, { 
      width: contentWidth - labelWidth 
    })
    return currentY + this.lineHeight
  }

  /**
   * Generate page 2 of purchase note
   */
  generatePage2(doc, data, contentWidth) {
    let currentY = 50
    
    doc.fontSize(12).font('Times-Roman')
    
    // Price section
    currentY = this.addPriceSection(doc, data, currentY, contentWidth)
    
    // Payment details
    currentY = this.addPaymentDetails(doc, data, currentY, contentWidth)
    
    // Terms and conditions
    currentY = this.addTermsAndConditions(doc, data, currentY, contentWidth)
    
    // Footer section
    this.addFooter(doc, data, currentY, contentWidth)
    
    // Page number
    doc.fontSize(10).font('Times-Roman')
      .text('2 | OF 2 Page', this.leftMargin + contentWidth - 100, 50, { 
        width: 100, 
        align: 'right' 
      })
  }

  /**
   * Add price section
   */
  addPriceSection(doc, data, currentY, contentWidth) {
    doc.font('Times-Roman')
      .text('The price of said vehicle is Rs.', this.leftMargin, currentY, { width: 200 })
    doc.font('Times-Bold').text(`${data.purchasePrice.toLocaleString('en-IN')}/-`, 
      this.leftMargin + 200, currentY, { width: 100 })
    doc.font('Times-Roman').text('. In word rupees.:', this.leftMargin + 300, currentY, { 
      width: contentWidth - 300 
    })
    
    currentY += this.lineHeight
    doc.font('Times-Bold').text(data.priceInWords + '.', this.leftMargin, currentY, { 
      width: contentWidth, 
      lineGap: 3 
    })
    const priceWordsHeight = doc.heightOfString(data.priceInWords + '.', { width: contentWidth })
    if (priceWordsHeight > this.lineHeight) {
      currentY += priceWordsHeight - this.lineHeight
    }
    
    return currentY + this.paragraphSpacing
  }

  /**
   * Add payment details section
   */
  addPaymentDetails(doc, data, currentY, contentWidth) {
    doc.font('Times-Roman')
    const paymentText = `It has been fixed at this price. AND AS ADVANCE/ FULL PAYMENT OF Rs.${data.totalPaid.toLocaleString('en-IN')}/- PAID IN ${data.paymentMode} AS FULL PAYMENT.`
    doc.text(paymentText, this.leftMargin, currentY, { 
      width: contentWidth, 
      align: 'justify', 
      lineGap: 3 
    })
    const paymentTextHeight = doc.heightOfString(paymentText, { width: contentWidth })
    currentY += Math.max(paymentTextHeight, this.lineHeight)
    
    if (data.deductions > 0) {
      currentY += 5
      const deductionText = `AND Rs.${data.deductions.toLocaleString('en-IN')}/- DEDUCTED AGAINST ${data.deductionsNotes || 'N/A'}.`
      doc.text(deductionText, this.leftMargin, currentY, { width: contentWidth, lineGap: 3 })
      const deductionHeight = doc.heightOfString(deductionText, { width: contentWidth })
      currentY += Math.max(deductionHeight, this.lineHeight)
    }
    
    currentY += 5
    doc.text(`TOTAL AMOUNT PAID IS Rs.${data.netAmount.toLocaleString('en-IN')}/-.`, 
      this.leftMargin, currentY, { width: contentWidth })
    
    return currentY + this.paragraphSpacing
  }

  /**
   * Add terms and conditions section
   */
  addTermsAndConditions(doc, data, currentY, contentWidth) {
    doc.font('Times-Roman')
    
    // Bullet points
    const bullets = [
      '* Car will be sold if transaction is canceled for any reason.',
      '* I have received the said vehicle properly.',
      '* I will be fully responsible for any cases or penalties from the date of today.'
    ]
    
    bullets.forEach(bullet => {
      doc.text(bullet, this.leftMargin, currentY, { width: contentWidth, lineGap: 3 })
      const bulletHeight = doc.heightOfString(bullet, { width: contentWidth })
      if (bulletHeight > this.lineHeight) {
        currentY += bulletHeight - this.lineHeight
      }
      currentY += this.lineHeight
    })
    
    currentY += this.paragraphSpacing - this.lineHeight
    doc.font('Times-Bold').text('Terms and Conditions.', this.leftMargin, currentY, { 
      width: contentWidth 
    })
    
    currentY += this.paragraphSpacing - 5
    doc.fontSize(11).font('Times-Roman')
    
    // Terms list
    const terms = [
      '1. The advance will not be refunded if the transaction is broken due to the vehicle\'s transaction documents, insurance, or other reasons.',
      '2. If the transaction of the said vehicle number is not completed within the time limit, I will give you the possession of the said vehicle at the time and place you ask for it.',
      '3. I shall remain responsible for the consequences of the said vehicle not to travel or carry out any illegal transport.',
      '4. The said vehicle will not be sold to someone else until your amount is paid, if I sold it to other person, I will pay your amount immediately.',
      '5. If the amount is not repaid within the due date and you take possession of the vehicle back, there will be no demand for refund of the amount. or will not take any legal action.',
      '6. I will pay RTO licenses and insurance taxes for the this vehicle from today to the next period from time to time',
      '7. I understand that the commission amount will be taken in advance and will not be refunded under any circumstances',
      '8. In case of cancellation of car transaction due to any reason, 15% amount will be deducted and car will be sold.',
      '9. Shree Rudra Motors does not guarantee any kind of warranty on any vehicle.'
    ]
    
    terms.forEach(term => {
      doc.text(term, this.leftMargin, currentY, { width: contentWidth, align: 'justify', lineGap: 3 })
      const termHeight = doc.heightOfString(term, { width: contentWidth })
      currentY += Math.max(termHeight, this.lineHeight)
      currentY += 15
    })
    
    currentY += this.paragraphSpacing - 5 - 15
    doc.text('• I have read and agree to all the above terms and conditions.', 
      this.leftMargin, currentY, { width: contentWidth })
    
    currentY += this.paragraphSpacing
    doc.font('Times-Bold').text('CAR RECIVED FROM :', this.leftMargin, currentY, { width: contentWidth })
    
    currentY += this.paragraphSpacing - 5
    doc.font('Times-Roman')
    doc.text('Name: ___________________________.', this.leftMargin, currentY, { width: contentWidth })
    currentY += this.lineHeight
    doc.text('Mobile No.________________________.', this.leftMargin, currentY, { width: contentWidth })
    currentY += this.lineHeight
    doc.text('Signature :________________________.', this.leftMargin, currentY, { width: contentWidth })
    
    return currentY
  }

  /**
   * Add footer section
   */
  addFooter(doc, data, currentY, contentWidth) {
    const footerStartY = Math.min(currentY + 30, doc.page.height - 50)
    
    doc.fontSize(10).font('Times-Roman')
    doc.text('{signature image}', this.leftMargin, footerStartY, { width: 120 })
    
    const signedText = `Signed digitally on ${data.purchaseDate} only for pdf copy`
    doc.text(signedText, this.leftMargin + 200, footerStartY, { 
      width: contentWidth - 350, 
      align: 'center' 
    })
    
    doc.font('Times-Bold').fontSize(10)
      .text('For SHREE RUDRA MOTORS', this.leftMargin + contentWidth - 180, footerStartY, { 
        width: 180, 
        align: 'right' 
      })
  }
}

module.exports = PurchaseNotePDFService
