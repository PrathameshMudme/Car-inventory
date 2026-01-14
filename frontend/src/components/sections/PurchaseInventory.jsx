import React, { useState, useEffect } from 'react'
import VehicleDetails from '../VehicleDetails'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const PurchaseInventory = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const { showToast } = useToast()
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'admin'

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
      setVehicles(data)
      
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'badge-success'
      case 'On Modification': return 'badge-warning'
      case 'Sold': return 'badge-info'
      case 'Reserved': return 'badge-purple'
      default: return 'badge-secondary'
    }
  }

  const getDocumentStatus = (vehicle) => {
    const missingDocs = vehicle.missingDocuments || []
    if (missingDocs.length === 0) return { status: 'Complete', badge: 'badge-success' }
    if (missingDocs.length <= 2) return { status: 'Partial', badge: 'badge-warning' }
    return { status: 'Incomplete', badge: 'badge-danger' }
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
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
          <h2><i className="fas fa-warehouse"></i> Vehicle Inventory</h2>
          <p>View and manage all purchased vehicles</p>
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
            <option value="On Modification">On Modification</option>
            <option value="In Stock">In Stock</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </select>
          <button className="btn btn-primary" onClick={() => loadVehicles(true)}>
            <i className="fas fa-sync-alt"></i> Refresh
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
          <h3>No vehicles found</h3>
          <p>Add your first vehicle using the "Add Vehicle" menu</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="purchase inventory table">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle No.</TableCell>
              <TableCell>Make/Model</TableCell>
              <TableCell>Year</TableCell>
              {isAdmin && <TableCell>Purchase Price</TableCell>}
              <TableCell>Purchase Date</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} sx={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-search" style={{ fontSize: '32px', color: '#ccc', marginBottom: '10px', display: 'block' }}></i>
                  No vehicles match your search criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => {
                const docStatus = getDocumentStatus(vehicle)
                return (
                  <TableRow key={vehicle._id}>
                    <TableCell><strong>{vehicle.vehicleNo}</strong></TableCell>
                    <TableCell>{vehicle.make} {vehicle.model || ''}</TableCell>
                    <TableCell>{vehicle.year || 'N/A'}</TableCell>
                    {isAdmin && (
                      <TableCell>{formatPrice(vehicle.purchasePrice)}</TableCell>
                    )}
                    <TableCell>{formatDate(vehicle.purchaseDate)}</TableCell>
                    <TableCell>
                      <span className={`badge ${docStatus.badge}`}>
                        {docStatus.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`badge ${getStatusBadgeClass(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <button
                        className="btn-icon-small"
                        onClick={() => handleViewDetails(vehicle)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      )}

      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Vehicle Details"
        size="large"
      >
        {selectedVehicle && <VehicleDetails vehicle={selectedVehicle} />}
      </Modal>
    </div>
  )
}

export default PurchaseInventory
