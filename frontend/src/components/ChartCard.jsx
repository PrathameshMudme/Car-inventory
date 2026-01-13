import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import '../styles/ChartCard.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const ChartCard = ({ title, type, data, options }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: type === 'doughnut' ? true : false,
        position: type === 'doughnut' ? 'bottom' : 'top'
      }
    },
    ...options
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={chartOptions} />
      case 'bar':
        return <Bar data={data} options={chartOptions} />
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />
      default:
        return <Line data={data} options={chartOptions} />
    }
  }

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-container">{renderChart()}</div>
    </div>
  )
}

export default ChartCard
