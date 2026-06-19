import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Plus, Trash2, Save, FileText, AlertTriangle, ArrowLeft, Percent, Calculator, ShoppingCart } from 'lucide-react';
import SuggestionModal from '../components/SuggestionModal.jsx';
import Toast from '../components/Toast.jsx';

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

const AdminComboBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Load current user profile for role-based view adjustments
  const userStr = localStorage.getItem('user_profile');
  const user = userStr ? JSON.parse(userStr) : null;
  const isCustomer = false; // Always false in Admin Builder

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

  // Fetch products catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch('/api/products');
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
  }, []);

  // Fetch combo details if in edit mode
  useEffect(() => {
    if (isEditMode && productsCatalog.length > 0) {
      const fetchCombo = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/combos/${id}`);
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
          const response = await fetch('/api/combos/suggest?festivalType=Diwali');
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

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Base Price (₹):</label>
                  <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500 }}>
                    <input 
                      type="checkbox" 
                      checked={autoCalculatePrice}
                      onChange={(e) => setAutoCalculatePrice(e.target.checked)}
                    /> Auto-calc
                  </label>
                </div>
                <input 
                  type="number" 
                  className="form-input" 
                  min="0"
                  disabled={autoCalculatePrice}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Discount Percentage (%):</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="0" 
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
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

            {/* Publication Settings - Hide for Customers */}
            {!isCustomer && (
              <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '16px' }}>
                <label className="form-label">Choose Hamper Status:</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setStatus('Draft')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: status === 'Draft' ? 'var(--charcoal-light)' : 'var(--white)',
                      color: status === 'Draft' ? 'var(--white)' : 'var(--charcoal-light)',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hasOutOfStock = selectedItems.some(item => item.product.stock < item.quantity);
                      if (hasOutOfStock) {
                        setToast({ message: 'Cannot set status to Published while items are out of stock.', type: 'warning' });
                      } else {
                        setStatus('Published');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: status === 'Published' ? 'var(--primary-saffron)' : 'var(--white)',
                      color: status === 'Published' ? 'var(--white)' : 'var(--primary-saffron)',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    Publish
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? (
                <>Saving Hamper...</>
              ) : (
                <>
                  <Save size={18} /> {isEditMode ? 'Update Hamper Pack' : 'Create Hamper Pack'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>

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

export default AdminComboBuilder;
