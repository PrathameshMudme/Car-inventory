import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { getDistricts, getTalukas } from '../../utils/maharashtraData'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SalesCustomers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    contact: '',
    email: '',
    district: '',
    taluka: ''
  })
  const [availableTalukas, setAvailableTalukas] = useState([])
  const { showToast } = useToast()
  const { token, user } = useAuth()

  useEffect(() => {
    if (token) {
      loadCustomers()
    } else {
      setLoading(false)
    }
  }, [token])

  // Update available talukas when district changes
  useEffect(() => {
    if (customerFormData.district) {
      setAvailableTalukas(getTalukas(customerFormData.district))
    } else {
      setAvailableTalukas([])
      setCustomerFormData(prev => ({ ...prev, taluka: '' }))
    }
  }, [customerFormData.district])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showAddCustomerModal) {
      setCustomerFormData({
        name: '',
        contact: '',
        email: '',
        district: '',
        taluka: ''
      })
      setAvailableTalukas([])
    }
  }, [showAddCustomerModal])

  const loadCustomers = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Fetch vehicles with status 'Sold' or 'Reserved' (these have customer data)
      const response = await fetch(`${API_URL}/vehicles?status=Sold`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load customers')
      }

      const vehicles = await response.json()
      
      // Filter vehicles with customer data and apply role-based filtering
      let filteredVehicles = vehicles.filter(vehicle => {
        // Must have customer name
        if (!vehicle.customerName) return false
        
        // For sales managers: only show vehicles they created
        // Backend already filters by createdBy, but we double-check here
        if (user?.role === 'sales') {
          const createdById = vehicle.createdBy?._id || vehicle.createdBy
          const userId = user._id || user.id
          return createdById?.toString() === userId?.toString()
        }
        
        // For admin: show all vehicles with customer data
        return true
      })

      // Also fetch Reserved vehicles
      const reservedResponse = await fetch(`${API_URL}/vehicles?status=Reserved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (reservedResponse.ok) {
        const reservedVehicles = await reservedResponse.json()
        const filteredReserved = reservedVehicles.filter(vehicle => {
          // Both admin and sales managers see all customers
          return !!vehicle.customerName
        })
        filteredVehicles = [...filteredVehicles, ...filteredReserved]
      }

      // Transform vehicles to customer records
      const customerRecords = filteredVehicles.map(vehicle => {
        // Format address with only taluka and district
        let addressFormatted = 'N/A'
        const addressParts = []
        if (vehicle.customerTaluka) {
          addressParts.push(vehicle.customerTaluka)
        }
        if (vehicle.customerDistrict) {
          addressParts.push(vehicle.customerDistrict)
        }
        if (addressParts.length > 0) {
          addressFormatted = addressParts.join(', ')
        }

        return {
          _id: vehicle._id,
          name: vehicle.customerName || 'N/A',
          contact: vehicle.customerContact || 'N/A',
          email: vehicle.customerEmail || 'N/A',
          address: addressFormatted
        }
      })

      // Sort by customer name alphabetically
      customerRecords.sort((a, b) => {
        return a.name.localeCompare(b.name)
      })

      setCustomers(customerRecords)
    } catch (error) {
      console.error('Error loading customers:', error)
      showToast('Failed to load customers', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <div>
            <h2>Customer Database</h2>
            <p>Manage customer information</p>
          </div>
        </div>
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading customers...</p>
        </div>
      </div>
    )
  }

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

      {customers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-users"></i>
          <h3>No customers found</h3>
          <p>No customer records available</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="customers table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell><strong>{customer.name}</strong></TableCell>
                <TableCell>{customer.contact}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add Customer"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          // Validate required fields
          if (!customerFormData.name || !customerFormData.contact) {
            showToast('Please fill in all required fields', 'error')
            return
          }
          if (customerFormData.district && !customerFormData.taluka) {
            showToast('Please select a taluka', 'error')
            return
          }
          
          // TODO: Implement API call to add customer
          // For now, just show success message
          showToast('Customer added successfully!', 'success')
          setShowAddCustomerModal(false)
          // Reload customers after adding
          loadCustomers()
        }}>
          <div className="form-group">
            <label>Customer Name <span className="required">*</span></label>
            <input 
              type="text" 
              placeholder="Enter customer name" 
              value={customerFormData.name}
              onChange={(e) => setCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
              required 
            />
          </div>
          <div className="form-group">
            <label>Contact Number <span className="required">*</span></label>
            <input 
              type="tel" 
              placeholder="+91 98765 43210" 
              value={customerFormData.contact}
              onChange={(e) => setCustomerFormData(prev => ({ ...prev, contact: e.target.value }))}
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="customer@email.com" 
              value={customerFormData.email}
              onChange={(e) => setCustomerFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>District</label>
              <select 
                value={customerFormData.district}
                onChange={(e) => setCustomerFormData(prev => ({ 
                  ...prev, 
                  district: e.target.value,
                  taluka: '' // Clear taluka when district changes
                }))}
              >
                <option value="">Select District</option>
                {getDistricts().map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Taluka</label>
              <select 
                value={customerFormData.taluka}
                onChange={(e) => setCustomerFormData(prev => ({ ...prev, taluka: e.target.value }))}
                disabled={!customerFormData.district}
              >
                <option value="">{customerFormData.district ? 'Select Taluka' : 'Select District first'}</option>
                {availableTalukas.map(taluka => (
                  <option key={taluka} value={taluka}>{taluka}</option>
                ))}
              </select>
            </div>
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
