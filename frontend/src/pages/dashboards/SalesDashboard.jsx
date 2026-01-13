import React from 'react'
import { useApp } from '../../context/AppContext'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import SalesOverview from '../../components/sections/SalesOverview'
import SalesInventory from '../../components/sections/SalesInventory'
import SalesRecords from '../../components/sections/SalesRecords'
import SalesCustomers from '../../components/sections/SalesCustomers'
import '../../styles/Dashboard.css'

const SalesDashboard = () => {
  const { activeSection, setActiveSection } = useApp()

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-warehouse' },
    { id: 'records', label: 'Sales Records', icon: 'fas fa-handshake' },
    { id: 'customers', label: 'Customers', icon: 'fas fa-users' }
  ]

  const sectionTitles = {
    overview: 'Sales Overview',
    inventory: 'Sales Inventory',
    records: 'Sales Records',
    customers: 'Customers'
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <SalesOverview />
      case 'inventory':
        return <SalesInventory />
      case 'records':
        return <SalesRecords />
      case 'customers':
        return <SalesCustomers />
      default:
        return <SalesOverview />
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
        <Topbar title={sectionTitles[activeSection] || 'Dashboard'} />
        <div className="content-section active">{renderSection()}</div>
      </div>
    </div>
  )
}

export default SalesDashboard
