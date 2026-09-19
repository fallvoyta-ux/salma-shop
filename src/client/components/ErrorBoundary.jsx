import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary a intercepté une erreur :', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'var(--surface, #ffffff)',
          color: 'var(--text-main, #1e293b)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '1.5rem'
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark, #0f172a)' }}>
            Une erreur inattendue est survenue
          </h2>
          <p style={{ maxWidth: '500px', color: 'var(--text-muted, #64748b)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            L'application a rencontré un incident technique momentané. Vous pouvez recharger la page ou revenir à l'accueil de la boutique.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
            >
              🔄 Recharger la page
            </button>
            <button
              onClick={this.handleGoHome}
              className="btn btn-outline"
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
            >
              🏠 Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
