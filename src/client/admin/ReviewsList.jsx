import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReviewsList({ onNavigate }) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [token]);

  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      showToast('Erreur mise à jour avis.', 'error');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Confirmez-vous la suppression de cet avis ?')) return;

    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Avis supprimé.', 'success');
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (err) {
      showToast('Erreur suppression.', 'error');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Modération des Avis Clients</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Approuvez, masquez ou supprimez les commentaires laissés sur vos fiches produits.
        </p>
      </div>

      {/* Tableau des avis (Desktop) */}
      <div className="admin-desktop-table" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Produit</th>
              <th style={{ padding: '1rem' }}>Auteur & Note</th>
              <th style={{ padding: '1rem' }}>Commentaire</th>
              <th style={{ padding: '1rem' }}>Statut</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Chargement des avis...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucun avis à modérer.</td></tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>
                    {r.product_name}
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                    <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </td>

                  <td style={{ padding: '1rem', color: 'var(--text-main)', maxWidth: '350px' }}>
                    "{r.comment}"
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{
                      background: r.status === 'approved' ? 'var(--success-bg)' : (r.status === 'pending' ? '#fef3c7' : '#fee2e2'),
                      color: r.status === 'approved' ? 'var(--success)' : (r.status === 'pending' ? '#92400e' : 'var(--danger)')
                    }}>
                      {r.status === 'approved' ? 'Approuvé' : (r.status === 'pending' ? 'En attente' : 'Rejeté')}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {r.status !== 'approved' && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                          onClick={() => handleUpdateStatus(r.id, 'approved')}
                        >
                          Approuver
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
                          onClick={() => handleUpdateStatus(r.id, 'rejected')}
                        >
                          Masquer
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => handleDelete(r.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cartes Mobiles pour smartphones */}
      <div className="admin-mobile-cards">
        {loading ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Chargement des avis...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucun avis à modérer.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="admin-card-item"
            >
              {/* Entête avis : Produit & Note */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--dark)' }}>
                    {r.product_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Par <strong>{r.user_name}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '1px' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                  <span className="badge" style={{
                    fontSize: '0.72rem',
                    marginTop: '4px',
                    background: r.status === 'approved' ? 'var(--success-bg)' : (r.status === 'pending' ? '#fef3c7' : '#fee2e2'),
                    color: r.status === 'approved' ? 'var(--success)' : (r.status === 'pending' ? '#92400e' : 'var(--danger)')
                  }}>
                    {r.status === 'approved' ? 'Approuvé' : (r.status === 'pending' ? 'En attente' : 'Rejeté')}
                  </span>
                </div>
              </div>

              {/* Commentaire */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text-main)', border: '1px solid #edf2f7', lineHeight: '1.4' }}>
                "{r.comment}"
              </div>

              {/* Boutons d'action modération */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {r.status !== 'approved' && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, minHeight: '40px', color: 'var(--success)', borderColor: 'var(--success)', fontWeight: 700 }}
                    onClick={() => handleUpdateStatus(r.id, 'approved')}
                  >
                    ✓ Approuver
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, minHeight: '40px', color: 'var(--warning)', borderColor: 'var(--warning)', fontWeight: 700 }}
                    onClick={() => handleUpdateStatus(r.id, 'rejected')}
                  >
                    👁 Masquer
                  </button>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px', minWidth: '44px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => handleDelete(r.id)}
                  title="Supprimer cet avis"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
