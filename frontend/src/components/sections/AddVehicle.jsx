import React, { useState, useCallback } from 'react'
import {
  Box,
  Grid,
  Alert,
  Button,
  Typography,
} from '@mui/material'
import {
  Save as SaveIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CameraAlt as CameraIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { getDistricts, getTalukas } from '../../utils/maharashtraData'
import {
  FormContainer,
  FormSection,
  FormSectionHeader,
  FormTextField,
  FormSelect,
  FormActions,
  FormGrid,
  VehicleImageDropzone,
  VehicleDocumentDropzone
} from '../forms'
import {
  IMAGE_CATEGORIES,
  DOCUMENT_TYPES,
  FUEL_TYPE_OPTIONS,
  PURCHASE_PAYMENT_MODE_OPTIONS,
  OWNER_TYPE_OPTIONS
} from '../../utils/vehicleFormConstants'
import { captureImageFromCamera } from '../../utils/cameraCapture'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AddVehicle = () => {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [savedVehicle, setSavedVehicle] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = user?.role === 'admin'

  const [formData, setFormData] = useState({
    vehicleNo: '',
    chassisNo: '',
    engineNo: '',
    make: '',
    model: '',
    color: '',
    fuelType: 'Petrol',
    kilometers: '',
    purchasePrice: '',
    askingPrice: '',
    purchaseDate: null,
    purchaseMonth: null,
    purchaseYear: null,
    sellerName: '',
    sellerContact: '',
    agentName: '',
    // agentPhone removed - Admin-only field
    ownerType: '',
    ownerTypeCustom: '',
    addressLine1: '',
    district: '',
    taluka: '',
    pincode: '',
    remainingAmountToSeller: '',
    notes: ''
  })
  
  // Multiple payment modes for purchase (to seller) - Only Cash, Bank Transfer, and Deductions
  const [purchasePaymentModes, setPurchasePaymentModes] = useState({
    cash: '',
    bank_transfer: '',
    deductions: ''
  })
  
  // Deductions notes - reason for deductions
  const [deductionsNotes, setDeductionsNotes] = useState('')
  
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [availableTalukas, setAvailableTalukas] = useState([])

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

  // Use constants from vehicleFormConstants
  const purchasePaymentModeOptions = PURCHASE_PAYMENT_MODE_OPTIONS

  // Calculate remaining amount automatically
  const calculateRemainingAmount = (purchasePrice, paymentModes) => {
    const purchasePriceNum = parseFloat(purchasePrice) || 0
    const cashAmount = parseFloat(paymentModes.cash || 0) || 0
    const bankTransferAmount = parseFloat(paymentModes.bank_transfer || 0) || 0
    const deductionsAmount = parseFloat(paymentModes.deductions || 0) || 0
    
    const totalPaid = cashAmount + bankTransferAmount + deductionsAmount
    const remaining = purchasePriceNum - totalPaid
    
    return remaining > 0 ? remaining : 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = { ...formData, [name]: value }
    setFormData(updatedFormData)
    
    // Auto-calculate remaining amount when purchase price changes
    if (name === 'purchasePrice') {
      const remaining = calculateRemainingAmount(value, purchasePaymentModes)
      setFormData(prev => ({ ...prev, [name]: value, remainingAmountToSeller: remaining.toFixed(2) }))
    }
  }

  // Handle district change - update available talukas
  const handleDistrictChange = (event, newValue) => {
    setSelectedDistrict(newValue || '')
    setFormData(prev => ({ ...prev, district: newValue || '', taluka: '' }))
    if (newValue) {
      setAvailableTalukas(getTalukas(newValue))
    } else {
      setAvailableTalukas([])
    }
  }

  // Handle pincode validation
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
    setFormData(prev => ({ ...prev, pincode: value }))
  }

  // Handle purchase payment mode amount changes
  const handlePaymentModeAmountChange = (modeKey, value) => {
    // Only allow digits and decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    const updatedModes = {
      ...purchasePaymentModes,
      [modeKey]: numericValue
    }
    setPurchasePaymentModes(updatedModes)
    
    // Auto-calculate remaining amount
    const remaining = calculateRemainingAmount(formData.purchasePrice, updatedModes)
    setFormData(prev => ({ ...prev, remainingAmountToSeller: remaining.toFixed(2) }))
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

  const handleCameraCapture = async (category) => {
    captureImageFromCamera(
      (files) => onImageDrop(category, files),
      showToast
    )
  }

  const removeImage = (category, index) => {
    setImages(prev => {
      const newImages = [...prev[category]]
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview)
      }
      newImages.splice(index, 1)
      showToast(`Image removed from ${category}`, 'info')
      return { ...prev, [category]: newImages }
    })
  }

  const onDocumentDrop = useCallback((docType, acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    
    const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)
    
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

  const removeDocument = (docType, index) => {
    const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)
    if (docTypeConfig.multiple) {
      setDocuments(prev => ({
        ...prev,
        [docType]: prev[docType].filter((_, i) => i !== index)
      }))
    } else {
      setDocuments(prev => ({ ...prev, [docType]: null }))
    }
    showToast(`${docTypeConfig.label} removed`, 'info')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate pincode
    if (formData.pincode && formData.pincode.length !== 6) {
      showToast('Pincode must be exactly 6 digits', 'error')
      return
    }

    // Validate owner type custom
    if (formData.ownerType === 'Custom' && !formData.ownerTypeCustom?.trim()) {
      showToast('Please enter custom owner description', 'error')
      return
    }

    // Validate district and taluka
    if (formData.district && !formData.taluka) {
      showToast('Please select a taluka', 'error')
      return
    }

    // Validate at least one payment mode has a value
    const hasPaymentMode = Object.values(purchasePaymentModes).some(amount => amount && parseFloat(amount) > 0)
    if (!hasPaymentMode) {
      showToast('Please enter at least one payment amount', 'error')
      return
    }

    const requiredFields = {
      vehicleNo: 'Vehicle Number',
      chassisNo: 'Chassis Number',
      engineNo: 'Engine Number',
      make: 'Make',
      model: 'Model',
      color: 'Color',
      kilometers: 'Kilometers',
      purchasePrice: 'Purchase Price',
      purchaseMonth: 'Purchase Month & Year',
      sellerName: 'Seller Name',
      sellerContact: 'Seller Contact',
      agentName: 'Agent Name',
      addressLine1: 'Address Line 1',
      district: 'District',
      taluka: 'Taluka',
      pincode: 'Pincode'
    }

    for (const [key, label] of Object.entries(requiredFields)) {
      // Special handling for purchase month/year
      if (key === 'purchaseMonth') {
        if (!formData.purchaseMonth || !formData.purchaseYear) {
          showToast('Purchase Month & Year is required', 'error')
          return
        }
        continue
      }
      if (key === 'purchaseYear') {
        continue // Already checked above
      }
      
      if (!formData[key] || (typeof formData[key] === 'string' && !formData[key].trim())) {
        showToast(`${label} is required`, 'error')
        return
      }
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()

      // Build structured purchase payment methods object
      const purchasePaymentMethodsObj = {}
      Object.entries(purchasePaymentModes).forEach(([modeKey, amount]) => {
        // Only include modes that have a value entered
        if (amount && amount.trim() !== '') {
          const amountNum = parseFloat(amount)
          // If amount is 0 or invalid, store as "NIL", otherwise store as number
          if (isNaN(amountNum) || amountNum === 0) {
            purchasePaymentMethodsObj[modeKey] = 'NIL'
          } else {
            purchasePaymentMethodsObj[modeKey] = amountNum
          }
        }
      })
      formDataToSend.append('purchasePaymentMethods', JSON.stringify(purchasePaymentMethodsObj))
      
      // Add deductions notes if deductions amount is entered
      if (deductionsNotes && deductionsNotes.trim() !== '') {
        formDataToSend.append('deductionsNotes', deductionsNotes.trim())
      }

      // Set pending payment type if remaining amount to seller exists
      if (formData.remainingAmountToSeller && parseFloat(formData.remainingAmountToSeller) > 0) {
        formDataToSend.append('remainingAmountToSeller', formData.remainingAmountToSeller)
        formDataToSend.append('pendingPaymentType', 'PENDING_TO_SELLER')
      }

      Object.keys(formData).forEach(key => {
        if (key === 'askingPrice' && !isAdmin) {
          return
        }
        if (key === 'purchaseDate' && formData[key]) {
          // Store purchase date as first day of selected month for backward compatibility
          formDataToSend.append(key, formData[key].toISOString().split('T')[0])
        } else if (key === 'purchaseMonth' && formData[key]) {
          formDataToSend.append(key, formData[key])
        } else if (key === 'purchaseYear' && formData[key]) {
          formDataToSend.append(key, formData[key])
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
      engineNo: '',
      make: '',
      model: '',
      color: '',
      fuelType: 'Petrol',
      kilometers: '',
      purchasePrice: '',
      askingPrice: '',
      purchaseDate: null,
      purchaseMonth: null,
      purchaseYear: null,
      sellerName: '',
      sellerContact: '',
      agentName: '',
      // agentPhone removed - Admin-only field
      ownerType: '',
      ownerTypeCustom: '',
      addressLine1: '',
      district: '',
      taluka: '',
      pincode: '',
      remainingAmountToSeller: '',
      notes: ''
    })
    setPurchasePaymentModes({
      cash: '',
      bank_transfer: '',
      deductions: ''
    })
    setDeductionsNotes('')
    setSelectedDistrict('')
    setAvailableTalukas([])
    
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
    showToast('Form reset successfully', 'info')
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
    <Box sx={{ px: 3, py: 2, width: '100%', maxWidth: '100%' }}>
  
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
        <FormContainer>
          <form onSubmit={handleSubmit}>
            {/* Vehicle Information */}
            <FormSection>
              <FormSectionHeader icon={CarIcon} title="Vehicle Information" />
              <FormGrid>
                <FormTextField
                  label="Vehicle Number"
                  name="vehicleNo"
                  value={formData.vehicleNo}
                  onChange={handleInputChange}
                  placeholder="MH12AB1234"
                  required
                />
                <FormTextField
                  label="Chassis Number"
                  name="chassisNo"
                  value={formData.chassisNo}
                  onChange={handleInputChange}
                  placeholder="MA3XXXXXXXXX"
                  required
                />
                <FormTextField
                  label="Engine Number"
                  name="engineNo"
                  value={formData.engineNo}
                  onChange={handleInputChange}
                  placeholder="ENGXXXXXXXX"
                  required
                />
                <FormTextField
                  label="Make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="Honda, Maruti..."
                  required
                />
                <FormTextField
                  label="Model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="City, Swift..."
                  required
                />
                <FormTextField
                  label="Color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="White, Black..."
                  required
                />
                <FormSelect
                  options={FUEL_TYPE_OPTIONS}
                  value={formData.fuelType}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, fuelType: newValue || 'Petrol' }))
                  }}
                  label="Fuel Type"
                  required
                />
                <FormTextField
                  label="Kilometers"
                  name="kilometers"
                  value={formData.kilometers}
                  onChange={handleInputChange}
                  placeholder="50000"
                  required
                />
              </FormGrid>
            </FormSection>

            {/* Purchase Details */}
            <FormSection>
              <FormSectionHeader icon={MoneyIcon} title="Purchase Details" />
              <FormGrid>
                <FormTextField
                  label="Purchase Price (₹)"
                  name="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  placeholder="850000"
                  required
                />
                {isAdmin && (
                  <FormTextField
                    label="Asking Price (₹)"
                    name="askingPrice"
                    type="number"
                    value={formData.askingPrice}
                    onChange={handleInputChange}
                    placeholder="1000000"
                  />
                )}
                <Box sx={{ width: '100%' }}>
                  <DatePicker
                    label="Purchase Month & Year"
                    value={formData.purchaseMonth && formData.purchaseYear 
                      ? new Date(formData.purchaseYear, formData.purchaseMonth - 1, 1)
                      : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const month = newValue.getMonth() + 1
                        const year = newValue.getFullYear()
                        setFormData(prev => ({ 
                          ...prev, 
                          purchaseMonth: month,
                          purchaseYear: year,
                          purchaseDate: new Date(year, month - 1, 1)
                        }))
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          purchaseMonth: null,
                          purchaseYear: null,
                          purchaseDate: null
                        }))
                      }
                    }}
                    views={['month', 'year']}
                    openTo="month"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: 'medium',
                        placeholder: 'Select Month & Year'
                      }
                    }}
                  />
                </Box>
                <FormSelect
                  options={OWNER_TYPE_OPTIONS}
                  value={formData.ownerType}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      ownerType: newValue || '',
                      ownerTypeCustom: newValue !== 'Custom' ? '' : prev.ownerTypeCustom
                    }))
                  }}
                  label="Owner Type"
                />
                {formData.ownerType === 'Custom' && (
                  <FormTextField
                    label="Custom Owner Description"
                    name="ownerTypeCustom"
                    value={formData.ownerTypeCustom}
                    onChange={handleInputChange}
                    placeholder="e.g., 4th Owner, Company Owned..."
                    required={formData.ownerType === 'Custom'}
                  />
                )}
              </FormGrid>
            </FormSection>

            {/* Purchase Payment Methods */}
            <FormSection>
              <FormSectionHeader 
                icon={MoneyIcon} 
                title="Payment Mode (To Seller)"
                subtitle="Enter payment amounts. Remaining amount will be calculated automatically: Purchase Price - (Cash + Bank Transfer + Deductions)"
              />
              <FormGrid>
                {purchasePaymentModeOptions.map((mode) => (
                  <FormTextField
                    key={mode.key}
                    label={`${mode.label} (₹)`}
                    type="text"
                    value={purchasePaymentModes[mode.key] || ''}
                    onChange={(e) => handlePaymentModeAmountChange(mode.key, e.target.value)}
                    placeholder="Enter amount"
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
                  />
                ))}
              </FormGrid>
              {purchasePaymentModes.deductions && purchasePaymentModes.deductions.toString().trim() !== '' && (
                <FormGrid className="add-vehicle-form-grid-full" sx={{ mt: 2 }}>
                  <FormTextField
                    label="Deductions Notes"
                    value={deductionsNotes}
                    onChange={(e) => setDeductionsNotes(e.target.value)}
                    placeholder="Enter reason for deductions (e.g., Repair costs, Pending documentation, etc.)"
                    multiline
                    rows={3}
                    helperText="This note will be visible to admin and included in purchase notes"
                  />
                </FormGrid>
              )}
              <FormGrid sx={{ mt: 2 }}>
                <FormTextField
                  label="Remaining Amount"
                  name="remainingAmountToSeller"
                  type="number"
                  value={formData.remainingAmountToSeller}
                  disabled
                  helperText="Auto-calculated: Purchase Price - (Cash + Bank Transfer + Deductions)"
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600,
                      color: '#1976d2'
                    }
                  }}
                />
              </FormGrid>
            </FormSection>

            {/* Seller/Agent Details */}
            <FormSection>
              <FormSectionHeader icon={PersonIcon} title="Seller Details" />
              <FormGrid>
                <FormTextField
                  label="Seller Name"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  placeholder="Enter seller name"
                  required
                />
                <FormTextField
                  label="Seller Contact"
                  name="sellerContact"
                  value={formData.sellerContact}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  required
                />
                <FormTextField
                  label="Agent Name"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleInputChange}
                  placeholder="Enter agent name"
                  required
                />
                <FormTextField
                  className="add-vehicle-form-grid-full"
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the vehicle..."
                  multiline
                  rows={3}
                  sx={{ gridColumn: '1 / -1' }}
                />
              </FormGrid>
            </FormSection>

            {/* Address Details */}
            <FormSection>
              <FormSectionHeader icon={PersonIcon} title="Address Details" />
              <FormGrid>
                <FormTextField
                  className="add-vehicle-form-grid-full"
                  label="Address Line 1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="House/Flat No., Building Name, Street..."
                  required
                  sx={{ gridColumn: '1 / -1' }}
                />
                <FormSelect
                  options={getDistricts()}
                  value={formData.district}
                  onChange={handleDistrictChange}
                  label="District"
                  required
                  placeholder="Select District"
                />
                <FormSelect
                  options={availableTalukas}
                  value={formData.taluka}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, taluka: newValue || '' }))
                  }}
                  disabled={!formData.district}
                  label="Taluka"
                  required
                  placeholder={formData.district ? "Select Taluka" : "Select District first"}
                  helperText={!formData.district ? "Please select a district first" : ""}
                />
                <FormTextField
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="400001"
                  required
                  inputProps={{ maxLength: 6 }}
                  error={formData.pincode.length > 0 && formData.pincode.length !== 6}
                  helperText={
                    formData.pincode.length > 0 && formData.pincode.length !== 6
                      ? "Pincode must be exactly 6 digits"
                      : ""
                  }
                />
              </FormGrid>
            </FormSection>

            {/* Vehicle Images */}
            <FormSection>
              <FormSectionHeader 
                icon={CameraIcon} 
                title="Vehicle Images"
                subtitle="Upload images for each category. These will be used as 'Before Modification' images."
              />
              <Grid container spacing={2}>
                {IMAGE_CATEGORIES.map(category => (
                  <Grid item xs={6} sm={4} md={2} key={category.key}>
                    <VehicleImageDropzone
                      category={category.key}
                      label={category.label}
                      images={images[category.key] || []}
                      onDrop={onImageDrop}
                      onRemove={removeImage}
                      onCameraCapture={handleCameraCapture}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormSection>

            {/* Documents */}
            <FormSection showDivider={false}>
              <FormSectionHeader 
                icon={FolderIcon} 
                title="Documents"
                subtitle="Upload vehicle documents. Supported formats: PDF, JPG, PNG (Optional)"
              />
              <Grid container spacing={2}>
                {DOCUMENT_TYPES.map((doc) => (
                  <Grid item xs={6} sm={4} md={3} key={doc.key}>
                    <VehicleDocumentDropzone
                      docType={doc.key}
                      label={doc.label}
                      icon={doc.icon}
                      multiple={doc.multiple}
                      documents={doc.multiple ? (documents[doc.key] || []) : (documents[doc.key] ? [documents[doc.key]] : [])}
                      onDrop={onDocumentDrop}
                      onRemove={removeDocument}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormSection>

            {/* Form Actions */}
            <FormActions
              onCancel={handleReset}
              onSubmit={handleSubmit}
              submitLabel="Save Vehicle"
              cancelLabel="Reset"
              loading={loading}
              cancelIcon={<AddIcon />}
            />
          </form>
        </FormContainer>
      )}
    </Box>
  )
}

export default AddVehicle
