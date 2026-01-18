import React from 'react'
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import { ViewList as ListIcon, ViewModule as GridIcon } from '@mui/icons-material'

/**
 * Standardized view toggle component (Table/Grid)
 */
const ViewToggle = ({ view, onChange, showLabels = false }) => {
  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={(e, newView) => newView && onChange(newView)}
      aria-label="view toggle"
      size="small"
      sx={{
        backgroundColor: 'white',
        borderRadius: '10px',
        '& .MuiToggleButton-root': {
          border: '1px solid #e0e4e8',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
            }
          }
        }
      }}
    >
      <ToggleButton value="table" aria-label="table view">
        <Tooltip title="Table View">
          <ListIcon />
        </Tooltip>
        {showLabels && <span style={{ marginLeft: 8 }}>Table</span>}
      </ToggleButton>
      <ToggleButton value="grid" aria-label="grid view">
        <Tooltip title="Grid View">
          <GridIcon />
        </Tooltip>
        {showLabels && <span style={{ marginLeft: 8 }}>Grid</span>}
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default ViewToggle
