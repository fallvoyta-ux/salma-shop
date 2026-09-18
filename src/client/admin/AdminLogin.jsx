import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminLogin({ onNavigate }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'admin') {
        throw new Error("Accès refusé : Ce compte ne possède pas les droits d'administration.");
      }
      showToast(`Bienvenue dans l'espace d'administration, ${user.first_name} !`, 'success');
      onNavigate('/admin/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Identifiants administrateur incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: '#1e293b',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid #334155',
          color: '#fff'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.jpg"
            alt="Global Business Services Grp SF"
            style={{ width: '88px', height: '88px', borderRadius: '50%', border: '3px solid var(--primary)', margin: '0 auto 1rem', boxShadow: '0 4px 20px var(--primary-glow)', objectFit: 'cover' }}
          />
          <h1 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 800 }}>Global Business Services</h1>
          <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '1px', marginTop: '0.2rem' }}>
            GRP SF • GROUPE SALMA FALL
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.5rem' }}>
            « La Qualité fait la Différence 💜 » • Panneau d'Administration
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>Email Administrateur</label>
            <input
              type="email"
              className="form-input"
              style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>Mot de Passe</label>
            <input
              type="password"
              className="form-input"
              style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '1.5rem', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Vérification...' : 'Accéder au Tableau de Bord ➔'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', fontSize: '0.85rem' }}>
          <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ color: '#94a3b8' }}>
            ← Retourner à la boutique publique
          </a>
        </div>
      </div>
    </div>
  );
}
