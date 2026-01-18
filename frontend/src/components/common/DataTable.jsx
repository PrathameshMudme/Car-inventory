import React from 'react'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'

/**
 * Reusable DataTable component with columns configuration
 */
const DataTable = ({ 
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  ...props 
}) => {
  if (loading) {
    return <LoadingState />
  }

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <Table {...props}>
      <TableHead>
        <TableRow>
          {columns.map((col, idx) => (
            <TableCell 
              key={col.key || idx}
              align={col.align || 'left'}
              sx={col.sx}
            >
              {col.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row, rowIdx) => (
          <TableRow 
            key={row.id || row._id || rowIdx}
            onClick={() => onRowClick && onRowClick(row)}
            sx={onRowClick ? { cursor: 'pointer' } : {}}
          >
            {columns.map((col, colIdx) => (
              <TableCell 
                key={col.key || colIdx}
                align={col.align || 'left'}
                sx={col.cellSx}
                onClick={(e) => {
                  // Stop propagation if clicking on action buttons
                  if (col.key === 'actions' || e.target.closest('button, [role="button"]')) {
                    e.stopPropagation()
                  }
                }}
              >
                {col.render ? col.render(row, rowIdx) : row[col.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default DataTable
