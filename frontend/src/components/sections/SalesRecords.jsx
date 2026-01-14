import React from 'react'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
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

      <Table sx={{ minWidth: 700 }} aria-label="sales records table">
        <TableHead>
          <TableRow>
            <TableCell>Sale Date</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Sale Price</TableCell>
            <TableCell>Payment Mode</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {salesRecords.map((record, index) => (
            <TableRow key={index}>
              <TableCell>{record.saleDate}</TableCell>
              <TableCell><strong>{record.vehicle}</strong></TableCell>
              <TableCell>{record.customer}</TableCell>
              <TableCell>{record.salePrice}</TableCell>
              <TableCell>{record.paymentMode}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default SalesRecords
