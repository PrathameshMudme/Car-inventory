import { useState, useCallback, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { getDistricts, getTalukas } from '../utils/maharashtraData'
import { captureImageFromCamera } from '../utils/cameraCapture'
import { DOCUMENT_TYPES, IMAGE_CATEGORIES } from '../utils/vehicleFormConstants'

/**
 * Shared hook for vehicle form state and logic
 * Used by both AddVehicle and EditVehicle components
 */
export const useVehicleForm = (initialVehicle = null) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isAdmin = user?.role === 'admin'

  // Initial form data structure
  const getInitialFormData = () => ({
    vehicleNo: '',
    chassisNo: '',
    engineNo: '',
    make: '',
    model: '',
    year: '',
    vehicleMonth: null,
    vehicleYear: null,
    color: '',
    fuelType: 'Petrol',
    kilometers: '',
    purchasePrice: '',
    askingPrice: '',
    lastPrice: '',
    purchaseDate: null,
    sellerName: '',
    sellerContact: '',
    agentName: '',
    agentCommission: '',
    agentPhone: '',
    otherCost: '',
    otherCostNotes: '',
    ownerType: '',
    ownerTypeCustom: '',
    addressLine1: '',
    district: '',
    taluka: '',
    pincode: '',
    remainingAmountToSeller: '',
    notes: '',
    status: 'On Modification',
    // Legacy fields (use agentName/agentPhone instead)
    dealerName: '',
    dealerPhone: ''
  })

  const [formData, setFormData] = useState(getInitialFormData())
  const [purchasePaymentModes, setPurchasePaymentModes] = useState({
    cash: '',
    bank_transfer: '',
    deductions: ''
  })
  const [deductionsNotes, setDeductionsNotes] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [availableTalukas, setAvailableTalukas] = useState([])
  const [images, setImages] = useState({
    front: [],
    back: [],
    right_side: [],
    left_side: [],
    interior: [],
    interior_2: [],
    engine: [],
    other: []
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
  // Track deleted document IDs (for existing documents from backend)
  const [deletedDocumentIds, setDeletedDocumentIds] = useState(new Set())

  // Initialize form data from vehicle (for EditVehicle) or reset to empty (for AddVehicle)
  useEffect(() => {
    if (initialVehicle) {
      // Handle vehicle manufacturing month and year (from year field)
      // Note: For existing vehicles, we only have year, not month
      // User can update month/year if needed in edit mode
      let vehicleMonth = null
      let vehicleYear = null
      
      if (initialVehicle.year) {
        vehicleYear = parseInt(initialVehicle.year)
        // Month is not stored separately, so it will be null
        // User can set it when editing if needed
      }
      
      // Handle purchase date (for display only, purchaseMonth/purchaseYear will come from createdAt)
      let purchaseDateValue = null
      if (initialVehicle.purchaseDate) {
        purchaseDateValue = new Date(initialVehicle.purchaseDate)
      } else if (initialVehicle.createdAt) {
        // Fallback to createdAt if purchaseDate doesn't exist
        purchaseDateValue = new Date(initialVehicle.createdAt)
      }
      
      // Load purchase payment methods
      const paymentMethods = initialVehicle.purchasePaymentMethods || {}
      const paymentModes = {
        cash: paymentMethods.cash ? (paymentMethods.cash === 'NIL' ? '' : paymentMethods.cash.toString()) : '',
        bank_transfer: paymentMethods.bank_transfer ? (paymentMethods.bank_transfer === 'NIL' ? '' : paymentMethods.bank_transfer.toString()) : '',
        deductions: paymentMethods.deductions ? (paymentMethods.deductions === 'NIL' ? '' : paymentMethods.deductions.toString()) : ''
      }
      setPurchasePaymentModes(paymentModes)
      setDeductionsNotes(initialVehicle.deductionsNotes || '')
      
      // Set district and talukas
      if (initialVehicle.district) {
        setSelectedDistrict(initialVehicle.district)
        setAvailableTalukas(getTalukas(initialVehicle.district))
      }
      
      // Populate form data
      setFormData({
        vehicleNo: initialVehicle.vehicleNo || '',
        chassisNo: initialVehicle.chassisNo || '',
        engineNo: initialVehicle.engineNo || '',
        company: initialVehicle.company || '',
        model: initialVehicle.model || '',
        year: initialVehicle.year || '',
        vehicleMonth: vehicleMonth,
        vehicleYear: vehicleYear,
        color: initialVehicle.color || '',
        fuelType: initialVehicle.fuelType || 'Petrol',
        kilometers: initialVehicle.kilometers || '',
        purchasePrice: initialVehicle.purchasePrice || '',
        askingPrice: initialVehicle.askingPrice || '',
        lastPrice: initialVehicle.lastPrice || '',
        purchaseDate: purchaseDateValue,
        ownerType: initialVehicle.ownerType || '',
        ownerTypeCustom: initialVehicle.ownerTypeCustom || '',
        addressLine1: initialVehicle.addressLine1 || '',
        district: initialVehicle.district || '',
        taluka: initialVehicle.taluka || '',
        pincode: initialVehicle.pincode || '',
        remainingAmountToSeller: initialVehicle.remainingAmountToSeller || '',
        sellerName: initialVehicle.sellerName || '',
        sellerContact: initialVehicle.sellerContact || '',
        agentName: initialVehicle.agentName || initialVehicle.dealerName || '',
        agentCommission: initialVehicle.agentCommission !== null && initialVehicle.agentCommission !== undefined && initialVehicle.agentCommission !== 0 ? initialVehicle.agentCommission.toString() : '',
        agentPhone: initialVehicle.agentPhone || initialVehicle.dealerPhone || '',
        otherCost: initialVehicle.otherCost !== null && initialVehicle.otherCost !== undefined && initialVehicle.otherCost !== 0 ? initialVehicle.otherCost.toString() : '',
        otherCostNotes: initialVehicle.otherCostNotes || '',
        notes: initialVehicle.notes || '',
        status: initialVehicle.status || 'On Modification',
        dealerName: initialVehicle.dealerName || '',
        dealerPhone: initialVehicle.dealerPhone || ''
      })

      // Group existing documents by type
      const existingDocs = {}
      const docTypes = ['insurance', 'rc', 'bank_noc', 'kyc', 'tt_form', 'papers_on_hold', 'puc', 'service_record', 'other']
      docTypes.forEach(type => {
        existingDocs[type] = (initialVehicle.documents || []).filter(doc => doc.documentType === type)
      })
      setDocuments(existingDocs)
      // Reset deleted document IDs when loading a new vehicle
      setDeletedDocumentIds(new Set())
    } else {
      // Reset to initial empty state when no initialVehicle (for AddVehicle)
      // This ensures a clean state when adding a new vehicle
      setFormData(getInitialFormData())
      setPurchasePaymentModes({ cash: '', bank_transfer: '', deductions: '' })
      setDeductionsNotes('')
      setSelectedDistrict('')
      setAvailableTalukas([])
      
      // Clean up any existing image previews before resetting
      setImages(prevImages => {
        Object.keys(prevImages).forEach(category => {
          prevImages[category].forEach(imgObj => {
            if (imgObj.preview) URL.revokeObjectURL(imgObj.preview)
          })
        })
        return {
          front: [],
          back: [],
          right_side: [],
          left_side: [],
          interior: [],
          interior_2: [],
          engine: [],
          other: []
        }
      })
      
      // Explicitly reset documents to empty state
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
      setDeletedDocumentIds(new Set())
    }
  }, [initialVehicle])

  // Calculate remaining amount automatically
  const calculateRemainingAmount = useCallback((purchasePrice, paymentModes) => {
    const purchasePriceNum = parseFloat(purchasePrice) || 0
    const cashAmount = parseFloat(paymentModes.cash || 0) || 0
    const bankTransferAmount = parseFloat(paymentModes.bank_transfer || 0) || 0
    const deductionsAmount = parseFloat(paymentModes.deductions || 0) || 0
    
    const totalPaid = cashAmount + bankTransferAmount + deductionsAmount
    const remaining = purchasePriceNum - totalPaid
    
    return remaining > 0 ? remaining : 0
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto-calculate remaining amount when purchase price changes
      if (name === 'purchasePrice') {
        const remaining = calculateRemainingAmount(value, purchasePaymentModes)
        updated.remainingAmountToSeller = remaining.toFixed(2)
      }
      
      return updated
    })
  }, [purchasePaymentModes, calculateRemainingAmount])

  // Handle district change
  const handleDistrictChange = useCallback((event, newValue) => {
    setSelectedDistrict(newValue || '')
    setFormData(prev => ({ ...prev, district: newValue || '', taluka: '' }))
    if (newValue) {
      setAvailableTalukas(getTalukas(newValue))
    } else {
      setAvailableTalukas([])
    }
  }, [])

  // Handle pincode validation
  const handlePincodeChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setFormData(prev => ({ ...prev, pincode: value }))
  }, [])

  // Handle purchase payment mode amount changes
  const handlePaymentModeAmountChange = useCallback((modeKey, value) => {
    const numericValue = value.replace(/[^\d.]/g, '')
    const updatedModes = {
      ...purchasePaymentModes,
      [modeKey]: numericValue
    }
    setPurchasePaymentModes(updatedModes)
    
    // Auto-calculate remaining amount
    const remaining = calculateRemainingAmount(formData.purchasePrice, updatedModes)
    setFormData(prev => ({ ...prev, remainingAmountToSeller: remaining.toFixed(2) }))
  }, [purchasePaymentModes, formData.purchasePrice, calculateRemainingAmount])

  // Handle vehicle manufacturing month/year change (for year field)
  const handleVehicleMonthYearChange = useCallback((newValue) => {
    if (newValue) {
      const month = newValue.getMonth() + 1
      const year = newValue.getFullYear()
      setFormData(prev => ({ 
        ...prev, 
        vehicleMonth: month,
        vehicleYear: year,
        year: year.toString()
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        vehicleMonth: null,
        vehicleYear: null,
        year: ''
      }))
    }
  }, [])
  
  // Handle purchase date change (kept for backward compatibility, but purchaseMonth/purchaseYear are now auto-set from createdAt)
  const handlePurchaseDateChange = useCallback((newValue) => {
    // This function is kept for compatibility but purchaseMonth/purchaseYear are now auto-set from createdAt
    // No longer needed, but kept to avoid breaking existing code
  }, [])

  // Image handling
  const onImageDrop = useCallback((category, acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    
    const imageObjects = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    
    setImages(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), ...imageObjects]
    }))
    showToast(`${acceptedFiles.length} image(s) added`, 'success')
  }, [showToast])

  const removeImage = useCallback((category, index) => {
    setImages(prev => {
      const newImages = [...(prev[category] || [])]
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview)
      }
      newImages.splice(index, 1)
      showToast(`Image removed from ${category}`, 'info')
      return { ...prev, [category]: newImages }
    })
  }, [showToast])

  const handleCameraCapture = useCallback((category) => {
    captureImageFromCamera(
      (files) => onImageDrop(category, files),
      showToast
    )
  }, [onImageDrop, showToast])

  // Document handling
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

  const removeDocument = useCallback((docType, index) => {
    const docTypeConfig = DOCUMENT_TYPES.find(d => d.key === docType)
    if (docTypeConfig) {
      setDocuments(prev => {
        const currentDocs = prev[docType]
        
        if (docTypeConfig.multiple) {
          const docsArray = Array.isArray(currentDocs) ? currentDocs : []
          // If index is provided, remove specific document, otherwise remove all
          if (index !== undefined && index !== null) {
            const docToRemove = docsArray[index]
            // If it's an existing document (has _id), mark it for deletion
            if (docToRemove && docToRemove._id && !(docToRemove instanceof File)) {
              setDeletedDocumentIds(prevIds => new Set([...prevIds, docToRemove._id]))
            }
            return {
              ...prev,
              [docType]: docsArray.filter((_, i) => i !== index)
            }
          } else {
            // Remove all - mark existing documents for deletion
            docsArray.forEach(doc => {
              if (doc && doc._id && !(doc instanceof File)) {
                setDeletedDocumentIds(prevIds => new Set([...prevIds, doc._id]))
              }
            })
            return { ...prev, [docType]: [] }
          }
        } else {
          // Single document
          if (currentDocs && currentDocs._id && !(currentDocs instanceof File)) {
            // Mark existing document for deletion
            setDeletedDocumentIds(prevIds => new Set([...prevIds, currentDocs._id]))
          }
          return { ...prev, [docType]: null }
        }
      })
      showToast(`${docTypeConfig.label} removed`, 'info')
    }
  }, [showToast])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData())
    setPurchasePaymentModes({ cash: '', bank_transfer: '', deductions: '' })
    setDeductionsNotes('')
    setSelectedDistrict('')
    setAvailableTalukas([])
    
    // Clean up image previews
    Object.keys(images).forEach(category => {
      images[category].forEach(imgObj => {
        if (imgObj.preview) URL.revokeObjectURL(imgObj.preview)
      })
    })
      setImages({
        front: [],
        back: [],
        right_side: [],
        left_side: [],
        interior: [],
        interior_2: [],
        engine: [],
        other: []
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
    setDeletedDocumentIds(new Set())
  }, [images])

  // Get filtered documents (excluding deleted ones)
  // For AddVehicle (no initialVehicle), only return File objects (new uploads)
  // For EditVehicle (with initialVehicle), return both File objects and existing documents
  const getFilteredDocuments = useCallback(() => {
    const filtered = {}
    Object.keys(documents).forEach(docType => {
      const docs = documents[docType]
      if (Array.isArray(docs)) {
        filtered[docType] = docs.filter(doc => {
          // In AddVehicle mode (no initialVehicle), only keep File objects
          if (!initialVehicle) {
            return doc instanceof File
          }
          // In EditVehicle mode, keep File objects and existing documents that aren't deleted
          return doc instanceof File || (doc && doc._id && !deletedDocumentIds.has(doc._id))
        })
      } else if (docs) {
        // Single document
        if (!initialVehicle) {
          // In AddVehicle mode, only keep File objects
          filtered[docType] = docs instanceof File ? docs : null
        } else {
          // In EditVehicle mode, check if it's a File or an existing doc that's not deleted
          if (docs instanceof File || (docs._id && !deletedDocumentIds.has(docs._id))) {
            filtered[docType] = docs
          } else {
            filtered[docType] = null
          }
        }
      } else {
        filtered[docType] = null
      }
    })
    return filtered
  }, [documents, deletedDocumentIds, initialVehicle])

  return {
    // State
    formData,
    setFormData,
    purchasePaymentModes,
    setPurchasePaymentModes,
    deductionsNotes,
    setDeductionsNotes,
    selectedDistrict,
    availableTalukas,
    images,
    documents: getFilteredDocuments(), // Return filtered documents
    deletedDocumentIds, // Export for sending to backend
    isAdmin,
    
    // Handlers
    handleInputChange,
    handleDistrictChange,
    handlePincodeChange,
    handlePaymentModeAmountChange,
    handlePurchaseDateChange: handleVehicleMonthYearChange,
    onImageDrop,
    removeImage,
    handleCameraCapture,
    onDocumentDrop,
    removeDocument,
    resetForm,
    calculateRemainingAmount
  }
}
