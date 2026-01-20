import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import {
  Box,
  Grid,
  Alert,
  Chip,
  Typography,
  Button,
  IconButton,
  Paper,
} from '@mui/material'
import {
  Delete as DeleteIcon,
} from '@mui/icons-material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  StickyNote2 as NoteIcon,
  CameraAlt as CameraIcon,
  FolderOpen as FolderIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon
} from '@mui/icons-material'
import {
  LoadingState,
  EmptyState,
  DataTable,
  StatusBadge
} from '../common'
import {
  FormSectionHeader,
  FormTextField,
  FormActions,
  SectionCard,
  VehicleImageDropzone,
  VehicleDocumentDropzone,
  ActionButton
} from '../forms'
import {
  IMAGE_CATEGORIES,
  DOCUMENT_TYPES
} from '../../utils/vehicleFormConstants'
import { captureImageFromCamera } from '../../utils/cameraCapture'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Image slots for after-modification images
// Order: 0=Front, 1=Back, 2=Right, 3=Left, 4=Interior 1, 5=Interior 2, 6=Engine, 7+=Other
const IMAGE_SLOTS = [
  { key: 'front', fieldName: 'front_images', order: 0, maxCount: 1 },
  { key: 'back', fieldName: 'back_images', order: 1, maxCount: 1 },
  { key: 'right_side', fieldName: 'right_side_images', order: 2, maxCount: 1 },
  { key: 'left_side', fieldName: 'left_side_images', order: 3, maxCount: 1 },
  { key: 'interior', fieldName: 'interior_images', order: 4, maxCount: 1 },
  { key: 'interior_2', fieldName: 'interior_2_images', order: 5, maxCount: 1 },
  { key: 'engine', fieldName: 'engine_images', order: 6, maxCount: 1 },
  { key: 'other', fieldName: 'other_images', order: 7, maxCount: 10 }
]

// Reusable File Preview Component (keeping for now as it's specific to this component)
const FilePreviewItem = ({ name, onView, onDelete, isNew = false }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.75,
    p: 0.75,
    mb: 0.5,
    borderRadius: 1,
    bgcolor: isNew ? '#f0fdf4' : '#f8f9fa',
    minHeight: 28
  }}>
    <DescriptionIcon sx={{ 
      fontSize: 12, 
      color: isNew ? '#16a34a' : '#64748b', 
      flexShrink: 0 
    }} />
    <Box component="span" sx={{ 
      flex: 1, 
      color: '#475569', 
      fontSize: '10px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      minWidth: 0
    }}>
      {name}
    </Box>
    {onView && (
      <Box
        component="button"
        onClick={onView}
        sx={{ 
          width: 22, 
          height: 22,
          flexShrink: 0,
          color: '#667eea',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': { bgcolor: '#f0f4ff' },
          p: 0.5
        }}
      >
        <VisibilityIcon sx={{ fontSize: 12 }} />
      </Box>
    )}
    {onDelete && (
      <Box
        component="button"
        onClick={onDelete}
        sx={{ 
          width: 22, 
          height: 22,
          flexShrink: 0,
          color: '#ef4444',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': { bgcolor: '#fee' },
          p: 0.5
        }}
      >
        <DeleteIcon sx={{ fontSize: 20 }} />
      </Box>
    )}
  </Box>
)

const AdminActionRequired = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    askingPrice: '',
    lastPrice: '',
    modificationCost: '',
    modificationNotes: '',
    agentPhone: '',
    agentCommission: '',
    otherCost: '',
    otherCostNotes: ''
  })
  const [postModificationImages, setPostModificationImages] = useState({
    front: [], back: [], right_side: [], left_side: [],
    interior: [], interior_2: [], engine: [], other: []
  })
  const [documents, setDocuments] = useState({})
  const [newDocuments, setNewDocuments] = useState({})
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (token) loadVehicles()
    else setLoading(false)
  }, [token])

  const loadVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicles?status=On Modification`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load vehicles')
      setVehicles((await response.json()) || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles pending modification', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData({
      askingPrice: vehicle.askingPrice || '',
      lastPrice: vehicle.lastPrice || '',
      modificationCost: vehicle.modificationCost !== null && vehicle.modificationCost !== undefined ? vehicle.modificationCost.toString() : '',
      modificationNotes: vehicle.modificationNotes || '',
      agentPhone: vehicle.agentPhone || '',
      agentCommission: vehicle.agentCommission !== null && vehicle.agentCommission !== undefined ? vehicle.agentCommission.toString() : ''
    })
    setPostModificationImages({
      front: [], back: [], right_side: [], left_side: [],
      interior: [], interior_2: [], engine: [], other: []
    })
    
    // Load existing documents
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicle._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const vehicleData = await response.json()
        const docsByType = {}
        if (vehicleData.documents) {
          vehicleData.documents.forEach(doc => {
            if (!docsByType[doc.documentType]) docsByType[doc.documentType] = []
            docsByType[doc.documentType].push(doc)
          })
        }
        setDocuments(docsByType)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
    
    setNewDocuments({})
    setShowEditModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const onImageDrop = useCallback((category, acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    const maxCount = category === 'other' ? 10 : 1
    const filesToAdd = acceptedFiles.slice(0, maxCount)
    setPostModificationImages(prev => ({
      ...prev,
      [category]: category === 'other' 
        ? [...(prev[category] || []), ...filesToAdd]
        : filesToAdd
    }))
    showToast(`${filesToAdd.length} image(s) added`, 'success')
  }, [showToast])

  const removeImage = useCallback((category, index) => {
    setPostModificationImages(prev => {
      const newImages = [...prev[category]]
      const removedImage = newImages[index]
      newImages.splice(index, 1)
      if (removedImage?.preview) URL.revokeObjectURL(removedImage.preview)
      showToast(`Image removed from ${category}`, 'info')
      return { ...prev, [category]: newImages }
    })
  }, [showToast])

  const handleDocumentDrop = useCallback((docType, acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    const docConfig = DOCUMENT_TYPES.find(d => d.key === docType)
    const filesToAdd = docConfig.multiple ? acceptedFiles : [acceptedFiles[0]]
    setNewDocuments(prev => ({
      ...prev,
      [docType]: docConfig.multiple 
        ? [...(prev[docType] || []), ...filesToAdd]
        : filesToAdd
    }))
    showToast(`${filesToAdd.length} document(s) added`, 'success')
  }, [showToast])

  const removeDocument = useCallback((docType, index) => {
    setNewDocuments(prev => {
      const newDocs = [...(prev[docType] || [])]
      newDocs.splice(index, 1)
      return { ...prev, [docType]: newDocs }
    })
    showToast('Document removed', 'info')
  }, [showToast])

  const handleCameraCapture = async (category) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      const cameraModal = document.createElement('div')
      cameraModal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 10000;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      `
      
      const videoContainer = document.createElement('div')
      videoContainer.style.cssText = 'position: relative; max-width: 90%; max-height: 70%;'
      video.style.cssText = 'width: 100%; height: auto; max-height: 70vh;'
      videoContainer.appendChild(video)
      
      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = 'margin-top: 20px; display: flex; gap: 10px;'
      
      const captureBtn = document.createElement('button')
      captureBtn.textContent = 'Capture'
      captureBtn.style.cssText = 'padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;'
      
      const cancelBtn = document.createElement('button')
      cancelBtn.textContent = 'Cancel'
      cancelBtn.style.cssText = 'padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;'
      
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onImageDrop(category, [file])
          stream.getTracks().forEach(track => track.stop())
          document.body.removeChild(cameraModal)
          showToast('Image captured successfully', 'success')
        }, 'image/jpeg', 0.9)
      }
      
      cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop())
        document.body.removeChild(cameraModal)
      }
      
      buttonContainer.appendChild(captureBtn)
      buttonContainer.appendChild(cancelBtn)
      cameraModal.appendChild(videoContainer)
      cameraModal.appendChild(buttonContainer)
      document.body.appendChild(cameraModal)
    } catch (error) {
      console.error('Camera error:', error)
      showToast('Camera access denied or not available', 'error')
    }
  }

  // Note: VehicleDocumentDropzone doesn't handle existing vs new documents separately
  // So we need a custom wrapper for this specific use case
  const DocumentDropzoneWrapper = ({ docType, label, multiple }) => {
    const existingDocs = documents[docType] || []
    const newDocs = newDocuments[docType] || []
    const allDocs = [...existingDocs.map(d => ({ ...d, isExisting: true })), ...newDocs.map(f => ({ file: f, isNew: true }))]
    const isMissing = selectedVehicle?.missingDocuments?.includes(docType)

    return (
      <Box sx={{ width: '100%' }}>
        <VehicleDocumentDropzone
          docType={docType}
          label={label}
          icon={DOCUMENT_TYPES.find(d => d.key === docType)?.icon || '📄'}
          multiple={multiple}
          documents={allDocs}
          onDrop={handleDocumentDrop}
          onRemove={removeDocument}
          isMissing={isMissing}
        />
        {/* Show existing and new documents separately */}
        {existingDocs.length > 0 && (
          <Box sx={{ mt: 1.5, maxHeight: 120, overflowY: 'auto' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px', mb: 0.5, display: 'block', fontWeight: 600 }}>
              Uploaded:
            </Typography>
            {existingDocs.map((doc, idx) => (
              <FilePreviewItem
                key={idx}
                name={doc.documentName || `${label} ${idx + 1}`}
                onView={(e) => {
                  e.stopPropagation()
                  window.open(`${API_URL.replace('/api', '')}${doc.documentUrl}`, '_blank')
                }}
              />
            ))}
          </Box>
        )}
        {newDocs.length > 0 && (
          <Box sx={{ mt: 1, maxHeight: 120, overflowY: 'auto' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px', mb: 0.5, display: 'block', fontWeight: 600 }}>
              New:
            </Typography>
            {newDocs.map((file, idx) => (
              <FilePreviewItem
                key={idx}
                name={file.name}
                onDelete={(e) => {
                  e.stopPropagation()
                  removeDocument(docType, idx)
                }}
                isNew
              />
            ))}
          </Box>
        )}
      </Box>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedVehicle) {
      showToast('No vehicle selected', 'error')
      return
    }

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        // Handle payment fields (modificationCost, agentCommission, otherCost) - send 0 for empty values (for calculations)
        if (key === 'modificationCost' || key === 'agentCommission' || key === 'otherCost') {
          if (value === '' || value === null || value === undefined || value === 'NIL') {
            formDataToSend.append(key, '0') // Send 0 for calculations
          } else {
            const numValue = parseFloat(value)
            formDataToSend.append(key, isNaN(numValue) ? '0' : numValue.toString())
          }
        } else if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value)
        }
      })
      
      // Add post-modification images
      // Note: Order is calculated on backend from IMAGE_SLOTS array, no need to send it
      IMAGE_SLOTS.forEach(slot => {
        const images = postModificationImages[slot.key] || []
        const imagesToUpload = slot.maxCount === 1 ? images.slice(0, 1) : images
        imagesToUpload.forEach((file) => {
          formDataToSend.append(slot.fieldName, file)
        })
      })

      // Add new documents
      Object.entries(newDocuments).forEach(([docType, files]) => {
        if (files?.length > 0) {
          files.forEach(file => formDataToSend.append(docType, file))
        }
      })

      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update vehicle')
      }

      const result = await response.json()
      
      // Show appropriate message based on status change
      if (result.vehicle && result.vehicle.status === 'In Stock') {
        showToast(result.message || 'Vehicle updated successfully! Status changed to "In Stock" as all modification fields are complete.', 'success')
      } else {
        showToast('Vehicle updated successfully! Complete all required fields to change status to "In Stock".', 'success')
      }
      
      setShowEditModal(false)
      setSelectedVehicle(null)
      setDocuments({})
      setNewDocuments({})
      
      // Reload vehicles to refresh the list (vehicle will disappear if status changed to "In Stock")
      await loadVehicles()
    } catch (error) {
      console.error('Error updating vehicle:', error)
      showToast(error.message || 'Failed to update vehicle', 'error')
    }
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return 'NIL'
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)}Cr`
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
    return `₹${price.toLocaleString('en-IN')}`
  }

  const missingDocsLabel = useMemo(() => {
    if (!selectedVehicle?.missingDocuments?.length) return 'All documents uploaded'
    return `${selectedVehicle.missingDocuments.length} document(s) missing: ${
      selectedVehicle.missingDocuments.map(doc => {
        const docConfig = DOCUMENT_TYPES.find(d => d.key === doc)
        return docConfig ? docConfig.label : doc
      }).join(', ')
    }`
  }, [selectedVehicle?.missingDocuments])

  if (loading) {
    return <LoadingState message="Loading vehicles pending modification..." />
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2> Action Required</h2>
          <p>Vehicles pending modification completion ({vehicles.length} vehicles)</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadVehicles} title="Refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<i className="fas fa-check-circle" style={{ fontSize: 64, color: '#27ae60' }} />}
          title="No Vehicles Pending Modification"
          message="All vehicles have been processed"
        />
      ) : (
        <DataTable
            columns={[
            { 
              key: 'vehicleNo', 
              label: 'Vehicle No.', 
              render: (v) => <strong>{formatVehicleNumber(v.vehicleNo) || 'N/A'}</strong> 
            },
            { 
              key: 'makeModel', 
              label: 'Company/Model', 
              render: (v) => `${v.company || 'N/A'} ${v.model || ''}`.trim() 
            },
            { 
              key: 'purchasePrice', 
              label: 'Purchase Price', 
              render: (v) => formatPrice(v.purchasePrice) 
            },
            {
              key: 'missingFields',
              label: 'Missing Fields',
              render: (v) => {
                const missingFields = []
                if (!v.askingPrice || parseFloat(v.askingPrice) <= 0) missingFields.push('Asking Price')
                if (!v.lastPrice || parseFloat(v.lastPrice) <= 0) missingFields.push('Last Price')
                if (!v.modificationCost || v.modificationCost === 0) missingFields.push('Modification Cost')
                if (!v.modificationNotes || !v.modificationNotes.trim()) missingFields.push('Modification Notes')
                if (!v.agentPhone || !v.agentPhone.trim()) missingFields.push('Agent Phone')
                if (!v.agentCommission || v.agentCommission === 0) missingFields.push('Agent Commission')
                return (
                  <span style={{ color: missingFields.length > 0 ? '#dc3545' : '#28a745' }}>
                    {missingFields.length > 0 ? missingFields.join(', ') : 'All fields complete'}
                  </span>
                )
              }
            },
            {
              key: 'actions',
              label: 'Action',
              align: 'center',
              render: (v) => (
                <ActionButton
                  icon={<i className="fas fa-edit" />}
                  onClick={() => handleEdit(v)}
                  title="Complete Modification"
                  color="primary"
                />
              )
            }
          ]}
          data={vehicles}
          loading={false}
          emptyMessage="No vehicles require modification completion"
        />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedVehicle(null)
          setDocuments({})
          setNewDocuments({})
        }}
        title="Complete Vehicle Modification"
        size="xlarge"
      >
        {selectedVehicle && (
          <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
            {/* Vehicle Information Header */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 4, 
                mt: 4,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                border: '1px solid #667eea30'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <CarIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 700, fontSize: '22px', mb: 0.5 }}>
                    {formatVehicleNumber(selectedVehicle.vehicleNo) || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', fontSize: '15px' }}>
                    {selectedVehicle.company || 'N/A'} {selectedVehicle.model || ''} • Purchase: {formatPrice(selectedVehicle.purchasePrice)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mt: 1.5, pl: 1 }}>
                Complete the modification details below to mark this vehicle as ready for sale
              </Typography>
            </Paper>

            {/* Pricing & Details */}
            <SectionCard>
              <FormSectionHeader 
                icon={MoneyIcon}
                title="Pricing & Details"
              />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Asking Price (₹)"
                    name="askingPrice"
                    type="number"
                    value={formData.askingPrice}
                    onChange={handleInputChange}
                    placeholder="Enter asking price"
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Last Price (₹)"
                    name="lastPrice"
                    type="number"
                    value={formData.lastPrice}
                    onChange={handleInputChange}
                    placeholder="Enter last price"
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Modification Cost (₹)"
                    name="modificationCost"
                    type="number"
                    value={formData.modificationCost}
                    onChange={handleInputChange}
                    placeholder="NIL"
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Agent Commission (₹)"
                    name="agentCommission"
                    type="number"
                    value={formData.agentCommission}
                    onChange={handleInputChange}
                    placeholder="NIL"
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormTextField
                    label="Agent Phone"
                    name="agentPhone"
                    value={formData.agentPhone}
                    onChange={handleInputChange}
                    placeholder="Enter agent phone number"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Other Cost (₹)"
                    name="otherCost"
                    type="number"
                    value={formData.otherCost}
                    onChange={handleInputChange}
                    placeholder="NIL"
                    inputProps={{ min: 0 }}
                    helperText="Additional costs like insurance, registration, etc."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Other Cost Notes"
                    name="otherCostNotes"
                    value={formData.otherCostNotes}
                    onChange={handleInputChange}
                    placeholder="e.g., Insurance ₹5000, Registration ₹2000"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            {/* Modification Notes */}
            <SectionCard>
              <FormSectionHeader 
                icon={NoteIcon}
                title="Modification Notes"
              />
              <FormTextField
                label="Modification Notes"
                name="modificationNotes"
                value={formData.modificationNotes}
                onChange={handleInputChange}
                placeholder="Enter detailed modification notes..."
                required
                multiline
                rows={5}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </SectionCard>

            {/* Post-Modification Images */}
            <SectionCard>
              <FormSectionHeader 
                icon={CameraIcon}
                title="Post-Modification Images"
                subtitle="Upload images for each category. Missing images are optional."
              />
              <Grid container spacing={2}>
                {IMAGE_CATEGORIES.map(category => (
                  <Grid item xs={6} sm={4} md={3} key={category.key}>
                    <VehicleImageDropzone
                      category={category.key}
                      label={category.label}
                      images={postModificationImages[category.key] || []}
                      onDrop={onImageDrop}
                      onRemove={removeImage}
                      onCameraCapture={handleCameraCapture}
                    />
                  </Grid>
                ))}
              </Grid>
            </SectionCard>

            {/* Documents Section */}
            <SectionCard>
              <FormSectionHeader 
                icon={FolderIcon}
                title="Vehicle Documents"
                subtitle={missingDocsLabel}
              />
              
              {selectedVehicle?.missingDocuments?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
                  <Box component="span" sx={{ fontSize: '13px' }}>
                    <strong>Missing Documents:</strong> {selectedVehicle.missingDocuments.map(doc => {
                      const docConfig = DOCUMENT_TYPES.find(d => d.key === doc)
                      return docConfig ? docConfig.label : doc
                    }).join(', ')}
                  </Box>
                </Alert>
              )}

              <Grid container spacing={2}>
                {DOCUMENT_TYPES.map(docType => {
                  const isMissing = selectedVehicle?.missingDocuments?.includes(docType.key)
                  const existingDocs = documents[docType.key] || []
                  const newDocs = newDocuments[docType.key] || []
                  const allDocs = [...existingDocs, ...newDocs]
                  
                  return (
                    <Grid item xs={6} sm={4} md={3} key={docType.key}>
                      <DocumentDropzoneWrapper
                        docType={docType.key}
                        label={docType.label}
                        multiple={docType.multiple}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            </SectionCard>

            {/* Form Actions */}
            <FormActions
              onCancel={() => {
                setShowEditModal(false)
                setSelectedVehicle(null)
                setDocuments({})
                setNewDocuments({})
              }}
              onSubmit={handleSubmit}
              submitLabel="Save & Complete Modification"
              cancelLabel="Cancel"
              loading={false}
              cancelIcon={<CancelIcon />}
              submitIcon={<SaveIcon />}
            />
          </form>
        )}
      </Modal>
    </div>
  )
}

export default AdminActionRequired
