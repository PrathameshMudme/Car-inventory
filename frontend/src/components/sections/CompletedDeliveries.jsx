import React from 'react'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
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

      <Table sx={{ minWidth: 700 }} aria-label="completed deliveries table">
        <TableHead>
          <TableRow>
            <TableCell>Vehicle No.</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Delivery Date</TableCell>
            <TableCell>Note No.</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {completedDeliveries.map((delivery, index) => (
            <TableRow key={index}>
              <TableCell><strong>{delivery.vehicleNo}</strong></TableCell>
              <TableCell>{delivery.customer}</TableCell>
              <TableCell>{delivery.deliveryDate}</TableCell>
              <TableCell>{delivery.noteNo}</TableCell>
              <TableCell>
                <span className="badge badge-success">{delivery.status}</span>
              </TableCell>
              <TableCell align="center">
                <button
                  className="btn-icon-small"
                  title="View Note"
                  onClick={() => handleViewNote(delivery.noteNo)}
                >
                  <i className="fas fa-file-pdf"></i>
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default CompletedDeliveries
