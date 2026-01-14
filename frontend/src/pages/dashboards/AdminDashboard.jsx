import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import AdminOverview from '../../components/sections/AdminOverview'
import AdminInventory from '../../components/sections/AdminInventory'
import AdminUsers from '../../components/sections/AdminUsers'
import AdminExpenses from '../../components/sections/AdminExpenses'
import AdminProfit from '../../components/sections/AdminProfit'
import AdminDealers from '../../components/sections/AdminDealers'
import AdminReports from '../../components/sections/AdminReports'
import AdminHistory from '../../components/sections/AdminHistory'
import SalesCustomers from '../../components/sections/SalesCustomers'
import '../../styles/Dashboard.css'

const AdminDashboard = () => {
  const { activeSection, setActiveSection } = useApp()
  const { user } = useAuth()

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-warehouse' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users-cog' },
    { id: 'expenses', label: 'Expenses & Commission', icon: 'fas fa-file-invoice-dollar' },
    { id: 'profit', label: 'Profit & Loss', icon: 'fas fa-chart-pie' },
    { id: 'dealers', label: 'Dealers', icon: 'fas fa-handshake' },
    { id: 'customers', label: 'Customers', icon: 'fas fa-users' },
    { id: 'history', label: 'History', icon: 'fas fa-history' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-file-alt' }
  ]

  const sectionTitles = {
    overview: 'Dashboard Overview',
    inventory: 'Vehicle Inventory',
    users: 'User Management',
    expenses: 'Expenses & Commission',
    profit: 'Profit & Loss',
    dealers: 'Dealers',
    customers: 'Customers',
    history: 'History',
    reports: 'Reports'
  }

  const quickStats = [
    { icon: 'fas fa-car', value: '42' },
    { icon: 'fas fa-rupee-sign', value: '₹1.2Cr' }
  ]

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />
      case 'inventory':
        return <AdminInventory />
      case 'users':
        return <AdminUsers />
      case 'expenses':
        return <AdminExpenses />
      case 'profit':
        return <AdminProfit />
      case 'dealers':
        return <AdminDealers />
      case 'customers':
        return <SalesCustomers />
      case 'history':
        return <AdminHistory />
      case 'reports':
        return <AdminReports />
      default:
        return <AdminOverview />
    }
  }

  return (
    <div className="dashboard active">
      <Sidebar
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="main-content">
        {activeSection !== 'users' && (
          <Topbar
            title={sectionTitles[activeSection] || 'Dashboard'}
            quickStats={quickStats}
          />
        )}
        <div className="content-section active">{renderSection()}</div>
      </div>
    </div>
  )
}

export default AdminDashboard
