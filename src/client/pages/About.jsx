import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function About({ onNavigate }) {
  const { settings, getWhatsAppUrl } = useSettings();

  return (
    <div className="section">
      <div className="container container-narrow">
        <div className="section-header">
          <span className="section-tag">Notre Mission</span>
          <h1 className="section-title">À Propos de Global Business Services Grp SF</h1>
          <p className="section-desc" style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--primary)' }}>
            « La Qualité fait la Différence 💜🕊️🌹 »
          </p>
        </div>

        <div style={{ background: '#fff', padding: '3rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Logo officiel centré */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <img
              src="/logo.jpg"
              alt="Global Business Services Grp SF"
              style={{ width: '160px', height: '160px', borderRadius: '50%', margin: '0 auto', boxShadow: '0 8px 25px var(--primary-glow)', border: '3px solid var(--primary)', objectFit: 'cover' }}
            />
            <h2 style={{ fontSize: '1.6rem', color: 'var(--dark)', marginTop: '1rem', fontWeight: 800 }}>
              Global Business Services Grp SF
            </h2>
            <div style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Groupe Salma Fall 🕊️💜🌹 • Vente Articles Divers
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Dakar, Sénégal
            </div>
          </div>

          <h3 style={{ fontSize: '1.35rem', color: 'var(--dark)', marginBottom: '1rem' }}>Notre Philosophie</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Bienvenue chez <strong>Global Business Services Grp SF (Groupe Salma Fall)</strong> ! Notre entreprise s’est imposée comme une référence incontournable avec une devise claire : <em>« La Qualité fait la Différence »</em>.
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            Nous sélectionnons pour vous les meilleurs articles divers – mode féminine chic, tenues de cérémonie, maroquinerie, accessoires tendance, chaussures et produits du quotidien – alliant excellence, élégance et prix accessibles.
          </p>

          <h3 style={{ fontSize: '1.35rem', color: 'var(--dark)', marginBottom: '1rem' }}>Nos Engagements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '2rem 0' }}>
            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>La Qualité fait la Différence</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Chaque article est rigoureusement sélectionné pour garantir durabilité, raffinement et satisfaction totale.
              </p>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛍️</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>Vente Articles Divers</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Une vaste gamme de produits chic, accessoires, maroquinerie et tenues élégantes adaptées à tous vos besoins.
              </p>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕊️</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>Groupe Salma Fall</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Un groupe de confiance dévoué à un service d'excellence, de proximité et de fiabilité au Sénégal.
              </p>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>Nos Contacts Directs</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                💬 WhatsApp & Wave : <strong>+221 77 201 86 97</strong><br />
                📱 Mobile Direct : <strong>+221 76 251 11 12</strong>
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('/shop')}>
              Explorer la boutique →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
