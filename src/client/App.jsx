import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';

// Composants publics
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WhatsAppButton from './components/WhatsAppButton';

// Pages publiques
import Home from './pages/Home';
import Shop from './pages/Shop';
import Categories from './pages/Categories';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Espace Administrateur
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import ProductsList from './admin/ProductsList';
import ProductForm from './admin/ProductForm';
import CategoriesList from './admin/CategoriesList';
import OrdersList from './admin/OrdersList';
import CustomersList from './admin/CustomersList';
import ReviewsList from './admin/ReviewsList';
import DeliveryZones from './admin/DeliveryZones';
import Settings from './admin/Settings';

function AppContent() {
  const { user, isAdmin, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname + window.location.search);

  // Gestion de l'historique navigateur
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const pathname = currentPath.split('?')[0];
  const searchParams = new URLSearchParams(currentPath.split('?')[1] || '');

  // Détection des routes Admin
  const isAdminRoute = pathname.startsWith('/admin');

  // Si route Admin (hors login) et non admin connecté
  if (isAdminRoute && pathname !== '/admin/login' && !loading && !isAdmin) {
    return <AdminLogin onNavigate={navigate} />;
  }

  // Rendu de la page courante
  let pageComponent = null;

  // 1. Routes Administrateur
  if (pathname === '/admin/login') {
    pageComponent = <AdminLogin onNavigate={navigate} />;
  } else if (pathname === '/admin' || pathname === '/admin/dashboard') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <Dashboard onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/products') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <ProductsList onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/products/new') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <ProductForm onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit')) {
    const prodId = pathname.split('/')[3];
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <ProductForm productId={prodId} onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/categories') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <CategoriesList onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/orders') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <OrdersList onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/customers') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <CustomersList onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/reviews') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <ReviewsList onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/delivery-zones') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <DeliveryZones onNavigate={navigate} />
      </AdminLayout>
    );
  } else if (pathname === '/admin/settings') {
    pageComponent = (
      <AdminLayout currentPath={pathname} onNavigate={navigate}>
        <Settings onNavigate={navigate} />
      </AdminLayout>
    );
  }
  // 2. Routes Publiques Client
  else if (pathname === '/') {
    pageComponent = <Home onNavigate={navigate} />;
  } else if (pathname === '/shop') {
    pageComponent = (
      <Shop
        initialSearch={searchParams.get('search') || ''}
        initialCategory={searchParams.get('category') || ''}
        initialPromo={searchParams.get('promo') === 'true'}
        onNavigate={navigate}
      />
    );
  } else if (pathname === '/categories') {
    pageComponent = <Categories onNavigate={navigate} />;
  } else if (pathname.startsWith('/product/')) {
    const slug = pathname.replace('/product/', '');
    pageComponent = <ProductDetail slug={slug} onNavigate={navigate} />;
  } else if (pathname === '/cart') {
    pageComponent = <Cart onNavigate={navigate} />;
  } else if (pathname === '/checkout') {
    pageComponent = <Checkout onNavigate={navigate} />;
  } else if (pathname.startsWith('/order-confirmation/')) {
    const orderNumber = pathname.replace('/order-confirmation/', '');
    pageComponent = <OrderSuccess orderNumber={orderNumber} onNavigate={navigate} />;
  } else if (pathname === '/track-order') {
    pageComponent = <OrderTracking onNavigate={navigate} />;
  } else if (pathname === '/login') {
    pageComponent = <Login onNavigate={navigate} />;
  } else if (pathname === '/register') {
    pageComponent = <Register onNavigate={navigate} />;
  } else if (pathname === '/account' || pathname.startsWith('/account/')) {
    pageComponent = <Account onNavigate={navigate} />;
  } else if (pathname === '/about') {
    pageComponent = <About onNavigate={navigate} />;
  } else if (pathname === '/contact') {
    pageComponent = <Contact onNavigate={navigate} />;
  } else if (pathname === '/terms') {
    pageComponent = <Terms onNavigate={navigate} />;
  } else if (pathname === '/privacy') {
    pageComponent = <PrivacyPolicy onNavigate={navigate} />;
  } else {
    // 404 Not Found
    pageComponent = (
      <div className="section" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</div>
        <h1 style={{ marginBottom: '1rem', color: 'var(--dark)' }}>Page Introuvable</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          La page demandée n'existe pas ou a été déplacée.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // Pour les pages admin, ne pas afficher le Navbar & Footer client
  if (isAdminRoute) {
    return pageComponent;
  }

  return (
    <>
      <Navbar currentPath={pathname} onNavigate={navigate} />
      <main>{pageComponent}</main>
      <Footer onNavigate={navigate} />
      <CartDrawer onNavigate={navigate} />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
