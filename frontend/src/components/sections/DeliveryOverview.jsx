import React from 'react'
import StatCard from '../StatCard'
import '../../styles/Sections.css'

const DeliveryOverview = () => {
  return (
    <div>
      <div className="stats-grid">
        <StatCard
          icon="fas fa-truck-loading"
          iconClass="orange"
          title="Pending Deliveries"
          value="6"
          label="Vehicles"
        />
        <StatCard
          icon="fas fa-check-circle"
          iconClass="green"
          title="Completed This Month"
          value="22"
          label="Deliveries"
        />
        <StatCard
          icon="fas fa-calendar-day"
          iconClass="blue"
          title="Scheduled Today"
          value="3"
          label="Deliveries"
        />
      </div>

      <div className="upcoming-deliveries">
        <h3><i className="fas fa-calendar-alt"></i> Upcoming Deliveries</h3>
        <div className="delivery-timeline">
          <div className="timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <strong>Honda City 2022</strong>
              <p>Customer: Rahul Desai</p>
              <span className="timeline-date">Today, 2:00 PM</span>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <strong>Maruti Swift 2021</strong>
              <p>Customer: Priya Joshi</p>
              <span className="timeline-date">Tomorrow, 10:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryOverview
