import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Divider,
} from '@mui/material'
import {
  Save as SaveIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CameraAlt as CameraIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { getDistricts, getTalukas } from '../utils/maharashtraData'
import { captureImageFromCamera } from '../utils/cameraCapture'
import {
  IMAGE_CATEGORIES,
  DOCUMENT_TYPES,
  FUEL_TYPE_OPTIONS,
  PURCHASE_PAYMENT_MODE_OPTIONS,
  STATUS_OPTIONS,
  OWNER_TYPE_OPTIONS
} from '../utils/vehicleFormConstants'
import {
  FormSectionHeader,
  FormTextField,
  FormSelect,
  FormContainer,
  FormSection,
  FormActions,
  FormGrid,
  VehicleImageDropzone,
  VehicleDocumentDropzone
} from './forms'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const EditVehicle = ({ vehicle, onClose, onSuccess }) => {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const isAdmin = user?.role === 'admin'

  const [formData, setFormData] = useState({
    chassisNo: '',
    engineNo: '',
    make: '',
    model: '',
    color: '',
    fuelType: 'Petrol',
    kilometers: '',
    purchasePrice: '',
    askingPrice: '',
    lastPrice: '',
    purchaseDate: null,
    purchaseMonth: null,
    purchaseYear: null,
    ownerType: '',
    ownerTypeCustom: '',
    addressLine1: '',
    district: '',
    taluka: '',
    pincode: '',
    remainingAmountToSeller: '',
    sellerName: '',
    sellerContact: '',
    agentName: '',
    agentCommission: '',
    agentPhone: '',
    notes: '',
    status: 'On Modification',
    // Legacy fields for backward compatibility
    dealerName: '',
    dealerPhone: ''
  })

  // Purchase payment modes (matching AddVehicle)
  const [purchasePaymentModes, setPurchasePaymentModes] = useState({
    cash: '',
    bank_transfer: '',
    deductions: ''
  })
  
  const [deductionsNotes, setDeductionsNotes] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [availableTalukas, setAvailableTalukas] = useState([])

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
      // Handle purchase month and year
      let purchaseDateValue = null
      let purchaseMonth = null
      let purchaseYear = null
      
      if (vehicle.purchaseMonth && vehicle.purchaseYear) {
        purchaseMonth = vehicle.purchaseMonth
        purchaseYear = vehicle.purchaseYear
        purchaseDateValue = new Date(purchaseYear, purchaseMonth - 1, 1)
      } else if (vehicle.purchaseDate) {
        const date = new Date(vehicle.purchaseDate)
        purchaseMonth = date.getMonth() + 1
        purchaseYear = date.getFullYear()
        purchaseDateValue = new Date(purchaseYear, purchaseMonth - 1, 1)
      }
      
      // Load purchase payment methods from vehicle
      const paymentMethods = vehicle.purchasePaymentMethods || {}
      const paymentModes = {
        cash: paymentMethods.cash ? (paymentMethods.cash === 'NIL' ? '' : paymentMethods.cash.toString()) : '',
        bank_transfer: paymentMethods.bank_transfer ? (paymentMethods.bank_transfer === 'NIL' ? '' : paymentMethods.bank_transfer.toString()) : '',
        deductions: paymentMethods.deductions ? (paymentMethods.deductions === 'NIL' ? '' : paymentMethods.deductions.toString()) : ''
      }
      setPurchasePaymentModes(paymentModes)
      setDeductionsNotes(vehicle.deductionsNotes || '')
      
      // Set district and talukas
      if (vehicle.district) {
        setSelectedDistrict(vehicle.district)
        setAvailableTalukas(getTalukas(vehicle.district))
      }
      
      // Populate form with existing vehicle data
      setFormData({
        chassisNo: vehicle.chassisNo || '',
        engineNo: vehicle.engineNo || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || 'Petrol',
        kilometers: vehicle.kilometers || '',
        purchasePrice: vehicle.purchasePrice || '',
        askingPrice: vehicle.askingPrice || '',
        lastPrice: vehicle.lastPrice || '',
        purchaseDate: purchaseDateValue,
        purchaseMonth: purchaseMonth,
        purchaseYear: purchaseYear,
        ownerType: vehicle.ownerType || '',
        ownerTypeCustom: vehicle.ownerTypeCustom || '',
        addressLine1: vehicle.addressLine1 || '',
        district: vehicle.district || '',
        taluka: vehicle.taluka || '',
        pincode: vehicle.pincode || '',
        remainingAmountToSeller: vehicle.remainingAmountToSeller || '',
        sellerName: vehicle.sellerName || '',
        sellerContact: vehicle.sellerContact || '',
        agentName: vehicle.agentName || vehicle.dealerName || '',
        agentCommission: vehicle.agentCommission || '',
        agentPhone: vehicle.agentPhone || vehicle.dealerPhone || '',
        notes: vehicle.notes || '',
        status: vehicle.status || 'On Modification',
        dealerName: vehicle.dealerName || '',
        dealerPhone: vehicle.dealerPhone || ''
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

  const handlePurchaseDateChange = (newValue) => {
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

  const removeImage = useCallback((category, index) => {
    setImages(prev => {
      const newImages = [...prev[category]]
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview)
      }
      newImages.splice(index, 1)
      showToast(`Image removed from ${category}`, 'info')
      return { ...prev, [category]: newImages }
    })
  }, [showToast])

  const removeDocument = useCallback((docType) => {
    const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)
    setDocuments(prev => ({ ...prev, [docType]: docTypeConfig.multiple ? [] : null }))
    showToast(`${docTypeConfig?.label || docType} removed`, 'info')
  }, [showToast])

  const handleCameraCapture = useCallback((category) => {
    captureImageFromCamera(
      (files) => onImageDrop(category, files),
      showToast
    )
  }, [onImageDrop, showToast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()

      // Build structured purchase payment methods object
      const purchasePaymentMethodsObj = {}
      Object.entries(purchasePaymentModes).forEach(([modeKey, amount]) => {
        if (amount && amount.trim() !== '') {
          const amountNum = parseFloat(amount)
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

      // Add all form fields (exclude legacy dealerName/dealerPhone)
      Object.keys(formData).forEach(key => {
        if (key === 'dealerName' || key === 'dealerPhone') {
          return
        }
        
        if (key === 'purchaseDate' && formData[key]) {
          formDataToSend.append(key, formData[key].toISOString().split('T')[0])
        } else if (key === 'purchaseMonth' && formData[key]) {
          formDataToSend.append(key, formData[key])
        } else if (key === 'purchaseYear' && formData[key]) {
          formDataToSend.append(key, formData[key])
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key])
        }
      })
      
      // Ensure agentName/agentPhone are sent
      if (!formData.agentName && formData.dealerName) {
        formDataToSend.append('agentName', formData.dealerName)
      }
      if (!formData.agentPhone && formData.dealerPhone) {
        formDataToSend.append('agentPhone', formData.dealerPhone)
      }

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

      // Add new documents (only File objects)
      documentTypes.forEach(docType => {
        if (docType.multiple) {
          const files = documents[docType.key] || []
          files.forEach(file => {
            if (file instanceof File) {
              formDataToSend.append(docType.key, file)
            }
          })
        } else {
          const file = documents[docType.key]
          if (file instanceof File) {
            formDataToSend.append(docType.key, file)
          }
        }
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
    <FormContainer>
      <form onSubmit={handleSubmit}>
        {/* Vehicle Information */}
        <FormSection>
          <FormSectionHeader icon={CarIcon} title="Vehicle Information" />
          <FormGrid>
            <FormTextField
              label="Vehicle Number"
              value={vehicle.vehicleNo}
              disabled
              helperText="Vehicle number cannot be changed"
              sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
            />
            <FormTextField
              label="Chassis Number"
              name="chassisNo"
              value={formData.chassisNo}
              onChange={handleInputChange}
              disabled={!isAdmin}
              helperText={!isAdmin ? 'Only admin can edit chassis number' : ''}
              sx={!isAdmin ? { '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } } : {}}
            />
            <FormTextField
              label="Engine Number"
              name="engineNo"
              value={formData.engineNo}
              onChange={handleInputChange}
              disabled={!isAdmin}
              placeholder="Required for purchase notes"
              helperText={!isAdmin ? 'Only admin can edit engine number' : ''}
              sx={!isAdmin ? { '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } } : {}}
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
            />
            <FormTextField
              label="Color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              placeholder="White, Black..."
            />
            <FormSelect
              options={FUEL_TYPE_OPTIONS}
              value={formData.fuelType}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, fuelType: newValue || 'Petrol' }))
              }}
              label="Fuel Type"
            />
            <FormTextField
              label="Kilometers"
              name="kilometers"
              value={formData.kilometers}
              onChange={handleInputChange}
              placeholder="50000"
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
            <FormTextField
              label="Last Price (₹)"
              name="lastPrice"
              type="number"
              value={formData.lastPrice}
              onChange={handleInputChange}
              placeholder="950000"
            />
            <Box sx={{ width: '100%' }}>
              <DatePicker
                label="Purchase Month & Year"
                value={formData.purchaseMonth && formData.purchaseYear 
                  ? new Date(formData.purchaseYear, formData.purchaseMonth - 1, 1)
                  : null}
                onChange={handlePurchaseDateChange}
                views={['month', 'year']}
                openTo="month"
                slotProps={{
                  textField: {
                    fullWidth: true,
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
            {isAdmin && (
              <>
                <FormTextField
                  label="Agent Commission (₹)"
                  name="agentCommission"
                  type="number"
                  value={formData.agentCommission}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, step: 100 }}
                />
                <FormTextField
                  label="Agent Phone"
                  name="agentPhone"
                  value={formData.agentPhone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                />
              </>
            )}
            <FormSelect
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, status: newValue || 'On Modification' }))
              }}
              label="Status"
            />
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
            {PURCHASE_PAYMENT_MODE_OPTIONS.map((mode) => (
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
            />
            <FormTextField
              label="Seller Contact"
              name="sellerContact"
              value={formData.sellerContact}
              onChange={handleInputChange}
              placeholder="+91 98765 43210"
            />
            <FormTextField
              label="Agent Name"
              name="agentName"
              value={formData.agentName}
              onChange={handleInputChange}
              placeholder="Enter agent name"
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
              sx={{ gridColumn: '1 / -1' }}
            />
            <FormSelect
              options={getDistricts()}
              value={formData.district}
              onChange={handleDistrictChange}
              label="District"
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
              placeholder={formData.district ? "Select Taluka" : "Select District first"}
              helperText={!formData.district ? "Please select a district first" : ""}
            />
            <FormTextField
              label="Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handlePincodeChange}
              placeholder="400001"
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
            subtitle="Upload additional images. Existing images will be preserved."
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
            subtitle="Upload vehicle documents. Supported formats: PDF, JPG, PNG"
          />
          <Grid container spacing={2}>
            {DOCUMENT_TYPES.map((doc) => (
              <Grid item xs={6} sm={4} md={3} key={doc.key}>
                <VehicleDocumentDropzone
                  docType={doc.key}
                  label={doc.label}
                  icon={doc.icon}
                  multiple={doc.multiple}
                  documents={documents[doc.key] || []}
                  onDrop={onDocumentDrop}
                  onRemove={removeDocument}
                  isMissing={vehicle?.missingDocuments?.includes(doc.key)}
                />
              </Grid>
            ))}
          </Grid>
        </FormSection>

        {/* Form Actions */}
        <FormActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Update Vehicle"
          loading={loading}
        />
      </form>
    </FormContainer>
  )
}

export default EditVehicle
