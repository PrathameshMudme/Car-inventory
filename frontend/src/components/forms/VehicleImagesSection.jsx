import React from 'react'
import { Grid } from '@mui/material'
import { CameraAlt as CameraIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, VehicleImageDropzone } from './index'
import { IMAGE_CATEGORIES } from '../../utils/vehicleFormConstants'

/**
 * Shared Vehicle Images Section
 * Used in both AddVehicle and EditVehicle
 */
const VehicleImagesSection = ({
  images,
  onImageDrop,
  removeImage,
  handleCameraCapture,
  isEdit = false
}) => {
  return (
    <FormSection>
      <FormSectionHeader 
        icon={CameraIcon} 
        title="Vehicle Images"
        subtitle={isEdit 
          ? "Upload additional images. Existing images will be preserved."
          : "Upload images for each category. These will be used as 'Before Modification' images."
        }
      />
      <Grid container spacing={2}>
        {IMAGE_CATEGORIES.map(category => (
          <Grid item xs={6} sm={4} md={2} key={category.key}>
            <VehicleImageDropzone
              category={category.key}
              label={category.label}
              images={images[category.key] || []}
              onDrop={onImageDrop}
              onRemove={removeImage}
              onCameraCapture={handleCameraCapture}
              maxCount={category.maxCount || 1}
            />
          </Grid>
        ))}
      </Grid>
    </FormSection>
  )
}

export default VehicleImagesSection
