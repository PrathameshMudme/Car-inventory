import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { 
  DataTable, 
  LoadingState,
  StatusBadge,
  EmptyState
} from '../common'
import { ActionButton } from '../forms'
import { Edit as EditIcon, Delete as DeleteIcon, Lock as LockIcon } from '@mui/icons-material'
import '../../styles/Sections.css'
import '../../styles/main.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    contact: '',
    password: ''
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const { showToast } = useToast()
  const { token } = useAuth()

  // Load users from API
  useEffect(() => {
    if (token) {
      loadUsers()
    } else {
      console.warn('No token available. Please login first.')
      setLoading(false)
    }
  }, [token])

  // Filter users based on search and status
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  const loadUsers = async () => {
    if (!token) {
      console.error('No authentication token available')
      showToast('Please login to view users', 'error')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('API Error:', errorData)
        
        if (response.status === 401) {
          showToast('Session expired. Please login again.', 'error')
          return
        }
        if (response.status === 403) {
          showToast('Access denied. Admin access required.', 'error')
          return
        }
        throw new Error(errorData.message || 'Failed to load users')
      }

      const data = await response.json()
      setUsers(data)
      
      if (data.length === 0) {
        showToast('No users found in database. Run seed script to create users.', 'info')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showToast(error.message || 'Failed to load users. Check console for details.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      contact: '',
      password: ''
    })
    setShowUserModal(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact,
      password: ''
    })
    setShowEditModal(true)
  }

  const handleChangePassword = (user) => {
    setSelectedUser(user)
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    })
    setShowPasswordModal(true)
  }

  const handleToggleStatus = async (user) => {
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update status')
      }

      const data = await response.json()
      showToast(data.message, 'success')
      loadUsers() // Reload users
    } catch (error) {
      console.error('Error toggling status:', error)
      showToast(error.message || 'Failed to update user status', 'error')
    }
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters!', 'error')
      return
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user')
      }

      showToast('User added successfully!', 'success')
      setShowUserModal(false)
      setFormData({
        name: '',
        email: '',
        role: '',
        contact: '',
        password: ''
      })
      loadUsers() // Reload users
    } catch (error) {
      console.error('Error adding user:', error)
      showToast(error.message || 'Failed to add user', 'error')
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()

    if (!selectedUser || !selectedUser.id) {
      showToast('Invalid user selected', 'error')
      return
    }

    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          contact: formData.contact
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user')
      }

      showToast('User updated successfully!', 'success')
      setShowEditModal(false)
      setSelectedUser(null)
      loadUsers() // Reload users
    } catch (error) {
      console.error('Error updating user:', error)
      showToast(error.message || 'Failed to update user', 'error')
    }
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    
    if (!selectedUser || !selectedUser.id) {
      showToast('Invalid user selected', 'error')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters!', 'error')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match!', 'error')
      return
    }

    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      showToast('Password changed successfully!', 'success')
      setShowPasswordModal(false)
      setSelectedUser(null)
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      showToast(error.message || 'Failed to change password', 'error')
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2> User Management</h2>
          <p>
            {!loading ? (
              <>
                Manage user access and permissions | Total: <strong>{users.length}</strong> | Showing: <strong>{filteredUsers.length}</strong>
              </>
            ) : (
              'Manage user access and permissions'
            )}
          </p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
          </select>
          <button className="btn btn-primary" onClick={handleAddUser}>
            <i className="fas fa-user-plus"></i> Add User
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={loadUsers}
            disabled={loading}
            title="Refresh Users"
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      {!token ? (
        <EmptyState
          icon={<i className="fas fa-exclamation-triangle" style={{ fontSize: 64, color: '#f39c12' }} />}
          title="Authentication required"
          message="Please login to view users"
        />
      ) : loading && users.length === 0 ? (
        <LoadingState message="Loading users from database..." />
      ) : (
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (user) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
                  <strong>{user.name}</strong>
                </div>
              )
            },
            { key: 'email', label: 'Email' },
            {
              key: 'role',
              label: 'Role',
              render: (user) => (
                <span className={`badge ${user.badgeClass}`}>
                  {user.role}
                </span>
              )
            },
            { key: 'contact', label: 'Contact' },
            {
              key: 'status',
              label: 'Status',
              render: (user) => <StatusBadge status={user.status} />
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'center',
              render: (user) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                  <ActionButton
                    icon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(user)
                    }}
                    title="Edit User"
                    color="primary"
                  />
                  <ActionButton
                    icon={<LockIcon />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleChangePassword(user)
                    }}
                    title="Change Password"
                    color="warning"
                  />
                  <ActionButton
                    icon={
                      <i 
                        className={`fas fa-${user.status === 'Active' ? 'ban' : 'check-circle'}`}
                        style={{ fontSize: '14px' }}
                      />
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleStatus(user)
                    }}
                    title={user.status === 'Active' ? 'Disable User' : 'Enable User'}
                    color={user.status === 'Active' ? 'danger' : 'success'}
                  />
                </div>
              )
            }
          ]}
          data={filteredUsers}
          loading={loading}
          emptyMessage={
            searchTerm || statusFilter !== 'All' 
              ? 'No users found matching your criteria' 
              : 'No users in database'
          }
        />
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Add New User"
      >
        <form onSubmit={handleSubmitAdd}>
          <div className="form-group">
            <label>
              <i className="fas fa-user"></i> Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <i className="fas fa-envelope"></i> Email <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="user@vehicle.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <i className="fas fa-briefcase"></i> Role <span className="required">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Role</option>
              <option>Admin</option>
              <option>Purchase Manager</option>
              <option>Sales Manager</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              <i className="fas fa-phone"></i> Contact Number
            </label>
            <input
              type="tel"
              name="contact"
              placeholder="+91 98765 43210"
              value={formData.contact}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Password must be at least 6 characters long
            </small>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-user-plus"></i> Create User
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowUserModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        title="Edit User Details"
      >
        {selectedUser && (
          <form onSubmit={handleSubmitEdit}>
            <div className="form-group">
              <label>
                <i className="fas fa-user"></i> Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-envelope"></i> Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="user@vehicle.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-briefcase"></i> Role <span className="required">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Role</option>
                <option>Admin</option>
                <option>Purchase Manager</option>
                <option>Sales Manager</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-phone"></i> Contact Number
              </label>
              <input
                type="tel"
                name="contact"
                placeholder="+91 98765 43210"
                value={formData.contact}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i> Update User
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setSelectedUser(null)
        }}
        title="Change Password"
      >
        {selectedUser && (
          <form onSubmit={handleSubmitPassword}>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <strong>Changing password for:</strong>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>{selectedUser.name} ({selectedUser.email})</p>
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-lock"></i> New Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-lock"></i> Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px', display: 'block' }}>
              Password must be at least 6 characters long
            </small>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-key"></i> Change Password
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false)
                  setSelectedUser(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default AdminUsers
