import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gift, Home, ClipboardList, Database, LayoutDashboard, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const [exitInfo, setExitInfo] = useState({ name: '', hasOrdered: false });

  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user_profile');
      setUser(userStr ? JSON.parse(userStr) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange(); // Run initial check

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isActive = (path) => {
    if (path === '/builder') {
      return location.pathname === '/customer/builder' || location.pathname.startsWith('/admin/builder');
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    const profile = localStorage.getItem('user_profile');
    const parsedProfile = profile ? JSON.parse(profile) : null;
    const hasOrdered = localStorage.getItem('has_ordered_this_session') === 'true';

    setExitInfo({
      name: parsedProfile ? parsedProfile.name : '',
      hasOrdered: hasOrdered
    });
    setShowExit(true);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('has_ordered_this_session');
    
    setUser(null);
    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
      setShowExit(false);
      navigate('/login');
    }, 5000); // 5 seconds exit animation
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: 'var(--primary-saffron)', color: 'var(--white)' };
      case 'inventory_manager':
        return { backgroundColor: 'var(--gold)', color: 'var(--white)' };
      case 'dispatch':
        return { backgroundColor: '#1d72b8', color: 'var(--white)' };
      case 'customer':
      default:
        return { backgroundColor: 'var(--forest-green)', color: 'var(--white)' };
    }
  };

  // Determine visibility of links based on roles
  const canAccessProducts = !!user;
  const canAccessBuilder = user && (['admin', 'inventory_manager'].includes(user.role) || user.role === 'customer');
  const canAccessDashboard = user && ['admin', 'inventory_manager', 'dispatch'].includes(user.role);
  const canAccessOrders = user && user.role === 'customer';

  return (
    <>
      {showExit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#110c08', // Deep traditional black-chocolate
          backgroundImage: 'radial-gradient(circle at center, #261911 0%, #110c08 100%)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          overflow: 'hidden'
        }}>
          {/* Rotating ambient background logo */}
          <img 
            src="/public/images/logo.png" 
            alt="" 
            style={{
              position: 'absolute',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              objectFit: 'cover',
              opacity: 0.03,
              filter: 'grayscale(1)',
              animation: 'rotateBgLogo 25s linear infinite',
              pointerEvents: 'none',
              zIndex: 1
            }} 
          />

          {/* Sparkles / Ember particles drifting down (falling effect on exit) */}
          <div className="exit-sparkle" style={{ left: '15%', animationDelay: '0s', animationDuration: '6s' }}><Gift size={20} /></div>
          <div className="exit-sparkle" style={{ left: '40%', animationDelay: '2.5s', animationDuration: '8s' }}><Gift size={12} /></div>
          <div className="exit-sparkle" style={{ left: '60%', animationDelay: '1.2s', animationDuration: '7s' }}><Gift size={16} /></div>
          <div className="exit-sparkle" style={{ left: '80%', animationDelay: '3.8s', animationDuration: '9s' }}><Gift size={14} /></div>

          {/* Content Wrapper */}
          <div style={{
            textAlign: 'center',
            zIndex: 3,
            animation: 'scaleDownExit 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px',
            maxWidth: '650px'
          }}>
            {/* Saffron Central Logo with shrinking ripple waves */}
            <div style={{ position: 'relative', marginBottom: '32px' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '2px dashed var(--gold)',
                opacity: 0,
                animation: 'exitRipple 4s linear infinite',
                pointerEvents: 'none'
              }}></div>

              <img 
                src="/public/images/logo.png" 
                alt="Sharadha Stores Logo" 
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--gold)',
                  boxShadow: '0 0 30px rgba(224, 90, 38, 0.4)',
                  position: 'relative',
                  zIndex: 2,
                  animation: 'exitPulse 2.5s ease-in-out infinite'
                }} 
              />
            </div>

            {/* Custom Messages based on Order History */}
            {exitInfo.hasOrdered ? (
              <>
                <h1 style={{
                  fontSize: '2.4rem',
                  fontFamily: "'Playfair Display', serif",
                  color: 'var(--gold)',
                  margin: '0 0 16px 0',
                  lineHeight: 1.3,
                  animation: 'slideUpText 0.6s ease-out 0.2s both'
                }}>
                  Thank You for Ordering from Sharadha Stores!
                </h1>
                <p style={{
                  fontSize: '1.2rem',
                  color: '#e6ded7',
                  lineHeight: 1.6,
                  margin: '0 0 40px 0',
                  animation: 'slideUpText 0.6s ease-out 0.4s both'
                }}>
                  We appreciate your purchase and wish you a joyous festive season. We hope you will visit the store again!
                </p>
              </>
            ) : (
              <>
                <h1 style={{
                  fontSize: '2.4rem',
                  fontFamily: "'Playfair Display', serif",
                  color: '#f9f6f0',
                  margin: '0 0 16px 0',
                  lineHeight: 1.3,
                  animation: 'slideUpText 0.6s ease-out 0.2s both'
                }}>
                  Thank You for Visiting Sharadha Stores!
                </h1>
                <p style={{
                  fontSize: '1.2rem',
                  color: '#e6ded7',
                  lineHeight: 1.6,
                  margin: '0 0 40px 0',
                  animation: 'slideUpText 0.6s ease-out 0.4s both'
                }}>
                  We hope you enjoyed exploring our traditional combos and product catalogs. Namaste, and visit us again soon!
                </p>
              </>
            )}

            {/* Closing Progress Tracker */}
            <div style={{
              width: '180px',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                backgroundColor: 'var(--gold)',
                animation: 'exitProgress 5s linear forwards'
              }}></div>
            </div>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--charcoal-light)',
              marginTop: '12px',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Safely exiting session...
            </span>
            {/* WhatsApp Exit Feedback */}
            <a 
              href={`https://wa.me/919182730806?text=${encodeURIComponent(
                `Hello Sharadha Stores, I have finished visiting your website. Thank you for the sweet experience!`
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
              Share Feedback on WhatsApp 💬
            </a>
          </div>

          <style>{`
            .exit-sparkle {
              position: absolute;
              top: -50px;
              color: rgba(212, 160, 23, 0.1);
              pointer-events: none;
              z-index: 1;
              animation: floatDownExit 8s linear infinite;
            }
            @keyframes floatDownExit {
              0% { transform: translateY(0) rotate(0deg); opacity: 0; }
              10% { opacity: 0.2; }
              90% { opacity: 0.2; }
              100% { transform: translateY(110vh) rotate(-360deg); opacity: 0; }
            }
            @keyframes rotateBgLogo {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes scaleDownExit {
              from { transform: scale(1.05); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes exitPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(224, 90, 38, 0.4); }
              50% { transform: scale(0.96); box-shadow: 0 0 15px rgba(224, 90, 38, 0.2); }
            }
            @keyframes exitRipple {
              0% { width: 90px; height: 90px; opacity: 0.8; }
              100% { width: 220px; height: 220px; opacity: 0; }
            }
            @keyframes exitProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
            @keyframes slideUpText {
              from { transform: translateY(15px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <header style={{
      backgroundColor: 'var(--white)',
      borderBottom: '4px solid var(--gold)',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/public/images/logo.png" 
            alt="Sharadha Stores Logo" 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--gold)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'block'
            }} 
          />
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.1, color: 'var(--primary-saffron)' }}>
              Sharadha Stores
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--charcoal-light)'
            }}>
              Festival Combo Builder
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <nav style={{ display: 'flex', gap: '4px' }}>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              fontSize: '0.9rem',
              backgroundColor: isActive('/') ? 'var(--primary-saffron-light)' : 'transparent',
              color: isActive('/') ? 'var(--primary-saffron)' : 'var(--charcoal-light)',
              transition: 'var(--transition-fast)'
            }}>
              <Home size={16} />
              <span>Home</span>
            </Link>

            {canAccessProducts && (
              <Link to="/products" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                fontSize: '0.9rem',
                backgroundColor: isActive('/products') ? 'var(--primary-saffron-light)' : 'transparent',
                color: isActive('/products') ? 'var(--primary-saffron)' : 'var(--charcoal-light)',
                transition: 'var(--transition-fast)'
              }}>
                <Database size={16} />
                <span>Products</span>
              </Link>
            )}

            {canAccessBuilder && (
              <Link to={user && user.role === 'customer' ? '/customer/builder' : '/admin/builder'} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                fontSize: '0.9rem',
                backgroundColor: isActive('/builder') ? 'var(--primary-saffron-light)' : 'transparent',
                color: isActive('/builder') ? 'var(--primary-saffron)' : 'var(--charcoal-light)',
                transition: 'var(--transition-fast)'
              }}>
                <ClipboardList size={16} />
                <span>Builder</span>
              </Link>
            )}

            {canAccessOrders && (
              <Link to="/orders" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                fontSize: '0.9rem',
                backgroundColor: isActive('/orders') ? 'var(--primary-saffron-light)' : 'transparent',
                color: isActive('/orders') ? 'var(--primary-saffron)' : 'var(--charcoal-light)',
                transition: 'var(--transition-fast)'
              }}>
                <ClipboardList size={16} />
                <span>My Orders</span>
              </Link>
            )}

            {canAccessDashboard && (
              <Link to="/dashboard" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                fontSize: '0.9rem',
                backgroundColor: isActive('/dashboard') ? 'var(--primary-saffron-light)' : 'transparent',
                color: isActive('/dashboard') ? 'var(--primary-saffron)' : 'var(--charcoal-light)',
                transition: 'var(--transition-fast)'
              }}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* User Session Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: '1px solid var(--cream-border)',
            paddingLeft: '16px'
          }}>
            {user ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--dark-charcoal)' }}>{user.name}</span>
                  <span className="badge" style={{
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginTop: '2px',
                    ...getRoleBadgeStyle(user.role)
                  }}>
                    {user.roleLabel}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--red-crimson)',
                    borderColor: 'var(--cream-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <User size={14} /> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  </>
);
};

export default Navbar;
