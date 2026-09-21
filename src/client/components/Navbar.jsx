import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function Navbar({ currentPath, onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const { totalCount, subtotal, openDrawer } = useCart();
  const { settings, formatPrice } = useSettings();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const menuRef = useRef(null);

  // Détection dynamique de l'écran mobile / iPhone
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer le menu déroulant en cliquant en dehors (support souris et tactile)
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userMenuOpen, isMobile]);

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
        <div className="kahpoo-header-main">
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
          <div className="kahpoo-header-actions">
            {/* 1. Compte Utilisateur Moderne (Pill Capsule Glassmorphic) */}
            <div className="account-menu-container" ref={menuRef}>
              <button
                type="button"
                className={`modern-account-btn ${userMenuOpen ? 'open' : ''}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Espace client : se connecter ou créer un compte"
                aria-expanded={userMenuOpen}
              >
                <div className="account-avatar-circle">
                  {user ? (
                    <span className="account-initial">
                      {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  ) : (
                    <svg
                      width="16"
                      height="16"
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

                {/* Libellé version Ordinateur */}
                <div className="account-text-wrap">
                  <span className="account-top-label">
                    {user ? `Bonjour, ${user.first_name}` : 'Espace client'}
                  </span>
                  <span className="account-sub-label">
                    {user ? 'Mon Compte' : 'Connexion'}
                  </span>
                </div>

                {/* Libellé version Mobile (iPhone, smartphone) */}
                <span className="account-mobile-pill-label">
                  {user ? user.first_name : 'Connexion'}
                </span>

                <svg
                  className={`account-chevron ${userMenuOpen ? 'rotated' : ''}`}
                  width="12"
                  height="12"
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

              {/* Version Desktop : Dropdown sous le bouton */}
              {userMenuOpen && !isMobile && (
                <div className="modern-dropdown-menu" role="menu">
                  {user ? (
                    <>
                      <div className="dropdown-user-header">
                        <div className="dropdown-user-avatar">
                          {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="dropdown-user-meta">
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
                      <div className="dropdown-guest-header">
                        <div>
                          <div className="guest-welcome-title">Bienvenue sur Salma Shop ✨</div>
                          <div className="guest-welcome-sub">Connectez-vous ou créez votre compte client</div>
                        </div>
                      </div>

                      <div className="dropdown-guest-actions">
                        <a
                          href="/login"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserMenuOpen(false);
                            onNavigate('/login');
                          }}
                          className="dropdown-btn-primary"
                        >
                          <span>🔑</span>
                          <span>Se connecter</span>
                        </a>

                        <a
                          href="/register"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserMenuOpen(false);
                            onNavigate('/register');
                          }}
                          className="dropdown-btn-secondary"
                        >
                          <span>✨</span>
                          <span>Créer un compte</span>
                        </a>
                      </div>

                      <div className="dropdown-divider" />

                      <a
                        href="/admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setUserMenuOpen(false);
                          onNavigate('/admin');
                        }}
                        className="dropdown-admin-link"
                      >
                        <span>👑</span>
                        <span>Espace Administration</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Version Mobile (iPhone, etc.) : Modale 100% centrée rendue via createPortal dans document.body */}
            {userMenuOpen && isMobile && typeof document !== 'undefined' && createPortal(
              <div
                className="auth-portal-overlay"
                onClick={() => setUserMenuOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Espace client Salma Shop"
              >
                <div className="auth-portal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="auth-portal-top">
                    <div className="auth-portal-brand">
                      <div className="auth-portal-avatar-large">
                        {user ? (
                          user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'
                        ) : (
                          '🔑'
                        )}
                      </div>
                      <div className="auth-portal-titles">
                        <h3 className="auth-portal-title">
                          {user ? `${user.first_name} ${user.last_name || ''}` : 'Espace Client'}
                        </h3>
                        <p className="auth-portal-subtitle">
                          {user ? user.email : 'Global Business Services Grp SF'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="auth-portal-close"
                      onClick={() => setUserMenuOpen(false)}
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </div>

                  {user ? (
                    <div className="auth-portal-body">
                      <button
                        type="button"
                        className="auth-portal-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/account');
                        }}
                      >
                        <span className="auth-portal-icon">📦</span>
                        <span className="auth-portal-text">Mes Commandes</span>
                        <span className="auth-portal-arrow">→</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          className="auth-portal-item admin"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('/admin');
                          }}
                        >
                          <span className="auth-portal-icon">👑</span>
                          <span className="auth-portal-text">Administration Boutique</span>
                          <span className="auth-portal-arrow">→</span>
                        </button>
                      )}

                      <div className="auth-portal-divider" />

                      <button
                        type="button"
                        className="auth-portal-logout"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                      >
                        <span className="auth-portal-icon">🚪</span>
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  ) : (
                    <div className="auth-portal-body">
                      <p className="auth-portal-intro">
                        Connectez-vous ou créez votre compte pour suivre vos commandes et commander en toute tranquillité.
                      </p>

                      <div className="auth-portal-actions">
                        {/* 1. Bouton Se Connecter */}
                        <button
                          type="button"
                          className="auth-portal-btn primary"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('/login');
                          }}
                        >
                          <span className="btn-icon">🔑</span>
                          <span>Se connecter</span>
                        </button>

                        {/* 2. Bouton Créer un Compte */}
                        <button
                          type="button"
                          className="auth-portal-btn secondary"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('/register');
                          }}
                        >
                          <span className="btn-icon">✨</span>
                          <span>Créer un compte</span>
                        </button>
                      </div>

                      <div className="auth-portal-divider" />

                      <button
                        type="button"
                        className="auth-portal-admin-link"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/admin');
                        }}
                      >
                        <span>👑 Espace Administration</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}

            {/* 2. Bouton Panier */}
            <button
              className="kahpoo-cart-btn"
              onClick={openDrawer}
              aria-label="Voir le panier"
            >
              <span>🛒</span>
              <span className="kahpoo-cart-badge">{totalCount}</span>
              <span style={{ fontSize: '0.88rem' }}>{formatPrice(subtotal)}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
