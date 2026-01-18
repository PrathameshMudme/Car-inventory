import React from 'react'
import { TextField } from '@mui/material'

/**
 * Standardized TextField component with consistent styling
 */
const FormTextField = ({
  fullWidth = true,
  size = 'medium',
  required = false,
  disabled = false,
  type = 'text',
  ...props
}) => {
  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      required={required}
      disabled={disabled}
      type={type}
      {...props}
    />
  )
}

export default FormTextField
