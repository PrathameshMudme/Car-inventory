import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ToastContainer, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import theme from './theme/theme'
import Login from './pages/Login'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import PurchaseDashboard from './pages/dashboards/PurchaseDashboard'
import SalesDashboard from './pages/dashboards/SalesDashboard'
import DeliveryDashboard from './pages/dashboards/DeliveryDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <ErrorBoundary>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/purchase/*"
                      element={
                        <ProtectedRoute>
                          <PurchaseDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/sales/*"
                      element={
                        <ProtectedRoute>
                          <SalesDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/delivery/*"
                      element={
                        <ProtectedRoute>
                          <DeliveryDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                  </Routes>
                </Router>
              </ErrorBoundary>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={true}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
              />
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
