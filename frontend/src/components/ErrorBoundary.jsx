import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Optionally reload the page
    // window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '64px',
            color: '#e74c3c',
            marginBottom: '20px'
          }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 style={{
            color: '#2c3e50',
            marginBottom: '10px',
            fontSize: '24px'
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: '#6c757d',
            marginBottom: '30px',
            fontSize: '16px',
            maxWidth: '500px'
          }}>
            We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%',
              marginBottom: '20px'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '10px'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                color: '#e74c3c',
                fontSize: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: 'var(--primary-color, #667eea)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#5568d3'}
              onMouseOut={(e) => e.target.style.background = 'var(--primary-color, #667eea)'}
            >
              <i className="fas fa-redo" style={{ marginRight: '8px' }}></i>
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a6268'}
              onMouseOut={(e) => e.target.style.background = '#6c757d'}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i>
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
