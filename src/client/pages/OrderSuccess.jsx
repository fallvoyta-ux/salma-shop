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

  // Liens de paiement direct
  const whatsappPhone = (settings.store_whatsapp || '221772018697').replace(/[^0-9]/g, '');
  const displayPhone = settings.store_phone || '+221 77 201 86 97';
  const totalAmount = order ? order.total_amount : 0;
  const paymentMethod = order ? order.payment_method : 'wave';

  const waveUrl = `https://wave.com/send?phone=${whatsappPhone}&amount=${totalAmount}`;
  const omUssdUrl = `tel:*144*1*1*${whatsappPhone}*${totalAmount}%23`;

  // Lien WhatsApp direct
  const whatsappMsg = `Bonjour ${settings.store_name || 'Salma Shop'} ! 👋\n\n` +
    `Je viens d'effectuer la commande *${orderNumber}* sur votre boutique en ligne.\n` +
    `💰 Montant total : ${totalAmount.toLocaleString('fr-FR')} FCFA.\n` +
    `💳 Moyen de paiement : ${paymentMethod.toUpperCase()}.\n` +
    `Pouvez-vous me confirmer la réception et le délai de livraison ? Merci !`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  const [copied, setCopied] = useState(false);
  const handleCopyNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(displayPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

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
            Votre commande a bien été enregistrée et est prête pour la validation à Dakar.
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

          {/* SECTION DÉDIÉE PAIEMENT DIRECT SALMA SHOP */}
          {paymentMethod === 'wave' && (
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #00B2FE 100%)',
                color: '#fff',
                padding: '2.25rem 2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(0, 178, 254, 0.35)',
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
                🌊 PAIEMENT SÉCURISÉ WAVE SÉNÉGAL
              </div>

              <h2 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
                Montant à régler : {formatPrice(totalAmount)}
              </h2>

              <p style={{ fontSize: '0.95rem', opacity: 0.95, maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Effectuez votre transfert Wave directement vers le compte officiel de <strong>Salma Shop</strong> :
              </p>

              {/* Carte Coordonnées Wave Salma Shop */}
              <div
                style={{
                  background: '#fff',
                  color: '#0369a1',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  margin: '0 auto 1.5rem',
                  maxWidth: '420px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Numéro Wave Salma Shop
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0284c7', fontFamily: 'var(--font-heading)', letterSpacing: '2px', marginBottom: '4px' }}>
                  77 201 86 97
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, marginBottom: '1.25rem' }}>
                  Bénéficiaire : <strong>Salma Shop (Chic Ladies)</strong>
                </div>

                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="btn btn-primary btn-block"
                  style={{
                    background: '#00B2FE',
                    borderColor: '#00B2FE',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    padding: '0.75rem 1rem'
                  }}
                >
                  {copied ? '✓ Numéro 77 201 86 97 copié !' : '📋 Copier le numéro (77 201 86 97)'}
                </button>
              </div>

              {/* Étapes simples */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  maxWidth: '420px',
                  margin: '0 auto 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  lineHeight: 1.6
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '8px' }}>Comment valider votre commande :</div>
                <div>1️⃣ Ouvrez votre application <strong>Wave</strong> sur votre téléphone.</div>
                <div>2️⃣ Envoyez <strong>{formatPrice(totalAmount)}</strong> au <strong>77 201 86 97</strong>.</div>
                <div>3️⃣ Cliquez sur le bouton vert ci-dessous pour nous envoyer votre capture de reçu sur WhatsApp !</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                <a
                  href="wave://"
                  className="btn btn-lg"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#0284c7',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    padding: '0.85rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none'
                  }}
                >
                  <span>🌊</span> Lancer l'application Wave sur mon mobile
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-lg"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    padding: '0.9rem 1.5rem',
                    boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <span>💬</span> Envoyer mon reçu Wave sur WhatsApp
                </a>
              </div>
            </div>
          )}

          {paymentMethod === 'orange_money' && (
            <div
              style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                color: '#fff',
                padding: '2.25rem 2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(249, 115, 22, 0.35)',
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
                🟠 PAIEMENT ORANGE MONEY SÉNÉGAL
              </div>

              <h2 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
                Montant à régler : {formatPrice(totalAmount)}
              </h2>

              <p style={{ fontSize: '0.95rem', opacity: 0.95, maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Transférez au compte Orange Money marchand officiel de <strong>Salma Shop</strong> :
              </p>

              {/* Carte Coordonnées OM */}
              <div
                style={{
                  background: '#fff',
                  color: '#ea580c',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  margin: '0 auto 1.5rem',
                  maxWidth: '420px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Numéro Orange Money Salma Shop
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ea580c', fontFamily: 'var(--font-heading)', letterSpacing: '2px', marginBottom: '4px' }}>
                  77 201 86 97
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, marginBottom: '1.25rem' }}>
                  Motif du transfert : <strong>{orderNumber}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="btn btn-primary btn-block"
                  style={{
                    background: '#ea580c',
                    borderColor: '#ea580c',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    padding: '0.75rem 1rem'
                  }}
                >
                  {copied ? '✓ Numéro 77 201 86 97 copié !' : '📋 Copier le numéro (77 201 86 97)'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                <a
                  href={omUssdUrl}
                  className="btn btn-lg"
                  style={{
                    background: '#fff',
                    color: '#ea580c',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    padding: '0.85rem 1.5rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📞</span> Composer le code #144# sur mobile
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-lg"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    padding: '0.9rem 1.5rem',
                    boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <span>💬</span> Confirmer le paiement OM sur WhatsApp
                </a>
              </div>
            </div>
          )}

          {paymentMethod === 'cash_on_delivery' && (
            <div
              style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                color: '#166534',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                💵 Paiement en Espèces à la Livraison
              </h3>
              <p style={{ fontSize: '0.95rem', margin: '0 auto 0.5rem', maxWidth: '500px' }}>
                Veuillez prévoir le montant exact de <strong>{formatPrice(totalAmount)}</strong> à remettre à notre livreur lors de la remise de votre colis à Dakar.
              </p>
            </div>
          )}

          {/* Boutons d'action : WhatsApp et Impression */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <span>💬</span> Confirmer ma commande sur WhatsApp
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
              Continuer mon shopping sur Salma Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
