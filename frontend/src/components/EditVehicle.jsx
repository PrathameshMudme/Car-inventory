import React, { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import '../styles/AddVehicle.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const EditVehicle = ({ vehicle, onClose, onSuccess }) => {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    fuelType: 'Petrol',
    kilometers: '',
    purchasePrice: '',
    askingPrice: '',
    lastPrice: '',
    purchaseDate: '',
    paymentMethod: '',
    agentCommission: '',
    sellerName: '',
    sellerContact: '',
    dealerName: '',
    dealerPhone: '',
    notes: '',
    status: 'On Modification'
  })

  const [documents, setDocuments] = useState({
    insurance: [],
    rc: [],
    bank_noc: [],
    kyc: [],
    tt_form: [],
    papers_on_hold: [],
    puc: [],
    service_record: [],
    other: []
  })

  const [images, setImages] = useState({
    front: [],
    back: [],
    right_side: [],
    left_side: [],
    interior: [],
    engine: []
  })

  useEffect(() => {
    if (vehicle) {
      // Populate form with existing vehicle data
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || 'Petrol',
        kilometers: vehicle.kilometers || '',
        purchasePrice: vehicle.purchasePrice || '',
        askingPrice: vehicle.askingPrice || '',
        lastPrice: vehicle.lastPrice || '',
        purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toISOString().split('T')[0] : '',
        paymentMethod: vehicle.paymentMethod || '',
        agentCommission: vehicle.agentCommission || '',
        sellerName: vehicle.sellerName || '',
        sellerContact: vehicle.sellerContact || '',
        dealerName: vehicle.dealerName || '',
        dealerPhone: vehicle.dealerPhone || '',
        notes: vehicle.notes || '',
        status: vehicle.status || 'On Modification'
      })

      // Group existing documents by type (store as objects, not files)
      const existingDocs = {}
      const docTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record', 'other']
      docTypes.forEach(type => {
        existingDocs[type] = (vehicle.documents || []).filter(doc => doc.documentType === type)
      })
      setDocuments(existingDocs)
    }
  }, [vehicle])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, docType) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const docTypeConfig = documentTypes.find(d => d.key === docType)
    
    if (docTypeConfig.multiple) {
      setDocuments(prev => ({
        ...prev,
        [docType]: [...(prev[docType] || []), ...files]
      }))
      showToast(`${files.length} file(s) added for ${docTypeConfig.label}`, 'success')
    } else {
      setDocuments(prev => ({
        ...prev,
        [docType]: [files[0]]
      }))
      showToast(`${docTypeConfig.label} file added`, 'success')
    }
    
    // Reset input
    e.target.value = ''
  }

  const handleImageChange = (e, category) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const imageObjects = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setImages(prev => ({
      ...prev,
      [category]: [...prev[category], ...imageObjects]
    }))
    showToast(`${files.length} image(s) added for ${category}`, 'success')
    
    // Reset input
    e.target.value = ''
  }

  const removeDocument = (docType, index) => {
    setDocuments(prev => {
      const newDocs = [...prev[docType]]
      const removedDoc = newDocs[index]
      newDocs.splice(index, 1)
      const docTypeConfig = documentTypes.find(d => d.key === docType)
      if (removedDoc instanceof File) {
        showToast(`${docTypeConfig?.label || docType} removed`, 'info')
      }
      return { ...prev, [docType]: newDocs }
    })
  }

  const removeImage = (category, index) => {
    setImages(prev => {
      const newImages = [...prev[category]]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      showToast(`Image removed from ${category}`, 'info')
      return { ...prev, [category]: newImages }
    })
  }

  const documentTypes = [
    { key: 'insurance', label: 'Insurance Certificate', multiple: false },
    { key: 'rc', label: 'RC Book', multiple: false },
    { key: 'bank_noc', label: 'Bank NOC', multiple: false },
    { key: 'kyc', label: 'KYC Documents', multiple: true },
    { key: 'tt_form', label: 'TT Form', multiple: false },
    { key: 'papers_on_hold', label: 'Papers on Hold', multiple: true },
    { key: 'puc', label: 'PUC Certificate', multiple: false },
    { key: 'service_record', label: 'Service Records', multiple: true },
    { key: 'other', label: 'Other Documents', multiple: true }
  ]

  const imageCategories = [
    { key: 'front', label: 'Front View' },
    { key: 'back', label: 'Back View' },
    { key: 'right_side', label: 'Right Side' },
    { key: 'left_side', label: 'Left Side' },
    { key: 'interior', label: 'Interior' },
    { key: 'engine', label: 'Engine' }
  ]

  const fuelTypeOptions = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
  const paymentMethodOptions = ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment']
  const statusOptions = ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key])
        }
      })

      // Add new images
      imageCategories.forEach(category => {
        const categoryImages = images[category.key] || []
        categoryImages.forEach((imgObj) => {
          const fieldName = category.key === 'right_side' ? 'right_side_images' :
                           category.key === 'left_side' ? 'left_side_images' :
                           `${category.key}_images`
          formDataToSend.append(fieldName, imgObj.file)
        })
      })

      // Add new documents (only File objects, not server document objects)
      documentTypes.forEach(docType => {
        const files = documents[docType.key] || []
        // Only add new files (File instances), not existing server documents
        files.forEach(file => {
          if (file instanceof File) {
            formDataToSend.append(docType.key, file)
          }
        })
      })

      const response = await fetch(`${API_URL}/vehicles/${vehicle._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update vehicle')
      }

      showToast('Vehicle updated successfully!', 'success')
      if (onSuccess) {
        onSuccess(data.vehicle)
      }
      onClose()
    } catch (error) {
      console.error('Error updating vehicle:', error)
      showToast(error.message || 'Failed to update vehicle', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!vehicle) {
    return <div>No vehicle data available</div>
  }

  return (
    <div className="add-vehicle-container">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3><i className="fas fa-car"></i> Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Vehicle Number</label>
              <input
                type="text"
                value={vehicle.vehicleNo}
                disabled
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
              <small style={{ color: '#6c757d' }}>Vehicle number cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Chassis Number</label>
              <input
                type="text"
                value={vehicle.chassisNo || ''}
                disabled
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Make <span className="required">*</span></label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Fuel Type</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
              >
                {fuelTypeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Kilometers</label>
              <input
                type="text"
                name="kilometers"
                value={formData.kilometers}
                onChange={handleInputChange}
                placeholder="e.g., 50000 km"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><i className="fas fa-rupee-sign"></i> Financial Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Purchase Price (₹)</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
            <div className="form-group">
              <label>Asking Price (₹)</label>
              <input
                type="number"
                name="askingPrice"
                value={formData.askingPrice}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
            <div className="form-group">
              <label>Last Price (₹)</label>
              <input
                type="number"
                name="lastPrice"
                value={formData.lastPrice}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
              >
                <option value="">Select payment method</option>
                {paymentMethodOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Agent Commission (₹)</label>
              <input
                type="number"
                name="agentCommission"
                value={formData.agentCommission}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><i className="fas fa-user-tie"></i> Seller / Dealer Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Seller Name</label>
              <input
                type="text"
                name="sellerName"
                value={formData.sellerName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Seller Contact</label>
              <input
                type="text"
                name="sellerContact"
                value={formData.sellerContact}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Dealer Name</label>
              <input
                type="text"
                name="dealerName"
                value={formData.dealerName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Dealer Phone</label>
              <input
                type="text"
                name="dealerPhone"
                value={formData.dealerPhone}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><i className="fas fa-camera"></i> Additional Images (After Modification)</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px', fontSize: '14px' }}>
            Upload additional images to show after modification. Existing images will be preserved.
          </p>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {imageCategories.map(category => (
              <div key={category.key} className="form-group">
                <label>{category.label}</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageChange(e, category.key)}
                  style={{ padding: '8px' }}
                />
                {images[category.key]?.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {images[category.key].map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={img.preview}
                          alt={`${category.label} ${idx + 1}`}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(category.key, idx)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>
            <i className="fas fa-folder-open"></i> Documents
            {vehicle.missingDocuments?.length > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '14px', color: '#ff9800', fontWeight: 'normal' }}>
                ({vehicle.missingDocuments.length} missing: {vehicle.missingDocuments.join(', ')})
              </span>
            )}
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '20px', fontSize: '14px' }}>
            Upload missing documents. Existing documents will be preserved.
          </p>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {documentTypes.map(docType => {
              const allDocs = documents[docType.key] || []
              const serverDocs = allDocs.filter(doc => doc && typeof doc === 'object' && doc.documentUrl)
              const newFiles = allDocs.filter(doc => doc instanceof File)
              
              return (
                <div key={docType.key} className="form-group">
                  <label>
                    {docType.label}
                    {vehicle.missingDocuments?.includes(docType.key) && (
                      <span style={{ color: '#ff9800', marginLeft: '5px' }}>⚠ Missing</span>
                    )}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    multiple={docType.multiple}
                    onChange={(e) => handleFileChange(e, docType.key)}
                    style={{ padding: '8px' }}
                  />
                  {serverDocs.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#28a745' }}>
                      <i className="fas fa-check-circle"></i> {serverDocs.length} existing file(s) on server
                    </div>
                  )}
                  {newFiles.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {newFiles.map((file, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#e3f2fd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                          <button
                            type="button"
                            onClick={() => {
                              const currentDocs = documents[docType.key] || []
                              const updatedDocs = currentDocs.filter((_, index) => index !== serverDocs.length + idx)
                              setDocuments(prev => ({ ...prev, [docType.key]: updatedDocs }))
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '0',
                              marginLeft: '5px'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="form-section">
          <h3><i className="fas fa-sticky-note"></i> Notes</h3>
          <div className="form-group">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
              placeholder="Additional notes about the vehicle..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Update Vehicle
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditVehicle
