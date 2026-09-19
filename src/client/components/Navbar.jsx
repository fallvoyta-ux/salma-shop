import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function Navbar({ currentPath, onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const { totalCount, totalAmount, openDrawer } = useCart();
  const { settings, formatPrice } = useSettings();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu déroulant en cliquant en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <>
      {/* BANDEAU SUPÉRIEUR DÉFILANT EN BOUCLE CONTINUE (TOURNE EN ROND) */}
      <div className="top-brand-announcement" aria-label="Annonces officielles défilantes">
        <div className="top-brand-marquee">
          <div className="top-brand-track">
            {/* GROUPE 1 */}
            <div className="top-brand-content">
              <span className="top-brand-item gb-item">
                <strong className="tb-brand">Global Business</strong> : Vente Articles Divers - Tous genres d'accessoires de Femmes 👩🧕 et Accessoires pour la maison 🏡
              </span>
              <span className="top-brand-divider">✦</span>
              <span className="top-brand-item sk-item">
                <strong className="tb-brand">SALMA KIDS</strong> (Vente Jouets éducatifs et accessoires pour enfants 👦👶🧒👧)
              </span>
              <span className="top-brand-divider">✦</span>
              <span className="top-brand-item wa-item">
                📲 WhatsApp & Wave : <strong>+221 77 201 86 97</strong> • <strong>76 251 11 12</strong>
              </span>
              <span className="top-brand-divider">✦</span>
              <span className="top-brand-item slogan-item">
                « La Qualité fait la Différence 💜🕊️🌹 »
              </span>
              <span className="top-brand-divider">✦</span>
            </div>

            {/* GROUPE 2 (CLONE PARFAIT POUR BOUCLE INFINIE CONTINUE) */}
            <div className="top-brand-content" aria-hidden="true">
              <span className="top-brand-item gb-item">
                <strong className="tb-brand">Global Business</strong> : Vente Articles Divers - Tous genres d'accessoires de Femmes 👩🧕 et Accessoires pour la maison 🏡
              </span>
              <span className="top-brand-divider">✦</span>
              <span className="top-brand-item sk-item">
                <strong className="tb-brand">SALMA KIDS</strong> (Vente Jouets éducatifs et accessoires pour enfants 👦👶🧒👧)
              </span>
              <span className="top-brand-divider">✦</span>
              <span className="top-brand-item wa-item">
                📲 WhatsApp & Wave : <strong>+221 77 201 86 97</strong> • <strong>76 251 11 12</strong>
              </span>
              <span className="top-brand-divider">✦</span>
              <span className="top-brand-item slogan-item">
                « La Qualité fait la Différence 💜🕊️🌹 »
              </span>
              <span className="top-brand-divider">✦</span>
            </div>
          </div>
        </div>
      </div>

      <header className="kahpoo-header">
      <div className="container">
        <div className="kahpoo-header-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {/* EXTRÊME GAUCHE : LOGO GLOBAL BUSINESS SERVICES GRP SF */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
            className="kahpoo-logo-wrap"
          >
            <img
              src="/logo.jpg"
              alt="Global Business Services Grp SF"
              className="kahpoo-logo-img"
            />
            <div className="kahpoo-logo-text">
              <span className="kahpoo-brand-name">Global Business Services</span>
              <span className="kahpoo-brand-sub">GRP SF • GROUPE SALMA FALL</span>
            </div>
          </a>

          {/* EXTRÊME DROITE : COMPTE & PANIER */}
          <div className="kahpoo-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* 1. Compte Utilisateur Moderne (Pill Capsule Glassmorphic) */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                className={`modern-account-btn ${userMenuOpen ? 'open' : ''}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Espace client"
              >
                <div className="account-avatar-circle">
                  {user ? (
                    <span className="account-initial">
                      {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  ) : (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>

                <div className="account-text-wrap">
                  <span className="account-top-label">
                    {user ? `Bonjour, ${user.first_name}` : 'Espace client'}
                  </span>
                  <span className="account-sub-label">
                    {user ? 'Mon Compte' : 'Connexion'}
                  </span>
                </div>

                <svg
                  className={`account-chevron ${userMenuOpen ? 'rotated' : ''}`}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="modern-dropdown-menu">
                  {user ? (
                    <>
                      <div className="dropdown-user-header">
                        <div className="dropdown-user-avatar">
                          {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="dropdown-user-name">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="dropdown-user-email">{user.email}</div>
                        </div>
                      </div>

                      <div className="dropdown-menu-list">
                        <a
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserMenuOpen(false);
                            onNavigate('/account');
                          }}
                          className="dropdown-menu-item"
                        >
                          <span className="dropdown-item-icon">📦</span>
                          <span>Mes Commandes</span>
                        </a>

                        {isAdmin && (
                          <a
                            href="/admin"
                            onClick={(e) => {
                              e.preventDefault();
                              setUserMenuOpen(false);
                              onNavigate('/admin');
                            }}
                            className="dropdown-menu-item admin-item"
                          >
                            <span className="dropdown-item-icon">👑</span>
                            <span>Administration Boutique</span>
                          </a>
                        )}

                        <div className="dropdown-divider" />

                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="dropdown-logout-btn"
                        >
                          <span className="dropdown-item-icon">🚪</span>
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="dropdown-guest-box">
                      <div className="dropdown-guest-welcome">
                        <div className="guest-welcome-title">Bienvenue sur GBS Grp SF ✨</div>
                        <div className="guest-welcome-sub">Groupe Salma Fall • La Qualité fait la Différence.</div>
                      </div>

                      <a
                        href="/login"
                        onClick={(e) => {
                          e.preventDefault();
                          setUserMenuOpen(false);
                          onNavigate('/login');
                        }}
                        className="dropdown-login-btn"
                      >
                        Se connecter
                      </a>

                      <a
                        href="/admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setUserMenuOpen(false);
                          onNavigate('/admin');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '0.5rem',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#7c3aed',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          marginTop: '0.5rem'
                        }}
                      >
                        👑 Espace Administration
                      </a>

                      <a
                        href="/register"
                        onClick={(e) => {
                          e.preventDefault();
                          setUserMenuOpen(false);
                          onNavigate('/register');
                        }}
                        className="dropdown-register-link"
                      >
                        Pas de compte ? <strong>Créer un compte</strong>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Bouton Panier */}
            <button
              className="kahpoo-cart-btn"
              onClick={openDrawer}
              aria-label="Voir le panier"
            >
              <span>🛒</span>
              <span className="kahpoo-cart-badge">{totalCount}</span>
              <span style={{ fontSize: '0.88rem' }}>{formatPrice(totalAmount)}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
