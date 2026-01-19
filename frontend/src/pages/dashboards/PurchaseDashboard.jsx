import React from 'react'
import { useApp } from '../../context/AppContext'
import Sidebar from '../../components/Sidebar'
import PurchaseOverview from '../../components/sections/PurchaseOverview'
import AddVehicle from '../../components/sections/AddVehicle'
import PurchaseInventory from '../../components/sections/PurchaseInventory'
import PurchaseNotes from '../../components/sections/PurchaseNotes'
import UploadDocuments from '../../components/sections/UploadDocuments'
import '../../styles/Dashboard.css'

const PurchaseDashboard = () => {
  const { activeSection, setActiveSection } = useApp()

  // Menu items - Purchase Notes available to all purchase managers and admin
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { id: 'add', label: 'Add Vehicle', icon: 'fas fa-plus-circle' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-warehouse' },
    { id: 'uploadDocuments', label: 'Upload Documents', icon: 'fas fa-file-upload' },
    { id: 'notes', label: 'Purchase Notes', icon: 'fas fa-file-invoice' }
  ]

  const sectionTitles = {
    overview: 'Purchase Overview',
    add: 'Add Vehicle',
    inventory: 'Purchase Inventory',
    uploadDocuments: 'Upload Documents',
    notes: 'Purchase Notes'
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <PurchaseOverview />
      case 'add':
        return <AddVehicle />
      case 'inventory':
        return <PurchaseInventory />
      case 'uploadDocuments':
        return <UploadDocuments />
      case 'notes':
        return <PurchaseNotes />
      default:
        return <PurchaseOverview />
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

export default PurchaseDashboard
