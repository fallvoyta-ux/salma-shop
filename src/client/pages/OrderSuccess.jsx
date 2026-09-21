import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function OrderSuccess({ orderNumber, onNavigate }) {
  const { formatPrice, settings } = useSettings();

  // 1. Déclarations de tous les Hooks en tête de composant (Règles des Hooks React)
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedTrackingCode, setCopiedTrackingCode] = useState(false);
  const [autoRedirectTriggered, setAutoRedirectTriggered] = useState(false);
  const [trackingCode, setTrackingCode] = useState(() => {
    try {
      const cleanNumber = String(orderNumber || '').trim();
      return sessionStorage.getItem(`salma_tracking_${cleanNumber}`) || '';
    } catch (e) {
      return '';
    }
  });

  // 2. Chargement des détails de la commande
  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        const cleanNumber = String(orderNumber || '').trim();
        if (!cleanNumber) {
          if (!cancelled) {
            setLoading(false);
            setLoadError(true);
          }
          return;
        }

        const savedCode = trackingCode || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`salma_tracking_${cleanNumber}`) : '');
        if (savedCode && !trackingCode) {
          setTrackingCode(savedCode);
        }

        const headers = savedCode ? { 'x-tracking-code': savedCode } : {};
        const res = await fetch(`/api/orders/track/${encodeURIComponent(cleanNumber)}`, { headers });
        const data = await res.json();
        if (!cancelled) {
          if (data.success && data.order) {
            setOrderData(data);
          } else {
            setLoadError(true);
          }
        }
      } catch (err) {
        console.error('Erreur chargement commande:', err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  // 3. Détection et déclenchement unique de l'ouverture Wave ou Orange Money
  useEffect(() => {
    if (autoRedirectTriggered) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const isAutoWave = searchParams.get('auto_wave') === '1' || searchParams.get('auto_wave') === 'true';
      const isAutoOm = searchParams.get('auto_om') === '1' || searchParams.get('auto_om') === 'true';

      if (isAutoWave || isAutoOm) {
        setAutoRedirectTriggered(true);

        // Nettoyer l'URL pour ne pas re-déclencher la redirection si le client recharge la page
        try {
          const cleanPath = window.location.pathname;
          window.history.replaceState({}, '', cleanPath);
        } catch (e) {}

        const targetUrl = isAutoWave
          ? 'https://pay.wave.com/m/M_5iS6VUrJnTx-/c/sn/'
          : 'https://qrcode.orange.sn/dcnYNsnEy5lJG79Nh7DAxLPcCEX';

        const timer = setTimeout(() => {
          window.location.href = targetUrl;
        }, 650);

        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Erreur gestion auto-redirect:', e);
    }
  }, [autoRedirectTriggered]);

  // Variables calculées sécurisées (aucun risque de null pointer)
  const order = orderData ? orderData.order : null;
  const items = (orderData && Array.isArray(orderData.items)) ? orderData.items : [];

  const rawAmount = order ? order.total_amount : 0;
  const totalAmount = Number(rawAmount) || 0;
  const formattedTotal = totalAmount.toLocaleString('fr-FR');

  const rawPaymentMethod = order ? order.payment_method : 'wave';
  const paymentMethod = String(rawPaymentMethod || 'wave').toLowerCase();

  const rawPhone = settings?.store_whatsapp || '221772018697';
  const whatsappPhone = String(rawPhone).replace(/[^0-9]/g, '');
  const displayPhone = settings?.store_phone || '+221 77 201 86 97';

  const waveMerchantUrl = 'https://pay.wave.com/m/M_5iS6VUrJnTx-/c/sn/';
  const omQrUrl = 'https://qrcode.orange.sn/dcnYNsnEy5lJG79Nh7DAxLPcCEX';
  const omUssdUrl = `tel:*144*1*1*${whatsappPhone}*${totalAmount}%23`;

  const isMobileMoney = paymentMethod === 'wave' || paymentMethod === 'orange_money';
  const providerTitle = paymentMethod === 'orange_money' ? 'ORANGE MONEY' : 'WAVE';

  const whatsappMsg = isMobileMoney
    ? `✅ *PAIEMENT ENVOYÉ AVEC SUCCÈS SUR ${providerTitle} (GROUPE SALMA FALL)*\n` +
      `🛍️ *COMMANDE - GLOBAL BUSINESS SERVICES GRP SF*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *N° Commande* : ${orderNumber || (order ? order.order_number : 'CMD')}\n` +
      `💰 *MONTANT ENVOYÉ* : ${formattedTotal} FCFA\n` +
      `📱 *Bénéficiaire* : Groupe SALMA FALL (+221 77 201 86 97)\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Client* : ${order?.customer_name || 'Client'}\n` +
      `📍 *Livraison* : ${order?.delivery_city || 'Dakar'}, ${order?.delivery_address || ''}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Bonjour Groupe SALMA FALL / Salma Shop ! 👋\n` +
      `J'ai bien validé mon règlement de ${formattedTotal} FCFA sur votre compte ${providerTitle} officiel avec succès. ✅\n` +
      `Merci de me confirmer la bonne réception et de préparer ma livraison ! 💜🕊️🌹`
    : `Bonjour ${settings?.store_name || 'Global Business Services Grp SF'} ! 👋\n\n` +
      `Je viens d'effectuer la commande *${orderNumber || (order ? order.order_number : 'CMD')}* sur votre boutique en ligne.\n` +
      `💰 Montant total : ${formattedTotal} FCFA.\n` +
      `💳 Moyen de paiement : ${paymentMethod.toUpperCase()}.\n` +
      `Pouvez-vous me confirmer la réception et le délai de livraison ? Merci !`;

  const finalWhatsappUrl = (orderData && orderData.whatsappUrl)
    ? orderData.whatsappUrl
    : `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  const handleCopyNumber = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Écran de chargement initial (placé APRES tous les Hooks)
  if (loading) {
    return (
      <div className="section" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{
          width: '52px',
          height: '52px',
          border: '4px solid rgba(124, 58, 237, 0.2)',
          borderTopColor: 'var(--primary, #7c3aed)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem',
          animation: 'spin 0.9s linear infinite'
        }} />
        <h2 style={{ fontSize: '1.4rem', color: 'var(--dark)', marginBottom: '0.5rem' }}>
          Finalisation de votre commande...
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Chargement des informations de paiement sécurisé pour la commande <strong>{orderNumber}</strong>.
        </p>
      </div>
    );
  }

  // Écran de secours en cas d'erreur de chargement sans casser l'interface
  if (loadError && !order) {
    return (
      <div className="section">
        <div className="container container-narrow">
          <div
            style={{
              background: '#fff',
              padding: '3rem 2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <span className="section-tag" style={{ background: '#dcfce7', color: '#15803d' }}>
              Commande Reçue
            </span>
            <h1 style={{ fontSize: '2rem', color: 'var(--dark)', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              Merci pour votre commande !
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
              Votre commande <strong>{orderNumber}</strong> a bien été enregistrée dans notre système.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
              <a
                href={finalWhatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>💬</span> Confirmer sur WhatsApp (+221 77 201 86 97)
              </a>
              <button
                className="btn btn-outline btn-lg"
                onClick={() => onNavigate('/track-order')}
              >
                🔍 Suivre ma commande
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container container-narrow">
        <div
          style={{
            background: '#fff',
            padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2.5rem)',
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
              background: 'var(--success-bg, #dcfce7)',
              color: 'var(--success, #16a34a)',
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
              background: 'var(--surface-alt, #f8fafc)',
              padding: '0.75rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--primary)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--dark)',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '1px',
              marginBottom: '1.25rem'
            }}
          >
            N° de Commande : <span style={{ color: 'var(--primary)' }}>{orderNumber || order?.order_number}</span>
          </div>

          {/* Affichage sécurisé du code secret de suivi */}
          {trackingCode && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                maxWidth: '480px',
                margin: '0 auto 2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                🔑 Votre Code Secret de Suivi
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '6px', color: 'var(--dark)', fontFamily: 'var(--font-heading)', margin: '0.25rem 0' }}>
                {trackingCode}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Conservez ce code confidentiel. Il vous permet de suivre votre colis en toute sécurité et de protéger votre adresse de livraison.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(trackingCode);
                    setCopiedTrackingCode(true);
                    setTimeout(() => setCopiedTrackingCode(false), 3000);
                  }
                }}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
              >
                {copiedTrackingCode ? '✓ Code copié !' : '📋 Copier le code secret'}
              </button>
            </div>
          )}

          {/* SECTION DÉDIÉE PAIEMENT DIRECT WAVE */}
          {paymentMethod === 'wave' && (
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #00B2FE 100%)',
                color: '#fff',
                padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1rem, 4vw, 2rem)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(0, 178, 254, 0.35)',
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
                🌊 PAIEMENT OFFICIEL WAVE MARCHAND
              </div>

              <h2 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
                Montant à régler : {formatPrice(totalAmount)}
              </h2>

              <p style={{ fontSize: '0.95rem', opacity: 0.95, maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Réglez directement votre commande sur le compte Wave officiel de <strong>Groupe SALMA FALL</strong> :
              </p>

              {/* Carte Bénéficiaire Marchand Wave */}
              <div
                style={{
                  background: '#fff',
                  color: '#0369a1',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  margin: '0 auto 1.5rem',
                  maxWidth: '430px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Bénéficiaire Wave Officiel
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                  Groupe SALMA FALL
                </div>
                <div style={{ fontSize: '0.92rem', color: '#334155', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Service Client : <strong>+221 77 201 86 97</strong> • <strong>76 251 11 12</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 700 }}>
                  ✓ Compte Marchand Certifié Wave
                </div>
              </div>

              {/* Étapes simples */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  maxWidth: '430px',
                  margin: '0 auto 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  lineHeight: 1.6
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '8px' }}>Paiement Wave : Effectuez le paiement puis confirmez</div>
                <div>1️⃣ Cliquez sur le bouton bleu ci-dessous pour ouvrir la page <strong>Groupe SALMA FALL</strong> sur Wave.</div>
                <div>2️⃣ Saisissez le montant exact de votre commande (<strong>{formatPrice(totalAmount)}</strong>) et validez votre règlement.</div>
                <div>3️⃣ Dès validation dans votre application Wave, cliquez sur le bouton vert WhatsApp ci-dessous pour nous transmettre votre confirmation.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '430px', margin: '0 auto' }}>
                <a
                  href={waveMerchantUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-lg"
                  style={{
                    background: '#fff',
                    color: '#0284c7',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    padding: '0.95rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    border: 'none',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.18)'
                  }}
                >
                  <span style={{ fontSize: '1.35rem' }}>🌊</span> Payer avec Wave (Groupe SALMA FALL)
                </a>

                <a
                  href={finalWhatsappUrl}
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
                    padding: '0.95rem 1.5rem',
                    boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <span>💬</span> Envoyer le message d'envoi avec succès (+221 77 201 86 97)
                </a>
              </div>
            </div>
          )}

          {/* SECTION DÉDIÉE PAIEMENT DIRECT ORANGE MONEY (MAX IT) */}
          {paymentMethod === 'orange_money' && (
            <div
              style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #ff7900 100%)',
                color: '#fff',
                padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1rem, 4vw, 2rem)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(255, 121, 0, 0.35)',
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
                🟠 PAIEMENT OFFICIEL ORANGE MONEY (MAX IT)
              </div>

              <h2 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
                Montant à régler : {formatPrice(totalAmount)}
              </h2>

              <p style={{ fontSize: '0.95rem', opacity: 0.95, maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Réglez directement votre commande via Orange Money sur le compte de <strong>Groupe SALMA FALL</strong> :
              </p>

              {/* Carte Bénéficiaire Orange Money avec QR Code */}
              <div
                style={{
                  background: '#fff',
                  color: '#9a3412',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  margin: '0 auto 1.5rem',
                  maxWidth: '430px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Bénéficiaire Orange Money Officiel
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ea580c', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                  Groupe SALMA FALL
                </div>
                <div style={{ fontSize: '0.92rem', color: '#334155', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Numéro Orange : <strong>+221 77 201 86 97</strong>
                </div>

                {/* QR Code Orange Money scannable */}
                <div style={{ background: '#fff', padding: '8px', borderRadius: '12px', display: 'inline-block', margin: '0.75rem auto', border: '2px solid #ff7900' }}>
                  <img
                    src="/orange_money_qr_clean.png"
                    alt="QR Code Orange Money Groupe SALMA FALL"
                    style={{ width: '150px', height: '150px', display: 'block', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Scannez ce QR Code avec l'application Max it
                </div>
              </div>

              {/* Étapes simples */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  maxWidth: '430px',
                  margin: '0 auto 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  lineHeight: 1.6
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '8px' }}>Paiement Orange Money : Effectuez le paiement puis confirmez</div>
                <div>1️⃣ Cliquez sur le bouton ci-dessous pour ouvrir <strong>Max it</strong> ou scannez le QR code avec votre téléphone.</div>
                <div>2️⃣ Effectuez le transfert de <strong>{formatPrice(totalAmount)}</strong> vers le compte marchand <strong>Groupe SALMA FALL (+221 77 201 86 97)</strong>.</div>
                <div>3️⃣ Dès réception de votre SMS Orange Money, cliquez sur le bouton WhatsApp pour nous transmettre votre capture/référence afin de finaliser la commande.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '430px', margin: '0 auto' }}>
                <a
                  href={omQrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-lg"
                  style={{
                    background: '#fff',
                    color: '#ea580c',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    padding: '0.95rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    border: 'none',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.18)'
                  }}
                >
                  <span style={{ fontSize: '1.35rem' }}>🟠</span> Payer avec Orange Money (Max it)
                </a>

                <a
                  href={finalWhatsappUrl}
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
                    padding: '0.95rem 1.5rem',
                    boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <span>💬</span> Envoyer le message d'envoi avec succès (+221 77 201 86 97)
                </a>

                <a
                  href={omUssdUrl}
                  style={{
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.88rem',
                    textDecoration: 'underline',
                    marginTop: '0.5rem',
                    fontWeight: 700
                  }}
                >
                  📱 Ou composer le code USSD direct : #144#
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
              href={finalWhatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <span>💬</span> {isMobileMoney ? "Envoyer le message d'envoi avec succès sur WhatsApp (+221 77 201 86 97)" : "Confirmer ma commande sur WhatsApp"}
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

              <div className="responsive-recap-grid" style={{ background: 'var(--surface-alt, #f8fafc)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: '0.92rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Destinataire :</div>
                  <div style={{ fontWeight: 700 }}>{order.customer_name || 'Client'}</div>
                  <div>📞 {order.customer_phone || 'N/A'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Adresse de livraison :</div>
                  <div style={{ fontWeight: 700 }}>{order.delivery_city || 'Dakar'}</div>
                  <div>{order.delivery_address || 'Adresse indiquée'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Moyen de paiement :</div>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {order.payment_method || 'WAVE'} ({order.payment_status === 'paid' ? 'Payé ✓' : 'En attente'})
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Zone & Tarif :</div>
                  <div style={{ fontWeight: 700 }}>
                    {order.zone_name || 'Dakar'} : {formatPrice(order.delivery_fee || 0)}
                  </div>
                </div>
              </div>

              {/* Articles commandés */}
              {items.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--dark)' }}>
                    Articles commandés ({items.length})
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {items.map((it, idx) => (
                      <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 800 }}>{it.quantity}x</span>
                          <span style={{ fontWeight: 600 }}>{it.product_name || it.name || 'Article'}</span>
                        </div>
                        <span style={{ fontWeight: 700 }}>{formatPrice(it.subtotal || (it.price * it.quantity) || 0)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Total final */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>Total réglé / à régler :</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(order.total_amount || totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => onNavigate('/shop')}>
              Continuer mon shopping sur Global Business Services Grp SF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
