import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminHistory = () => {
  const [activeTab, setActiveTab] = useState('purchase') // 'purchase', 'sold', 'modification'
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [soldHistory, setSoldHistory] = useState([])
  const [modificationHistory, setModificationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (token) {
      loadHistory()
    }
  }, [token])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load history')
      }

      const vehicles = await response.json()

      // ============================================
      // PURCHASE HISTORY
      // ============================================
      // Shows: ALL vehicles that were purchased (regardless of current status)
      // Date: purchaseDate (when vehicle was purchased)
      // User: createdBy (who added the vehicle to the system)
      // Logic: Every vehicle with a purchaseDate appears here
      const purchases = vehicles
        .filter(v => v.purchaseDate)
        .map(v => ({
          ...v,
          date: new Date(v.purchaseDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          type: 'Purchase',
          action: 'Vehicle Purchased',
          user: (v.createdBy && typeof v.createdBy === 'object' ? v.createdBy.name : null) || 'Unknown'
        }))
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))

      // ============================================
      // SOLD HISTORY
      // ============================================
      // Shows: Only vehicles with status = 'Sold'
      // Date: updatedAt (when status was changed to 'Sold')
      // User: modifiedBy (who marked it as sold) or createdBy (fallback)
      // Logic: Only vehicles that are currently sold
      // Note: These vehicles also appear in Purchase History (that's expected - they were purchased AND sold)
      const sold = vehicles
        .filter(v => v.status === 'Sold')
        .map(v => ({
          ...v,
          date: v.updatedAt ? new Date(v.updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'N/A',
          type: 'Sold',
          action: 'Vehicle Sold',
          user: (v.modifiedBy && typeof v.modifiedBy === 'object' ? v.modifiedBy.name : null) || 
                (v.createdBy && typeof v.createdBy === 'object' ? v.createdBy.name : null) || 
                'Unknown'
        }))
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0)
          const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0)
          return dateB - dateA
        })

      // ============================================
      // MODIFICATION HISTORY
      // ============================================
      // Shows: Vehicles that have been edited/modified after initial creation
      // Date: updatedAt (when last modified)
      // User: modifiedBy (who last modified the vehicle)
      // Logic: Only vehicles where modifiedBy exists (meaning someone edited it after creation)
      // Note: This shows the LAST modification only (not all modifications)
      // Excludes: Vehicles that were only created but never modified
      const modifications = vehicles
        .filter(v => v.modifiedBy && v.modifiedBy !== null)
        .map(v => ({
          ...v,
          date: v.updatedAt ? new Date(v.updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'N/A',
          type: 'Modification',
          action: 'Vehicle Modified',
          user: (v.modifiedBy && typeof v.modifiedBy === 'object' ? v.modifiedBy.name : null) || 'Unknown'
        }))
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0)
          const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0)
          return dateB - dateA
        })

      setPurchaseHistory(purchases)
      setSoldHistory(sold)
      setModificationHistory(modifications)
    } catch (error) {
      console.error('Error loading history:', error)
      showToast('Failed to load history', 'error')
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

  const renderTable = (data, columns) => {
    if (loading) {
      return (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading history...</p>
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>No records found</h3>
          <p>No {activeTab} history available</p>
        </div>
      )
    }

    return (
      <Table sx={{ minWidth: 700 }} aria-label={`${activeTab} history table`}>
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell key={idx}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              {columns.map((col, idx) => (
                <TableCell key={idx}>
                  {col.render ? col.render(item) : item[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const purchaseColumns = [
    { label: 'Date', key: 'date' },
    { label: 'Vehicle No.', key: 'vehicleNo', render: (item) => <strong>{item.vehicleNo}</strong> },
    { label: 'Make/Model', key: 'makeModel', render: (item) => `${item.make} ${item.model || ''}`.trim() },
    { label: 'Purchase Price', key: 'purchasePrice', render: (item) => formatPrice(item.purchasePrice) },
    { label: 'Added By', key: 'user' }
  ]

  const soldColumns = [
    { label: 'Date', key: 'date' },
    { label: 'Vehicle No.', key: 'vehicleNo', render: (item) => <strong>{item.vehicleNo}</strong> },
    { label: 'Make/Model', key: 'makeModel', render: (item) => `${item.make} ${item.model || ''}`.trim() },
    { label: 'Purchase Price', key: 'purchasePrice', render: (item) => formatPrice(item.purchasePrice) },
    { label: 'Sale Price', key: 'lastPrice', render: (item) => formatPrice(item.lastPrice) },
    { label: 'Sold By', key: 'user' }
  ]

  const modificationColumns = [
    { label: 'Date', key: 'date' },
    { label: 'Vehicle No.', key: 'vehicleNo', render: (item) => <strong>{item.vehicleNo}</strong> },
    { label: 'Make/Model', key: 'makeModel', render: (item) => `${item.make} ${item.model || ''}`.trim() },
    { label: 'Modified By', key: 'user' }
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case 'purchase':
        return purchaseHistory
      case 'sold':
        return soldHistory
      case 'modification':
        return modificationHistory
      default:
        return []
    }
  }

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'purchase':
        return purchaseColumns
      case 'sold':
        return soldColumns
      case 'modification':
        return modificationColumns
      default:
        return []
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2><i className="fas fa-history"></i> History</h2>
          <p>
            <strong>Purchase History:</strong> All vehicles purchased (sorted by purchase date) | 
            <strong> Sold History:</strong> Vehicles marked as sold (sorted by sale date) | 
            <strong> Modification History:</strong> Vehicles edited after creation (sorted by last modification date)
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadHistory} title="Refresh">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div className="tabs-container" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-button ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          <i className="fas fa-shopping-cart"></i> Purchase History ({purchaseHistory.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'sold' ? 'active' : ''}`}
          onClick={() => setActiveTab('sold')}
        >
          <i className="fas fa-check-circle"></i> Sold History ({soldHistory.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'modification' ? 'active' : ''}`}
          onClick={() => setActiveTab('modification')}
        >
          <i className="fas fa-edit"></i> Modification History ({modificationHistory.length})
        </button>
      </div>

      {renderTable(getCurrentData(), getCurrentColumns())}
    </div>
  )
}

export default AdminHistory
