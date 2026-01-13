import React from 'react'
import { useToast } from '../../context/ToastContext'
import '../../styles/Sections.css'

const AdminReports = () => {
  const { showToast } = useToast()

  const reports = [
    {
      id: 1,
      name: 'Sales Report',
      description: 'Monthly sales performance and trends',
      icon: 'fas fa-chart-bar',
      iconClass: 'blue'
    },
    {
      id: 2,
      name: 'Purchase Report',
      description: 'Vehicle purchase history and costs',
      icon: 'fas fa-shopping-cart',
      iconClass: 'green'
    },
    {
      id: 3,
      name: 'Financial Report',
      description: 'Comprehensive financial statements',
      icon: 'fas fa-money-bill-wave',
      iconClass: 'purple'
    },
    {
      id: 4,
      name: 'Inventory Report',
      description: 'Current stock and valuation',
      icon: 'fas fa-warehouse',
      iconClass: 'orange'
    }
  ]

  const handleGenerate = (reportName) => {
    showToast(`Generating ${reportName}...`, 'info')
    setTimeout(() => {
      showToast(`${reportName} generated successfully!`, 'success')
    }, 2000)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Generate comprehensive business reports</p>
        </div>
      </div>

      <div className="reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className={`report-icon ${report.iconClass}`}>
              <i className={report.icon}></i>
            </div>
            <h3>{report.name}</h3>
            <p>{report.description}</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleGenerate(report.name)}
            >
              Generate
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminReports
