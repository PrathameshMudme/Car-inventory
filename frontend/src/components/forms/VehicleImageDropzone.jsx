import React from 'react'
import { Box, Typography, Button, Chip, IconButton } from '@mui/material'
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, CameraAlt as CameraIcon } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'

const VehicleImageDropzone = ({ 
  category, 
  label, 
  images = [], 
  onDrop, 
  onRemove, 
  onCameraCapture 
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(category, acceptedFiles),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    multiple: true
  })

  const hasImages = images?.length > 0

  return (
    <Box sx={{ 
      border: '1px solid #e9ecef', 
      borderRadius: 2, 
      bgcolor: 'white',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        px: 1.5, 
        py: 1, 
        bgcolor: '#f8f9fa', 
        borderBottom: '1px solid #e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#2c3e50' }}>
          {label}
        </Typography>
        {hasImages && (
          <Chip 
            label={`${images.length}`} 
            size="small" 
            color="success" 
            sx={{ height: 20, fontSize: '11px' }}
          />
        )}
      </Box>
      
      {/* Drop Zone */}
      <Box
        {...getRootProps()}
        sx={{
          p: 1.5,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? '#f0f4ff' : 'white',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: '#f8f9fa' }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 28, color: isDragActive ? 'primary.main' : '#adb5bd', mb: 0.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '11px' }}>
          {isDragActive ? 'Drop here' : 'Click or drag'}
        </Typography>
      </Box>

      {/* Camera Button */}
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<CameraIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.stopPropagation()
            onCameraCapture(category)
          }}
          sx={{ fontSize: '11px', py: 0.5 }}
        >
          Camera
        </Button>
      </Box>

      {/* Image Previews */}
      {hasImages && (
        <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {images.map((imgObj, idx) => (
            <Box key={idx} sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={imgObj.preview || imgObj.imageUrl}
                alt={`${label} ${idx + 1}`}
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid #e9ecef'
                }}
              />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  bgcolor: 'error.main',
                  color: 'white',
                  width: 16,
                  height: 16,
                  '&:hover': { bgcolor: 'error.dark' }
                }}
                onClick={() => onRemove(category, idx)}
              >
                <DeleteIcon sx={{ fontSize: 10 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default VehicleImageDropzone
