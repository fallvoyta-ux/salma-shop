import React, { useState, useEffect } from 'react';
import CategoryDrawing, { getCategoryTheme } from '../components/CategoryDrawings';

export default function Categories({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) setCategories(data.categories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Rayons & Articles</span>
          <h1 className="section-title">Tous nos Rayons</h1>
          <p className="section-desc">
            Explorez nos sélections d'articles chic et tendance disponibles à Dakar au meilleur prix.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>Chargement...</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 'clamp(1rem, 3vw, 2rem)'
            }}
          >
            {categories.map((cat) => {
              const theme = getCategoryTheme(cat.slug);
              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate(`/shop?category=${cat.slug}`)}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)'
                  }}
                  className="category-card"
                >
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <CategoryDrawing slug={cat.slug} alt={cat.name} size={76} />
                  </div>
                <div style={{ padding: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>
                    {cat.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                      Explorer les articles →
                    </span>
                    <span className="badge badge-stock">
                      {cat.product_count || 0} produit{(cat.product_count || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
