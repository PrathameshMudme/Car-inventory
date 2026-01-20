import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import Modal from '../Modal'
import ActionButton from '../forms/ActionButton'
import StatusBadge from '../common/StatusBadge'
import { Chip } from '@mui/material'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const DeliveryNotes = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const { showToast } = useToast()
  const { user, token } = useAuth()
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin'
  
  useEffect(() => {
    if (token) {
      loadVehicles()
    }
  }, [token])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      
      // Filter for sold vehicles only (delivery notes can only be generated for sold vehicles)
      // For sales managers, only show vehicles they created
      // For admin, show all sold vehicles
      let filteredData = data || []
      
      if (user?.role === 'sales') {
        // Sales managers can only see vehicles they added
        filteredData = filteredData.filter(v => {
          const createdById = v.createdBy?._id?.toString() || v.createdBy?.toString()
          return createdById === user._id && v.status === 'Sold'
        })
      } else if (isAdmin) {
        // Admin can see all sold vehicles
        filteredData = filteredData.filter(v => v.status === 'Sold')
      } else {
        filteredData = []
      }
      
      console.log('DeliveryNotes: Loaded vehicles from API', filteredData?.length || 0)
      console.log('DeliveryNotes: User role', user?.role, 'User ID', user?._id)
      setVehicles(filteredData || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)}Cr`
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLastGeneratedDate = (vehicle) => {
    if (!vehicle.deliveryNoteHistory || vehicle.deliveryNoteHistory.length === 0) {
      return null
    }
    const sorted = [...vehicle.deliveryNoteHistory].sort((a, b) => 
      new Date(b.generatedAt) - new Date(a.generatedAt)
    )
    return sorted[0].generatedAt
  }

  const handleGenerateNote = async (vehicleId, vehicleNo, isDownloadOnly = false) => {
    try {
      // For download-only, add a query parameter to indicate we don't want to regenerate
      const url = isDownloadOnly 
        ? `${API_URL}/vehicles/${vehicleId}/delivery-note?downloadOnly=true`
        : `${API_URL}/vehicles/${vehicleId}/delivery-note`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate delivery note')
      }

      const blob = await response.blob()
      const urlObj = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = `Delivery_Note_${vehicleNo.replace(/-/g, '')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(urlObj)
      document.body.removeChild(a)
      
      showToast(isDownloadOnly ? 'Delivery note downloaded!' : 'Delivery note generated and downloaded!', 'success')
      
      // Only reload vehicles if we generated a new note (not for download-only)
      if (!isDownloadOnly) {
        await loadVehicles()
      }
    } catch (error) {
      console.error('Error generating delivery note:', error)
      showToast(error.message || 'Failed to generate delivery note', 'error')
    }
  }

  const handleShowHistory = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowHistoryModal(true)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Delivery Notes</h2>
          <p>
            {isAdmin 
              ? 'Generate and manage delivery notes for all sold vehicles' 
              : 'Generate delivery notes for vehicles you added and marked as sold'}
            {vehicles.length > 0 && ` (${vehicles.length} vehicles)`}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadVehicles} title="Refresh">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-file-invoice"></i>
          <h3>No sold vehicles found</h3>
          <p>
            {isAdmin 
              ? 'No sold vehicles available for delivery notes' 
              : 'You haven\'t marked any vehicles as sold yet. Mark vehicles as sold to generate delivery notes.'}
          </p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="delivery notes table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Vehicle No.</strong></TableCell>
              <TableCell><strong>Company/Model</strong></TableCell>
              <TableCell><strong>Customer Name</strong></TableCell>
              <TableCell><strong>Sale Date</strong></TableCell>
              <TableCell><strong>Last Generated</strong></TableCell>
              {isAdmin && <TableCell><strong>Added By</strong></TableCell>}
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => {
              const lastGenerated = getLastGeneratedDate(vehicle)
              const historyCount = vehicle.deliveryNoteHistory?.length || 0
              
              return (
                <TableRow key={vehicle._id || vehicle.id}>
                  <TableCell><strong>{formatVehicleNumber(vehicle.vehicleNo)}</strong></TableCell>
                  <TableCell>{`${vehicle.company} ${vehicle.model || ''}`.trim()}</TableCell>
                  <TableCell>{vehicle.customerName || 'N/A'}</TableCell>
                  <TableCell>{formatDate(vehicle.saleDate)}</TableCell>
                  <TableCell>
                    {lastGenerated ? (
                      <div>
                        <div style={{ marginBottom: '4px' }}>{formatDateTime(lastGenerated)}</div>
                        {historyCount > 1 && (
                          <Chip
                            label={`${historyCount} time${historyCount > 1 ? 's' : ''} total`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(102, 126, 234, 0.15)',
                              color: '#667eea',
                              border: '1px solid rgba(102, 126, 234, 0.3)',
                              fontWeight: 600,
                              fontSize: '11px',
                              height: '20px'
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <Chip
                        label="Never"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(108, 117, 125, 0.15)',
                          color: '#6c757d',
                          border: '1px solid rgba(108, 117, 125, 0.3)',
                          fontWeight: 500,
                          fontSize: '12px',
                          fontStyle: 'italic',
                          height: '24px'
                        }}
                      />
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>{vehicle.createdBy?.name || 'Unknown'}</TableCell>
                  )}
                  <TableCell align="center">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                      {historyCount === 0 ? (
                        // First time - Generate button (green for success action)
                        <ActionButton
                          icon={<i className="fas fa-file-pdf" style={{ fontSize: '14px' }} />}
                          title="Generate Delivery Note"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateNote(vehicle._id || vehicle.id, vehicle.vehicleNo)
                          }}
                          color="success"
                        />
                      ) : (
                        // Already generated - Download button (blue for view/download) + History button (purple for info)
                        <>
                          <ActionButton
                            icon={<i className="fas fa-download" style={{ fontSize: '14px' }} />}
                            title="Download Delivery Note"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateNote(vehicle._id || vehicle.id, vehicle.vehicleNo, true)
                            }}
                            color="view"
                          />
                          <ActionButton
                            icon={<i className="fas fa-history" style={{ fontSize: '14px' }} />}
                            title="View Generation History"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShowHistory(vehicle)
                            }}
                            color="primary"
                          />
                        </>
                      )}
                      {/* Admin can always regenerate (orange for warning/regenerate action) */}
                      {isAdmin && historyCount > 0 && (
                        <ActionButton
                          icon={<i className="fas fa-redo" style={{ fontSize: '14px' }} />}
                          title="Regenerate Delivery Note"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateNote(vehicle._id || vehicle.id, vehicle.vehicleNo, false)
                          }}
                          color="warning"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Delivery Note History Modal */}
      {showHistoryModal && selectedVehicle && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false)
            setSelectedVehicle(null)
          }}
          title={`Delivery Note History - ${formatVehicleNumber(selectedVehicle.vehicleNo)}`}
        >
          <div style={{ padding: '20px' }}>
            {selectedVehicle.deliveryNoteHistory && selectedVehicle.deliveryNoteHistory.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    label={`${selectedVehicle.company} ${selectedVehicle.model || ''}`.trim()}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(102, 126, 234, 0.15)',
                      color: '#667eea',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  />
                  <Chip
                    label={formatPrice(selectedVehicle.lastPrice || selectedVehicle.askingPrice)}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(39, 174, 96, 0.15)',
                      color: '#27ae60',
                      border: '1px solid rgba(39, 174, 96, 0.3)',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  />
                  {selectedVehicle.status && (
                    <StatusBadge status={selectedVehicle.status} />
                  )}
                </div>
                <Table sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Generated On</strong></TableCell>
                      <TableCell><strong>Generated By</strong></TableCell>
                      <TableCell align="center"><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...selectedVehicle.deliveryNoteHistory]
                      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
                      .map((history, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDateTime(history.generatedAt)}</TableCell>
                          <TableCell>
                            {history.generatedBy?.name || 'Unknown'}
                          </TableCell>
                          <TableCell align="center">
                            {isAdmin ? (
                              // Admin can regenerate
                              <ActionButton
                                icon={<i className="fas fa-redo" style={{ fontSize: '14px' }} />}
                                title="Regenerate & Download"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateNote(selectedVehicle._id || selectedVehicle.id, selectedVehicle.vehicleNo, false)
                                  setShowHistoryModal(false)
                                  setSelectedVehicle(null)
                                }}
                                color="warning"
                              />
                            ) : (
                              // Sales manager can only download (no regeneration)
                              <ActionButton
                                icon={<i className="fas fa-download" style={{ fontSize: '14px' }} />}
                                title="Download Delivery Note"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateNote(selectedVehicle._id || selectedVehicle.id, selectedVehicle.vehicleNo, true)
                                }}
                                color="view"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <i className="fas fa-history" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
                <p>No delivery notes generated yet</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default DeliveryNotes
