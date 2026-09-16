import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function Account({ onNavigate }) {
  const { user, token, logout, updateProfile } = useAuth();
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'profile', 'security'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profil
  const [firstName, setFirstName] = useState(user ? user.first_name : '');
  const [lastName, setLastName] = useState(user ? user.last_name : '');
  const [phone, setPhone] = useState(user ? (user.phone || '') : '');
  const [address, setAddress] = useState(user ? (user.address || '') : '');
  const [city, setCity] = useState(user ? (user.city || 'Dakar') : 'Dakar');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sécurité
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      onNavigate('/login');
      return;
    }

    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders/my-orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchOrders();
  }, [user, token]);

  if (!user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        city
      });
      showToast('Profil mis à jour avec succès.', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la mise à jour.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Le nouveau mot de passe doit comporter au moins 6 caractères.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Mot de passe changé avec succès !', 'success');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        showToast(data.message || 'Erreur mot de passe.', 'error');
      }
    } catch (err) {
      showToast('Erreur serveur.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="section-tag">Espace Personnel</span>
            <h1 className="section-title">Bonjour, {user.first_name} 👋</h1>
            <p style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => { logout(); onNavigate('/'); }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Se déconnecter
          </button>
        </div>

        {/* Navigation par Onglets */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: 700,
              color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onClick={() => setActiveTab('orders')}
          >
            📦 Mes Commandes ({orders.length})
          </button>

          <button
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: 700,
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onClick={() => setActiveTab('profile')}
          >
            👤 Mon Profil & Adresse
          </button>

          <button
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'security' ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: 700,
              color: activeTab === 'security' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onClick={() => setActiveTab('security')}
          >
            🔒 Sécurité & Mot de Passe
          </button>
        </div>

        {/* Contenu de l'onglet : Commandes */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <p>Chargement de vos commandes...</p>
            ) : orders.length === 0 ? (
              <div style={{ background: '#fff', padding: '3.5rem 2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
                <h3>Vous n'avez pas encore passé de commande</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Explorez nos collections wax, sacs et cosmétiques artisanaux.
                </p>
                <button className="btn btn-primary" onClick={() => onNavigate('/shop')}>
                  Découvrir les produits
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {orders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)',
                      padding: '1.5rem 2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--dark)' }}>
                          {o.order_number}
                        </span>
                        <span className={`badge badge-status-${o.order_status}`}>
                          {o.order_status === 'delivered' ? 'Livrée' : o.order_status}
                        </span>
                        <span className="badge" style={{ background: o.payment_status === 'paid' ? 'var(--success-bg)' : '#fef3c7', color: o.payment_status === 'paid' ? 'var(--success)' : '#92400e' }}>
                          {o.payment_status === 'paid' ? 'Payé ✓' : 'Paiement en attente'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Passée le {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} • {o.items_count || 1} article(s) • Livraison à {o.delivery_city}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark)' }}>
                          {formatPrice(o.total_amount)}
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onNavigate(`/order-confirmation/${o.order_number}`)}
                      >
                        Voir le reçu
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onNavigate(`/track-order`)}
                      >
                        Suivre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contenu de l'onglet : Profil */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '640px', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Modifier mes Coordonnées</h3>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adresse de livraison par défaut</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Quartier, rue, repère..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ville</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        )}

        {/* Contenu de l'onglet : Sécurité */}
        {activeTab === 'security' && (
          <div style={{ maxWidth: '480px', background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Changer mon Mot de Passe</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nouveau mot de passe (min 6 caractères)</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Mise à jour...' : 'Modifier le mot de passe'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
