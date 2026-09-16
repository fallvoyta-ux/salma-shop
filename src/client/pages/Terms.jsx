import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function Terms({ onNavigate }) {
  const { settings } = useSettings();

  return (
    <div className="section">
      <div className="container container-narrow">
        <div className="section-header">
          <span className="section-tag">Juridique</span>
          <h1 className="section-title">Conditions Générales de Vente</h1>
          <p className="section-desc">En vigueur pour toutes les commandes passées sur {settings.store_name} au Sénégal.</p>
        </div>

        <div style={{ background: '#fff', padding: '3rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', lineHeight: 1.8, fontSize: '0.95rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>1. Objet</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Les présentes Conditions Générales de Vente s'appliquent à l'ensemble des ventes conclues sur le site e-commerce de <strong>{settings.store_name}</strong>, situé à Dakar, Sénégal.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>2. Prix et Devises</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Tous les prix affichés sur notre site sont indiqués en Francs CFA (FCFA / XOF) toutes taxes comprises (TTC), hors frais de livraison applicables selon la zone géographique choisie par le client.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>3. Modalités de Paiement</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Les paiements s'effectuent via les moyens électroniques sécurisés couramment utilisés au Sénégal : <strong>Wave Sénégal</strong>, <strong>Orange Money</strong>, carte bancaire (Visa, Mastercard) ou en espèces à la livraison. Les commandes ne sont expédiées qu'après confirmation de la transaction.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>4. Livraison</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Les livraisons sont assurées à Dakar sous un délai moyen de 24 heures ouvrées, et dans les régions sous 48 à 96 heures selon la destination. En cas de retard imprévu, notre service client contactera l'acheteur par téléphone ou WhatsApp.
          </p>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>5. Échanges et Retours</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Conformément aux usages du commerce, le client dispose d'un délai de 48 heures après réception pour demander l'échange d'un article en cas de défaut de conformité ou de problème de taille, à condition que le produit soit dans son état d'origine, neuf et non porté.
          </p>
        </div>
      </div>
    </div>
  );
}
