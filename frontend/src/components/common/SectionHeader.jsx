import React from 'react'

/**
 * Standardized section header with title, description, and optional actions
 * Matches the CSS class pattern used in Expenses & Commission and other sections
 */
const SectionHeader = ({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  actionIcon,
  children 
}) => {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && (
          <p>{description}</p>
        )}
      </div>
      <div className="header-actions">
        {children}
        {actionLabel && onAction && (
          <button className="btn btn-primary" onClick={onAction}>
            {actionIcon && <>{actionIcon} </>}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default SectionHeader
