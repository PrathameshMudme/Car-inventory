import React from 'react'
import { Box, Typography, Button } from '@mui/material'

/**
 * Standardized section header with title, description, and optional actions
 */
const SectionHeader = ({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  actionIcon,
  children 
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      <Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: '24px',
            fontWeight: 700,
            color: '#2c3e50',
            mb: description ? 0.5 : 0
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6c757d',
              fontSize: '14px',
              mt: 0.5
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {children}
        {actionLabel && onAction && (
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onAction}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              }
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default SectionHeader
