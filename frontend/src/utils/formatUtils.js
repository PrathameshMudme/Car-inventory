/**
 * Utility functions for formatting values in the UI
 */

/**
 * Format payment value for display - shows "NIL" for 0, null, undefined, or empty
 */
export const formatPaymentValue = (value) => {
  if (value === null || value === undefined || value === '' || value === 'NIL') {
    return 'NIL'
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue) || numValue === 0) {
    return 'NIL'
  }
  return `₹${numValue.toLocaleString('en-IN')}`
}

/**
 * Format price with "NIL" for payment fields
 */
export const formatPrice = (price, showNIL = false) => {
  if (price === null || price === undefined || price === '' || price === 'NIL') {
    return showNIL ? 'NIL' : 'N/A'
  }
  const numPrice = typeof price === 'number' ? price : parseFloat(price)
  if (isNaN(numPrice)) {
    return showNIL ? 'NIL' : 'N/A'
  }
  if (numPrice === 0 && showNIL) {
    return 'NIL'
  }
  if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(2)}Cr`
  if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(1)}L`
  return `₹${numPrice.toLocaleString('en-IN')}`
}

/**
 * Format payment amount with currency - shows "NIL" for zero/empty
 */
export const formatPaymentAmount = (amount) => {
  return formatPrice(amount, true) // true = show NIL instead of N/A
}

/**
 * Formats vehicle number with hyphens based on format type
 * 
 * Normal format: MH23AY4632 -> MH-23-AY-4632
 * BH series format: 25BH1234AB -> 25 BH 1234 AB
 * 
 * @param {string} vehicleNo - The vehicle number to format
 * @returns {string} - Formatted vehicle number with hyphens/spaces
 */
export const formatVehicleNumber = (vehicleNo) => {
  if (!vehicleNo || typeof vehicleNo !== 'string') {
    return vehicleNo || 'N/A'
  }

  // Remove any existing hyphens/spaces and convert to uppercase
  const cleaned = vehicleNo.replace(/[\s-]/g, '').toUpperCase()

  // Check if it's a BH series (starts with 2 digits followed by BH)
  const bhSeriesPattern = /^(\d{2})(BH)(\d{4})([A-Z]{2})$/
  const bhMatch = cleaned.match(bhSeriesPattern)
  
  if (bhMatch) {
    // Format: YY BH #### XX
    const [, year, bh, numbers, letters] = bhMatch
    return `${year} ${bh} ${numbers} ${letters}`
  }

  // Check if it's a normal state format (starts with 2 letters, then 2 digits, then 2 letters, then 4 digits)
  // Pattern: State code (2 letters) - District code (2 digits) - Letters (2 letters) - Numbers (4 digits)
  const normalPattern = /^([A-Z]{2})(\d{2})([A-Z]{2})(\d{4})$/
  const normalMatch = cleaned.match(normalPattern)
  
  if (normalMatch) {
    // Format: XX-XX-XX-XXXX
    const [, state, district, letters, numbers] = normalMatch
    return `${state}-${district}-${letters}-${numbers}`
  }

  // If it doesn't match either pattern, try to format common variations
  // Try to detect if it has state code at start (2 letters)
  if (/^[A-Z]{2}/.test(cleaned)) {
    // Try to format as normal format even if slightly different
    // Look for pattern: 2 letters, 2 digits, 2 letters, 4 digits
    const flexiblePattern = /^([A-Z]{2})(\d{2})([A-Z]{2})(\d{4})/
    const flexibleMatch = cleaned.match(flexiblePattern)
    if (flexibleMatch) {
      const [, state, district, letters, numbers] = flexibleMatch
      return `${state}-${district}-${letters}-${numbers}`
    }
  }

  // If no pattern matches, return as-is (might already be formatted or invalid)
  return vehicleNo
}

/**
 * Format vehicle manufacturing month and year for display
 * @param {Object} vehicle - Vehicle object with vehicleMonth, vehicleYear, or year
 * @returns {string} - Formatted string like "Jan 2024" or "2024" if only year available
 */
export const formatManufacturingDate = (vehicle) => {
  if (!vehicle) return 'N/A'
  
  // Priority: vehicleMonth + vehicleYear > year
  if (vehicle.vehicleMonth && vehicle.vehicleYear) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = parseInt(vehicle.vehicleMonth)
    const year = parseInt(vehicle.vehicleYear)
    
    if (month >= 1 && month <= 12 && year) {
      return `${monthNames[month - 1]} ${year}`
    }
  }
  
  // Fallback to year if available
  if (vehicle.year) {
    return vehicle.year.toString()
  }
  
  return 'N/A'
}
