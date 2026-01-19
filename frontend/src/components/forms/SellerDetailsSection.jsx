import React from 'react'
import { Person as PersonIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, FormGrid, FormTextField } from './index'

/**
 * Shared Seller Details Section
 * Used in both AddVehicle and EditVehicle
 */
const SellerDetailsSection = ({
  formData,
  isEdit = false,
  handleInputChange
}) => {
  return (
    <FormSection>
      <FormSectionHeader icon={PersonIcon} title="Seller Details" />
      <FormGrid>
        <FormTextField
          label="Seller Name"
          name="sellerName"
          value={formData.sellerName}
          onChange={handleInputChange}
          placeholder="Enter seller name"
          required={!isEdit}
        />
        <FormTextField
          label="Seller Contact"
          name="sellerContact"
          value={formData.sellerContact}
          onChange={handleInputChange}
          placeholder="+91 98765 43210"
          required={!isEdit}
        />
        <FormTextField
          label="Agent Name"
          name="agentName"
          value={formData.agentName}
          onChange={handleInputChange}
          placeholder="Enter agent name"
          required={!isEdit}
        />
        <FormTextField
          className="add-vehicle-form-grid-full"
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Additional notes about the vehicle..."
          multiline
          rows={3}
          sx={{ gridColumn: '1 / -1' }}
        />
      </FormGrid>
    </FormSection>
  )
}

export default SellerDetailsSection
