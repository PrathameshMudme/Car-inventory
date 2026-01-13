import React, { useState, useEffect } from 'react'
import VehicleDetails from '../VehicleDetails'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SalesInventory = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false)
  const [visibleLastPrices, setVisibleLastPrices] = useState({})
  const { showToast } = useToast()
  const { token, user } = useAuth()

  useEffect(() => {
    loadVehicles()
  }, [token])

  const loadVehicles = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      // Filter to only show "In Stock" and "Reserved" vehicles for sales
      const availableVehicles = data.filter(v => v.status === 'In Stock' || v.status === 'Reserved')
      setVehicles(availableVehicles)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleModal(true)
  }

  const toggleLastPriceVisibility = (vehicleId) => {
    setVisibleLastPrices(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }))
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'badge-success'
      case 'Reserved': return 'badge-purple'
      case 'Sold': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || vehicle.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h2><i className="fas fa-car-side"></i> Available Inventory</h2>
          <p>View vehicles available for sale ({vehicles.length} vehicles)</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Reserved">Reserved</option>
          </select>
          <button className="btn btn-secondary" onClick={loadVehicles}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-car"></i>
          <h3>No vehicles available for sale</h3>
          <p>Vehicles with "In Stock" status will appear here</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle No.</th>
                <th>Make/Model</th>
                <th>Year</th>
                <th>Asking Price</th>
                <th>Last Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    No vehicles match your criteria
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td><strong>{vehicle.vehicleNo}</strong></td>
                    <td>{vehicle.make} {vehicle.model || ''}</td>
                    <td>{vehicle.year || 'N/A'}</td>
                    <td>{formatPrice(vehicle.askingPrice)}</td>
                    <td>
                      <div className="price-hidden-container">
                        <span
                          className={`price-hidden ${visibleLastPrices[vehicle._id] ? 'visible' : ''}`}
                        >
                            {visibleLastPrices[vehicle._id] ? formatPrice(vehicle.lastPrice || vehicle.askingPrice) : '••••••'}
                        </span>
                        <i
                          className={`fas ${visibleLastPrices[vehicle._id] ? 'fa-eye-slash' : 'fa-eye'} toggle-price`}
                          title={visibleLastPrices[vehicle._id] ? 'Hide Last Price' : 'Show Last Price'}
                          onClick={() => toggleLastPriceVisibility(vehicle._id)}
                        ></i>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon-small"
                        onClick={() => handleViewDetails(vehicle)}
                        title="View"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon-small"
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setShowMarkSoldModal(true)
                        }}
                        title="Mark Sold"
                      >
                        <i className="fas fa-check-circle"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Vehicle Details"
        size="large"
      >
        {selectedVehicle && <VehicleDetails vehicle={selectedVehicle} />}
      </Modal>

      <Modal
        isOpen={showMarkSoldModal}
        onClose={() => setShowMarkSoldModal(false)}
        title="Mark Vehicle as Sold"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          showToast('Vehicle marked as sold successfully!', 'success')
          setShowMarkSoldModal(false)
          loadVehicles() // Refresh list
        }}>
          {selectedVehicle && (
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', marginBottom: '20px' }}>
              <strong>{selectedVehicle.vehicleNo}</strong> - {selectedVehicle.make} {selectedVehicle.model || ''}
            </div>
          )}
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
          <div className="form-group">
            <label>Sale Price <span className="required">*</span></label>
            <input type="number" placeholder="980000" required />
          </div>
          <div className="form-group">
            <label>Payment Mode <span className="required">*</span></label>
            <select required>
              <option value="">Select Payment Mode</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Online Payment">Online Payment</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sale Date <span className="required">*</span></label>
            <input type="date" required />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Mark as Sold</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowMarkSoldModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SalesInventory
