import React, { useState } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const PurchaseNotes = () => {
  const [showPurchaseNoteModal, setShowPurchaseNoteModal] = useState(false)
  const { showToast } = useToast()

  const purchaseNotes = [
    {
      noteNo: 'PN-2024-001',
      vehicle: 'MH12AB1234',
      sellerName: 'Amit Patil',
      date: '15 Nov 2024',
      amount: '₹8,50,000'
    },
    {
      noteNo: 'PN-2024-002',
      vehicle: 'MH14CD5678',
      sellerName: 'Suresh Mehta',
      date: '14 Nov 2024',
      amount: '₹5,80,000'
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
          <h2>Purchase Notes</h2>
          <p>Generate and manage purchase notes</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowPurchaseNoteModal(true)}
        >
          <i className="fas fa-plus"></i> Generate New Note
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Note No.</th>
              <th>Vehicle</th>
              <th>Seller Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseNotes.map((note, index) => (
              <tr key={index}>
                <td><strong>{note.noteNo}</strong></td>
                <td>{note.vehicle}</td>
                <td>{note.sellerName}</td>
                <td>{note.date}</td>
                <td>{note.amount}</td>
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

      <Modal
        isOpen={showPurchaseNoteModal}
        onClose={() => setShowPurchaseNoteModal(false)}
        title="Generate Purchase Note"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          showToast('Purchase note generated successfully!', 'success')
          setShowPurchaseNoteModal(false)
        }}>
          <div className="form-group">
            <label>Vehicle Number <span className="required">*</span></label>
            <select required>
              <option value="">Select Vehicle</option>
              <option>MH12AB1234 - Honda City 2022</option>
              <option>MH14CD5678 - Maruti Swift 2021</option>
            </select>
          </div>
          <div className="form-group">
            <label>Seller Name <span className="required">*</span></label>
            <input type="text" placeholder="Enter seller name" required />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input type="tel" placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label>Purchase Amount <span className="required">*</span></label>
            <input type="number" placeholder="850000" required />
          </div>
          <div className="form-group">
            <label>Terms & Conditions</label>
            <textarea rows="4" placeholder="Enter terms and conditions"></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-file-pdf"></i> Generate PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPurchaseNoteModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PurchaseNotes
