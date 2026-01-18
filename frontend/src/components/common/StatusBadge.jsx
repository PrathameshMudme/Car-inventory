import React from 'react'
import { Chip } from '@mui/material'

/**
 * Standardized status badge component
 */
const StatusBadge = ({ status, size = 'small' }) => {
  const statusConfig = {
    'In Stock': { color: '#27ae60', bg: 'rgba(39, 174, 96, 0.15)', border: 'rgba(39, 174, 96, 0.3)' },
    'On Modification': { color: '#f39c12', bg: 'rgba(243, 156, 18, 0.15)', border: 'rgba(243, 156, 18, 0.3)' },
    'Sold': { color: '#3498db', bg: 'rgba(52, 152, 219, 0.15)', border: 'rgba(52, 152, 219, 0.3)' },
    'Reserved': { color: '#9b59b6', bg: 'rgba(155, 89, 182, 0.15)', border: 'rgba(155, 89, 182, 0.3)' },
    'Active': { color: '#27ae60', bg: 'rgba(39, 174, 96, 0.15)', border: 'rgba(39, 174, 96, 0.3)' },
    'Disabled': { color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.15)', border: 'rgba(231, 76, 60, 0.3)' },
    'Pending': { color: '#f39c12', bg: 'rgba(243, 156, 18, 0.15)', border: 'rgba(243, 156, 18, 0.3)' },
  }

  const config = statusConfig[status] || { 
    color: '#6c757d', 
    bg: 'rgba(108, 117, 125, 0.15)', 
    border: 'rgba(108, 117, 125, 0.3)' 
  }

  return (
    <Chip
      label={status}
      size={size}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontWeight: 600,
        fontSize: '12px',
        height: size === 'small' ? '24px' : '32px'
      }}
    />
  )
}

export default StatusBadge
