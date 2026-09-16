import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function Settings({ onNavigate }) {
  const { token } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [formValues, setFormValues] = useState({
    store_name: '',
    store_slogan: '',
    store_description: '',
    store_phone: '',
    store_whatsapp: '',
    store_email: '',
    store_address: '',
    currency: 'FCFA',
    announcement_bar: '',
    announcement_active: 'true',
    whatsapp_ordering_enabled: 'true',
    free_shipping_threshold: '50000'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormValues({
        store_name: settings.store_name || 'Teranga Shop Dakar',
        store_slogan: settings.store_slogan || '',
        store_description: settings.store_description || '',
        store_phone: settings.store_phone || '',
        store_whatsapp: settings.store_whatsapp || '',
        store_email: settings.store_email || '',
        store_address: settings.store_address || '',
        currency: settings.currency || 'FCFA',
        announcement_bar: settings.announcement_bar || '',
        announcement_active: settings.announcement_active || 'true',
        whatsapp_ordering_enabled: settings.whatsapp_ordering_enabled || 'true',
        free_shipping_threshold: settings.free_shipping_threshold || '50000'
      });
    }
  }, [settings]);

  const handleChange = (field, val) => {
    setFormValues(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formValues)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Paramètres de la boutique enregistrés avec succès !', 'success');
        await refreshSettings();
      } else {
        showToast(data.message || 'Erreur lors de la sauvegarde.', 'error');
      }
    } catch (err) {
      showToast('Erreur serveur.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Paramètres Généraux de la Boutique</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Personnalisez les coordonnées, les annonces, le numéro WhatsApp et la devise de votre boutique sans modifier le code.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* BLOC 1 : IDENTITÉ DU MAGASIN */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Identité & Marque</h3>

          <div className="form-group">
            <label className="form-label">Nom de la boutique</label>
            <input
              type="text"
              className="form-input"
              value={formValues.store_name}
              onChange={(e) => handleChange('store_name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slogan commercial</label>
            <input
              type="text"
              className="form-input"
              value={formValues.store_slogan}
              onChange={(e) => handleChange('store_slogan', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (SEO & Pied de page)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formValues.store_description}
              onChange={(e) => handleChange('store_description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Devise Monétaire</label>
            <input
              type="text"
              className="form-input"
              value={formValues.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              style={{ maxWidth: '200px' }}
            />
          </div>
        </div>

        {/* BLOC 2 : COORDONNÉES & WHATSAPP SÉNÉGAL */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Coordonnées de Contact & WhatsApp</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Numéro WhatsApp (sans le +)</label>
              <input
                type="text"
                className="form-input"
                placeholder="221771234567"
                value={formValues.store_whatsapp}
                onChange={(e) => handleChange('store_whatsapp', e.target.value)}
                required
              />
              <span className="form-hint">Format international sans espace ni plus : 221XXXXXXXXX</span>
            </div>

            <div className="form-group">
              <label className="form-label">Téléphone affiché</label>
              <input
                type="text"
                className="form-input"
                value={formValues.store_phone}
                onChange={(e) => handleChange('store_phone', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email de contact</label>
            <input
              type="email"
              className="form-input"
              value={formValues.store_email}
              onChange={(e) => handleChange('store_email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adresse physique du magasin à Dakar</label>
            <input
              type="text"
              className="form-input"
              value={formValues.store_address}
              onChange={(e) => handleChange('store_address', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formValues.whatsapp_ordering_enabled === 'true'}
                onChange={(e) => handleChange('whatsapp_ordering_enabled', e.target.checked ? 'true' : 'false')}
              />
              <span>Activer le bouton « Commander via WhatsApp » sur les fiches produits</span>
            </label>
          </div>
        </div>

        {/* BLOC 3 : BANNIÈRE PROMOTIONNELLE & SEUIL LIVRAISON */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Bannière Promo & Livraison Offerte</h3>

          <div className="form-group">
            <label className="form-label">Texte de la bannière supérieure</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: ✨ Livraison offerte à Dakar à partir de 50 000 FCFA..."
              value={formValues.announcement_bar}
              onChange={(e) => handleChange('announcement_bar', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formValues.announcement_active === 'true'}
                onChange={(e) => handleChange('announcement_active', e.target.checked ? 'true' : 'false')}
              />
              <span>Afficher la bannière supérieure sur le site</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Seuil de gratuité de livraison à Dakar (FCFA)</label>
            <input
              type="number"
              className="form-input"
              value={formValues.free_shipping_threshold}
              onChange={(e) => handleChange('free_shipping_threshold', e.target.value)}
              style={{ maxWidth: '200px' }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={saving}
        >
          {saving ? 'Enregistrement des paramètres...' : 'Enregistrer tous les paramètres'}
        </button>
      </form>
    </div>
  );
}
