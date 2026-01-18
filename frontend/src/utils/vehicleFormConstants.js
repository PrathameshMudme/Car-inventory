export const IMAGE_CATEGORIES = [
  { key: 'front', label: 'Front View' },
  { key: 'back', label: 'Back View' },
  { key: 'right_side', label: 'Right Side' },
  { key: 'left_side', label: 'Left Side' },
  { key: 'interior', label: 'Interior' },
  { key: 'engine', label: 'Engine' }
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
