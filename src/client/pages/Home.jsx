import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import CategoryDrawing, { getCategoryTheme } from '../components/CategoryDrawings';
import AssuranceBanner from '../components/AssuranceBanner';
import { useSettings } from '../context/SettingsContext';

export default function Home({ onNavigate }) {
  const { settings, formatPrice } = useSettings();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?limit=100')
        ]);

        const [catsData, prodsData] = await Promise.all([
          catsRes.json(),
          prodsRes.json()
        ]);

        if (catsData.success) setCategories(catsData.categories || []);
        if (prodsData.success) setProducts(prodsData.products || []);
      } catch (err) {
        console.error('Erreur chargement données accueil:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getCategoryIcon = (slug) => {
    if (slug.includes('femme')) return '👗';
    if (slug.includes('homme')) return '👔';
    if (slug.includes('enfant')) return '🧒';
    if (slug.includes('sac')) return '👜';
    if (slug.includes('chaussure')) return '👠';
    if (slug.includes('bouteille') || slug.includes('gourde')) return '🍼';
    if (slug.includes('lunette')) return '🕶️';
    if (slug.includes('tissu') || slug.includes('wax')) return '🧵';
    if (slug.includes('montre')) return '⌚';
    if (slug.includes('boucle') || slug.includes('chaine') || slug.includes('bijou')) return '✨';
    return '🛍️';
  };

  const getCategoryFaIcon = (slug) => {
    if (slug.includes('femme')) return 'fas fa-female';
    if (slug.includes('homme')) return 'fas fa-male';
    if (slug.includes('enfant')) return 'fas fa-child';
    if (slug.includes('sac')) return 'fas fa-shopping-bag';
    if (slug.includes('chaussure')) return 'fas fa-shoe-prints';
    if (slug.includes('bouteille') || slug.includes('gourde')) return 'fas fa-wine-bottle';
    if (slug.includes('lunette')) return 'fas fa-glasses';
    if (slug.includes('tissu') || slug.includes('wax')) return 'fas fa-scroll';
    if (slug.includes('montre')) return 'fas fa-clock';
    if (slug.includes('boucle') || slug.includes('chaine') || slug.includes('bijou')) return 'fas fa-gem';
    return 'fas fa-tag';
  };

  // Filtrage simple et immédiat
  const filteredProducts = products.filter((p) => {
    const matchCategory = !activeCategory || p.category_slug === activeCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);

  return (
    <div style={{ background: '#f8f8fb', minHeight: '80vh' }}>
      <div className="container kahpoo-home-clean">
        {/* 1. BARRE DE RECHERCHE PRINCIPALE KAHPOO (APP-SEARCH) */}
        <div className="kahpoo-search-container">
          <div className="kahpoo-search-wrapper">
            <span className="kahpoo-search-icon">🔍</span>
            <input
              type="text"
              className="kahpoo-search-input"
              placeholder="Rechercher des habits, sacs, chaussures, tissus, montres, bijoux..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="kahpoo-search-clear"
                onClick={() => setSearchQuery('')}
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* NOUVELLE BANNIÈRE ULTRA-MODERNISÉE : ASSURANCE TOUTES BRANCHES */}
        <AssuranceBanner />

        {/* 2. BOUTONS RONDS DES RAYONS (Dessins d'articles en contour pur, sans couleurs) */}
        <div className="kahpoo-round-cats-wrap">
          {/* Bouton Rond "Tous les articles" avec dessin vectoriel caddie / panier en contour */}
          {(() => {
            const isAllActive = activeCategory === '';
            return (
              <div
                className="cat-round-item"
                onClick={() => setActiveCategory('')}
                title="Tous les articles"
              >
                <div className={`cat-round-btn ${isAllActive ? 'active' : ''}`}>
                  <CategoryDrawing slug="" alt="Tous les articles" size={42} />
                  <div className="btn-ripple"></div>
                </div>
                <span className={`cat-round-name ${isAllActive ? 'active' : ''}`}>
                  Tous les articles
                </span>
              </div>
            );
          })()}

          {/* Boutons Ronds avec dessins vectoriels d'articles en contour */}
          {categories.map((c) => {
            const isActive = activeCategory === c.slug;
            return (
              <div
                key={c.id}
                className="cat-round-item"
                onClick={() => setActiveCategory(c.slug)}
                title={c.name}
              >
                <div className={`cat-round-btn ${isActive ? 'active' : ''}`}>
                  <CategoryDrawing slug={c.slug} alt={c.name} size={42} />
                  <div className="btn-ripple"></div>
                </div>
                <span className={`cat-round-name ${isActive ? 'active' : ''}`}>
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. EN-TÊTE DE SECTION SIGNATURE AVEC DESSIN EN CONTOUR ASSORTI */}
        <div className="kahpoo-section-box">
          <div className="kahpoo-section-box-left">
            <div
              className="kahpoo-section-icon-badge"
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <CategoryDrawing slug={activeCategory} size={28} />
            </div>
            <div>
              <h1 className="kahpoo-section-title-clean">
                {activeCategoryObj ? activeCategoryObj.name : 'Articles Disponibles à Dakar'}
              </h1>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '0.35rem 0.85rem',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary)'
              }}
            >
              {filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="kahpoo-section-line"></div>

        {/* 4. GRILLE DES PRODUITS SIMPLE & ÉPURÉE */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}
            ></div>
            <p style={{ fontWeight: 600 }}>Chargement des articles...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '15px',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              margin: '2rem auto',
              maxWidth: '500px'
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛍️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '0.5rem' }}>
              Aucun article trouvé
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Aucun produit ne correspond à votre filtre. Essayez de réinitialiser la recherche.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setActiveCategory('');
                setSearchQuery('');
              }}
              style={{ borderRadius: '50px', padding: '0.5rem 1.25rem' }}
            >
              Voir tous les articles
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
