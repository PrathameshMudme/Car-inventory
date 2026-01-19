import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminPendingPayments = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
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
    if (vehicle.purchaseMonth && vehicle.purchaseYear) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[vehicle.purchaseMonth - 1]} ${vehicle.purchaseYear}`
    }
    if (vehicle.purchaseDate) {
      const date = new Date(vehicle.purchaseDate)
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
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading pending payments...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2> Pending Payments</h2>
          <p>Vehicles with outstanding payments ({vehicles.length} vehicles)</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #e9ecef', 
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Pending</option>
            <option value="from_customer">Pending from Customer</option>
            <option value="to_seller">Pending to Seller</option>
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
              <TableCell>Make</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Purchase Date</TableCell>
              <TableCell>Added By</TableCell>
              <TableCell>Agent Name</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Pending From Customer</TableCell>
              <TableCell>Pending To Seller</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle._id}>
                <TableCell>
                  <strong>{formatVehicleNumber(vehicle.vehicleNo) || 'N/A'}</strong>
                </TableCell>
                <TableCell>{vehicle.make || 'N/A'}</TableCell>
                <TableCell>{vehicle.model || 'N/A'}</TableCell>
                <TableCell>{formatMonthYear(vehicle)}</TableCell>
                <TableCell>
                  {vehicle.createdBy?.name || vehicle.createdBy?.email || 'N/A'}
                </TableCell>
                <TableCell>{vehicle.agentName || vehicle.dealerName || 'N/A'}</TableCell>
                <TableCell>
                  <span style={{ 
                    display: 'block', 
                    maxWidth: '200px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }} title={vehicle.saleNotes || vehicle.notes || ''}>
                    {vehicle.saleNotes || vehicle.notes || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  {(parseFloat(vehicle.remainingAmount) || 0) > 0 ? (
                    <strong style={{ color: '#dc3545' }}>
                      {formatPrice(vehicle.remainingAmount)}
                    </strong>
                  ) : (
                    <span style={{ color: '#6c757d' }}>N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {(parseFloat(vehicle.remainingAmountToSeller) || 0) > 0 ? (
                    <strong style={{ color: '#ff9800' }}>
                      {formatPrice(vehicle.remainingAmountToSeller)}
                    </strong>
                  ) : (
                    <span style={{ color: '#6c757d' }}>N/A</span>
                  )}
                </TableCell>
                <TableCell align="center">
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    {(parseFloat(vehicle.remainingAmount) || 0) > 0 && (
                      <button
                        className="btn-icon-small"
                        title="Mark Customer Payment as Paid"
                        onClick={() => handleMarkAsPaid(vehicle, 'from_customer')}
                        style={{
                          background: 'var(--primary-color, #667eea)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className="fas fa-check"></i> Customer
                      </button>
                    )}
                    {(parseFloat(vehicle.remainingAmountToSeller) || 0) > 0 && (
                      <button
                        className="btn-icon-small"
                        title="Mark Seller Payment as Paid"
                        onClick={() => handleMarkAsPaid(vehicle, 'to_seller')}
                        style={{
                          background: '#ff9800',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className="fas fa-check"></i> Seller
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
              <label>Vehicle</label>
              <input 
                type="text" 
                value={`${formatVehicleNumber(selectedVehicle.vehicleNo)} - ${selectedVehicle.make} ${selectedVehicle.model}`}
                disabled
                style={{ background: '#f5f5f5' }}
              />
            </div>

            <div className="form-group">
              <label>Payment Type</label>
              <input 
                type="text" 
                value={getPaymentType(selectedVehicle) === 'from_customer' ? 'Pending from Customer' : 
                       getPaymentType(selectedVehicle) === 'to_seller' ? 'Pending to Seller' : 'Both'}
                disabled
                style={{ background: '#f5f5f5', fontWeight: 'bold' }}
              />
            </div>
            <div className="form-group">
              <label>Remaining Amount</label>
              <input 
                type="text" 
                value={formatPrice(getPaymentType(selectedVehicle) === 'from_customer' ? 
                  (selectedVehicle.remainingAmount || 0) : 
                  (selectedVehicle.remainingAmountToSeller || 0))}
                disabled
                style={{ background: '#f5f5f5', color: '#dc3545', fontWeight: 'bold' }}
              />
            </div>

            <div className="form-group">
              <label>Payment Mode <span className="required">*</span></label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #e9ecef', borderRadius: '8px' }}
              >
                <option value="cash">Cash</option>
                <option value="bankTransfer">Bank Transfer (RTGS/NEFT)</option>
                <option value="online">Online (UPI)</option>
                <option value="loan">By Loan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Amount <span className="required">*</span></label>
              <input 
                type="number" 
                placeholder="Enter amount" 
                min="0"
                max={selectedVehicle.remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
              <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
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
    </div>
  )
}

export default AdminPendingPayments
