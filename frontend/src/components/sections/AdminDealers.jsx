import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminDealers = () => {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    loadDealers()
  }, [token])

  const loadDealers = async (showSuccessToast = false) => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/dealers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Dealers API error:', response.status, errorData)
        throw new Error(errorData.message || `Failed to load dealers (${response.status})`)
      }

      const data = await response.json()
      setDealers(data)
    
    } catch (error) {
      console.error('Error loading dealers:', error)
      showToast(error.message || 'Failed to load dealers', 'error')
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

  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = 
      dealer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h2><i className="fas fa-handshake"></i> Dealers</h2>
          <p>View dealers and their vehicle purchase history ({dealers.length} dealers)</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search dealers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => loadDealers(true)} title="Refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading dealers...</p>
        </div>
      ) : dealers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-handshake"></i>
          <h3>No dealers found</h3>
          <p>Dealers will appear here once vehicles are added with dealer information</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="dealers table">
          <TableHead>
            <TableRow>
              <TableCell>Dealer Name</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Vehicle Count</TableCell>
              <TableCell>Commission Till Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDealers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-search" style={{ fontSize: '32px', color: '#ccc', marginBottom: '10px', display: 'block' }}></i>
                  No dealers match your search criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredDealers.map((dealer, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <strong>{dealer.name || 'N/A'}</strong>
                  </TableCell>
                  <TableCell>
                    {dealer.phone && dealer.phone !== 'N/A' ? (
                      <a 
                        href={`tel:${dealer.phone}`} 
                        style={{ 
                          color: '#007bff', 
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <i className="fas fa-phone" style={{ fontSize: '14px' }}></i>
                        {dealer.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#6c757d' }}>N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fas fa-car" style={{ fontSize: '14px' }}></i>
                      {dealer.vehicleCount || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fas fa-rupee-sign" style={{ fontSize: '14px' }}></i>
                      {formatPrice(dealer.totalCommission || 0)}
                    </strong>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default AdminDealers
