import React from 'react'
import { Box, Card, CardContent } from '@mui/material'

/**
 * Standardized form container with Card wrapper
 */
const FormContainer = ({ children, padding = 4 }) => {
  return (
    <Box sx={{ px: 3, py: 2, width: '100%', maxWidth: '100%' }}>
      <Card elevation={2} sx={{ borderRadius: 3, maxWidth: '100%' }}>
        <CardContent sx={{ p: padding, width: '100%', maxWidth: '100%' }}>
          {children}
        </CardContent>
      </Card>
    </Box>
  )
}

export default FormContainer
