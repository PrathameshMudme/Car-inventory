import React, { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminDealers = () => {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    loadDealers()
  }, [token])

  const loadDealers = async () => {
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
        throw new Error('Failed to load dealers')
      }

      const data = await response.json()
      setDealers(data)
    } catch (error) {
      console.error('Error loading dealers:', error)
      showToast('Failed to load dealers', 'error')
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

  const columns = [
    { 
      key: 'name', 
      label: 'Dealer Name',
      render: (row) => (
        <strong style={{ color: '#2c3e50' }}>{row.name || 'N/A'}</strong>
      )
    },
    { 
      key: 'phone', 
      label: 'Contact Number',
      render: (row) => (
        <span>
          {row.phone && row.phone !== 'N/A' ? (
            <a href={`tel:${row.phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>
              <i className="fas fa-phone" style={{ marginRight: '5px' }}></i>
              {row.phone}
            </a>
          ) : (
            <span style={{ color: '#6c757d' }}>N/A</span>
          )}
        </span>
      )
    },
    { 
      key: 'vehicleCount', 
      label: 'Vehicles Count',
      render: (row) => (
        <span className="badge badge-primary" style={{ fontSize: '14px', padding: '6px 12px' }}>
          <i className="fas fa-car" style={{ marginRight: '5px' }}></i>
          {row.vehicleCount || 0}
        </span>
      )
    },
    {
      key: 'totalPurchaseValue',
      label: 'Total Purchase Value',
      render: (row) => (
        <strong style={{ color: '#28a745' }}>
          {formatPrice(row.totalPurchaseValue)}
        </strong>
      )
    },
    {
      key: 'firstPurchaseDate',
      label: 'First Purchase',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#6c757d' }}>
          {formatDate(row.firstPurchaseDate)}
        </span>
      )
    },
    {
      key: 'lastPurchaseDate',
      label: 'Last Purchase',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#6c757d' }}>
          {formatDate(row.lastPurchaseDate)}
        </span>
      )
    }
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <h2><i className="fas fa-handshake"></i> Dealers</h2>
          <p>View dealers and their vehicle purchase history ({dealers.length} dealers)</p>
        </div>
        <button className="btn btn-secondary" onClick={loadDealers} title="Refresh">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
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
        <DataTable 
          columns={columns} 
          data={dealers} 
          searchable={true}
        />
      )}
    </div>
  )
}

export default AdminDealers
