import React from 'react'
import { Person as PersonIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, FormGrid, FormTextField, FormSelect } from './index'
import { getDistricts } from '../../utils/maharashtraData'

/**
 * Shared Address Details Section
 * Used in both AddVehicle and EditVehicle
 */
const AddressDetailsSection = ({
  formData,
  availableTalukas,
  isEdit = false,
  handleInputChange,
  handleDistrictChange,
  handlePincodeChange
}) => {
  return (
    <FormSection>
      <FormSectionHeader icon={PersonIcon} title="Address Details" />
      <FormGrid>
        <FormTextField
          className="add-vehicle-form-grid-full"
          label="Address Line 1"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleInputChange}
          placeholder="House/Flat No., Building Name, Street..."
          required={!isEdit}
          sx={{ gridColumn: '1 / -1' }}
        />
        <FormSelect
          options={getDistricts()}
          value={formData.district}
          onChange={handleDistrictChange}
          label="District"
          required={!isEdit}
          placeholder="Select District"
        />
        <FormSelect
          options={availableTalukas}
          value={formData.taluka}
          onChange={(event, newValue) => {
            handleInputChange({ target: { name: 'taluka', value: newValue || '' } })
          }}
          disabled={!formData.district}
          label="Taluka"
          required={!isEdit}
          placeholder={formData.district ? "Select Taluka" : "Select District first"}
          helperText={!formData.district ? "Please select a district first" : ""}
        />
        <FormTextField
          label="Pincode"
          name="pincode"
          value={formData.pincode}
          onChange={handlePincodeChange}
          placeholder="400001"
          required={!isEdit}
          inputProps={{ maxLength: 6 }}
          error={formData.pincode.length > 0 && formData.pincode.length !== 6}
          helperText={
            formData.pincode.length > 0 && formData.pincode.length !== 6
              ? "Pincode must be exactly 6 digits"
              : ""
          }
        />
      </FormGrid>
    </FormSection>
  )
}

export default AddressDetailsSection
