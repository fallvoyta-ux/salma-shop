import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function About({ onNavigate }) {
  const { settings, getWhatsAppUrl } = useSettings();

  return (
    <div className="section">
      <div className="container container-narrow">
        <div className="section-header">
          <span className="section-tag">Notre Mission</span>
          <h1 className="section-title">À Propos de Salma Shop</h1>
          <p className="section-desc" style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--primary)' }}>
            « Se vêtir à tous prix 💜 | S'habiller selon son Budget 🌹 »
          </p>
        </div>

        <div style={{ background: '#fff', padding: '3rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Logo officiel centré */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/logo.jpg"
              alt="Salma Shop Chic Ladies"
              style={{ width: '160px', height: '160px', borderRadius: '50%', margin: '0 auto', boxShadow: '0 8px 25px var(--primary-glow)', border: '3px solid var(--primary)' }}
            />
            <h2 style={{ fontSize: '1.6rem', color: 'var(--dark)', marginTop: '1rem' }}>Salma Shop - Chic Ladies</h2>
            <div style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Vente Articles Divers • Dakar, Sénégal
            </div>
          </div>

          <h3 style={{ fontSize: '1.35rem', color: 'var(--dark)', marginBottom: '1rem' }}>Notre Philosophie</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Bienvenue chez <strong>Salma Shop</strong> ! Notre boutique a été créée pour répondre aux envies de toutes les femmes qui souhaitent allier élégance, modernité et respect de leur budget.
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            Parce que chaque femme mérite d'être sublime en toute circonstance, nous nous engageons à vous proposer des articles de qualité supérieure – robes, ensembles glamour, sacs, chaussures et accessoires tendance – à des tarifs justes et accessibles.
          </p>

          <h3 style={{ fontSize: '1.35rem', color: 'var(--dark)', marginBottom: '1rem' }}>Nos Engagements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '2rem 0' }}>
            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👗</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Mode Féminine Chic</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Sélection soignée de tenues pour vos cérémonies, événements ou sorties décontractées à Dakar.
              </p>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👜</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Articles Divers & Accessoires</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Maroquinerie, sacs à main, chaussures et bijoux pour parfaire votre allure.
              </p>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Prix Adaptés au Budget</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                « Se vêtir à tous prix 💜 » : la promesse d'une mode inclusive et abordable.
              </p>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Service Client Proche de Vous</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Disponible par téléphone et WhatsApp au <strong>+221 77 201 86 97</strong> pour vous accompagner.
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
