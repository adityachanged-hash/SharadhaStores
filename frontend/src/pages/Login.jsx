import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, Sparkles, AlertCircle } from 'lucide-react';
import Toast from '../components/Toast.jsx';

const Login = () => {
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Quick fill logins for easy prototyping/testing
  const handleQuickLogin = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both Email and Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save user session details in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_profile', JSON.stringify(data.user));

      setLoggedInUser(data.user);
      setShowWelcome(true);

      // Dispatch custom storage event so Navbar updates immediately
      window.dispatchEvent(new Event('storage'));

      // Redirect depending on user role after 3.2 seconds welcome animation
      setTimeout(() => {
        if (data.user.role === 'customer') {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      }, 5000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {showWelcome && loggedInUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#150f0b', // Deep traditional chocolate background
          backgroundImage: 'radial-gradient(circle at center, #2e1d14 0%, #150f0b 100%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          overflow: 'hidden'
        }}>
          {/* Large animated background logo */}
          <img
            src="/logo.png"
            alt=""
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              objectFit: 'cover',
              opacity: 0.04,
              filter: 'grayscale(1)',
              animation: 'rotateBgLogo 20s linear infinite',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Elegant floating background dust particles */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 2,
            backgroundImage: 'radial-gradient(rgba(212, 160, 23, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.7,
            animation: 'driftBg 10s linear infinite'
          }}></div>

          {/* Floating animated logo particles rising like embers */}
          <div className="floating-particle" style={{ left: '10%', animationDelay: '0s', animationDuration: '7s' }}><Gift size={24} /></div>
          <div className="floating-particle" style={{ left: '30%', animationDelay: '2s', animationDuration: '9s' }}><Gift size={16} /></div>
          <div className="floating-particle" style={{ left: '70%', animationDelay: '1s', animationDuration: '8s' }}><Gift size={20} /></div>
          <div className="floating-particle" style={{ left: '85%', animationDelay: '3.5s', animationDuration: '10s' }}><Gift size={15} /></div>

          {/* Content Container */}
          <div style={{
            textAlign: 'center',
            zIndex: 3,
            animation: 'scaleUpWelcome 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px'
          }}>
            {/* Glowing Central Logo with Ripple Rings */}
            <div style={{ position: 'relative', marginBottom: '28px' }}>
              {/* Ripple Ring 1 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '2px solid var(--primary-saffron)',
                opacity: 0,
                animation: 'ripple 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
                pointerEvents: 'none'
              }}></div>

              {/* Ripple Ring 2 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '2px solid var(--gold)',
                opacity: 0,
                animation: 'ripple 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
                animationDelay: '1s',
                pointerEvents: 'none'
              }}></div>

              {/* Saffron Glowing Central Logo */}
              <img
                src="/logo.png"
                alt="Sharadha Stores Logo"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--gold)',
                  boxShadow: '0 0 40px rgba(224, 90, 38, 0.6), 0 0 80px rgba(224, 90, 38, 0.3)',
                  position: 'relative',
                  zIndex: 2,
                  animation: 'bounceLogo 2s ease-in-out infinite'
                }}
              />
            </div>

            {/* Store Name Title */}
            <h1 style={{
              fontSize: '2.5rem',
              fontFamily: "'Playfair Display', serif",
              color: '#f9f6f0',
              margin: '0 0 8px 0',
              letterSpacing: '1px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              animation: 'slideUpText 0.6s ease-out 0.2s both'
            }}>
              Welcome to Sharadha Stores
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--gold)',
              fontWeight: 500,
              margin: '0 0 32px 0',
              animation: 'slideUpText 0.6s ease-out 0.4s both'
            }}>
              Namaste, {loggedInUser.name}!
            </p>

            {/* Access Authorized Badge */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '10px 20px',
              borderRadius: '30px',
              fontSize: '0.9rem',
              color: '#e6ded7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              animation: 'slideUpText 0.6s ease-out 0.6s both'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                display: 'inline-block',
                boxShadow: '0 0 10px #4ade80'
              }}></span>
              <span>Portal access authorized: <strong style={{ color: 'var(--white)' }}>{loggedInUser.roleLabel}</strong></span>
            </div>

            {/* Sleek Progress Bar */}
            <div style={{
              width: '280px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
              animation: 'slideUpText 0.6s ease-out 0.8s both'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                backgroundColor: 'var(--primary-saffron)',
                backgroundImage: 'linear-gradient(90deg, var(--primary-saffron) 0%, var(--gold) 100%)',
                animation: 'fillProgress 5s cubic-bezier(0.1, 0.85, 0.25, 1) forwards'
              }}></div>
            </div>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--charcoal-light)',
              marginTop: '10px',
              letterSpacing: '0.5px',
              animation: 'slideUpText 0.6s ease-out 0.9s both'
            }}>
              Initializing workspace components...
            </span>
            {/* WhatsApp Website Visit Notify */}
            <a
              href={`https://wa.me/919182730806?text=${encodeURIComponent(
                `Hello Sharadha Stores, I am visiting your website and browsing your traditional festival combo hampers!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '15px',
                boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)',
                transition: 'transform 0.2s ease',
                animation: 'slideUpText 0.6s ease-out 0.95s both'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Chat on WhatsApp 💬
            </a>
          </div>

          {/* Keyframe styles */}
          <style>{`
            .floating-particle {
              position: absolute;
              bottom: -50px;
              color: rgba(224, 90, 38, 0.15);
              pointer-events: none;
              z-index: 1;
              animation: floatUp 8s linear infinite;
            }
            @keyframes floatUp {
              0% { transform: translateY(0) rotate(0deg); opacity: 0; }
              10% { opacity: 0.25; }
              90% { opacity: 0.25; }
              100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
            }
            @keyframes rotateBgLogo {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes driftBg {
              from { background-position: 0 0; }
              to { background-position: 32px 32px; }
            }
            @keyframes scaleUpWelcome {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes bounceLogo {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            @keyframes ripple {
              0% {
                width: 100px;
                height: 100px;
                opacity: 0.6;
              }
              100% {
                width: 260px;
                height: 260px;
                opacity: 0;
              }
            }
            @keyframes slideUpText {
              from { transform: translateY(15px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fillProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: 'var(--white)',
        border: '1px solid var(--cream-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        borderTop: '6px solid var(--primary-saffron)'
      }}>
        {/* Banner header */}
        <div style={{
          backgroundColor: 'var(--cream-dark)',
          padding: '30px 24px 20px',
          textAlign: 'center',
          borderBottom: '1px solid var(--cream-border)'
        }}>
          <img
            src="/logo.png"
            alt="Sharadha Stores Logo"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--gold)',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'inline-block'
            }}
          />
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display', color: 'var(--dark-charcoal)' }}>
            Sharadha Stores Portal
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-light)' }}>
            Sign in to manage hampers or browse inventory
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLoginSubmit} style={{ padding: '30px 24px 20px' }}>

          {error && (
            <div className="alert alert-error" style={{ padding: '10px 12px', fontSize: '0.9rem', marginBottom: '20px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Email Address:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="admin@sharadha.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
              <Mail size={16} color="var(--charcoal-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
              <Lock size={16} color="var(--charcoal-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Credentials Seeding Section */}
        <div style={{
          backgroundColor: 'var(--cream-dark)',
          padding: '20px 24px 24px',
          borderTop: '1px solid var(--cream-border)'
        }}>
          <h4 style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--charcoal-light)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 700
          }}>
            <Sparkles size={12} color="var(--primary-saffron)" /> Quick-Fill Demo Profiles:
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@sharadha.com', 'admin123')}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🏵️ Store Admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('customer@gmail.com', 'customer123')}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🛒 Customer / Buyer
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('inventory@sharadha.com', 'inventory123')}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              📦 Inventory Mgr
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('dispatch@sharadha.com', 'dispatch123')}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              🚚 Dispatch Team
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;
