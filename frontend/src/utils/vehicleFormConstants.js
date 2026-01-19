// Image categories in fixed order
// First 7 slots accept only one image each
// Last slot (other) allows multiple images
export const IMAGE_CATEGORIES = [
  { key: 'front', label: 'Front', order: 0, maxCount: 1 },
  { key: 'back', label: 'Back', order: 1, maxCount: 1 },
  { key: 'right_side', label: 'Right', order: 2, maxCount: 1 },
  { key: 'left_side', label: 'Left', order: 3, maxCount: 1 },
  { key: 'interior', label: 'Interior 1', order: 4, maxCount: 1 },
  { key: 'interior_2', label: 'Interior 2', order: 5, maxCount: 1 },
  { key: 'engine', label: 'Engine', order: 6, maxCount: 1 },
  { key: 'other', label: 'Other Images', order: 7, maxCount: 10 } // Multiple images allowed
]

export const DOCUMENT_TYPES = [
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

export const FUEL_TYPE_OPTIONS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']

export const PURCHASE_PAYMENT_MODE_OPTIONS = [
  { key: 'cash', label: 'Cash' },
  { key: 'bank_transfer', label: 'Bank Transfer (RTGS/NEFT)' },
  { key: 'deductions', label: 'Deductions' }
]

export const STATUS_OPTIONS = ['On Modification', 'In Stock', 'Reserved', 'Sold', 'Processing']

export const OWNER_TYPE_OPTIONS = ['1st Owner', '2nd Owner', '3rd Owner', 'Custom']
