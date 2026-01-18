import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

const Modal = ({ isOpen, onClose, title, children, size = 'medium', actions }) => {
  const maxWidth = size === 'xlarge' ? 'xl' : size === 'large' ? 'lg' : size === 'small' ? 'sm' : 'md'
  
  // Consistent padding based on size
  const padding = size === 'xlarge' ? '32px' : size === 'large' ? '28px' : '24px'
  const titlePadding = size === 'xlarge' ? '28px 32px' : size === 'large' ? '24px 28px' : '20px 24px'

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '18px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header with gradient background - consistent for all modals */}
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: titlePadding,
        borderBottom: 'none',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="h5" 
            component="span" 
            fontWeight={700}
            sx={{ 
              fontSize: size === 'xlarge' ? '24px' : size === 'large' ? '22px' : '20px',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            {title}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              padding: '8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'white',
                background: 'rgba(255, 255, 255, 0.15)',
                transform: 'rotate(90deg)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      {/* Content area with consistent styling */}
      <DialogContent 
        dividers={false}
        sx={{
          maxHeight: size === 'xlarge' ? '80vh' : size === 'large' ? '75vh' : '70vh',
          overflowY: 'auto',
          padding: padding,
          background: '#fafbfc',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
          }
        }}
      >
        {children}
      </DialogContent>
      
      {/* Actions area - if provided */}
      {actions && (
        <DialogActions sx={{
          padding: '20px 24px',
          background: 'white',
          borderTop: '1px solid #e9ecef',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default Modal
