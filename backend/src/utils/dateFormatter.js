/**
 * Date formatting utilities for purchase notes and other documents
 */

/**
 * Format date to Indian locale format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  if (!date) {
    return new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }
  return new Date(date).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

/**
 * Format date and time to Indian locale format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time string
 */
const formatDateTime = (date) => {
  if (!date) {
    const now = new Date()
    return now.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) + ' ' + now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })
  }
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }) + ' ' + d.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  })
}

module.exports = {
  formatDate,
  formatDateTime
}
