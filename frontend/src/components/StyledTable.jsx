import React from 'react'
import { styled } from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  background: 'white',
  borderRadius: '16px',
  padding: 0,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  border: '1px solid #e8ecf0',
}))

const StyledTable = styled(Table)({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  margin: 0,
})

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #667eea, transparent)',
  },
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    textAlign: 'left',
    padding: '18px 20px',
    color: '#2c3e50',
    fontWeight: 700,
    fontSize: '15px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid #e0e4e8',
    whiteSpace: 'nowrap',
    position: 'relative',
    '&:first-of-type': {
      paddingLeft: '25px',
    },
    '&:last-of-type': {
      paddingRight: '25px',
      textAlign: 'center',
    },
  },
  [`&.${tableCellClasses.body}`]: {
    padding: '18px 20px',
    fontSize: '15px',
    color: '#2c3e50',
    verticalAlign: 'middle',
    borderBottom: '1px solid #f0f2f5',
    fontWeight: 500,
    '&:first-of-type': {
      paddingLeft: '25px',
    },
    '&:last-of-type': {
      paddingRight: '25px',
    },
    '& *': {
      fontSize: '15px !important',
      fontWeight: 500,
    },
    '& .MuiChip-root': {
      fontSize: '14px !important',
      fontWeight: 600,
    },
    '& span': {
      fontSize: '15px !important',
    },
  },
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.2s ease',
  borderBottom: '1px solid #f0f2f5',
  background: 'white',
  animation: 'fadeInRow 0.3s ease forwards',
  '&:nth-of-type(even)': {
    background: '#fafbfc',
  },
  '&:nth-of-type(1)': {
    animationDelay: '0.05s',
  },
  '&:nth-of-type(2)': {
    animationDelay: '0.1s',
  },
  '&:nth-of-type(3)': {
    animationDelay: '0.15s',
  },
  '&:nth-of-type(4)': {
    animationDelay: '0.2s',
  },
  '&:nth-of-type(5)': {
    animationDelay: '0.25s',
  },
  '&:nth-of-type(6)': {
    animationDelay: '0.3s',
  },
  '&:last-child td': {
    borderBottom: 'none',
  },
  '&:hover': {
    background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%) !important',
    transform: 'translateX(2px)',
    boxShadow: '-2px 0 8px rgba(102, 126, 234, 0.15)',
  },
  // Button and icon styles
  '& .btn-icon-small': {
    background: 'transparent !important',
    border: '1.5px solid #e0e4e8 !important',
    padding: '8px 10px !important',
    borderRadius: '8px !important',
    cursor: 'pointer !important',
    color: '#6c757d !important',
    transition: 'all 0.2s ease !important',
    fontSize: '20px !important',
    width: '44px !important',
    height: '44px !important',
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    minWidth: '44px !important',
    minHeight: '44px !important',
  },
  '& .btn-icon-small i': {
    fontSize: '20px !important',
    display: 'inline-block !important',
    lineHeight: '1 !important',
    width: 'auto !important',
    height: 'auto !important',
    fontStyle: 'normal !important',
    fontWeight: '900 !important',
    opacity: '1 !important',
    visibility: 'visible !important',
    color: 'inherit !important',
  },
  '& .btn-icon-small i.fas': {
    fontFamily: '"Font Awesome 6 Free" !important',
    WebkitFontSmoothing: 'antialiased !important',
    display: 'inline-block !important',
    fontStyle: 'normal !important',
    fontVariant: 'normal !important',
    textRendering: 'auto !important',
    lineHeight: '1 !important',
    MozOsxFontSmoothing: 'grayscale !important',
  },
  '& .btn-icon-small i.fa': {
    fontFamily: '"Font Awesome 6 Free" !important',
    fontWeight: '900 !important',
  },
  '& .btn-icon-small:hover': {
    background: '#667eea !important',
    color: 'white !important',
    borderColor: '#667eea !important',
    transform: 'translateY(-2px) !important',
    boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3) !important',
  },
  '& .btn-icon-small:hover i': {
    color: 'white !important',
  },
  // Specific Button Colors based on title attribute
  // STANDARDIZED BUTTON COLOR SCHEME - See index.css for full documentation
  
  // PURPLE - Edit Actions (Theme Color)
  '& .btn-icon-small[title="Edit User"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  '& .btn-icon-small[title="Edit Vehicle"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  '& .btn-icon-small[title="Edit Prices"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  '& .btn-icon-small[title="Complete Modification"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  // BLUE - View Actions
  '& .btn-icon-small[title="View Details"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  '& .btn-icon-small[title="View"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  '& .btn-icon-small[title="View Note"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  '& .btn-icon-small[title="View Invoice"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  '& .btn-icon-small[title="View PDF"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  '& .btn-icon-small[title="View Receipt"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  '& .btn-icon-small[title="Generate Purchase Note"]': {
    color: '#3498db !important',
    borderColor: 'rgba(52, 152, 219, 0.3) !important',
    background: 'rgba(52, 152, 219, 0.08) !important',
  },
  // ORANGE - Warning Actions
  '& .btn-icon-small[title="Change Password"]': {
    color: '#f39c12 !important',
    borderColor: 'rgba(243, 156, 18, 0.3) !important',
    background: 'rgba(243, 156, 18, 0.08) !important',
  },
  // RED - Danger Actions
  // RED - Danger/Cancel Actions
  '& .btn-icon-small[title="Disable User"]': {
    color: '#e74c3c !important',
    borderColor: 'rgba(231, 76, 60, 0.3) !important',
    background: 'rgba(231, 76, 60, 0.08) !important',
  },
  '& .btn-icon-small[title="Delete"]': {
    color: '#e74c3c !important',
    borderColor: 'rgba(231, 76, 60, 0.3) !important',
    background: 'rgba(231, 76, 60, 0.08) !important',
  },
  '& .btn-icon-small[title="Cancel"]': {
    color: '#e74c3c !important',
    borderColor: 'rgba(231, 76, 60, 0.3) !important',
    background: 'rgba(231, 76, 60, 0.08) !important',
  },
  '& .btn-icon-small[title="Logout"]': {
    color: '#e74c3c !important',
    borderColor: 'rgba(231, 76, 60, 0.3) !important',
    background: 'rgba(231, 76, 60, 0.08) !important',
  },
  // GREEN - Success Actions
  '& .btn-icon-small[title="Enable User"]': {
    color: '#27ae60 !important',
    borderColor: 'rgba(39, 174, 96, 0.3) !important',
    background: 'rgba(39, 174, 96, 0.08) !important',
  },
  '& .btn-icon-small[title="Mark Sold"]': {
    color: '#27ae60 !important',
    borderColor: 'rgba(39, 174, 96, 0.3) !important',
    background: 'rgba(39, 174, 96, 0.08) !important',
  },
  '& .btn-icon-small[title="Mark Customer Payment as Paid"]': {
    color: '#27ae60 !important',
    borderColor: 'rgba(39, 174, 96, 0.3) !important',
    background: 'rgba(39, 174, 96, 0.08) !important',
  },
  '& .btn-icon-small[title="Mark Seller Payment as Paid"]': {
    color: '#27ae60 !important',
    borderColor: 'rgba(39, 174, 96, 0.3) !important',
    background: 'rgba(39, 174, 96, 0.08) !important',
  },
  '& .btn-icon-small[title="Mark Payment as Paid"]': {
    color: '#27ae60 !important',
    borderColor: 'rgba(39, 174, 96, 0.3) !important',
    background: 'rgba(39, 174, 96, 0.08) !important',
  },
  // PURPLE - Primary/Special Actions
  '& .btn-icon-small[title="Download"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  '& .btn-icon-small[title="Email"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  '& .btn-icon-small[title="Generate Note"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  '& .btn-icon-small[title="Save"]': {
    color: '#667eea !important',
    borderColor: 'rgba(102, 126, 234, 0.3) !important',
    background: 'rgba(102, 126, 234, 0.08) !important',
  },
  // Hover states for specific buttons
  
  // PURPLE - Edit Actions Hover (Theme Color)
  '& .btn-icon-small[title="Edit User"]:hover': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4) !important',
  },
  '& .btn-icon-small[title="Edit Vehicle"]:hover': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4) !important',
  },
  '& .btn-icon-small[title="Edit Prices"]:hover': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4) !important',
  },
  '& .btn-icon-small[title="Complete Modification"]:hover': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4) !important',
  },
  // BLUE - View Actions Hover
  '& .btn-icon-small[title="View Details"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  '& .btn-icon-small[title="View"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  '& .btn-icon-small[title="View Note"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  '& .btn-icon-small[title="View Invoice"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  '& .btn-icon-small[title="View PDF"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  '& .btn-icon-small[title="View Receipt"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  '& .btn-icon-small[title="Generate Purchase Note"]:hover': {
    background: '#3498db !important',
    borderColor: '#3498db !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3) !important',
  },
  // ORANGE - Warning Actions Hover
  '& .btn-icon-small[title="Change Password"]:hover': {
    background: '#f39c12 !important',
    borderColor: '#f39c12 !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(243, 156, 18, 0.3) !important',
  },
  // RED - Danger/Cancel Actions Hover
  '& .btn-icon-small[title="Disable User"]:hover': {
    background: '#e74c3c !important',
    borderColor: '#e74c3c !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4) !important',
  },
  '& .btn-icon-small[title="Delete"]:hover': {
    background: '#e74c3c !important',
    borderColor: '#e74c3c !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4) !important',
  },
  '& .btn-icon-small[title="Cancel"]:hover': {
    background: '#e74c3c !important',
    borderColor: '#e74c3c !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4) !important',
  },
  '& .btn-icon-small[title="Logout"]:hover': {
    background: '#e74c3c !important',
    borderColor: '#e74c3c !important',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4) !important',
  },
  // GREEN - Success Actions Hover
  '& .btn-icon-small[title="Enable User"]:hover': {
    background: '#27ae60 !important',
    borderColor: '#27ae60 !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3) !important',
  },
  '& .btn-icon-small[title="Mark Sold"]:hover': {
    background: '#27ae60 !important',
    borderColor: '#27ae60 !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3) !important',
  },
  '& .btn-icon-small[title="Mark Customer Payment as Paid"]:hover': {
    background: '#27ae60 !important',
    borderColor: '#27ae60 !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3) !important',
  },
  '& .btn-icon-small[title="Mark Seller Payment as Paid"]:hover': {
    background: '#27ae60 !important',
    borderColor: '#27ae60 !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3) !important',
  },
  '& .btn-icon-small[title="Mark Payment as Paid"]:hover': {
    background: '#27ae60 !important',
    borderColor: '#27ae60 !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3) !important',
  },
  // PURPLE - Primary/Special Actions Hover
  '& .btn-icon-small[title="Download"]:hover': {
    background: '#667eea !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3) !important',
  },
  '& .btn-icon-small[title="Email"]:hover': {
    background: '#667eea !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3) !important',
  },
  '& .btn-icon-small[title="Generate Note"]:hover': {
    background: '#667eea !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3) !important',
  },
  '& .btn-icon-small[title="Save"]:hover': {
    background: '#667eea !important',
    borderColor: '#667eea !important',
    color: 'white !important',
    boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3) !important',
  },
  // Badge styles within table cells
  '& .badge': {
    display: 'inline-block !important',
    padding: '6px 14px !important',
    borderRadius: '20px !important',
    fontSize: '12px !important',
    fontWeight: '600 !important',
    textAlign: 'center !important',
    whiteSpace: 'nowrap !important',
    lineHeight: '1.4 !important',
  },
  '& .badge-success': {
    background: 'rgba(39, 174, 96, 0.15) !important',
    color: '#27ae60 !important',
    border: '1px solid rgba(39, 174, 96, 0.3) !important',
  },
  '& .badge-warning': {
    background: 'rgba(243, 156, 18, 0.15) !important',
    color: '#f39c12 !important',
    border: '1px solid rgba(243, 156, 18, 0.3) !important',
  },
  '& .badge-danger': {
    background: 'rgba(231, 76, 60, 0.15) !important',
    color: '#e74c3c !important',
    border: '1px solid rgba(231, 76, 60, 0.3) !important',
  },
  '& .badge-info': {
    background: 'rgba(52, 152, 219, 0.15) !important',
    color: '#3498db !important',
    border: '1px solid rgba(52, 152, 219, 0.3) !important',
  },
  '& .badge-purple': {
    background: 'rgba(155, 89, 182, 0.15) !important',
    color: '#9b59b6 !important',
    border: '1px solid rgba(155, 89, 182, 0.3) !important',
  },
  '& .badge-secondary': {
    background: 'rgba(108, 117, 125, 0.15) !important',
    color: '#6c757d !important',
    border: '1px solid rgba(108, 117, 125, 0.3) !important',
  },
  // Icon styles
  '& i.fas, & i.far, & i.fal, & i.fab': {
    fontFamily: '"Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 6 Brands" !important',
    fontWeight: '900 !important',
    fontStyle: 'normal !important',
    display: 'inline-block !important',
    textRendering: 'auto !important',
    WebkitFontSmoothing: 'antialiased !important',
    MozOsxFontSmoothing: 'grayscale !important',
    lineHeight: '1 !important',
    fontSize: '20px !important',
  },
  '& i.far': {
    fontWeight: '400 !important',
  },
  '& i.fab': {
    fontFamily: '"Font Awesome 6 Brands" !important',
    fontWeight: '400 !important',
  },
}))

const StyledTableComponent = ({ children, ...props }) => {
  return (
    <StyledTableContainer component={Paper} elevation={0}>
      <StyledTable {...props}>
        {children}
      </StyledTable>
    </StyledTableContainer>
  )
}

export {
  StyledTableComponent as Table,
  StyledTableHead as TableHead,
  StyledTableCell as TableCell,
  StyledTableRow as TableRow,
  TableBody,
}
