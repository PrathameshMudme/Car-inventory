import { createTheme } from '@mui/material/styles'

// Gradient utility - matches original design
const primaryGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
const primaryGradientHover = 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'

// Original color scheme from the project
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa4f3',
      dark: '#5568d3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9570b8',
      dark: '#6a3f8f',
      contrastText: '#ffffff',
    },
    success: {
      main: '#27ae60',
      light: '#52c085',
      dark: '#229954',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e74c3c',
      light: '#ec7063',
      dark: '#c0392b',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f39c12',
      light: '#f5b041',
      dark: '#e67e22',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3498db',
      light: '#5dade2',
      dark: '#2980b9',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    divider: '#dce1e5',
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    h1: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#2c3e50',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#2c3e50',
    },
    h3: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h4: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#2c3e50',
    },
    body1: {
      fontSize: '14px',
      color: '#333',
    },
    body2: {
      fontSize: '13px',
      color: '#7f8c8d',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '15px',
        },
        containedPrimary: {
          background: primaryGradient,
          '&:hover': {
            background: primaryGradientHover,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: '#e0e4e8',
          '&:hover': {
            borderWidth: '2px',
            borderColor: '#667eea',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '14px',
            '& input': {
              fontSize: '14px',
              padding: '14px 16px',
              minWidth: 0,
              width: '100%',
              overflow: 'visible',
            },
            '& fieldset': {
              borderColor: '#e9ecef',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#667eea',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#667eea',
              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.15)',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '14px',
            fontWeight: 500,
            color: '#495057',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#667eea',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          fontSize: '14px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e9ecef',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#667eea',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#667eea',
            boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '15px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '15px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '12px',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '14px',
            '& input': {
              fontSize: '14px',
              padding: '14px 16px',
              minWidth: 0,
              width: '100%',
              overflow: 'visible',
            },
            '& fieldset': {
              borderColor: '#e9ecef',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#667eea',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#667eea',
              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.15)',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '14px',
            fontWeight: 500,
            color: '#495057',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#667eea',
          },
        },
        option: {
          fontSize: '14px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: primaryGradient,
        },
      },
    },
    MuiPaper: {
      variants: [
        {
          props: { variant: 'gradient' },
          style: {
            background: primaryGradient,
            color: 'white',
          },
        },
      ],
    },
  },
})

// Export gradient for use in components
theme.primaryGradient = primaryGradient
theme.primaryGradientHover = primaryGradientHover

export default theme
