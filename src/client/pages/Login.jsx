import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      showToast(`Ravi de vous revoir, ${user.first_name} !`, 'success');
      if (user.role === 'admin') {
        onNavigate('/admin/dashboard');
      } else {
        onNavigate('/account');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '480px' }}>
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
            <span className="section-tag">Espace Client</span>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)', marginTop: '0.25rem' }}>Connexion</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Connectez-vous pour suivre vos commandes et gérer votre profil.
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de Passe</label>
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
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Pas encore de compte ?{' '}
            <a
              href="/register"
              onClick={(e) => { e.preventDefault(); onNavigate('/register'); }}
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              Créer un compte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
