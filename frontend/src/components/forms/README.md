# Reusable Form Components

This directory contains standardized, reusable form components to reduce code duplication and maintain consistency across the application.

## Components

### 1. FormSectionHeader
Standardized section header with icon and optional subtitle.

```jsx
import { FormSectionHeader } from './forms'
import { CarIcon } from '@mui/icons-material'

<FormSectionHeader 
  icon={CarIcon} 
  title="Vehicle Information"
  subtitle="Optional subtitle text"
/>
```

### 2. FormTextField
Standardized TextField with consistent styling (fullWidth, size="medium" by default).

```jsx
import { FormTextField } from './forms'

<FormTextField
  label="Vehicle Number"
  name="vehicleNo"
  value={formData.vehicleNo}
  onChange={handleInputChange}
  placeholder="MH12AB1234"
  required
  disabled={false}
  type="text"
/>
```

### 3. FormSelect
Standardized Autocomplete/Select component.

```jsx
import { FormSelect } from './forms'

<FormSelect
  options={['Option 1', 'Option 2']}
  value={formData.status}
  onChange={(event, newValue) => setFormData(prev => ({ ...prev, status: newValue }))}
  label="Status"
  placeholder="Select status"
  required={false}
  disabled={false}
/>
```

### 4. FormContainer
Standardized form container with Card wrapper.

```jsx
import { FormContainer } from './forms'

<FormContainer padding={4}>
  <form>
    {/* Form content */}
  </form>
</FormContainer>
```

### 5. FormSection
Standardized form section wrapper with optional divider.

```jsx
import { FormSection } from './forms'

<FormSection showDivider={true} marginBottom={4}>
  <FormSectionHeader icon={CarIcon} title="Section Title" />
  {/* Section content */}
</FormSection>
```

### 6. FormActions
Standardized form action buttons (Cancel & Submit).

```jsx
import { FormActions } from './forms'

<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  submitLabel="Save"
  cancelLabel="Cancel"
  loading={false}
  showCancel={true}
/>
```

### 7. FormGrid
Standardized form grid container.

```jsx
import { FormGrid } from './forms'

<FormGrid className="add-vehicle-form-grid">
  {/* Grid items */}
</FormGrid>
```

### 8. ActionButton
Standardized action button with color variants.

```jsx
import { ActionButton } from './forms'
import { Edit as EditIcon } from '@mui/icons-material'

// Icon button
<ActionButton
  icon={<EditIcon />}
  onClick={handleEdit}
  title="Edit"
  variant="icon"
  color="primary" // primary, view, warning, danger, success
/>

// Text button
<ActionButton
  icon={<EditIcon />}
  onClick={handleEdit}
  title="Edit Vehicle"
  variant="outlined"
  color="primary"
/>
```

### 9. SectionCard
Standardized section card with Paper wrapper.

```jsx
import { SectionCard } from './forms'

<SectionCard elevation={1} padding={3} marginBottom={3}>
  {/* Card content */}
</SectionCard>
```

### 10. VehicleImageDropzone
Reusable image upload dropzone with camera support.

```jsx
import { VehicleImageDropzone } from './forms'

<VehicleImageDropzone
  category="front"
  label="Front View"
  images={images.front || []}
  onDrop={onImageDrop}
  onRemove={removeImage}
  onCameraCapture={handleCameraCapture}
/>
```

### 11. VehicleDocumentDropzone
Reusable document upload dropzone.

```jsx
import { VehicleDocumentDropzone } from './forms'

<VehicleDocumentDropzone
  docType="insurance"
  label="Insurance"
  icon="🛡️"
  multiple={false}
  documents={documents.insurance || []}
  onDrop={onDocumentDrop}
  onRemove={removeDocument}
  isMissing={false}
/>
```

## Utilities

### cameraCapture.js
Utility function for camera image capture.

```jsx
import { captureImageFromCamera } from '../utils/cameraCapture'

captureImageFromCamera(
  (files) => onImageDrop(category, files),
  showToast
)
```

### vehicleFormConstants.js
Shared constants for vehicle forms.

```jsx
import {
  IMAGE_CATEGORIES,
  DOCUMENT_TYPES,
  FUEL_TYPE_OPTIONS,
  PURCHASE_PAYMENT_MODE_OPTIONS,
  STATUS_OPTIONS,
  OWNER_TYPE_OPTIONS
} from '../utils/vehicleFormConstants'
```

## Usage Example

```jsx
import {
  FormContainer,
  FormSection,
  FormSectionHeader,
  FormTextField,
  FormSelect,
  FormActions,
  FormGrid
} from './forms'
import { CarIcon } from '@mui/icons-material'

const MyForm = () => {
  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormSection>
          <FormSectionHeader icon={CarIcon} title="Basic Information" />
          <FormGrid>
            <FormTextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <FormSelect
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={handleStatusChange}
              label="Status"
            />
          </FormGrid>
        </FormSection>
        
        <FormActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </form>
    </FormContainer>
  )
}
```

## Benefits

- **Consistency**: All forms use the same components and styling
- **Maintainability**: Update styling in one place affects all forms
- **Reduced Code**: Eliminates ~50% of repetitive form code
- **Type Safety**: Consistent prop interfaces
- **Reusability**: Components can be used across the entire application
