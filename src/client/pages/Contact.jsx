import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function Contact({ onNavigate }) {
  const { settings, getWhatsAppUrl } = useSettings();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Votre message a été enregistré avec succès !', 'success');
        setSent(true);
        if (data.whatsappUrl) {
          setWhatsappUrl(data.whatsappUrl);
        }
      } else {
        showToast(data.message || 'Erreur lors de l’envoi de votre message.', 'error');
      }
    } catch (err) {
      showToast('Une erreur de connexion est survenue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Restons en Contact</span>
          <h1 className="section-title">Contactez Global Business Services Grp SF</h1>
          <p className="section-desc">
            Groupe Salma Fall • Vente Articles Divers • « La Qualité fait la Différence 💜🕊️🌹 »
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3.5rem', alignItems: 'start' }}>
          {/* Formulaire de contact */}
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1.5rem', color: 'var(--dark)' }}>
              Laissez-nous un message
            </h3>

            {sent ? (
              <div style={{ background: 'var(--success-bg)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--success)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                <h4 style={{ marginBottom: '0.5rem' }}>Message envoyé avec succès !</h4>
                <p style={{ fontSize: '0.92rem', marginBottom: '1.5rem', color: '#15803d' }}>
                  Votre demande a bien été transmise à notre service client. Nous vous répondrons très rapidement !
                </p>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-whatsapp btn-block"
                    style={{ fontWeight: 800, fontSize: '1rem', padding: '0.85rem' }}
                  >
                    💬 Ouvrir la discussion sur WhatsApp (+221 77 201 86 97)
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Votre Nom & Prénom *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Fatou Ndiaye"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="fatou@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Téléphone / WhatsApp *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+221 77 000 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Votre Message *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Posez-nous vos questions (disponibilité, commande personnalisée, délai de livraison...)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? 'Envoi en cours...' : 'Envoyer mon message →'}
                </button>
              </form>
            )}
          </div>

          {/* Coordonnées & Bouton WhatsApp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <img src="/logo.jpg" alt="Global Business Services Grp SF" style={{ width: '65px', height: '65px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--dark)' }}>Global Business Services</h3>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>GRP SF • GROUPE SALMA FALL</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.95rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Nos Contacts Officiels :</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dark)' }}>
                      💬 <a href="https://wa.me/221772018697" target="_blank" rel="noreferrer" style={{ color: 'var(--success)' }}>+221 77 201 86 97</a> <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>(WhatsApp & Wave Principal)</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dark)' }}>
                      📱 <a href="tel:+221762511112">+221 76 251 11 12</a> <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>(Mobile Direct)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Devise & Slogan :</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>💜 La Qualité fait la Différence</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Vente Articles Divers • Groupe Salma Fall 🕊️🌹</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Localisation :</div>
                  <div style={{ fontWeight: 600 }}>📍 {settings.store_address} (Dakar, Sénégal)</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Horaires :</div>
                  <div style={{ fontWeight: 600 }}>🕒 Lundi - Samedi : 09h00 - 20h00</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Commandes en ligne et WhatsApp 24h/24</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <a
                  href={getWhatsAppUrl("Bonjour Global Business Services Grp SF ! J'aimerais échanger avec vous directement.")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-block btn-lg"
                >
                  💬 Discuter sur WhatsApp (+221 77 201 86 97)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
