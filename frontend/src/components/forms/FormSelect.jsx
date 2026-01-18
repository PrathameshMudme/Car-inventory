import React from 'react'
import { Autocomplete, TextField } from '@mui/material'

/**
 * Standardized Select/Autocomplete component
 */
const FormSelect = ({
  options = [],
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  ...props
}) => {
  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={options}
      value={value || null}
      onChange={onChange}
      disabled={disabled}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={label}
          placeholder={placeholder}
          required={required}
          size={size}
          fullWidth
        />
      )}
      {...props}
    />
  )
}

export default FormSelect
