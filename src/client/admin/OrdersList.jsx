import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const ORDER_STATUSES = [
  { value: 'pending', label: '⏳ En attente', color: '#b45309', bg: '#fef3c7' },
  { value: 'confirmed', label: '✅ Confirmée', color: '#1d4ed8', bg: '#dbeafe' },
  { value: 'processing', label: '📦 En préparation', color: '#6d28d9', bg: '#ede9fe' },
  { value: 'shipped', label: '🚚 Expédiée', color: '#0369a1', bg: '#e0f2fe' },
  { value: 'out_for_delivery', label: '🛵 En livraison', color: '#0e7490', bg: '#cffafe' },
  { value: 'delivered', label: '🎉 Livrée', color: '#15803d', bg: '#dcfce7' },
  { value: 'cancelled', label: '❌ Annulée', color: '#b91c1c', bg: '#fee2e2' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: '⏳ Paiement en attente', shortLabel: 'En attente', color: '#92400e', bg: '#fef3c7' },
  { value: 'paid', label: '✅ Payé', shortLabel: 'Payé ✓', color: '#15803d', bg: '#dcfce7' },
  { value: 'refund_pending', label: '⚠️ Remboursement à effectuer', shortLabel: '⚠️ Remboursement', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'refunded', label: '↩️ Remboursé', shortLabel: 'Remboursé', color: '#7e22ce', bg: '#f3e8ff' },
  { value: 'failed', label: '❌ Échoué', shortLabel: 'Échoué', color: '#991b1b', bg: '#fee2e2' },
];

const getOrderStatusMeta = (status) => {
  return ORDER_STATUSES.find(s => s.value === status) || { value: status, label: status, color: '#475569', bg: '#f1f5f9' };
};

const getPaymentStatusMeta = (status) => {
  return PAYMENT_STATUSES.find(s => s.value === status) || { value: status, label: status, shortLabel: status, color: '#475569', bg: '#f1f5f9' };
};

export default function OrdersList({ onNavigate }) {
  const { token } = useAuth();
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Détails commande sélectionnée
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('payment_status', paymentFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter, paymentFilter]);

  const handleOpenDetail = async (orderId) => {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setOrderItems(data.items || []);
      }
    } catch (err) {
      showToast('Erreur chargement détails commande.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        if (data.warning) {
          showToast(data.warning, 'warning');
        }
        setOrders(prev => prev.map(o => o.id === orderId ? {
          ...o,
          order_status: newStatus,
          payment_status: data.payment_status || o.payment_status
        } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            order_status: newStatus,
            payment_status: data.payment_status || prev.payment_status
          }));
        }
      } else {
        showToast(data.message || 'Erreur mise à jour statut.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur mise à jour statut.', 'error');
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: newPaymentStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newPaymentStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, payment_status: newPaymentStatus }));
        }
      } else {
        showToast(data.message || 'Erreur mise à jour paiement.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur mise à jour paiement.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion des Commandes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Suivi des expéditions, statuts de paiement et livraisons à Dakar & régions.
          </p>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div
        style={{
          background: '#fff',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher par n° commande, nom client, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        <div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="all">Tous les statuts de commande</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="processing">En préparation</option>
            <option value="shipped">Expédiée</option>
            <option value="out_for_delivery">En livraison</option>
            <option value="delivered">Livrée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        <div>
          <select
            className="form-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="all">Tous les statuts paiement</option>
            <option value="paid">Payé</option>
            <option value="pending">Paiement en attente</option>
            <option value="refund_pending">⚠️ Remboursement à effectuer</option>
            <option value="refunded">Remboursé</option>
            <option value="failed">Échoué</option>
          </select>
        </div>

        <button className="btn btn-primary btn-sm" onClick={fetchOrders}>
          Filtrer
        </button>
      </div>

      {/* Tableau des commandes (Desktop) */}
      <div className="admin-orders-desktop-table" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Commande</th>
              <th style={{ padding: '1rem' }}>Client & Contact</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Paiement</th>
              <th style={{ padding: '1rem' }}>Statut Commande</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chargement des commandes...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucune commande trouvée.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const statusMeta = getOrderStatusMeta(o.order_status);
                const payMeta = getPaymentStatusMeta(o.payment_status);

                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                        {o.order_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{o.id}</div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>{o.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.customer_phone}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {o.delivery_city}</div>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--dark)' }}>
                      {formatPrice(o.total_amount)}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <select
                        value={o.payment_status}
                        onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          border: `1px solid ${payMeta.color}`,
                          background: payMeta.bg,
                          color: payMeta.color,
                          cursor: 'pointer'
                        }}
                      >
                        {PAYMENT_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '3px' }}>
                        via {o.payment_method}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <select
                        value={o.order_status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: `1px solid ${statusMeta.color}`,
                          background: statusMeta.bg,
                          color: statusMeta.color,
                          cursor: 'pointer'
                        }}
                      >
                        {ORDER_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenDetail(o.id)}
                      >
                        Détails & Facture
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Affichage Mobile sous forme de cartes tactiles */}
      <div className="admin-orders-mobile-cards">
        {loading ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Chargement des commandes...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucune commande trouvée.
          </div>
        ) : (
          orders.map((o) => {
            const statusMeta = getOrderStatusMeta(o.order_status);
            const payMeta = getPaymentStatusMeta(o.payment_status);

            return (
              <div
                key={o.id}
                className="admin-order-card"
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Entête carte : N° commande & Montant */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                      {o.order_number}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ID #{o.id} • {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--dark)' }}>
                      {formatPrice(o.total_amount)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      via {o.payment_method}
                    </div>
                  </div>
                </div>

                {/* Client & Destination */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', border: '1px solid #edf2f7' }}>
                  <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: '0.25rem' }}>
                    👤 {o.customer_name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <a
                      href={`tel:${o.customer_phone}`}
                      style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      📞 {o.customer_phone}
                    </a>
                    <span>📍 {o.delivery_city}</span>
                  </div>
                </div>

                {/* SÉLECTEURS DE STATUTS TACTILES ET VISIBLES SUR MOBILE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Statut de la commande */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                        Statut de la commande :
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: statusMeta.bg,
                          color: statusMeta.color
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <select
                      value={o.order_status}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        border: `2px solid ${statusMeta.color}`,
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        cursor: 'pointer'
                      }}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Statut du paiement */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                        Statut du paiement :
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: payMeta.bg,
                          color: payMeta.color
                        }}
                      >
                        {payMeta.shortLabel}
                      </span>
                    </div>
                    <select
                      value={o.payment_status}
                      onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        border: `1.5px solid ${payMeta.color}`,
                        background: payMeta.bg,
                        color: payMeta.color,
                        cursor: 'pointer'
                      }}
                    >
                      {PAYMENT_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bouton Détails & Facture */}
                <button
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    minHeight: '42px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.25rem'
                  }}
                  onClick={() => handleOpenDetail(o.id)}
                >
                  📄 Voir Détails & Facture
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modale détails complets d'une commande */}
      {detailModalOpen && (
        <div className="modal-backdrop" onClick={() => setDetailModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>
                Détail de la Commande {selectedOrder?.order_number}
              </h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {loadingDetail || !selectedOrder ? (
                <div>Chargement des détails...</div>
              ) : (
                <div>
                  {/* Alerte Remboursement Requis */}
                  {selectedOrder.payment_status === 'refund_pending' && (
                    <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <strong>⚠️ Remboursement client à effectuer</strong>
                        <div style={{ fontSize: '0.85rem' }}>Cette commande a été annulée après encaissement d'un montant de <strong>{formatPrice(selectedOrder.total_amount)}</strong>.</div>
                      </div>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#b91c1c', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'refunded')}
                      >
                        Marquer comme Remboursé ✓
                      </button>
                    </div>
                  )}

                  {/* Gestion rapide des statuts dans la modale */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        📦 Statut de la commande
                      </label>
                      <select
                        value={selectedOrder.order_status}
                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '42px',
                          padding: '8px 12px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid #cbd5e1',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {ORDER_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        💳 Statut paiement ({selectedOrder.payment_method})
                      </label>
                      <select
                        value={selectedOrder.payment_status}
                        onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '42px',
                          padding: '8px 12px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid #cbd5e1',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {PAYMENT_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Adresse & Client */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'var(--surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Client :</div>
                      <div style={{ fontWeight: 700 }}>{selectedOrder.customer_name}</div>
                      <div>📞 {selectedOrder.customer_phone}</div>
                      <div>✉ {selectedOrder.customer_email}</div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Adresse de Livraison :</div>
                      <div style={{ fontWeight: 700 }}>{selectedOrder.delivery_city}, {selectedOrder.delivery_region}</div>
                      <div>{selectedOrder.delivery_address}</div>
                      {selectedOrder.delivery_notes && (
                        <div style={{ fontStyle: 'italic', marginTop: '4px' }}>Note : {selectedOrder.delivery_notes}</div>
                      )}
                    </div>
                  </div>

                  {/* Articles de la commande */}
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Articles ({orderItems.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {orderItems.map((it) => (
                      <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                        <div>
                          <strong>{it.quantity}x</strong> {it.product_name}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prix unit. : {formatPrice(it.unit_price)}</div>
                        </div>
                        <div style={{ fontWeight: 800 }}>{formatPrice(it.subtotal)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Totaux */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.92rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Sous-total articles :</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Frais de livraison ({selectedOrder.zone_name || 'Dakar'}) :</span>
                      <span>{formatPrice(selectedOrder.delivery_fee)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: 'var(--dark)', marginTop: '0.5rem' }}>
                      <span>TOTAL :</span>
                      <span>{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: 'var(--surface-alt)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                🖨️ Imprimer la Facture / Bon
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setDetailModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
