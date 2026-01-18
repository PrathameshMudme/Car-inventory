import React from 'react'
import { Box, Button, CircularProgress } from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'

/**
 * Standardized form action buttons
 */
const FormActions = ({
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  submitIcon = <SaveIcon />,
  cancelIcon = <CancelIcon />,
  submitVariant = 'contained',
  cancelVariant = 'outlined',
  showCancel = true
}) => {
  return (
    <Box sx={{ 
      mt: 4, 
      pt: 3, 
      borderTop: '1px solid #e9ecef',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 2
    }}>
      {showCancel && (
        <Button
          variant={cancelVariant}
          size="large"
          startIcon={cancelIcon}
          onClick={onCancel}
          disabled={loading}
          sx={{ 
            minWidth: 130,
            fontSize: '15px',
            fontWeight: 600
          }}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant={submitVariant}
        size="large"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : submitIcon}
        onClick={onSubmit}
        disabled={loading}
        sx={{ 
          minWidth: 160,
          fontSize: '15px',
          fontWeight: 600
        }}
      >
        {loading ? 'Saving...' : submitLabel}
      </Button>
    </Box>
  )
}

export default FormActions
