import React, { useState, useEffect } from 'react'
import VehicleDetails from '../VehicleDetails'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SalesInventory = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareVehicle, setCompareVehicle] = useState('')
  const [visibleLastPrices, setVisibleLastPrices] = useState({})
  const [saleFormData, setSaleFormData] = useState({
    customerName: '',
    customerContact: '',
    customerAlternateContact: '',
    customerEmail: '',
    customerAddress: '',
    customerAadhaar: '',
    customerPAN: '',
    customerSource: '',
    salePrice: '',
    saleDate: '',
    paymentType: 'custom', // Always custom now
    paymentCash: '',
    paymentBankTransfer: '',
    paymentOnline: '',
    paymentLoan: '',
    securityCheque: {
      enabled: false,
      bankName: '',
      accountNumber: '',
      chequeNumber: '',
      amount: ''
    },
    saleNotes: ''
  })
  const { showToast } = useToast()
  const { token, user } = useAuth()

  useEffect(() => {
    loadVehicles()
  }, [token])

  const loadVehicles = async (showSuccessToast = false) => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      // Filter to only show "In Stock" and "Reserved" vehicles for sales
      const availableVehicles = data.filter(v => v.status === 'In Stock' || v.status === 'Reserved')
      setVehicles(availableVehicles)
      if (showSuccessToast && availableVehicles.length > 0) {
        showToast(`Refreshed: ${availableVehicles.length} available vehicle(s)`, 'success')
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleModal(true)
  }

  const toggleLastPriceVisibility = (vehicleId) => {
    setVisibleLastPrices(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }))
  }

  const loadCompareImages = () => {
    if (!compareVehicle) {
      showToast('Please select a vehicle', 'warning')
      return
    }
    const vehicle = vehicles.find(v => v._id === compareVehicle)
    if (vehicle) {
      setSelectedVehicle(vehicle)
      showToast('Images loaded', 'success')
    }
  }

  const getBeforeImages = (vehicle) => {
    return (vehicle.images || []).filter(img => img.stage === 'before')
  }

  const getAfterImages = (vehicle) => {
    return (vehicle.images || []).filter(img => img.stage === 'after')
  }

  const handleSaleFormChange = (field, value) => {
    if (field.startsWith('securityCheque.')) {
      const subField = field.split('.')[1]
      setSaleFormData(prev => ({
        ...prev,
        securityCheque: {
          ...prev.securityCheque,
          [subField]: subField === 'enabled' ? value : (subField === 'amount' ? parseFloat(value) || 0 : value)
        }
      }))
    } else {
      setSaleFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const calculatePaymentTotal = () => {
    const cash = parseFloat(saleFormData.paymentCash) || 0
    const bankTransfer = parseFloat(saleFormData.paymentBankTransfer) || 0
    const online = parseFloat(saleFormData.paymentOnline) || 0
    const loan = parseFloat(saleFormData.paymentLoan) || 0
    const cheque = saleFormData.securityCheque.enabled ? (parseFloat(saleFormData.securityCheque.amount) || 0) : 0
    
    return cash + bankTransfer + online + loan + cheque
  }

  const calculateRemainingAmount = () => {
    const salePrice = parseFloat(saleFormData.salePrice) || 0
    const totalPaid = calculatePaymentTotal()
    return Math.max(0, salePrice - totalPaid)
  }

  // Generate payment method summary for history tracking
  const getPaymentMethodSummary = () => {
    const methods = []
    if (parseFloat(saleFormData.paymentCash) > 0) {
      methods.push(`Cash: ₹${parseFloat(saleFormData.paymentCash).toLocaleString('en-IN')}`)
    }
    if (parseFloat(saleFormData.paymentBankTransfer) > 0) {
      methods.push(`Bank Transfer: ₹${parseFloat(saleFormData.paymentBankTransfer).toLocaleString('en-IN')}`)
    }
    if (parseFloat(saleFormData.paymentOnline) > 0) {
      methods.push(`Online (UPI): ₹${parseFloat(saleFormData.paymentOnline).toLocaleString('en-IN')}`)
    }
    if (parseFloat(saleFormData.paymentLoan) > 0) {
      methods.push(`Loan: ₹${parseFloat(saleFormData.paymentLoan).toLocaleString('en-IN')}`)
    }
    if (saleFormData.securityCheque.enabled && parseFloat(saleFormData.securityCheque.amount) > 0) {
      methods.push(`Security Cheque: ₹${parseFloat(saleFormData.securityCheque.amount).toLocaleString('en-IN')}`)
    }
    return methods.join(', ') || 'No payment method specified'
  }

  const handleMarkAsSold = async (e) => {
    e.preventDefault()
    
    if (!selectedVehicle) {
      showToast('No vehicle selected', 'error')
      return
    }

    const salePrice = parseFloat(saleFormData.salePrice)
    const totalPaid = calculatePaymentTotal()
    const remaining = calculateRemainingAmount()

    if (salePrice <= 0) {
      showToast('Sale price must be greater than 0', 'error')
      return
    }

    // No validation needed - remaining amount will be calculated automatically

    try {
      const formData = new FormData()
      
      // Customer information
      formData.append('customerName', saleFormData.customerName)
      formData.append('customerContact', saleFormData.customerContact)
      formData.append('customerAlternateContact', saleFormData.customerAlternateContact || '')
      formData.append('customerEmail', saleFormData.customerEmail || '')
      formData.append('customerAddress', saleFormData.customerAddress || '')
      formData.append('customerAadhaar', saleFormData.customerAadhaar || '')
      formData.append('customerPAN', saleFormData.customerPAN || '')
      formData.append('customerSource', saleFormData.customerSource)
      
      // Sale information
      formData.append('lastPrice', salePrice)
      formData.append('saleDate', saleFormData.saleDate)
      formData.append('status', 'Sold')
      
      // Payment information
      formData.append('paymentType', 'custom')
      formData.append('paymentCash', parseFloat(saleFormData.paymentCash) || 0)
      formData.append('paymentBankTransfer', parseFloat(saleFormData.paymentBankTransfer) || 0)
      formData.append('paymentOnline', parseFloat(saleFormData.paymentOnline) || 0)
      formData.append('paymentLoan', parseFloat(saleFormData.paymentLoan) || 0)
      
      // Security cheque
      if (saleFormData.securityCheque.enabled) {
        formData.append('paymentSecurityCheque[enabled]', 'true')
        formData.append('paymentSecurityCheque[bankName]', saleFormData.securityCheque.bankName)
        formData.append('paymentSecurityCheque[accountNumber]', saleFormData.securityCheque.accountNumber)
        formData.append('paymentSecurityCheque[chequeNumber]', saleFormData.securityCheque.chequeNumber)
        formData.append('paymentSecurityCheque[amount]', parseFloat(saleFormData.securityCheque.amount) || 0)
      }
      
      // Remaining amount
      formData.append('remainingAmount', remaining)
      
      // Payment method summary for history tracking
      formData.append('paymentMethod', getPaymentMethodSummary())
      
      // Sale notes
      formData.append('saleNotes', saleFormData.saleNotes || '')

      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark vehicle as sold')
      }

      showToast('Vehicle marked as sold successfully!', 'success')
      setShowMarkSoldModal(false)
      setSaleFormData({
        customerName: '',
        customerContact: '',
        customerAlternateContact: '',
        customerEmail: '',
        customerAddress: '',
        customerAadhaar: '',
        customerPAN: '',
        customerSource: '',
        salePrice: '',
        saleDate: '',
        paymentType: 'custom',
        paymentCash: '',
        paymentBankTransfer: '',
        paymentOnline: '',
        paymentLoan: '',
        securityCheque: {
          enabled: false,
          bankName: '',
          accountNumber: '',
          chequeNumber: '',
          amount: ''
        },
        saleNotes: ''
      })
      loadVehicles()
    } catch (error) {
      console.error('Error marking vehicle as sold:', error)
      showToast(error.message || 'Failed to mark vehicle as sold', 'error')
    }
  }

  const resetSaleForm = () => {
    setSaleFormData({
      customerName: '',
      customerContact: '',
      customerAlternateContact: '',
      customerEmail: '',
      customerAddress: '',
      customerAadhaar: '',
      customerPAN: '',
      customerSource: '',
      salePrice: selectedVehicle?.askingPrice || '',
      saleDate: new Date().toISOString().split('T')[0],
        paymentType: 'custom',
      paymentCash: '',
      paymentBankTransfer: '',
      paymentOnline: '',
      paymentLoan: '',
      securityCheque: {
        enabled: false,
        bankName: '',
        accountNumber: '',
        chequeNumber: '',
        amount: ''
      },
      saleNotes: ''
    })
  }

  // Reset form when modal opens
  useEffect(() => {
    if (showMarkSoldModal && selectedVehicle) {
      resetSaleForm()
    }
  }, [showMarkSoldModal, selectedVehicle])

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Stock': return 'badge-success'
      case 'Reserved': return 'badge-purple'
      case 'Sold': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || vehicle.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h2><i className="fas fa-car-side"></i> Available Inventory</h2>
          <p>View vehicles available for sale ({vehicles.length} vehicles)</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Reserved">Reserved</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={() => setShowCompareModal(true)}
          >
            <i className="fas fa-images"></i> Compare
          </button>
          <button className="btn btn-secondary" onClick={() => loadVehicles(true)}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-car"></i>
          <h3>No vehicles available for sale</h3>
          <p>Vehicles with "In Stock" status will appear here</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="sales inventory table">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle No.</TableCell>
              <TableCell>Make/Model</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Asking Price</TableCell>
              <TableCell>Last Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', padding: '40px' }}>
                  No vehicles match your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle._id}>
                  <TableCell><strong>{vehicle.vehicleNo}</strong></TableCell>
                  <TableCell>{vehicle.make} {vehicle.model || ''}</TableCell>
                  <TableCell>{vehicle.year || 'N/A'}</TableCell>
                  <TableCell>{formatPrice(vehicle.askingPrice)}</TableCell>
                  <TableCell>
                    <div className="price-hidden-container">
                      <span
                        className={`price-hidden ${visibleLastPrices[vehicle._id] ? 'visible' : ''}`}
                      >
                          {visibleLastPrices[vehicle._id] ? formatPrice(vehicle.lastPrice || vehicle.askingPrice) : '••••••'}
                      </span>
                      <i
                        className={`fas ${visibleLastPrices[vehicle._id] ? 'fa-eye-slash' : 'fa-eye'} toggle-price`}
                        title={visibleLastPrices[vehicle._id] ? 'Hide Last Price' : 'Show Last Price'}
                        onClick={() => toggleLastPriceVisibility(vehicle._id)}
                      ></i>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`badge ${getStatusBadgeClass(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        className="btn-icon-small"
                        onClick={() => handleViewDetails(vehicle)}
                        title="View"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon-small"
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setShowMarkSoldModal(true)
                        }}
                        title="Mark Sold"
                      >
                        <i className="fas fa-check-circle"></i>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Vehicle Details"
        size="large"
      >
        {selectedVehicle && <VehicleDetails vehicle={selectedVehicle} />}
      </Modal>

      <Modal
        isOpen={showMarkSoldModal}
        onClose={() => {
          setShowMarkSoldModal(false)
          resetSaleForm()
        }}
        title="Mark Vehicle as Sold"
        size="large"
      >
        <form onSubmit={handleMarkAsSold}>
          {selectedVehicle && (
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', marginBottom: '20px' }}>
              <strong>{selectedVehicle.vehicleNo}</strong> - {selectedVehicle.make} {selectedVehicle.model || ''}
              {selectedVehicle.askingPrice && (
                <div style={{ marginTop: '8px', color: '#6c757d', fontSize: '14px' }}>
                  Asking Price: ₹{selectedVehicle.askingPrice.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )}

          <h3 style={{ marginBottom: '15px', fontSize: '18px', color: '#2c3e50' }}>
            <i className="fas fa-user"></i> Customer Information
          </h3>
          
          <div className="form-group">
            <label>Customer Name <span className="required">*</span></label>
            <input 
              type="text" 
              placeholder="Enter customer name" 
              value={saleFormData.customerName}
              onChange={(e) => handleSaleFormChange('customerName', e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Contact Number <span className="required">*</span></label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210" 
                value={saleFormData.customerContact}
                onChange={(e) => handleSaleFormChange('customerContact', e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Alternate Mobile Number</label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210" 
                value={saleFormData.customerAlternateContact}
                onChange={(e) => handleSaleFormChange('customerAlternateContact', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="customer@email.com" 
              value={saleFormData.customerEmail}
              onChange={(e) => handleSaleFormChange('customerEmail', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea 
              placeholder="Enter customer address" 
              rows="3"
              value={saleFormData.customerAddress}
              onChange={(e) => handleSaleFormChange('customerAddress', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input 
                type="text" 
                placeholder="XXXX XXXX XXXX" 
                maxLength="14"
                value={saleFormData.customerAadhaar}
                onChange={(e) => handleSaleFormChange('customerAadhaar', e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
              />
            </div>
            <div className="form-group">
              <label>PAN Number</label>
              <input 
                type="text" 
                placeholder="ABCDE1234F" 
                maxLength="10"
                style={{ textTransform: 'uppercase' }}
                value={saleFormData.customerPAN}
                onChange={(e) => handleSaleFormChange('customerPAN', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Customer Source <span className="required">*</span></label>
            <select 
              value={saleFormData.customerSource}
              onChange={(e) => handleSaleFormChange('customerSource', e.target.value)}
              required
            >
              <option value="">Select Source</option>
              <option value="agent">Agent</option>
              <option value="walkin">Walk-in</option>
              <option value="online">Online</option>
            </select>
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '18px', color: '#2c3e50' }}>
            <i className="fas fa-rupee-sign"></i> Sale Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Sale Price <span className="required">*</span></label>
              <input 
                type="number" 
                placeholder="980000" 
                value={saleFormData.salePrice}
                onChange={(e) => handleSaleFormChange('salePrice', e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Sale Date <span className="required">*</span></label>
              <input 
                type="date" 
                value={saleFormData.saleDate}
                onChange={(e) => handleSaleFormChange('saleDate', e.target.value)}
                required 
              />
            </div>
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '18px', color: '#2c3e50' }}>
            <i className="fas fa-credit-card"></i> Payment Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>Cash</label>
              <input 
                type="number" 
                placeholder="0" 
                min="0"
                value={saleFormData.paymentCash}
                onChange={(e) => handleSaleFormChange('paymentCash', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Bank Transfer (RTGS/NEFT)</label>
              <input 
                type="number" 
                placeholder="0" 
                min="0"
                value={saleFormData.paymentBankTransfer}
                onChange={(e) => handleSaleFormChange('paymentBankTransfer', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Online (UPI)</label>
              <input 
                type="number" 
                placeholder="0" 
                min="0"
                value={saleFormData.paymentOnline}
                onChange={(e) => handleSaleFormChange('paymentOnline', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>By Loan</label>
              <input 
                type="number" 
                placeholder="0" 
                min="0"
                value={saleFormData.paymentLoan}
                onChange={(e) => handleSaleFormChange('paymentLoan', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label htmlFor="securityChequeCheckbox" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <input 
                type="checkbox" 
                id="securityChequeCheckbox"
                checked={saleFormData.securityCheque.enabled}
                onChange={(e) => handleSaleFormChange('securityCheque.enabled', e.target.checked)}
                style={{ width: '18px', height: '18px', margin: 0 }}
              />
              <span style={{ fontWeight: 500, color: '#333' }}>Security Cheque</span>
            </label>
          </div>

          {saleFormData.securityCheque.enabled && (
            <div style={{ 
              padding: '20px', 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              marginTop: '15px', 
              border: '1px solid #e9ecef',
              width: '100%'
            }}>
              <h4 style={{ marginBottom: '15px', fontSize: '16px', color: '#2c3e50', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-university"></i> Security Cheque Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', width: '100%' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Bank Name <span className="required">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Enter bank name" 
                    value={saleFormData.securityCheque.bankName}
                    onChange={(e) => handleSaleFormChange('securityCheque.bankName', e.target.value)}
                    required={saleFormData.securityCheque.enabled}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Account Number <span className="required">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Enter account number" 
                    value={saleFormData.securityCheque.accountNumber}
                    onChange={(e) => handleSaleFormChange('securityCheque.accountNumber', e.target.value)}
                    required={saleFormData.securityCheque.enabled}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Cheque Number <span className="required">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Enter cheque number" 
                    value={saleFormData.securityCheque.chequeNumber}
                    onChange={(e) => handleSaleFormChange('securityCheque.chequeNumber', e.target.value)}
                    required={saleFormData.securityCheque.enabled}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Cheque Amount <span className="required">*</span></label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    value={saleFormData.securityCheque.amount}
                    onChange={(e) => handleSaleFormChange('securityCheque.amount', e.target.value)}
                    required={saleFormData.securityCheque.enabled}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: saleFormData.salePrice && calculateRemainingAmount() > 0 ? '#fff3cd' : '#d4edda', 
            borderRadius: '8px',
            border: `1px solid ${saleFormData.salePrice && calculateRemainingAmount() > 0 ? '#ffc107' : '#28a745'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>Sale Price:</strong>
              <strong>₹{saleFormData.salePrice ? parseFloat(saleFormData.salePrice).toLocaleString('en-IN') : '0'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Total Paid:</span>
              <span>₹{calculatePaymentTotal().toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
              <span>Remaining Amount:</span>
              <span style={{ color: calculateRemainingAmount() > 0 ? '#dc3545' : '#28a745' }}>
                ₹{calculateRemainingAmount().toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          
          <div className="form-group">
            <label style={{ marginTop: '25px', marginBottom: '15px', fontSize: '18px', color: '#2c3e50' }}>Additional Notes</label>
            <textarea 
              placeholder="Enter any additional notes or comments about this sale..." 
              rows="4"
              value={saleFormData.saleNotes}
              onChange={(e) => handleSaleFormChange('saleNotes', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #e9ecef', 
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '25px', display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowMarkSoldModal(false)
                resetSaleForm()
              }}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a6268'}
              onMouseOut={(e) => e.target.style.background = '#6c757d'}
            >
              <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                background: 'var(--primary-color, #667eea)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#5568d3'
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'var(--primary-color, #667eea)'
                e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
            >
              <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
              Mark as Sold
            </button>
          </div>
        </form>
      </Modal>

      {/* Compare Modal */}
      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="Before & After Modification"
        size="large"
      >
        <div className="compare-selection">
          <div className="form-group">
            <label>Select Vehicle</label>
            <select
              value={compareVehicle}
              onChange={(e) => setCompareVehicle(e.target.value)}
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.vehicleNo} - {v.make} {v.model || ''} {v.year || ''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadCompareImages}>
            <i className="fas fa-sync"></i> Load Images
          </button>
        </div>

        {selectedVehicle && compareVehicle && (
          <div className="before-after-container" style={{ marginTop: '30px' }}>
            <div className="vehicle-header" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
              <h3>{selectedVehicle.make} {selectedVehicle.model || ''} {selectedVehicle.year || ''} - {selectedVehicle.vehicleNo}</h3>
              <span className={`badge ${getStatusBadgeClass(selectedVehicle.status)}`}>
                {selectedVehicle.status}
              </span>
            </div>

            <div className="before-after-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {/* Before Images */}
              <div className="image-section" style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                <div className="section-header" style={{ marginBottom: '15px' }}>
                  <h4><i className="fas fa-camera"></i> Before Modification</h4>
                </div>
                <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {getBeforeImages(selectedVehicle).length > 0 ? (
                    getBeforeImages(selectedVehicle).map((img, idx) => (
                      <div key={idx} className="image-item">
                        <img 
                          src={`${API_URL.replace('/api', '')}${img.imageUrl}`} 
                          alt={img.category}
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#6c757d', textTransform: 'capitalize' }}>
                          {img.category.replace('_', ' ')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6c757d', gridColumn: '1 / -1' }}>No before images uploaded</p>
                  )}
                </div>
              </div>

              {/* After Images */}
              <div className="image-section" style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                <div className="section-header" style={{ marginBottom: '15px' }}>
                  <h4><i className="fas fa-tools"></i> After Modification</h4>
                </div>
                <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {getAfterImages(selectedVehicle).length > 0 ? (
                    getAfterImages(selectedVehicle).map((img, idx) => (
                      <div key={idx} className="image-item">
                        <img 
                          src={`${API_URL.replace('/api', '')}${img.imageUrl}`} 
                          alt={img.category}
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#6c757d', textTransform: 'capitalize' }}>
                          {img.category.replace('_', ' ')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6c757d', gridColumn: '1 / -1' }}>No after images uploaded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesInventory
