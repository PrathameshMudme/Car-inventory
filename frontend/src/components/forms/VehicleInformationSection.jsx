import React from 'react'
import { Box } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DirectionsCar as CarIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, FormGrid, FormTextField, FormSelect } from './index'
import { FUEL_TYPE_OPTIONS } from '../../utils/vehicleFormConstants'

/**
 * Shared Vehicle Information Section
 * Used in both AddVehicle and EditVehicle
 */
const VehicleInformationSection = ({
  formData,
  vehicle, // For EditVehicle - to show disabled vehicleNo
  isEdit = false,
  isAdmin = false,
  handleInputChange,
  handlePurchaseDateChange
}) => {
  return (
    <FormSection>
      <FormSectionHeader icon={CarIcon} title="Vehicle Information" />
      <FormGrid>
        {isEdit ? (
          <FormTextField
            label="Vehicle Number"
            value={vehicle?.vehicleNo || ''}
            disabled
            helperText="Vehicle number cannot be changed"
            sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
          />
        ) : (
          <FormTextField
            label="Vehicle Number"
            name="vehicleNo"
            value={formData.vehicleNo}
            onChange={handleInputChange}
            placeholder="MH12AB1234"
            required
          />
        )}
        <FormTextField
          label="Chassis Number"
          name="chassisNo"
          value={formData.chassisNo}
          onChange={handleInputChange}
          placeholder="MA3XXXXXXXXX"
          required={!isEdit}
          disabled={isEdit && !isAdmin}
          helperText={isEdit && !isAdmin ? 'Only admin can edit chassis number' : ''}
          sx={isEdit && !isAdmin ? { '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } } : {}}
        />
        <FormTextField
          label="Engine Number"
          name="engineNo"
          value={formData.engineNo}
          onChange={handleInputChange}
          placeholder="ENGXXXXXXXX"
          required={!isEdit}
          disabled={isEdit && !isAdmin}
          helperText={isEdit && !isAdmin ? 'Only admin can edit engine number' : (isEdit ? 'Required for purchase notes' : '')}
          sx={isEdit && !isAdmin ? { '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } } : {}}
        />
        <FormTextField
          label="Make"
          name="make"
          value={formData.make}
          onChange={handleInputChange}
          placeholder="Honda, Maruti..."
          required={!isEdit}
        />
        <FormTextField
          label="Model"
          name="model"
          value={formData.model}
          onChange={handleInputChange}
          placeholder="City, Swift..."
          required={!isEdit}
        />
        <Box sx={{ width: '100%' }}>
          <DatePicker
            label="Manufacturing Month & Year"
            value={formData.vehicleMonth && formData.vehicleYear 
              ? new Date(formData.vehicleYear, formData.vehicleMonth - 1, 1)
              : (formData.year ? new Date(parseInt(formData.year), 0, 1) : null)}
            onChange={(newValue) => {
              if (newValue) {
                const month = newValue.getMonth() + 1
                const year = newValue.getFullYear()
                handleInputChange({ 
                  target: { 
                    name: 'vehicleMonth', 
                    value: month.toString() 
                  } 
                })
                handleInputChange({ 
                  target: { 
                    name: 'vehicleYear', 
                    value: year.toString() 
                  } 
                })
                handleInputChange({ 
                  target: { 
                    name: 'year', 
                    value: year.toString() 
                  } 
                })
              } else {
                handleInputChange({ target: { name: 'vehicleMonth', value: '' } })
                handleInputChange({ target: { name: 'vehicleYear', value: '' } })
                handleInputChange({ target: { name: 'year', value: '' } })
              }
            }}
            views={['month', 'year']}
            openTo="month"
            slotProps={{
              textField: {
                fullWidth: true,
                required: !isEdit,
                size: 'medium',
                placeholder: 'Select Month & Year'
              }
            }}
          />
        </Box>
        <FormTextField
          label="Color"
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          placeholder="White, Black..."
          required={!isEdit}
        />
        <FormSelect
          options={FUEL_TYPE_OPTIONS}
          value={formData.fuelType}
          onChange={(event, newValue) => {
            handleInputChange({ target: { name: 'fuelType', value: newValue || 'Petrol' } })
          }}
          label="Fuel Type"
          required={!isEdit}
        />
        <FormTextField
          label="Kilometers"
          name="kilometers"
          value={formData.kilometers}
          onChange={handleInputChange}
          placeholder="50000"
          required={!isEdit}
        />
      </FormGrid>
    </FormSection>
  )
}

export default VehicleInformationSection
