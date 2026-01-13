import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const PurchaseOverview = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (token) {
      loadVehicles()
    } else {
      setLoading(false)
    }
  }, [token])

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
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      showToast('Failed to load vehicles', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const getCurrentMonthStats = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthVehicles = vehicles.filter(vehicle => {
      if (!vehicle.purchaseDate) return false
      const purchaseDate = new Date(vehicle.purchaseDate)
      return purchaseDate.getMonth() === currentMonth && 
             purchaseDate.getFullYear() === currentYear
    })

    const purchasedThisMonth = thisMonthVehicles.length

    const totalInvestment = thisMonthVehicles.reduce((sum, vehicle) => {
      return sum + (parseFloat(vehicle.purchasePrice) || 0)
    }, 0)

    // Count vehicles with missing documents (using missingDocuments array from API)
    const pendingDocs = vehicles.filter(vehicle => {
      return vehicle.missingDocuments && vehicle.missingDocuments.length > 0
    }).length

    return {
      purchasedThisMonth,
      totalInvestment,
      pendingDocs
    }
  }

  // Get recent purchases (last 5, sorted by purchase date)
  const getRecentPurchases = () => {
    return vehicles
      .filter(vehicle => vehicle.purchaseDate)
      .sort((a, b) => {
        const dateA = new Date(a.purchaseDate)
        const dateB = new Date(b.purchaseDate)
        return dateB - dateA
      })
      .slice(0, 5)
      .map(vehicle => {
        const purchaseDate = new Date(vehicle.purchaseDate)
        const formattedDate = purchaseDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })

        const amount = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(vehicle.purchasePrice || 0)

        let status = vehicle.status || 'On Modification'
        let badgeClass = 'badge-warning'
        
        if (status === 'In Stock') {
          badgeClass = 'badge-success'
        } else if (status === 'Sold') {
          badgeClass = 'badge-info'
        } else if (status === 'On Modification') {
          badgeClass = 'badge-warning'
        }

        return {
          vehicleNo: vehicle.vehicleNo || 'N/A',
          makeModel: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'N/A',
          purchaseDate: formattedDate,
          amount: amount,
          status: status,
          badgeClass: badgeClass
        }
      })
  }

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else {
      return `₹${amount.toLocaleString('en-IN')}`
    }
  }

  const stats = getCurrentMonthStats()
  const recentPurchases = getRecentPurchases()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading overview...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="stats-grid">
        <StatCard
          icon="fas fa-shopping-cart"
          iconClass="blue"
          title="Purchased This Month"
          value={stats.purchasedThisMonth.toString()}
          label="Vehicles"
        />
        <StatCard
          icon="fas fa-rupee-sign"
          iconClass="green"
          title="Total Investment"
          value={formatCurrency(stats.totalInvestment)}
          label="This month"
        />
        <StatCard
          icon="fas fa-file-alt"
          iconClass="orange"
          title="Pending Documents"
          value={stats.pendingDocs.toString()}
          label="Vehicles"
        />
      </div>

      <div className="recent-purchases">
        <h3><i className="fas fa-clock"></i> Recent Purchases</h3>
        {recentPurchases.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <p>No purchases found</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle No.</th>
                  <th>Make/Model</th>
                  <th>Purchase Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase, index) => (
                  <tr key={index}>
                    <td><strong>{purchase.vehicleNo}</strong></td>
                    <td>{purchase.makeModel}</td>
                    <td>{purchase.purchaseDate}</td>
                    <td>{purchase.amount}</td>
                    <td>
                      <span className={`badge ${purchase.badgeClass}`}>
                        {purchase.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseOverview
