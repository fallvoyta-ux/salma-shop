import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function CustomersList({ onNavigate }) {
  const { token } = useAuth();
  const { formatPrice } = useSettings();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCustomers(data.customers || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, [token]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Répertoire des Clients</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Consultez la liste des clientes enregistrées, leurs coordonnées et l'historique de leurs achats.
        </p>
      </div>

      {/* Tableau des clients (Desktop) */}
      <div className="admin-desktop-table" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>Contact</th>
              <th style={{ padding: '1rem' }}>Localisation</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Commandes</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Total Dépensé</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Chargement des clients...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucun client enregistré pour l'instant.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inscrit(e) le {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <div>✉️ {c.email}</div>
                    <div>📞 {c.phone || 'Non renseigné'}</div>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <div>📍 {c.city || 'Dakar'}</div>
                    {c.region && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.region}</div>}
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.orders_count}
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, color: 'var(--dark)' }}>
                    {formatPrice(c.total_spent)}
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
            Chargement des clients...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucun client enregistré pour l'instant.
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              className="admin-card-item"
            >
              {/* Entête client */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dark)' }}>
                    👤 {c.first_name} {c.last_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Inscrit(e) le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {formatPrice(c.total_spent)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Total dépensé
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', border: '1px solid #edf2f7' }}>
                <div>✉️ {c.email}</div>
                <div>
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                      📞 {c.phone}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>📞 Aucun téléphone</span>
                  )}
                </div>
                <div>📍 {c.city || 'Dakar'}{c.region ? `, ${c.region}` : ''}</div>
              </div>

              {/* Statistiques commandes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Historique achats :</span>
                <span className="badge badge-stock" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                  📦 {c.orders_count} commande(s)
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
