import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function OrderSuccess({ orderNumber, onNavigate }) {
  const { formatPrice, settings } = useSettings();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/track/${orderNumber}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrderData(data);
        }
      } catch (err) {
        console.error('Erreur chargement commande:', err);
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="section" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-muted)' }}>Chargement des détails de votre commande...</p>
      </div>
    );
  }

  const order = orderData ? orderData.order : null;
  const items = orderData ? orderData.items : [];

  // Lien WhatsApp direct
  const whatsappPhone = (settings.store_whatsapp || '221771234567').replace(/[^0-9]/g, '');
  const whatsappMsg = `Bonjour ${settings.store_name} ! 👋\n\n` +
    `Je viens d'effectuer la commande *${orderNumber}* sur votre boutique en ligne.\n` +
    `Montant total : ${order ? (order.total_amount).toLocaleString('fr-FR') : ''} FCFA.\n` +
    `Pouvez-vous me confirmer la bonne prise en compte et le délai de livraison ? Merci !`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="section">
      <div className="container container-narrow">
        <div
          style={{
            background: '#fff',
            padding: '3rem 2.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
            marginBottom: '2.5rem'
          }}
        >
          {/* Badge Succès */}
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1.5rem'
            }}
          >
            ✓
          </div>

          <span className="section-tag" style={{ background: '#dcfce7', color: '#15803d' }}>
            Commande Enregistrée avec Succès
          </span>

          <h1 style={{ fontSize: '2.2rem', color: 'var(--dark)', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
            Merci pour votre commande !
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto 1.5rem' }}>
            Votre commande a bien été prise en compte et est en cours de traitement par notre équipe à Dakar.
          </p>

          <div
            style={{
              display: 'inline-block',
              background: 'var(--surface-alt)',
              padding: '0.75rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--primary)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--dark)',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '1px',
              marginBottom: '2rem'
            }}
          >
            N° de Commande : <span style={{ color: 'var(--primary)' }}>{orderNumber}</span>
          </div>

          {/* Boutons d'action : WhatsApp et Impression */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp btn-lg"
            >
              💬 Confirmer ma commande sur WhatsApp
            </a>

            <button
              className="btn btn-outline btn-lg"
              onClick={() => window.print()}
            >
              🖨️ Imprimer le reçu
            </button>
          </div>

          {/* Récapitulatif commande */}
          {order && (
            <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--dark)' }}>
                Détails de la livraison
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: '0.92rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Destinataire :</div>
                  <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
                  <div>📞 {order.customer_phone}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Adresse de livraison :</div>
                  <div style={{ fontWeight: 700 }}>{order.delivery_city}</div>
                  <div>{order.delivery_address}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Moyen de paiement :</div>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {order.payment_method} ({order.payment_status === 'paid' ? 'Payé ✓' : 'En attente'})
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Zone & Tarif :</div>
                  <div style={{ fontWeight: 700 }}>
                    {order.zone_name || 'Dakar'} : {formatPrice(order.delivery_fee)}
                  </div>
                </div>
              </div>

              {/* Articles commandés */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--dark)' }}>
                Articles commandés ({items.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 800 }}>{it.quantity}x</span>
                      <span style={{ fontWeight: 600 }}>{it.product_name}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{formatPrice(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Total final */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>Total réglé / à régler :</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(order.total_amount)}
                </span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => onNavigate('/shop')}>
              Continuer mon shopping sur Teranga Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
