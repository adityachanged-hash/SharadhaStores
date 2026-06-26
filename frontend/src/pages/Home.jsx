import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, LayoutDashboard, Gift, Database, ShoppingCart, CheckCircle } from 'lucide-react';
import ComboCard from '../components/ComboCard.jsx';
import API_URL from "../config/api";

const Home = () => {
  const [user, setUser] = useState(null);
  const [publishedCombos, setPublishedCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user_profile');
      setUser(userStr ? JSON.parse(userStr) : null);
    };

    window.addEventListener('storage', checkAuth);
    checkAuth();

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Fetch published combos if customer is logged in
  useEffect(() => {
    if (user && user.role === 'customer') {
      const fetchPublished = async () => {
        setLoadingCombos(true);
        try {
          const response = await fetch(`${API_URL}/api/combos?status=Published`);
          if (response.ok) {
            const data = await response.json();
            setPublishedCombos(data);
          }
        } catch (err) {
          console.error('Error fetching published combos:', err);
        } finally {
          setLoadingCombos(false);
        }
      };
      fetchPublished();
    }
  }, [user]);

  // Determine actions based on user session
  const renderHeroActions = () => {
    if (!user) {
      return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Sign In to Portal <ArrowRight size={18} />
          </Link>
        </div>
      );
    }

    if (user.role === 'customer') {
      return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Browse Store Products <Database size={18} />
          </Link>
          <a href="#storefront" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Explore Hampers Box 🏵️
          </a>
        </div>
      );
    }

    // Admin / Inventory / Dispatch
    const showBuilderLink = ['admin', 'inventory_manager'].includes(user.role);

    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {showBuilderLink && (
          <Link to="/admin/builder" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            Create Combo Pack <ArrowRight size={18} />
          </Link>
        )}
        <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
          <LayoutDashboard size={18} /> Go to Dashboard
        </Link>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '48px',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--white)',
        border: '1px solid var(--cream-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        alignItems: 'center',
        borderTop: '6px solid var(--primary-saffron)'
      }}>
        {/* Left Side: Traditional Copy */}
        <div style={{ padding: '60px 48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-saffron-light)',
            color: 'var(--primary-saffron)',
            padding: '6px 14px',
            borderRadius: '50px',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}>
            <Sparkles size={14} /> Traditional Homemade Delicacies
          </div>

          {user && (
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>
              Namaste, {user.name} ({user.roleLabel})
            </div>
          )}

          <h1 style={{
            fontSize: '3rem',
            lineHeight: 1.1,
            marginBottom: '20px',
            color: 'var(--dark-charcoal)'
          }}>
            Festival Combo <br />
            <span style={{ color: 'var(--primary-saffron)' }}>Pack Builder</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--charcoal-light)',
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            {!user 
              ? 'Welcome to the Sharadha Stores design and inventory coordination portal. Sign in using your credentials to design custom sweets hampers, view stock reports, or browse our storefront.'
              : user.role === 'customer'
              ? 'Browse our assortment of authentic traditional sweets, snacks, and condiments. Order custom pre-packaged festival boxes complete with greeting notes and fast shipping.'
              : 'Access the interactive combo builder tool, review active ingredients list, track stock alerts, and verify packing manifestations for our dispatch crew.'
            }
          </p>

          {renderHeroActions()}
        </div>

        {/* Right Side: Traditional Vector Banner / High-Quality Image */}
        <div style={{
          height: '100%',
          minHeight: '400px',
          background: 'linear-gradient(135deg, rgba(226, 90, 38, 0.9) 0%, rgba(166, 28, 28, 0.9) 100%), url("https://images.unsplash.com/photo-1596560548464-f010689b7f1e?w=800&auto=format&fit=crop&q=60") no-repeat center/cover',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--white)',
          padding: '40px',
          textAlign: 'center',
          borderLeft: '1px solid var(--cream-border)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--gold-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7a5f14',
            fontSize: '2.5rem',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}>
            🏵️
          </div>
          <h2 style={{ color: 'var(--white)', fontSize: '2rem', marginBottom: '8px', fontFamily: 'Playfair Display' }}>
            Pure & Homemade
          </h2>
          <p style={{ maxWidth: '300px', fontSize: '0.95rem', opacity: 0.9 }}>
            Handcrafted sweets and savories made with traditional heritage recipes and fresh ingredients.
          </p>
        </div>
      </section>

      {/* Customer Storefront View (Show Published Combos only if Customer Logged In) */}
      {user && user.role === 'customer' && (
        <section id="storefront" style={{ scrollMarginTop: '120px' }}>
          <h2 className="section-title">Special Festival Gift Boxes</h2>
          
          {loadingCombos ? (
            <div className="loader-container">
              <div className="loader"></div>
              <span>Fetching premium hampers catalog...</span>
            </div>
          ) : publishedCombos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎁</div>
              <h3>No gift packs currently available</h3>
              <p>Our store admin is preparing special festival boxes. Please check back later!</p>
            </div>
          ) : (
            <div className="grid-3">
              {publishedCombos.map(combo => (
                <div key={combo._id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Reuse ComboCard but override the actions to represent a Customer's view */}
                  <ComboCard 
                    combo={combo} 
                    onDelete={() => {}} // Disabled for customers
                    onPublishToggle={() => {}} // Disabled for customers
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Overview of Feature Cards */}
      <section>
        <h2 className="section-title">Hamper Creation Workflow</h2>
        <div className="grid-4">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>1. Track Stock</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--charcoal-light)' }}>
              Check availability of Laddus, Mysore Pak, Murukku and track depletion levels on the Dashboard.
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🪄</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>2. Smart Suggestions</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--charcoal-light)' }}>
              Generate automatic rule-based bundles, name suggestions, and gifting notes tailored to specific festivals.
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏷️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>3. Dynamic Pricing</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--charcoal-light)' }}>
              Specify products and quantities, set custom discounts, and preview final price calculations instantly.
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📦</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>4. Process & Pack</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--charcoal-light)' }}>
              Lock in inventory, verify packaging readiness, and output dispatch logs for the packaging floor.
            </p>
          </div>
        </div>
      </section>

      {/* Traditional Indian Brand Quote */}
      <section style={{
        textAlign: 'center',
        padding: '60px 24px',
        backgroundColor: 'var(--cream-dark)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--cream-border)',
        backgroundImage: 'radial-gradient(var(--border-light) 0.5px, transparent 0.5px)',
        backgroundSize: '16px 16px'
      }}>
        <span style={{ fontSize: '2.5rem', color: 'var(--gold)' }}>🪔</span>
        <blockquote style={{
          fontFamily: 'Playfair Display',
          fontSize: '1.6rem',
          fontWeight: 600,
          color: 'var(--dark-charcoal)',
          maxWidth: '800px',
          margin: '16px auto 20px',
          lineHeight: 1.4
        }}>
          "Sweets to celebrate new beginnings, savories to spark laughter, and pure ingredients to ensure good health. Sharing the taste of tradition, one box at a time."
        </blockquote>
        <cite style={{
          fontFamily: 'Outfit',
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.85rem',
          color: 'var(--primary-saffron)',
          letterSpacing: '2px',
          fontStyle: 'normal'
        }}>
          Sharadha Stores &middot; Chennai, India
        </cite>
      </section>

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

export default Home;
