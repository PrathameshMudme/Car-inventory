import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const PurchaseNotes = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
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
      
      // Filter vehicles: Purchase managers see only their vehicles, Admin sees all
      const filteredVehicles = isAdmin 
        ? data 
        : data.filter(v => v.createdBy?._id === user._id || v.createdBy === user._id)
      
      setVehicles(filteredVehicles)
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

  const handleGenerateNote = async (vehicleId, vehicleNo) => {
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/purchase-note`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate purchase note')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Purchase_Note_${vehicleNo}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showToast('Purchase note downloaded!', 'success')
    } catch (error) {
      console.error('Error generating purchase note:', error)
      showToast(error.message || 'Failed to generate purchase note', 'error')
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Purchase Notes</h2>
          <p>
            {isAdmin 
              ? 'Generate and manage purchase notes for all vehicles' 
              : 'Generate purchase notes for vehicles you added'}
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
          <h3>No vehicles found</h3>
          <p>
            {isAdmin 
              ? 'No vehicles available for purchase notes' 
              : 'You haven\'t added any vehicles yet. Add vehicles to generate purchase notes.'}
          </p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="purchase notes table">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle No.</TableCell>
              <TableCell>Make/Model</TableCell>
              <TableCell>Seller Name</TableCell>
              <TableCell>Purchase Date</TableCell>
              <TableCell>Purchase Price</TableCell>
              {isAdmin && <TableCell>Added By</TableCell>}
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle._id || vehicle.id}>
                <TableCell><strong>{vehicle.vehicleNo}</strong></TableCell>
                <TableCell>{`${vehicle.make} ${vehicle.model || ''}`.trim()}</TableCell>
                <TableCell>{vehicle.sellerName || 'N/A'}</TableCell>
                <TableCell>{formatDate(vehicle.purchaseDate)}</TableCell>
                <TableCell>{formatPrice(vehicle.purchasePrice)}</TableCell>
                {isAdmin && (
                  <TableCell>{vehicle.createdBy?.name || 'Unknown'}</TableCell>
                )}
                <TableCell align="center">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      className="btn-icon-small"
                      title="Generate Purchase Note"
                      onClick={() => handleGenerateNote(vehicle._id || vehicle.id, vehicle.vehicleNo)}
                    >
                      <i className="fas fa-file-pdf"></i>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default PurchaseNotes
