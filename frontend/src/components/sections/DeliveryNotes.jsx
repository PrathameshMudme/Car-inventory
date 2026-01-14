import React from 'react'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const DeliveryNotes = () => {
  const { showToast } = useToast()

  const deliveryNotes = [
    {
      noteNo: 'DN-2024-015',
      vehicle: 'MH10XY9876',
      customer: 'Suresh Mehta',
      generatedDate: '15 Nov 2024'
    },
    {
      noteNo: 'DN-2024-014',
      vehicle: 'MH08ZZ4321',
      customer: 'Amit Kumar',
      generatedDate: '12 Nov 2024'
    }
  ]

  const handleViewPDF = (noteNo) => {
    showToast(`Opening PDF for ${noteNo}`, 'info')
  }

  const handleDownload = (noteNo) => {
    showToast(`Downloading ${noteNo}...`, 'info')
    setTimeout(() => {
      showToast(`${noteNo} downloaded successfully!`, 'success')
    }, 1500)
  }

  const handleEmail = (noteNo) => {
    showToast(`Emailing ${noteNo}...`, 'info')
    setTimeout(() => {
      showToast(`${noteNo} sent successfully!`, 'success')
    }, 1500)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Delivery Notes</h2>
          <p>Generated delivery documentation</p>
        </div>
      </div>

      <Table sx={{ minWidth: 700 }} aria-label="delivery notes table">
        <TableHead>
          <TableRow>
            <TableCell>Note No.</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Generated Date</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deliveryNotes.map((note, index) => (
            <TableRow key={index}>
              <TableCell><strong>{note.noteNo}</strong></TableCell>
              <TableCell>{note.vehicle}</TableCell>
              <TableCell>{note.customer}</TableCell>
              <TableCell>{note.generatedDate}</TableCell>
              <TableCell align="center">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    className="btn-icon-small"
                    title="View PDF"
                    onClick={() => handleViewPDF(note.noteNo)}
                  >
                    <i className="fas fa-file-pdf"></i>
                  </button>
                  <button
                    className="btn-icon-small"
                    title="Download"
                    onClick={() => handleDownload(note.noteNo)}
                  >
                    <i className="fas fa-download"></i>
                  </button>
                  <button
                    className="btn-icon-small"
                    title="Email"
                    onClick={() => handleEmail(note.noteNo)}
                  >
                    <i className="fas fa-envelope"></i>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default DeliveryNotes
