import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function AdminLayout({ currentPath, onNavigate, children }) {
  const { user, token, logout } = useAuth();
  const { settings } = useSettings();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Petit badge dans le menu : nombre de messages de contact non lus.
  // Rafraîchi à chaque changement de page admin (pas de websocket ici,
  // c'est volontairement simple).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch('/api/admin/contacts', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) setUnreadMessages(data.unreadCount || 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, currentPath]);

  const isCurrent = (path) => currentPath === path || (path === '/admin/dashboard' && (currentPath === '/admin' || currentPath === '/admin/'));

  const navItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Tableau de bord' },
    { path: '/admin/products', icon: '👗', label: 'Produits & Stocks' },
    { path: '/admin/categories', icon: '📁', label: 'Catégories' },
    { path: '/admin/orders', icon: '📦', label: 'Commandes' },
    { path: '/admin/customers', icon: '👥', label: 'Clients' },
    { path: '/admin/reviews', icon: '⭐', label: 'Avis Clients' },
    { path: '/admin/messages', icon: '✉️', label: 'Messages' },
    { path: '/admin/delivery-zones', icon: '🚚', label: 'Zones de Livraison' },
    { path: '/admin/settings', icon: '⚙️', label: 'Paramètres Boutique' }
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR GAUCHE */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img
            src="/logo.jpg"
            alt="Global Business Services Grp SF"
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>GLOBAL BUSINESS</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>GRP SF • SALMA FALL</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`admin-nav-item ${isCurrent(item.path) ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.path);
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.path === '/admin/messages' && unreadMessages > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                  borderRadius: '999px', minWidth: '20px', height: '20px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px'
                }}>
                  {unreadMessages}
                </span>
              )}
            </a>
          ))}

          <div style={{ borderTop: '1px solid var(--dark-border)', margin: '1rem 0', paddingTop: '1rem' }}>
            <a
              href="/"
              className="admin-nav-item"
              onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
            >
              <span>🏪</span>
              <span>Voir la boutique</span>
            </a>

            <button
              className="admin-nav-item"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#f87171' }}
              onClick={() => {
                logout();
                onNavigate('/');
              }}
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ZONE CENTRALE */}
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--dark)' }}>
            Global Business Services Grp SF • Groupe Salma Fall • Administration
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--dark)' }}>
                {user && user.first_name ? `${user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)} ${user.last_name || ''}`.trim() : 'Salma Fall'}
              </div>
              <div style={{ color: 'var(--success)' }}>Connecté • Rôle Admin</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {user && user.first_name ? user.first_name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
