import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function ProductsList({ onNavigate }) {
  const { token } = useAuth();
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleToggleStatus = async (product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Statut du produit "${product.name}" mis à jour.`, 'info');
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: data.is_active } : p));
      }
    } catch (err) {
      showToast('Erreur lors du changement de statut.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Produit supprimé avec succès.', 'success');
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      }
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleUpdateStock = async (product, newStock) => {
    const parsed = parseInt(newStock, 10);
    if (isNaN(parsed) || parsed < 0) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: parsed })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Stock mis à jour.', 'success');
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: parsed } : p));
      }
    } catch (err) {
      showToast('Erreur mise à jour stock.', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.category_name && p.category_name.toLowerCase().includes(term));
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion des Produits & Stocks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Catalogue complet des articles disponibles à la vente ({products.length} produits enregistrés).
          </p>
        </div>

        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('/admin/products/new')}>
          + Nouveau Produit
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{ background: '#fff', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '1.2rem' }}>🔍</span>
        <input
          type="text"
          className="form-input"
          placeholder="Rechercher par nom, référence SKU ou catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.95rem' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tableau des produits (Desktop) */}
      <div className="admin-desktop-table" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Produit</th>
              <th style={{ padding: '1rem' }}>SKU</th>
              <th style={{ padding: '1rem' }}>Catégorie</th>
              <th style={{ padding: '1rem' }}>Prix (FCFA)</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Statut</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Chargement des produits...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Photo & Nom */}
                  <td style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={p.primary_image || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=100&q=80'}
                      alt=""
                      style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{p.name}</div>
                      {p.is_featured === 1 && <span className="badge badge-new" style={{ fontSize: '0.65rem' }}>Vedette</span>}
                      {p.is_promo === 1 && <span className="badge badge-promo" style={{ fontSize: '0.65rem', marginLeft: '4px' }}>Promo</span>}
                    </div>
                  </td>

                  {/* SKU */}
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {p.sku || 'N/A'}
                  </td>

                  {/* Catégorie */}
                  <td style={{ padding: '1rem' }}>
                    {p.category_name || 'Non catégorisé'}
                  </td>

                  {/* Prix */}
                  <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--dark)' }}>
                    {formatPrice(p.price)}
                    {p.compare_price && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {formatPrice(p.compare_price)}
                      </div>
                    )}
                  </td>

                  {/* Stock avec modification rapide */}
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <input
                      type="number"
                      defaultValue={p.stock}
                      onBlur={(e) => handleUpdateStock(p, e.target.value)}
                      style={{
                        width: '65px',
                        padding: '4px 6px',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-sm)',
                        border: p.stock <= p.low_stock_threshold ? '2px solid var(--danger)' : '1px solid var(--border)',
                        fontWeight: 700,
                        color: p.stock <= p.low_stock_threshold ? 'var(--danger)' : 'var(--dark)'
                      }}
                      title="Cliquez pour modifier le stock directement"
                    />
                  </td>

                  {/* Statut Actif / Inactif */}
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(p)}
                      style={{
                        background: p.is_active === 1 ? 'var(--success-bg)' : '#fee2e2',
                        color: p.is_active === 1 ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${p.is_active === 1 ? '#a7f3d0' : '#fecaca'}`,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {p.is_active === 1 ? 'Actif' : 'Désactivé'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onNavigate(`/admin/products/${p.id}/edit`)}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => {
                          setProductToDelete(p);
                          setDeleteModalOpen(true);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cartes Mobiles pour smartphones */}
      <div className="admin-mobile-cards">
        {loading ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Chargement des produits...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucun produit trouvé.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="admin-card-item"
            >
              {/* Entête produit : Photo, Nom, Badges */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <img
                  src={p.primary_image || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=100&q=80'}
                  alt=""
                  style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--dark)', lineHeight: '1.3' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      🏷️ {p.category_name || 'Non catégorisé'}
                    </span>
                    {p.sku && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        • SKU: {p.sku}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    {p.is_featured === 1 && <span className="badge badge-new" style={{ fontSize: '0.65rem', marginRight: '4px' }}>Vedette</span>}
                    {p.is_promo === 1 && <span className="badge badge-promo" style={{ fontSize: '0.65rem' }}>Promo</span>}
                  </div>
                </div>
              </div>

              {/* Prix */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Prix de vente :</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--dark)' }}>
                    {formatPrice(p.price)}
                  </span>
                  {p.compare_price && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '0.5rem' }}>
                      {formatPrice(p.compare_price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Contrôles tactiles rapides : Stock & Statut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                {/* Modification directe du stock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Stock :
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="number"
                      defaultValue={p.stock}
                      onBlur={(e) => handleUpdateStock(p, e.target.value)}
                      style={{
                        width: '75px',
                        minHeight: '40px',
                        padding: '4px 8px',
                        textAlign: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        borderRadius: 'var(--radius-md)',
                        border: p.stock <= p.low_stock_threshold ? '2px solid var(--danger)' : '1.5px solid var(--border)',
                        color: p.stock <= p.low_stock_threshold ? 'var(--danger)' : 'var(--dark)',
                        background: p.stock <= p.low_stock_threshold ? '#fff5f5' : '#fff'
                      }}
                    />
                    {p.stock <= p.low_stock_threshold && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700 }}>
                        ⚠️ Bas
                      </span>
                    )}
                  </div>
                </div>

                {/* Activation / Désactivation tactile */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Statut :
                  </label>
                  <button
                    onClick={() => handleToggleStatus(p)}
                    style={{
                      minHeight: '40px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: p.is_active === 1 ? 'var(--success-bg)' : '#fee2e2',
                      color: p.is_active === 1 ? 'var(--success)' : 'var(--danger)',
                      border: `1.5px solid ${p.is_active === 1 ? '#a7f3d0' : '#fecaca'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {p.is_active === 1 ? '✅ Actif' : '❌ Désactivé'}
                  </button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, minHeight: '42px', fontWeight: 700, fontSize: '0.88rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => onNavigate(`/admin/products/${p.id}/edit`)}
                >
                  ✏️ Modifier la fiche
                </button>
                <button
                  className="btn btn-outline"
                  style={{ minHeight: '42px', minWidth: '48px', color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  onClick={() => {
                    setProductToDelete(p);
                    setDeleteModalOpen(true);
                  }}
                  title="Supprimer ce produit"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale de confirmation de suppression */}
      <Modal
        isOpen={deleteModalOpen}
        title="Confirmation de Suppression"
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        confirmText="Supprimer définitivement"
        isDanger={true}
      >
        <p>
          Êtes-vous certaine de vouloir supprimer le produit « <strong>{productToDelete?.name}</strong> » ?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Cette action est irréversible et supprimera également les photos associées.
        </p>
      </Modal>
    </div>
  );
}
