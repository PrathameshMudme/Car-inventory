import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import AdminOverview from '../../components/sections/AdminOverview'
import AdminInventory from '../../components/sections/AdminInventory'
import AdminUsers from '../../components/sections/AdminUsers'
import AdminExpenses from '../../components/sections/AdminExpenses'
import AdminProfit from '../../components/sections/AdminProfit'
import AdminAgents from '../../components/sections/AdminAgents'
import AdminReports from '../../components/sections/AdminReports'
import AdminHistory from '../../components/sections/AdminHistory'
import AdminPendingPayments from '../../components/sections/AdminPendingPayments'
import AdminActionRequired from '../../components/sections/AdminActionRequired'
import SalesCustomers from '../../components/sections/SalesCustomers'
import '../../styles/Dashboard.css'

const AdminDashboard = () => {
  const { activeSection, setActiveSection } = useApp()
  const { user } = useAuth()

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { id: 'actionRequired', label: 'Action Required', icon: 'fas fa-exclamation-triangle' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-warehouse' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users-cog' },
    { id: 'expenses', label: 'Expenses & Commission', icon: 'fas fa-file-invoice-dollar' },
    { id: 'profit', label: 'Profit & Loss', icon: 'fas fa-chart-pie' },
    { id: 'agents', label: 'Agents', icon: 'fas fa-handshake' },
    { id: 'customers', label: 'Customers', icon: 'fas fa-users' },
    { id: 'pendingPayments', label: 'Pending Payments', icon: 'fas fa-money-bill-wave' },
    { id: 'history', label: 'History', icon: 'fas fa-history' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-file-alt' }
  ]

  const sectionTitles = {
    overview: 'Dashboard Overview',
    actionRequired: 'Action Required - Vehicles Pending Modification',
    inventory: 'Vehicle Inventory',
    users: 'User Management',
    expenses: 'Expenses & Commission',
    profit: 'Profit & Loss',
    agents: 'Agents',
    customers: 'Customers',
    pendingPayments: 'Pending Payments',
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
      case 'actionRequired':
        return <AdminActionRequired />
      case 'inventory':
        return <AdminInventory />
      case 'users':
        return <AdminUsers />
      case 'expenses':
        return <AdminExpenses />
      case 'profit':
        return <AdminProfit />
      case 'agents':
        return <AdminAgents />
      case 'customers':
        return <SalesCustomers />
      case 'pendingPayments':
        return <AdminPendingPayments />
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
        <div className="content-section active">{renderSection()}</div>
      </div>
    </div>
  )
}

export default AdminDashboard
