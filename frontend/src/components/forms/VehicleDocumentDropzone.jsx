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

  // Properly check if documents exist
  // For multiple: documents is an array, check if it has items
  // For single: documents is a single value (File object or document object), check if it's truthy
  // Properly check if documents exist
  // For multiple: documents is always an array, check if it has items
  // For single: documents is a single value (File object, document object, or null), check if it's truthy
  let hasFile = false
  let fileCount = 0
  
  if (multiple) {
    // Multiple documents: always an array
    hasFile = Array.isArray(documents) && documents.length > 0
    fileCount = Array.isArray(documents) ? documents.length : 0
  } else {
    // Single document: can be File object, document object, null, undefined, or empty array
    // Check if it's a valid document (not null, undefined, false, empty string, or empty array)
    if (Array.isArray(documents)) {
      hasFile = documents.length > 0
      fileCount = documents.length > 0 ? 1 : 0
    } else {
      hasFile = documents !== null && documents !== undefined && documents !== false && documents !== ''
      fileCount = hasFile ? 1 : 0
    }
  }

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
