import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import API_URL from "../config/api";

const SuggestionModal = ({ isOpen, onClose, onApply }) => {
  const [selectedFestival, setSelectedFestival] = useState('Diwali');
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestion = async (festival) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/combos/suggest?festivalType=${festival}`);
      if (!response.ok) {
        throw new Error('Failed to fetch smart suggestions');
      }
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};
      setSuggestion(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve suggestions. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestion(selectedFestival);
    }
  }, [isOpen, selectedFestival]);

  if (!isOpen) return null;

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
      zIndex: 1050,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles color="var(--primary-saffron)" size={22} className="shake-hover" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Smart Festival Combo Suggestion</h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--charcoal-light)'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Select Festival Tabs */}
          <div style={{ marginBottom: '24px' }}>
            <span className="form-label" style={{ marginBottom: '8px' }}>Select Festival Type:</span>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              backgroundColor: 'var(--cream-dark)',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-border)'
            }}>
              {['Diwali', 'Pongal', 'Sankranti', 'Holi', 'Raksha Bandhan', 'Eid', 'Christmas', 'Wedding Return Gift', 'Snack Combo'].map((fest) => (
                <button
                  key={fest}
                  onClick={() => setSelectedFestival(fest)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    backgroundColor: selectedFestival === fest ? 'var(--primary-saffron)' : 'transparent',
                    color: selectedFestival === fest ? 'var(--white)' : 'var(--charcoal-light)',
                    transition: 'var(--transition-fast)',
                    minWidth: '100px'
                  }}
                >
                  {fest}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestion Preview Content */}
          {loading ? (
            <div className="loader-container">
              <div className="loader"></div>
              <span>Analyzing traditional recipes and items...</span>
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          ) : suggestion ? (
            <div>
              {/* Proposal Box */}
              <div style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                backgroundColor: 'var(--cream-dark)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-saffron)', margin: 0 }}>
                    {suggestion.comboName}
                  </h3>
                  <span className="badge badge-published" style={{ backgroundColor: 'var(--gold-light)', color: '#7a5f14', border: '1px solid var(--gold)' }}>
                    ✨ Recommended {suggestion.discount}% Off
                  </span>
                </div>

                <p style={{ fontSize: '0.95rem', color: 'var(--dark-charcoal)', marginBottom: '16px', fontStyle: 'italic' }}>
                  "{suggestion.description}"
                </p>

                {/* Items Assortment */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--charcoal-light)', marginBottom: '8px' }}>
                    Suggested Product Bundle:
                  </h4>
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {suggestion.items && suggestion.items.length > 0 ? (
                      suggestion.items.map((item, index) => {
                        const isLowStock = item.product && item.product.stock < 10;
                        const isOutOfStock = item.product && item.product.stock < item.quantity;
                        return (
                          <li key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px dashed var(--border-light)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: 'var(--primary-saffron)' }}>🏵️</span>
                              <span style={{ fontWeight: 500 }}>{item.product ? item.product.name : 'Unknown Product'}</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>(₹{item.product ? item.product.price : 0} each)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: 600, backgroundColor: 'var(--white)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                                Qty: {item.quantity}
                              </span>
                              {isOutOfStock ? (
                                <span title="Out of stock for this quantity!" style={{ color: 'var(--red-crimson)', display: 'flex', alignItems: 'center' }}>
                                  <AlertTriangle size={16} />
                                </span>
                              ) : isLowStock ? (
                                <span title="Low Stock warning" style={{ color: '#d4a017', display: 'flex', alignItems: 'center' }}>
                                  <AlertTriangle size={16} />
                                </span>
                              ) : (
                                <span title="Available" style={{ color: 'var(--forest-green)', display: 'flex', alignItems: 'center' }}>
                                  <Check size={16} />
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li style={{ color: 'var(--red-crimson)', fontSize: '0.9rem' }}>
                        ⚠️ No products matching this festival theme found in stock.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Gift Note */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--charcoal-light)', marginBottom: '4px' }}>
                    Suggested Gift Note:
                  </h4>
                  <div style={{
                    backgroundColor: 'var(--white)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--cream-border)',
                    fontSize: '0.9rem',
                    color: 'var(--charcoal-light)',
                    lineHeight: 1.4
                  }}>
                    {suggestion.giftNote}
                  </div>
                </div>
              </div>

              {/* Apply / Cancel */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onApply(suggestion);
                    onClose();
                  }}
                  className="btn btn-primary"
                  disabled={!suggestion.items || suggestion.items.length === 0}
                >
                  <Sparkles size={16} /> Apply Suggestion
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--charcoal-light)' }}>
              <HelpCircle size={48} color="var(--gold)" />
              <p style={{ marginTop: '12px' }}>Please choose a festival above to see smart suggestions.</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalFade {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SuggestionModal;
