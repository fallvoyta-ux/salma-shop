import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register({ onNavigate }) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Dakar');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        city
      });
      showToast('Bienvenue ! Votre compte a été créé avec succès.', 'success');
      onNavigate('/account');
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div
          style={{
            background: '#fff',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="section-tag">Nouveau Client</span>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)', marginTop: '0.25rem' }}>Créer un Compte</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Rejoignez Global Business Services Grp SF et profitez d'un suivi de commande simplifié.
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Aminata"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ba"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Adresse Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+221 77 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ville de résidence</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Dakar, Thiès..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe (min 6 caractères) *</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: '1rem', marginBottom: '1.25rem' }}
              disabled={loading}
            >
              {loading ? 'Création de votre compte...' : 'Créer mon compte'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Déjà un compte ?{' '}
            <a
              href="/login"
              onClick={(e) => { e.preventDefault(); onNavigate('/login'); }}
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              Se connecter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
