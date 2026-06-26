import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Layers,
  FileText,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  Check,
  Search,
  Filter,
  Calendar,
  Package,
  Plus
} from 'lucide-react';
import Toast from '../components/Toast.jsx';
import API_URL from "../config/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminWalletBalance, setAdminWalletBalance] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFestival, setFilterFestival] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [toast, setToast] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Feedback states
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeFeedTab, setActiveFeedTab] = useState('reviews');

  const fetchStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};
      setStats(data);

      const walletRes = await fetch(`${API_URL}/api/wallet/admin@sharadha.com`);
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setAdminWalletBalance(walletData.balance || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard statistics. Is the backend API online?');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feedback`);
      if (response.ok) {
        const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFeedbacks();
  }, []);

  // Quick Action: Publish/Draft Toggle
  const handlePublishToggle = async (id, currentStatus, items) => {
    const nextStatus = currentStatus === 'Published' ? 'Draft' : 'Published';

    try {
      const response = await fetch(`${API_URL}/api/combos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Action failed');
      }

      setToast({ message: `Combo pack status updated to ${nextStatus}!`, type: 'success' });
      fetchStats(); // Refresh dashboard
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Cannot publish combo. Check item stock availability.', type: 'error' });
    }
  };

  // Quick Action: Delete Combo
  const handleDeleteCombo = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/combos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete combo pack');
      }

      setToast({ message: 'Combo pack deleted successfully!', type: 'success' });
      fetchStats(); // Refresh dashboard
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error deleting combo pack.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="loader-container" style={{ minHeight: '60vh' }}>
        <div className="loader"></div>
        <span>Loading Admin Dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: '40px 0' }}>
        <AlertTriangle size={24} />
        <div>
          <h3>Dashboard Connection Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { metrics, lowStockAlerts, recentCombos, recentOrders } = stats;

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'Cancelled') {
      if (!window.confirm("Are you sure you want to cancel this order and process a 50% refund? This action will permanently update the inventory and billing.")) {
        return null;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setToast({ message: `Order status updated to ${newStatus}!`, type: 'success' });

      // Get order details to send WhatsApp message to customer
      const order = stats.recentOrders?.find(o => o._id === orderId);
      if (order && order.phoneNumber) {
        const cleanPhone = order.phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          let statusMsg = '';
          if (newStatus === 'Packed') {
            statusMsg = `has been confirmed and packed. We are preparing it for dispatch!`;
          } else if (newStatus === 'Shipped') {
            statusMsg = `has been shipped and is on its way to your delivery address.`;
          } else if (newStatus === 'Delivered') {
            statusMsg = `has been successfully delivered! We hope you love your traditional sweets and snacks.`;
          } else if (newStatus === 'Cancelled') {
            statusMsg = `has been cancelled. A 50% refund has been initiated to your original payment method.`;
          } else {
            statusMsg = `status has been updated to: ${newStatus}.`;
          }

          const messageText = `Hello ${order.customerName},\n\nThis is Sharadha Stores. Your order for "${order.comboName}" (Grand Total: ₹${order.total}) ${statusMsg}\n\nThank you for ordering with us!`;
          const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`;
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
      }

      fetchStats(); // Refresh dashboard data
      return data.order;
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error updating order status.', type: 'error' });
      return null;
    }
  };

  // Filter and Search logic on client-side recentCombos list for ease of UX
  const filteredCombos = recentCombos.filter(c => {
    const matchesSearch = c.comboName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFestival = filterFestival === 'All' || c.festivalType === filterFestival;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesFestival && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Dashboard Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display', margin: 0 }}>
            Sharadha Stores Portal
          </h2>
          <p style={{ color: 'var(--charcoal-light)', margin: 0 }}>
            Dashboard Overview &middot; Database mode: <span style={{ fontWeight: 700, color: 'var(--primary-saffron)' }}>{stats.databaseMode}</span>
          </p>
        </div>
        <Link to="/admin/builder" className="btn btn-primary">
          <Plus size={16} /> Create Combo Pack
        </Link>
      </div>

      {/* KPI Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '8px'
      }}>
        {/* Card 1: Total Revenue */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--primary-saffron)' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-saffron-light)',
            color: 'var(--primary-saffron)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <strong style={{ fontSize: '1.4rem' }}>₹</strong>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-saffron)' }}>₹{metrics.totalRevenue || 0}</div>
          </div>
        </div>

        {/* Card 2: Orders Placed */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--forest-green)' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'var(--forest-green-light)',
            color: 'var(--forest-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Orders Placed</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--forest-green)' }}>{metrics.ordersCount || 0}</div>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          borderTop: '4px solid var(--red-crimson)',
          backgroundColor: metrics.lowStockCount > 0 ? '#fffdf7' : 'var(--white)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: metrics.lowStockCount > 0 ? '#fff9e6' : 'var(--cream-dark)',
            color: metrics.lowStockCount > 0 ? '#d4a017' : 'var(--charcoal-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Low Stock Alert</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: metrics.lowStockCount > 0 ? 'var(--red-crimson)' : 'inherit' }}>
              {metrics.lowStockCount}
            </div>
          </div>
        </div>

        {/* Card 4: Retained Cancellation Revenue */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--gold)' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#fffdf8',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <strong style={{ fontSize: '1.4rem' }}>₹</strong>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Retained Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)' }}>₹{adminWalletBalance.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </section>

      <section className="grid-4">
        {/* Card 4: Total Combos */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'var(--gold-light)',
            color: '#7a5f14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Total Combos</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.totalCombos}</div>
          </div>
        </div>

        {/* Card 5: Published Packs */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'var(--forest-green-light)',
            color: 'var(--forest-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Gift size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Published Packs</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.publishedCount}</div>
          </div>
        </div>

        {/* Card 6: Draft Packs */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#eeeafc',
            color: '#5534b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Draft Packs</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.draftCount}</div>
          </div>
        </div>

        {/* Card 7: Total Inventory Units */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--gold)' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'var(--gold-light)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 600 }}>Total Inventory Units</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold)' }}>{metrics.totalProductStock || 0}</div>
          </div>
        </div>
      </section>

      {/* Low Stock Alerts Box */}
      {lowStockAlerts.length > 0 && (
        <section className="card" style={{ border: '1px solid #ffd4d4', backgroundColor: 'var(--red-crimson-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-crimson)', marginBottom: '12px' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Inventory Critical Alerts (Refill Needed!)</h3>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '8px'
          }}>
            {lowStockAlerts.map(prod => (
              <div
                key={prod._id}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid #ffd4d4',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🥣</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{prod.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--red-crimson)', fontWeight: 700 }}>
                    {prod.stock === 0 ? 'OUT OF STOCK' : `Only ${prod.stock} units left!`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Combos Table List */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Playfair Display' }}>
            All Festival Combo Packs
          </h3>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search combo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '16px' }}
              />
              <Search size={16} color="var(--charcoal-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Festival Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '10px 16px' }}
              value={filterFestival}
              onChange={(e) => setFilterFestival(e.target.value)}
            >
              <option value="All">All Festivals</option>
              <option value="Diwali">Diwali</option>
              <option value="Pongal">Pongal</option>
              <option value="Sankranti">Sankranti</option>
              <option value="Holi">Holi</option>
              <option value="Raksha Bandhan">Raksha Bandhan</option>
              <option value="Eid">Eid</option>
              <option value="Christmas">Christmas</option>
              <option value="Wedding Return Gift">Wedding Return Gift</option>
              <option value="Snack Combo">Snack Combo</option>
              <option value="Custom">Custom</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '10px 16px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        {/* Datatable */}
        {filteredCombos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏵️</div>
            <h3>No combo packs matched filters</h3>
            <p>Try resetting the search terms or filters above, or create a new pack.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Combo Hamper Name</th>
                  <th>Festival Category</th>
                  <th>Pricing</th>
                  <th>Stock Availability</th>
                  <th>Publish Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCombos.map((combo) => {
                  const dateStr = combo.createdAt ? new Date(combo.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A';

                  return (
                    <tr key={combo._id}>
                      {/* Name */}
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/combos/${combo._id}`} style={{ color: 'var(--primary-saffron)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🏵️</span>
                          <span>{combo.comboName}</span>
                        </Link>
                      </td>

                      {/* Festival */}
                      <td>
                        <span style={{
                          backgroundColor: 'var(--cream-dark)',
                          border: '1px solid var(--cream-border)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          {combo.festivalType}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td>
                        <div>
                          <strong>₹{combo.finalPrice}</strong>
                          {combo.discount > 0 && (
                            <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--charcoal-light)', marginLeft: '6px' }}>
                              ₹{combo.basePrice}
                            </span>
                          )}
                        </div>
                        {combo.discount > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--forest-green)', fontWeight: 600 }}>
                            {combo.discount}% OFF
                          </span>
                        )}
                      </td>

                      {/* Stock availability */}
                      <td>
                        <span className={`badge badge-${combo.stockStatus.toLowerCase().replace(' ', '-')}`}>
                          {combo.stockStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge badge-${combo.status.toLowerCase()}`}>
                          {combo.status}
                        </span>
                      </td>

                      {/* Created date */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Toggle Publish */}
                          <button
                            onClick={() => handlePublishToggle(combo._id, combo.status, combo.items)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: combo.status === 'Published' ? 'var(--border-light)' : 'var(--primary-saffron)', color: combo.status === 'Published' ? 'var(--charcoal-light)' : 'var(--primary-saffron)' }}
                            title={combo.status === 'Published' ? 'Revert to Draft' : 'Publish Hamper'}
                          >
                            {combo.status === 'Published' ? 'Draft' : 'Publish'}
                          </button>

                          {/* View details */}
                          <Link to={`/combos/${combo._id}`} className="btn btn-secondary" style={{ padding: '6px' }} title="View details">
                            <Eye size={14} />
                          </Link>

                          {/* Edit details */}
                          <Link to={`/admin/builder/${combo._id}`} className="btn btn-gold" style={{ padding: '6px' }} title="Edit hamper">
                            <Edit2 size={14} />
                          </Link>

                          {/* Delete details */}
                          <button
                            onClick={() => handleDeleteCombo(combo._id, combo.comboName)}
                            className="btn btn-danger"
                            style={{ padding: '6px' }}
                            title="Delete Hamper"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Orders Datatable List */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📦 Customer Orders & Dispatch Log
        </h3>

        {recentOrders && recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--charcoal-light)' }}>
            <p>No billing orders placed yet. Orders created by customers will appear here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Profile</th>
                  <th>Hamper Ordered</th>
                  <th>Grand Total</th>
                  <th>Payment Option</th>
                  <th>Order Status</th>
                  <th>Placed Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders && recentOrders.map((order) => {
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A';

                  return (
                    <tr key={order._id}>
                      {/* ID */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>
                        <code>{order._id}</code>
                      </td>

                      {/* Customer */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>{order.customerEmail}</div>
                        {order.phoneNumber && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-saffron)', fontWeight: 500 }}>
                            📞 {order.phoneNumber}
                          </div>
                        )}
                      </td>

                      {/* Hamper */}
                      <td style={{ fontWeight: 600, color: 'var(--primary-saffron)' }}>
                        {order.comboName}
                      </td>

                      {/* Grand Total */}
                      <td style={{ fontWeight: 700 }}>
                        ₹{order.total}
                      </td>

                      {/* Payment */}
                      <td style={{ fontSize: '0.85rem' }}>
                        {order.paymentMethod}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge badge-${order.status.toLowerCase()}`} style={{
                          backgroundColor: order.status === 'Pending' ? '#fff9e6' : order.status === 'Packed' ? '#eef6fc' : order.status === 'Shipped' ? '#eeeafc' : 'var(--forest-green-light)',
                          color: order.status === 'Pending' ? '#d4a017' : order.status === 'Packed' ? '#1d72b8' : order.status === 'Shipped' ? '#5534b8' : 'var(--forest-green)'
                        }}>
                          {order.status}
                        </span>
                      </td>

                      {/* Placed Date */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>
                        {dateStr}
                      </td>

                      {/* Actions (Update status & View Details) */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--cream-border)' }}
                            title="View Invoice & Delivery Address"
                          >
                            <Eye size={14} /> Details
                          </button>
                          {order.status === 'Pending' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'Packed')}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'var(--forest-green)',
                                borderColor: 'var(--forest-green)',
                                color: 'white'
                              }}
                              title="Confirm & Pack Order"
                            >
                              <Check size={14} /> Confirm
                            </button>
                          )}
                          <select
                            className="form-select"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                            value={order.status}
                            onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin Detailed Order & Invoice Modal */}
      {selectedOrder && (() => {
        // Calculate dates
        const orderDate = new Date(selectedOrder.createdAt);
        const estDate = new Date(orderDate);
        estDate.setDate(orderDate.getDate() + 7);
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(44, 36, 29, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1060,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              border: '3px solid var(--gold)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              animation: 'modalFade 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}>
              {/* Modal Header */}
              <div style={{
                backgroundColor: 'var(--cream-dark)',
                padding: '20px 24px',
                borderBottom: '1px solid var(--cream-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-saffron)', margin: 0, fontFamily: 'Playfair Display' }}>
                    Order & Payment Details
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>
                    ID: <code>{selectedOrder._id}</code>
                  </span>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--charcoal-light)' }}>
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Status and Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: 'var(--cream-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--cream-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Dispatch Status:</span>
                    <span className={`badge badge-${selectedOrder.status.toLowerCase()}`} style={{ display: 'inline-block', marginTop: '4px', fontWeight: 700 }}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--cream-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--cream-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Order Placed Date:</span>
                    <strong style={{ fontSize: '0.9rem', display: 'block', marginTop: '4px' }}>
                      {orderDate.toLocaleDateString(undefined, options)}
                    </strong>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--charcoal-light)', margin: '0 0 8px' }}>
                    Customer Profile
                  </h4>
                  <div style={{ border: '1px solid var(--cream-border)', borderRadius: '6px', padding: '12px 16px', backgroundColor: '#fffdfa' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>Name:</span>
                        <div style={{ fontWeight: 600 }}>{selectedOrder.customerName}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>Email:</span>
                        <div style={{ fontWeight: 600 }}>{selectedOrder.customerEmail}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>Phone:</span>
                        <div style={{ fontWeight: 600 }}>{selectedOrder.phoneNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--charcoal-light)', margin: '0 0 8px' }}>
                    Delivery Manifest
                  </h4>
                  <div style={{ border: '1px solid var(--cream-border)', borderRadius: '6px', padding: '12px 16px', backgroundColor: '#fffdfa', display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Shipping Destination Address:</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4 }}>{selectedOrder.shippingAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Payment and Billing Details */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--charcoal-light)', margin: '0 0 8px' }}>
                    Payment & Billing
                  </h4>
                  <div style={{ border: '1px solid var(--cream-border)', borderRadius: '6px', padding: '12px 16px', backgroundColor: '#fffdfa', display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💳</span>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Payment Method Used:</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--primary-saffron)' }}>{selectedOrder.paymentMethod}</strong>
                    </div>
                  </div>

                  {/* Products ordered */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Purchased Item Breakup:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 12px', border: '1px solid var(--cream-border)', borderRadius: '4px', backgroundColor: '#fcfcfc' }}>
                        <span>{item.productName} <strong>(x{item.quantity})</strong></span>
                        <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financial calculations */}
                  <div style={{
                    borderTop: '1px dashed var(--cream-border)',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal Price:</span>
                      <span>₹{selectedOrder.subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST Food Tax (5%):</span>
                      <span>₹{selectedOrder.tax}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Shipping Fee:</span>
                      <span>{selectedOrder.shipping === 0 ? 'FREE' : `₹${selectedOrder.shipping}`}</span>
                    </div>
                    {selectedOrder.giftCharges > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Gift Wrapping Charges:</span>
                        <span>₹{selectedOrder.giftCharges}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '2px solid var(--cream-border)',
                      paddingTop: '10px',
                      marginTop: '4px',
                      fontWeight: 700,
                      fontSize: '1.15rem',
                      color: 'var(--primary-saffron)'
                    }}>
                      <span>Grand Total Revenue:</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>

                    {/* ── Admin Payment Received Banner ── */}
                    <div style={{
                      marginTop: '8px',
                      background: selectedOrder.status === 'Cancelled'
                        ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
                        : 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)',
                      border: `1.5px solid ${selectedOrder.status === 'Cancelled' ? '#ff9800' : 'var(--gold)'}`,
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '1.6rem' }}>
                        {selectedOrder.status === 'Cancelled' ? '↩️' : '🏪'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.9rem', color: selectedOrder.status === 'Cancelled' ? '#e65100' : '#7c5700', display: 'block' }}>
                          {selectedOrder.status === 'Cancelled'
                            ? `Refund Issued: ₹${selectedOrder.total} (50% of original)`
                            : `✅ Payment Received by Sharadha Stores: ₹${selectedOrder.total}`}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#a07000' }}>
                          Order #{(selectedOrder._id || '').slice(-8).toUpperCase()} · Paid via {selectedOrder.paymentMethod} · Customer: {selectedOrder.customerName}
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: selectedOrder.status === 'Delivered' ? 'var(--forest-green)' :
                          selectedOrder.status === 'Cancelled' ? '#e65100' :
                            selectedOrder.status === 'Shipped' ? '#1976d2' :
                              selectedOrder.status === 'Packed' ? 'var(--primary-saffron)' : '#757575',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '4px 12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.5px'
                      }}>
                        {selectedOrder.status === 'Cancelled' ? 'REFUNDED' :
                          selectedOrder.status === 'Delivered' ? '✓ SETTLED' :
                            selectedOrder.status === 'Shipped' ? 'IN TRANSIT' :
                              selectedOrder.status === 'Packed' ? 'CONFIRMED' : 'PENDING'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipment Tracking Timeline */}
                {selectedOrder.history && selectedOrder.history.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--charcoal-light)', margin: '0 0 8px' }}>
                      Shipment Tracking Log
                    </h4>
                    <div style={{ border: '1px solid var(--cream-border)', borderRadius: '6px', padding: '16px', backgroundColor: '#fffdfa' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                        {selectedOrder.history.map((log, i, arr) => {
                          const logTime = new Date(log.timestamp);
                          const logTimeFormatted = logTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' +
                            logTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={i} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                <div style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: log.status === 'Pending' ? 'var(--primary-saffron)' : log.status === 'Delivered' ? 'var(--forest-green)' : 'var(--gold)',
                                  border: '2px solid var(--white)',
                                  boxShadow: '0 0 0 2px var(--cream-border)',
                                  zIndex: 2
                                }}></div>
                                {i < arr.length - 1 && (
                                  <div style={{
                                    width: '2px',
                                    position: 'absolute',
                                    top: '10px',
                                    bottom: '-12px',
                                    backgroundColor: 'var(--cream-border)',
                                    zIndex: 1
                                  }}></div>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-charcoal)' }}>
                                  {log.status === 'Pending' ? 'Order Placed' : log.status === 'Packed' ? 'Order Confirmed & Packed' : log.status === 'Shipped' ? 'Shipped & Dispatched' : log.status}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>{logTimeFormatted}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dispatch Status Controller */}
                <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Update Dispatch Status:</span>
                    <select
                      className="form-select"
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '0.9rem' }}
                      value={selectedOrder.status}
                      onChange={async (e) => {
                        const updatedOrder = await handleOrderStatusUpdate(selectedOrder._id, e.target.value);
                        if (updatedOrder) {
                          setSelectedOrder(updatedOrder);
                        } else {
                          setSelectedOrder(prev => prev ? { ...prev, status: e.target.value } : null);
                        }
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {selectedOrder.status === 'Pending' && (
                    <button
                      onClick={async () => {
                        const updatedOrder = await handleOrderStatusUpdate(selectedOrder._id, 'Packed');
                        if (updatedOrder) {
                          setSelectedOrder(updatedOrder);
                        } else {
                          setSelectedOrder(prev => prev ? { ...prev, status: 'Packed' } : null);
                        }
                      }}
                      className="btn"
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        backgroundColor: 'var(--forest-green)',
                        borderColor: 'var(--forest-green)',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#1b5e20'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'var(--forest-green)'}
                    >
                      <Check size={16} /> Confirm & Pack Order
                    </button>
                  )}


                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Customer Reviews & Suggestions Feed */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
        <div style={{ borderBottom: '1px solid var(--cream-border)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 Customer Reviews & Suggestions Feed
            </h3>
            <p style={{ color: 'var(--charcoal-light)', margin: 0, fontSize: '0.85rem' }}>
              Read reviews, star ratings, and general packaging or product requests.
            </p>
          </div>

          {/* Feed Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--cream-border)', borderRadius: '6px', padding: '4px', backgroundColor: 'var(--cream-dark)' }}>
            <button
              className={`btn ${activeFeedTab === 'reviews' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveFeedTab('reviews')}
            >
              Reviews ({feedbacks.filter(f => f.type === 'review').length})
            </button>
            <button
              className={`btn ${activeFeedTab === 'suggestions' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveFeedTab('suggestions')}
            >
              Suggestions ({feedbacks.filter(f => f.type === 'suggestion').length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeFeedTab === 'reviews' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {feedbacks.filter(f => f.type === 'review').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--charcoal-light)' }}>
                <p>No customer reviews submitted yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {feedbacks.filter(f => f.type === 'review').map((review) => (
                  <div
                    key={review._id}
                    style={{
                      border: '1px solid var(--cream-border)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fffdfa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>{review.customerName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>{review.customerEmail}</span>
                      </div>
                      <div style={{ display: 'flex', color: 'var(--gold)', fontSize: '1rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: review.rating >= star ? 'var(--gold)' : '#e0e0e0' }}>★</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', borderTop: '1px solid #f2eedb', borderBottom: '1px solid #f2eedb', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div>Order ID: <code>{review.orderId}</code></div>
                      <div>Hamper: <strong>{review.comboName}</strong></div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dark-charcoal)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{review.comment}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: 'var(--charcoal-light)', marginTop: '4px' }}>
                      {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {feedbacks.filter(f => f.type === 'suggestion').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--charcoal-light)' }}>
                <p>No customer suggestions submitted yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {feedbacks.filter(f => f.type === 'suggestion').map((suggestion) => (
                  <div
                    key={suggestion._id}
                    style={{
                      border: '1px solid var(--cream-border)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fffdfa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: 'var(--shadow-sm)',
                      borderLeft: '4px solid var(--gold)'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{suggestion.customerName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>{suggestion.customerEmail}</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dark-charcoal)', lineHeight: 1.4 }}>
                      {suggestion.comment}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: 'var(--charcoal-light)', marginTop: '4px' }}>
                      {new Date(suggestion.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
