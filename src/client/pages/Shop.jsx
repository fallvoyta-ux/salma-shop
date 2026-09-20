import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

export default function Shop({ initialSearch = '', initialCategory = '', initialPromo = false, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(initialPromo);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Charger les catégories au démarrage
  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) setCategories(data.categories || []);
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    }
    fetchCats();
  }, []);

  // Charger les produits selon les critères
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (promoOnly) params.append('promo', 'true');
      params.append('sort', sortBy);
      params.append('page', page);
      params.append('limit', 12);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
        setTotalProducts(data.pagination.total || 0);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, minPrice, maxPrice, inStockOnly, promoOnly, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setPromoOnly(false);
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <div className="container">
        {/* En-tête de la page Boutique */}
        <div
          style={{
            background: 'var(--surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-tag">Catalogue Sénégal</span>
              <h1 style={{ fontSize: '2rem', color: 'var(--dark)', marginTop: '0.25rem' }}>
                Boutique en Ligne
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {totalProducts} produit{totalProducts > 1 ? 's' : ''} trouvé{totalProducts > 1 ? 's' : ''}
                {search && <span> pour la recherche « <strong>{search}</strong> »</span>}
              </p>
            </div>

            {/* Barre de tri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Trier par :</label>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '180px', padding: '0.5rem 0.85rem' }}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="popularity">Popularité</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bouton Filtres sur Mobile / Tablette */}
        <div className="shop-mobile-filter-bar">
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1.25rem', padding: '0.75rem 1rem' }}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <span>⚙️ {showMobileFilters ? 'Masquer les filtres' : 'Afficher les filtres & recherche'}</span>
            {(selectedCategory !== 'all' || minPrice || maxPrice || inStockOnly || promoOnly || search) && (
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>Filtres actifs</span>
            )}
          </button>
        </div>

        {/* Disposition principale : Sidebar Filtres + Grille Produits */}
        <div className="responsive-shop-grid">
          {/* SIDEBAR FILTRES */}
          <aside
            className={`shop-sidebar ${showMobileFilters ? 'open' : ''}`}
            style={{
              background: 'var(--surface)',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Filtres</h3>
              <button
                onClick={handleResetFilters}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Réinitialiser
              </button>
            </div>

            {/* Recherche textuelle */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Recherche</label>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nom, référence..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  OK
                </button>
              </form>
            </div>

            {/* Catégories */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Catégories</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'all'}
                    onChange={() => { setSelectedCategory('all'); setPage(1); }}
                  />
                  <span>Toutes les catégories</span>
                </label>

                {categories.map((c) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === c.slug}
                      onChange={() => { setSelectedCategory(c.slug); setPage(1); }}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Plage de Prix en FCFA */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Prix (FCFA)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Disponibilité */}
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
                />
                <span>En stock uniquement</span>
              </label>
            </div>
          </aside>

          {/* CATALOGUE PRODUITS */}
          <main>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p style={{ color: 'var(--text-muted)' }}>Chargement des produits en cours...</p>
              </div>
            ) : products.length === 0 ? (
              <div
                style={{
                  background: 'var(--surface)',
                  padding: '4rem 2rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--dark)' }}>Aucun produit ne correspond à vos critères</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                  Essayez d'élargir votre recherche, de changer de catégorie ou de réinitialiser vos filtres.
                </p>
                <button className="btn btn-primary" onClick={handleResetFilters}>
                  Réinitialiser tous les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '3.5rem'
                    }}
                  >
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    >
                      ← Précédent
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        className={`btn btn-sm ${page === num ? 'btn-primary' : 'btn-outline'}`}
                        style={{ minWidth: '38px', height: '38px', padding: 0 }}
                        onClick={() => setPage(num)}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      className="btn btn-outline btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
