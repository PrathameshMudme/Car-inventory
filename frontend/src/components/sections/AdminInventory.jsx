import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import VehicleDetailsFullPage from '../VehicleDetailsFullPage'
import EditVehicle from '../EditVehicle'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { 
  ViewToggle,
  LoadingState,
  EmptyState,
  StatusBadge,
  DataTable
} from '../common'
import { ActionButton } from '../forms'
import { Edit as EditIcon, Delete as DeleteIcon, CompareArrows as CompareIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import '../../styles/Sections.css'
import '../../styles/main.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminInventory = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleFullPage, setShowVehicleFullPage] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false)
  const [compareVehicle, setCompareVehicle] = useState('')
  const [visibleLastPrices, setVisibleLastPrices] = useState({})
  const { showToast } = useToast()
  const { token } = useAuth()

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
    setShowVehicleFullPage(true)
  }

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleFullPage(false)
    setShowEditVehicleModal(true)
  }

  const handleDeleteVehicle = async (vehicle, e) => {
    e.stopPropagation() // Prevent row click from triggering
    
    if (!window.confirm(`Are you sure you want to delete vehicle ${vehicle.vehicleNo}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicle._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete vehicle')
      }

      showToast('Vehicle deleted successfully', 'success')
      await loadVehicles()
      
      // Close full page if viewing deleted vehicle
      if (selectedVehicle && selectedVehicle._id === vehicle._id) {
        setShowVehicleFullPage(false)
        setSelectedVehicle(null)
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      showToast('Failed to delete vehicle', 'error')
    }
  }

  const handleVehicleUpdateSuccess = async (updatedVehicle) => {
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



  const formatPrice = (price) => {
    if (!price) return 'N/A'
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getVehicleImage = (vehicle) => {
    // Get primary image or first front image (prioritize after-modification, then by order)
    const images = vehicle.images || []
    const sortedImages = [...images].sort((a, b) => {
      // Prioritize 'after' stage
      if (a.stage !== b.stage) return a.stage === 'after' ? -1 : 1
      // Then by order
      return (a.order || 0) - (b.order || 0)
    })
    
    const primaryImage = sortedImages.find(img => img.isPrimary)
    const frontImage = sortedImages.find(img => img.category === 'front')
    const firstImage = sortedImages[0] // First image by order
    
    if (primaryImage) return `${API_URL.replace('/api', '')}${primaryImage.imageUrl}`
    if (frontImage) return `${API_URL.replace('/api', '')}${frontImage.imageUrl}`
    if (firstImage) return `${API_URL.replace('/api', '')}${firstImage.imageUrl}`
    
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
    return (vehicle.images || [])
      .filter(img => img.stage === 'before')
      .sort((a, b) => (a.order || 0) - (b.order || 0)) // Maintain explicit order
  }

  const getAfterImages = (vehicle) => {
    return (vehicle.images || [])
      .filter(img => img.stage === 'after')
      .sort((a, b) => (a.order || 0) - (b.order || 0)) // Maintain explicit order
  }

  const toggleLastPriceVisibility = (vehicleId, e) => {
    e.stopPropagation() // Prevent row click from triggering
    setVisibleLastPrices(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }))
  }

  const tableColumns = [
    { key: 'vehicleNo', label: 'Vehicle No.', render: (v) => <strong>{v.vehicleNo}</strong> },
    { key: 'makeModel', label: 'Make/Model', render: (v) => `${v.make} ${v.model || ''}`.trim() },
    { key: 'year', label: 'Year', render: (v) => v.year || 'N/A' },
    { key: 'purchasePrice', label: 'Purchase Price', render: (v) => formatPrice(v.purchasePrice) },
    { key: 'askingPrice', label: 'Asking Price', render: (v) => formatPrice(v.askingPrice) },
    {
      key: 'lastPrice',
      label: 'Last Price',
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ opacity: visibleLastPrices[v._id] ? 1 : 0.3 }}>
            {visibleLastPrices[v._id] 
              ? formatPrice(v.lastPrice || v.askingPrice || v.purchasePrice) 
              : '••••••'}
          </span>
          <i
            className={`fas ${visibleLastPrices[v._id] ? 'fa-eye-slash' : 'fa-eye'}`}
            style={{ cursor: 'pointer', fontSize: '14px' }}
            title={visibleLastPrices[v._id] ? 'Hide Last Price' : 'Show Last Price'}
            onClick={(e) => toggleLastPriceVisibility(v._id, e)}
          />
        </div>
      )
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (v) => (
        <span className={v.missingDocuments?.length > 0 ? 'text-warning' : 'text-success'}>
          {v.missingDocuments?.length > 0 ? `${v.missingDocuments.length} Missing` : 'Complete'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v.status} />
    },
    ...(vehicles.some(v => v.status === 'Sold' && v.remainingAmount > 0) ? [{
      key: 'remainingAmount',
      label: 'Remaining Amount',
      render: (v) => v.status === 'Sold' && v.remainingAmount > 0 ? formatPrice(v.remainingAmount) : 'N/A'
    }] : []),
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (v) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <ActionButton
            icon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation()
              handleEditVehicle(v)
            }}
            title="Edit Vehicle"
            color="primary"
          />
          <ActionButton
            icon={<DeleteIcon />}
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteVehicle(v, e)
            }}
            title="Delete Vehicle"
            color="danger"
          />
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <h2> Vehicle Inventory</h2>
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
          <ViewToggle view={viewType} onChange={handleViewSwitch} />
          <button className="btn btn-primary" onClick={() => setShowCompareModal(true)}>
            <i className="fas fa-images"></i> Compare
          </button>
          <button className="btn btn-secondary" onClick={loadVehicles} title="Refresh">
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading vehicles..." />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<i className="fas fa-car" style={{ fontSize: 64, color: '#bdc3c7' }} />}
          title="No vehicles found"
          message="Vehicles added by purchase managers will appear here"
        />
      ) : (
        <>
          {/* Grid View */}
          {viewType === 'grid' && (
            <div className="vehicle-grid active">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle._id} className="vehicle-card">
                    <div className="vehicle-card-image">
                    <img src={getVehicleImage(vehicle)} alt={`${vehicle.make} ${vehicle.model || ''}`} />
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <StatusBadge status={vehicle.status} />
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
                      <ActionButton
                        icon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditVehicle(vehicle)
                        }}
                        title="Edit Vehicle"
                        color="primary"
                      />
                      <ActionButton
                        icon={<DeleteIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteVehicle(vehicle, e)
                        }}
                        title="Delete Vehicle"
                        color="danger"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewType === 'table' && (
            <DataTable
              columns={tableColumns}
              data={filteredVehicles}
              loading={false}
              emptyMessage="No vehicles match your criteria"
              onRowClick={handleViewDetails}
            />
          )}
        </>
      )}

      {/* Vehicle Details Full Page */}
      {showVehicleFullPage && selectedVehicle && (
        <VehicleDetailsFullPage
          vehicle={selectedVehicle}
          onClose={() => {
            setShowVehicleFullPage(false)
            setSelectedVehicle(null)
          }}
          onEdit={handleEditVehicle}
          onDelete={async () => {
            await loadVehicles()
            setShowVehicleFullPage(false)
            setSelectedVehicle(null)
          }}
        />
      )}

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
