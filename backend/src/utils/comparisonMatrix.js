/**
 * Comparison Matrix Utility
 * Generates comparison data for different time periods
 */

const { formatDate } = require('./dateFormatter')

/**
 * Get date ranges for different period types
 */
const getPeriodRanges = (periodType, endDate = new Date()) => {
  const periods = []
  const end = new Date(endDate)
  
  if (periodType === '6months') {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(end.getFullYear(), end.getMonth() - i, 1)
      const monthEnd = new Date(end.getFullYear(), end.getMonth() - i + 1, 0)
      periods.push({
        period: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        startDate: date,
        endDate: monthEnd
      })
    }
  } else if (periodType === 'quarterly') {
    // Last 4 quarters
    const currentQuarter = Math.floor(end.getMonth() / 3)
    for (let i = 3; i >= 0; i--) {
      const quarter = (currentQuarter - i + 4) % 4
      const year = end.getFullYear() - (currentQuarter - i < 0 ? 1 : 0)
      const startMonth = quarter * 3
      const endMonth = startMonth + 2
      
      const startDate = new Date(year, startMonth, 1)
      const endDate = new Date(year, endMonth + 1, 0)
      
      periods.push({
        period: `Q${quarter + 1} ${year}`,
        startDate,
        endDate
      })
    }
  } else if (periodType === 'yearly') {
    // Last 3 years
    for (let i = 2; i >= 0; i--) {
      const year = end.getFullYear() - i
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)
      
      periods.push({
        period: year.toString(),
        startDate,
        endDate
      })
    }
  }
  
  return periods
}

/**
 * Calculate metrics for a period
 */
const calculatePeriodMetrics = (vehicles, startDate, endDate) => {
  // Filter vehicles by date range (based on saleDate for sold, createdAt for purchased)
  const periodSold = vehicles.filter(v => {
    if (v.status !== 'Sold' || !v.saleDate) return false
    const saleDate = new Date(v.saleDate)
    return saleDate >= startDate && saleDate <= endDate
  })
  
  const periodPurchased = vehicles.filter(v => {
    if (!v.createdAt) return false
    const createdDate = new Date(v.createdAt)
    return createdDate >= startDate && createdDate <= endDate
  })

  // Calculate total payment received (excluding security cheques, including settled payments)
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

  const totalRevenue = periodSold.reduce((sum, v) => sum + calculateTotalPayment(v), 0)
  const totalCost = periodSold.reduce((sum, v) => 
    sum + (parseFloat(v.purchasePrice) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.otherCost) || 0), 0)
  const netProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0
  
  const totalExpenses = periodPurchased.reduce((sum, v) => 
    sum + (parseFloat(v.agentCommission) || 0) + (parseFloat(v.modificationCost) || 0) + (parseFloat(v.otherCost) || 0), 0)
  
  const avgSalePrice = periodSold.length > 0 
    ? periodSold.reduce((sum, v) => sum + calculateTotalPayment(v), 0) / periodSold.length
    : 0

  return {
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
    vehiclesSold: periodSold.length,
    vehiclesPurchased: periodPurchased.length,
    totalExpenses,
    avgSalePrice
  }
}

/**
 * Generate comparison matrix for a period type
 */
const generateComparisonMatrix = (vehicles, periodType, endDate = new Date()) => {
  const periods = getPeriodRanges(periodType, endDate)
  
  const comparisonData = {
    periodType,
    periods: periods.map(p => ({
      period: p.period,
      startDate: p.startDate,
      endDate: p.endDate,
      metrics: calculatePeriodMetrics(vehicles, p.startDate, p.endDate)
    }))
  }
  
  return comparisonData
}

module.exports = {
  getPeriodRanges,
  calculatePeriodMetrics,
  generateComparisonMatrix
}
