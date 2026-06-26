import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Plus, Trash2, Save, FileText, AlertTriangle, ArrowLeft, Percent, Calculator, ShoppingCart } from 'lucide-react';
import SuggestionModal from '../components/SuggestionModal.jsx';
import Toast from '../components/Toast.jsx';
import API_URL from "../config/api";

const getFestivalPackingPreview = (type) => {
  switch (type) {
    case 'Diwali':
      return {
        image: '/public/images/packaging/gift_pack.png',
        title: 'Royal Diwali Shahi Gift Box',
        desc: 'A premium golden-foiled box decorated with traditional diyas and floral motifs, wrapped in saffron ribbon. Ideal for Diwali gifting.'
      };
    case 'Pongal':
      return {
        image: '/public/images/packaging/combo_pack.png',
        title: 'Pongal Traditional Harvest Assortment',
        desc: 'An eco-friendly partitioned hamper representing the traditional harvest festival, sealed with a fresh sugarcane pattern.'
      };
    case 'Sankranti':
      return {
        image: '/public/images/packaging/combo_pack.png',
        title: 'Sankranti Traditional Harvest Pack',
        desc: 'An eco-friendly partitioned hamper representing the traditional harvest festival, sealed with a fresh sugarcane pattern.'
      };
    case 'Holi':
      return {
        image: '/public/images/packaging/gift_pack.png',
        title: 'Holi Gulal & Sweet Shahi Box',
        desc: 'A premium box adorned with color splash patterns, wrapped in saffron ribbon. Ideal for sharing festive sweet joy.'
      };
    case 'Raksha Bandhan':
      return {
        image: '/public/images/packaging/gift_pack.png',
        title: 'Rakhi Premium Gifting Box',
        desc: 'An exquisite box decorated with beautiful Rakhi motifs and golden ribbons. Perfect for sibling sweets celebrations.'
      };
    case 'Eid':
      return {
        image: '/public/images/packaging/gift_pack.png',
        title: 'Eid Mubarak Shahi Box',
        desc: 'A premium crescent-adorned box wrapped in elegant ribbons. Perfect for sharing festive sweetness.'
      };
    case 'Christmas':
      return {
        image: '/public/images/packaging/gift_pack.png',
        title: 'Merry Christmas Holiday Box',
        desc: 'A festive red-and-green theme gift box wrapped in ribbon, bringing sweet warmth and holiday wishes.'
      };
    case 'Wedding Return Gift':
      return {
        image: '/public/images/packaging/gift_pack.png',
        title: 'Vivah Shahi Return Gift Pack',
        desc: 'An exquisite red-gold velvet-textured packaging designed for wedding ceremonies and prestige family return gifts.'
      };
    case 'Snack Combo':
      return {
        image: '/public/images/packaging/combo_pack.png',
        title: 'Saffron Crispy & Sweet Combo Box',
        desc: 'A moisture-locked partitioned snack container ideal for savories like Murukku/Mathri alongside traditional Ghee sweets.'
      };
    default:
      return {
        image: '/public/images/packaging/combo_pack.png',
        title: 'Custom Assorted Hamper Box',
        desc: 'Your custom selection of traditional sweets and savories arranged in our classic saffron partitioned container.'
      };
  }
};

const CustomerComboBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Load current user profile for role-based view adjustments
  const userStr = localStorage.getItem('user_profile');
  const user = userStr ? JSON.parse(userStr) : null;
  const isCustomer = true; // Always true in Customer Builder

  // Form State
  const [comboName, setComboName] = useState('');
  const [festivalType, setFestivalType] = useState('Diwali');
  const [selectedItems, setSelectedItems] = useState([]); // Array of { product: Object, quantity: Number }
  const [basePrice, setBasePrice] = useState(0);
  const [autoCalculatePrice, setAutoCalculatePrice] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [giftNote, setGiftNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('Draft');
  const [shelfLifeDate, setShelfLifeDate] = useState('');

  // Catalog State
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addItemQuantity, setAddItemQuantity] = useState(1);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [toast, setToast] = useState(null);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderedSampleProduct, setOrderedSampleProduct] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [successInfo, setSuccessInfo] = useState({ itemName: '', total: 0 });

  // Billing Checkout States for customer custom combos
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [giftWrap, setGiftWrap] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  // Fetch products catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`);
        if (response.ok) {
          const data = await response.json();
          setProductsCatalog(data);
          if (data.length > 0) {
            setSelectedProductId(data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();

    if (user) {
      fetch(`${API_URL}/api/wallet/${encodeURIComponent(user.email)}`)
        .then(res => res.ok ? res.json() : { balance: 0 })
        .then(data => setWalletBalance(data.balance || 0))
        .catch(console.error);
    }
  }, []);

  // Fetch combo details if in edit mode
  useEffect(() => {
    if (isEditMode && productsCatalog.length > 0) {
      const fetchCombo = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/combos/${id}`);
          if (!response.ok) throw new Error('Combo not found');
          const data = await response.json();
          
          setComboName(data.comboName);
          setFestivalType(data.festivalType);
          setDiscount(data.discount);
          setGiftNote(data.giftNote);
          setImageUrl(data.image);
          setStatus(data.status);
          
          // Re-map items (product ID or Object reference)
          const mappedItems = data.items.map(item => {
            // Find full product in catalog
            const product = productsCatalog.find(p => p._id === (item.product._id || item.product));
            return {
              product: product || { _id: item.product, name: 'Unknown Product', price: 0, stock: 0 },
              quantity: item.quantity
            };
          });
          setSelectedItems(mappedItems);
          setBasePrice(data.basePrice);
          setAutoCalculatePrice(false); // Let user edit manual pricing if loaded

          // Extract shortest shelf-life or default
          if (productClosestShelfLife(mappedItems)) {
            setShelfLifeDate(productClosestShelfLife(mappedItems));
          }
        } catch (err) {
          console.error(err);
          setToast({ message: 'Error loading combo pack for editing.', type: 'error' });
        } finally {
          setLoading(false);
        }
      };
      fetchCombo();
    }
  }, [isEditMode, id, productsCatalog]);

  // Auto-suggest default Diwali combo pack on new creation
  useEffect(() => {
    if (!isEditMode && productsCatalog.length > 0) {
      const loadDefaultSuggestion = async () => {
        try {
          const response = await fetch(`${API_URL}/api/combos/suggest?festivalType=Diwali`);
          if (response.ok) {
            const suggestedCombo = await response.json();
            setComboName(suggestedCombo.comboName);
            setFestivalType(suggestedCombo.festivalType);
            setDiscount(suggestedCombo.discount);
            setGiftNote(suggestedCombo.giftNote);
            
            const mapped = (suggestedCombo.items || []).map(item => {
              const catalogProd = productsCatalog.find(p => p._id === (item.product._id || item.product));
              return {
                product: catalogProd || item.product,
                quantity: item.quantity
              };
            });
            setSelectedItems(mapped);
            
            if (productClosestShelfLife(mapped)) {
              setShelfLifeDate(productClosestShelfLife(mapped));
            }
            setToast({ message: 'Suggested traditional Diwali festival combo!', type: 'success' });
          }
        } catch (err) {
          console.error('Error loading default suggestion:', err);
        }
      };
      loadDefaultSuggestion();
    }
  }, [isEditMode, productsCatalog]);

  // Helper to get nearest shelf life date based on selected items
  const productClosestShelfLife = (itemsList) => {
    if (itemsList.length === 0) return '';
    const dates = itemsList
      .map(item => item.product.shelfLifeDate)
      .filter(d => !!d)
      .sort();
    return dates.length > 0 ? dates[0] : '';
  };

  // Re-run auto calculation of base price and shortest shelf life
  useEffect(() => {
    if (autoCalculatePrice) {
      const calculatedBase = selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      setBasePrice(calculatedBase);
    }
    
    // Automatically set shortest shelf life
    if (selectedItems.length > 0 && !shelfLifeDate) {
      setShelfLifeDate(productClosestShelfLife(selectedItems));
    }
  }, [selectedItems, autoCalculatePrice]);

  // Run live stock status warnings checks
  useEffect(() => {
    const warnings = [];
    selectedItems.forEach(item => {
      const product = item.product;
      if (product.stock < item.quantity) {
        warnings.push(`⚠️ ${product.name} is OUT OF STOCK. Required: ${item.quantity}, Available: ${product.stock}`);
      } else if (product.stock < 10) {
        warnings.push(`⚠️ ${product.name} is LOW IN STOCK. Available: ${product.stock}`);
      }
    });
    setStockWarnings(warnings);
  }, [selectedItems]);

  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  // Add product to items array
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = productsCatalog.find(p => p._id === selectedProductId);
    if (!product) return;

    const quantity = Number(addItemQuantity);
    if (quantity < 1) {
      setToast({ message: 'Quantity must be at least 1.', type: 'warning' });
      return;
    }

    // Check if already added
    const existingIndex = selectedItems.findIndex(item => item.product._id === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += quantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { product, quantity }]);
    }

    setToast({ message: `Added ${product.name} to bundle.`, type: 'success' });
  };

  // Remove product from items array
  const handleRemoveItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.product._id !== productId));
  };

  // Adjust item quantity inside array
  const handleUpdateItemQty = (productId, qty) => {
    const quantity = Number(qty);
    if (quantity < 1) return;
    const updated = selectedItems.map(item => {
      if (item.product._id === productId) {
        return { ...item, quantity };
      }
      return item;
    });
    setSelectedItems(updated);
  };

  // Apply suggestion from SuggestionModal
  const handleApplySuggestion = (suggestedCombo) => {
    setComboName(suggestedCombo.comboName);
    setFestivalType(suggestedCombo.festivalType);
    setDiscount(suggestedCombo.discount);
    setGiftNote(suggestedCombo.giftNote);
    setAutoCalculatePrice(true);

    // Map suggested products
    const mapped = (suggestedCombo.items || []).map(item => {
      const fullProd = productsCatalog.find(p => p._id === item.product._id);
      return {
        product: fullProd || item.product,
        quantity: item.quantity
      };
    });

    setSelectedItems(mapped);
    
    // Automatically set shortest shelf life based on suggested items
    setShelfLifeDate(productClosestShelfLife(mapped));

    setToast({ message: 'Loaded traditional suggestions!', type: 'success' });
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!comboName.trim()) {
      setToast({ message: 'Please enter a combo pack name.', type: 'error' });
      return;
    }

    if (selectedItems.length === 0) {
      setToast({ message: 'Please select at least one product for the combo pack.', type: 'error' });
      return;
    }

    if (!shelfLifeDate) {
      setToast({ message: 'Please specify a shelf-life date.', type: 'error' });
      return;
    }

    // Check if any product is out of stock when publishing
    if (status === 'Published') {
      const hasOutOfStock = selectedItems.some(item => item.product.stock < item.quantity);
      if (hasOutOfStock) {
        setToast({ 
          message: 'Cannot publish combo. One or more items are out of stock. Please save as Draft instead.', 
          type: 'error' 
        });
        return;
      }
    }

    const payload = {
      comboName,
      festivalType,
      items: selectedItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      basePrice,
      discount,
      giftNote,
      image: imageUrl || getFestivalPackingPreview(festivalType).image,
      status
    };

    setLoading(true);
    try {
      const url = isEditMode ? `/api/combos/${id}` : '/api/combos';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save combo pack');
      }

      setToast({ 
        message: isEditMode ? 'Combo pack updated successfully!' : 'Combo pack created successfully!', 
        type: 'success' 
      });

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error(err);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCheckoutInit = () => {
    if (!comboName.trim()) {
      setToast({ message: 'Please enter a name for your custom hamper.', type: 'error' });
      return;
    }
    if (selectedItems.length === 0) {
      setToast({ message: 'Please select at least one product for your custom hamper.', type: 'error' });
      return;
    }
    const hasOutOfStock = selectedItems.some(item => item.product.stock < item.quantity);
    if (hasOutOfStock) {
      setToast({ message: 'Cannot checkout. One or more selected products are out of stock.', type: 'error' });
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handlePlaceCustomerOrder = async (e) => {
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
      // 1. Create the Custom Combo first
      const comboPayload = {
        comboName: comboName || `${festivalType} Custom Hamper`,
        festivalType,
        items: selectedItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        basePrice,
        discount: 0,
        giftNote,
        image: imageUrl || getFestivalPackingPreview(festivalType).image,
        status: 'Draft' // Keep as draft so it doesn't appear on general storefront
      };

      const comboRes = await fetch(`${API_URL}/api/combos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comboPayload)
      });

      const comboData = await comboRes.json();
      if (!comboRes.ok) {
        throw new Error(comboData.message || 'Failed to create custom combo.');
      }

      const newComboId = comboData.combo._id;

      // 2. Create the Order
      const subtotal = finalPrice;
      const tax = Math.round(subtotal * 0.05);
      const shipping = subtotal >= 1000 ? 0 : 80;
      const giftCharges = giftWrap ? 50 : 0;
      const total = subtotal + tax + shipping + giftCharges;

      const orderPayload = {
        customerName: user.name,
        customerEmail: user.email,
        comboId: newComboId,
        shippingAddress,
        phoneNumber,
        paymentMethod,
        giftCharges,
        walletApplied: useWallet ? Math.min(walletBalance, total) : 0
      };

      const orderRes = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        // If order fails, try to clean up the combo
        await fetch(`${API_URL}/api/combos/${newComboId}`, { method: 'DELETE' });
        throw new Error(orderData.message || 'Failed to place order.');
      }

      const isSample = selectedItems.some(item => item.product && item.product.name && item.product.name.toLowerCase().includes('sample'));
      setOrderedSampleProduct(isSample);

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      setSuccessInfo({
        itemName: comboName || `${festivalType} Custom Hamper`,
        total: total,
        customerPhone: cleanPhone
      });

      // Automatically open WhatsApp Web/App click-to-chat to customer number
      const waText = `Hello ${user.name || 'Customer'},\n\n` +
                     `Your custom hamper order at Sharadha Stores has been successfully placed!\n\n` +
                     `Order Item: ${comboName || `${festivalType} Custom Hamper`}\n` +
                     `Total Amount: ₹${total}\n\n` +
                     `Thank you for shopping with us!`;
      const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setToast({ message: 'Custom combo order placed successfully!', type: 'success' });
      localStorage.setItem('has_ordered_this_session', 'true');
      setIsCheckoutOpen(false);
      setShowOrderSuccess(true);
      
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

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Suggestion Modal */}
      <SuggestionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onApply={handleApplySuggestion}
      />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display', margin: 0 }}>
            {isEditMode ? 'Edit Festival Combo Pack' : 'Create New Combo Pack'}
          </h2>
          <p style={{ color: 'var(--charcoal-light)', margin: 0 }}>
            Assemble products, apply discounts, set greetings, and verify live stock.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '32px' }} className="grid-responsive">
        
        {/* Left Side: Builder Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Core details */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--cream-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-saffron)', margin: 0 }}>Hamper Core Details</h3>
              
              <button 
                type="button" 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-gold" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Sparkles size={14} /> Generate Smart Suggestions
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Combo Pack Name:</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Diwali Delight Premium Hamper" 
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Festival Type:</label>
                <select 
                  className="form-select"
                  value={festivalType}
                  onChange={(e) => setFestivalType(e.target.value)}
                >
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
              </div>

              <div className="form-group">
                <label className="form-label">Shelf-life Date:</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={shelfLifeDate}
                  onChange={(e) => setShelfLifeDate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', display: 'block', marginTop: '4px' }}>
                  Recommended: Nearest shelf-life of items.
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL:</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://example.com/images/diwali-combo.jpg" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: Select Items */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-saffron)', borderBottom: '1px solid var(--cream-border)', paddingBottom: '12px', margin: 0 }}>
              Select Products Assortment
            </h3>

            {catalogLoading ? (
              <span>Loading products catalog...</span>
            ) : (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label className="form-label">Choose Product:</label>
                  <select 
                    className="form-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {productsCatalog.map(p => (
                      <option key={p._id} value={p._id} disabled={p.stock === 0}>
                        {p.name} (Price: ₹{p.price} | Stock: {p.stock} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ width: '80px' }}>
                  <label className="form-label">Quantity:</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="1" 
                    value={addItemQuantity}
                    onChange={(e) => setAddItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="btn btn-secondary" 
                  style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '45px', border: '1px solid var(--gold)', color: '#7a5f14' }}
                >
                  <Plus size={16} /> Add Product
                </button>
              </div>
            )}

            {/* Selected Items List */}
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--charcoal-light)', marginBottom: '12px' }}>
                Current Bundle Items ({selectedItems.length})
              </h4>
              
              {selectedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--charcoal-light)' }}>
                  <ShoppingBag size={32} color="var(--gold)" style={{ marginBottom: '8px' }} />
                  <p>No products added. Select a product above to begin assembling the hamper.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedItems.map((item) => {
                    const product = item.product;
                    const itemTotal = product.price * item.quantity;
                    const hasStockError = product.stock < item.quantity;
                    const hasStockWarning = product.stock < 10;

                    return (
                      <div 
                        key={product._id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          border: `1px solid ${hasStockError ? 'var(--red-crimson)' : 'var(--cream-border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: hasStockError ? 'var(--red-crimson-light)' : 'var(--cream-dark)',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.5rem' }}>🏵️</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>
                              Unit Price: ₹{product.price} | Stock: {product.stock} units
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {/* Qty Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>Qty:</span>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ width: '60px', padding: '6px' }}
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQty(product._id, e.target.value)}
                            />
                          </div>

                          {/* Cost */}
                          <span style={{ fontWeight: 700, width: '60px', textAlign: 'right' }}>
                            ₹{itemTotal}
                          </span>

                          {/* Delete */}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(product._id)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red-crimson)', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pricing and Notes */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-saffron)', borderBottom: '1px solid var(--cream-border)', paddingBottom: '12px', margin: 0 }}>
              Hamper Pricing & Gifting Notes
            </h3>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Base Price (₹):</label>
                <input 
                  type="number" 
                  className="form-input" 
                  disabled
                  value={basePrice}
                />
              </div>

              <div className="form-group" style={{ display: 'none' }}>
                <label className="form-label">Discount Percentage (%):</label>
                <input 
                  type="number" 
                  className="form-input" 
                  disabled
                  value={0}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Gifting Note / Greeting Message:</label>
              <textarea 
                className="form-textarea" 
                placeholder="e.g. Wishing you a happy harvest and a sweet year ahead!" 
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Right Side: Price Preview & Save Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Live Preview Panel */}
          <div className="card" style={{
            border: '2px solid var(--gold)',
            boxShadow: 'var(--shadow-saffron)',
            background: 'var(--white)',
            position: 'sticky',
            top: '100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ 
              fontSize: '1.4rem', 
              color: 'var(--primary-saffron)', 
              borderBottom: '1px solid var(--cream-border)', 
              paddingBottom: '12px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Calculator size={18} /> Live Hamper Summary
            </h3>

            {/* Packaging Style Preview */}
            {(() => {
              const preview = getFestivalPackingPreview(festivalType);
              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: '1px solid var(--cream-border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--cream-dark)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={preview.image} 
                      alt={preview.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.06)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'var(--primary-saffron)',
                      color: 'var(--white)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {festivalType} Packing
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px', textAlign: 'left' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--dark-charcoal)', display: 'block' }}>{preview.title}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--charcoal-light)', lineHeight: 1.3 }}>
                      {preview.desc}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Calculations Breakup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--charcoal-light)' }}>Hamper Items:</span>
                <span style={{ fontWeight: 600 }}>{selectedItems.length} unique products</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--charcoal-light)' }}>Gross Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{basePrice}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--red-crimson)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Percent size={14} /> Discount ({discount}%):
                  </span>
                  <span>- ₹{Math.round(basePrice * (discount / 100))}</span>
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
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Final Combo Price:</span>
                <span style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--primary-saffron)' }}>
                  ₹{finalPrice}
                </span>
              </div>
            </div>

            {/* Stock Warnings Display */}
            {stockWarnings.length > 0 && (
              <div className="alert alert-warning" style={{ margin: 0, padding: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {stockWarnings.map((warning, index) => (
                    <span key={index}>{warning}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Save / Checkout Button */}
            <button 
              type="button" 
              onClick={handleCustomerCheckoutInit} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading}
            >
              <ShoppingCart size={18} /> Proceed to Checkout
            </button>
          </div>
        </div>

      </div>

      {/* Checkout Billing Modal for Custom Hampers */}
      {isCheckoutOpen && (() => {
        const { orderDateStr, deliveryDateStr } = getOrderDates();
        const subtotal = finalPrice;
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
                  Secure Custom Checkout
                </h3>
                <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--charcoal-light)' }}>
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handlePlaceCustomerOrder} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                {/* Custom Combo Info */}
                <div style={{ backgroundColor: 'var(--cream-dark)', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--cream-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)', display: 'block' }}>Ordering Custom Hamper:</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary-saffron)' }}>{comboName || 'My Custom Hamper'}</strong>
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
                      id="useWallet"
                      checked={useWallet}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-saffron)' }}
                    />
                    <label htmlFor="useWallet" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', margin: 0, color: 'var(--dark-charcoal)' }}>
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
                    <span>Items Subtotal:</span>
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
                    fontSize: '1.2rem',
                    color: 'var(--primary-saffron)'
                  }}>
                    <span>Grand Total:</span>
                    <span>₹{total}</span>
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
        );
      })()}

      <style>{`
        .grid-responsive {
          grid-template-columns: 1.6fr 1fr;
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
      `}</style>
    </div>
  );
};

export default CustomerComboBuilder;
