import React from 'react'
import StatCard from '../StatCard'
import ChartCard from '../ChartCard'
import '../../styles/Sections.css'

const SalesOverview = () => {
  const performanceData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Sales',
      data: [5, 8, 6, 9],
      backgroundColor: '#667eea'
    }]
  }

  return (
    <div>
      <div className="stats-grid">
        <StatCard
          icon="fas fa-handshake"
          iconClass="green"
          title="Sales This Month"
          value="18"
          label="Vehicles sold"
        />
        <StatCard
          icon="fas fa-rupee-sign"
          iconClass="blue"
          title="Revenue Generated"
          value="₹1.2Cr"
          label="This month"
        />
        <StatCard
          icon="fas fa-car"
          iconClass="orange"
          title="Available Stock"
          value="24"
          label="Vehicles"
        />
      </div>

      <div className="chart-card">
        <h3>Sales Performance</h3>
        <ChartCard
          title=""
          type="bar"
          data={performanceData}
        />
      </div>
    </div>
  )
}

export default SalesOverview
