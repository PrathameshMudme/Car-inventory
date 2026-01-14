import React, { useState } from 'react'
import StatCard from '../StatCard'
import { useToast } from '../../context/ToastContext'
import { Table, TableHead, TableCell, TableRow, TableBody } from '../StyledTable'
import '../../styles/Sections.css'

const AdminExpenses = () => {
  const [timeFilter, setTimeFilter] = useState('This Month')
  const { showToast } = useToast()

  const expenses = [
    {
      id: 1,
      date: '15 Nov 2024',
      vehicle: 'MH12AB1234',
      expenseType: 'Commission',
      description: 'Agent Commission - Purchase',
      amount: '₹25,000',
      paymentMode: 'Bank Transfer',
      badgeClass: 'badge-purple'
    },
    {
      id: 2,
      date: '14 Nov 2024',
      vehicle: 'MH14CD5678',
      expenseType: 'Modification',
      description: 'Paint Job & Dent Repair',
      amount: '₹45,000',
      paymentMode: 'Cash',
      badgeClass: 'badge-blue'
    },
    {
      id: 3,
      date: '12 Nov 2024',
      vehicle: 'MH10XY9876',
      expenseType: 'Other',
      description: 'RTO Transfer Charges',
      amount: '₹8,500',
      paymentMode: 'Online',
      badgeClass: 'badge-orange'
    }
  ]

  const handleExport = () => {
    showToast('Exporting expenses data...', 'info')
    setTimeout(() => {
      showToast('Data exported successfully!', 'success')
    }, 1500)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Expenses & Commission Report</h2>
          <p>Track all expenses and commissions</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
          <button className="btn btn-secondary" onClick={handleExport}>
            <i className="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="fas fa-money-bill-wave"
          iconClass="red"
          title="Total Expenses"
          value="₹12.4L"
          label="This month"
        />
        <StatCard
          icon="fas fa-handshake"
          iconClass="purple"
          title="Agent Commission"
          value="₹3.2L"
          label="This month"
        />
        <StatCard
          icon="fas fa-tools"
          iconClass="blue"
          title="Modifications"
          value="₹6.8L"
          label="This month"
        />
        <StatCard
          icon="fas fa-file-invoice"
          iconClass="orange"
          title="Other Expenses"
          value="₹2.4L"
          label="This month"
        />
      </div>

      <Table sx={{ minWidth: 700 }} aria-label="expenses table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Expense Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment Mode</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.date}</TableCell>
              <TableCell>{expense.vehicle}</TableCell>
              <TableCell>
                <span className={`badge ${expense.badgeClass}`}>
                  {expense.expenseType}
                </span>
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{expense.amount}</TableCell>
              <TableCell>{expense.paymentMode}</TableCell>
              <TableCell align="center">
                <button className="btn-icon-small" title="View Receipt">
                  <i className="fas fa-file-pdf"></i>
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminExpenses
