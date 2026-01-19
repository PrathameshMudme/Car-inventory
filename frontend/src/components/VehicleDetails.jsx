import React, { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatVehicleNumber } from '../utils/formatUtils'
import '../styles/VehicleDetails.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const VehicleDetails = ({ vehicle, onEdit }) => {
  const [mainImage, setMainImage] = useState(0)
  const { showToast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isSalesManager = user?.role === 'sales'
  const isPurchaseManager = user?.role === 'purchase'

  if (!vehicle) {
    return <div className="vehicle-details-empty">No vehicle data available</div>
  }

  // Get images from vehicle data - sorted by stage and order for consistent display
  const vehicleImages = vehicle.images || []
  const sortedImages = [...vehicleImages].sort((a, b) => {
    // Sort by stage first (after images first), then by order
    if (a.stage !== b.stage) return a.stage === 'after' ? -1 : 1
    return (a.order || 0) - (b.order || 0)
  })
  const allImages = sortedImages.map(img => `${API_URL.replace('/api', '')}${img.imageUrl}`)
  
  // Fallback placeholder if no images - use data URI instead of external service
  const placeholderText = `${vehicle.make} ${vehicle.model || ''}`.trim() || 'Vehicle'
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#e2e8f0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${placeholderText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text></svg>`
  const placeholderDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg)}`
  const displayImages = allImages.length > 0 ? allImages : [placeholderDataUri]

  // Get documents from vehicle data
  const vehicleDocuments = vehicle.documents || []

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'badge-success'
      case 'On Modification': return 'badge-warning'
      case 'Reserved': return 'badge-purple'
      case 'Sold': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  return (
    <div className="vehicle-details-grid">
      {isAdmin && onEdit && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={() => onEdit(vehicle)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fas fa-edit"></i>
            Edit Vehicle Details
          </button>
        </div>
      )}
      <div className="vehicle-images-section">
        <div className="main-image">
          <img src={displayImages[mainImage]} alt={`${vehicle.make} ${vehicle.model || ''}`} />
          <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
            {vehicle.status}
          </span>
        </div>
        {displayImages.length > 1 && (
          <div className="thumbnail-grid">
            {displayImages.slice(0, 6).map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`View ${index + 1}`}
                onClick={() => setMainImage(index)}
                className={mainImage === index ? 'active' : ''}
              />
            ))}
          </div>
        )}
        {vehicleImages.length === 0 && (
          <div className="no-images-message">
            <i className="fas fa-camera"></i>
            <p>No images uploaded yet</p>
          </div>
        )}
      </div>
      <div className="vehicle-info-section">
        <h3><i className="fas fa-car"></i> Basic Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Vehicle Number</label>
            <strong>{formatVehicleNumber(vehicle.vehicleNo)}</strong>
          </div>
          <div className="info-item">
            <label>Chassis Number</label>
            <strong>{vehicle.chassisNo || 'N/A'}</strong>
          </div>
          <div className="info-item">
            <label>Make</label>
            <strong>{vehicle.make}</strong>
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

        {/* Financial Details - Hidden for Purchase Managers */}
        {!isPurchaseManager && (
          <>
            <h3><i className="fas fa-rupee-sign"></i> Financial Details</h3>
            <div className="info-grid">
              {isAdmin && vehicle.purchasePrice !== undefined && (
                <div className="info-item">
                  <label>Purchase Price</label>
                  <strong>{formatPrice(vehicle.purchasePrice)}</strong>
                </div>
              )}
              {!isPurchaseManager && vehicle.askingPrice && (
                <div className="info-item">
                  <label>Asking Price</label>
                  <strong>{formatPrice(vehicle.askingPrice)}</strong>
                </div>
              )}
              {/* Purchase Date - Admin and Sales only (Purchase Managers see it in Basic Information) */}
              {!isPurchaseManager && (
                <div className="info-item">
                  <label>Purchase Date</label>
                  <strong>{formatDate(vehicle.purchaseDate)}</strong>
                </div>
              )}
              {!isSalesManager && !isPurchaseManager && (
                <>
                  <div className="info-item">
                    <label>Payment Method</label>
                    <strong>{vehicle.paymentMethod || 'N/A'}</strong>
                  </div>
                  <div className="info-item">
                    <label>Agent Commission</label>
                    <strong>{formatPrice(vehicle.agentCommission, true)}</strong>
                  </div>
                  {vehicle.agentPhone && (
                    <div className="info-item">
                      <label>Agent Phone</label>
                      <strong>{vehicle.agentPhone}</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {!isSalesManager && !isPurchaseManager && (vehicle.sellerName || vehicle.agentName || vehicle.dealerName) && (
          <>
            <h3><i className="fas fa-user-tie"></i> Seller / Agent</h3>
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
                  <div className="info-item">
                    <label>Agent Phone</label>
                    <strong>{vehicle.agentPhone || vehicle.dealerPhone || 'N/A'}</strong>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <h3><i className="fas fa-folder-open"></i> Documents 
          {vehicle.missingDocuments?.length > 0 && (
            <span className="missing-docs-badge">
              {vehicle.missingDocuments.length} Missing
            </span>
          )}
        </h3>
        {vehicleDocuments.length > 0 ? (
          <div className="document-list">
            {vehicleDocuments.map((doc, index) => (
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
            <p>No documents uploaded yet</p>
          </div>
        )}

        {vehicle.missingDocuments?.length > 0 && (
          <div className="missing-documents">
            <h4>Missing Documents:</h4>
            <div className="missing-list">
              {vehicle.missingDocuments.map((docType, index) => (
                <span key={index} className="missing-doc-tag">
                  <i className={getDocumentIcon(docType)}></i>
                  {getDocumentLabel(docType)}
                </span>
              ))}
            </div>
          </div>
        )}

        {vehicle.notes && (
          <div className="vehicle-notes">
            <h3><i className="fas fa-sticky-note"></i> Notes</h3>
            <p>{vehicle.notes}</p>
          </div>
        )}

        <div className="vehicle-meta">
          <small>
            Added by: {vehicle.createdBy?.name || 'Unknown'} | 
            Created: {formatDate(vehicle.createdAt)}
            {vehicle.modifiedBy && ` | Modified by: ${vehicle.modifiedBy.name}`}
          </small>
        </div>
      </div>
    </div>
  )
}

export default VehicleDetails
