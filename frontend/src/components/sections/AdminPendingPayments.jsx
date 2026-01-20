import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber, formatManufacturingDate } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminPendingPayments = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
  const [showSettlementHistory, setShowSettlementHistory] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'from_customer', 'to_seller'
  const { token, user } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (token) {
      loadVehicles()
    } else {
      setLoading(false)
    }
  }, [token, filterType])

  const loadVehicles = async () => {
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
      // Filter vehicles with pending payments (from customer OR to seller)
      let pendingVehicles = (data || []).filter(vehicle => {
        const remainingFromCustomer = parseFloat(vehicle.remainingAmount) || 0
        const remainingToSeller = parseFloat(vehicle.remainingAmountToSeller) || 0
        return remainingFromCustomer > 0 || remainingToSeller > 0
      })
      
      // Apply filter
      if (filterType === 'from_customer') {
        pendingVehicles = pendingVehicles.filter(v => (parseFloat(v.remainingAmount) || 0) > 0)
      } else if (filterType === 'to_seller') {
        pendingVehicles = pendingVehicles.filter(v => (parseFloat(v.remainingAmountToSeller) || 0) > 0)
      }
      
      setVehicles(pendingVehicles)
    } catch (error) {
      console.error('Error loading pending payments:', error)
      showToast('Failed to load pending payments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return '₹0'
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)}Cr`
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatMonthYear = (vehicle) => {
    // Try purchaseMonth/purchaseYear first (may be set from createdAt)
    if (vehicle.purchaseMonth && vehicle.purchaseYear) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[vehicle.purchaseMonth - 1]} ${vehicle.purchaseYear}`
    }
    // Fallback to purchaseDate
    if (vehicle.purchaseDate) {
      const date = new Date(vehicle.purchaseDate)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
    // Fallback to createdAt (when vehicle was added)
    if (vehicle.createdAt) {
      const date = new Date(vehicle.createdAt)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
    return 'N/A'
  }

  const handleMarkAsPaid = (vehicle, paymentType) => {
    setSelectedVehicle(vehicle)
    // paymentType: 'from_customer' or 'to_seller'
    const amount = paymentType === 'from_customer' 
      ? (vehicle.remainingAmount?.toString() || '0')
      : (vehicle.remainingAmountToSeller?.toString() || '0')
    setPaymentAmount(amount)
    setPaymentMode('cash')
    setShowMarkPaidModal(true)
  }
  
  const getPaymentType = (vehicle) => {
    const fromCustomer = parseFloat(vehicle.remainingAmount) || 0
    const toSeller = parseFloat(vehicle.remainingAmountToSeller) || 0
    if (fromCustomer > 0 && toSeller > 0) return 'both'
    if (fromCustomer > 0) return 'from_customer'
    if (toSeller > 0) return 'to_seller'
    return 'none'
  }

  const handleSubmitMarkPaid = async (e) => {
    e.preventDefault()
    
    if (!selectedVehicle) {
      showToast('No vehicle selected', 'error')
      return
    }

    const amount = parseFloat(paymentAmount)
    const paymentType = getPaymentType(selectedVehicle)
    const remainingFromCustomer = parseFloat(selectedVehicle.remainingAmount) || 0
    const remainingToSeller = parseFloat(selectedVehicle.remainingAmountToSeller) || 0
    
    // Determine which payment we're marking as paid
    let isFromCustomer = false
    let remaining = 0
    
    if (paymentType === 'both') {
      // If both exist, check which one matches the amount
      if (Math.abs(amount - remainingFromCustomer) < Math.abs(amount - remainingToSeller)) {
        isFromCustomer = true
        remaining = remainingFromCustomer
      } else {
        isFromCustomer = false
        remaining = remainingToSeller
      }
    } else if (paymentType === 'from_customer') {
      isFromCustomer = true
      remaining = remainingFromCustomer
    } else if (paymentType === 'to_seller') {
      isFromCustomer = false
      remaining = remainingToSeller
    }

    if (amount <= 0) {
      showToast('Payment amount must be greater than 0', 'error')
      return
    }

    if (amount > remaining) {
      showToast(`Payment amount cannot exceed remaining amount of ${formatPrice(remaining)}`, 'error')
      return
    }

    try {
      const formData = new FormData()
      
      // Calculate new payment amounts
      const currentCash = parseFloat(selectedVehicle.paymentCash) || 0
      const currentBankTransfer = parseFloat(selectedVehicle.paymentBankTransfer) || 0
      const currentOnline = parseFloat(selectedVehicle.paymentOnline) || 0
      const currentLoan = parseFloat(selectedVehicle.paymentLoan) || 0
      
      // Add payment to the selected mode
      if (paymentMode === 'cash') {
        formData.append('paymentCash', currentCash + amount)
        formData.append('paymentBankTransfer', currentBankTransfer)
        formData.append('paymentOnline', currentOnline)
        formData.append('paymentLoan', currentLoan)
      } else if (paymentMode === 'bankTransfer') {
        formData.append('paymentCash', currentCash)
        formData.append('paymentBankTransfer', currentBankTransfer + amount)
        formData.append('paymentOnline', currentOnline)
        formData.append('paymentLoan', currentLoan)
      } else if (paymentMode === 'online') {
        formData.append('paymentCash', currentCash)
        formData.append('paymentBankTransfer', currentBankTransfer)
        formData.append('paymentOnline', currentOnline + amount)
        formData.append('paymentLoan', currentLoan)
      } else if (paymentMode === 'loan') {
        formData.append('paymentCash', currentCash)
        formData.append('paymentBankTransfer', currentBankTransfer)
        formData.append('paymentOnline', currentOnline)
        formData.append('paymentLoan', currentLoan + amount)
      }
      
      // Update remaining amount based on payment type
      if (isFromCustomer) {
        const newRemaining = remainingFromCustomer - amount
        formData.append('remainingAmount', newRemaining)
        
        // If security cheque was used and now fully paid, disable it
        if (selectedVehicle.paymentSecurityCheque?.enabled && newRemaining === 0) {
          formData.append('paymentSecurityCheque[enabled]', 'false')
        }
        if (newRemaining === 0 && remainingToSeller === 0) {
          formData.append('pendingPaymentType', '')
        }
      } else {
        const newRemainingToSeller = remainingToSeller - amount
        formData.append('remainingAmountToSeller', newRemainingToSeller)
        
        if (newRemainingToSeller === 0 && remainingFromCustomer === 0) {
          formData.append('pendingPaymentType', '')
        } else if (newRemainingToSeller === 0) {
          formData.append('pendingPaymentType', 'PENDING_FROM_CUSTOMER')
        }
      }
      
      // Update payment method summary
      const paymentMethods = []
      const finalCash = paymentMode === 'cash' ? currentCash + amount : currentCash
      const finalBank = paymentMode === 'bankTransfer' ? currentBankTransfer + amount : currentBankTransfer
      const finalOnline = paymentMode === 'online' ? currentOnline + amount : currentOnline
      const finalLoan = paymentMode === 'loan' ? currentLoan + amount : currentLoan
      
      if (finalCash > 0) paymentMethods.push(`Cash: ₹${finalCash.toLocaleString('en-IN')}`)
      if (finalBank > 0) paymentMethods.push(`Bank Transfer: ₹${finalBank.toLocaleString('en-IN')}`)
      if (finalOnline > 0) paymentMethods.push(`Online (UPI): ₹${finalOnline.toLocaleString('en-IN')}`)
      if (finalLoan > 0) paymentMethods.push(`Loan: ₹${finalLoan.toLocaleString('en-IN')}`)
      
      formData.append('paymentMethod', paymentMethods.join(', ') || 'No payment method specified')
      
      // Add audit note
      const paymentTypeLabel = isFromCustomer ? 'Customer Payment' : 'Seller Payment'
      const auditNote = `Marked ${paymentTypeLabel} as paid: ₹${amount.toLocaleString('en-IN')} via ${paymentMode} on ${new Date().toLocaleDateString('en-IN')} by ${user?.name || user?.email}`
      const existingNotes = selectedVehicle.saleNotes || selectedVehicle.notes || ''
      formData.append('saleNotes', existingNotes ? `${existingNotes}\n${auditNote}` : auditNote)

      const response = await fetch(`${API_URL}/vehicles/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark as paid')
      }

      showToast(`Payment of ${formatPrice(amount)} marked as paid successfully!`, 'success')
      setShowMarkPaidModal(false)
      setSelectedVehicle(null)
      setPaymentAmount('')
      setPaymentMode('cash')
      loadVehicles()
    } catch (error) {
      console.error('Error marking as paid:', error)
      showToast(error.message || 'Failed to mark as paid', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(255, 255, 255, 0.5) 100%)',
        border: '2px dashed rgba(102, 126, 234, 0.2)'
      }}>
        <i className="fas fa-spinner fa-spin" style={{ 
          fontSize: '48px', 
          color: '#667eea',
          marginBottom: '20px'
        }}></i>
        <p style={{ 
          fontSize: '16px', 
          color: '#667eea',
          fontWeight: '600',
          margin: 0
        }}>Loading pending payments...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Pending Payments</h2>
          <p>Vehicles with outstanding payments ({vehicles.length} vehicles)</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Pending</option>
            <option value="from_customer">From Customer</option>
            <option value="to_seller">To Seller</option>
          </select>
          <button className="btn btn-secondary" onClick={() => loadVehicles()} title="Refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-check-circle"></i>
          <h3>No Pending Payments</h3>
          <p>All vehicles have been fully paid</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="pending payments table">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle No.</TableCell>
              <TableCell>Company/Model</TableCell>
              <TableCell>Purchase Date</TableCell>
              <TableCell>Pending Payment</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => {
              const fromCustomer = parseFloat(vehicle.remainingAmount) || 0
              const toSeller = parseFloat(vehicle.remainingAmountToSeller) || 0
              
              return (
                <TableRow key={vehicle._id}>
                  <TableCell>
                    <strong>{formatVehicleNumber(vehicle.vehicleNo) || 'N/A'}</strong>
                  </TableCell>
                  <TableCell>
                    {vehicle.company || 'N/A'} {vehicle.model || ''}
                  </TableCell>
                  <TableCell>{formatMonthYear(vehicle)}</TableCell>
                  <TableCell>
                    {(() => {
                      if (fromCustomer > 0 && toSeller > 0) {
                        return (
                          <div>
                            <div style={{ marginBottom: '8px' }}>
                              <span className="badge badge-success" style={{ marginRight: '8px' }}>From Customer</span>
                              <strong>{formatPrice(fromCustomer)}</strong>
                            </div>
                            <div>
                              <span className="badge badge-danger" style={{ marginRight: '8px' }}>To Seller</span>
                              <strong>{formatPrice(toSeller)}</strong>
                            </div>
                          </div>
                        )
                      } else if (fromCustomer > 0) {
                        return (
                          <div>
                            <span className="badge badge-success" style={{ marginRight: '8px' }}>From Customer</span>
                            <strong>{formatPrice(fromCustomer)}</strong>
                          </div>
                        )
                      } else if (toSeller > 0) {
                        return (
                          <div>
                            <span className="badge badge-danger" style={{ marginRight: '8px' }}>To Seller</span>
                            <strong>{formatPrice(toSeller)}</strong>
                          </div>
                        )
                      } else {
                        return 'N/A'
                      }
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        className="btn-icon-small"
                        title="View Details"
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setShowDetailsModal(true)
                        }}
                      >
                        <i className="fas fa-info-circle"></i>
                      </button>
                      {fromCustomer > 0 && (
                        <button
                          className="btn-icon-small"
                          title="Mark Customer Payment as Paid"
                          onClick={() => handleMarkAsPaid(vehicle, 'from_customer')}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      {toSeller > 0 && (
                        <button
                          className="btn-icon-small"
                          title="Mark Seller Payment as Paid"
                          onClick={() => handleMarkAsPaid(vehicle, 'to_seller')}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      {vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0 && (
                        <button
                          className="btn-icon-small"
                          title="View Settlement History"
                          onClick={() => {
                            setSelectedVehicle(vehicle)
                            setShowSettlementHistory(true)
                          }}
                        >
                          <i className="fas fa-history"></i>
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Mark as Paid Modal */}
      <Modal
        isOpen={showMarkPaidModal}
        onClose={() => {
          setShowMarkPaidModal(false)
          setSelectedVehicle(null)
          setPaymentAmount('')
          setPaymentMode('cash')
        }}
        title="Mark Payment as Paid"
        size="medium"
      >
        {selectedVehicle && (
          <form onSubmit={handleSubmitMarkPaid}>
            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Vehicle</label>
              <input 
                type="text" 
                value={`${formatVehicleNumber(selectedVehicle.vehicleNo)} - ${selectedVehicle.company} ${selectedVehicle.model}`}
                disabled
                style={{ 
                  background: '#f5f5f5', 
                  padding: '14px',
                  fontSize: '16px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  width: '100%'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Payment Type</label>
              <div style={{ 
                background: '#f5f5f5', 
                fontWeight: 'bold',
                padding: '14px',
                fontSize: '16px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {getPaymentType(selectedVehicle) === 'from_customer' ? (
                  <>
                    <i className="fas fa-arrow-down" style={{ color: '#28a745' }}></i>
                    <span>From Customer</span>
                  </>
                ) : getPaymentType(selectedVehicle) === 'to_seller' ? (
                  <>
                    <i className="fas fa-arrow-up" style={{ color: '#dc3545' }}></i>
                    <span>To Customer</span>
                  </>
                ) : (
                  <span>Both</span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Remaining Amount</label>
              <input 
                type="text" 
                value={formatPrice(getPaymentType(selectedVehicle) === 'from_customer' ? 
                  (selectedVehicle.remainingAmount || 0) : 
                  (selectedVehicle.remainingAmountToSeller || 0))}
                disabled
                style={{ 
                  background: '#f5f5f5', 
                  color: '#dc3545', 
                  fontWeight: 'bold',
                  padding: '14px',
                  fontSize: '18px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  width: '100%'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Payment Mode <span className="required">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  border: '1px solid #e9ecef', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="cash">Cash</option>
                <option value="bankTransfer">Bank Transfer (RTGS/NEFT)</option>
                <option value="online">Online (UPI)</option>
                <option value="loan">By Loan</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Payment Amount <span className="required">*</span>
              </label>
              <input 
                type="number" 
                placeholder="Enter amount" 
                min="0"
                max={selectedVehicle.remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  width: '100%'
                }}
              />
              <small style={{ color: '#6c757d', marginTop: '8px', display: 'block', fontSize: '14px' }}>
                Maximum: {formatPrice(selectedVehicle.remainingAmount)}
              </small>
            </div>

            <div className="form-actions" style={{ marginTop: '25px', display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowMarkPaidModal(false)
                  setSelectedVehicle(null)
                  setPaymentAmount('')
                  setPaymentMode('cash')
                }}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
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
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                Mark as Paid
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Vehicle Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedVehicle(null)
        }}
        title={`Vehicle Details - ${selectedVehicle ? formatVehicleNumber(selectedVehicle.vehicleNo) : ''}`}
        size="large"
      >
        {selectedVehicle && (
          <div style={{ padding: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  marginBottom: '20px', 
                  color: '#667eea', 
                  borderBottom: '3px solid #667eea', 
                  paddingBottom: '12px',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-car" style={{ marginRight: '10px' }}></i>Vehicle Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Company/Model:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {selectedVehicle.company || 'N/A'} {selectedVehicle.model || ''}
                    </div>
                  </div>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Year:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {formatManufacturingDate(selectedVehicle)}
                    </div>
                  </div>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Color:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {selectedVehicle.color || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Purchase Date:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {formatMonthYear(selectedVehicle)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  marginBottom: '20px', 
                  color: '#667eea', 
                  borderBottom: '3px solid #667eea', 
                  paddingBottom: '12px',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  <i className="fas fa-users" style={{ marginRight: '10px' }}></i>People Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Added By:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {selectedVehicle.createdBy?.name || selectedVehicle.createdBy?.email || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Agent Name:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {selectedVehicle.agentName || selectedVehicle.dealerName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <strong style={{ 
                      color: '#6c757d', 
                      fontSize: '13px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Seller Name:</strong>
                    <div style={{ marginTop: '4px', fontSize: '17px', fontWeight: '600', color: '#212529' }}>
                      {selectedVehicle.sellerName || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ 
                marginBottom: '15px', 
                color: '#667eea', 
                borderBottom: '3px solid #667eea', 
                paddingBottom: '12px',
                fontSize: '18px',
                fontWeight: '700'
              }}>
                <i className="fas fa-sticky-note" style={{ marginRight: '10px' }}></i>Notes
              </h4>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                minHeight: '80px',
                whiteSpace: 'pre-wrap',
                color: '#495057',
                fontSize: '15px',
                lineHeight: '1.6',
                border: '1px solid #e9ecef'
              }}>
                {selectedVehicle.saleNotes || selectedVehicle.notes || 'No notes available'}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'flex-end', 
              marginTop: '30px', 
              paddingTop: '25px', 
              borderTop: '2px solid #e9ecef' 
            }}>
              {selectedVehicle.paymentSettlementHistory && selectedVehicle.paymentSettlementHistory.length > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowSettlementHistory(true)
                  }}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#5568d3'}
                  onMouseLeave={(e) => e.target.style.background = '#667eea'}
                >
                  <i className="fas fa-history" style={{ marginRight: '8px' }}></i>
                  View Settlement History ({selectedVehicle.paymentSettlementHistory.length})
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedVehicle(null)
                }}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                onMouseLeave={(e) => e.target.style.background = '#6c757d'}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Settlement History Modal */}
      <Modal
        isOpen={showSettlementHistory}
        onClose={() => {
          setShowSettlementHistory(false)
          setSelectedVehicle(null)
        }}
        title={`Settlement History - ${selectedVehicle ? formatVehicleNumber(selectedVehicle.vehicleNo) : ''}`}
        size="large"
      >
        {selectedVehicle && selectedVehicle.paymentSettlementHistory && selectedVehicle.paymentSettlementHistory.length > 0 ? (
          <div style={{ padding: '30px' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '15px', fontWeight: '700', padding: '16px' }}>Date</TableCell>
                  <TableCell sx={{ fontSize: '15px', fontWeight: '700', padding: '16px' }}>Type</TableCell>
                  <TableCell sx={{ fontSize: '15px', fontWeight: '700', padding: '16px' }}>Amount</TableCell>
                  <TableCell sx={{ fontSize: '15px', fontWeight: '700', padding: '16px' }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontSize: '15px', fontWeight: '700', padding: '16px' }}>Settled By</TableCell>
                  <TableCell sx={{ fontSize: '15px', fontWeight: '700', padding: '16px' }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...selectedVehicle.paymentSettlementHistory]
                  .sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt))
                  .map((settlement, index) => (
                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                      <TableCell>
                        <div style={{ fontSize: '15px', color: '#495057' }}>
                          {new Date(settlement.settledAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>
                          {new Date(settlement.settledAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '700',
                          backgroundColor: settlement.settlementType === 'FROM_CUSTOMER' 
                            ? 'rgba(40, 167, 69, 0.15)' 
                            : 'rgba(220, 53, 69, 0.15)',
                          color: settlement.settlementType === 'FROM_CUSTOMER' 
                            ? '#28a745' 
                            : '#dc3545',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {settlement.settlementType === 'FROM_CUSTOMER' ? (
                            <>
                              <i className="fas fa-arrow-down" style={{ marginRight: '6px' }}></i>
                              From Customer
                            </>
                          ) : (
                            <>
                              <i className="fas fa-arrow-up" style={{ marginRight: '6px' }}></i>
                              To Customer
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <strong style={{ fontSize: '17px', color: '#212529' }}>
                          {formatPrice(settlement.amount)}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '15px', color: '#495057', fontWeight: '500' }}>
                          {(() => {
                            const modeMap = {
                              'cash': 'Cash',
                              'bankTransfer': 'Bank Transfer',
                              'online': 'Online (UPI)',
                              'loan': 'Loan'
                            }
                            return modeMap[settlement.paymentMode] || settlement.paymentMode
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '15px', color: '#495057' }}>
                          {settlement.settledBy?.name || settlement.settledBy?.email || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '15px', color: '#6c757d' }}>
                          {settlement.notes || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#6c757d' }}>
            <i className="fas fa-history" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5, color: '#adb5bd' }}></i>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No settlement history available</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminPendingPayments
