import React, { useState } from 'react'
import VehicleDetails from '../VehicleDetails'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const PendingDeliveries = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false)
  const { showToast } = useToast()

  const pendingDeliveries = [
    {
      vehicleNo: 'MH12AB1234',
      makeModel: 'Honda City 2022',
      customer: 'Rahul Desai',
      contact: '+91 98765 43210',
      scheduledDate: '20 Nov 2024'
    },
    {
      vehicleNo: 'MH14CD5678',
      makeModel: 'Maruti Swift 2021',
      customer: 'Priya Joshi',
      contact: '+91 87654 32109',
      scheduledDate: '21 Nov 2024'
    }
  ]

  const handleViewDetails = (vehicleNo) => {
    const delivery = pendingDeliveries.find(d => d.vehicleNo === vehicleNo)
    setSelectedVehicle(delivery)
    setShowVehicleModal(true)
  }

  const handleGenerateNote = (vehicleNo) => {
    const delivery = pendingDeliveries.find(d => d.vehicleNo === vehicleNo)
    setSelectedVehicle(delivery)
    setShowDeliveryNoteModal(true)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Pending Deliveries</h2>
          <p>Vehicles scheduled for delivery</p>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle No.</th>
              <th>Make/Model</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Scheduled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingDeliveries.map((delivery, index) => (
              <tr key={index}>
                <td><strong>{delivery.vehicleNo}</strong></td>
                <td>{delivery.makeModel}</td>
                <td>{delivery.customer}</td>
                <td>{delivery.contact}</td>
                <td>{delivery.scheduledDate}</td>
                <td>
                  <button
                    className="btn-icon-small"
                    onClick={() => handleViewDetails(delivery.vehicleNo)}
                    title="View"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    className="btn-icon-small"
                    onClick={() => handleGenerateNote(delivery.vehicleNo)}
                    title="Generate Note"
                  >
                    <i className="fas fa-file-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Vehicle Details"
        size="large"
      >
        {selectedVehicle && <VehicleDetails vehicle={selectedVehicle} />}
      </Modal>

      <Modal
        isOpen={showDeliveryNoteModal}
        onClose={() => setShowDeliveryNoteModal(false)}
        title="Generate Delivery Note"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          showToast('Delivery note generated successfully!', 'success')
          setShowDeliveryNoteModal(false)
        }}>
          <div className="form-group">
            <label>Vehicle Number <span className="required">*</span></label>
            <input
              type="text"
              value={selectedVehicle?.vehicleNo || ''}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Customer Name <span className="required">*</span></label>
            <input
              type="text"
              value={selectedVehicle?.customer || ''}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Delivery Date <span className="required">*</span></label>
            <input type="date" required />
          </div>
          <div className="form-group">
            <label>Delivery Time</label>
            <input type="time" />
          </div>
          <div className="form-group">
            <label>Delivery Address <span className="required">*</span></label>
            <textarea rows="3" placeholder="Enter complete delivery address" required></textarea>
          </div>
          <div className="form-group">
            <label>Special Instructions</label>
            <textarea rows="2" placeholder="Any special instructions for delivery"></textarea>
          </div>
          <div className="form-group">
            <label>Terms & Conditions</label>
            <textarea rows="3" placeholder="Enter terms and conditions"></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-file-pdf"></i> Generate PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowDeliveryNoteModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PendingDeliveries
