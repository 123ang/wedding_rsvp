import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRSVPs, updatePaymentAmount, updateSeatTable, checkAdminAuth, adminLogout } from '../services/api';
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
  const [editingPayment, setEditingPayment] = useState({ id: null, type: null, value: '' });
  const [editingSeat, setEditingSeat] = useState({ id: null, type: null, value: '' });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchRSVPs();
  }, []);

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
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Wedding Type', 'Attending', 'Number of Guests', 'Table', 'Payment Amount', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredRsvps.map(rsvp => [
        `"${rsvp.name}"`,
        `"${rsvp.email}"`,
        `"${rsvp.phone || '-'}"`,
        rsvp.type,
        rsvp.attending ? 'Yes' : 'No',
        rsvp.number_of_guests,
        `"${rsvp.seat_table || ''}"`,
        rsvp.payment_amount.toFixed(2),
        new Date(rsvp.created_at).toLocaleString()
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rsvp-list-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
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

  // Filter and search logic
  const filteredRsvps = rsvps.filter(rsvp => {
    // Filter by tab (bride or groom)
    if (rsvp.type !== activeTab) return false;
    
    // Filter by attending status
    if (attendingFilter === 'attending' && !rsvp.attending) return false;
    if (attendingFilter === 'not-attending' && rsvp.attending) return false;
    
    // Filter by search term
    if (searchTerm &&
        !rsvp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rsvp.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(rsvp.seat_table || '').toLowerCase().includes(searchTerm.toLowerCase())) {
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
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

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
            </tr>
          </thead>
          <tbody>
            {filteredRsvps.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">No RSVPs found</td>
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
