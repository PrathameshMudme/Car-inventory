import React, { useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Typography,
  Chip,
  useTheme,
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

const DataTable = ({ columns, data, searchable = true, filterable = false, actions, title }) => {
  const theme = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValue, setFilterValue] = useState('')

  const filteredData = data.filter(row => {
    const matchesSearch = !searchTerm || 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    const matchesFilter = !filterValue || filterValue === 'all' || 
      (row.status && row.status.toLowerCase() === filterValue.toLowerCase())
    return matchesSearch && matchesFilter
  })

  return (
    <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {(searchable || filterable || title) && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {title && (
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {searchable && (
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
            )}
            {filterable && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterValue}
                  label="Status"
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="in stock">In Stock</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ background: theme.primaryGradient }}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '18px 20px',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
              {actions && (
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '18px 20px',
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  align="center"
                  sx={{ 
                    py: 4,
                    fontSize: '14px',
                    padding: '18px 20px',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontSize="14px">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'action.hover',
                    },
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell 
                      key={col.key}
                      sx={{
                        fontSize: '14px',
                        padding: '18px 20px',
                        color: 'text.primary',
                      }}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {actions.map((action, idx) => (
                          <IconButton
                            key={idx}
                            size="small"
                            color={action.color || 'primary'}
                            onClick={() => action.onClick(row)}
                            title={action.title}
                          >
                            {action.icon}
                          </IconButton>
                        ))}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default DataTable
