import { IMAGE_CATEGORIES, DOCUMENT_TYPES } from './vehicleFormConstants'

/**
 * Format payment value for display - shows "NIL" for 0, null, undefined, or empty
 */
export const formatPaymentValue = (value) => {
  if (value === null || value === undefined || value === '' || value === 'NIL') {
    return 'NIL'
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue) || numValue === 0) {
    return 'NIL'
  }
  return numValue
}

/**
 * Parse payment value from input - converts "NIL" to 0 or empty string
 */
export const parsePaymentValue = (value) => {
  if (!value || value === 'NIL' || value.toString().trim().toUpperCase() === 'NIL') {
    return ''
  }
  const numValue = parseFloat(value)
  return isNaN(numValue) ? '' : numValue.toString()
}

/**
 * Build purchase payment methods object for FormData
 */
export const buildPurchasePaymentMethods = (purchasePaymentModes) => {
  const purchasePaymentMethodsObj = {}
  Object.entries(purchasePaymentModes).forEach(([modeKey, amount]) => {
    if (amount && amount.trim() !== '' && amount.toString().toUpperCase() !== 'NIL') {
      const amountNum = parseFloat(amount)
      if (!isNaN(amountNum) && amountNum > 0) {
        purchasePaymentMethodsObj[modeKey] = amountNum
      } else {
        purchasePaymentMethodsObj[modeKey] = 'NIL'
      }
    } else {
      purchasePaymentMethodsObj[modeKey] = 'NIL'
    }
  })
  return purchasePaymentMethodsObj
}

/**
 * Prepare FormData for vehicle submission (POST or PUT)
 */
export const prepareVehicleFormData = (formData, purchasePaymentModes, deductionsNotes, images, documents, isAdmin = false, isEdit = false, deletedDocumentIds = null) => {
  const formDataToSend = new FormData()

  // Build purchase payment methods
  const purchasePaymentMethodsObj = buildPurchasePaymentMethods(purchasePaymentModes)
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

  // Add form fields
  Object.keys(formData).forEach(key => {
    // Skip askingPrice if not admin (for AddVehicle)
    if (key === 'askingPrice' && !isAdmin && !isEdit) {
      return
    }
    
    // Skip legacy dealerName/dealerPhone fields in edit mode (use agentName/agentPhone instead)
    if (isEdit && (key === 'dealerName' || key === 'dealerPhone')) {
      return
    }
    
    // Skip purchaseMonth/purchaseYear - these are now auto-set from createdAt on backend
    if (key === 'purchaseMonth' || key === 'purchaseYear') {
      return
    }
    
    // Skip vehicleMonth/vehicleYear - these are used to set the year field, handled separately
    if (key === 'vehicleMonth' || key === 'vehicleYear') {
      return
    }
    
    if (key === 'purchaseDate' && formData[key]) {
      formDataToSend.append(key, formData[key].toISOString().split('T')[0])
    } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
      formDataToSend.append(key, formData[key])
    }
  })
  
  // Handle vehicle manufacturing month/year - send as year field
  // Use vehicleYear if available, otherwise use year field directly
  if (formData.vehicleYear) {
    formDataToSend.append('year', formData.vehicleYear)
  } else if (formData.year) {
    formDataToSend.append('year', formData.year)
  }

  // Handle legacy dealerName/dealerPhone fields in edit mode (use agentName/agentPhone instead)
  if (isEdit) {
    if (!formData.agentName && formData.dealerName) {
      formDataToSend.append('agentName', formData.dealerName)
    }
    if (!formData.agentPhone && formData.dealerPhone) {
      formDataToSend.append('agentPhone', formData.dealerPhone)
    }
  }

  // Add images in fixed order
  IMAGE_CATEGORIES.forEach(category => {
    const categoryImages = images[category.key] || []
    categoryImages.forEach((imgObj) => {
      const fieldName = category.key === 'right_side' ? 'right_side_images' :
                       category.key === 'left_side' ? 'left_side_images' :
                       category.key === 'interior_2' ? 'interior_2_images' :
                       `${category.key}_images`
      if (imgObj.file) {
        formDataToSend.append(fieldName, imgObj.file)
        // Note: Order is calculated on backend from imageSlots array, no need to send it
      }
    })
  })

  // Add documents (only File objects for new uploads)
  DOCUMENT_TYPES.forEach(docType => {
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

  // Add deleted document IDs (for edit mode)
  if (isEdit && deletedDocumentIds && deletedDocumentIds.size > 0) {
    formDataToSend.append('deletedDocumentIds', JSON.stringify(Array.from(deletedDocumentIds)))
  }

  return formDataToSend
}

/**
 * Validate vehicle form data
 */
export const validateVehicleForm = (formData, purchasePaymentModes, showToast, isEdit = false) => {
  // Validate pincode
  if (formData.pincode && formData.pincode.length !== 6) {
    showToast('Pincode must be exactly 6 digits', 'error')
    return false
  }

  // Validate owner type custom
  if (formData.ownerType === 'Custom' && !formData.ownerTypeCustom?.trim()) {
    showToast('Please enter custom owner description', 'error')
    return false
  }

  // Validate district and taluka
  if (formData.district && !formData.taluka) {
    showToast('Please select a taluka', 'error')
    return false
  }

  // Validate at least one payment mode has a value (only for AddVehicle)
  if (!isEdit) {
    const hasPaymentMode = Object.values(purchasePaymentModes).some(amount => amount && parseFloat(amount) > 0)
    if (!hasPaymentMode) {
      showToast('Please enter at least one payment amount', 'error')
      return false
    }
  }

  // Required fields (only for AddVehicle)
  if (!isEdit) {
    const requiredFields = {
      vehicleNo: 'Vehicle Number',
      chassisNo: 'Chassis Number',
      engineNo: 'Engine Number',
      company: 'Company',
      model: 'Model',
      color: 'Color',
      kilometers: 'Kilometers',
      purchasePrice: 'Purchase Price',
      vehicleYear: 'Manufacturing Month & Year',
      sellerName: 'Seller Name',
      sellerContact: 'Seller Contact',
      agentName: 'Agent Name',
      addressLine1: 'Address Line 1',
      district: 'District',
      taluka: 'Taluka',
      pincode: 'Pincode'
    }

    for (const [key, label] of Object.entries(requiredFields)) {
      if (key === 'vehicleYear') {
        // Check if vehicleMonth and vehicleYear are provided
        if (!formData.vehicleMonth || !formData.vehicleYear) {
          showToast('Manufacturing Month & Year is required', 'error')
          return false
        }
        continue
      }
      if (key === 'vehicleMonth') {
        continue // Already checked above
      }
      
      if (!formData[key] || (typeof formData[key] === 'string' && !formData[key].trim())) {
        showToast(`${label} is required`, 'error')
        return false
      }
    }
  }

  return true
}
