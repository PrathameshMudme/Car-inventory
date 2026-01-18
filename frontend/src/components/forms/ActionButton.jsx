import React from 'react'
import { Button, IconButton } from '@mui/material'

/**
 * Standardized action button with consistent styling
 */
const ActionButton = ({
  icon,
  onClick,
  title,
  variant = 'icon',
  color = 'primary',
  size = 'small',
  disabled = false,
  ...props
}) => {
  const colorMap = {
    primary: '#667eea',
    view: '#3498db',
    warning: '#f39c12',
    danger: '#e74c3c',
    success: '#27ae60'
  }

  const buttonColor = colorMap[color] || colorMap.primary

  if (variant === 'icon') {
    return (
      <IconButton
        size={size}
        onClick={onClick}
        disabled={disabled}
        title={title}
        sx={{
          color: buttonColor,
          border: `1px solid ${buttonColor}33`,
          background: `${buttonColor}14`,
          '&:hover': {
            background: `${buttonColor}22`,
            transform: 'translateY(-1px)'
          },
          ...props.sx
        }}
        {...props}
      >
        {icon}
      </IconButton>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      startIcon={icon}
      sx={{
        ...(variant === 'outlined' && {
          borderColor: buttonColor,
          color: buttonColor,
          '&:hover': {
            borderColor: buttonColor,
            background: `${buttonColor}14`
          }
        }),
        ...(variant === 'contained' && {
          background: buttonColor,
          '&:hover': {
            background: buttonColor,
            opacity: 0.9
          }
        }),
        ...props.sx
      }}
      {...props}
    >
      {title}
    </Button>
  )
}

export default ActionButton
