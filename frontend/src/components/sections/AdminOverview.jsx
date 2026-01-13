import React from 'react'
import StatCard from '../StatCard'
import ChartCard from '../ChartCard'
import '../../styles/Sections.css'

const AdminOverview = () => {
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales',
      data: [12, 19, 15, 25, 22, 28],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const statusData = {
    labels: ['In Stock', 'Sold', 'Reserved', 'Processing'],
    datasets: [{
      data: [24, 28, 8, 6],
      backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#e74c3c']
    }]
  }

  return (
    <div>
      <div className="stats-grid">
        <StatCard
          icon="fas fa-car"
          iconClass="blue"
          title="Total Vehicles"
          value="42"
          label="vs last month"
          trend={{ direction: 'up', value: '12%' }}
        />
        <StatCard
          icon="fas fa-rupee-sign"
          iconClass="green"
          title="Total Revenue"
          value="₹1.2Cr"
          label="this month"
          trend={{ direction: 'up', value: '8%' }}
        />
        <StatCard
          icon="fas fa-chart-line"
          iconClass="purple"
          title="Net Profit"
          value="₹18.5L"
          label="vs last month"
          trend={{ direction: 'up', value: '15%' }}
        />
        <StatCard
          icon="fas fa-handshake"
          iconClass="orange"
          title="Sales Count"
          value="28"
          label="this month"
          trend={{ direction: 'up', value: '5' }}
        />
      </div>

      <div className="overview-content-grid">
        <div className="chart-grid">
          <ChartCard
            title="Monthly Sales Trend"
            type="line"
            data={salesData}
          />
          <ChartCard
            title="Vehicle Status Distribution"
            type="doughnut"
            data={statusData}
          />
        </div>

        <div className="recent-activity">
          <h3><i className="fas fa-history"></i> Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon blue">
                <i className="fas fa-car"></i>
              </div>
              <div className="activity-details">
                <strong>New Vehicle Added</strong>
                <p>Honda City 2022 - MH12AB1234</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon green">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="activity-details">
                <strong>Vehicle Sold</strong>
                <p>Maruti Swift 2021 - MH14CD5678</p>
                <span className="activity-time">5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon orange">
                <i className="fas fa-truck"></i>
              </div>
              <div className="activity-details">
                <strong>Delivery Completed</strong>
                <p>Toyota Innova 2020 - MH10XY9876</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon purple">
                <i className="fas fa-file-invoice"></i>
              </div>
              <div className="activity-details">
                <strong>Invoice Generated</strong>
                <p>Invoice #INV-2024-001</p>
                <span className="activity-time">2 days ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon blue">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="activity-details">
                <strong>New Customer Added</strong>
                <p>John Doe - Customer ID: CUST-123</p>
                <span className="activity-time">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
