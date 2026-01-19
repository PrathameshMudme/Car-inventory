import React, { useState, useEffect } from 'react'
import {
  Box,
  Alert,
  Button,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import {
  FormContainer,
  FormActions,
  VehicleInformationSection,
  PurchaseDetailsSection,
  PurchasePaymentSection,
  SellerDetailsSection,
  AddressDetailsSection,
  VehicleImagesSection,
  VehicleDocumentsSection
} from '../forms'
import { useVehicleForm } from '../../hooks/useVehicleForm'
import { prepareVehicleFormData, validateVehicleForm } from '../../utils/vehicleFormUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AddVehicle = () => {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [savedVehicle, setSavedVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formKey, setFormKey] = useState(0) // Key to force form remount

  // Use shared vehicle form hook
  const {
    formData,
    setFormData,
    purchasePaymentModes,
    deductionsNotes,
    setDeductionsNotes,
    availableTalukas,
    images,
    documents,
    isAdmin,
    handleInputChange,
    handleDistrictChange,
    handlePincodeChange,
    handlePaymentModeAmountChange,
    handlePurchaseDateChange,
    onImageDrop,
    removeImage,
    handleCameraCapture,
    onDocumentDrop,
    removeDocument,
    resetForm
  } = useVehicleForm()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form using shared utility
    if (!validateVehicleForm(formData, purchasePaymentModes, showToast, false)) {
      return
    }

    setLoading(true)

    try {
      // Prepare form data using shared utility
      const formDataToSend = prepareVehicleFormData(
        formData,
        purchasePaymentModes,
        deductionsNotes,
        images,
        documents,
        isAdmin,
        false // isEdit = false for AddVehicle
      )

      const response = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      // Read response as text first (can only read once)
      const responseText = await response.text()
      
      let data
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText)
      } catch (jsonError) {
        // If response is not JSON (e.g., HTML error page)
        console.error('Server response (not JSON):', responseText.substring(0, 500))
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to add vehicle')
      }

      setSavedVehicle(data.vehicle)
      // Reset form after successful submission and force remount
      resetForm()
      setFormKey(prev => prev + 1) // Force form remount to clear all state
      showToast('Vehicle added successfully! Status: On Modification', 'success')
    } catch (error) {
      console.error('Error adding vehicle:', error)
      showToast(error.message || 'Failed to add vehicle', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    resetForm()
    setSavedVehicle(null)
    setFormKey(prev => prev + 1) // Force form remount to clear all state
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
      a.download = `Purchase_Note_${formatVehicleNumber(savedVehicle.vehicleNo).replace(/-/g, '')}.pdf`
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
            Vehicle <strong>{formatVehicleNumber(savedVehicle.vehicleNo)}</strong> ({savedVehicle.make} {savedVehicle.model}) has been saved with status "On Modification"
          </Typography>
        </Alert>
      )}

      {/* Form */}
      {!savedVehicle && (
        <FormContainer key={formKey}>
          <form onSubmit={handleSubmit}>
            {/* Vehicle Information */}
            <VehicleInformationSection
              formData={formData}
              isEdit={false}
              isAdmin={isAdmin}
              handleInputChange={handleInputChange}
              handlePurchaseDateChange={handlePurchaseDateChange}
            />

            {/* Purchase Details */}
            <PurchaseDetailsSection
              formData={formData}
              isEdit={false}
              isAdmin={isAdmin}
              handleInputChange={handleInputChange}
            />

            {/* Purchase Payment Methods */}
            <PurchasePaymentSection
              purchasePaymentModes={purchasePaymentModes}
              deductionsNotes={deductionsNotes}
              formData={formData}
              handlePaymentModeAmountChange={handlePaymentModeAmountChange}
              setDeductionsNotes={setDeductionsNotes}
            />

            {/* Seller/Agent Details */}
            <SellerDetailsSection
              formData={formData}
              isEdit={false}
              handleInputChange={handleInputChange}
            />

            {/* Address Details */}
            <AddressDetailsSection
              formData={formData}
              availableTalukas={availableTalukas}
              isEdit={false}
              handleInputChange={handleInputChange}
              handleDistrictChange={handleDistrictChange}
              handlePincodeChange={handlePincodeChange}
            />

            {/* Vehicle Images */}
            <VehicleImagesSection
              images={images}
              onImageDrop={onImageDrop}
              removeImage={removeImage}
              handleCameraCapture={handleCameraCapture}
              isEdit={false}
            />

            {/* Documents */}
            <VehicleDocumentsSection
              documents={documents}
              onDocumentDrop={onDocumentDrop}
              removeDocument={removeDocument}
            />

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
