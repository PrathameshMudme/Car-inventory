import React from 'react'
import { Box, Divider } from '@mui/material'

/**
 * Standardized form section wrapper
 */
const FormSection = ({ children, showDivider = true, marginBottom = 4 }) => {
  return (
    <>
      <Box mb={marginBottom}>
        {children}
      </Box>
      {showDivider && <Divider sx={{ my: 3 }} />}
    </>
  )
}

export default FormSection
