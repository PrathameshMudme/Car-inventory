import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatVehicleNumber } from '../../utils/formatUtils'
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
    // Get category color based on active tab
    const getCategoryColor = () => {
      switch (activeTab) {
        case 'purchase':
          return { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', icon: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }
        case 'sold':
          return { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', icon: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
        case 'modification':
          return { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', icon: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
        default:
          return { bg: 'rgba(108, 117, 125, 0.08)', border: 'rgba(108, 117, 125, 0.2)', icon: '#6c757d', gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' }
      }
    }

    const categoryColor = getCategoryColor()

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          borderRadius: '16px',
          background: categoryColor.bg,
          border: `2px dashed ${categoryColor.border}`
        }}>
          <i className="fas fa-spinner fa-spin" style={{ 
            fontSize: '48px', 
            color: categoryColor.icon,
            marginBottom: '20px'
          }}></i>
          <p style={{ 
            fontSize: '16px', 
            color: categoryColor.icon,
            fontWeight: '600',
            margin: 0
          }}>Loading history...</p>
        </div>
      )
    }

    if (data.length === 0) {
      const emptyIcons = {
        purchase: 'fa-shopping-cart',
        sold: 'fa-check-circle',
        modification: 'fa-edit'
      }
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          borderRadius: '16px',
          background: categoryColor.bg,
          border: `2px dashed ${categoryColor.border}`
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: categoryColor.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: `0 4px 12px ${categoryColor.icon}40`
          }}>
            <i className={`fas ${emptyIcons[activeTab] || 'fa-inbox'}`} style={{ 
              fontSize: '36px', 
              color: '#ffffff'
            }}></i>
          </div>
          <h3 style={{ 
            fontSize: '20px', 
            color: categoryColor.icon,
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>No records found</h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6c757d',
            margin: 0,
            textTransform: 'capitalize'
          }}>No {activeTab} history available</p>
        </div>
      )
    }


    return (
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${categoryColor.border}`,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <Table sx={{ minWidth: 700 }} aria-label={`${activeTab} history table`}>
          <TableHead>
            <TableRow style={{
              background: `linear-gradient(135deg, ${categoryColor.bg} 0%, rgba(255, 255, 255, 0.5) 100%)`,
              borderBottom: `2px solid ${categoryColor.border}`
            }}>
              {columns.map((col, idx) => (
                <TableCell key={idx} style={{
                  fontWeight: '700',
                  fontSize: '14px',
                  color: categoryColor.icon,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '16px'
                }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow 
                key={index}
                style={{
                  transition: 'all 0.2s ease',
                  borderBottom: index < data.length - 1 ? `1px solid ${categoryColor.border}` : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = categoryColor.bg
                  e.currentTarget.style.transform = 'scale(1.01)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {columns.map((col, idx) => (
                  <TableCell key={idx} style={{ padding: '14px 16px', fontSize: '14px' }}>
                    {col.render ? col.render(item) : item[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const purchaseColumns = [
    { 
      label: 'Date', 
      key: 'date', 
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '4px',
            height: '32px',
            borderRadius: '2px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            flexShrink: 0
          }}></div>
          <span style={{ fontWeight: '500', color: '#1f2937' }}>{item.date}</span>
        </div>
      )
    },
    { label: 'Vehicle No.', key: 'vehicleNo', render: (item) => <strong>{formatVehicleNumber(item.vehicleNo)}</strong> },
    { label: 'Make/Model', key: 'makeModel', render: (item) => `${item.make} ${item.model || ''}`.trim() },
    { label: 'Purchase Price', key: 'purchasePrice', render: (item) => (
      <span style={{ 
        color: '#3b82f6', 
        fontWeight: '600',
        fontSize: '15px'
      }}>
        {formatPrice(item.purchasePrice)}
      </span>
    )},
    { label: 'Added By', key: 'user', render: (item) => (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        fontSize: '13px',
        fontWeight: '500'
      }}>
        <i className="fas fa-user" style={{ fontSize: '11px' }}></i>
        {item.user}
      </span>
    )}
  ]

  const soldColumns = [
    { 
      label: 'Date', 
      key: 'date', 
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '4px',
            height: '32px',
            borderRadius: '2px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            flexShrink: 0
          }}></div>
          <span style={{ fontWeight: '500', color: '#1f2937' }}>{item.date}</span>
        </div>
      )
    },
    { label: 'Vehicle No.', key: 'vehicleNo', render: (item) => <strong>{formatVehicleNumber(item.vehicleNo)}</strong> },
    { label: 'Make/Model', key: 'makeModel', render: (item) => `${item.make} ${item.model || ''}`.trim() },
    { label: 'Purchase Price', key: 'purchasePrice', render: (item) => formatPrice(item.purchasePrice) },
    { label: 'Sale Price', key: 'lastPrice', render: (item) => (
      <span style={{ 
        color: '#10b981', 
        fontWeight: '600',
        fontSize: '15px'
      }}>
        {formatPrice(item.lastPrice)}
      </span>
    )},
    { label: 'Sold By', key: 'user', render: (item) => (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        fontSize: '13px',
        fontWeight: '500'
      }}>
        <i className="fas fa-user-check" style={{ fontSize: '11px' }}></i>
        {item.user}
      </span>
    )}
  ]

  const modificationColumns = [
    { 
      label: 'Date', 
      key: 'date', 
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '4px',
            height: '32px',
            borderRadius: '2px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            flexShrink: 0
          }}></div>
          <span style={{ fontWeight: '500', color: '#1f2937' }}>{item.date}</span>
        </div>
      )
    },
    { label: 'Vehicle No.', key: 'vehicleNo', render: (item) => <strong>{formatVehicleNumber(item.vehicleNo)}</strong> },
    { label: 'Make/Model', key: 'makeModel', render: (item) => `${item.make} ${item.model || ''}`.trim() },
    { label: 'Modified By', key: 'user', render: (item) => (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        fontSize: '13px',
        fontWeight: '500'
      }}>
        <i className="fas fa-user-edit" style={{ fontSize: '11px' }}></i>
        {item.user}
      </span>
    )}
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

      <div className="tabs-container" style={{ 
        marginBottom: '30px',
        display: 'flex',
        gap: '12px',
        borderBottom: 'none',
        paddingBottom: '0'
      }}>
        <button
          className={`tab-button ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden',
            ...(activeTab === 'purchase' ? {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transform: 'translateY(-2px)'
            } : {
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
              color: '#3b82f6',
              border: '2px solid rgba(59, 130, 246, 0.2)'
            })
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'purchase') {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'purchase') {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          <i className="fas fa-shopping-cart" style={{ fontSize: '16px' }}></i>
          <span>Purchase History</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: activeTab === 'purchase' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(59, 130, 246, 0.2)',
            color: activeTab === 'purchase' ? '#ffffff' : '#3b82f6'
          }}>
            {purchaseHistory.length}
          </span>
        </button>
        <button
          className={`tab-button ${activeTab === 'sold' ? 'active' : ''}`}
          onClick={() => setActiveTab('sold')}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden',
            ...(activeTab === 'sold' ? {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transform: 'translateY(-2px)'
            } : {
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
              color: '#10b981',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            })
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'sold') {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'sold') {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          <i className="fas fa-check-circle" style={{ fontSize: '16px' }}></i>
          <span>Sold History</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: activeTab === 'sold' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(16, 185, 129, 0.2)',
            color: activeTab === 'sold' ? '#ffffff' : '#10b981'
          }}>
            {soldHistory.length}
          </span>
        </button>
        <button
          className={`tab-button ${activeTab === 'modification' ? 'active' : ''}`}
          onClick={() => setActiveTab('modification')}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden',
            ...(activeTab === 'modification' ? {
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              transform: 'translateY(-2px)'
            } : {
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
              color: '#f59e0b',
              border: '2px solid rgba(245, 158, 11, 0.2)'
            })
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'modification') {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'modification') {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          <i className="fas fa-edit" style={{ fontSize: '16px' }}></i>
          <span>Modification History</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: activeTab === 'modification' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(245, 158, 11, 0.2)',
            color: activeTab === 'modification' ? '#ffffff' : '#f59e0b'
          }}>
            {modificationHistory.length}
          </span>
        </button>
      </div>

      {renderTable(getCurrentData(), getCurrentColumns())}
    </div>
  )
}

export default AdminHistory
