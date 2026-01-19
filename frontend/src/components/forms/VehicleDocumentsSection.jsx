import React from 'react'
import { Grid } from '@mui/material'
import { FolderOpen as FolderIcon } from '@mui/icons-material'
import { FormSection, FormSectionHeader, VehicleDocumentDropzone } from './index'
import { DOCUMENT_TYPES } from '../../utils/vehicleFormConstants'

/**
 * Shared Vehicle Documents Section
 * Used in both AddVehicle and EditVehicle
 */
const VehicleDocumentsSection = ({
  documents,
  onDocumentDrop,
  removeDocument,
  vehicle = null // For EditVehicle - to check missing documents
}) => {
  return (
    <FormSection showDivider={false}>
      <FormSectionHeader 
        icon={FolderIcon} 
        title="Documents"
        subtitle="Upload vehicle documents. Supported formats: PDF, JPG, PNG"
      />
      <Grid container spacing={2}>
        {DOCUMENT_TYPES.map((doc) => (
          <Grid item xs={6} sm={4} md={3} key={doc.key}>
            <VehicleDocumentDropzone
              docType={doc.key}
              label={doc.label}
              icon={doc.icon}
              multiple={doc.multiple}
              documents={doc.multiple 
                ? (Array.isArray(documents[doc.key]) ? documents[doc.key] : [])
                : (documents[doc.key] !== null && 
                   documents[doc.key] !== undefined && 
                   !(Array.isArray(documents[doc.key]) && documents[doc.key].length === 0)
                   ? documents[doc.key] 
                   : null)
              }
              onDrop={onDocumentDrop}
              onRemove={removeDocument}
              isMissing={vehicle?.missingDocuments?.includes(doc.key)}
            />
          </Grid>
        ))}
      </Grid>
    </FormSection>
  )
}

export default VehicleDocumentsSection
