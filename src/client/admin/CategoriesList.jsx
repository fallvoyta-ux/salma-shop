import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function CategoriesList({ onNavigate }) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modale création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Modale suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setDisplayOrder('0');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setDisplayOrder(cat.display_order ? cat.display_order.toString() : '0');
    setModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        display_order: parseInt(displayOrder, 10) || 0
      };

      let res;
      if (editingCategory) {
        res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(editingCategory ? 'Catégorie modifiée !' : 'Catégorie créée !', 'success');
        setModalOpen(false);
        fetchCategories();
      } else {
        showToast(data.message || 'Erreur lors de l’enregistrement.', 'error');
      }
    } catch (err) {
      showToast('Erreur serveur.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    try {
      const res = await fetch(`/api/admin/categories/${catToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Catégorie supprimée.', 'success');
        setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
      }
    } catch (err) {
      showToast('Erreur suppression.', 'error');
    } finally {
      setDeleteModalOpen(false);
      setCatToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Gestion des Catégories</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Organisez votre catalogue par univers de produits.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nouvelle Catégorie
        </button>
      </div>

      {/* Tableau des catégories (Desktop) */}
      <div className="admin-desktop-table" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Image & Catégorie</th>
              <th style={{ padding: '1rem' }}>Description</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Ordre</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Nombre d'articles</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=100&q=80'}
                    alt=""
                    style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>slug: {cat.slug}</div>
                  </div>
                </td>

                <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                  {cat.description || 'Aucune description'}
                </td>

                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                  {cat.display_order}
                </td>

                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span className="badge badge-stock">
                    {cat.product_count || 0} produit(s)
                  </span>
                </td>

                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(cat)}>
                      Modifier
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => {
                        setCatToDelete(cat);
                        setDeleteModalOpen(true);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes Mobiles pour smartphones */}
      <div className="admin-mobile-cards">
        {loading ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Chargement des catégories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucune catégorie créée pour l'instant.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="admin-card-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=100&q=80'}
                  alt=""
                  style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dark)' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>slug: {cat.slug}</div>
                </div>
                <span className="badge badge-stock" style={{ flexShrink: 0, fontSize: '0.75rem' }}>
                  {cat.product_count || 0} produit(s)
                </span>
              </div>

              {cat.description && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {cat.description}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Ordre d'affichage : <strong>#{cat.display_order}</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: '38px', padding: '0 14px', fontWeight: 600 }}
                    onClick={() => handleOpenEdit(cat)}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: '38px', padding: '0 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => {
                      setCatToDelete(cat);
                      setDeleteModalOpen(true);
                    }}
                    title="Supprimer la catégorie"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale d'ajout / modification */}
      <Modal
        isOpen={modalOpen}
        title={editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSaveCategory}
        confirmText={submitting ? 'Enregistrement...' : 'Enregistrer'}
      >
        <form onSubmit={handleSaveCategory}>
          <div className="form-group">
            <label className="form-label">Nom de la Catégorie *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Bijoux Traditionnels Dorés"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Courte description de l'univers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL de l'image représentative</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ordre d'affichage</label>
            <input
              type="number"
              className="form-input"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modale de suppression */}
      <Modal
        isOpen={deleteModalOpen}
        title="Supprimer la Catégorie"
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        confirmText="Supprimer"
        isDanger={true}
      >
        <p>Êtes-vous certaine de vouloir supprimer la catégorie « <strong>{catToDelete?.name}</strong> » ?</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Les produits associés ne seront pas supprimés, mais deviendront non-catégorisés.
        </p>
      </Modal>
    </div>
  );
}
