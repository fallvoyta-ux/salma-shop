import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function Dashboard({ onNavigate }) {
  const { token } = useAuth();
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStockId, setUpdatingStockId] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Erreur chargement stats admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // Réapprovisionner rapidement un produit en alerte
  const handleQuickStockUpdate = async (productId, currentStock) => {
    const addQty = prompt(`Combien de pièces souhaitez-vous ajouter au stock ? (Stock actuel : ${currentStock})`, '10');
    if (!addQty || isNaN(addQty) || parseInt(addQty, 10) <= 0) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: currentStock + parseInt(addQty, 10) })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Stock mis à jour avec succès !', 'success');
        fetchStats();
      }
    } catch (err) {
      showToast('Erreur lors de la mise à jour du stock.', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement du tableau de bord...</div>;
  }

  if (!stats) {
    return <div>Impossible de charger les statistiques.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Tableau de Bord Commercial</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Aperçu des performances des ventes et de la logistique en direct.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => onNavigate('/admin/products/new')}>
          + Ajouter un Produit
        </button>
      </div>

      {/* CARTES KPI PRINCIPALES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {/* Chiffre d'affaires Total */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>CHIFFRE D'AFFAIRES</span>
            <span>💰</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
            {formatPrice(stats.total_revenue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.35rem', fontWeight: 600 }}>
            Aujourd'hui : {formatPrice(stats.today_revenue)}
          </div>
        </div>

        {/* Commandes Totales */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>TOTAL COMMANDES</span>
            <span>📦</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
            {stats.total_orders}
          </div>
          <div style={{ fontSize: '0.8rem', color: stats.pending_orders > 0 ? 'var(--warning)' : 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
            {stats.pending_orders} commande(s) en attente
          </div>
        </div>

        {/* Panier Moyen */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>PANIER MOYEN</span>
            <span>🛒</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
            {formatPrice(stats.average_order_value)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Par commande validée
          </div>
        </div>

        {/* Clients Inscrits */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>CLIENTS ENREGISTRÉS</span>
            <span>👥</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
            {stats.total_customers}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {stats.total_products} produits en vente
          </div>
        </div>
      </div>

      {/* GRAPHIQUE DES VENTES & ALERTES STOCK */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Graphique d'évolution des ventes */}
        <div style={{ background: '#fff', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>
            Évolution des Ventes Récentes
          </h3>

          {stats.sales_chart && stats.sales_chart.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '180px', paddingTop: '20px' }}>
              {stats.sales_chart.map((day, idx) => {
                const maxSales = Math.max(...stats.sales_chart.map(s => s.total_sales), 1);
                const heightPercent = Math.max(15, Math.round((day.total_sales / maxSales) * 100));

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                      {formatPrice(day.total_sales).replace(' FCFA', 'k')}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '45px',
                        height: `${heightPercent}%`,
                        background: 'linear-gradient(to top, var(--primary-hover), var(--primary))',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                      title={`${day.date} : ${formatPrice(day.total_sales)} (${day.order_count} commande(s))`}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune donnée de vente récente.</p>
          )}
        </div>

        {/* Alertes Stock Faible */}
        <div style={{ background: '#fff', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Alertes Stock Faible ({stats.low_stock_count})
            </h3>
            <a
              href="/admin/products"
              onClick={(e) => { e.preventDefault(); onNavigate('/admin/products'); }}
              style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}
            >
              Gérer →
            </a>
          </div>

          {stats.low_stock_products.length === 0 ? (
            <div style={{ color: 'var(--success)', fontSize: '0.9rem', padding: '1rem 0' }}>
              ✓ Tous les niveaux de stock sont optimaux.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.low_stock_products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fee2e2'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                      Restant : <strong>{p.stock}</strong> (Alerte : {p.low_stock_threshold})
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuickStockUpdate(p.id, p.stock)}
                  >
                    + Réapprovisionner
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DERNIÈRES COMMANDES */}
      <div style={{ background: '#fff', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>Dernières Commandes Clients</h3>
          <a
            href="/admin/orders"
            onClick={(e) => { e.preventDefault(); onNavigate('/admin/orders'); }}
            style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}
          >
            Voir toutes les commandes →
          </a>
        </div>

        {/* Tableau desktop des commandes récentes */}
        <div className="admin-desktop-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Numéro</th>
                <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                <th style={{ padding: '0.75rem 1rem' }}>Montant</th>
                <th style={{ padding: '0.75rem 1rem' }}>Paiement</th>
                <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{o.order_number}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div>{o.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customer_phone}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>{formatPrice(o.total_amount)}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge" style={{ background: o.payment_status === 'paid' ? 'var(--success-bg)' : '#fef3c7', color: o.payment_status === 'paid' ? 'var(--success)' : '#92400e' }}>
                      {o.payment_status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge badge-status-${o.order_status}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onNavigate(`/admin/orders`)}
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cartes tactiles mobiles des commandes récentes */}
        <div className="admin-mobile-cards">
          {stats.recent_orders.map((o) => (
            <div
              key={o.id}
              className="admin-card-item"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                    {o.order_number}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>
                    {o.customer_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {o.customer_phone}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--dark)' }}>
                    {formatPrice(o.total_amount)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ fontSize: '0.75rem', background: o.payment_status === 'paid' ? 'var(--success-bg)' : '#fef3c7', color: o.payment_status === 'paid' ? 'var(--success)' : '#92400e' }}>
                    {o.payment_status === 'paid' ? 'Payé ✓' : 'En attente'}
                  </span>
                  <span className={`badge badge-status-${o.order_status}`} style={{ fontSize: '0.75rem' }}>
                    {o.order_status}
                  </span>
                </div>

                <button
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '36px', fontWeight: 600 }}
                  onClick={() => onNavigate(`/admin/orders`)}
                >
                  Gérer →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
