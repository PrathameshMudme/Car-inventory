import React, { useState } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const SalesCustomers = () => {
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const { showToast } = useToast()

  const customers = [
    {
      name: 'Suresh Mehta',
      contact: '+91 98765 43210',
      email: 'suresh@email.com',
      vehiclePurchased: 'Toyota Innova 2020',
      purchaseDate: '10 Nov 2024'
    }
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Customer Database</h2>
          <p>Manage customer information</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddCustomerModal(true)}
        >
          <i className="fas fa-user-plus"></i> Add Customer
        </button>
      </div>

      <Table sx={{ minWidth: 700 }} aria-label="customers table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Vehicle Purchased</TableCell>
            <TableCell>Purchase Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer, index) => (
            <TableRow key={index}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.contact}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.vehiclePurchased}</TableCell>
              <TableCell>{customer.purchaseDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add Customer"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          showToast('Customer added successfully!', 'success')
          setShowAddCustomerModal(false)
        }}>
          <div className="form-group">
            <label>Customer Name <span className="required">*</span></label>
            <input type="text" placeholder="Enter customer name" required />
          </div>
          <div className="form-group">
            <label>Contact Number <span className="required">*</span></label>
            <input type="tel" placeholder="+91 98765 43210" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="customer@email.com" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Add Customer</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddCustomerModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SalesCustomers
