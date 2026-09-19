import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail({ slug, onNavigate }) {
  const { addToCart } = useCart();
  const { formatPrice, settings } = useSettings();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Formulaire d'avis
  const [reviewName, setReviewName] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const [prodRes, relRes] = await Promise.all([
          fetch(`/api/products/${slug}`),
          fetch(`/api/products/${slug}/related`)
        ]);

        const [prodData, relData] = await Promise.all([
          prodRes.json(),
          relRes.json()
        ]);

        if (prodData.success && prodData.product) {
          setProduct(prodData.product);
          setSelectedImageIndex(0);
          setQuantity(1);
        }
        if (relData.success) {
          setRelated(relData.products || []);
        }
      } catch (err) {
        console.error('Erreur chargement produit:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="section" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-muted)' }}>Chargement des détails du produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <h2>Ce produit n'est plus disponible</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Le produit demandé n'existe pas ou a été désactivé.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('/shop')}>
            Retourner à la boutique
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isPromo = product.is_promo === 1 || (product.compare_price && product.compare_price > product.price);
  const discountPercent = isPromo && product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&q=80' }];

  const activeImage = images[selectedImageIndex] ? images[selectedImageIndex].image_url : images[0].image_url;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    showToast(`${quantity} x "${product.name}" ajouté(s) au panier ✓`, 'success');
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    onNavigate('/checkout');
  };

  // WhatsApp Order URL
  const whatsappPhone = (settings.store_whatsapp || '221771234567').replace(/[^0-9]/g, '');
  const whatsappMessage = `Bonjour ${settings.store_name} ! 👋\n\n` +
    `Je souhaite commander ce produit :\n` +
    `✨ *${product.name}*\n` +
    `🔖 *Réf/SKU* : ${product.sku || 'N/A'}\n` +
    `🔢 *Quantité* : ${quantity}\n` +
    `💵 *Prix* : ${(product.price).toLocaleString('fr-FR')} FCFA\n` +
    `💰 *Total* : ${(product.price * quantity).toLocaleString('fr-FR')} FCFA\n\n` +
    `Pouvez-vous confirmer la disponibilité pour une livraison à Dakar/Sénégal ? Merci !`;
  const whatsappOrderUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  // Envoi d'un avis client
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      showToast('Veuillez renseigner votre nom et votre commentaire.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/reviews/product/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Votre avis a été enregistré avec succès ! Merci pour votre retour.', 'success');
        setReviewComment('');
        // Recharger les avis
        const updatedRes = await fetch(`/api/products/${slug}`);
        const updatedData = await updatedRes.json();
        if (updatedData.success && updatedData.product) {
          setProduct(updatedData.product);
        }
      } else {
        showToast(data.message || 'Erreur lors de l’envoi de l’avis.', 'error');
      }
    } catch (err) {
      showToast('Une erreur est survenue.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Fil d'Ariane (Breadcrumbs) */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>Accueil</a>
          <span>/</span>
          <a href="/shop" onClick={(e) => { e.preventDefault(); onNavigate('/shop'); }}>Boutique</a>
          <span>/</span>
          {product.category_name && (
            <>
              <a href={`/shop?category=${product.category_slug}`} onClick={(e) => { e.preventDefault(); onNavigate(`/shop?category=${product.category_slug}`); }}>
                {product.category_name}
              </a>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--dark)', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Détails Produit : 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', marginBottom: '4rem', alignItems: 'start' }}>
          {/* COLONNE GAUCHE : GALERIE PHOTOS */}
          <div>
            <div
              style={{
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                marginBottom: '1rem',
                position: 'relative'
              }}
            >
              <img
                src={activeImage}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {discountPercent && (
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span className="badge badge-promo" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                    PROMO -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: selectedImageIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border)',
                      padding: 0,
                      cursor: 'pointer',
                      background: '#fff',
                      opacity: selectedImageIndex === idx ? 1 : 0.7,
                      flexShrink: 0
                    }}
                  >
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLONNE DROITE : INFORMATIONS & ACHAT */}
          <div>
            {product.category_name && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {product.category_name}
              </div>
            )}

            <h1 style={{ fontSize: '2.2rem', lineHeight: 1.25, marginBottom: '0.75rem', color: 'var(--dark)' }}>
              {product.name}
            </h1>

            {/* Note moyenne & référence SKU */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                {product.review_count > 0 ? (
                  <>
                    <span>★</span> {Number(product.average_rating || 5).toFixed(1)} ({product.review_count} avis)
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Aucun avis pour l'instant</span>
                )}
              </div>
              <div>•</div>
              <div>Réf : <strong>{product.sku || 'SLM-001'}</strong></div>
              <div>•</div>
              <div>
                {isOutOfStock ? (
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Rupture de stock</span>
                ) : product.stock <= (product.low_stock_threshold || 5) ? (
                  <span style={{ color: 'var(--warning)', fontWeight: 700 }}>Plus que {product.stock} en stock !</span>
                ) : (
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>En stock ({product.stock} disponibles)</span>
                )}
              </div>
            </div>

            {/* Prix Simple en FCFA */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', padding: '1.25rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Description courte */}
            <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {product.short_description || product.description}
            </p>

            {/* Actions : Quantité & Boutons d'achat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quantité :</span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: '#fff'
                  }}
                >
                  <button
                    style={{ width: '40px', height: '40px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={isOutOfStock}
                  >
                    -
                  </button>
                  <span style={{ width: '45px', textAlign: 'center', fontWeight: 700 }}>
                    {quantity}
                  </span>
                  <button
                    style={{ width: '40px', height: '40px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
                    onClick={() => setQuantity(prev => Math.min(product.stock || 99, prev + 1))}
                    disabled={isOutOfStock || quantity >= (product.stock || 99)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bouton Ajouter au panier */}
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Produit Épuisé' : '🛒 Ajouter au panier'}
              </button>

              {/* Bouton Acheter Maintenant */}
              <button
                className="btn btn-secondary btn-block btn-lg"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                ⚡ Acheter maintenant (Commander)
              </button>

              {/* Bouton Commander via WhatsApp */}
              {settings.whatsapp_ordering_enabled === 'true' && (
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-block btn-lg"
                >
                  💬 Commander directement via WhatsApp
                </a>
              )}

              {/* Partage sur les Réseaux Sociaux */}
              <div className="product-share-box">
                <span className="share-box-title">Partager cet article sur les réseaux :</span>
                <div className="share-box-buttons">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Regarde cette merveille sur ${settings.store_name || 'Global Business Services Grp SF'} : *${product.name}* (${formatPrice(currentPrice)}) ✨ 👉 ${window.location.href}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="share-pill whatsapp"
                    title="Partager sur WhatsApp (Statut ou amis)"
                  >
                    <span>💬 WhatsApp</span>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="share-pill facebook"
                    title="Partager sur Facebook"
                  >
                    <span>📘 Facebook</span>
                  </a>

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Lien de l’article copié dans le presse-papier !', 'success');
                      }
                    }}
                    className="share-pill copy"
                    title="Copier le lien direct du produit"
                  >
                    <span>🔗 Copier le lien</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Spécifications & Atouts */}
            <div style={{ background: 'var(--surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div>🚚 <strong>Livraison :</strong> Dakar en 24h</div>
                <div>💳 <strong>Paiement :</strong> Wave / OM / CB</div>
                <div>🔄 <strong>Échange :</strong> Sous 48h en boutique</div>
                <div>🇸🇳 <strong>Origine :</strong> Dakar, Sénégal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description longue & Spécifications techniques */}
        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Description Détaillée</h3>
          <p style={{ lineHeight: 1.8, color: 'var(--text-main)', marginBottom: '2rem', fontSize: '1rem' }}>
            {product.description}
          </p>

          {product.parsed_specifications && Object.keys(product.parsed_specifications).length > 0 && (
            <div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--dark)' }}>Caractéristiques & Spécifications</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                <tbody>
                  {Object.entries(product.parsed_specifications).map(([key, val], idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, width: '35%', color: 'var(--text-main)' }}>{key}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section Avis Clients */}
        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--dark)' }}>Avis Clients ({product.review_count || 0})</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Découvrez les retours d'expérience de notre clientèle dakaroise.
              </p>
            </div>
          </div>

          {/* Liste des avis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((r) => (
                <div key={r.id} style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{r.user_name}</div>
                    <div style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{r.comment}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun avis pour le moment. Soyez la première à donner votre avis !</p>
            )}
          </div>

          {/* Formulaire pour laisser un avis */}
          <div style={{ background: 'var(--surface-alt)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--dark)' }}>Laisser un avis sur ce produit</h4>
            <form onSubmit={handleReviewSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Votre nom ou prénom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Note</label>
                  <select
                    className="form-select"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
                  >
                    <option value={5}>★★★★★ (5/5) - Excellent</option>
                    <option value={4}>★★★★☆ (4/5) - Très bien</option>
                    <option value={3}>★★★☆☆ (3/5) - Moyen</option>
                    <option value={2}>★★☆☆☆ (2/5) - Décevant</option>
                    <option value={1}>★☆☆☆☆ (1/5) - Mauvais</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Votre commentaire</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Partagez votre expérience avec cet article (qualité du tissu, taille, tenue...)..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview}
              >
                {submittingReview ? 'Publication...' : 'Publier mon avis'}
              </button>
            </form>
          </div>
        </div>

        {/* Produits Similaires */}
        {related.length > 0 && (
          <div>
            <div className="section-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <span className="section-tag">Suggestions</span>
              <h2 className="section-title">Produits Similaires</h2>
            </div>
            <div className="products-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
