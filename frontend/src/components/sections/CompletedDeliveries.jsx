import React from 'react'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const CompletedDeliveries = () => {
  const { showToast } = useToast()

  const completedDeliveries = [
    {
      vehicleNo: 'MH10XY9876',
      customer: 'Suresh Mehta',
      deliveryDate: '15 Nov 2024',
      noteNo: 'DN-2024-015',
      status: 'Delivered'
    },
    {
      vehicleNo: 'MH08ZZ4321',
      customer: 'Amit Kumar',
      deliveryDate: '12 Nov 2024',
      noteNo: 'DN-2024-014',
      status: 'Delivered'
    }
  ]

  const handleViewNote = (noteNo) => {
    showToast(`Opening delivery note ${noteNo}`, 'info')
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Completed Deliveries</h2>
          <p>Successfully delivered vehicles</p>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle No.</th>
              <th>Customer</th>
              <th>Delivery Date</th>
              <th>Note No.</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {completedDeliveries.map((delivery, index) => (
              <tr key={index}>
                <td><strong>{delivery.vehicleNo}</strong></td>
                <td>{delivery.customer}</td>
                <td>{delivery.deliveryDate}</td>
                <td>{delivery.noteNo}</td>
                <td>
                  <span className="badge badge-success">{delivery.status}</span>
                </td>
                <td>
                  <button
                    className="btn-icon-small"
                    title="View Note"
                    onClick={() => handleViewNote(delivery.noteNo)}
                  >
                    <i className="fas fa-file-pdf"></i>
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

export default CompletedDeliveries
