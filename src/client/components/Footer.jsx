import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function Footer({ onNavigate }) {
  const { settings, getWhatsAppUrl } = useSettings();

  return (
    <footer className="modern-footer">
      {/* 1. Bandeau de Réassurance Moderne en Haut du Footer */}
      <div className="footer-perks-bar">
        <div className="container">
          <div className="footer-perks-grid">
            <div className="footer-perk-item">
              <div className="perk-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className="perk-text">
                <strong>Livraison Rapide 24h</strong>
                <span>À domicile partout à Dakar & Banlieue</span>
              </div>
            </div>

            <div className="footer-perk-item">
              <div className="perk-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="perk-text">
                <strong>Paiements Sécurisés</strong>
                <span>Wave, Orange Money & Espèces</span>
              </div>
            </div>

            <div className="footer-perk-item">
              <div className="perk-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="perk-text">
                <strong>Assistance 7j/7</strong>
                <span>Conseils & Commandes WhatsApp</span>
              </div>
            </div>

            <div className="footer-perk-item">
              <div className="perk-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="perk-text">
                <strong>Budget Accessible</strong>
                <span>S'habiller chic selon ses moyens 🌹</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contenu Principal du Footer */}
      <div className="container footer-main-content">
        <div className="footer-grid-modern">
          {/* Colonne 1 : Marque & Slogan & WhatsApp */}
          <div className="footer-col-brand">
            <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} className="footer-brand-logo">
              <img src="/logo.jpg" alt="Global Business Services Grp SF" className="footer-logo-img" />
              <div>
                <span className="footer-brand-title">Global Business Services</span>
                <span className="footer-brand-subtitle">GRP SF • GROUPE SALMA FALL</span>
              </div>
            </a>

            <div className="footer-slogan-card">
              <div className="slogan-line">« La Qualité fait la Différence 💜 »</div>
              <div className="slogan-line">« Groupe Salma Fall 🕊️🌹 »</div>
            </div>

            <p className="footer-about-text">
              {settings.store_description || "Votre boutique de référence à Dakar pour la vente d'articles divers : mode féminine chic, sacs élégants, chaussures, pagnes wax de qualité, gourdes et accessoires pour tous les budgets."}
            </p>

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="footer-whatsapp-pill"
            >
              <span className="footer-wa-icon">💬</span>
              <div className="footer-wa-text">
                <span className="footer-wa-label">Commande Directe WhatsApp</span>
                <span className="footer-wa-num">{settings.store_phone || '+221 77 201 86 97'}</span>
              </div>
            </a>

            {/* Réseaux Sociaux Officiels de la Boutique */}
            <div className="footer-socials-box">
              <span className="footer-socials-label">Suivez-nous sur les réseaux :</span>
              <div className="footer-socials-list">
                <a
                  href="https://www.tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn tiktok"
                  title="TikTok Salma Shop (Vidéos Nouveautés & Défilés)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  <span>TikTok</span>
                </a>

                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn instagram"
                  title="Instagram Salma Shop (Photos & Stories Chic)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  <span>Instagram</span>
                </a>

                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn facebook"
                  title="Facebook Salma Shop"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>

                <a
                  href="https://www.snapchat.com"
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn snapchat"
                  title="Snapchat Salma Shop"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.5c-4.2 0-6.5 3.2-6.5 6.2 0 .8.2 2 .5 2.8-.4.3-1.1.8-1.5 1.5-.4.7-.2 1.4.3 1.6.6.2 1.3 0 1.9-.3.3 1.3 1.2 2.7 2.8 3.1-.4.3-.8.6-1.3.8-.7.3-1.5.5-1.8 1.1-.3.6 0 1.2.5 1.5 1.1.6 3.1.2 4.4-.6.2.2.4.3.7.3.3 0 .5-.1.7-.3 1.3.8 3.3 1.2 4.4.6.5-.3.8-.9.5-1.5-.3-.6-1.1-.8-1.8-1.1-.5-.2-.9-.5-1.3-.8 1.6-.4 2.5-1.8 2.8-3.1.6.3 1.3.5 1.9.3.5-.2.7-.9.3-1.6-.4-.7-1.1-1.2-1.5-1.5.3-.8.5-2 .5-2.8 0-3-2.3-6.2-6.5-6.2z"/>
                  </svg>
                  <span>Snapchat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Colonne 2 : Rayons en Vente */}
          <div>
            <h4 className="footer-col-heading">Nos Rayons</h4>
            <ul className="footer-links-list">
              <li><a href="/shop?category=habits-femmes" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=habits-femmes'); }}>👗 Habits Femmes Chic</a></li>
              <li><a href="/shop?category=habits-hommes" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=habits-hommes'); }}>👔 Habits Hommes</a></li>
              <li><a href="/shop?category=habits-enfants" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=habits-enfants'); }}>🧒 Habits Enfants</a></li>
              <li><a href="/shop?category=sacs-femmes-enfants" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=sacs-femmes-enfants'); }}>👜 Sacs & Pochettes</a></li>
              <li><a href="/shop?category=chaussures-enfants-adultes" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=chaussures-enfants-adultes'); }}>👠 Chaussures & Baskets</a></li>
              <li><a href="/shop?category=tissus" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=tissus'); }}>🧵 Tissus & Bazin Riche</a></li>
              <li><a href="/shop?category=montres" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=montres'); }}>⌚ Montres Élégantes</a></li>
              <li><a href="/shop?category=boucles-oreilles-chaines" onClick={(e) => { e.preventDefault(); onNavigate('/shop?category=boucles-oreilles-chaines'); }}>✨ Bijoux & Chaînes</a></li>
            </ul>
          </div>

          {/* Colonne 3 : Navigation Rapide & Aide */}
          <div>
            <h4 className="footer-col-heading">Service Client</h4>
            <ul className="footer-links-list">
              <li><a href="/track-order" onClick={(e) => { e.preventDefault(); onNavigate('/track-order'); }}>📦 Suivre ma Commande</a></li>
              <li><a href="/account" onClick={(e) => { e.preventDefault(); onNavigate('/account'); }}>👤 Mon Espace Client</a></li>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('/about'); }}>ℹ️ À Propos de l'Entreprise</a></li>
              <li><a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('/contact'); }}>📞 Contactez-nous</a></li>
              <li><a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate('/terms'); }}>📜 Conditions de Vente</a></li>
              <li><a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('/privacy'); }}>🔒 Confidentialité</a></li>
            </ul>
          </div>

          {/* Colonne 4 : Boutique Dakar & Moyens de Paiement */}
          <div>
            <h4 className="footer-col-heading">Boutique Dakar</h4>
            <div className="footer-contact-card">
              <div className="contact-row">
                <span className="contact-icon">📍</span>
                <div>
                  <div className="contact-label">Localisation</div>
                  <div className="contact-val">{settings.store_address || 'Dakar, Sénégal'}</div>
                </div>
              </div>

              <div className="contact-row">
                <span className="contact-icon">💬</span>
                <div>
                  <div className="contact-label">WhatsApp & Wave</div>
                  <a href={`https://wa.me/${(settings.store_whatsapp || '221772018697').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="contact-val highlight">{settings.store_phone || '+221 77 201 86 97'}</a>
                </div>
              </div>

              <div className="contact-row">
                <span className="contact-icon">📱</span>
                <div>
                  <div className="contact-label">Téléphone Mobile Direct</div>
                  <a href="tel:+221762511112" className="contact-val highlight">+221 76 251 11 12</a>
                </div>
              </div>

              <div className="contact-row">
                <span className="contact-icon">🕒</span>
                <div>
                  <div className="contact-label">Expéditions Dakar</div>
                  <div className="contact-val">Livraisons 7j/7 du matin au soir</div>
                </div>
              </div>
            </div>

            <div className="footer-payments-box">
              <div className="payments-title">Paiements 100% Sécurisés</div>
              <div className="payments-badges-grid">
                <div className="payment-badge-pill wave">
                  <span className="badge-dot"></span>
                  <span>Wave</span>
                </div>
                <div className="payment-badge-pill orange">
                  <span className="badge-dot"></span>
                  <span>Orange Money</span>
                </div>
                <div className="payment-badge-pill cash">
                  <span className="badge-dot"></span>
                  <span>Espèces à la Livraison</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ligne Inférieure / Copyright Élégant */}
      <div className="footer-bottom-bar">
        <div className="container footer-bottom-flex">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} <strong>Global Business Services Grp SF</strong> (Groupe Salma Fall) • Vente Articles Divers 🇸🇳 • Tous droits réservés.
          </div>
          <div className="footer-legal-links">
            <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate('/terms'); }}>CGV</a>
            <span>•</span>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('/privacy'); }}>Confidentialité</a>
            <span>•</span>
            <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('/contact'); }}>Contact Direct</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
