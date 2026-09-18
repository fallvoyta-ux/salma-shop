import React from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product, onNavigate }) {
  const { addToCart } = useCart();
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    showToast(`"${product.name}" a été ajouté à votre panier ✓`, 'success');
  };

  const productUrl = `/product/${product.slug || product.id}`;

  const handleCardClick = () => {
    onNavigate(productUrl);
  };

  const imageSrc = product.primary_image || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&q=80';

  return (
    <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      {/* Photo & Badge Localisation */}
      <div className="product-image-wrap">
        <a
          href={productUrl}
          onClick={(e) => {
            e.preventDefault();
            handleCardClick();
          }}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <img src={imageSrc} alt={product.name} loading="lazy" />
        </a>

        <div className="product-badges">
          <span className="badge-location">📍 Dakar</span>
          {isOutOfStock && (
            <span className="badge" style={{ background: '#475569', color: '#fff' }}>Rupture</span>
          )}
        </div>
      </div>

      {/* Détails du produit */}
      <div className="product-body">
        {product.category_name && (
          <div className="product-cat">{product.category_name}</div>
        )}

        <h3 className="product-title" title={product.name}>
          <a
            href={productUrl}
            onClick={(e) => {
              e.preventDefault();
              handleCardClick();
            }}
            className="product-title-anchor"
          >
            {product.name}
          </a>
        </h3>

        {/* Note & Avis style Kahpoo */}
        <div className="product-rating">
          <span>★★★★★</span>
          <span className="product-rating-count">
            ({product.rating_count || 5}.0)
          </span>
        </div>

        {/* Prix Simple en FCFA */}
        <div className="product-price-wrap">
          <span className="product-price">{formatPrice(product.price)}</span>
        </div>

        {/* Boutons d'action : Voir détail & Ajouter au panier */}
        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            title="Ajouter au panier"
            style={{ flex: 1, borderRadius: 'var(--radius-md)', fontWeight: 700, padding: '0.6rem 0.75rem', fontSize: '0.88rem' }}
          >
            {isOutOfStock ? 'Épuisé' : '🛒 Ajouter'}
          </button>

          <button
            type="button"
            className="btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            title="Voir la fiche détaillée de ce produit"
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              padding: '0.6rem 0.85rem',
              fontSize: '0.88rem',
              whiteSpace: 'nowrap'
            }}
          >
            Détails →
          </button>
        </div>
      </div>
    </div>
  );
}
