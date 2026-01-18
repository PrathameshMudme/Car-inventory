import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

/**
 * Standardized filter select component
 */
const FilterSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  fullWidth = false,
  size = 'medium',
  ...props 
}) => {
  return (
    <FormControl fullWidth={fullWidth} size={size}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        sx={{
          backgroundColor: 'white',
          borderRadius: '10px',
          minWidth: fullWidth ? '100%' : 150
        }}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default FilterSelect
