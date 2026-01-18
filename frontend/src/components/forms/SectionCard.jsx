import React from 'react'
import { Paper, Box } from '@mui/material'

/**
 * Standardized section card with optional gradient header
 */
const SectionCard = ({ 
  children, 
  elevation = 1, 
  padding = 3, 
  marginBottom = 3,
  borderRadius = 2,
  ...props 
}) => {
  return (
    <Paper 
      elevation={elevation} 
      sx={{ 
        p: padding, 
        mb: marginBottom, 
        borderRadius: borderRadius,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Paper>
  )
}

export default SectionCard
