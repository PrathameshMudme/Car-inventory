import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { useDropzone } from 'react-dropzone'

const VehicleDocumentDropzone = ({ 
  docType, 
  label, 
  icon, 
  multiple, 
  documents = [], 
  onDrop, 
  onRemove,
  isMissing = false
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(docType, acceptedFiles),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple
  })

  const hasFile = multiple ? documents?.length > 0 : documents
  const fileCount = multiple ? documents?.length || 0 : (documents ? 1 : 0)

  return (
    <Paper
      {...getRootProps()}
      elevation={0}
      sx={{
        p: 2,
        textAlign: 'center',
        cursor: 'pointer',
        border: '2px dashed',
        borderColor: hasFile ? '#22c55e' : isMissing ? '#f59e0b' : isDragActive ? '#7c3aed' : '#e2e8f0',
        borderRadius: 3,
        bgcolor: hasFile ? '#f0fdf4' : isMissing ? '#fffbeb' : isDragActive ? '#faf5ff' : '#fafafa',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: '#7c3aed',
          bgcolor: '#faf5ff',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
        }
      }}
    >
      <input {...getInputProps()} />
      
      {/* Success Badge */}
      {hasFile && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: '#22c55e',
          color: 'white',
          borderRadius: '50%',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700
        }}>
          {fileCount}
        </Box>
      )}

      {/* Missing Badge */}
      {isMissing && !hasFile && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: '#f59e0b',
          color: 'white',
          borderRadius: '50%',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700
        }}>
          !
        </Box>
      )}

      {/* Icon */}
      <Box sx={{ 
        fontSize: '32px', 
        mb: 1,
        filter: hasFile ? 'none' : 'grayscale(50%)',
        transition: 'all 0.3s'
      }}>
        {icon}
      </Box>
      
      {/* Label */}
      <Typography 
        sx={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: hasFile ? '#166534' : isMissing ? '#d97706' : '#475569',
          mb: 0.5
        }}
      >
        {label}
      </Typography>
      
      {/* Status */}
      {hasFile ? (
        <Box onClick={(e) => e.stopPropagation()} sx={{ mt: 1 }}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(docType)
            }}
            sx={{ fontSize: '11px', py: 0, minHeight: 24 }}
          >
            Remove
          </Button>
        </Box>
      ) : (
        <Typography 
          variant="caption" 
          sx={{ 
            color: isDragActive ? '#7c3aed' : '#94a3b8',
            fontSize: '11px'
          }}
        >
          {isDragActive ? 'Drop file here' : multiple ? 'Multiple files' : 'PDF or Image'}
        </Typography>
      )}
    </Paper>
  )
}

export default VehicleDocumentDropzone
