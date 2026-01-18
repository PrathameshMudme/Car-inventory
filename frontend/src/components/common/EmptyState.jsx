import React from 'react'
import { Box, Typography } from '@mui/material'
import { Inbox as InboxIcon } from '@mui/icons-material'

/**
 * Standardized empty state component
 */
const EmptyState = ({ 
  icon = <InboxIcon sx={{ fontSize: 64, color: '#bdc3c7' }} />,
  title = 'No data found',
  message,
  action 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center'
      }}
    >
      {icon}
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 2, 
          mb: 1,
          color: '#2c3e50',
          fontWeight: 600
        }}
      >
        {title}
      </Typography>
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: action ? 3 : 0 }}
        >
          {message}
        </Typography>
      )}
      {action}
    </Box>
  )
}

export default EmptyState
