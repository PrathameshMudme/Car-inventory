import React from 'react'
import { Box } from '@mui/material'

/**
 * Standardized form grid container
 */
const FormGrid = ({ children, className = 'add-vehicle-form-grid', ...props }) => {
  return (
    <Box className={className} {...props}>
      {children}
    </Box>
  )
}

export default FormGrid
