import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

/**
 * Standardized loading state component
 */
const LoadingState = ({ message = 'Loading...', size = 40 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2
      }}
    >
      <CircularProgress size={size} sx={{ color: '#667eea' }} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
}

export default LoadingState
