import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, AlertCircle, CheckCircle, Flame, Calendar, Tag, ShoppingCart } from 'lucide-react';
import Toast from '../components/Toast.jsx';
import API_URL from "../config/api";

const Products = () => {
  const navigate = useNavigate();
  // Load current user profile for role-based view adjustments
  const userStr = localStorage.getItem('user_profile');
  const user = userStr ? JSON.parse(userStr) : null;
  const isCustomer = user && user.role === 'customer';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Billing Checkout States for individual products
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [toast, setToast] = useState(null);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderedSampleProduct, setOrderedSampleProduct] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ itemName: '', total: 0 });

  // Admin Restocking States
  const [restockProductItem, setRestockProductItem] = useState(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [isRestocking, setIsRestocking] = useState(false);

  const handleRestockPrompt = (product) => {
    setRestockProductItem(product);
    setRestockAmount(10);
  };

  const handleRestockSubmit = async () => {
    if (restockAmount <= 0) return;
    setIsRestocking(true);
    try {
      const response = await fetch(`${API_URL}/api/products/${restockProductItem._id}/restock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: restockAmount })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Restock failed');
      }

      setToast({ message: `Successfully added ${restockAmount} units of ${restockProductItem.name}!`, type: 'success' });
      setRestockProductItem(null);
      setRestockAmount(10);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsRestocking(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve product list. Is the backend API running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    if (user) {
      fetch(`${API_URL}/api/wallet/${encodeURIComponent(user.email)}`)
        .then(res => res.ok ? res.json() : { balance: 0 })
        .then(data => setWalletBalance(data.balance || 0))
        .catch(console.error);
    }
  }, []);

  const handleBuyNow = (product) => {
    setSelectedProduct(product);
    setPurchaseQty(1);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setToast({ message: 'Please enter a valid shipping address.', type: 'warning' });
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setToast({ message: 'Please enter a valid 10-digit contact number.', type: 'warning' });
      return;
    }

    setOrdering(true);
    try {
      const giftCharges = giftWrap ? 50 : 0;
      const subtotal = selectedProduct.price * purchaseQty;
      const tax = Math.round(subtotal * 0.05);
      const shipping = subtotal >= 1000 ? 0 : 80;
      const initialTotal = subtotal + tax + shipping + giftCharges;
      const walletApplied = useWallet ? Math.min(walletBalance, initialTotal) : 0;

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.name,
          customerEmail: user.email,
          productId: selectedProduct._id,
          quantity: purchaseQty,
          shippingAddress,
          phoneNumber,
          paymentMethod,
          giftCharges,
          walletApplied
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      const isSample = selectedProduct && selectedProduct.name.toLowerCase().includes('sample');
      setOrderedSampleProduct(isSample);

      const totalAmt = initialTotal - walletApplied;
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      setSuccessInfo({
        itemName: selectedProduct.name,
        total: totalAmt,
        customerPhone: cleanPhone
      });

      // Automatically open WhatsApp Web/App click-to-chat to customer number
      const waText = `Hello ${user.name || 'Customer'},\n\n` +
                     `Your order at Sharadha Stores has been successfully placed!\n\n` +
                     `Order Item: ${selectedProduct.name}\n` +
                     `Total Amount: ₹${totalAmt}\n\n` +
                     `Thank you for shopping with us!`;
      const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setToast({ message: 'Order placed successfully! Stock updated.', type: 'success' });
      localStorage.setItem('has_ordered_this_session', 'true');
      setSelectedProduct(null);
      setShippingAddress('');
      setPhoneNumber('');
      setPurchaseQty(1);
      setShowOrderSuccess(true);
      
      // Reload products list to reflect stock changes
      fetchProducts();

      // Redirect to Customer Orders Log after a short delay
      setTimeout(() => {
        setShowOrderSuccess(false);
        navigate('/orders');
      }, 5000); // 5 seconds delay
    } catch (err) {
      console.error(err);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setOrdering(false);
    }
  };

  const getOrderDates = () => {
    const today = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(today.getDate() + 7); // 7 days delivery promise

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return {
      orderDateStr: today.toLocaleDateString(undefined, options),
      deliveryDateStr: deliveryDate.toLocaleDateString(undefined, options)
    };
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {showOrderSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(21, 15, 11, 0.95)', // Deep traditional chocolate overlay
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          overflow: 'hidden'
        }}>
          {/* Floating sparkles in background */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: 'radial-gradient(rgba(212, 160, 23, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.6
          }}></div>

          {/* Content Box */}
          <div style={{
            textAlign: 'center',
            zIndex: 2,
            animation: 'scaleUpSuccess 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '30px',
            maxWidth: '500px',
            backgroundColor: 'var(--white)',
            border: '3px solid var(--gold)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--dark-charcoal)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Brand Logo with golden pulse */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '2px solid var(--gold)',
                opacity: 0,
                animation: 'successRipple 2.5s ease-out infinite'
              }}></div>
              <img 
                src="/public/images/logo.png" 
                alt="Sharadha Stores Logo" 
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1
                }} 
              />
            </div>

            {/* Success Title */}
            <h2 style={{
              fontSize: '2rem',
              fontFamily: "'Playfair Display', serif",
              color: 'var(--primary-saffron)',
              margin: '0 0 10px 0',
              lineHeight: 1.2
            }}>
              Thank You for Ordering our Product!
            </h2>

            {/* Nice Choice Subtitle */}
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--forest-green)',
              fontWeight: 600,
              margin: '0 0 20px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              ✨ Nice Choice! ✨
            </p>

            {/* Detail Message */}
            <p style={{
              fontSize: '1rem',
              color: 'var(--charcoal-light)',
              lineHeight: 1.6,
              margin: '0 0 24px 0'
            }}>
              You will get the details of your order within 5 to 10 minutes.
            </p>

            {/* Hope you like Sharadha Stores */}
            <div style={{
              borderTop: '1px solid var(--cream-border)',
              paddingTop: '20px',
              width: '100%',
              fontStyle: 'italic',
              color: orderedSampleProduct ? 'var(--gold)' : 'var(--primary-saffron)',
              fontWeight: 600,
              fontSize: '1.25rem',
              animation: orderedSampleProduct ? 'pulseText 1.5s ease-in-out infinite' : 'none'
            }}>
              {orderedSampleProduct ? (
                <span>🎁 I hope you will order a large combo pack for the festivals! 🎁</span>
              ) : (
                <span>I hope you like Sharadha Stores! I think you will visit Sharadha Stores again! ❤️</span>
              )}
            </div>

            {/* WhatsApp Confirmation Button */}
            <a 
              href={`https://wa.me/91${successInfo.customerPhone}?text=${encodeURIComponent(
                `Hello ${user.name || 'Customer'},\n\n` +
                `Your order at Sharadha Stores has been successfully placed!\n\n` +
                `Order Item: ${successInfo.itemName}\n` +
                `Total Amount: ₹${successInfo.total}\n\n` +
                `Thank you for shopping with us!`
              )}`}
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                marginTop: '16px',
                boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Send Confirmation to WhatsApp 💬
            </a>

            {/* Small loading indicator */}
            <div style={{
              width: '100px',
              height: '3px',
              backgroundColor: '#f3f3f3',
              borderRadius: '2px',
              marginTop: '24px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                backgroundColor: 'var(--primary-saffron)',
                animation: 'successLoading 5s linear forwards' // Sync to 5 seconds
              }}></div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', marginTop: '8px' }}>
              Redirecting to tracking orders portal...
            </span>
          </div>

          {/* Keyframe styles */}
          <style>{`
            @keyframes scaleUpSuccess {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes successRipple {
              0% { width: 80px; height: 80px; opacity: 0.8; }
              100% { width: 160px; height: 160px; opacity: 0; }
            }
            @keyframes successLoading {
              from { width: 0%; }
              to { width: 100%; }
            }
            @keyframes pulseText {
              0% { transform: scale(1); }
              50% { transform: scale(1.04); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '6px', fontFamily: 'Playfair Display' }}>
            Traditional Product Catalog
          </h2>
          <p style={{ color: 'var(--charcoal-light)' }}>
            View and manage stocks for home-made sweets and crispy festival savories.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--white)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--cream-border)'
          }}>
            <Database size={18} color="var(--primary-saffron)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Catalog Items: {products.length}</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--white)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--cream-border)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Total Stock Units: {products.reduce((acc, curr) => acc + (curr.stock || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <span>Loading Sharadha Stores catalog...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍲</div>
          <h3>No products in database</h3>
          <p>Please check your backend database configuration.</p>
        </div>
      ) : (
        <div className="grid-4">
          {products.map((product) => {
            const isLowStock = product.stock < 10;
            const isOutOfStock = product.stock === 0;

            return (
              <div 
                key={product._id} 
                className="card" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden'
                }}
              >
                {/* Product Image */}
                <div style={{
                  height: '150px',
                  background: 'var(--cream-dark)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>
                      🍲
                    </div>
                  )}
                  {/* Category Tag */}
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(44, 36, 29, 0.75)',
                    color: 'var(--white)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backdropFilter: 'blur(2px)'
                  }}>
                    {product.category}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, minHeight: '2.4em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.name}
                  </h3>

                  {/* Pricing and Shelf Life */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-saffron)', fontWeight: 700, fontSize: '1.2rem' }}>
                      <span>₹{product.price}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', fontWeight: 400 }}>/unit</span>
                    </div>
                  </div>

                  {/* Ingredients */}
                  {product.ingredients && product.ingredients.length > 0 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--charcoal-light)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      backgroundColor: 'var(--cream-dark)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginTop: '4px'
                    }} title={product.ingredients.join(', ')}>
                      <strong>Ingredients:</strong> {product.ingredients.join(', ')}
                    </div>
                  )}

                  {/* Stock Status Box */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--cream-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {/* Stock Count */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--charcoal-light)' }}>Stock:</span>
                      <span 
                        className={`badge badge-${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}
                        style={{ fontWeight: 700 }}
                      >
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `${product.stock} units (Low!)` : `${product.stock} units`}
                      </span>
                    </div>

                    {/* Shelf Life Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>
                      <Calendar size={12} />
                      <span>Shelf-life: {product.shelfLifeDate || 'N/A'}</span>
                    </div>

                    {/* Availability check */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      {product.availability ? (
                        <span style={{ color: 'var(--forest-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Storefront Available
                        </span>
                      ) : (
                        <span style={{ color: 'var(--red-crimson)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Storefront Suspended
                        </span>
                      )}
                    </div>

                    {/* Buy Now Button for Customers */}
                    {isCustomer && (
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="btn btn-primary"
                        disabled={isOutOfStock || !product.availability}
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          width: '100%',
                          fontSize: '0.9rem'
                        }}
                      >
                        <ShoppingCart size={16} /> Buy Now
                      </button>
                    )}

                    {/* Add Units Button for Admin/Staff */}
                    {user && user.role !== 'customer' && (
                      <button
                        onClick={() => handleRestockPrompt(product)}
                        className="btn btn-secondary"
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          width: '100%',
                          fontSize: '0.9rem',
                          borderColor: 'var(--primary-saffron)',
                          color: 'var(--primary-saffron)',
                          fontWeight: 'bold'
                        }}
                      >
                        ➕ Add Units / Restock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Billing Modal for individual products */}
      {selectedProduct && (() => {
        const { orderDateStr, deliveryDateStr } = getOrderDates();
        const subtotal = selectedProduct.price * purchaseQty;
        const tax = Math.round(subtotal * 0.05);
        const shipping = subtotal >= 1000 ? 0 : 80;
        const giftCharges = giftWrap ? 50 : 0;
        const initialTotal = subtotal + tax + shipping + giftCharges;
        const walletDeduction = useWallet ? Math.min(walletBalance, initialTotal) : 0;
        const total = initialTotal - walletDeduction;

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
                  Secure Product Checkout
                </h3>
                <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--charcoal-light)' }}>
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handlePlaceOrder} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Dates Card */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: 'var(--cream-dark)',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--cream-border)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block' }}>Order Date:</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--dark-charcoal)' }}>{orderDateStr}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block' }}>Estimated Delivery:</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--forest-green)' }}>{deliveryDateStr}</strong>
                  </div>
                </div>

                {/* Product info & Qty selector */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: '1px solid var(--cream-border)',
                  borderRadius: '6px',
                  backgroundColor: '#fffdfa'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block', textTransform: 'uppercase' }}>
                      {selectedProduct.category}
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--primary-saffron)' }}>{selectedProduct.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)', display: 'block' }}>
                      Unit Price: ₹{selectedProduct.price}
                    </span>
                  </div>

                  {/* Quantity counter */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>Quantity:</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--cream-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setPurchaseQty(q => Math.max(1, q - 1))}
                        style={{ padding: '6px 12px', border: 'none', background: 'var(--cream-dark)', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        -
                      </button>
                      <span style={{ padding: '6px 16px', fontWeight: 700, minWidth: '32px', textAlign: 'center', background: 'var(--white)' }}>
                        {purchaseQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPurchaseQty(q => Math.min(selectedProduct.stock, q + 1))}
                        style={{ padding: '6px 12px', border: 'none', background: 'var(--cream-dark)', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)' }}>
                      Max Available: {selectedProduct.stock}
                    </span>
                  </div>
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

                {/* Contact Phone Number */}
                <div className="form-group">
                  <label className="form-label">Contact Phone Number (for confirmations):</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="e.g. 9182730806" 
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(val);
                    }}
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit phone number"
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
                              {/* Gift wrapping option */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#fffdf8',
                  padding: '12px 14px',
                  border: '1.5px solid var(--gold)',
                  borderRadius: '6px',
                  marginTop: '4px',
                  cursor: 'pointer'
                }} onClick={() => setGiftWrap(prev => !prev)}>
                  <input
                    type="checkbox"
                    id="giftWrap"
                    checked={giftWrap}
                    onChange={(e) => {}} // handled by container onClick
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-saffron)' }}
                  />
                  <label htmlFor="giftWrap" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', margin: 0, color: 'var(--dark-charcoal)' }}>
                    <span>🎁 Add Premium Gift Wrapping & Traditional Card</span>
                    <span style={{ color: 'var(--primary-saffron)' }}>+₹50</span>
                  </label>
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
                    marginTop: '8px',
                    cursor: 'pointer'
                  }} onClick={() => setUseWallet(prev => !prev)}>
                    <input
                      type="checkbox"
                      id="useWalletProduct"
                      checked={useWallet}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-saffron)' }}
                    />
                    <label htmlFor="useWalletProduct" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', margin: 0, color: 'var(--dark-charcoal)' }}>
                      <span>💳 Use Wallet Balance (Available: ₹{walletBalance})</span>
                      <span style={{ color: 'var(--primary-saffron)' }}>-₹{walletDeduction}</span>
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
                    <span>Subtotal ({purchaseQty} unit{purchaseQty > 1 ? 's' : ''}):</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST Food Tax (5%):</span>
                    <span>₹{tax}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Shipping Fee:</span>
                    <span>{subtotal >= 1000 ? <strong style={{ color: 'var(--forest-green)' }}>FREE</strong> : `₹80`}</span>
                  </div>
                  {giftWrap && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gift Wrapping Fee:</span>
                      <span>₹50</span>
                    </div>
                  )}
                  {useWallet && walletDeduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-saffron)', fontWeight: 600 }}>
                      <span>Wallet Deduction:</span>
                      <span>-₹{walletDeduction}</span>
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
                    <span>Invoice Grand Total:</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                {/* Checkout actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedProduct(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={ordering} style={{ minWidth: '150px' }}>
                    {ordering ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Restock Modal for Admin/Staff */}
      {restockProductItem && (
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
            border: '3px solid var(--primary-saffron)',
            maxWidth: '400px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            animation: 'modalFade 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '1.3rem', margin: 0, fontFamily: 'Playfair Display', color: 'var(--primary-saffron)' }}>
              Restock Product Units
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--charcoal-light)', margin: 0 }}>
              Add more stock units for <strong>{restockProductItem.name}</strong>. Current stock: <strong>{restockProductItem.stock}</strong>.
            </p>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="restockAmount" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Amount of units to add:</label>
              <input
                id="restockAmount"
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="form-control"
                style={{ padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid var(--cream-border)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => { setRestockProductItem(null); setRestockAmount(10); }} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleRestockSubmit} 
                className="btn btn-primary"
                disabled={isRestocking}
                style={{ minWidth: '100px' }}
              >
                {isRestocking ? 'Updating...' : 'Add Units'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Style */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Products;
