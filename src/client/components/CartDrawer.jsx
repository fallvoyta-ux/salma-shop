import React from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function CartDrawer({ onNavigate }) {
  const { cartItems, updateQuantity, removeFromCart, subtotal, isDrawerOpen, closeDrawer, cartNotification, clearCartNotification } = useCart();
  const { formatPrice, settings } = useSettings();

  if (!isDrawerOpen) return null;

  const freeThreshold = parseInt(settings.free_shipping_threshold, 10) || 50000;
  const missingForFree = freeThreshold - subtotal;

  return (
    <div className="drawer-backdrop" onClick={closeDrawer}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className="drawer-header">
          <div className="drawer-title">Mon Panier ({cartItems.length})</div>
          <button
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={closeDrawer}
          >
            ✕
          </button>
        </div>

        {/* Notification de mise à jour des prix/stocks réels */}
        {cartNotification && (
          <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '0.65rem 1.25rem', fontSize: '0.82rem', color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔄 {cartNotification}</span>
            <button
              onClick={clearCartNotification}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#1e40af', marginLeft: '0.5rem' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Barre de gratuité livraison Dakar */}
        {subtotal > 0 && (
          <div style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
            {missingForFree <= 0 ? (
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                🎉 Félicitations ! Vous bénéficiez de la livraison offerte à Dakar !
              </span>
            ) : (
              <span>
                Plus que <strong>{formatPrice(missingForFree)}</strong> pour débloquer la livraison gratuite à Dakar !
              </span>
            )}
          </div>
        )}

        {/* Corps du panier */}
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--dark)' }}>Votre panier est vide</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Découvrez nos collections d’exception et commencez votre shopping.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeDrawer();
                  onNavigate('/shop');
                }}
              >
                Découvrir la boutique
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center'
                }}
              >
                {/* Photo du produit */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=300&q=80'}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Infos produit & quantité */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      marginBottom: '0.25rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.name}
                  </h5>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.45rem' }}>
                    {formatPrice(item.price)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Sélecteur quantité +/- */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        style={{ width: '28px', height: '28px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ width: '32px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        style={{ width: '28px', height: '28px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pied du tiroir */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sous-total :</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dark)' }}>
                {formatPrice(subtotal)}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Frais de livraison calculés lors de l'étape suivante selon votre zone (Dakar ou régions).
            </p>

            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginBottom: '0.75rem' }}
              onClick={() => {
                closeDrawer();
                onNavigate('/checkout');
              }}
            >
              Passer la commande →
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline btn-block btn-sm"
                onClick={() => {
                  closeDrawer();
                  onNavigate('/cart');
                }}
              >
                Voir le panier
              </button>
              <button
                className="btn btn-outline btn-block btn-sm"
                onClick={closeDrawer}
              >
                Continuer mes achats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
