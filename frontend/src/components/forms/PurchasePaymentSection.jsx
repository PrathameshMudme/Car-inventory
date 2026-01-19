import React from 'react'
import { AttachMoney as MoneyIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, FormGrid, FormTextField } from './index'
import { PURCHASE_PAYMENT_MODE_OPTIONS } from '../../utils/vehicleFormConstants'

/**
 * Shared Purchase Payment Section
 * Used in both AddVehicle and EditVehicle
 */
const PurchasePaymentSection = ({
  purchasePaymentModes,
  deductionsNotes,
  formData,
  handlePaymentModeAmountChange,
  setDeductionsNotes
}) => {
  return (
    <FormSection>
      <FormSectionHeader 
        icon={MoneyIcon} 
        title="Payment Mode (To Seller)"
        subtitle="Enter payment amounts. Remaining amount will be calculated automatically: Purchase Price - (Cash + Bank Transfer + Deductions)"
      />
      <FormGrid>
        {PURCHASE_PAYMENT_MODE_OPTIONS.map((mode) => (
          <FormTextField
            key={mode.key}
            label={`${mode.label} (₹)`}
            type="text"
            value={purchasePaymentModes[mode.key] || ''}
            onChange={(e) => handlePaymentModeAmountChange(mode.key, e.target.value)}
            placeholder="NIL"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }}
          />
        ))}
      </FormGrid>
      {purchasePaymentModes.deductions && purchasePaymentModes.deductions.toString().trim() !== '' && (
        <FormGrid className="add-vehicle-form-grid-full" sx={{ mt: 2 }}>
          <FormTextField
            label="Deductions Notes"
            value={deductionsNotes}
            onChange={(e) => setDeductionsNotes(e.target.value)}
            placeholder="Enter reason for deductions (e.g., Repair costs, Pending documentation, etc.)"
            multiline
            rows={3}
            helperText="This note will be visible to admin and included in purchase notes"
          />
        </FormGrid>
      )}
      <FormGrid sx={{ mt: 2 }}>
        <FormTextField
          label="Remaining Amount"
          name="remainingAmountToSeller"
          type="number"
          value={formData.remainingAmountToSeller}
          disabled
          helperText="Auto-calculated: Purchase Price - (Cash + Bank Transfer + Deductions)"
          sx={{
            '& .MuiInputBase-input': {
              backgroundColor: '#f5f5f5',
              fontWeight: 600,
              color: '#1976d2'
            }
          }}
        />
      </FormGrid>
    </FormSection>
  )
}

export default PurchasePaymentSection
