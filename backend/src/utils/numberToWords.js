/**
 * Convert numbers to words (Indian numbering system)
 * Supports conversion up to crores
 */

/**
 * Convert a number to words in Indian numbering system
 * @param {number} num - Number to convert
 * @returns {string} Number in words (e.g., "FIVE LAKH RUPEES ONLY")
 */
const numberToWords = (num) => {
  if (!num || num === 0) return 'ZERO'
  
  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ]
  
  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
  ]
  
  /**
   * Convert a number less than 1000 to words
   * @param {number} n - Number to convert (0-999)
   * @returns {string} Number in words
   */
  const convertHundreds = (n) => {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) {
      const ten = Math.floor(n / 10)
      const one = n % 10
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '')
    }
    const hundred = Math.floor(n / 100)
    const remainder = n % 100
    return ones[hundred] + ' HUNDRED' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '')
  }
  
  const n = Math.floor(num)
  if (n === 0) return 'ZERO'
  
  let result = ''
  
  // Crores (10,000,000)
  const crore = Math.floor(n / 10000000)
  if (crore > 0) {
    result += convertHundreds(crore) + ' CRORE '
  }
  
  // Lakhs (100,000)
  const lakh = Math.floor((n % 10000000) / 100000)
  if (lakh > 0) {
    result += convertHundreds(lakh) + ' LAKH '
  }
  
  // Thousands (1,000)
  const thousand = Math.floor((n % 100000) / 1000)
  if (thousand > 0) {
    result += convertHundreds(thousand) + ' THOUSAND '
  }
  
  // Remainder (0-999)
  const remainder = n % 1000
  if (remainder > 0) {
    result += convertHundreds(remainder)
  }
  
  return result.trim() + ' RUPEES ONLY'
}

module.exports = {
  numberToWords
}
