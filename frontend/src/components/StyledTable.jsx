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
    fontSize: '12px',
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
    fontSize: '14px',
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
      fontSize: '14px !important',
      fontWeight: 500,
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
    fontSize: '14px !important',
    width: '36px !important',
    height: '36px !important',
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    minWidth: '36px !important',
    minHeight: '36px !important',
  },
  '& .btn-icon-small i': {
    fontSize: '14px !important',
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
