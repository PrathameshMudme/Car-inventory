import React from 'react'
import { useApp } from '../../context/AppContext'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import DeliveryOverview from '../../components/sections/DeliveryOverview'
import PendingDeliveries from '../../components/sections/PendingDeliveries'
import CompletedDeliveries from '../../components/sections/CompletedDeliveries'
import DeliveryNotes from '../../components/sections/DeliveryNotes'
import '../../styles/Dashboard.css'

const DeliveryDashboard = () => {
  const { activeSection, setActiveSection } = useApp()

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { id: 'pending', label: 'Pending Deliveries', icon: 'fas fa-truck' },
    { id: 'completed', label: 'Completed', icon: 'fas fa-check-circle' },
    { id: 'notes', label: 'Delivery Notes', icon: 'fas fa-file-invoice' }
  ]

  const sectionTitles = {
    overview: 'Delivery Overview',
    pending: 'Pending Deliveries',
    completed: 'Completed Deliveries',
    notes: 'Delivery Notes'
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <DeliveryOverview />
      case 'pending':
        return <PendingDeliveries />
      case 'completed':
        return <CompletedDeliveries />
      case 'notes':
        return <DeliveryNotes />
      default:
        return <DeliveryOverview />
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

export default DeliveryDashboard
