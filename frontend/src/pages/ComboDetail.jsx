import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Calendar, 
  Gift, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Heart,
  ShoppingCart
} from 'lucide-react';
import Toast from '../components/Toast.jsx';
import API_URL from "../config/api";

const ComboDetail = () => {
  // Load current user profile for role-based view adjustments
  const userStr = localStorage.getItem('user_profile');
  const user = userStr ? JSON.parse(userStr) : null;
  const isCustomer = user && user.role === 'customer';
  const isAdminOrInventory = user && ['admin', 'inventory_manager'].includes(user.role);
  const { id } = useParams();
  const navigate = useNavigate();

  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [recommendationResult, setRecommendationResult] = useState('');
  const [toast, setToast] = useState(null);

  // Billing Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [ordering, setOrdering] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setToast({ message: 'Please enter a valid shipping address.', type: 'warning' });
      return;
    }

    setOrdering(true);
    try {
      const subtotal = combo.finalPrice;
      const tax = Math.round(subtotal * 0.05);
      const shipping = subtotal >= 1000 ? 0 : 80;
      const initialTotal = subtotal + tax + shipping;
      const walletApplied = useWallet ? Math.min(walletBalance, initialTotal) : 0;

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.name,
          customerEmail: user.email,
          comboId: combo._id,
          shippingAddress,
          paymentMethod,
          phoneNumber: phoneNumber || '9999999999',
          walletApplied
        })
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setToast({ message: 'Order placed successfully! Stock updated.', type: 'success' });
      setIsCheckoutOpen(false);
      setShippingAddress('');

      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setOrdering(false);
    }
  };

  const fetchComboDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/combos/${id}`);
      if (!response.ok) {
        throw new Error('Combo pack not found');
      }
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};
      setCombo(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve combo details. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComboDetail();
    
    if (user) {
      fetch(`${API_URL}/api/wallet/${encodeURIComponent(user.email)}`)
        .then(res => res.ok ? res.json() : { balance: 0 })
        .then(data => setWalletBalance(data.balance || 0))
        .catch(console.error);
    }
  }, [id]);

  // Handle process action (/api/combos/:id/process)
  const handleProcessCombo = async () => {
    setProcessing(true);
    setRecommendationResult('');
    try {
      const response = await fetch(`${API_URL}/api/combos/${id}/process`, {
        method: 'POST'
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Processing failed');
      }

      setToast({ message: 'Hamper inventory processed successfully!', type: 'success' });
      setRecommendationResult(data.suggestionText);
      fetchComboDetail(); // Reload latest history & stock status
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Error processing hamper.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container" style={{ minHeight: '60vh' }}>
        <div className="loader"></div>
        <span>Loading hamper specification...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: '40px 0' }}>
        <AlertTriangle size={24} />
        <div>
          <h3>Detail Loading Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const {
    comboName,
    festivalType,
    items,
    basePrice,
    discount,
    finalPrice,
    giftNote,
    image,
    status,
    stockStatus,
    createdAt,
    history
  } = combo;

  const totalItemsQty = items ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const savingAmount = Math.round(basePrice * (discount / 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate(isCustomer ? '/' : '/dashboard')} 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px' }}
          >
            <ArrowLeft size={16} /> {isCustomer ? 'Back to Shop' : 'Back to Dashboard'}
          </button>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary-saffron)', fontWeight: 700, letterSpacing: '1px' }}>
              {festivalType} Hamper
            </span>
            <h2 style={{ fontSize: '2rem', fontFamily: 'Playfair Display', margin: 0 }}>
              {comboName}
            </h2>
          </div>
        </div>

        {isCustomer && (
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem' }}
          >
            <ShoppingCart size={18} /> Place Order & Checkout
          </button>
        )}

        {!isCustomer && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAdminOrInventory && (
              <Link to={`/admin/builder/${id}`} className="btn btn-gold">
                <Edit2 size={16} /> Edit Hamper Spec
              </Link>
            )}
            <button 
              onClick={handleProcessCombo} 
              className="btn btn-primary" 
              disabled={processing}
              style={{ minWidth: '180px' }}
            >
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  <RefreshCw size={16} className={processing ? 'spin' : ''} /> Validate & Process Pack
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }} className="grid-responsive">
        
        {/* Left Side: Summary & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Banner & Core Details */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Combo Banner */}
            <div style={{
              height: '220px',
              position: 'relative',
              background: 'linear-gradient(135deg, var(--primary-saffron) 0%, var(--gold) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--white)'
            }}>
              {image ? (
                <img 
                  src={image} 
                  alt={comboName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '4rem' }}>🎁</span>
                  <h3 style={{ color: 'var(--white)', fontFamily: 'Playfair Display', fontSize: '1.8rem', marginTop: '8px' }}>
                    {comboName}
                  </h3>
                </div>
              )}

              {/* Status overlays */}
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                <span className={`badge badge-${status.toLowerCase()}`}>
                  {status}
                </span>
                <span className={`badge badge-${stockStatus.toLowerCase().replace(' ', '-')}`}>
                  {stockStatus}
                </span>
              </div>
            </div>

            {/* Core parameters block */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', display: 'block' }}>Festival Category:</span>
                <strong style={{ fontSize: '1.1rem' }}>{festivalType}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', display: 'block' }}>Estimated Shelf Life:</span>
                <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="var(--primary-saffron)" /> {combo.shelfLifeDate || 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', display: 'block' }}>Creation Timestamp:</span>
                <span style={{ fontSize: '1rem', color: 'var(--dark-charcoal)' }}>
                  {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', display: 'block' }}>Total Bundle Size:</span>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {items ? items.length : 0} items ({totalItemsQty} total units)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Items list inside combo */}
          <div className="card">
            <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-saffron)', borderBottom: '1px solid var(--cream-border)', paddingBottom: '12px', marginBottom: '16px', margin: 0 }}>
              Included Food Products
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items && items.length > 0 ? (
                items.map((item, index) => {
                  const product = item.product || {};
                  const isLow = product.stock < 10;
                  const isOut = product.stock < item.quantity;
                  const itemCost = product.price * item.quantity;

                  return (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        border: '1px solid var(--cream-border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--cream-dark)',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      {/* Product details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }} 
                          />
                        ) : (
                          <span style={{ fontSize: '1.8rem' }}>🍲</span>
                        )}
                        <div>
                          <strong style={{ fontSize: '1rem', display: 'block' }}>{product.name || 'Unknown Product'}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>
                            Category: {product.category || 'N/A'} &middot; Unit Price: ₹{product.price || 0}
                          </span>
                        </div>
                      </div>

                      {/* Quantities & Totals */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Stock Warning Icon */}
                        {isCustomer ? (
                          isOut ? (
                            <span className="badge badge-out-of-stock" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              <AlertTriangle size={12} style={{ marginRight: '4px' }} /> Temporarily Unavailable
                            </span>
                          ) : (
                            <span className="badge badge-in-stock" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              <CheckCircle size={12} style={{ marginRight: '4px' }} /> Available
                            </span>
                          )
                        ) : (
                          isOut ? (
                            <span className="badge badge-out-of-stock" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                              <AlertTriangle size={12} style={{ marginRight: '4px' }} /> Out of stock! (Only {product.stock} avail)
                            </span>
                          ) : isLow ? (
                            <span className="badge badge-low-stock" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                              <AlertTriangle size={12} style={{ marginRight: '4px' }} /> Low stock ({product.stock} avail)
                            </span>
                          ) : (
                            <span className="badge badge-in-stock" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                              <CheckCircle size={12} style={{ marginRight: '4px' }} /> Sufficient Stock ({product.stock})
                            </span>
                          )
                        )}

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>
                            Qty: <strong>{item.quantity}</strong>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            ₹{itemCost}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--red-crimson)' }}>No items in this combo pack spec.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Price Breakup, Note, Audit log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Pricing summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '4px solid var(--gold)' }}>
            <h3 style={{ fontSize: '1.3rem', margin: 0, borderBottom: '1px solid var(--cream-border)', paddingBottom: '12px' }}>
              Hamper Price Breakup
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--charcoal-light)' }}>Base Hamper Price:</span>
                <span style={{ fontWeight: 600 }}>₹{basePrice}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--red-crimson)' }}>
                  <span>Hamper Discount ({discount}%):</span>
                  <span>- ₹{savingAmount}</span>
                </div>
              )}
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderTop: '2px solid var(--cream-border)', 
                paddingTop: '16px',
                marginTop: '4px'
              }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Final Selling Price:</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-saffron)' }}>
                  ₹{finalPrice}
                </span>
              </div>
              {discount > 0 && (
                <div style={{
                  backgroundColor: 'var(--forest-green-light)',
                  color: 'var(--forest-green)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  🎉 Customers save ₹{savingAmount} on this festival combo!
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Custom Gifting Message */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-saffron)' }}>
              <Heart size={16} fill="var(--primary-saffron)" /> Customer Gift Note
            </h3>
            <div style={{
              backgroundColor: 'var(--cream-dark)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--cream-border)',
              fontStyle: 'italic',
              fontSize: '0.95rem',
              lineHeight: 1.4,
              color: giftNote ? 'var(--dark-charcoal)' : 'var(--charcoal-light)'
            }}>
              {giftNote ? `"${giftNote}"` : 'No custom gift note specified for this hamper.'}
            </div>
          </div>

          {/* Smart suggestion result */}
          {recommendationResult && (
            <div className="card" style={{
              border: '2px solid var(--primary-saffron)',
              backgroundColor: 'var(--primary-saffron-light)',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-saffron)', marginBottom: '8px' }}>
                <Sparkles size={18} />
                <h4 style={{ margin: 0, fontWeight: 700 }}>Processing Action Recommendations</h4>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.4, margin: 0 }}>
                {recommendationResult}
              </p>
            </div>
          )}

          {/* Card 3: Role-Specific Display (Guarantee card for Customers, Audit Timeline for Staff) */}
          {isCustomer ? (
            <div className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '2px dashed var(--gold)',
              backgroundColor: 'var(--cream-dark)',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-saffron)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Playfair Display' }}>
                🏵️ Quality & Freshness Guarantee
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--charcoal-light)', margin: 0 }}>
                All Sharadha Stores delicacies are prepared fresh using grade-A pure ghee, nuts, and organic ingredients with traditional heritage recipes.
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--charcoal-light)', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                <li>100% Preservative and chemical free</li>
                <li>Handcrafted in small, hygienic batches</li>
                <li>Vacuum packed to retain traditional crispiness</li>
                <li>Store in an airtight jar for maximum shelf-life</li>
              </ul>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Status & Audit Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--cream-border)' }}>
                {history && history.length > 0 ? (
                  history.map((log, index) => {
                    const logDate = log.timestamp ? new Date(log.timestamp).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                      second: '2-digit'
                    }) : 'N/A';
                    
                    const logDay = log.timestamp ? new Date(log.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    }) : '';

                    return (
                      <div key={index} style={{ position: 'relative' }}>
                        {/* Bullet circle */}
                        <span style={{
                          position: 'absolute',
                          left: '-27px',
                          top: '4px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--gold)',
                          border: '2px solid var(--white)',
                          boxShadow: '0 0 0 2px var(--cream-border)'
                        }}></span>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--dark-charcoal)' }}>{log.action}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>
                            {logDay} {logDate}
                          </span>
                        </div>

                        {/* Details */}
                        {log.details && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', marginTop: '2px', lineHeight: 1.3 }}>
                            {log.details}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>No historical actions recorded yet.</p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Checkout Billing Modal */}
      {isCheckoutOpen && (
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
            maxWidth: '560px',
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
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-saffron)', margin: 0, fontFamily: 'Playfair Display' }}>
                Secure Checkout & Billing
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--charcoal-light)' }}>
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePlaceOrder} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Buyer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block' }}>Customer Name:</span>
                  <strong style={{ fontSize: '0.95rem' }}>{user.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block' }}>Email:</span>
                  <strong style={{ fontSize: '0.95rem' }}>{user.email}</strong>
                </div>
              </div>

              {/* Hamper name */}
              <div style={{ backgroundColor: 'var(--cream-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--cream-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block' }}>Ordering Hamper:</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--primary-saffron)' }}>{comboName}</strong>
              </div>

              {/* Shipping Address */}
              <div className="form-group">
                <label className="form-label">Delivery Shipping Address:</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  placeholder="Enter full shipping address with pin code..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={{ resize: 'none' }}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">Payment Option:</label>
                <select 
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (GooglePay, PhonePe, Paytm)</option>
                  <option value="Credit/Debit Card">Credit / Debit Card</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                </select>
              </div>

              {walletBalance > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#fffdf8',
                  padding: '12px 14px',
                  border: '1.5px solid var(--primary-saffron)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }} onClick={() => setUseWallet(prev => !prev)}>
                  <input
                    type="checkbox"
                    id="useWalletCombo"
                    checked={useWallet}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-saffron)' }}
                  />
                  <label htmlFor="useWalletCombo" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', margin: 0, color: 'var(--dark-charcoal)' }}>
                    <span>💳 Use Wallet Balance (Available: ₹{walletBalance})</span>
                    <span style={{ color: 'var(--primary-saffron)' }}>
                      -₹{useWallet ? Math.min(walletBalance, finalPrice + Math.round(finalPrice * 0.05) + (finalPrice >= 1000 ? 0 : 80)) : 0}
                    </span>
                  </label>
                </div>
              )}

              {/* Invoice Breakup */}
              <div style={{
                borderTop: '2px solid var(--cream-border)',
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hamper Subtotal:</span>
                  <span>₹{finalPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST Food Tax (5%):</span>
                  <span>₹{Math.round(finalPrice * 0.05)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping Fee:</span>
                  <span>{finalPrice >= 1000 ? <strong style={{ color: 'var(--forest-green)' }}>FREE</strong> : `₹80`}</span>
                </div>
                {useWallet && walletBalance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-saffron)', fontWeight: 600 }}>
                    <span>Wallet Deduction:</span>
                    <span>-₹{Math.min(walletBalance, finalPrice + Math.round(finalPrice * 0.05) + (finalPrice >= 1000 ? 0 : 80))}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed var(--cream-border)',
                  paddingTop: '12px',
                  marginTop: '4px',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: 'var(--primary-saffron)'
                }}>
                  <span>Invoice Grand Total:</span>
                  <span>
                    ₹{(finalPrice + Math.round(finalPrice * 0.05) + (finalPrice >= 1000 ? 0 : 80)) - (useWallet ? Math.min(walletBalance, finalPrice + Math.round(finalPrice * 0.05) + (finalPrice >= 1000 ? 0 : 80)) : 0)}
                  </span>
                </div>
              </div>

              {/* Checkout actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsCheckoutOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={ordering} style={{ minWidth: '150px' }}>
                  {ordering ? 'Processing...' : 'Confirm & Pay'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style>{`
        .grid-responsive {
          grid-template-columns: 1.5fr 1fr;
        }
        @media (max-width: 900px) {
          .grid-responsive {
            grid-template-columns: 1fr;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ComboDetail;
