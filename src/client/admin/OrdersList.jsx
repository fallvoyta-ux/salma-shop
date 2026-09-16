import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

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
      if (data.success) {
        showToast(data.message, 'success');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, order_status: newStatus }));
        }
      }
    } catch (err) {
      showToast('Erreur mise à jour statut.', 'error');
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
      if (data.success) {
        showToast(data.message, 'success');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newPaymentStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, payment_status: newPaymentStatus }));
        }
      }
    } catch (err) {
      showToast('Erreur mise à jour paiement.', 'error');
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
          alignItems: 'center'
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
            <option value="failed">Échoué</option>
          </select>
        </div>

        <button className="btn btn-primary btn-sm" onClick={fetchOrders}>
          Filtrer
        </button>
      </div>

      {/* Tableau des commandes */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Commande</th>
              <th style={{ padding: '1rem' }}>Client & Contact</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Montant</th>
              <th style={{ padding: '1rem' }}>Paiement</th>
              <th style={{ padding: '1rem' }}>Statut Commande</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Chargement des commandes...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucune commande ne correspond aux filtres.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--dark)' }}>{o.order_number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.items_count || 1} article(s)</div>
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
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid var(--border)',
                        background: o.payment_status === 'paid' ? 'var(--success-bg)' : '#fef3c7',
                        color: o.payment_status === 'paid' ? 'var(--success)' : '#92400e'
                      }}
                    >
                      <option value="pending">Paiement en attente</option>
                      <option value="paid">Payé ✓</option>
                      <option value="failed">Échoué</option>
                      <option value="refunded">Remboursé</option>
                    </select>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                      via {o.payment_method}
                    </div>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <select
                      value={o.order_status}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid var(--border)'
                      }}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="processing">En préparation</option>
                      <option value="shipped">Expédiée</option>
                      <option value="out_for_delivery">En livraison</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
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
              ))
            )}
          </tbody>
        </table>
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
                  {/* Adresse & Client */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Client :</div>
                      <div style={{ fontWeight: 700 }}>{selectedOrder.customer_name}</div>
                      <div>📞 {selectedOrder.customer_phone}</div>
                      <div>✉️ {selectedOrder.customer_email}</div>
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
