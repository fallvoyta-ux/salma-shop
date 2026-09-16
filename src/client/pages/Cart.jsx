import React from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function Cart({ onNavigate }) {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const { formatPrice, settings } = useSettings();

  const freeThreshold = parseInt(settings.free_shipping_threshold, 10) || 50000;
  const isFreeDeliveryEligible = subtotal >= freeThreshold;

  if (cartItems.length === 0) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛒</div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--dark)' }}>Votre panier est vide</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
            Vous n'avez pas encore ajouté d'articles. Découvrez notre sélection d'articles de mode wax, soins naturels et maroquinerie sénégalaise.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('/shop')}>
            Commencer mon shopping →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="section-tag">Récapitulatif</span>
            <h1 className="section-title">Mon Panier d'Achats</h1>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={clearCart}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            🗑️ Vider le panier
          </button>
        </div>

        {/* Bannière livraison gratuite Dakar */}
        <div
          style={{
            background: isFreeDeliveryEligible ? 'var(--success-bg)' : '#fef3c7',
            border: `1px solid ${isFreeDeliveryEligible ? '#a7f3d0' : '#fde68a'}`,
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: isFreeDeliveryEligible ? 'var(--success)' : '#92400e'
          }}
        >
          {isFreeDeliveryEligible ? (
            '🎉 Vous bénéficiez de la LIVRAISON GRATUITE à Dakar pour cette commande !'
          ) : (
            `💡 Ajoutez encore ${formatPrice(freeThreshold - subtotal)} pour bénéficier de la livraison gratuite à Dakar !`
          )}
        </div>

        {/* Grille : Tableau du panier (gauche) + Résumé de commande (droite) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '3rem', alignItems: 'start' }}>
          {/* Liste des articles */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Produit</th>
                  <th style={{ padding: '1rem' }}>Prix</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Quantité</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Sous-total</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Infos produit */}
                    <td style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=200&q=80'}
                        alt={item.name}
                        style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      />
                      <div>
                        <a
                          href={`/product/${item.slug}`}
                          onClick={(e) => { e.preventDefault(); onNavigate(`/product/${item.slug}`); }}
                          style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '0.95rem' }}
                        >
                          {item.name}
                        </a>
                        {item.sku && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Réf : {item.sku}</div>
                        )}
                      </div>
                    </td>

                    {/* Prix unitaire */}
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {formatPrice(item.price)}
                    </td>

                    {/* Quantité +/- */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
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
                          style={{ width: '30px', height: '30px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          style={{ width: '30px', height: '30px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Sous-total article */}
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--dark)' }}>
                      {formatPrice(item.price * item.quantity)}
                    </td>

                    {/* Supprimer */}
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                        onClick={() => removeFromCart(item.id)}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Résumé de commande */}
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1.5rem', color: 'var(--dark)' }}>
              Résumé de la Commande
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sous-total articles :</span>
                <span style={{ fontWeight: 700 }}>{formatPrice(subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Frais de livraison :</span>
                <span style={{ fontWeight: 600, color: isFreeDeliveryEligible ? 'var(--success)' : 'var(--text-main)' }}>
                  {isFreeDeliveryEligible ? 'Gratuit (Dakar)' : 'Calculé au paiement'}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>Total estimé :</span>
                <span style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--dark)', fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginBottom: '1rem' }}
              onClick={() => onNavigate('/checkout')}
            >
              Passer la commande →
            </button>

            <button
              className="btn btn-outline btn-block"
              onClick={() => onNavigate('/shop')}
            >
              Continuer mes achats
            </button>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>🔒 Paiement 100% sécurisé via Wave, Orange Money et Carte</div>
              <div>🚚 Livraison rapide en 24h à Dakar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
