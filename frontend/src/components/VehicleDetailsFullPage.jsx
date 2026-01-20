import React, { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatVehicleNumber } from '../utils/formatUtils'
import '../styles/VehicleDetailsFullPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const VehicleDetailsFullPage = ({ vehicle, onClose, onEdit, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isEditingChassis, setIsEditingChassis] = useState(false)
  const [chassisValue, setChassisValue] = useState('')
  const { showToast } = useToast()
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isSalesManager = user?.role === 'sales'
  const isPurchaseManager = user?.role === 'purchase'

  useEffect(() => {
    if (vehicle) {
      setChassisValue(vehicle.chassisNo || '')
    }
  }, [vehicle])

  if (!vehicle) {
    return (
      <div className="vehicle-details-fullpage">
        <div className="vehicle-details-empty">No vehicle data available</div>
      </div>
    )
  }

  // Get images from vehicle data - prioritize after-modification images, maintain order
  const vehicleImages = vehicle.images || []
  const afterImages = vehicleImages
    .filter(img => img.stage === 'after')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  const beforeImages = vehicleImages
    .filter(img => img.stage === 'before')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  
  // Use after images if available, otherwise before images
  const displayImages = afterImages.length > 0 ? afterImages : beforeImages
  const imageUrls = displayImages.map(img => `${API_URL.replace('/api', '')}${img.imageUrl}`)
  
  // Fallback placeholder if no images - use data URI instead of external service
  const placeholderText = `${vehicle.make} ${vehicle.model || ''}`.trim() || 'Vehicle'
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="1200" height="600" fill="#e2e8f0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="36" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${placeholderText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text></svg>`
  const placeholderDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg)}`
  const finalImages = imageUrls.length > 0 ? imageUrls : [placeholderDataUri]

  // Get documents from vehicle data - filter for Sales role
  const vehicleDocuments = vehicle.documents || []
  const allowedDocTypes = isSalesManager ? ['rc', 'bank_noc', 'insurance'] : null
  const filteredDocuments = allowedDocTypes 
    ? vehicleDocuments.filter(doc => allowedDocTypes.includes(doc.documentType))
    : vehicleDocuments

  const formatPrice = (price, isPayment = false) => {
    if (!price || price === 0) return isPayment ? 'NIL' : 'N/A'
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

  const getDocumentIcon = (docType) => {
    const icons = {
      'insurance': 'fas fa-shield-alt',
      'rc': 'fas fa-id-card',
      'bank_noc': 'fas fa-building',
      'kyc': 'fas fa-user-check',
      'tt_form': 'fas fa-file-contract',
      'papers_on_hold': 'fas fa-folder-open',
      'puc': 'fas fa-certificate',
      'service_record': 'fas fa-wrench',
      'other': 'fas fa-file-alt'
    }
    return icons[docType] || 'fas fa-file'
  }

  const getDocumentLabel = (docType) => {
    const labels = {
      'insurance': 'Insurance Certificate',
      'rc': 'RC Book',
      'bank_noc': 'Bank NOC',
      'kyc': 'KYC Documents',
      'tt_form': 'TT Form',
      'papers_on_hold': 'Papers on Hold',
      'puc': 'PUC Certificate',
      'service_record': 'Service Records',
      'other': 'Other Documents'
    }
    return labels[docType] || docType
  }

  const handleDownload = (doc) => {
    const url = `${API_URL.replace('/api', '')}${doc.documentUrl}`
    window.open(url, '_blank')
    showToast(`Opening ${doc.documentName || getDocumentLabel(doc.documentType)}...`, 'info')
  }

  const handleChassisSave = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chassisNo: chassisValue.toUpperCase() })
      })

      if (!response.ok) {
        throw new Error('Failed to update chassis number')
      }

      showToast('Chassis number updated successfully', 'success')
      setIsEditingChassis(false)
      // Reload vehicle data
      if (onEdit) {
        // Trigger a refresh
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating chassis number:', error)
      showToast('Failed to update chassis number', 'error')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${formatVehicleNumber(vehicle.vehicleNo)}? This action cannot be undone.`)) {
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
      if (onDelete) {
        onDelete()
      }
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      showToast('Failed to delete vehicle', 'error')
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'badge-success'
      case 'On Modification': return 'badge-warning'
      case 'Reserved': return 'badge-purple'
      case 'Sold': return 'badge-info'
      case 'DELETED': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % finalImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + finalImages.length) % finalImages.length)
  }

  return (
    <div className="vehicle-details-fullpage">
      {/* Header with close button */}
      <div className="vehicle-details-header">
        <div className="header-left">
          <h1>{formatVehicleNumber(vehicle.vehicleNo)}</h1>
          <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
            {vehicle.status}
          </span>
        </div>
        <div className="header-actions">
          {isAdmin && onEdit && (
            <button className="btn btn-primary" onClick={() => onEdit(vehicle)}>
              <i className="fas fa-edit"></i> Edit
            </button>
          )}
          {isAdmin && onDelete && (
            <button className="btn btn-danger" onClick={handleDelete}>
              <i className="fas fa-trash"></i> Delete
            </button>
          )}
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="fas fa-times"></i> Close
            </button>
          )}
        </div>
      </div>

      {/* Image Carousel Section */}
      <div className="vehicle-carousel-section">
        <div className="carousel-container">
          {finalImages.length > 1 && (
            <button className="carousel-nav carousel-prev" onClick={prevImage}>
              <i className="fas fa-chevron-left"></i>
            </button>
          )}
          <div className="carousel-image-wrapper">
            <img 
              src={finalImages[currentImageIndex]} 
              alt={`${vehicle.company} ${vehicle.model || ''} - Image ${currentImageIndex + 1}`}
              className="carousel-main-image"
            />
            {finalImages.length > 1 && (
              <div className="carousel-indicator">
                {currentImageIndex + 1} / {finalImages.length}
              </div>
            )}
          </div>
          {finalImages.length > 1 && (
            <button className="carousel-nav carousel-next" onClick={nextImage}>
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
        </div>
        
        {/* Thumbnail Strip */}
        {finalImages.length > 1 && (
          <div className="carousel-thumbnails">
            {finalImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className={currentImageIndex === index ? 'active' : ''}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Details Content */}
      <div className="vehicle-details-content">
        <div className="details-grid">
          {/* Basic Information */}
          <div className="details-section">
            <h2><i className="fas fa-car"></i> Basic Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Vehicle Number</label>
                <strong>{formatVehicleNumber(vehicle.vehicleNo)}</strong>
              </div>
              <div className="info-item">
                <label>Chassis Number</label>
                {isAdmin && isEditingChassis ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={chassisValue}
                      onChange={(e) => setChassisValue(e.target.value)}
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      onKeyPress={(e) => e.key === 'Enter' && handleChassisSave()}
                    />
                    <button className="btn-icon-small" onClick={handleChassisSave} title="Save">
                      <i className="fas fa-check"></i>
                    </button>
                    <button className="btn-icon-small" onClick={() => {
                      setIsEditingChassis(false)
                      setChassisValue(vehicle.chassisNo || '')
                    }} title="Cancel">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <strong>{vehicle.chassisNo || 'N/A'}</strong>
                    {isAdmin && (
                      <button 
                        className="btn-icon-small" 
                        onClick={() => setIsEditingChassis(true)}
                        title="Edit Chassis Number"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="info-item">
                <label>Engine Number</label>
                <strong>{vehicle.engineNo || 'N/A'}</strong>
              </div>
              <div className="info-item">
                <label>Company</label>
                <strong>{vehicle.company}</strong>
              </div>
              <div className="info-item">
                <label>Model</label>
                <strong>{vehicle.model || 'N/A'}</strong>
              </div>
              <div className="info-item">
                <label>Year</label>
                <strong>{vehicle.year || 'N/A'}</strong>
              </div>
              <div className="info-item">
                <label>Color</label>
                <strong>{vehicle.color || 'N/A'}</strong>
              </div>
              <div className="info-item">
                <label>Fuel Type</label>
                <strong>{vehicle.fuelType || 'N/A'}</strong>
              </div>
              <div className="info-item">
                <label>Kilometers</label>
                <strong>{vehicle.kilometers ? `${vehicle.kilometers} km` : 'N/A'}</strong>
              </div>
              {/* Purchase Date - Show in Basic Information for Purchase Managers, otherwise in Financial Details */}
              {isPurchaseManager && (
                <div className="info-item">
                  <label>Purchase Date</label>
                  <strong>{formatDate(vehicle.purchaseDate)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Financial Details - Hidden for Purchase Managers */}
          {!isPurchaseManager && (
            <div className="details-section">
              <h2><i className="fas fa-rupee-sign"></i> Financial Details</h2>
              <div className="info-grid">
                {/* Purchase Price - Admin only */}
                {isAdmin && vehicle.purchasePrice !== undefined && (
                  <div className="info-item">
                    <label>Purchase Price</label>
                    <strong>{formatPrice(vehicle.purchasePrice)}</strong>
                  </div>
                )}
                {/* Asking Price - Admin only (not Sales, not Purchase Manager) */}
                {isAdmin && vehicle.askingPrice && (
                  <div className="info-item">
                    <label>Asking Price</label>
                    <strong>{formatPrice(vehicle.askingPrice)}</strong>
                  </div>
                )}
                {/* Last Price - Admin and Sales only (not Purchase Manager) */}
                {!isPurchaseManager && vehicle.lastPrice && (
                  <div className="info-item">
                    <label>Last Price</label>
                    <strong>{formatPrice(vehicle.lastPrice)}</strong>
                  </div>
                )}
                {/* Purchase Date - Admin and Sales only (Purchase Managers see it in Basic Information) */}
                {!isPurchaseManager && (
                  <div className="info-item">
                    <label>Purchase Date</label>
                    <strong>{formatDate(vehicle.purchaseDate)}</strong>
                  </div>
                )}
                {/* Payment Method - Admin only */}
                {isAdmin && vehicle.paymentMethod && (
                  <div className="info-item">
                    <label>Payment Method</label>
                    <strong>{vehicle.paymentMethod}</strong>
                  </div>
                )}
                {/* Agent Commission - Admin only */}
                {isAdmin && vehicle.agentCommission && (
                  <div className="info-item">
                    <label>Agent Commission</label>
                    <strong>{formatPrice(vehicle.agentCommission, true)}</strong>
                  </div>
                )}
                {/* Deductions Notes - Admin only */}
                {isAdmin && vehicle.deductionsNotes && (
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <label>Deductions Notes</label>
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '12px', 
                      background: '#fff3cd', 
                      borderRadius: '8px',
                      border: '1px solid #ffc107',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#856404'
                    }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                      {vehicle.deductionsNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seller & Agent Information - Admin and Purchase Manager only */}
          {!isSalesManager && (vehicle.sellerName || vehicle.agentName || vehicle.dealerName) && (
            <div className="details-section">
              <h2><i className="fas fa-user-tie"></i> Seller / Agent Information</h2>
              <div className="info-grid">
                {vehicle.sellerName && (
                  <>
                    <div className="info-item">
                      <label>Seller Name</label>
                      <strong>{vehicle.sellerName}</strong>
                    </div>
                    <div className="info-item">
                      <label>Seller Contact</label>
                      <strong>{vehicle.sellerContact || 'N/A'}</strong>
                    </div>
                  </>
                )}
                {(vehicle.agentName || vehicle.dealerName) && (
                  <>
                    <div className="info-item">
                      <label>Agent Name</label>
                      <strong>{vehicle.agentName || vehicle.dealerName}</strong>
                    </div>
                    {/* Agent Phone - Admin only (hidden from Purchase Managers) */}
                    {!isPurchaseManager && vehicle.agentPhone && (
                      <div className="info-item">
                        <label>Agent Phone</label>
                        <strong>{vehicle.agentPhone || vehicle.dealerPhone || 'N/A'}</strong>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="details-section">
            <h2>
              <i className="fas fa-folder-open"></i> Documents
              {isSalesManager && (
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                  (RC, NOC, Insurance only)
                </span>
              )}
            </h2>
            {filteredDocuments.length > 0 ? (
              <div className="document-list">
                {filteredDocuments.map((doc, index) => (
                  <div key={index} className="document-item">
                    <i className={getDocumentIcon(doc.documentType)}></i>
                    <span>{doc.documentName || getDocumentLabel(doc.documentType)}</span>
                    <button
                      className="btn-icon-small"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-documents-message">
                <i className="fas fa-file-excel"></i>
                <p>No documents available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleDetailsFullPage
