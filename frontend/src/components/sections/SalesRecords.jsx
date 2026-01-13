import React from 'react'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const SalesRecords = () => {
  const { showToast } = useToast()

  const salesRecords = [
    {
      saleDate: '10 Nov 2024',
      vehicle: 'MH10XY9876',
      customer: 'Suresh Mehta',
      salePrice: '₹14,80,000',
      paymentMode: 'Bank Transfer'
    },
    {
      saleDate: '08 Nov 2024',
      vehicle: 'MH08ZZ4321',
      customer: 'Priya Joshi',
      salePrice: '₹9,50,000',
      paymentMode: 'Cheque'
    }
  ]

  const handleExport = () => {
    showToast('Exporting sales data...', 'info')
    setTimeout(() => {
      showToast('Data exported successfully!', 'success')
    }, 1500)
  }

  const handleViewInvoice = (vehicle) => {
    showToast(`Opening invoice for ${vehicle}`, 'info')
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Sales Records</h2>
          <p>View completed sales transactions</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          <i className="fas fa-download"></i> Export
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sale Date</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Sale Price</th>
              <th>Payment Mode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salesRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.saleDate}</td>
                <td><strong>{record.vehicle}</strong></td>
                <td>{record.customer}</td>
                <td>{record.salePrice}</td>
                <td>{record.paymentMode}</td>
                <td>
                  <button
                    className="btn-icon-small"
                    title="View Invoice"
                    onClick={() => handleViewInvoice(record.vehicle)}
                  >
                    <i className="fas fa-file-invoice"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SalesRecords
