import React, { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
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
} from './forms'
import { useVehicleForm } from '../hooks/useVehicleForm'
import { prepareVehicleFormData, validateVehicleForm } from '../utils/vehicleFormUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const EditVehicle = ({ vehicle, onClose, onSuccess }) => {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  // Use shared vehicle form hook with initial vehicle data
  const {
    formData,
    purchasePaymentModes,
    deductionsNotes,
    setDeductionsNotes,
    availableTalukas,
    images,
    documents,
    deletedDocumentIds,
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
    removeDocument
  } = useVehicleForm(vehicle)

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        true, // isEdit = true for EditVehicle
        deletedDocumentIds
      )

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
        <VehicleInformationSection
          formData={formData}
          vehicle={vehicle}
          isEdit={true}
          isAdmin={isAdmin}
          handleInputChange={handleInputChange}
          handlePurchaseDateChange={handlePurchaseDateChange}
        />

        {/* Purchase Details */}
        <PurchaseDetailsSection
          formData={formData}
          isEdit={true}
          isAdmin={isAdmin}
          handleInputChange={handleInputChange}
          handlePurchaseDateChange={handlePurchaseDateChange}
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
          isEdit={true}
          handleInputChange={handleInputChange}
        />

        {/* Address Details */}
        <AddressDetailsSection
          formData={formData}
          availableTalukas={availableTalukas}
          isEdit={true}
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
          isEdit={true}
        />

        {/* Documents */}
        <VehicleDocumentsSection
          documents={documents}
          onDocumentDrop={onDocumentDrop}
          removeDocument={removeDocument}
          vehicle={vehicle}
        />

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
