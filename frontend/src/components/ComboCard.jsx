import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Eye, Trash2, Calendar, ShoppingBag, Percent } from 'lucide-react';

const ComboCard = ({ combo, onDelete, onPublishToggle }) => {
  const {
    _id,
    comboName,
    festivalType,
    basePrice,
    discount,
    finalPrice,
    status,
    stockStatus,
    image,
    items
  } = combo;

  // Placeholder images based on festival
  const getPlaceholderGradient = () => {
    switch (festivalType) {
      case 'Diwali':
        return 'linear-gradient(135deg, #e05a26 0%, #cca338 100%)';
      case 'Pongal':
        return 'linear-gradient(135deg, #1f6b28 0%, #cca338 100%)';
      case 'Wedding Return Gift':
        return 'linear-gradient(135deg, #a61c1c 0%, #e05a26 100%)';
      case 'Snack Combo':
        return 'linear-gradient(135deg, #726252 0%, #cca338 100%)';
      default:
        return 'linear-gradient(135deg, #e05a26 0%, #726252 100%)';
    }
  };

  const totalItemsCount = items ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const userStr = localStorage.getItem('user_profile');
  const user = userStr ? JSON.parse(userStr) : null;
  const isCustomer = user && user.role === 'customer';

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 0,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Badges Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10
      }}>
        <span className={`badge badge-${status.toLowerCase()}`}>
          {status}
        </span>
        <span className={`badge badge-${stockStatus.toLowerCase().replace(' ', '-')}`}>
          {stockStatus}
        </span>
      </div>

      {/* Card Header Image */}
      <div style={{
        height: '160px',
        position: 'relative',
        background: getPlaceholderGradient(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--white)'
      }}>
        {image ? (
          <img 
            src={image.startsWith('/images/') ? image : (image.startsWith('/public/images/') ? image.replace('/public/images/', '/images/packaging/') : `/images/packaging/${image}`)} 
            alt={comboName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Fallback to gradient if image fails
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <span style={{ fontSize: '3rem' }}>🏵️</span>
            <div style={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: '1.2rem',
              marginTop: '4px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {festivalType} Pack
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--primary-saffron)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '4px',
          display: 'block'
        }}>
          {festivalType}
        </span>

        <h3 style={{
          fontSize: '1.2rem',
          marginBottom: '10px',
          lineHeight: 1.3,
          minHeight: '2.6em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {comboName}
        </h3>

        {/* Bundle Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          color: 'var(--charcoal-light)',
          marginBottom: '16px'
        }}>
          <ShoppingBag size={14} />
          <span>{items?.length || 0} unique items ({totalItemsCount} total pieces)</span>
        </div>

        {/* Pricing Info */}
        <div style={{
          marginTop: 'auto',
          backgroundColor: 'var(--cream-dark)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--cream-border)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>Price Summary:</span>
            {discount > 0 && (
              <span style={{
                backgroundColor: 'var(--primary-saffron)',
                color: 'var(--white)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Percent size={10} /> {discount}% OFF
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--dark-charcoal)' }}>
              ₹{finalPrice}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: '0.9rem', textDecoration: 'line-through', color: 'var(--charcoal-light)' }}>
                ₹{basePrice}
              </span>
            )}
          </div>
        </div>

        {/* Actions Button Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isCustomer ? '1fr' : '1fr auto auto',
          gap: '8px',
          borderTop: '1px solid var(--cream-border)',
          paddingTop: '16px'
        }}>
          <Link to={`/combos/${_id}`} className="btn btn-secondary" style={{
            padding: '8px 12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            backgroundColor: isCustomer ? 'var(--primary-saffron)' : 'var(--white)',
            color: isCustomer ? 'var(--white)' : 'var(--dark-charcoal)',
            borderColor: isCustomer ? 'var(--primary-saffron)' : 'var(--cream-border)'
          }}>
            <Eye size={14} /> View Details
          </Link>
          
          {!isCustomer && (
            <>
              <Link to={`/admin/builder/${_id}`} className="btn btn-gold" style={{
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} title="Edit Combo">
                <Edit2 size={14} />
              </Link>

              <button onClick={() => onDelete(_id)} className="btn btn-danger" style={{
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} title="Delete Combo">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComboCard;
