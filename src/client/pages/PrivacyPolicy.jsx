import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function PrivacyPolicy({ onNavigate }) {
  const { settings } = useSettings();

  return (
    <div className="section">
      <div className="container container-narrow">
        <div className="section-header">
          <span className="section-tag">Confidentialité</span>
          <h1 className="section-title">Politique de Confidentialité</h1>
          <p className="section-desc">Protection de vos données personnelles sur {settings.store_name}.</p>
        </div>

        <div style={{ background: '#fff', padding: '3rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', lineHeight: 1.8, fontSize: '0.95rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>1. Collecte des données</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Nous collectons les données strictement indispensables au bon traitement et à l'acheminement de vos commandes : prénom, nom, numéro de téléphone (WhatsApp), adresse de livraison et adresse email.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>2. Sécurité des Paiements</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>{settings.store_name} ne conserve aucune donnée bancaire sensible.</strong> Les transactions sont opérées directement par les prestataires de paiement agréés (Wave, Orange Money, banques partenaires) au travers de protocoles cryptés et sécurisés.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>3. Vos Droits</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles sur simple demande adressée à notre service client à <a href={`mailto:${settings.store_email}`} style={{ color: 'var(--primary)' }}>{settings.store_email}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
