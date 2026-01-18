import React, { useState, useEffect } from 'react'
import StatCard from '../StatCard'
import ChartCard from '../ChartCard'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminOverview = () => {
  const { token } = useAuth()
  const { setActiveSection } = useApp()
  const [stats, setStats] = useState({
    totalVehicles: 0,
    inStock: 0,
    sold: 0,
    onModification: 0,
    totalRevenue: 0,
    netProfit: 0,
    thisMonthRevenue: 0,
    thisMonthNetProfit: 0,
    pendingModifications: 0,
    lowStock: 0
  })
  const [topAgents, setTopAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, agentsRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/agents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const vehicles = await vehiclesRes.json()
      const agents = await agentsRes.json()

      // Calculate stats
      const inStock = vehicles.filter(v => v.status === 'In Stock').length
      const sold = vehicles.filter(v => v.status === 'Sold').length
      const onModification = vehicles.filter(v => v.status === 'On Modification').length
      
      // Calculate financial stats
      const totalRevenue = vehicles
        .filter(v => v.status === 'Sold' && v.salePrice)
        .reduce((sum, v) => sum + (v.salePrice || 0), 0)
      
      const totalCost = vehicles
        .filter(v => v.status === 'Sold')
        .reduce((sum, v) => sum + (v.purchasePrice || 0) + (v.modificationCost || 0), 0)
      
      const netProfit = totalRevenue - totalCost

      setStats({
        totalVehicles: vehicles.length,
        inStock,
        sold,
        onModification,
        totalRevenue,
        netProfit,
        pendingModifications: onModification,
        lowStock: inStock < 10 ? inStock : 0
      })

      // Get top 5 agents
      setTopAgents(agents.slice(0, 5))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    // Handle undefined, null, or NaN values
    if (price === undefined || price === null || isNaN(price)) {
      return '₹0'
    }
    
    const numPrice = Number(price)
    if (isNaN(numPrice)) {
      return '₹0'
    }
    
    if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(2)}Cr`
    if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(1)}L`
    return `₹${numPrice.toLocaleString('en-IN')}`
  }

  const quickActions = [
    { icon: 'fas fa-exclamation-triangle', label: 'Action Required', color: '#f39c12', action: () => setActiveSection('actionRequired') },
    { icon: 'fas fa-warehouse', label: 'Inventory', color: '#3498db', action: () => setActiveSection('inventory') },
    { icon: 'fas fa-users', label: 'Manage Users', color: '#667eea', action: () => setActiveSection('users') },
    { icon: 'fas fa-user-tie', label: 'View Agents', color: '#9b59b6', action: () => setActiveSection('agents') },
    { icon: 'fas fa-chart-bar', label: 'Reports', color: '#e67e22', action: () => setActiveSection('reports') }
  ]

  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales',
      data: [12, 19, 15, 25, 22, 28],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const statusData = {
    labels: ['In Stock', 'Sold', 'On Modification', 'Reserved'],
    datasets: [{
      data: [stats.inStock, stats.sold, stats.onModification, 0],
      backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#9b59b6']
    }]
  }

  return (
    <div className="admin-overview-container">
      {/* Stats Grid - 5 cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <StatCard
          icon="fas fa-car"
          iconClass="blue"
          title="Total Vehicles"
          value={loading ? '...' : stats.totalVehicles.toString()}
          label="in inventory"
        />
        <StatCard
          icon="fas fa-box-open"
          iconClass="green"
          title="In Stock"
          value={loading ? '...' : stats.inStock.toString()}
          label="ready for sale"
        />
        <StatCard
          icon="fas fa-handshake"
          iconClass="info"
          title="Sold"
          value={loading ? '...' : stats.sold.toString()}
          label="total sales"
        />
        <StatCard
          icon="fas fa-rupee-sign"
          iconClass="green"
          title="Total Revenue"
          value={loading ? '...' : formatPrice(stats.totalRevenue)}
          label="all time"
        />
        <StatCard
          icon="fas fa-chart-line"
          iconClass="orange"
          title="Net Profit"
          value={loading ? '...' : formatPrice(stats.thisMonthNetProfit)}
          label="this month"
        />
      </div>

      {/* Main Content - 3 column layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Left Column - Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ChartCard
            title="Monthly Sales Trend"
            type="line"
            data={salesData}
          />
          <ChartCard
            title="Vehicle Status Distribution"
            type="doughnut"
            data={statusData}
          />
        </div>

        {/* Middle Column - Quick Actions & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Actions */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-bolt" style={{ color: '#667eea' }}></i>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: `${action.color}10`,
                    border: `2px solid ${action.color}30`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: action.color
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = action.color
                    e.target.style.color = 'white'
                    e.target.style.transform = 'translateX(5px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `${action.color}10`
                    e.target.style.color = action.color
                    e.target.style.transform = 'translateX(0)'
                  }}
                >
                  <i className={action.icon} style={{ fontSize: '16px' }}></i>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-bell" style={{ color: '#e67e22' }}></i>
              Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.pendingModifications > 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#f39c12' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    <strong>{stats.pendingModifications}</strong> vehicles pending modification
                  </div>
                </div>
              )}
              {stats.lowStock > 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: '#f8d7da',
                  border: '2px solid #f5c2c7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-box" style={{ color: '#e74c3c' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    <strong>Low stock alert:</strong> Only {stats.lowStock} vehicles
                  </div>
                </div>
              )}
              {stats.pendingModifications === 0 && stats.lowStock === 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: '#d1e7dd',
                  border: '2px solid #badbcc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    All systems running smoothly
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
            color: 'white'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              opacity: 0.95
            }}>
              <i className="fas fa-warehouse"></i>
              Inventory Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Available</span>
                <strong>{stats.inStock}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Processing</span>
                <strong>{stats.onModification}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <span>Total Active</span>
                <strong>{stats.inStock + stats.onModification}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Top Agents & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Agents */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-trophy" style={{ color: '#f39c12' }}></i>
              Top Agents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <p style={{ fontSize: '14px', color: '#6c757d' }}>Loading...</p>
              ) : topAgents.length > 0 ? (
                topAgents.map((agent, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#f39c12' : idx === 1 ? '#95a5a6' : idx === 2 ? '#cd7f32' : '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                        {agent.vehicleCount} vehicles
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#27ae60' }}>
                      {formatPrice(agent.totalCommission)}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>No agents data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            flex: 1
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#2c3e50'
            }}>
              <i className="fas fa-history" style={{ color: '#3498db' }}></i>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '3px solid #3498db'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                  New Vehicle Added
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>2 hours ago</div>
              </div>
              <div style={{
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '3px solid #27ae60'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                  Vehicle Sold
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>5 hours ago</div>
              </div>
              <div style={{
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '3px solid #9b59b6'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                  Modification Complete
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
