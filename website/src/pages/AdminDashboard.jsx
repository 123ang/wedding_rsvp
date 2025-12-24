import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllRSVPs, updatePaymentAmount, updateSeatTable, updateRelationship, updateRemark, getRelationships, checkAdminAuth, adminLogout, getAllUsers, updateUserRole, createUser, deleteUser } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [rsvps, setRsvps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState('bride'); // 'bride' or 'groom'
  const [searchTerm, setSearchTerm] = useState('');
  const [attendingFilter, setAttendingFilter] = useState('all'); // 'all', 'attending', 'not-attending'
  const [selectedRelationships, setSelectedRelationships] = useState([]); // Array of selected relationship strings
  const [showRelationshipFilter, setShowRelationshipFilter] = useState(false); // Show/hide relationship filter dropdown
  const [editingPayment, setEditingPayment] = useState({ id: null, type: null, value: '' });
  const [editingSeat, setEditingSeat] = useState({ id: null, type: null, value: '' });
  const [editingRelationship, setEditingRelationship] = useState({ id: null, type: null, value: '' });
  const [editingRemark, setEditingRemark] = useState({ id: null, type: null, value: '' });
  const [availableRelationships, setAvailableRelationships] = useState([]);
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState({ id: null, show: false });
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingUserRole, setEditingUserRole] = useState({ id: null, role: '' });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'photographer' });
  const [creatingUser, setCreatingUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Disable sakura petals on admin dashboard
    document.body.classList.add('no-petals');

    checkAuth();
    fetchRSVPs();
    fetchRelationships();
    if (checkAdminAuth().role === 'admin') {
      fetchUsers();
    }

    return () => {
      document.body.classList.remove('no-petals');
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRelationshipDropdown.show && !event.target.closest('.payment-edit-cell')) {
        setShowRelationshipDropdown({ id: null, show: false });
      }
      // Close relationship filter dropdown when clicking outside
      if (showRelationshipFilter && !event.target.closest('.relationship-filter-container')) {
        setShowRelationshipFilter(false);
      }
    };

    if (showRelationshipDropdown.show || showRelationshipFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showRelationshipDropdown.show, showRelationshipFilter]);

  const fetchRelationships = async () => {
    try {
      const relationships = await getRelationships();
      setAvailableRelationships(relationships);
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleUserRoleUpdate = async () => {
    const { id, role } = editingUserRole;
    try {
      await updateUserRole(id, role);
      await fetchUsers();
      setEditingUserRole({ id: null, role: '' });
      alert('User role updated successfully');
    } catch (err) {
      console.error('Update user role error:', err);
      alert(err.message || 'An error occurred while updating user role');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingUser(true);
    try {
      await createUser(newUser.email, newUser.password, newUser.role);
      await fetchUsers();
      setNewUser({ email: '', password: '', role: 'photographer' });
      setShowCreateUser(false);
      alert('User created successfully');
    } catch (err) {
      console.error('Create user error:', err);
      alert(err.message || 'An error occurred while creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(id);
      await fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      console.error('Delete user error:', err);
      alert(err.message || 'An error occurred while deleting user');
    }
  };

  const checkAuth = () => {
    const authResult = checkAdminAuth();
    if (!authResult.success) {
      navigate('/admin/login');
    } else {
      setAdminEmail(authResult.email);
    }
  };

  const fetchRSVPs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const data = await getAllRSVPs();
      
      if (data.success) {
        setRsvps(data.rsvps);
        setSummary(data.summary);
        setError('');
      } else {
        setError('Failed to load RSVPs');
      }
    } catch (err) {
      console.error('Fetch RSVPs error:', err);
      if (err.message === 'Unauthorized access.') {
        navigate('/admin/login');
      } else {
        setError('An error occurred while loading RSVPs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRSVPs(true);
  };

  const handleExportToExcel = () => {
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const headers = ['Name', 'Email', 'Phone', 'Wedding Type', 'Attending', 'Number of Guests', 'Table', 'Payment Amount', 'Relationship', 'Remark', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...filteredRsvps.map(rsvp => [
        escapeCSV(rsvp.name),
        escapeCSV(rsvp.email || ''),
        escapeCSV(rsvp.phone || '-'),
        escapeCSV(rsvp.type),
        rsvp.attending ? 'Yes' : 'No',
        rsvp.number_of_guests,
        escapeCSV(rsvp.seat_table || ''),
        rsvp.payment_amount.toFixed(2),
        escapeCSV(rsvp.relationship || ''),
        escapeCSV(rsvp.remark || ''),
        new Date(rsvp.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      ].join(','))
    ];
    
    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM for Excel

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Create filename with filter information
    let filename = `rsvp-list-${activeTab}`;
    if (selectedRelationships.length > 0) {
      filename += `-relationships(${selectedRelationships.length})`;
    }
    if (attendingFilter !== 'all') {
      filename += `-${attendingFilter}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const handlePaymentEdit = (id, type, currentPayment) => {
    setEditingPayment({ id, type, value: currentPayment.toString() });
  };

  const handlePaymentChange = (e) => {
    setEditingPayment({ ...editingPayment, value: e.target.value });
  };

  const handlePaymentUpdate = async () => {
    const { id, type, value } = editingPayment;
    
    if (value === null || value === '') {
      setEditingPayment({ id: null, type: null, value: '' });
      return;
    }
    
    const paymentAmount = parseFloat(value);
    
    if (isNaN(paymentAmount) || paymentAmount < 0) {
      alert('Please enter a valid number');
      return;
    }

    try {
      await updatePaymentAmount(id, paymentAmount);
      fetchRSVPs();
      setEditingPayment({ id: null, type: null, value: '' });
    } catch (err) {
      console.error('Update payment error:', err);
      alert('An error occurred while updating payment');
    }
  };

  const handlePaymentCancel = () => {
    setEditingPayment({ id: null, type: null, value: '' });
  };

  const handleSeatEdit = (id, type, currentSeat) => {
    setEditingSeat({ id, type, value: (currentSeat || '').toString() });
  };

  const handleSeatChange = (e) => {
    setEditingSeat({ ...editingSeat, value: e.target.value });
  };

  const handleSeatUpdate = async () => {
    const { id, value } = editingSeat;
    try {
      await updateSeatTable(id, value.trim() || null);
      fetchRSVPs();
      setEditingSeat({ id: null, type: null, value: '' });
    } catch (err) {
      console.error('Update seat table error:', err);
      alert('An error occurred while updating seat table');
    }
  };

  const handleSeatCancel = () => {
    setEditingSeat({ id: null, type: null, value: '' });
  };

  // Relationship handlers
  const handleRelationshipEdit = (id, type, currentRelationship) => {
    setEditingRelationship({ id, type, value: (currentRelationship || '').toString() });
    setShowRelationshipDropdown({ id, show: false });
  };

  const handleRelationshipChange = (e) => {
    setEditingRelationship({ ...editingRelationship, value: e.target.value });
    setShowRelationshipDropdown({ id: editingRelationship.id, show: true });
  };

  const handleRelationshipSelect = (relationship) => {
    setEditingRelationship({ ...editingRelationship, value: relationship });
    setShowRelationshipDropdown({ id: null, show: false });
  };

  const handleRelationshipUpdate = async () => {
    const { id, value } = editingRelationship;
    try {
      await updateRelationship(id, value.trim() || null);
      await fetchRSVPs();
      await fetchRelationships(); // Refresh relationships list
      setEditingRelationship({ id: null, type: null, value: '' });
      setShowRelationshipDropdown({ id: null, show: false });
    } catch (err) {
      console.error('Update relationship error:', err);
      alert('An error occurred while updating relationship');
    }
  };

  const handleRelationshipCancel = () => {
    setEditingRelationship({ id: null, type: null, value: '' });
    setShowRelationshipDropdown({ id: null, show: false });
  };

  // Remark handlers
  const handleRemarkEdit = (id, type, currentRemark) => {
    setEditingRemark({ id, type, value: (currentRemark || '').toString() });
  };

  const handleRemarkChange = (e) => {
    setEditingRemark({ ...editingRemark, value: e.target.value });
  };

  const handleRemarkUpdate = async () => {
    const { id, value } = editingRemark;
    try {
      await updateRemark(id, value.trim() || null);
      await fetchRSVPs();
      setEditingRemark({ id: null, type: null, value: '' });
    } catch (err) {
      console.error('Update remark error:', err);
      alert('An error occurred while updating remark');
    }
  };

  const handleRemarkCancel = () => {
    setEditingRemark({ id: null, type: null, value: '' });
  };

  // Relationship filter handlers
  const handleRelationshipFilterToggle = (relationship) => {
    setSelectedRelationships(prev => {
      if (prev.includes(relationship)) {
        // Remove from selection
        return prev.filter(r => r !== relationship);
      } else {
        // Add to selection
        return [...prev, relationship];
      }
    });
  };

  const handleClearRelationshipFilter = () => {
    setSelectedRelationships([]);
  };

  const handleSelectAllRelationships = () => {
    setSelectedRelationships([...availableRelationships]);
  };

  // Filter and search logic
  const filteredRsvps = rsvps.filter(rsvp => {
    // Filter by tab (bride or groom)
    if (rsvp.type !== activeTab) return false;
    
    // Filter by attending status
    if (attendingFilter === 'attending' && !rsvp.attending) return false;
    if (attendingFilter === 'not-attending' && rsvp.attending) return false;
    
    // Filter by relationship (if any relationships are selected)
    if (selectedRelationships.length > 0) {
      const rsvpRelationship = (rsvp.relationship || '').trim();
      // Only show RSVPs whose relationship is in the selected list
      // RSVPs without relationships are excluded when filtering
      if (!selectedRelationships.includes(rsvpRelationship)) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm &&
        !rsvp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rsvp.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(rsvp.seat_table || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(rsvp.relationship || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(rsvp.remark || '').toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Calculate summary for active tab
  const tabSummary = {
    total: rsvps.filter(r => r.type === activeTab).length,
    attending: rsvps.filter(r => r.type === activeTab && r.attending).length,
    notAttending: rsvps.filter(r => r.type === activeTab && !r.attending).length,
    totalGuests: rsvps.filter(r => r.type === activeTab && r.attending)
      .reduce((sum, r) => sum + r.number_of_guests, 0),
    totalPayment: rsvps.filter(r => r.type === activeTab)
      .reduce((sum, r) => sum + r.payment_amount, 0)
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1>RSVP List</h1>
          <p className="admin-email">Logged in as: {adminEmail}</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh} 
            className="refresh-btn"
            disabled={refreshing}
            title="Refresh data"
          >
            {refreshing ? '⏳' : '🔄'}
          </button>
          <button 
            onClick={handleExportToExcel} 
            className="export-btn"
            disabled={filteredRsvps.length === 0}
            title="Export to Excel"
          >
            📊 Export
          </button>
          {checkAdminAuth().role === 'admin' && (
            <button 
              onClick={() => setShowUserManagement(!showUserManagement)}
              className="user-management-btn"
              title="Manage Users"
            >
              👥 Users
            </button>
          )}
          <Link
            to="/photographer/upload"
            className="photographer-link-btn"
            title="Photographer Portal"
          >
            📸 Photographer
          </Link>
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {/* User Management Section (Admin Only) */}
      {showUserManagement && checkAdminAuth().role === 'admin' && (
        <div className="user-management-section">
          <div className="user-management-header">
            <h2>User Management</h2>
            <button
              onClick={() => setShowCreateUser(!showCreateUser)}
              className="create-user-btn"
            >
              {showCreateUser ? '✕ Cancel' : '+ Add User'}
            </button>
          </div>

          {/* Create User Form */}
          {showCreateUser && (
            <div className="create-user-form">
              <h3>Create New User</h3>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-select"
                >
                  <option value="photographer">📸 Photographer</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="create-user-submit-btn"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateUser(false);
                    setNewUser({ email: '', password: '', role: 'photographer' });
                  }}
                  className="cancel-create-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="user-management-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        {editingUserRole.id === user.id ? (
                          <select
                            value={editingUserRole.role}
                            onChange={(e) => setEditingUserRole({ ...editingUserRole, role: e.target.value })}
                            className="role-select"
                          >
                            <option value="admin">Admin</option>
                            <option value="photographer">Photographer</option>
                          </select>
                        ) : (
                          <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'photographer'}`}>
                            {user.role === 'admin' ? '👑 Admin' : '📸 Photographer'}
                          </span>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {editingUserRole.id === user.id ? (
                          <div className="role-edit-buttons">
                            <button onClick={handleUserRoleUpdate} className="save-role-btn">✓</button>
                            <button onClick={() => setEditingUserRole({ id: null, role: '' })} className="cancel-role-btn">✕</button>
                          </div>
                        ) : (
                          <div className="user-action-buttons">
                            <button
                              onClick={() => setEditingUserRole({ id: user.id, role: user.role })}
                              className="edit-role-btn"
                            >
                              ✏️ Change Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="delete-user-btn"
                              title="Delete User"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'bride' ? 'active' : ''}`}
          onClick={() => setActiveTab('bride')}
        >
          Bride's Wedding
        </button>
        <button 
          className={`admin-tab ${activeTab === 'groom' ? 'active' : ''}`}
          onClick={() => setActiveTab('groom')}
        >
          Groom's Wedding
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-summary-cards">
        <div className="summary-card">
          <h3>Total RSVPs</h3>
          <p className="summary-value">{tabSummary.total}</p>
        </div>
        <div className="summary-card attending">
          <h3>Attending</h3>
          <p className="summary-value">{tabSummary.attending}</p>
        </div>
        <div className="summary-card not-attending">
          <h3>Not Attending</h3>
          <p className="summary-value">{tabSummary.notAttending}</p>
        </div>
        <div className="summary-card guests">
          <h3>Total Guests</h3>
          <p className="summary-value">{tabSummary.totalGuests}</p>
        </div>
        <div className="summary-card payment">
          <h3>Total Payment</h3>
          <p className="summary-value">RM {tabSummary.totalPayment.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${attendingFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAttendingFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${attendingFilter === 'attending' ? 'active' : ''}`}
            onClick={() => setAttendingFilter('attending')}
          >
            Attending
          </button>
          <button 
            className={`filter-btn ${attendingFilter === 'not-attending' ? 'active' : ''}`}
            onClick={() => setAttendingFilter('not-attending')}
          >
            Not Attending
          </button>
          <div className="relationship-filter-container">
            <button 
              className={`filter-btn relationship-filter-btn ${selectedRelationships.length > 0 ? 'active' : ''}`}
              onClick={() => setShowRelationshipFilter(!showRelationshipFilter)}
              title={`Filter by Relationship${selectedRelationships.length > 0 ? ` (${selectedRelationships.length} selected)` : ''}`}
            >
              Relationship {selectedRelationships.length > 0 && `(${selectedRelationships.length})`} {showRelationshipFilter ? '▼' : '▶'}
            </button>
            {showRelationshipFilter && (
              <div className="relationship-filter-dropdown">
                <div className="relationship-filter-header">
                  <button 
                    className="relationship-filter-action-btn"
                    onClick={handleSelectAllRelationships}
                  >
                    Select All
                  </button>
                  <button 
                    className="relationship-filter-action-btn"
                    onClick={handleClearRelationshipFilter}
                  >
                    Clear
                  </button>
                </div>
                <div className="relationship-filter-list">
                  {availableRelationships.length === 0 ? (
                    <div className="relationship-filter-empty">No relationships found</div>
                  ) : (
                    availableRelationships.map((relationship, idx) => {
                      const isSelected = selectedRelationships.includes(relationship);
                      return (
                        <label 
                          key={idx} 
                          className={`relationship-filter-item ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRelationshipFilterToggle(relationship)}
                          />
                          <span className="relationship-filter-checkmark">
                            {isSelected && '✓'}
                          </span>
                          <span>{relationship}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RSVP Table */}
      <div className="admin-rsvp-table-container">
        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}'s Wedding RSVPs</h2>
        <table className="admin-rsvp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Attending</th>
              <th>Guests</th>
              <th>Table</th>
              <th>Payment</th>
              <th>Relationship</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {filteredRsvps.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No RSVPs found</td>
              </tr>
            ) : (
              filteredRsvps.map((rsvp) => (
                <tr key={`${rsvp.type}-${rsvp.id}`}>
                  <td data-label="Name">{rsvp.name}</td>
                  <td data-label="Email">{rsvp.email}</td>
                  <td data-label="Attending">
                    <span className={`attending-badge ${rsvp.attending ? 'yes' : 'no'}`}>
                      {rsvp.attending ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td data-label="Guests">{rsvp.number_of_guests}</td>
                  <td data-label="Table">
                    {editingSeat.id === rsvp.id && editingSeat.type === rsvp.type ? (
                      <div className="payment-edit-cell">
                        <input
                          type="text"
                          value={editingSeat.value}
                          onChange={handleSeatChange}
                          className="payment-input"
                          placeholder="e.g. A12"
                        />
                        <div className="payment-edit-buttons">
                          <button 
                            onClick={handleSeatUpdate}
                            className="payment-save-btn"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={handleSeatCancel}
                            className="payment-cancel-btn"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="payment-cell">
                        <span>{rsvp.seat_table || '-'}</span>
                        <button
                          onClick={() => handleSeatEdit(rsvp.id, rsvp.type, rsvp.seat_table)}
                          className="edit-payment-btn"
                          title="Edit seat table"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                  <td data-label="Payment">
                    {editingPayment.id === rsvp.id && editingPayment.type === rsvp.type ? (
                      <div className="payment-edit-cell">
                        <input
                          type="number"
                          value={editingPayment.value}
                          onChange={handlePaymentChange}
                          className="payment-input"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                        <div className="payment-edit-buttons">
                          <button 
                            onClick={handlePaymentUpdate}
                            className="payment-save-btn"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={handlePaymentCancel}
                            className="payment-cancel-btn"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="payment-cell">
                        <span>RM {rsvp.payment_amount.toFixed(2)}</span>
                        <button
                          onClick={() => handlePaymentEdit(rsvp.id, rsvp.type, rsvp.payment_amount)}
                          className="edit-payment-btn"
                          title="Edit payment"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                  <td data-label="Relationship">
                    {editingRelationship.id === rsvp.id && editingRelationship.type === rsvp.type ? (
                      <div className="payment-edit-cell" style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={editingRelationship.value}
                          onChange={handleRelationshipChange}
                          onFocus={() => setShowRelationshipDropdown({ id: rsvp.id, show: true })}
                          className="payment-input"
                          placeholder="e.g. Friend, Family"
                          list={`relationship-list-${rsvp.id}`}
                        />
                        {showRelationshipDropdown.id === rsvp.id && showRelationshipDropdown.show && availableRelationships.length > 0 && (
                          <div className="relationship-dropdown">
                            {availableRelationships
                              .filter(rel => rel.toLowerCase().includes(editingRelationship.value.toLowerCase()))
                              .map((rel, idx) => (
                                <div
                                  key={idx}
                                  className="relationship-option"
                                  onClick={() => handleRelationshipSelect(rel)}
                                >
                                  {rel}
                                </div>
                              ))}
                          </div>
                        )}
                        <div className="payment-edit-buttons">
                          <button 
                            onClick={handleRelationshipUpdate}
                            className="payment-save-btn"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={handleRelationshipCancel}
                            className="payment-cancel-btn"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="payment-cell">
                        <span>{rsvp.relationship || '-'}</span>
                        <button
                          onClick={() => handleRelationshipEdit(rsvp.id, rsvp.type, rsvp.relationship)}
                          className="edit-payment-btn"
                          title="Edit relationship"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                  <td data-label="Remark">
                    {editingRemark.id === rsvp.id && editingRemark.type === rsvp.type ? (
                      <div className="payment-edit-cell">
                        <textarea
                          value={editingRemark.value}
                          onChange={handleRemarkChange}
                          className="payment-input"
                          placeholder="Add remark..."
                          rows="2"
                          style={{ resize: 'vertical', minHeight: '40px' }}
                        />
                        <div className="payment-edit-buttons">
                          <button 
                            onClick={handleRemarkUpdate}
                            className="payment-save-btn"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={handleRemarkCancel}
                            className="payment-cancel-btn"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="payment-cell">
                        <span style={{ whiteSpace: 'pre-wrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rsvp.remark || '-'}
                        </span>
                        <button
                          onClick={() => handleRemarkEdit(rsvp.id, rsvp.type, rsvp.remark)}
                          className="edit-payment-btn"
                          title="Edit remark"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
