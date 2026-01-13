import React, { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const AdminProfit = () => {
  const [filter, setFilter] = useState('All Vehicles')
  const { showToast } = useToast()

  const profitData = [
    {
      vehicle: 'MH12AB1234',
      purchasePrice: '₹8,50,000',
      modifications: '₹45,000',
      commission: '₹25,000',
      otherCosts: '₹10,000',
      totalCost: '₹9,30,000',
      sellingPrice: '₹10,20,000',
      netProfit: '₹90,000',
      margin: '8.8%'
    },
    {
      vehicle: 'MH14CD5678',
      purchasePrice: '₹5,80,000',
      modifications: '₹35,000',
      commission: '₹18,000',
      otherCosts: '₹8,000',
      totalCost: '₹6,41,000',
      sellingPrice: '₹7,10,000',
      netProfit: '₹69,000',
      margin: '9.7%'
    },
    {
      vehicle: 'MH10XY9876',
      purchasePrice: '₹12,50,000',
      modifications: '₹80,000',
      commission: '₹40,000',
      otherCosts: '₹15,000',
      totalCost: '₹13,85,000',
      sellingPrice: '₹14,80,000',
      netProfit: '₹95,000',
      margin: '6.4%'
    }
  ]

  const handleDownload = () => {
    showToast('Downloading profit & loss report...', 'info')
    setTimeout(() => {
      showToast('Report downloaded successfully!', 'success')
    }, 1500)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Profit & Loss Statement</h2>
          <p>Detailed profit analysis per vehicle</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All Vehicles</option>
            <option>Sold Only</option>
            <option>This Month</option>
          </select>
          <button className="btn btn-secondary" onClick={handleDownload}>
            <i className="fas fa-download"></i> Download Report
          </button>
        </div>
      </div>

      <div className="profit-summary">
        <div className="profit-card">
          <h4>Total Revenue</h4>
          <p className="profit-amount">₹1.2Cr</p>
        </div>
        <div className="profit-card">
          <h4>Total Costs</h4>
          <p className="profit-amount cost">₹1.01Cr</p>
        </div>
        <div className="profit-card highlight">
          <h4>Net Profit</h4>
          <p className="profit-amount profit">₹18.5L</p>
          <span className="profit-margin">15.4% margin</span>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Purchase Price</th>
              <th>Modifications</th>
              <th>Commission</th>
              <th>Other Costs</th>
              <th>Total Cost</th>
              <th>Selling Price</th>
              <th>Net Profit</th>
              <th>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {profitData.map((row, index) => (
              <tr key={index}>
                <td><strong>{row.vehicle}</strong></td>
                <td>{row.purchasePrice}</td>
                <td>{row.modifications}</td>
                <td>{row.commission}</td>
                <td>{row.otherCosts}</td>
                <td>{row.totalCost}</td>
                <td>{row.sellingPrice}</td>
                <td className="profit-positive">{row.netProfit}</td>
                <td>{row.margin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminProfit
