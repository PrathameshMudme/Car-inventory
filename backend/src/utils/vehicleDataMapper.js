/**
 * Maps vehicle data from database to template variables for purchase notes
 */

const { formatDate, formatDateTime } = require('./dateFormatter')
const { numberToWords } = require('./numberToWords')

/**
 * Company information constants
 */
const COMPANY_INFO = {
  name: 'SHREE RUDRA MOTORS',
  address: 'SHANKAR MATH, HADAPSAR, PUNE-411013',
  mobile: '9273898598 / 8530049222'
}

/**
 * Map vehicle data to purchase note template variables
 * @param {Object} vehicle - Vehicle document from database
 * @returns {Object} Mapped data for template
 */
const mapVehicleToPurchaseNoteData = (vehicle) => {
  // Generate note number
  const noteNo = `PN-${vehicle.vehicleNo.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`
  
  // Date information
  const purchaseDate = formatDate(vehicle.purchaseDate)
  const purchaseDateTime = formatDateTime(vehicle.purchaseDate || new Date())
  
  // Vehicle information
  const vehicleModel = `${vehicle.make} ${vehicle.model || ''}`.trim()
  const vehicleNo = vehicle.vehicleNo
  const sellerName = vehicle.sellerName || 'N/A'
  const colour = vehicle.color || 'N/A'
  
  // Seller address
  const sellerAddress = vehicle.addressLine1 
    ? `${vehicle.addressLine1 || ''}, ${vehicle.taluka || ''}, ${vehicle.district || ''}, ${vehicle.pincode || ''}`
        .replace(/,\s*,/g, ',')
        .replace(/^,\s*|,\s*$/g, '')
        .trim()
    : 'N/A'
  
  // Vehicle technical details
  const chassisNo = vehicle.chassisNo || 'N/A'
  const engineNo = vehicle.engineNo || 'N/A'
  const company = vehicle.make || 'N/A'
  const modelYear = vehicle.year || 'N/A'
  
  // Payment details
  const purchasePrice = vehicle.purchasePrice || 0
  const priceInWords = numberToWords(purchasePrice)
  const purchasePaymentMethods = vehicle.purchasePaymentMethods || new Map()
  const deductions = purchasePaymentMethods.get('deductions') || 0
  const deductionsNotes = vehicle.deductionsNotes || ''
  
  // Calculate total paid and payment mode
  const { totalPaid, paymentMode } = calculatePaymentDetails(
    purchasePaymentMethods,
    vehicle.paymentMethod,
    purchasePrice
  )
  
  return {
    // Note metadata
    noteNo,
    purchaseDate,
    purchaseDateTime,
    
    // Company information
    companyName: COMPANY_INFO.name,
    companyAddress: COMPANY_INFO.address,
    companyMobile: COMPANY_INFO.mobile,
    
    // Vehicle information
    vehicleModel,
    vehicleNo,
    sellerName,
    colour,
    sellerAddress,
    chassisNo,
    engineNo,
    company,
    modelYear,
    
    // Payment information
    purchasePrice,
    priceInWords,
    totalPaid,
    paymentMode,
    deductions,
    deductionsNotes,
    netAmount: totalPaid - deductions
  }
}

/**
 * Calculate payment details from payment methods
 * @param {Map} purchasePaymentMethods - Map of payment methods and amounts
 * @param {string} fallbackPaymentMethod - Fallback payment method string
 * @param {number} fallbackPrice - Fallback price if no payment methods found
 * @returns {Object} Object with totalPaid and paymentMode
 */
const calculatePaymentDetails = (purchasePaymentMethods, fallbackPaymentMethod, fallbackPrice) => {
  let totalPaid = 0
  let paymentMode = 'N/A'
  
  if (purchasePaymentMethods && purchasePaymentMethods.size > 0) {
    const paymentParts = []
    purchasePaymentMethods.forEach((amount, mode) => {
      if (mode !== 'deductions' && amount > 0) {
        totalPaid += parseFloat(amount) || 0
        paymentParts.push(mode.replace('_', ' ').toUpperCase())
      }
    })
    paymentMode = paymentParts.join(' / ') || 'N/A'
  } else if (fallbackPaymentMethod) {
    paymentMode = fallbackPaymentMethod
    // Try to extract total from paymentMethod string
    const matches = fallbackPaymentMethod.match(/₹[\d,]+/g)
    if (matches) {
      matches.forEach(match => {
        const num = parseFloat(match.replace(/[₹,]/g, ''))
        if (!isNaN(num)) totalPaid += num
      })
    }
  }
  
  // If totalPaid is still 0, use fallback price
  if (totalPaid === 0) {
    totalPaid = fallbackPrice
  }
  
  return { totalPaid, paymentMode }
}

module.exports = {
  mapVehicleToPurchaseNoteData,
  COMPANY_INFO
}
