import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Calendar, CheckCircle, Clock, AlertTriangle, ArrowRight, ShoppingBag, Eye, MapPin, CreditCard, PackageCheck, Truck, Gift } from 'lucide-react';
import Toast from '../components/Toast.jsx';
import API_URL from "../config/api";

const StepIcon = ({ name, size = 18, color }) => {
  switch (name) {
    case 'ShoppingBag': return <ShoppingBag size={size} color={color} />;
    case 'PackageCheck': return <PackageCheck size={size} color={color} />;
    case 'Truck': return <Truck size={size} color={color} />;
    case 'Gift': return <Gift size={size} color={color} />;
    case 'CheckCircle': return <CheckCircle size={size} color={color} />;
    default: return null;
  }
};

const CustomerOrders = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user_profile');
  const user = userStr ? JSON.parse(userStr) : null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [lineProgress, setLineProgress] = useState('0%');
  const [walletBalance, setWalletBalance] = useState(0);

  // Feedback, Reviews, and Suggestions States
  const [feedbacks, setFeedbacks] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setLineProgress('0%');
      setRating(0);
      setReviewComment('');
      const timer = setTimeout(() => {
        const targetWidth = selectedOrder.status === 'Pending' ? '0%' :
                           selectedOrder.status === 'Packed' ? '25%' :
                           selectedOrder.status === 'Shipped' ? '50%' : '75%';
        setLineProgress(targetWidth);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Filter by customer email on the server-side
      const response = await fetch(`${API_URL}/api/orders?customerEmail=${encodeURIComponent(user.email)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};
      setOrders(data);
      
      // Fetch Wallet Balance
      const walletRes = await fetch(`${API_URL}/api/wallet/${encodeURIComponent(user.email)}`);
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWalletBalance(walletData.balance || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve your orders. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/feedback?customerEmail=${encodeURIComponent(user.email)}`);
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
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? As per our policy, cancelling will refund/charge only 50% of the total order value.")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order.');
      }
      
      setToast({ message: 'Order cancelled successfully! 50% refund applied.', type: 'success' });
      
      // Refresh the orders list
      fetchOrders();
      
      // Update selected order view local state
      setSelectedOrder(prev => {
        if (!prev || prev._id !== orderId) return prev;
        const sub = Math.round(prev.subtotal / 2);
        const tx = Math.round(prev.tax / 2);
        const sh = Math.round(prev.shipping / 2);
        return {
          ...prev,
          status: 'Cancelled',
          subtotal: sub,
          tax: tx,
          shipping: sh,
          total: sub + tx + sh,
          history: [...(prev.history || []), { status: 'Cancelled', timestamp: new Date() }]
        };
      });
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Error cancelling order.', type: 'error' });
    }
  };


  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setIsSubmittingSuggestion(true);
    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.name,
          customerEmail: user.email,
          comment: suggestionText,
          type: 'suggestion'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit suggestion');
      }

      setToast({ message: 'Thank you for your suggestion! We value your feedback.', type: 'success' });
      setSuggestionText('');
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to submit suggestion. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (rating === 0 || !reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.name,
          customerEmail: user.email,
          orderId: selectedOrder._id,
          comboName: selectedOrder.comboName,
          rating: rating,
          comment: reviewComment,
          type: 'review'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setToast({ message: 'Review submitted successfully! Thank you.', type: 'success' });
      setRating(0);
      setReviewComment('');
      await fetchFeedbacks();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to submit review. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
    fetchFeedbacks();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return { backgroundColor: '#fff9e6', color: '#d4a017', border: '1px solid #ffe8b3' };
      case 'Packed':
        return { backgroundColor: '#eef6fc', color: '#1d72b8', border: '1px solid #cce3f5' };
      case 'Shipped':
        return { backgroundColor: '#eeeafc', color: '#5534b8', border: '1px solid #d5cbf7' };
      case 'Delivered':
        return { backgroundColor: 'var(--forest-green-light)', color: 'var(--forest-green)', border: '1px solid #c2ebd0' };
      case 'Cancelled':
        return { backgroundColor: 'var(--red-crimson-light)', color: 'var(--red-crimson)', border: '1.5px solid var(--red-crimson)' };
      default:
        return {};
    }
  };

  const getEstimatedDates = (orderDateStr, status) => {
    const orderDate = new Date(orderDateStr);
    const estDate = new Date(orderDate);
    estDate.setDate(orderDate.getDate() + 7);

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return {
      orderDateFormatted: orderDate.toLocaleDateString(undefined, options),
      estDateFormatted: estDate.toLocaleDateString(undefined, options)
    };
  };

  const getStepData = (order) => {
    if (!order) return [];
    const history = order.history || [];
    const createdAt = new Date(order.createdAt);

    const getHistoryTime = (status) => {
      const match = history.find(h => h.status === status);
      return match ? new Date(match.timestamp) : null;
    };

    const formatDate = (date) => {
      if (!date) return '';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatEst = (daysToAdd) => {
      const est = new Date(createdAt);
      est.setDate(createdAt.getDate() + daysToAdd);
      return 'Est: ' + est.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const placedTime = getHistoryTime('Pending') || createdAt;
    
    let confirmedTime = getHistoryTime('Packed');
    if (!confirmedTime && ['Packed', 'Shipped', 'Delivered'].includes(order.status)) {
      confirmedTime = getHistoryTime('Pending') || createdAt;
    }

    let shippingTime = getHistoryTime('Shipped');
    if (!shippingTime && ['Shipped', 'Delivered'].includes(order.status)) {
      shippingTime = getHistoryTime('Packed') || getHistoryTime('Pending') || createdAt;
    }

    let deliveredTime = getHistoryTime('Delivered');
    if (!deliveredTime && order.status === 'Delivered') {
      deliveredTime = new Date(order.updatedAt || order.createdAt);
    }

    return [
      {
        label: 'Order Placed',
        active: true,
        completed: true,
        dateText: formatDate(placedTime),
        icon: 'ShoppingBag'
      },
      {
        label: 'Order Confirmed',
        active: ['Packed', 'Shipped', 'Delivered'].includes(order.status),
        completed: ['Packed', 'Shipped', 'Delivered'].includes(order.status),
        dateText: confirmedTime ? formatDate(confirmedTime) : formatEst(1),
        icon: 'PackageCheck'
      },
      {
        label: 'Shipping',
        active: ['Shipped', 'Delivered'].includes(order.status),
        completed: ['Shipped', 'Delivered'].includes(order.status),
        dateText: shippingTime ? formatDate(shippingTime) : formatEst(3),
        icon: 'Truck'
      },
      {
        label: order.status === 'Delivered' ? 'Delivered' : order.status === 'Shipped' ? 'Arriving Tomorrow' : 'Delivered',
        active: order.status === 'Delivered' || order.status === 'Shipped',
        completed: order.status === 'Delivered',
        dateText: deliveredTime ? formatDate(deliveredTime) : order.status === 'Shipped' ? 'Arriving Tomorrow' : formatEst(7),
        icon: order.status === 'Delivered' ? 'CheckCircle' : 'Gift'
      }
    ];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary-saffron)', fontWeight: 700, letterSpacing: '1px' }}>
              Customer Portal
            </span>
            <h2 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display', margin: 0 }}>
              Welcome back, {user?.name.split(' ')[0]}
            </h2>
            <p style={{ color: 'var(--charcoal-light)', margin: 0 }}>
              Track your festival combos, view history, and give feedback.
            </p>
          </div>
        </div>
        
        {/* Wallet Balance Display */}
        <div style={{
          backgroundColor: '#fffdfa',
          border: '1.5px solid var(--primary-saffron)',
          borderRadius: '8px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(230, 110, 37, 0.15)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-saffron-light)',
            color: 'var(--primary-saffron)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            ₹
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--charcoal-light)', fontWeight: 600, letterSpacing: '0.5px' }}>
              My Wallet Balance
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-saffron)', lineHeight: 1 }}>
              ₹{walletBalance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/products')} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={16} /> Continue Shopping
        </button>
      </div>

      {loading ? (
        <div className="loader-container" style={{ minHeight: '40vh' }}>
          <div className="loader"></div>
          <span>Loading your purchase order history...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ margin: '20px 0' }}>
          <AlertTriangle size={24} />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 24px' }}>
          <div className="empty-state-icon" style={{ fontSize: '3.5rem' }}>🎁</div>
          <h3>No Orders Found</h3>
          <p>You haven't placed any sweets or hamper orders yet. Start building your custom combo pack today!</p>
          <button onClick={() => navigate('/customer/builder')} className="btn btn-primary" style={{ marginTop: '16px' }}>
            Build Custom Hamper
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }} className="grid-responsive">
          {/* Left Side: Orders Log List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-saffron)', borderBottom: '1px solid var(--cream-border)', paddingBottom: '12px', margin: 0 }}>
              Order History Log ({orders.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const isSelected = selectedOrder && selectedOrder._id === order._id;
                const { orderDateFormatted } = getEstimatedDates(order.createdAt, order.status);

                return (
                  <div 
                    key={order._id}
                    className={`card order-card-hover ${isSelected ? 'selected-pulse' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '2.5px solid var(--primary-saffron)' : '1px solid var(--cream-border)',
                      backgroundColor: isSelected ? 'var(--primary-saffron-light)' : 'var(--white)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '20px'
                    }}
                  >
                    {/* Status Badge Top Right */}
                    <span 
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        ...getStatusStyle(order.status)
                      }}
                    >
                      {order.status}
                    </span>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>Order ID: <code>{order._id}</code></span>
                      <h4 style={{ fontSize: '1.2rem', margin: '4px 0 0', color: 'var(--dark-charcoal)' }}>{order.comboName}</h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>
                        <Calendar size={14} />
                        <span>Placed: {orderDateFormatted}</span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-saffron)' }}>
                        ₹{order.total}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--cream-border)',
                      paddingTop: '10px',
                      marginTop: '4px',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--charcoal-light)' }}>Click card to view tracking</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setInvoiceOrder(order); }}
                        className="btn btn-secondary"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700,
                          border: '1.5px solid var(--primary-saffron)',
                          color: 'var(--primary-saffron)', backgroundColor: 'var(--primary-saffron-light)',
                          borderRadius: '6px', cursor: 'pointer'
                        }}
                      >
                        <Eye size={13} /> View Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Invoice Breakup / Selected Order Details */}
          <div>
            {selectedOrder ? (() => {
              const { orderDateFormatted, estDateFormatted } = getEstimatedDates(selectedOrder.createdAt, selectedOrder.status);
              
              return (
                <div key={selectedOrder._id} className="card invoice-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '5px solid var(--gold)', position: 'sticky', top: '100px' }}>
                  {selectedOrder.status === 'Delivered' && (
                    <div className="delivered-banner">
                      <span className="bounce-emoji">🎉</span>
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ color: 'var(--forest-green)', display: 'block', fontSize: '0.9rem' }}>Delivery Successful!</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>Your traditional sweets have arrived. Enjoy!</span>
                      </div>
                    </div>
                  )}
                  <div style={{ borderBottom: '1px solid var(--cream-border)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', margin: 0, fontFamily: 'Playfair Display' }}>Itemized Receipt</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>ID: <code>{selectedOrder._id}</code></span>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      ...getStatusStyle(selectedOrder.status)
                    }}>
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Date details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--cream-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--cream-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Order Date:</span>
                      <strong style={{ fontSize: '0.9rem' }}>{orderDateFormatted}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>
                        {selectedOrder.status === 'Delivered' ? 'Delivered Date:' : 'Expected Delivery:'}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--forest-green)' }}>{estDateFormatted}</strong>
                    </div>
                  </div>

                  {/* Order Tracking Progress Bar stepper / Cancel Warning */}
                  {selectedOrder.status === 'Cancelled' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Cancelled Warning Card */}
                      <div style={{
                        border: '1.5px solid var(--red-crimson)',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: 'var(--red-crimson-light)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--red-crimson)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <AlertTriangle size={20} />
                        </div>
                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <strong style={{ color: 'var(--red-crimson)', fontSize: '1.05rem', fontWeight: 700 }}>
                            Order Cancelled
                          </strong>
                          <span style={{ fontSize: '0.9rem', color: '#5c1d1d', lineHeight: 1.4 }}>
                            This order has been cancelled. In accordance with our cancellation policy, a 50% refund (₹{Math.round(selectedOrder.total / 2)}) has been credited to your <strong>Customer Wallet</strong>. You can use this balance on your next order!
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#8c3d3d', marginTop: '4px', fontWeight: 600 }}>
                            All reserved items have been successfully restocked back to the inventory.
                          </span>
                        </div>
                      </div>

                      {/* Detailed Updates Timeline Panel for Cancelled */}
                      {selectedOrder.history && selectedOrder.history.length > 0 && (
                        <div style={{
                          border: '1px solid var(--cream-border)',
                          borderRadius: '8px',
                          padding: '20px',
                          backgroundColor: '#fffdfa',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--primary-saffron)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '14px' }}>
                            Shipment Updates Log
                          </strong>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            paddingLeft: '4px',
                            position: 'relative'
                          }}>
                            {[...selectedOrder.history].reverse().map((log, i, arr) => {
                              const logTime = new Date(log.timestamp);
                              const logTimeFormatted = logTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' +
                                                       logTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                              
                              const getLogMessage = (status) => {
                                switch (status) {
                                  case 'Pending': return 'Order placed successfully. Awaiting store confirmation.';
                                  case 'Packed': return 'Order confirmed and packed by Sharadha Stores. Ready for shipment.';
                                  case 'Shipped': return 'Package shipped. In transit with delivery partner.';
                                  case 'Delivered': return 'Package successfully delivered. Enjoy your traditional treats!';
                                  case 'Cancelled': return 'Order cancelled. 50% refund applied to your original payment.';
                                  default: return 'Status updated.';
                                }
                              };

                              const isLatest = i === 0;

                              return (
                                <div 
                                  key={i} 
                                  className="timeline-item-staggered"
                                  style={{ 
                                    display: 'flex', 
                                    gap: '14px', 
                                    position: 'relative',
                                    animationDelay: `${i * 0.1 + 0.4}s`
                                  }}
                                >
                                  {/* Bullet circle connector */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <div style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      backgroundColor: isLatest ? 'var(--primary-saffron)' : 'var(--forest-green)',
                                      border: '2px solid var(--white)',
                                      boxShadow: '0 0 0 2px ' + (isLatest ? 'var(--primary-saffron-light)' : 'var(--cream-border)'),
                                      zIndex: 2
                                    }}></div>
                                    {i < arr.length - 1 && (
                                      <div style={{
                                        width: '2px',
                                        position: 'absolute',
                                        top: '12px',
                                        bottom: '-16px',
                                        backgroundColor: 'var(--cream-border)',
                                        zIndex: 1
                                      }}></div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isLatest ? 'var(--primary-saffron)' : 'var(--dark-charcoal)' }}>
                                      {log.status === 'Pending' ? 'Order Placed' : log.status === 'Packed' ? 'Order Confirmed & Packed' : log.status === 'Shipped' ? 'Shipped & Dispatched' : log.status}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>{logTimeFormatted}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', fontStyle: 'italic', marginTop: '2px' }}>
                                      {getLogMessage(log.status)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      border: '1px solid var(--cream-border)',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#fffdfa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--primary-saffron)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Package Delivery Tracking
                      </strong>
                      
                      {/* Stepper container */}
                      <div style={{
                        display: 'flex',
                        position: 'relative',
                        margin: '12px 0 6px',
                        justifyContent: 'space-between',
                      }}>
                        {/* Progress Line Background */}
                        <div style={{
                          position: 'absolute',
                          top: '18px',
                          left: '12.5%',
                          right: '12.5%',
                          height: '4px',
                          backgroundColor: 'var(--cream-border)',
                          zIndex: 1
                        }}></div>

                        {/* Active Progress Line */}
                        <div style={{
                          position: 'absolute',
                          top: '18px',
                          left: '12.5%',
                          width: lineProgress,
                          height: '4px',
                          backgroundColor: 'var(--primary-saffron)',
                          zIndex: 2,
                          transition: 'width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
                        }}></div>

                        {/* Steps mapping */}
                        {getStepData(selectedOrder).map((step, index) => {
                          const isDone = step.completed;
                          const isActive = step.active;
                          
                          // Check if this step represents the current status to add a pulsing indicator
                          const isCurrent = 
                            (index === 0 && selectedOrder.status === 'Pending') ||
                            (index === 1 && selectedOrder.status === 'Packed') ||
                            (index === 2 && selectedOrder.status === 'Shipped') ||
                            (index === 3 && selectedOrder.status === 'Delivered');

                          const pulseClass = isCurrent 
                            ? (selectedOrder.status === 'Delivered' ? 'node-completed-pulse' : 'node-active-pulse')
                            : '';

                          return (
                            <div 
                              key={index} 
                              className="step-staggered"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 3,
                                width: '25%',
                                textAlign: 'center',
                                animationDelay: `${index * 0.12}s`
                              }}
                            >
                              {/* Circle Node */}
                              <div 
                                className={pulseClass}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: isDone ? 'var(--forest-green)' : isActive ? 'var(--primary-saffron)' : 'var(--white)',
                                  border: isDone ? '2px solid var(--forest-green)' : isActive ? '2px solid var(--primary-saffron)' : '2px solid var(--cream-border)',
                                  color: isDone || isActive ? 'var(--white)' : 'var(--charcoal-light)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                  transition: 'all 0.3s ease',
                                  position: 'relative'
                                }}
                              >
                                <StepIcon name={step.icon} size={16} color={isDone || isActive ? '#fff' : 'var(--charcoal-light)'} />
                                
                                {/* Small Green Check Badge for Completed Steps */}
                                {isDone && (
                                  <span style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--forest-green)',
                                    border: '2px solid var(--white)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.5rem',
                                    color: 'var(--white)'
                                  }}>
                                    ✓
                                  </span>
                                )}
                              </div>

                              {/* Label */}
                              <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: isDone ? 'var(--forest-green)' : isActive ? 'var(--primary-saffron)' : 'var(--charcoal-light)',
                                marginTop: '8px',
                                lineHeight: 1.2
                              }}>
                                {step.label}
                              </span>

                              {/* Date / Estimate */}
                              <span style={{
                                fontSize: '0.7rem',
                                color: 'var(--charcoal-light)',
                                marginTop: '2px',
                                display: 'block',
                                whiteSpace: 'pre-line',
                                lineHeight: 1.3
                              }}>
                                {step.dateText}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary Info */}
                      <div style={{
                        backgroundColor: 'var(--cream-dark)',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '4px',
                        border: '1px solid var(--cream-border)'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>🚚</span>
                        <div style={{ textAlign: 'left', lineHeight: 1.4 }}>
                          {selectedOrder.status === 'Pending' && <span>Your order is placed. Once confirmed, it will prepare for packing.</span>}
                          {selectedOrder.status === 'Packed' && <span>Your custom hamper has been confirmed and packed. Preparing for courier dispatch.</span>}
                          {selectedOrder.status === 'Shipped' && <span style={{ color: 'var(--primary-saffron)', fontWeight: 600 }}>Your package has been dispatched from Sharadha Stores. In transit - Arriving Tomorrow!</span>}
                          {selectedOrder.status === 'Delivered' && <span style={{ color: 'var(--forest-green)', fontWeight: 600 }}>Delivered! Your traditional treats have been successfully delivered to your shipping address. Enjoy!</span>}
                        </div>
                      </div>

                      {/* Detailed Updates Timeline Panel */}
                      {selectedOrder.history && selectedOrder.history.length > 0 && (
                        <div style={{
                          marginTop: '8px',
                          borderTop: '1px solid var(--cream-border)',
                          paddingTop: '16px'
                        }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--primary-saffron)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '14px' }}>
                            Shipment Updates Log
                          </strong>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            paddingLeft: '4px',
                            position: 'relative'
                          }}>
                            {[...selectedOrder.history].reverse().map((log, i, arr) => {
                              const logTime = new Date(log.timestamp);
                              const logTimeFormatted = logTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' +
                                                       logTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                              
                              const getLogMessage = (status) => {
                                switch (status) {
                                  case 'Pending': return 'Order placed successfully. Awaiting store confirmation.';
                                  case 'Packed': return 'Order confirmed and packed by Sharadha Stores. Ready for shipment.';
                                  case 'Shipped': return 'Package shipped. In transit with delivery partner.';
                                  case 'Delivered': return 'Package successfully delivered. Enjoy your traditional treats!';
                                  case 'Cancelled': return 'Order cancelled. 50% refund applied to your original payment.';
                                  default: return 'Status updated.';
                                }
                              };

                              const isLatest = i === 0;

                              return (
                                <div 
                                  key={i} 
                                  className="timeline-item-staggered"
                                  style={{ 
                                    display: 'flex', 
                                    gap: '14px', 
                                    position: 'relative',
                                    animationDelay: `${i * 0.1 + 0.4}s`
                                  }}
                                >
                                  {/* Bullet circle connector */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <div style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      backgroundColor: isLatest ? 'var(--primary-saffron)' : 'var(--forest-green)',
                                      border: '2px solid var(--white)',
                                      boxShadow: '0 0 0 2px ' + (isLatest ? 'var(--primary-saffron-light)' : 'var(--cream-border)'),
                                      zIndex: 2
                                    }}></div>
                                    {i < arr.length - 1 && (
                                      <div style={{
                                        width: '2px',
                                        position: 'absolute',
                                        top: '12px',
                                        bottom: '-16px',
                                        backgroundColor: 'var(--cream-border)',
                                        zIndex: 1
                                      }}></div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isLatest ? 'var(--primary-saffron)' : 'var(--dark-charcoal)' }}>
                                      {log.status === 'Pending' ? 'Order Placed' : log.status === 'Packed' ? 'Order Confirmed & Packed' : log.status === 'Shipped' ? 'Shipped & Dispatched' : log.status}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>{logTimeFormatted}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', fontStyle: 'italic', marginTop: '2px' }}>
                                      {getLogMessage(log.status)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items list */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                      Products Included:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffdfa', padding: '10px 12px', border: '1px solid var(--cream-border)', borderRadius: '4px' }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem', display: 'block' }}>{item.productName || item.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>Price: ₹{item.price} each</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>Qty: {item.quantity}</span>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>₹{(item.price * item.quantity).toFixed(0)}</div>
                          </div>
                        </div>
                      )) : (
                        <div style={{ padding: '12px', backgroundColor: '#fffdfa', border: '1px solid var(--cream-border)', borderRadius: '4px', textAlign: 'center', color: 'var(--charcoal-light)', fontSize: '0.85rem' }}>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>{selectedOrder.comboName}</strong>
                          <span>Custom festival combo pack</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping & Payment info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--cream-border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <MapPin size={16} color="var(--primary-saffron)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Shipping Address:</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--dark-charcoal)' }}>{selectedOrder.shippingAddress}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <CreditCard size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block' }}>Payment Method:</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--dark-charcoal)' }}>{selectedOrder.paymentMethod}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Summary */}
                  <div style={{
                    borderTop: '2px solid var(--cream-border)',
                    paddingTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST Food Tax (5%):</span>
                      <span>₹{selectedOrder.tax}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Shipping Fee:</span>
                      <span>{selectedOrder.shipping === 0 ? <strong style={{ color: 'var(--forest-green)' }}>FREE</strong> : `₹${selectedOrder.shipping}`}</span>
                    </div>
                    {selectedOrder.giftCharges > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>🎁 Gift Wrapping:</span>
                        <span>₹{selectedOrder.giftCharges}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px dashed var(--cream-border)',
                      paddingTop: '12px',
                      marginTop: '4px',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      color: 'var(--primary-saffron)'
                    }}>
                      <span>Grand Total:</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>

                    {selectedOrder.status === 'Cancelled' && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        backgroundColor: '#fffdf8', 
                        border: '1.5px dashed var(--gold)', 
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--forest-green)' }}>
                          <span>✅ Refunded to Customer Wallet (50%):</span>
                          <span>+₹{selectedOrder.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#8c3d3d' }}>
                          <span>❌ Store Cancellation Fee (50%):</span>
                          <span>-₹{selectedOrder.total}</span>
                        </div>
                      </div>
                    )}

                  </div>



                  {/* Cancel Order Button */}
                  {['Pending', 'Packed'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder._id)}
                      className="btn"
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--red-crimson)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        marginTop: '8px',
                        marginBottom: '8px'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#b71c1c'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'var(--red-crimson)'}
                    >
                      <AlertTriangle size={16} /> Cancel Order (50% Refund Policy)
                    </button>
                  )}                  {/* Order Review Section (only for Delivered orders) */}
                  {selectedOrder.status === 'Delivered' && (() => {
                    const orderReview = feedbacks.find(f => f.orderId === selectedOrder._id && f.type === 'review');
                    if (orderReview) {
                      return (
                        <div style={{ 
                          borderTop: '1px dashed var(--cream-border)', 
                          paddingTop: '16px', 
                          marginTop: '16px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px' 
                        }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--primary-saffron)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Your Rating & Review
                          </strong>
                          <div style={{ display: 'flex', gap: '4px', color: 'var(--gold)', fontSize: '1.25rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} style={{ color: orderReview.rating >= star ? 'var(--gold)' : '#e0e0e0' }}>
                                ★
                              </span>
                            ))}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-charcoal)', fontStyle: 'italic', backgroundColor: '#fcfaf2', padding: '10px 12px', border: '1px solid var(--cream-border)', borderRadius: '4px' }}>
                            "{orderReview.comment}"
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>
                            Submitted on: {new Date(orderReview.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ 
                          borderTop: '1px dashed var(--cream-border)', 
                          paddingTop: '16px', 
                          marginTop: '16px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px' 
                        }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--primary-saffron)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Rate Your Experience
                          </strong>
                          <p style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', margin: 0 }}>
                            How were the sweets and overall service? Share your feedback with us!
                          </p>

                          {/* Star Selector */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' }}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isGold = (hoverRating || rating) >= star;
                              return (
                                <span
                                  key={star}
                                  onClick={() => setRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '1.8rem',
                                    color: isGold ? 'var(--gold)' : '#e0e0e0',
                                    transition: 'transform 0.1s ease, color 0.1s ease',
                                    transform: (hoverRating || rating) === star ? 'scale(1.15)' : 'scale(1)'
                                  }}
                                >
                                  ★
                                </span>
                              );
                            })}
                            <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', marginLeft: '8px', fontWeight: 600 }}>
                              {rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'Select rating'}
                            </span>
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Write your review here (e.g. Sweets were delicious and fresh!)..."
                              rows="3"
                              style={{ padding: '8px 10px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--cream-border)', width: '100%', resize: 'none' }}
                            ></textarea>
                          </div>

                          <button
                            onClick={handleReviewSubmit}
                            className="btn btn-primary"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}
                            disabled={isSubmittingReview || rating === 0 || !reviewComment.trim()}
                          >
                            {isSubmittingReview ? 'Submitting Review...' : 'Submit Review'}
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              );
            })() : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', border: '2px dashed var(--gold)', backgroundColor: 'var(--cream-dark)', textAlign: 'center', minHeight: '300px' }}>
                <span style={{ fontSize: '3rem' }}>📄</span>
                <h4 style={{ margin: '12px 0 6px', fontFamily: 'Playfair Display' }}>No Order Selected</h4>
                <p style={{ color: 'var(--charcoal-light)', fontSize: '0.9rem', margin: 0 }}>
                  Select an order from the list on the left to view its detailed receipt, delivery estimations, and shipping logs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Packaging Styles & Suggestion Box Section */}
      <div style={{ 
        borderTop: '2px solid var(--cream-border)', 
        paddingTop: '32px', 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 1fr', 
        gap: '32px',
        marginTop: '32px'
      }} className="grid-responsive">
        {/* Left Column: Gifting & Packaging Styles Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary-saffron)', fontWeight: 700, letterSpacing: '0.5px' }}>
              Premium Presentation
            </span>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'Playfair Display', margin: 0 }}>
              Gifting & Packaging Styles
            </h3>
            <p style={{ color: 'var(--charcoal-light)', margin: 0, fontSize: '0.9rem' }}>
              We take pride in wrapping your warm wishes in premium, eco-friendly traditional packages.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Gift Packing Box */}
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              backgroundColor: 'var(--white)', 
              border: '1px solid var(--cream-border)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.3s ease',
            }} className="packaging-card">
              <div style={{ width: '180px', height: '150px', overflow: 'hidden', flexShrink: 0 }}>
                <img 
                  src="/gift-packing.jpg" 
                  alt="Gift Packing Example" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                  className="packaging-img"
                />
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-saffron)', fontWeight: 700, textTransform: 'uppercase' }}>Royal Gifting</span>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Playfair Display', color: 'var(--dark-charcoal)' }}>Shahi Gift Box Packing</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--charcoal-light)', lineHeight: 1.4 }}>
                  Exquisite golden-foiled cardboard boxes wrapped in saffron satin ribbons, adorned with traditional motifs. Perfect for weddings, Diwali, and prestigious celebrations.
                </p>
              </div>
            </div>

            {/* Combo Packing Box */}
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              backgroundColor: 'var(--white)', 
              border: '1px solid var(--cream-border)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.3s ease',
            }} className="packaging-card">
              <div style={{ width: '180px', height: '150px', overflow: 'hidden', flexShrink: 0 }}>
                <img 
                  src="/public/images/packaging/combo_pack.png" 
                  alt="Combo Packing Example" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                  className="packaging-img"
                />
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>Classic Assortment</span>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Playfair Display', color: 'var(--dark-charcoal)' }}>Saffron Assorted Combo Pack</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--charcoal-light)', lineHeight: 1.4 }}>
                  Sleek partition containers designed to preserve freshness and separate multiple sweet varieties. Features transparent security seals and beautiful geometric gold patterns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Suggestion Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--gold)', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{ fontSize: '1.3rem', margin: 0, fontFamily: 'Playfair Display' }}>Customer Suggestions</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', margin: 0 }}>
              Have an idea for a new sweet combo, a unique packaging style, or a corporate gifting request? Share it with us!
            </p>
          </div>

          <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="suggestion" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Suggestion / Sweet Request</label>
              <textarea
                id="suggestion"
                rows="4"
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="E.g., I'd love to see a sugar-free dates & nuts roll combo pack in a handmade bamboo box..."
                className="form-control"
                style={{ padding: '10px', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid var(--cream-border)', width: '100%', resize: 'vertical' }}
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              disabled={isSubmittingSuggestion || !suggestionText.trim()}
            >
              {isSubmittingSuggestion ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .packaging-card {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        .packaging-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08) !important;
          border-color: var(--primary-saffron) !important;
        }
        .packaging-card:hover .packaging-img {
          transform: scale(1.08);
        }
        .grid-responsive {
          grid-template-columns: 1.2fr 1fr;
        }
        @media (max-width: 900px) {
          .grid-responsive {
            grid-template-columns: 1fr;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Premium hover effects for order log cards */
        .order-card-hover {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        .order-card-hover:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 10px 20px rgba(212, 160, 23, 0.1) !important;
          border-color: var(--primary-saffron) !important;
        }

        /* Pulsing selection animation for order cards */
        @keyframes selectPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .selected-pulse {
          animation: selectPop 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
          box-shadow: 0 4px 12px rgba(212, 160, 23, 0.08) !important;
        }

        /* Slide-in & Fade-in for Invoice Card on right side */
        @keyframes slideInInvoice {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .invoice-slide-in {
          animation: slideInInvoice 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) both;
        }

        /* Sequential staggered slide-up for tracking steps */
        @keyframes stepFadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .step-staggered {
          animation: stepFadeInUp 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) both;
        }

        /* Pulse halo effect for active step (Saffron) */
        @keyframes pulseActiveSaffron {
          0% {
            box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.5), 0 2px 6px rgba(0,0,0,0.05);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(212, 160, 23, 0), 0 2px 6px rgba(0,0,0,0.05);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(212, 160, 23, 0), 0 2px 6px rgba(0,0,0,0.05);
          }
        }
        .node-active-pulse {
          animation: pulseActiveSaffron 2s infinite;
        }

        /* Pulse halo effect for completed step (Green) */
        @keyframes pulseCompletedGreen {
          0% {
            box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4), 0 2px 6px rgba(0,0,0,0.05);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(46, 125, 50, 0), 0 2px 6px rgba(0,0,0,0.05);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(46, 125, 50, 0), 0 2px 6px rgba(0,0,0,0.05);
          }
        }
        .node-completed-pulse {
          animation: pulseCompletedGreen 2.5s infinite;
        }

        /* Staggered slide-in from left for vertical timeline log updates */
        @keyframes timelineSlideIn {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .timeline-item-staggered {
          animation: timelineSlideIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) both;
        }

        /* Celebration shimmer banner for delivered status */
        .delivered-banner {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-left: 5px solid var(--forest-green);
          border-radius: 6px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes bounceEmoji {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.1); }
        }
        .bounce-emoji {
          animation: bounceEmoji 1.5s infinite ease-in-out;
          font-size: 1.5rem;
          display: inline-block;
        }
      `}</style>

      {/* ─── Customer Invoice Modal ─── */}
      {invoiceOrder && (() => {
        const inv = invoiceOrder;
        const { orderDateFormatted, estDateFormatted } = getEstimatedDates(inv.createdAt, inv.status);
        const statusColor = inv.status === 'Delivered' ? 'var(--forest-green)' :
                            inv.status === 'Cancelled' ? '#c62828' :
                            inv.status === 'Shipped'   ? '#1565c0' :
                            inv.status === 'Packed'    ? 'var(--primary-saffron)' : '#757575';
        return (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(44,36,29,0.65)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}
            onClick={() => setInvoiceOrder(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--white)', borderRadius: '14px',
                border: '3px solid var(--gold)', maxWidth: '560px', width: '100%',
                maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
                animation: 'fadeIn 0.25s ease-out'
              }}
            >
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary-saffron) 0%, var(--gold) 100%)',
                padding: '20px 24px', borderRadius: '11px 11px 0 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontFamily: 'Playfair Display', fontSize: '1.3rem' }}>
                    🧾 Order Invoice
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                    ID: <code style={{ color: 'white' }}>{inv._id}</code>
                  </span>
                </div>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Store + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Playfair Display', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-saffron)' }}>🏪 Sharadha Stores</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>Traditional Sweets & Festival Hampers</div>
                  </div>
                  <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: statusColor + '20', color: statusColor, border: `1.5px solid ${statusColor}` }}>
                    {inv.status}
                  </span>
                </div>

                {/* Date Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: 'var(--cream-dark)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--cream-border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--charcoal-light)', display: 'block' }}>Order Date:</span>
                    <strong style={{ fontSize: '0.85rem' }}>{orderDateFormatted}</strong>
                  </div>
                  <div style={{ backgroundColor: 'var(--cream-dark)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--cream-border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--charcoal-light)', display: 'block' }}>
                      {inv.status === 'Delivered' ? 'Delivered On:' : 'Est. Delivery:'}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--forest-green)' }}>{estDateFormatted}</strong>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ backgroundColor: '#fffdfa', border: '1px solid var(--cream-border)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Customer Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem' }}>
                    <div><strong>{inv.customerName}</strong></div>
                    <div style={{ color: 'var(--charcoal-light)' }}>{inv.customerEmail}</div>
                    {inv.phoneNumber && <div style={{ color: 'var(--primary-saffron)' }}>📞 {inv.phoneNumber}</div>}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', color: 'var(--charcoal-light)' }}>
                      <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{inv.shippingAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Products Ordered</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {inv.items && inv.items.length > 0 ? inv.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fffdfa', border: '1px solid var(--cream-border)', borderRadius: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{item.productName || item.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>₹{item.price} × {item.quantity}</div>
                        </div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--dark-charcoal)' }}>₹{(item.price * item.quantity).toFixed(0)}</strong>
                      </div>
                    )) : (
                      <div style={{ padding: '12px 14px', backgroundColor: '#fffdfa', border: '1px solid var(--cream-border)', borderRadius: '6px' }}>
                        <strong>{inv.comboName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--charcoal-light)' }}>Custom festival combo pack</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bill Summary */}
                <div style={{ borderTop: '2px dashed var(--cream-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--charcoal-light)' }}>Subtotal</span>
                    <span>₹{inv.subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--charcoal-light)' }}>GST (5%)</span>
                    <span>₹{inv.tax}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--charcoal-light)' }}>Shipping</span>
                    <span>{inv.shipping === 0 ? <strong style={{ color: 'var(--forest-green)' }}>FREE</strong> : `₹${inv.shipping}`}</span>
                  </div>
                  {inv.giftCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--charcoal-light)' }}>🎁 Gift Wrapping</span>
                      <span>₹{inv.giftCharges}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--cream-border)', paddingTop: '12px', marginTop: '4px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-saffron)' }}>
                    <span>Grand Total</span>
                    <span>₹{inv.total}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--cream-dark)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-border)' }}>
                  <CreditCard size={18} color="var(--gold)" />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--charcoal-light)' }}>Payment Method</div>
                    <strong style={{ fontSize: '0.9rem' }}>{inv.paymentMethod}</strong>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: inv.status === 'Cancelled' ? '#c62828' : 'var(--forest-green)', backgroundColor: inv.status === 'Cancelled' ? '#fce4e4' : '#e8f5e9', padding: '4px 10px', borderRadius: '4px' }}>
                    {inv.status === 'Cancelled' ? '↩ REFUND' : '✓ PAID'}
                  </div>
                </div>

                {/* Order History Timeline */}
                {inv.history && inv.history.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Order Timeline</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '4px' }}>
                      {[...inv.history].reverse().map((log, i) => {
                        const t = new Date(log.timestamp);
                        const tFmt = t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                        const isFirst = i === 0;
                        return (
                          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isFirst ? 'var(--primary-saffron)' : 'var(--forest-green)', flexShrink: 0, marginTop: '4px', border: '2px solid white', boxShadow: `0 0 0 2px ${isFirst ? 'var(--primary-saffron)' : 'var(--cream-border)'}` }} />
                            <div>
                              <strong style={{ fontSize: '0.82rem', color: isFirst ? 'var(--primary-saffron)' : 'var(--dark-charcoal)', display: 'block' }}>
                                {log.status === 'Pending' ? 'Order Placed' : log.status === 'Packed' ? 'Confirmed & Packed' : log.status === 'Shipped' ? 'Shipped & Dispatched' : log.status === 'Delivered' ? 'Delivered' : log.status === 'Cancelled' ? 'Order Cancelled' : log.status}
                              </strong>
                              <span style={{ fontSize: '0.73rem', color: 'var(--charcoal-light)' }}>{tFmt}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                >
                  Close Invoice
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerOrders;
