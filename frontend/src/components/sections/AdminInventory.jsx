import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import VehicleDetails from '../VehicleDetails'
import EditVehicle from '../EditVehicle'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminInventory = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false)
  const [compareVehicle, setCompareVehicle] = useState('')
  const [visibleLastPrices, setVisibleLastPrices] = useState({})
  const [editPriceData, setEditPriceData] = useState({ askingPrice: '', lastPrice: '' })
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
      setVehicles(data)
    
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewSwitch = (type) => {
    setViewType(type)
  }

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleModal(true)
  }

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleModal(false)
    setShowEditVehicleModal(true)
  }

  const handleVehicleUpdateSuccess = async (updatedVehicle) => {
    // Refresh the vehicle list
    await loadVehicles()
    
    // Fetch the updated vehicle with all details (images, documents)
    try {
      const response = await fetch(`${API_URL}/vehicles/${updatedVehicle._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const fullVehicleData = await response.json()
        // Update selected vehicle if it's the same one
        if (selectedVehicle && selectedVehicle._id === updatedVehicle._id) {
          setSelectedVehicle(fullVehicleData)
        }
      }
    } catch (error) {
      console.error('Error fetching updated vehicle:', error)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'badge-success'
      case 'On Modification': return 'badge-warning'
      case 'Reserved': return 'badge-purple'
      case 'Sold': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const getCardBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'green'
      case 'On Modification': return 'orange'
      case 'Reserved': return 'purple'
      case 'Sold': return 'blue'
      default: return 'gray'
    }
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getVehicleImage = (vehicle) => {
    // Get primary image or first front image
    const images = vehicle.images || []
    const primaryImage = images.find(img => img.isPrimary)
    const frontImage = images.find(img => img.category === 'front')
    const anyImage = images[0]
    
    if (primaryImage) return `${API_URL.replace('/api', '')}${primaryImage.imageUrl}`
    if (frontImage) return `${API_URL.replace('/api', '')}${frontImage.imageUrl}`
    if (anyImage) return `${API_URL.replace('/api', '')}${anyImage.imageUrl}`
    
    // Default placeholder
    return `https://via.placeholder.com/400x250?text=${vehicle.make}+${vehicle.model || ''}`
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || vehicle.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const loadCompareImages = () => {
    if (!compareVehicle) {
      showToast('Please select a vehicle', 'warning')
      return
    }
    const vehicle = vehicles.find(v => v._id === compareVehicle)
    if (vehicle) {
      setSelectedVehicle(vehicle)
      showToast('Images loaded', 'success')
    }
  }

  const getBeforeImages = (vehicle) => {
    return (vehicle.images || []).filter(img => img.stage === 'before')
  }

  const getAfterImages = (vehicle) => {
    return (vehicle.images || []).filter(img => img.stage === 'after')
  }

  const toggleLastPriceVisibility = (vehicleId) => {
    setVisibleLastPrices(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }))
  }

  const handleEditPrice = (vehicle) => {
    setSelectedVehicle(vehicle)
    setEditPriceData({
      askingPrice: vehicle.askingPrice ? vehicle.askingPrice.toString() : '',
      lastPrice: vehicle.lastPrice ? vehicle.lastPrice.toString() : ''
    })
    setShowEditPriceModal(true)
  }

  const handleSavePrices = async (e) => {
    e.preventDefault()
    if (!selectedVehicle) return

    try {
      const formData = new FormData()
      
      // Only send askingPrice if it has a value
      if (editPriceData.askingPrice && editPriceData.askingPrice.trim() !== '') {
        formData.append('askingPrice', parseFloat(editPriceData.askingPrice))
      }
      
      // Only send lastPrice if it has a value
      if (editPriceData.lastPrice && editPriceData.lastPrice.trim() !== '') {
        formData.append('lastPrice', parseFloat(editPriceData.lastPrice))
      }

      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update prices')
      }

      const result = await response.json()
      showToast(`Prices updated successfully for ${selectedVehicle.vehicleNo}!`, 'success')
      setShowEditPriceModal(false)
      setEditPriceData({ askingPrice: '', lastPrice: '' })
      loadVehicles()
    } catch (error) {
      console.error('Error updating prices:', error)
      showToast(error.message || 'Failed to update prices', 'error')
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2><i className="fas fa-warehouse"></i> Vehicle Inventory</h2>
          <p>Manage and view all vehicles ({vehicles.length} total)</p>
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
          <div className="view-toggle">
            <button
              className={`btn-icon-small ${viewType === 'grid' ? 'active' : ''}`}
              onClick={() => handleViewSwitch('grid')}
              title="Grid View"
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button
              className={`btn-icon-small ${viewType === 'table' ? 'active' : ''}`}
              onClick={() => handleViewSwitch('table')}
              title="Table View"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCompareModal(true)}
          >
            <i className="fas fa-images"></i> Compare
          </button>
          <button className="btn btn-secondary" onClick={() => loadVehicles(true)}>
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
          <h3>No vehicles found</h3>
          <p>Vehicles added by purchase managers will appear here</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewType === 'grid' && (
            <div className="vehicle-grid active">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle._id} className="vehicle-card">
                  <div className="vehicle-card-image">
                    <img src={getVehicleImage(vehicle)} alt={`${vehicle.make} ${vehicle.model || ''}`} />
                    <div className={`vehicle-card-badge ${getCardBadgeClass(vehicle.status)}`}>
                      {vehicle.status}
                    </div>
                    <div className="vehicle-card-overlay">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewDetails(vehicle)}
                      >
                        <i className="fas fa-eye"></i> View Details
                      </button>
                    </div>
                  </div>
                  <div className="vehicle-card-content">
                    <div className="vehicle-card-header">
                      <h3>{vehicle.make} {vehicle.model || ''} {vehicle.year || ''}</h3>
                      <span className="vehicle-number">{vehicle.vehicleNo}</span>
                    </div>
                    <div className="vehicle-card-specs">
                      <span><i className="fas fa-tachometer-alt"></i> {vehicle.kilometers || 'N/A'} km</span>
                      <span><i className="fas fa-gas-pump"></i> {vehicle.fuelType || 'N/A'}</span>
                      <span><i className="fas fa-palette"></i> {vehicle.color || 'N/A'}</span>
                    </div>
                    <div className="vehicle-card-pricing">
                      <div className="price-item">
                        <label>Purchase</label>
                        <strong>{formatPrice(vehicle.purchasePrice)}</strong>
                      </div>
                      <div className="price-item">
                        <label>Asking</label>
                        <strong>{formatPrice(vehicle.askingPrice)}</strong>
                      </div>
                      <div className="price-item">
                        <label>Documents</label>
                        <strong className={vehicle.missingDocuments?.length > 0 ? 'text-warning' : 'text-success'}>
                          {vehicle.missingDocuments?.length > 0 ? `${vehicle.missingDocuments.length} Missing` : 'Complete'}
                        </strong>
                      </div>
                    </div>
                    <div className="vehicle-card-actions">
                      <button className="btn-icon-small" title="Edit Vehicle" onClick={() => handleEditVehicle(vehicle)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn-icon-small" title="Edit Prices" onClick={() => handleEditPrice(vehicle)}>
                        <i className="fas fa-dollar-sign"></i>
                      </button>
                      <button className="btn-icon-small" title="View Details" onClick={() => handleViewDetails(vehicle)}>
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewType === 'table' && (
            <Table sx={{ minWidth: 700 }} aria-label="admin inventory table">
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle No.</TableCell>
                  <TableCell>Make/Model</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Purchase Price</TableCell>
                  <TableCell>Asking Price</TableCell>
                  <TableCell>Last Price</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Status</TableCell>
                  {vehicles.some(v => v.status === 'Sold' && v.remainingAmount > 0) && (
                    <TableCell>Remaining Amount</TableCell>
                  )}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={vehicles.some(v => v.status === 'Sold' && v.remainingAmount > 0) ? 10 : 9} sx={{ textAlign: 'center', padding: '40px' }}>
                      No vehicles match your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle._id}>
                      <TableCell><strong>{vehicle.vehicleNo}</strong></TableCell>
                      <TableCell>{vehicle.make} {vehicle.model || ''}</TableCell>
                      <TableCell>{vehicle.year || 'N/A'}</TableCell>
                      <TableCell>{formatPrice(vehicle.purchasePrice)}</TableCell>
                      <TableCell>{formatPrice(vehicle.askingPrice)}</TableCell>
                      <TableCell>
                        <div className="price-hidden-container">
                          <span
                            className={`price-hidden ${visibleLastPrices[vehicle._id] ? 'visible' : ''}`}
                          >
                            {visibleLastPrices[vehicle._id] ? formatPrice(vehicle.lastPrice || vehicle.askingPrice || vehicle.purchasePrice) : '••••••'}
                          </span>
                          <i
                            className={`fas ${visibleLastPrices[vehicle._id] ? 'fa-eye-slash' : 'fa-eye'} toggle-price`}
                            title={visibleLastPrices[vehicle._id] ? 'Hide Last Price' : 'Show Last Price'}
                            onClick={() => toggleLastPriceVisibility(vehicle._id)}
                          ></i>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`badge ${vehicle.missingDocuments?.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                          {vehicle.missingDocuments?.length > 0 ? `${vehicle.missingDocuments.length} Missing` : 'Complete'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`badge ${getStatusBadgeClass(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </TableCell>
                      {vehicles.some(v => v.status === 'Sold' && v.remainingAmount > 0) && (
                        <TableCell>
                          {vehicle.status === 'Sold' && vehicle.remainingAmount > 0 ? (
                            <strong style={{ color: '#dc3545' }}>{formatPrice(vehicle.remainingAmount)}</strong>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleViewDetails(vehicle)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn-icon-small" 
                            title="Edit Vehicle"
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn-icon-small" 
                            title="Edit Prices"
                            onClick={() => handleEditPrice(vehicle)}
                          >
                            <i className="fas fa-dollar-sign"></i>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Vehicle Details Modal */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Vehicle Details"
        size="large"
      >
        {selectedVehicle && (
          <VehicleDetails
            vehicle={selectedVehicle}
            onEdit={handleEditVehicle}
          />
        )}
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={showEditVehicleModal}
        onClose={() => {
          setShowEditVehicleModal(false)
          setSelectedVehicle(null)
        }}
        title="Edit Vehicle Details"
        size="large"
      >
        {selectedVehicle && (
          <EditVehicle
            vehicle={selectedVehicle}
            onClose={() => {
              setShowEditVehicleModal(false)
              setSelectedVehicle(null)
            }}
            onSuccess={handleVehicleUpdateSuccess}
          />
        )}
      </Modal>

      {/* Edit Price Modal */}
      <Modal
        isOpen={showEditPriceModal}
        onClose={() => {
          setShowEditPriceModal(false)
          setEditPriceData({ askingPrice: '', lastPrice: '' })
        }}
        title="Edit Vehicle Prices"
      >
        {selectedVehicle && (
          <form onSubmit={handleSavePrices}>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', marginBottom: '20px' }}>
              <strong>{selectedVehicle.vehicleNo}</strong> - {selectedVehicle.make} {selectedVehicle.model || ''}
            </div>
            <div className="form-group">
              <label>Asking Price (₹) <span className="required">*</span></label>
              <input
                type="number"
                placeholder="Enter asking price"
                value={editPriceData.askingPrice}
                onChange={(e) => setEditPriceData(prev => ({ ...prev, askingPrice: e.target.value }))}
                required
                min="0"
                step="1000"
              />
            </div>
            <div className="form-group">
              <label>Last Price (₹)</label>
              <input
                type="number"
                placeholder="Enter last price"
                value={editPriceData.lastPrice}
                onChange={(e) => setEditPriceData(prev => ({ ...prev, lastPrice: e.target.value }))}
                min="0"
                step="1000"
              />
              <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Last price is hidden by default and can be viewed with the eye icon
              </small>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i> Save Prices
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditPriceModal(false)
                  setEditPriceData({ askingPrice: '', lastPrice: '' })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Compare Modal */}
      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="Before & After Modification"
        size="large"
      >
        <div className="compare-selection">
          <div className="form-group">
            <label>Select Vehicle</label>
            <select
              value={compareVehicle}
              onChange={(e) => setCompareVehicle(e.target.value)}
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.vehicleNo} - {v.make} {v.model || ''} {v.year || ''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadCompareImages}>
            <i className="fas fa-sync"></i> Load Images
          </button>
        </div>

        {selectedVehicle && compareVehicle && (
          <div className="before-after-container" style={{ marginTop: '30px' }}>
            <div className="vehicle-header" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
              <h3>{selectedVehicle.make} {selectedVehicle.model || ''} {selectedVehicle.year || ''} - {selectedVehicle.vehicleNo}</h3>
              <span className={`badge ${getStatusBadgeClass(selectedVehicle.status)}`}>
                {selectedVehicle.status}
              </span>
            </div>

            <div className="before-after-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {/* Before Images */}
              <div className="image-section" style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                <div className="section-header" style={{ marginBottom: '15px' }}>
                  <h4><i className="fas fa-camera"></i> Before Modification</h4>
                </div>
                <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {getBeforeImages(selectedVehicle).length > 0 ? (
                    getBeforeImages(selectedVehicle).map((img, idx) => (
                      <div key={idx} className="image-item">
                        <img 
                          src={`${API_URL.replace('/api', '')}${img.imageUrl}`} 
                          alt={img.category}
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#6c757d', textTransform: 'capitalize' }}>
                          {img.category.replace('_', ' ')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6c757d', gridColumn: '1 / -1' }}>No before images uploaded</p>
                  )}
                </div>
              </div>

              {/* After Images */}
              <div className="image-section" style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                <div className="section-header" style={{ marginBottom: '15px' }}>
                  <h4><i className="fas fa-tools"></i> After Modification</h4>
                </div>
                <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {getAfterImages(selectedVehicle).length > 0 ? (
                    getAfterImages(selectedVehicle).map((img, idx) => (
                      <div key={idx} className="image-item">
                        <img 
                          src={`${API_URL.replace('/api', '')}${img.imageUrl}`} 
                          alt={img.category}
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#6c757d', textTransform: 'capitalize' }}>
                          {img.category.replace('_', ' ')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6c757d', gridColumn: '1 / -1' }}>No after images uploaded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminInventory
