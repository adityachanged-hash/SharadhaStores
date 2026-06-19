import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import AdminComboBuilder from './pages/AdminComboBuilder.jsx';
import CustomerComboBuilder from './pages/CustomerComboBuilder.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComboDetail from './pages/ComboDetail.jsx';
import Login from './pages/Login.jsx';
import CustomerOrders from './pages/CustomerOrders.jsx';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('user_profile');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDenied user={user} />;
  }

  return children;
};

// Access Denied Component
const AccessDenied = ({ user }) => {
  return (
    <div className="card" style={{
      maxWidth: '500px',
      margin: '60px auto',
      textAlign: 'center',
      padding: '40px 24px',
      border: '1.5px solid var(--red-crimson)',
      backgroundColor: 'var(--red-crimson-light)'
    }}>
      <span style={{ fontSize: '3rem' }}>🚫</span>
      <h2 style={{ color: 'var(--red-crimson)', fontFamily: 'Playfair Display', fontSize: '1.8rem', marginTop: '12px' }}>
        Access Denied
      </h2>
      <p style={{ color: 'var(--charcoal-light)', margin: '12px 0 24px' }}>
        Your account role <strong>({user.roleLabel || user.role})</strong> does not have permission to access this panel.
      </p>
      <a href="/" className="btn btn-secondary">Back to Homepage</a>
    </div>
  );
};

function AppContent() {
  const location = useLocation();
  const showBgLogo = location.pathname !== '/login';
  
  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {showBgLogo && (
        <>
          <img 
            src="/public/images/logo.png" 
            alt="" 
            style={{
              position: 'fixed',
              width: '600px',
              height: '600px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              objectFit: 'cover',
              opacity: 0.015,
              filter: 'grayscale(1) brightness(1.2)',
              animation: 'rotateBgLogoApp 45s linear infinite',
              pointerEvents: 'none',
              zIndex: 0
            }} 
          />
          <style>{`
            @keyframes rotateBgLogoApp {
              from { transform: translate(-50%, -50%) rotate(0deg); }
              to { transform: translate(-50%, -50%) rotate(360deg); }
            }
          `}</style>
        </>
      )}
      <Navbar />
      <main className="main-content page-entrance" key={location.pathname} style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/admin/builder" element={
            <ProtectedRoute allowedRoles={['admin', 'inventory_manager']}>
              <AdminComboBuilder />
            </ProtectedRoute>
          } />
          <Route path="/admin/builder/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'inventory_manager']}>
              <AdminComboBuilder />
            </ProtectedRoute>
          } />
          <Route path="/customer/builder" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerComboBuilder />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerOrders />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'inventory_manager', 'dispatch']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/combos/:id" element={
            <ProtectedRoute>
              <ComboDetail />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--cream-border)',
        backgroundColor: 'var(--cream-dark)',
        color: 'var(--charcoal-light)',
        fontSize: '0.9rem',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong>Sharadha Stores</strong> &copy; {new Date().getFullYear()} - Homemade & Traditional Food E-Commerce &middot; Support: +91 91827 30806
          </div>
          <div>
            Festival Combo Pack Builder Tool &middot; Premium Admin Panel
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
