import React from 'react'
import { TextField, InputAdornment } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

/**
 * Standardized search bar component
 */
const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...',
  fullWidth = true,
  ...props 
}) => {
  return (
    <TextField
      fullWidth={fullWidth}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="medium"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: '#6c757d' }} />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          borderRadius: '10px',
        }
      }}
      {...props}
    />
  )
}

export default SearchBar
