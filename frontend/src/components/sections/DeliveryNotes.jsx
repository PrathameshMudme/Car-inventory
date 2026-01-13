import React from 'react'
import { useToast } from '../../context/ToastContext'
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

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Note No.</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Generated Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveryNotes.map((note, index) => (
              <tr key={index}>
                <td><strong>{note.noteNo}</strong></td>
                <td>{note.vehicle}</td>
                <td>{note.customer}</td>
                <td>{note.generatedDate}</td>
                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DeliveryNotes
