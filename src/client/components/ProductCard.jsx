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

  const handleCardClick = () => {
    onNavigate(`/product/${product.slug}`);
  };

  const imageSrc = product.primary_image || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&q=80';

  return (
    <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      {/* Photo & Badge Localisation */}
      <div className="product-image-wrap">
        <img src={imageSrc} alt={product.name} loading="lazy" />

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
          {product.name}
        </h3>

        {/* Note & Avis style Kahpoo */}
        <div className="product-rating">
          <span>★★★★★</span>
          <span className="product-rating-count">
            ({product.rating_count || 5}.0)
          </span>
        </div>

        {/* Prix Simple en FCFA (Sans réduction) */}
        <div className="product-price-wrap">
          <span className="product-price">{formatPrice(product.price)}</span>
        </div>

        {/* Bouton d'action unique : Ajouter au panier style Kahpoo */}
        <div style={{ marginTop: '0.85rem' }}>
          <button
            className="btn btn-primary w-100"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            title="Ajouter au panier"
            style={{ borderRadius: 'var(--radius-md)', fontWeight: 700, padding: '0.6rem 1rem' }}
          >
            {isOutOfStock ? 'Épuisé' : '🛒 Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  );
}
