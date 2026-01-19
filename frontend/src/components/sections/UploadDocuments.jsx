import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import VehicleDocumentDropzone from '../forms/VehicleDocumentDropzone'
import { DOCUMENT_TYPES } from '../../utils/vehicleFormConstants'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const UploadDocuments = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [existingDocuments, setExistingDocuments] = useState({})
  const [documents, setDocuments] = useState({})
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()
  const { token, user } = useAuth()

  useEffect(() => {
    loadVehicles()
  }, [token])

  useEffect(() => {
    if (selectedVehicle) {
      loadVehicleDocuments()
      // Reset documents state when vehicle changes
      setDocuments({})
      setExistingDocuments({})
    }
  }, [selectedVehicle])

  const loadVehicles = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // The backend already filters by createdBy for purchase managers
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      // Filter to only show vehicles with pending/missing documents
      const vehiclesWithPendingDocs = data.filter(vehicle => {
        const missingDocs = vehicle.missingDocuments || []
        return missingDocs.length > 0
      })
      setVehicles(vehiclesWithPendingDocs)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleDocuments = async () => {
    if (!selectedVehicle || !token) return

    try {
      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicle documents')
      }

      const data = await response.json()
      // Group existing documents by type for display
      const docsByType = {}
      if (data.documents) {
        data.documents.forEach(doc => {
          if (!docsByType[doc.documentType]) {
            docsByType[doc.documentType] = []
          }
          docsByType[doc.documentType].push(doc)
        })
      }
      setExistingDocuments(docsByType)
    } catch (error) {
      console.error('Error loading documents:', error)
      showToast('Failed to load vehicle documents', 'error')
    }
  }

  const handleDocumentDrop = (docType, acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)

    if (docTypeConfig.multiple) {
      setDocuments(prev => ({
        ...prev,
        [docType]: [...(prev[docType] || []), ...acceptedFiles]
      }))
      showToast(`${acceptedFiles.length} file(s) added for ${docTypeConfig.label}`, 'success')
    } else {
      setDocuments(prev => ({
        ...prev,
        [docType]: acceptedFiles[0]
      }))
      showToast(`${docTypeConfig.label} file selected`, 'success')
    }
  }

  const removeDocument = (docType, index = null) => {
    setDocuments(prev => {
      const newDocs = { ...prev }
      const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)
      
      if (docTypeConfig?.multiple && Array.isArray(newDocs[docType])) {
        if (index !== null) {
          // Remove specific index
          newDocs[docType] = newDocs[docType].filter((_, i) => i !== index)
          if (newDocs[docType].length === 0) {
            delete newDocs[docType]
          }
        } else {
          // Remove all
          delete newDocs[docType]
        }
      } else {
        // Single document - remove it
        delete newDocs[docType]
      }
      return newDocs
    })
    showToast('Document removed', 'info')
  }

  const handleUpload = async () => {
    if (!selectedVehicle) {
      showToast('Please select a vehicle first', 'error')
      return
    }

    // Check if any documents are selected
    const hasDocuments = Object.keys(documents).length > 0
    if (!hasDocuments) {
      showToast('Please select at least one document to upload', 'error')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      // Add documents to FormData
      Object.entries(documents).forEach(([docType, files]) => {
        if (Array.isArray(files)) {
          files.forEach(file => {
            formData.append(docType, file)
          })
        } else {
          formData.append(docType, files)
        }
      })

      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}/documents`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload documents')
      }

      const data = await response.json()
      showToast(data.message || 'Documents uploaded successfully', 'success')
      
      // Clear documents state
      setDocuments({})
      
      // Reload vehicle documents
      await loadVehicleDocuments()
      
      // Reload vehicles to update any document status
      await loadVehicles()
    } catch (error) {
      console.error('Error uploading documents:', error)
      showToast(error.message || 'Failed to upload documents', 'error')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentStatus = (vehicle) => {
    const missingDocs = vehicle.missingDocuments || []
    if (missingDocs.length === 0) return { status: 'Complete', badge: 'badge-success' }
    if (missingDocs.length <= 2) return { status: 'Partial', badge: 'badge-warning' }
    return { status: 'Incomplete', badge: 'badge-danger' }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="section-container">
        <div className="section-header">
          <h2>Upload Documents</h2>
        </div>
        <p>Loading vehicles...</p>
      </div>
    )
  }

  return (
    <div className="section-container">
      <div className="section-header">
        <h2>Upload Pending Documents</h2>
        <p>Upload missing documents for vehicles you added. Only vehicles with pending documents are shown.</p>
      </div>

      {!selectedVehicle ? (
        <div>
          {vehicles.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '64px', color: '#27ae60', marginBottom: '20px' }}></i>
              <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>All Documents Complete!</h3>
              <p style={{ color: '#7f8c8d', fontSize: '16px' }}>
                All vehicles you added have their required documents uploaded.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>
                  Vehicles with Pending Documents ({vehicles.length})
                </h3>
                <div style={{ 
                  padding: '8px 16px', 
                  background: '#fff3cd', 
                  borderRadius: '8px',
                  border: '1px solid #ffc107',
                  fontSize: '14px',
                  color: '#856404'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  {vehicles.reduce((sum, v) => sum + (v.missingDocuments?.length || 0), 0)} document(s) pending
                </div>
              </div>
              <div className="table-container">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle No</TableCell>
                      <TableCell>Make & Model</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Missing Documents</TableCell>
                      <TableCell>Added Date</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((vehicle) => {
                      const missingDocs = vehicle.missingDocuments || []
                      const docTypeLabels = {
                        'insurance': 'Insurance',
                        'rc': 'RC Book',
                        'bank_noc': 'Bank NOC',
                        'kyc': 'KYC',
                        'tt_form': 'TT Form',
                        'papers_on_hold': 'Papers on Hold',
                        'puc': 'PUC',
                        'service_record': 'Service Records',
                        'other': 'Other'
                      }
                      
                      return (
                        <TableRow key={vehicle._id}>
                          <TableCell>
                            <strong>{formatVehicleNumber(vehicle.vehicleNo)}</strong>
                          </TableCell>
                          <TableCell>
                            {vehicle.make} {vehicle.model}
                          </TableCell>
                          <TableCell>
                            <span className={`badge ${vehicle.status === 'In Stock' ? 'badge-success' : vehicle.status === 'On Modification' ? 'badge-warning' : 'badge-info'}`}>
                              {vehicle.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className="badge badge-danger" style={{ alignSelf: 'flex-start' }}>
                                {missingDocs.length} Missing
                              </span>
                              <div style={{ 
                                fontSize: '13px', 
                                color: '#666', 
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px',
                                marginTop: '4px'
                              }}>
                                {missingDocs.slice(0, 3).map(docType => (
                                  <span 
                                    key={docType}
                                    style={{
                                      padding: '2px 8px',
                                      background: '#fff3cd',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      color: '#856404'
                                    }}
                                  >
                                    {docTypeLabels[docType] || docType}
                                  </span>
                                ))}
                                {missingDocs.length > 3 && (
                                  <span style={{ fontSize: '12px', color: '#999' }}>
                                    +{missingDocs.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(vehicle.createdAt)}</TableCell>
                          <TableCell>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedVehicle(vehicle)}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                fontSize: '14px',
                                padding: '8px 16px'
                              }}
                            >
                              <i className="fas fa-upload"></i>
                              Upload
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {formatVehicleNumber(selectedVehicle.vehicleNo)} - {selectedVehicle.make} {selectedVehicle.model}
                </h3>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                  Status: <span className={`badge ${selectedVehicle.status === 'In Stock' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedVehicle.status}
                  </span>
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedVehicle(null)
                  setDocuments({})
                }}
              >
                Back to List
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              background: '#fff3cd', 
              borderRadius: '8px',
              border: '1px solid #ffc107'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#856404', fontSize: '18px' }}></i>
                <strong style={{ color: '#856404' }}>Missing Documents</strong>
              </div>
              {selectedVehicle.missingDocuments && selectedVehicle.missingDocuments.length > 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  {selectedVehicle.missingDocuments.map(docType => {
                    const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)
                    return (
                      <span 
                        key={docType}
                        style={{
                          padding: '6px 12px',
                          background: '#fff',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#856404',
                          border: '1px solid #ffc107',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {docTypeConfig?.icon || '📄'} {docTypeConfig?.label || docType}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
                  All required documents are uploaded for this vehicle.
                </p>
              )}
            </div>
            
            <h3>Upload Documents</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Select documents to upload. You can upload multiple documents for types that support it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {DOCUMENT_TYPES.map((doc) => {
                // Check if there are existing documents for this type
                const hasExisting = existingDocuments[doc.key] && existingDocuments[doc.key].length > 0
                // Check if this document is missing
                const isMissing = selectedVehicle.missingDocuments?.includes(doc.key)
                // Check if there are new documents to upload
                const hasNew = documents[doc.key] && 
                  (doc.multiple ? Array.isArray(documents[doc.key]) && documents[doc.key].length > 0 : documents[doc.key])
                
                // Prioritize missing documents - show them first
                const priority = isMissing ? 0 : (hasExisting ? 2 : 1)
                
                return (
                  <div key={doc.key} style={{ order: priority }}>
                    <VehicleDocumentDropzone
                      docType={doc.key}
                      label={doc.label}
                      icon={doc.icon}
                      multiple={doc.multiple}
                      documents={doc.multiple 
                        ? (Array.isArray(documents[doc.key]) ? documents[doc.key] : [])
                        : (documents[doc.key] || null)
                      }
                      onDrop={handleDocumentDrop}
                      onRemove={removeDocument}
                      isMissing={isMissing && !hasExisting}
                    />
                    {hasExisting && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '0.85em', 
                        color: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="fas fa-check-circle"></i>
                        {existingDocuments[doc.key].length} existing document(s)
                      </div>
                    )}
                    {isMissing && !hasExisting && !hasNew && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '0.85em', 
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="fas fa-exclamation-circle"></i>
                        Required
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedVehicle(null)
                setDocuments({})
              }}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || Object.keys(documents).length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadDocuments
