import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import Modal from '../Modal'
import ActionButton from '../forms/ActionButton'
import { Info as InfoIcon } from '@mui/icons-material'
import { formatVehicleNumber, formatPrice } from '../../utils/formatUtils'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SalesRecords = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [salesRecords, setSalesRecords] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false)

  useEffect(() => {
    if (token) {
      loadSalesRecords()
    } else {
      setDataLoading(false)
    }
  }, [token])

  const loadSalesRecords = async () => {
    try {
      setDataLoading(true)
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load sales records')
      }

      const vehicles = await response.json()
      
      // Filter and format sold vehicles
      const soldVehicles = (vehicles || []).filter(v => v.status === 'Sold' && v.saleDate)
      
      const records = soldVehicles
        .map(vehicle => {
          // Calculate total payment received
          const cash = parseFloat(vehicle.paymentCash) || 0
          const bankTransfer = parseFloat(vehicle.paymentBankTransfer) || 0
          const online = parseFloat(vehicle.paymentOnline) || 0
          const loan = parseFloat(vehicle.paymentLoan) || 0
          let totalPayment = cash + bankTransfer + online + loan
          
          // Add settled payments from customers
          let settledFromCustomer = 0
          if (vehicle.paymentSettlementHistory && vehicle.paymentSettlementHistory.length > 0) {
            settledFromCustomer = vehicle.paymentSettlementHistory
              .filter(s => s.settlementType === 'FROM_CUSTOMER')
              .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
            totalPayment += settledFromCustomer
          }

          const salePrice = parseFloat(vehicle.lastPrice) || 0
          const remainingAmount = Math.max(0, salePrice - totalPayment)
          const paymentStatus = remainingAmount > 0 ? 'Partial' : 'Full'
          
          const saleDate = new Date(vehicle.saleDate)
          const formattedDate = saleDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })

          return {
            ...vehicle, // Include full vehicle object for details modal
            saleDate: formattedDate,
            saleDateRaw: vehicle.saleDate, // Keep raw date for sorting
            vehicle: vehicle.vehicleNo || 'N/A',
            customer: vehicle.customerName || 'N/A',
            salePrice: salePrice,
            salePriceFormatted: `₹${salePrice.toLocaleString('en-IN')}`,
            totalPayment,
            totalPaymentFormatted: `₹${totalPayment.toLocaleString('en-IN')}`,
            remainingAmount,
            remainingAmountFormatted: remainingAmount > 0 ? `₹${remainingAmount.toLocaleString('en-IN')}` : 'NIL',
            paymentStatus,
            // Payment breakdown for modal
            paymentBreakdown: {
              cash,
              bankTransfer,
              online,
              loan,
              settledFromCustomer
            }
          }
        })
        .sort((a, b) => {
          // Sort by sale date (most recent first)
          const dateA = a.saleDateRaw ? new Date(a.saleDateRaw) : new Date(0)
          const dateB = b.saleDateRaw ? new Date(b.saleDateRaw) : new Date(0)
          return dateB - dateA
        })

      setSalesRecords(records)
    } catch (error) {
      console.error('Error loading sales records:', error)
      showToast('Failed to load sales records', 'error')
      setSalesRecords([])
    } finally {
      setDataLoading(false)
    }
  }

  const handleExport = async (format = 'pdf') => {
    if (!token) {
      showToast('Please login to export reports', 'error')
      return
    }

    try {
      setLoading(true)
      showToast('Generating sales report...', 'info')

      const params = new URLSearchParams({
        periodType: '6months',
        format,
        includeComparison: 'false'
      })

      const response = await fetch(`${API_URL}/reports/sales?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentType = response.headers.get('content-type')
      let extension = 'pdf'
      if (contentType && contentType.includes('spreadsheetml')) {
        extension = 'xlsx'
      } else if (contentType && contentType.includes('csv')) {
        extension = 'csv'
      }
      a.download = `sales_records_report_${Date.now()}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast('Sales records report downloaded successfully!', 'success')
    } catch (error) {
      console.error('Error exporting report:', error)
      showToast(error.message || 'Failed to export report', 'error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Sales Records</h2>
          <p>View completed sales transactions</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleExport('pdf')}
            disabled={loading}
          >
            <i className="fas fa-download"></i> {loading ? 'Generating...' : 'Export PDF'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleExport('excel')}
            disabled={loading}
          >
            <i className="fas fa-file-excel"></i> {loading ? 'Generating...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {dataLoading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading sales records...</p>
        </div>
      ) : salesRecords.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <i className="fas fa-file-invoice" style={{ fontSize: '64px', color: '#adb5bd', marginBottom: '20px' }}></i>
          <h3 style={{ fontSize: '24px', marginBottom: '12px', color: '#212529' }}>No Sales Records</h3>
          <p style={{ fontSize: '16px', color: '#6c757d' }}>No completed sales transactions found</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="sales records table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Sale Date</strong></TableCell>
              <TableCell><strong>Vehicle</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Sale Price</strong></TableCell>
              <TableCell><strong>Total Payment</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Details</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesRecords.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{record.saleDate}</TableCell>
                <TableCell><strong>{formatVehicleNumber(record.vehicle)}</strong></TableCell>
                <TableCell>{record.customer}</TableCell>
                <TableCell>{record.salePriceFormatted}</TableCell>
                <TableCell>{record.totalPaymentFormatted}</TableCell>
                <TableCell>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: record.paymentStatus === 'Full' 
                      ? 'rgba(40, 167, 69, 0.15)' 
                      : 'rgba(255, 152, 0, 0.15)',
                    color: record.paymentStatus === 'Full' 
                      ? '#28a745' 
                      : '#ff9800'
                  }}>
                    {record.paymentStatus}
                  </span>
                </TableCell>
                <TableCell align="center">
                  <ActionButton
                    variant="icon"
                    icon={<InfoIcon />}
                    title="View Full Details"
                    onClick={() => {
                      setSelectedRecord(record)
                      setShowPaymentDetailsModal(true)
                    }}
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Payment Details Modal */}
      {showPaymentDetailsModal && selectedRecord && (
        <Modal
          isOpen={showPaymentDetailsModal}
          onClose={() => {
            setShowPaymentDetailsModal(false)
            setSelectedRecord(null)
          }}
          title={`Payment Details - ${formatVehicleNumber(selectedRecord.vehicle)}`}
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ 
                padding: '10px 15px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                flex: '1',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Customer</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>
                  {selectedRecord.customer}
                </div>
              </div>
              <div style={{ 
                padding: '10px 15px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                flex: '1',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Sale Date</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>
                  {selectedRecord.saleDate}
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              <h4 style={{ marginBottom: '15px', fontSize: '16px', color: '#2c3e50', fontWeight: '600' }}>
                Payment Breakdown
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {selectedRecord.paymentBreakdown.cash > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '15px', color: '#495057' }}>Cash</span>
                    <strong style={{ fontSize: '15px', color: '#212529' }}>
                      ₹{selectedRecord.paymentBreakdown.cash.toLocaleString('en-IN')}
                    </strong>
                  </div>
                )}
                {selectedRecord.paymentBreakdown.bankTransfer > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '15px', color: '#495057' }}>Bank Transfer (RTGS/NEFT)</span>
                    <strong style={{ fontSize: '15px', color: '#212529' }}>
                      ₹{selectedRecord.paymentBreakdown.bankTransfer.toLocaleString('en-IN')}
                    </strong>
                  </div>
                )}
                {selectedRecord.paymentBreakdown.online > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '15px', color: '#495057' }}>Online (UPI)</span>
                    <strong style={{ fontSize: '15px', color: '#212529' }}>
                      ₹{selectedRecord.paymentBreakdown.online.toLocaleString('en-IN')}
                    </strong>
                  </div>
                )}
                {selectedRecord.paymentBreakdown.loan > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '15px', color: '#495057' }}>By Loan</span>
                    <strong style={{ fontSize: '15px', color: '#212529' }}>
                      ₹{selectedRecord.paymentBreakdown.loan.toLocaleString('en-IN')}
                    </strong>
                  </div>
                )}
                {selectedRecord.paymentBreakdown.settledFromCustomer > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '15px', color: '#495057' }}>Settled from Customer</span>
                    <strong style={{ fontSize: '15px', color: '#28a745' }}>
                      ₹{selectedRecord.paymentBreakdown.settledFromCustomer.toLocaleString('en-IN')}
                    </strong>
                  </div>
                )}
              </div>
              
              <div style={{ 
                marginTop: '15px', 
                padding: '15px', 
                background: 'white', 
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#495057' }}>Sale Price:</span>
                  <strong style={{ fontSize: '16px', color: '#212529' }}>
                    {selectedRecord.salePriceFormatted}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#495057' }}>Total Payment Received:</span>
                  <strong style={{ fontSize: '16px', color: '#28a745' }}>
                    {selectedRecord.totalPaymentFormatted}
                  </strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  paddingTop: '8px',
                  borderTop: '2px solid #e9ecef'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#495057' }}>Remaining Amount:</span>
                  <strong style={{ 
                    fontSize: '16px', 
                    color: selectedRecord.remainingAmount > 0 ? '#dc3545' : '#28a745'
                  }}>
                    {selectedRecord.remainingAmountFormatted}
                  </strong>
                </div>
              </div>
            </div>

            {/* Settlement History */}
            {selectedRecord.paymentSettlementHistory && selectedRecord.paymentSettlementHistory.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '16px', color: '#2c3e50', fontWeight: '600' }}>
                  Settlement History
                </h4>
                <div style={{ 
                  padding: '15px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {selectedRecord.paymentSettlementHistory
                    .filter(s => s.settlementType === 'FROM_CUSTOMER')
                    .sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt))
                    .map((settlement, idx) => (
                      <div key={idx} style={{ 
                        padding: '12px', 
                        background: 'white', 
                        borderRadius: '6px', 
                        marginBottom: '10px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', color: '#6c757d' }}>
                            {new Date(settlement.settledAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <strong style={{ fontSize: '15px', color: '#28a745' }}>
                            ₹{parseFloat(settlement.amount).toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div style={{ fontSize: '13px', color: '#495057' }}>
                          Mode: {settlement.paymentMode === 'cash' ? 'Cash' :
                                 settlement.paymentMode === 'bankTransfer' ? 'Bank Transfer' :
                                 settlement.paymentMode === 'online' ? 'Online (UPI)' :
                                 settlement.paymentMode === 'loan' ? 'Loan' : settlement.paymentMode}
                          {settlement.settledBy?.name && (
                            <span style={{ marginLeft: '10px', color: '#6c757d' }}>
                              • Settled by: {settlement.settledBy.name}
                            </span>
                          )}
                        </div>
                        {settlement.notes && (
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', fontStyle: 'italic' }}>
                            {settlement.notes}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      )}
    </div>
  )
}

export default SalesRecords
