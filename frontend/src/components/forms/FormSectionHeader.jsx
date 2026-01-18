import React from 'react'
import { Box, Typography } from '@mui/material'

const FormSectionHeader = ({ icon: Icon, title, subtitle }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: subtitle ? 2 : 3 }}>
    <Icon sx={{ color: 'primary.main' }} />
    <Box sx={{ flex: 1 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          color: '#2c3e50',
          fontWeight: 700,
          fontSize: '20px'
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
)

export default FormSectionHeader
