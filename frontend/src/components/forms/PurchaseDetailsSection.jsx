import React from 'react'
import { Box } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AttachMoney as MoneyIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, FormGrid, FormTextField, FormSelect } from './index'
import { OWNER_TYPE_OPTIONS, STATUS_OPTIONS } from '../../utils/vehicleFormConstants'

/**
 * Shared Purchase Details Section
 * Used in both AddVehicle and EditVehicle
 */
const PurchaseDetailsSection = ({
  formData,
  isEdit = false,
  isAdmin = false,
  handleInputChange
}) => {
  return (
    <FormSection>
      <FormSectionHeader icon={MoneyIcon} title="Purchase Details" />
      <FormGrid>
        <FormTextField
          label="Purchase Price (₹)"
          name="purchasePrice"
          type="number"
          value={formData.purchasePrice}
          onChange={handleInputChange}
          placeholder="850000"
          required={!isEdit}
        />
        {isAdmin && (
          <FormTextField
            label="Asking Price (₹)"
            name="askingPrice"
            type="number"
            value={formData.askingPrice}
            onChange={handleInputChange}
            placeholder="1000000"
          />
        )}
        {isEdit && (
          <FormTextField
            label="Last Price (₹)"
            name="lastPrice"
            type="number"
            value={formData.lastPrice}
            onChange={handleInputChange}
            placeholder="950000"
          />
        )}
        <FormSelect
          options={OWNER_TYPE_OPTIONS}
          value={formData.ownerType}
          onChange={(event, newValue) => {
            const ownerTypeValue = newValue || ''
            handleInputChange({ 
              target: { 
                name: 'ownerType', 
                value: ownerTypeValue
              } 
            })
            if (ownerTypeValue !== 'Custom') {
              handleInputChange({ 
                target: { 
                  name: 'ownerTypeCustom', 
                  value: '' 
                } 
              })
            }
          }}
          label="Owner Type"
        />
        {formData.ownerType === 'Custom' && (
          <FormTextField
            label="Custom Owner Description"
            name="ownerTypeCustom"
            value={formData.ownerTypeCustom}
            onChange={handleInputChange}
            placeholder="e.g., 4th Owner, Company Owned..."
            required={formData.ownerType === 'Custom'}
          />
        )}
        {isEdit && isAdmin && (
          <>
            <FormTextField
              label="Agent Commission (₹)"
              name="agentCommission"
              type="number"
              value={formData.agentCommission}
              onChange={handleInputChange}
              inputProps={{ min: 0, step: 100 }}
            />
            <FormTextField
              label="Agent Phone"
              name="agentPhone"
              value={formData.agentPhone}
              onChange={handleInputChange}
              placeholder="+91 98765 43210"
            />
            <FormTextField
              label="Other Cost (₹)"
              name="otherCost"
              type="number"
              value={formData.otherCost}
              onChange={handleInputChange}
              inputProps={{ min: 0, step: 100 }}
              helperText="Additional costs like insurance, registration, documentation, etc."
            />
            <FormTextField
              label="Other Cost Notes"
              name="otherCostNotes"
              value={formData.otherCostNotes}
              onChange={handleInputChange}
              placeholder="e.g., Insurance ₹5000, Registration ₹2000"
              multiline
              rows={2}
            />
          </>
        )}
        {isEdit && (
          <FormSelect
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(event, newValue) => {
              handleInputChange({ 
                target: { 
                  name: 'status', 
                  value: newValue || 'On Modification' 
                } 
              })
            }}
            label="Status"
          />
        )}
      </FormGrid>
    </FormSection>
  )
}

export default PurchaseDetailsSection
