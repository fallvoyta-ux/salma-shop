import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Checkout({ onNavigate }) {
  const { cartItems, subtotal, clearCart } = useCart();
  const { formatPrice, settings } = useSettings();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Étape 1 : Infos Client
  const [customerName, setCustomerName] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [customerPhone, setCustomerPhone] = useState(user ? (user.phone || '') : '');
  const [customerEmail, setCustomerEmail] = useState(user ? user.email : '');

  // Étape 2 : Adresse de livraison
  const [deliveryRegion, setDeliveryRegion] = useState(user ? (user.region || 'Dakar') : 'Dakar');
  const [deliveryCity, setDeliveryCity] = useState(user ? (user.city || 'Dakar') : 'Dakar');
  const [deliveryAddress, setDeliveryAddress] = useState(user ? (user.address || '') : '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Étape 3 : Mode de livraison
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  // Étape 4 & 5 : Paiement
  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [submitting, setSubmitting] = useState(false);

  // Charger les zones de livraison
  useEffect(() => {
    async function loadZones() {
      try {
        const res = await fetch('/api/delivery-zones');
        const data = await res.json();
        if (data.success && data.zones.length > 0) {
          setDeliveryZones(data.zones);
          setSelectedZoneId(data.zones[0].id);
        }
      } catch (err) {
        console.error('Erreur chargement zones:', err);
      }
    }
    loadZones();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <h2>Votre panier est vide</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Veuillez ajouter des articles à votre panier avant de passer commande.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('/shop')}>
            Voir la boutique
          </button>
        </div>
      </div>
    );
  }

  // Calcul des frais de livraison
  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
  const freeThreshold = parseInt(settings.free_shipping_threshold, 10) || 50000;
  const isFreeShipping = subtotal >= freeThreshold && selectedZone && selectedZone.price > 0 && deliveryRegion === 'Dakar';
  const deliveryFee = isFreeShipping ? 0 : (selectedZone ? selectedZone.price : 0);
  const grandTotal = subtotal + deliveryFee;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim() || !deliveryCity.trim()) {
      showToast('Veuillez renseigner votre nom, téléphone et adresse de livraison complète.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || 'client@terangashop.sn',
        customer_phone: customerPhone.trim(),
        delivery_region: deliveryRegion,
        delivery_city: deliveryCity.trim(),
        delivery_address: deliveryAddress.trim(),
        delivery_notes: deliveryNotes.trim(),
        delivery_zone_id: selectedZoneId,
        payment_method: paymentMethod,
        items: cartItems.map(i => ({
          productId: i.id,
          quantity: i.quantity
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && localStorage.getItem('teranga_token') ? { 'Authorization': `Bearer ${localStorage.getItem('teranga_token')}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (data.success && data.order) {
        showToast('Commande enregistrée ! Redirection vers Global Business Services Grp SF...', 'success');
        clearCart();

        // Si Wave sélectionné : copier automatiquement le numéro 77 201 86 97
        if (paymentMethod === 'wave') {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText('77 201 86 97');
            }
          } catch (e) {
            console.warn('Erreur copie presse-papier:', e);
          }
        }

        // REDIRECTION DIRECTE SUR LE NUMÉRO DE SALMA SHOP (+221 77 201 86 97) VIA WHATSAPP
        if (data.whatsappUrl) {
          window.history.pushState({}, '', `/order-confirmation/${data.order.order_number}`);
          window.location.href = data.whatsappUrl;
          return;
        }

        onNavigate(`/order-confirmation/${data.order.order_number}`);
      } else {
        showToast(data.message || 'Erreur lors de la validation de la commande.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Une erreur de connexion est survenue.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <span className="section-tag">Tunnel Sécurisé</span>
          <h1 className="section-title">Finalisation de votre Commande</h1>
          <p className="section-desc">
            Remplissez vos coordonnées pour la livraison à Dakar ou dans les régions du Sénégal.
          </p>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '3rem', alignItems: 'start' }}>
            {/* COLONNE GAUCHE : ÉTAPES FORMULAIRE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Étape 1 : Coordonnées personnelles */}
              <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '28px', height: '28px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>1</span>
                  Informations de Contact
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Prénom & Nom complet *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Fatou Diop"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Numéro Téléphone (avec WhatsApp) *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ex: 77 123 45 67"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                    <span className="form-hint">Nécessaire pour le livreur et le suivi</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Adresse Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Ex: fatou@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Étape 2 : Adresse de livraison */}
              <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '28px', height: '28px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>2</span>
                  Lieu de Livraison
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Région *</label>
                    <select
                      className="form-select"
                      value={deliveryRegion}
                      onChange={(e) => setDeliveryRegion(e.target.value)}
                      required
                    >
                      <option value="Dakar">Dakar</option>
                      <option value="Thiès">Thiès</option>
                      <option value="Saint-Louis">Saint-Louis</option>
                      <option value="Diourbel">Diourbel (Touba)</option>
                      <option value="Fatick">Fatick</option>
                      <option value="Kaolack">Kaolack</option>
                      <option value="Ziguinchor">Ziguinchor</option>
                      <option value="Autre région">Autre région du Sénégal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ville ou Quartier précis *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Almadies, Mermoz, Plateau, Saly..."
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Adresse exacte & Repère *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Rue 14 x B, près de la pharmacie, Immeuble Rose, 2e étage"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Instructions complémentaires pour le livreur (Optionnel)</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Ex: Sonner au grand portail noir, appeler à l'arrivée..."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Étape 3 : Mode & Tarif de livraison */}
              <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '28px', height: '28px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>3</span>
                  Mode & Zone de Livraison
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {deliveryZones.map((zone) => {
                    const isZoneSelected = selectedZoneId === zone.id;
                    const zonePrice = (isFreeShipping && zone.price > 0) ? 0 : zone.price;

                    return (
                      <label
                        key={zone.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          border: isZoneSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isZoneSelected ? 'var(--primary-light)' : '#fff',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <input
                            type="radio"
                            name="delivery_zone"
                            checked={isZoneSelected}
                            onChange={() => setSelectedZoneId(zone.id)}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{zone.name}</div>
                            {zone.estimated_days && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ {zone.estimated_days}</div>
                            )}
                          </div>
                        </div>

                        <div style={{ fontWeight: 800, color: zonePrice === 0 ? 'var(--success)' : 'var(--dark)' }}>
                          {zonePrice === 0 ? 'Gratuit' : formatPrice(zonePrice)}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Étape 4 : Choix du Moyen de Paiement */}
              <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '28px', height: '28px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>4</span>
                  Mode de Paiement
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Wave */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'wave' ? '2px solid var(--brand-wave)' : '1px solid var(--border)',
                      background: paymentMethod === 'wave' ? '#f0f9ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'wave'}
                        onChange={() => setPaymentMethod('wave')}
                      />
                      <div>
                        <div style={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🌊 Wave Sénégal
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paiement instantané sans frais via votre compte Wave</div>
                      </div>
                    </div>
                    <span style={{ background: 'var(--brand-wave)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>WAVE</span>
                  </label>

                  {/* Orange Money */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'orange_money' ? '2px solid var(--brand-om)' : '1px solid var(--border)',
                      background: paymentMethod === 'orange_money' ? '#fff7ed' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'orange_money'}
                        onChange={() => setPaymentMethod('orange_money')}
                      />
                      <div>
                        <div style={{ fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🟠 Orange Money Sénégal
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validation sécurisée par code USSD ou app Orange Money</div>
                      </div>
                    </div>
                    <span style={{ background: 'var(--brand-om)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>OM</span>
                  </label>

                  {/* Carte bancaire */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'card' ? '2px solid var(--dark)' : '1px solid var(--border)',
                      background: paymentMethod === 'card' ? '#f8fafc' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--dark)' }}>💳 Carte Bancaire (Visa / Mastercard)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paiement sécurisé crypté SSL</div>
                      </div>
                    </div>
                    <span style={{ background: '#334155', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>CARTE</span>
                  </label>

                  {/* Cash à la livraison */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'cash_on_delivery' ? '2px solid var(--success)' : '1px solid var(--border)',
                      background: paymentMethod === 'cash_on_delivery' ? '#f0fdf4' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => setPaymentMethod('cash_on_delivery')}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>💵 Paiement en Espèces à la Livraison</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Réglez au livreur à la réception de votre colis</div>
                      </div>
                    </div>
                    <span style={{ background: 'var(--success)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>ESPÈCES</span>
                  </label>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE : RÉCAPITULATIF DE LA COMMANDE */}
            <div
              style={{
                background: '#fff',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
                position: 'sticky',
                top: '90px'
              }}
            >
              <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>
                Votre Panier ({cartItems.length} articles)
              </h3>

              {/* Liste récapitulative des articles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700 }}>{item.quantity}x</span>
                      <span style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totaux & Frais */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sous-total :</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Frais de livraison :</span>
                  <span style={{ fontWeight: 700, color: deliveryFee === 0 ? 'var(--success)' : 'var(--dark)' }}>
                    {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>Total à payer :</span>
                  <span style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={submitting}
                style={{
                  background: paymentMethod === 'wave' 
                    ? '#00B2FE' 
                    : paymentMethod === 'orange_money' 
                    ? '#f97316' 
                    : '#16a34a',
                  borderColor: paymentMethod === 'wave' 
                    ? '#00B2FE' 
                    : paymentMethod === 'orange_money' 
                    ? '#f97316' 
                    : '#16a34a',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  boxShadow: paymentMethod === 'wave' 
                    ? '0 4px 14px rgba(0, 178, 254, 0.4)' 
                    : '0 4px 14px rgba(22, 163, 74, 0.35)'
                }}
              >
                {submitting ? 'Validation en cours...' : (
                  paymentMethod === 'wave'
                    ? `🌊 Valider & Payer Wave (${formatPrice(grandTotal)})`
                    : paymentMethod === 'orange_money'
                    ? `🟠 Valider & Payer Orange Money (${formatPrice(grandTotal)})`
                    : `📲 Valider & Envoyer Commande (${formatPrice(grandTotal)})`
                )}
              </button>

              <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
                ⚡ En validant, votre commande est enregistrée et transmise directement sur le WhatsApp officiel de <strong>Global Business Services Grp SF (+221 77 201 86 97)</strong>.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
