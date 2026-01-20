import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminAgents = () => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { token } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    loadAgents()
  }, [token])

  const loadAgents = async (showSuccessToast = false) => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Try new /api/agents route first, fallback to legacy /api/dealers route for backward compatibility
      let response = await fetch(`${API_URL}/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // If 404, try old route for backward compatibility
      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_URL}/dealers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Agents API error:', response.status, errorData)
        throw new Error(errorData.message || `Failed to load agents (${response.status})`)
      }

      const data = await response.json()
      setAgents(data)
    
    } catch (error) {
      console.error('Error loading agents:', error)
      showToast(error.message || 'Failed to load agents', 'error')
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

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Agents</h2>
          <p>View agents and their vehicle purchase history ({agents.length} agents)</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => loadAgents(true)} title="Refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-handshake"></i>
          <h3>No agents found</h3>
          <p>Agents will appear here once vehicles are added with agent information</p>
        </div>
      ) : (
        <Table sx={{ minWidth: 700 }} aria-label="agents table">
          <TableHead>
            <TableRow>
              <TableCell>Agent Name</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Vehicle Count</TableCell>
              <TableCell>Commission Till Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" style={{ padding: '40px', color: '#999' }}>
                  <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}></i>
                  <p>No agents match your search criteria</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <strong>{agent.name || 'N/A'}</strong>
                  </TableCell>
                  <TableCell>
                    {agent.phone && agent.phone !== 'N/A' ? (
                      <a 
                        href={`tel:${agent.phone}`} 
                        style={{ 
                          color: '#007bff', 
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {agent.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#6c757d' }}>N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {agent.vehicleCount || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fas fa-rupee-sign" style={{ fontSize: '14px' }}></i>
                      {formatPrice(agent.totalCommission || 0)}
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

export default AdminAgents
