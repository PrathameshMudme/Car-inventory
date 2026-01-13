import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Sections.css'
import '../../styles/DataTable.css'

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

    console.log('Filtered users:', filtered.length, 'out of', users.length)
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
      console.log('Loading users from:', `${API_URL}/users`)
      console.log('Using token:', token ? 'Token present' : 'No token')
      
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)

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
      console.log('Users loaded:', data.length, 'users')
      console.log('Users data:', data)
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
      console.log('Updating user:', selectedUser.id, formData)
      
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
      console.log('Update response:', response.status, data)

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
      console.log('Changing password for user:', selectedUser.id)
      
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
      console.log('Password change response:', response.status, data)

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
          <h2>
            <i className="fas fa-users-cog" style={{ fontSize: '24px', color: 'var(--primary-color)' }}></i>
            User Management
          </h2>
          <p>Manage user access and permissions</p>
          {!loading && (
            <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '8px', fontWeight: '500' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '6px', color: 'var(--primary-color)' }}></i>
              Total Users: <strong style={{ color: 'var(--dark-color)' }}>{users.length}</strong> | Showing: <strong style={{ color: 'var(--primary-color)' }}>{filteredUsers.length}</strong>
            </p>
          )}
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
            <option>All</option>
            <option>Active</option>
            <option>Disabled</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={loadUsers}
            title="Refresh Users"
            disabled={loading}
            style={{ 
              minWidth: '44px',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '2px solid #e0e4e8',
              transition: 'all 0.3s ease'
            }}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleAddUser}
            style={{
              borderRadius: '10px',
              padding: '11px 20px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <i className="fas fa-user-plus"></i> Add User
          </button>
        </div>
      </div>

      {!token ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: 'var(--warning-color)', marginBottom: '15px' }}></i>
          <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Authentication required</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Please login to view users</p>
        </div>
      ) : loading && users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: 'var(--primary-color)' }}></i>
          <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>Loading users from database...</p>
        </div>
      ) : (
        <div className={`data-table-container ${loading ? 'loading' : ''}`} style={{ display: 'block' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    textAlign: 'center', 
                    padding: '60px 40px',
                    background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)'
                  }}>
                    <div style={{
                      maxWidth: '500px',
                      margin: '0 auto'
                    }}>
                      <i className="fas fa-users" style={{ 
                        fontSize: '64px', 
                        color: '#cbd5e0', 
                        marginBottom: '20px', 
                        display: 'block',
                        opacity: 0.6
                      }}></i>
                      <h3 style={{ 
                        color: 'var(--dark-color)', 
                        marginBottom: '12px',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {searchTerm || statusFilter !== 'All' 
                          ? 'No users found' 
                          : 'No users in database'}
                      </h3>
                      <p style={{ 
                        color: '#6c757d', 
                        marginBottom: '20px',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        {searchTerm || statusFilter !== 'All' 
                          ? 'Try adjusting your search or filter criteria' 
                          : 'Get started by adding your first user or running the seed script'}
                      </p>
                      {!searchTerm && statusFilter === 'All' && users.length === 0 && (
                        <div style={{ 
                          marginTop: '20px',
                          padding: '15px',
                          background: 'white',
                          borderRadius: '10px',
                          border: '1px solid #e0e4e8'
                        }}>
                          <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '12px', fontWeight: '500' }}>
                            <i className="fas fa-terminal" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                            Run the seed script:
                          </p>
                          <code style={{ 
                            background: '#f8f9fa', 
                            padding: '10px 16px', 
                            borderRadius: '8px',
                            fontSize: '13px',
                            display: 'block',
                            fontFamily: 'monospace',
                            color: 'var(--dark-color)',
                            border: '1px solid #e0e4e8'
                          }}>
                            cd backend && npm run seed
                          </code>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <img src={user.avatar} alt={user.name} />
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.badgeClass}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.contact}</td>
                    <td>
                      <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          className="btn-icon-small"
                          title="Edit User"
                          onClick={() => handleEdit(user)}
                          style={{ fontSize: '14px' }}
                        >
                          <i className="fas fa-edit" style={{ fontSize: '14px' }}></i>
                        </button>
                        <button
                          className="btn-icon-small"
                          title="Change Password"
                          onClick={() => handleChangePassword(user)}
                          style={{ fontSize: '14px' }}
                        >
                          <i className="fas fa-key" style={{ fontSize: '14px' }}></i>
                        </button>
                        <button
                          className="btn-icon-small"
                          title={user.status === 'Active' ? 'Disable User' : 'Enable User'}
                          onClick={() => handleToggleStatus(user)}
                        >
                          <i 
                            className={`fas fa-${user.status === 'Active' ? 'ban' : 'check-circle'}`}
                            style={{ fontSize: '14px' }}
                          ></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
