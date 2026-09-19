import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const STATUS_STEPS = [
  { key: 'pending', label: 'En attente', desc: 'Commande enregistrée' },
  { key: 'confirmed', label: 'Confirmée', desc: 'Validée par la boutique' },
  { key: 'processing', label: 'En préparation', desc: 'Emballage dans nos ateliers' },
  { key: 'shipped', label: 'Expédiée', desc: 'Remise au transporteur' },
  { key: 'out_for_delivery', label: 'En livraison', desc: 'Livreur en route vers votre adresse' },
  { key: 'delivered', label: 'Livrée', desc: 'Colis remis en main propre' }
];

export default function OrderTracking({ onNavigate }) {
  const { formatPrice } = useSettings();
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(orderNumberInput.trim().toUpperCase())}`);
      const data = await res.json();

      if (data.success && data.order) {
        setOrderData(data);
      } else {
        setErrorMsg(data.message || `Aucune commande trouvée pour le numéro ${orderNumberInput}.`);
      }
    } catch (err) {
      setErrorMsg('Erreur de connexion lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="section">
      <div className="container container-narrow">
        <div className="section-header">
          <span className="section-tag">Suivi en Temps Réel</span>
          <h1 className="section-title">Suivi de votre Commande</h1>
          <p className="section-desc">
            Saisissez le numéro unique de votre commande (ex: <code>CMD-2026-000101</code>) pour suivre son statut d'acheminement en direct.
          </p>
        </div>

        {/* Formulaire de recherche */}
        <div
          style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '2.5rem'
          }}
        >
          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: '240px' }}
              placeholder="Ex: CMD-2026-000101"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Recherche...' : 'Suivre ma commande →'}
            </button>
          </form>

          {errorMsg && (
            <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Résultat du suivi */}
        {orderData && (
          <div
            style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--dark)' }}>
                  Commande {orderData.order.order_number}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Passée le {new Date(orderData.order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div>
                <span className={`badge badge-status-${orderData.order.order_status}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                  {orderData.order.order_status === 'delivered' ? 'Livrée' : orderData.order.order_status === 'cancelled' ? 'Annulée' : orderData.order.order_status}
                </span>
              </div>
            </div>

            {/* Chronologie des statuts */}
            {orderData.order.order_status === 'cancelled' ? (
              <div style={{ background: 'var(--danger-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontWeight: 700, marginBottom: '2rem' }}>
                ⚠️ Cette commande a été annulée. Contactez le service client pour toute question.
              </div>
            ) : (
              <div style={{ marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: 'var(--dark)' }}>
                  Progression de la livraison
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(orderData.order.order_status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step.key} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isCompleted ? 'var(--primary)' : '#e2e8f0',
                            color: isCompleted ? '#fff' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                            boxShadow: isCurrent ? '0 0 12px var(--primary-glow)' : 'none'
                          }}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, color: isCompleted ? 'var(--dark)' : 'var(--text-muted)' }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coordonnées de destination */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: '0.92rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Destinataire :</div>
                <div style={{ fontWeight: 700 }}>{orderData.order.customer_name}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Destination :</div>
                <div style={{ fontWeight: 700 }}>{orderData.order.delivery_city}</div>
                <div>{orderData.order.delivery_address}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Zone de livraison :</div>
                <div style={{ fontWeight: 700 }}>{orderData.order.zone_name || 'Dakar'}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)' }}>Montant Total :</div>
                <div style={{ fontWeight: 800, color: 'var(--dark)' }}>{formatPrice(orderData.order.total_amount)}</div>
              </div>
            </div>

            {/* Articles */}
            <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--dark)' }}>Articles</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {orderData.items.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                  <span><strong>{it.quantity}x</strong> {it.product_name}</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(it.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
