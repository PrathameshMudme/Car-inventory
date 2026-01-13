import React, { useState, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Paper,
  Alert,
  Stack,
  useTheme,
  CircularProgress,
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CameraAlt as CameraIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Autocomplete from '@mui/material/Autocomplete'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AddVehicle = () => {
  const theme = useTheme()
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [savedVehicle, setSavedVehicle] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = user?.role === 'admin'

  const [formData, setFormData] = useState({
    vehicleNo: '',
    chassisNo: '',
    make: '',
    model: '',
    year: '',
    color: '',
    fuelType: 'Petrol',
    kilometers: '',
    purchasePrice: '',
    askingPrice: '',
    purchaseDate: null,
    paymentMethod: '',
    agentCommission: '',
    sellerName: '',
    sellerContact: '',
    dealerName: '',
    dealerPhone: '',
    notes: ''
  })

  const [images, setImages] = useState({
    front: [],
    back: [],
    right_side: [],
    left_side: [],
    interior: [],
    engine: []
  })

  const [documents, setDocuments] = useState({
    insurance: null,
    rc: null,
    bank_noc: null,
    kyc: [],
    tt_form: null,
    papers_on_hold: [],
    puc: null,
    service_record: [],
    other: []
  })

  const imageCategories = [
    { key: 'front', label: 'Front View', icon: <CarIcon /> },
    { key: 'back', label: 'Back View', icon: <CarIcon /> },
    { key: 'right_side', label: 'Right Side', icon: <CarIcon /> },
    { key: 'left_side', label: 'Left Side', icon: <CarIcon /> },
    { key: 'interior', label: 'Interior', icon: <CarIcon /> },
    { key: 'engine', label: 'Engine', icon: <CarIcon /> }
  ]

  const documentTypes = [
    { key: 'insurance', label: 'Insurance', icon: '🛡️', multiple: false },
    { key: 'rc', label: 'RC Book', icon: '🪪', multiple: false },
    { key: 'bank_noc', label: 'Bank NOC', icon: '🏢', multiple: false },
    { key: 'kyc', label: 'KYC', icon: '✅', multiple: true },
    { key: 'tt_form', label: 'TT Form', icon: '📄', multiple: false },
    { key: 'papers_on_hold', label: 'Papers on Hold', icon: '📁', multiple: true },
    { key: 'puc', label: 'PUC', icon: '📜', multiple: false },
    { key: 'service_record', label: 'Service Records', icon: '🔧', multiple: true },
    { key: 'other', label: 'Other', icon: '📋', multiple: true }
  ]

  const fuelTypeOptions = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
  const paymentMethodOptions = ['Cash', 'Bank Transfer', 'Cheque', 'Online Payment']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const onImageDrop = useCallback((category, acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    
    const imageObjects = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    
    setImages(prev => ({
      ...prev,
      [category]: [...prev[category], ...imageObjects]
    }))
    showToast(`${acceptedFiles.length} image(s) added`, 'success')
  }, [showToast])

  const ImageDropzone = ({ category }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => onImageDrop(category, acceptedFiles),
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif']
      },
      multiple: true
    })

    return (
      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          p: 2.5,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : '#dee2e6',
          bgcolor: isDragActive ? '#f0f4ff' : '#f8f9fa',
          transition: 'all 0.3s',
          borderRadius: 2,
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: '#f0f4ff'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, color: isDragActive ? 'primary.main' : '#adb5bd', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
          {isDragActive ? 'Drop images here' : 'Click or drag to upload'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          JPG, PNG up to 10MB
        </Typography>
      </Paper>
    )
  }

  const removeImage = (category, index) => {
    setImages(prev => {
      const newImages = [...prev[category]]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return { ...prev, [category]: newImages }
    })
  }

  const onDocumentDrop = useCallback((docType, acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    
    const docTypeConfig = documentTypes.find(d => d.key === docType)
    
    if (docTypeConfig.multiple) {
      setDocuments(prev => ({
        ...prev,
        [docType]: [...(prev[docType] || []), ...acceptedFiles]
      }))
      showToast(`${acceptedFiles.length} file(s) added`, 'success')
    } else {
      setDocuments(prev => ({
        ...prev,
        [docType]: acceptedFiles[0]
      }))
      showToast(`${docTypeConfig.label} uploaded`, 'success')
    }
  }, [showToast])

  const DocumentDropzone = ({ docType, multiple }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => onDocumentDrop(docType, acceptedFiles),
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpeg', '.jpg', '.png']
      },
      multiple: multiple
    })

    const docConfig = documentTypes.find(d => d.key === docType)
    const hasFile = multiple ? documents[docType]?.length > 0 : documents[docType]

    return (
      <Card
        {...getRootProps()}
        elevation={0}
        sx={{
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px solid',
          borderColor: hasFile ? 'success.main' : isDragActive ? 'primary.main' : '#e9ecef',
          bgcolor: hasFile ? '#f0fff4' : isDragActive ? '#f0f4ff' : 'white',
          transition: 'all 0.3s',
          borderRadius: 2,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-2px)',
            boxShadow: 2
          }
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="h4" sx={{ mb: 1 }}>{docConfig.icon}</Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>
          {docConfig.label}
        </Typography>
        {multiple && (
          <Typography variant="caption" color="text.secondary">
            (Multiple files)
          </Typography>
        )}
        {hasFile && (
          <Box sx={{ mt: 1.5 }} onClick={(e) => e.stopPropagation()}>
            {multiple ? (
              documents[docType].map((file, idx) => (
                <Chip
                  key={idx}
                  label={file.name.length > 18 ? `${file.name.substring(0, 18)}...` : file.name}
                  size="small"
                  color="success"
                  variant="outlined"
                  onDelete={(e) => {
                    e.stopPropagation()
                    const newDocs = [...documents[docType]]
                    newDocs.splice(idx, 1)
                    setDocuments(prev => ({ ...prev, [docType]: newDocs }))
                  }}
                  sx={{ m: 0.25, fontSize: '11px' }}
                />
              ))
            ) : (
              <Chip
                label={documents[docType].name.length > 18 ? `${documents[docType].name.substring(0, 18)}...` : documents[docType].name}
                size="small"
                color="success"
                variant="outlined"
                onDelete={(e) => {
                  e.stopPropagation()
                  setDocuments(prev => ({ ...prev, [docType]: null }))
                }}
                sx={{ fontSize: '11px' }}
              />
            )}
          </Box>
        )}
      </Card>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const requiredFields = {
      vehicleNo: 'Vehicle Number',
      chassisNo: 'Chassis Number',
      make: 'Make',
      model: 'Model',
      year: 'Year',
      color: 'Color',
      kilometers: 'Kilometers',
      purchasePrice: 'Purchase Price',
      purchaseDate: 'Purchase Date',
      paymentMethod: 'Payment Method',
      sellerName: 'Seller Name',
      sellerContact: 'Seller Contact',
      dealerName: 'Dealer Name',
      dealerPhone: 'Dealer Phone'
    }

    for (const [key, label] of Object.entries(requiredFields)) {
      if (!formData[key] || (typeof formData[key] === 'string' && !formData[key].trim())) {
        showToast(`${label} is required`, 'error')
        return
      }
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()

      Object.keys(formData).forEach(key => {
        if (key === 'askingPrice' && !isAdmin) {
          return
        }
        if (key === 'purchaseDate' && formData[key]) {
          formDataToSend.append(key, formData[key].toISOString().split('T')[0])
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key])
        }
      })

      imageCategories.forEach(category => {
        const categoryImages = images[category.key] || []
        categoryImages.forEach((imgObj) => {
          const fieldName = category.key === 'right_side' ? 'right_side_images' :
                           category.key === 'left_side' ? 'left_side_images' :
                           `${category.key}_images`
          formDataToSend.append(fieldName, imgObj.file)
        })
      })

      documentTypes.forEach(docType => {
        if (docType.multiple) {
          const files = documents[docType.key] || []
          files.forEach(file => {
            formDataToSend.append(docType.key, file)
          })
        } else {
          const file = documents[docType.key]
          if (file) {
            formDataToSend.append(docType.key, file)
          }
        }
      })

      const response = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add vehicle')
      }

      setSavedVehicle(data.vehicle)
      showToast('Vehicle added successfully! Status: On Modification', 'success')
    } catch (error) {
      console.error('Error adding vehicle:', error)
      showToast(error.message || 'Failed to add vehicle', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      vehicleNo: '',
      chassisNo: '',
      make: '',
      model: '',
      year: '',
      color: '',
      fuelType: 'Petrol',
      kilometers: '',
      purchasePrice: '',
      askingPrice: '',
      purchaseDate: null,
      paymentMethod: '',
      agentCommission: '',
      sellerName: '',
      sellerContact: '',
      dealerName: '',
      dealerPhone: '',
      notes: ''
    })
    
    Object.keys(images).forEach(category => {
      images[category].forEach(imgObj => URL.revokeObjectURL(imgObj.preview))
    })
    setImages({
      front: [],
      back: [],
      right_side: [],
      left_side: [],
      interior: [],
      engine: []
    })
    
    setDocuments({
      insurance: null,
      rc: null,
      bank_noc: null,
      kyc: [],
      tt_form: null,
      papers_on_hold: [],
      puc: null,
      service_record: [],
      other: []
    })

    setSavedVehicle(null)
  }

  const handleGeneratePurchaseNote = async () => {
    if (!savedVehicle) {
      showToast('Please save the vehicle first', 'error')
      return
    }
    
    try {
      const vehicleId = savedVehicle._id || savedVehicle.id
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/purchase-note`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate purchase note')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Purchase_Note_${savedVehicle.vehicleNo}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showToast('Purchase note downloaded!', 'success')
    } catch (error) {
      console.error('Error generating purchase note:', error)
      showToast(error.message || 'Failed to generate purchase note', 'error')
    }
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
  
      {savedVehicle && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 3, borderRadius: 2, fontSize: '14px' }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleReset}
            >
              Add Another
            </Button>
          }
        >
          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '15px' }}>
            Vehicle Added Successfully!
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '14px' }}>
            Vehicle <strong>{savedVehicle.vehicleNo}</strong> ({savedVehicle.make} {savedVehicle.model}) has been saved with status "On Modification"
          </Typography>
        </Alert>
      )}

      {/* Form */}
      {!savedVehicle && (
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {/* Vehicle Information */}
              <Box mb={4}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: 3,
                    color: '#2c3e50',
                    fontWeight: 700,
                    fontSize: '20px'
                  }}
                >
                  <CarIcon sx={{ color: 'primary.main' }} /> Vehicle Information
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Vehicle Number"
                      name="vehicleNo"
                      value={formData.vehicleNo}
                      onChange={handleInputChange}
                      placeholder="MH12AB1234"
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Chassis Number"
                      name="chassisNo"
                      value={formData.chassisNo}
                      onChange={handleInputChange}
                      placeholder="MA3XXXXXXXXX"
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Make"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      placeholder="Honda, Maruti..."
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="City, Swift..."
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleInputChange}
                      placeholder="2022"
                      inputProps={{ min: 2000, max: new Date().getFullYear() + 1 }}
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="White, Black..."
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      fullWidth
                      options={fuelTypeOptions}
                      value={formData.fuelType}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({ ...prev, fuelType: newValue || 'Petrol' }))
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Fuel Type" required size="medium" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Kilometers"
                      name="kilometers"
                      value={formData.kilometers}
                      onChange={handleInputChange}
                      placeholder="50000"
                      required
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Purchase Details */}
              <Box mb={4}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: 3,
                    color: '#2c3e50',
                    fontWeight: 700,
                    fontSize: '20px'
                  }}
                >
                  <MoneyIcon sx={{ color: 'primary.main' }} /> Purchase Details
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Purchase Price (₹)"
                      name="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="850000"
                      required
                      size="medium"
                    />
                  </Grid>
                  {isAdmin && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Asking Price (₹)"
                        name="askingPrice"
                        type="number"
                        value={formData.askingPrice}
                        onChange={handleInputChange}
                        placeholder="1000000"
                        size="medium"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ width: '100%' }}>
                      <DatePicker
                        label="Purchase Date"
                        value={formData.purchaseDate}
                        onChange={(newValue) => {
                          setFormData(prev => ({ ...prev, purchaseDate: newValue }))
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            size: 'medium'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      fullWidth
                      options={paymentMethodOptions}
                      value={formData.paymentMethod}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({ ...prev, paymentMethod: newValue || '' }))
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Payment Method" required size="medium" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Agent Commission (₹)"
                      name="agentCommission"
                      type="number"
                      value={formData.agentCommission}
                      onChange={handleInputChange}
                      placeholder="25000"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Seller/Dealer Details */}
              <Box mb={4}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: 3,
                    color: '#2c3e50',
                    fontWeight: 700,
                    fontSize: '20px'
                  }}
                >
                  <PersonIcon sx={{ color: 'primary.main' }} /> Seller / Dealer Details
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Seller Name"
                      name="sellerName"
                      value={formData.sellerName}
                      onChange={handleInputChange}
                      placeholder="Enter seller name"
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Seller Contact"
                      name="sellerContact"
                      value={formData.sellerContact}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Dealer Name"
                      name="dealerName"
                      value={formData.dealerName}
                      onChange={handleInputChange}
                      placeholder="Enter dealer name"
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Dealer Phone"
                      name="dealerPhone"
                      value={formData.dealerPhone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      required
                      size="medium"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes about the vehicle..."
                      multiline
                      rows={3}
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Vehicle Images */}
              <Box mb={4}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: 2,
                    color: '#2c3e50',
                    fontWeight: 700,
                    fontSize: '20px'
                  }}
                >
                  <CameraIcon sx={{ color: 'primary.main' }} /> Vehicle Images (Before Modification)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '13px' }}>
                  Upload images for each category. These will be used as "Before Modification" images for comparison.
                </Typography>
                <Grid container spacing={2.5}>
                  {imageCategories.map(category => (
                    <Grid item xs={12} sm={6} md={4} key={category.key}>
                      <Box sx={{ 
                        border: '1px solid #e9ecef', 
                        borderRadius: 2, 
                        p: 2,
                        bgcolor: 'white',
                        height: '100%'
                      }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            mb: 2,
                            color: '#2c3e50',
                            fontWeight: 600,
                            fontSize: '15px'
                          }}
                        >
                          {category.icon}
                          {category.label}
                        </Typography>
                        <ImageDropzone category={category.key} />
                        {images[category.key].length > 0 && (
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {images[category.key].map((imgObj, idx) => (
                              <Box key={idx} sx={{ position: 'relative' }}>
                                <Box
                                  component="img"
                                  src={imgObj.preview}
                                  alt={`${category.label} ${idx + 1}`}
                                  sx={{
                                    width: 90,
                                    height: 90,
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    border: '2px solid #e9ecef'
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: -10,
                                    right: -10,
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    width: 26,
                                    height: 26,
                                    '&:hover': { bgcolor: 'error.dark' }
                                  }}
                                  onClick={() => removeImage(category.key, idx)}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Documents */}
              <Box mb={4}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: 3,
                    color: '#2c3e50',
                    fontWeight: 700,
                    fontSize: '20px'
                  }}
                >
                  <FolderIcon sx={{ color: 'primary.main' }} /> Documents <Chip label="Optional" size="small" sx={{ ml: 1 }} />
                </Typography>
                <Grid container spacing={2}>
                  {documentTypes.map((doc) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={doc.key}>
                      <DocumentDropzone
                        docType={doc.key}
                        multiple={doc.multiple}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Form Actions */}
              <Box sx={{ 
                mt: 4, 
                pt: 3, 
                borderTop: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2
              }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={handleReset}
                  disabled={loading}
                  sx={{ 
                    minWidth: 130,
                    fontSize: '15px',
                    fontWeight: 600
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                  sx={{ 
                    minWidth: 160,
                    fontSize: '15px',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Saving...' : 'Save Vehicle'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default AddVehicle
