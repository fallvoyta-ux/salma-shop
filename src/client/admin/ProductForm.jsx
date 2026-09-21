import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductForm({ productId = null, onNavigate }) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(productId);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // Données du produit
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPromo, setIsPromo] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Spécifications (paires clé-valeur)
  const [specs, setSpecs] = useState([{ key: 'Matière', value: '' }, { key: 'Origine', value: 'Sénégal' }]);

  // Photos
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Charger les catégories et le produit si édition
  useEffect(() => {
    async function init() {
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.categories || []);
        }

        if (isEditing) {
          const prodRes = await fetch(`/api/products/${productId}`);
          const prodData = await prodRes.json();
          if (prodData.success && prodData.product) {
            const p = prodData.product;
            setName(p.name);
            setCategoryId(p.category_id || '');
            setSku(p.sku || '');
            setPrice(p.price.toString());
            setComparePrice(p.compare_price ? p.compare_price.toString() : '');
            setStock(p.stock.toString());
            setLowStockThreshold(p.low_stock_threshold.toString());
            setShortDescription(p.short_description || '');
            setDescription(p.description || '');
            setIsFeatured(p.is_featured === 1);
            setIsPromo(p.is_promo === 1);
            setIsActive(p.is_active === 1);
            setExistingImages(p.images || []);

            if (p.parsed_specifications && Object.keys(p.parsed_specifications).length > 0) {
              setSpecs(Object.entries(p.parsed_specifications).map(([k, v]) => ({ key: k, value: v })));
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement formulaire produit:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [productId, isEditing]);

  const handleAddSpecRow = () => {
    setSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, val) => {
    setSpecs(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const handleImageFileChange = (e) => {
    if (e.target.files) {
      setNewImageFiles(Array.from(e.target.files));
    }
  };

  const handleSetPrimary = async (imgId) => {
    try {
      const res = await fetch(`/api/admin/products/images/${imgId}/set-primary`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Photo principale mise à jour.', 'info');
        setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imgId ? 1 : 0 })));
      }
    } catch (err) {
      showToast('Erreur lors du changement de photo principale.', 'error');
    }
  };

  const handleDeleteImage = async (imgId) => {
    try {
      const res = await fetch(`/api/admin/products/images/${imgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Photo supprimée.', 'info');
        setExistingImages(prev => prev.filter(img => img.id !== imgId));
      }
    } catch (err) {
      showToast('Erreur suppression photo.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !price) {
      showToast('Le nom et le prix du produit sont obligatoires.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Construction de l'objet spécifications
      const specsObj = {};
      specs.forEach(s => {
        if (s.key.trim()) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category_id', categoryId || '');
      formData.append('sku', sku.trim());
      formData.append('price', price);
      if (comparePrice) formData.append('compare_price', comparePrice);
      formData.append('stock', stock);
      formData.append('low_stock_threshold', lowStockThreshold);
      formData.append('short_description', shortDescription.trim());
      formData.append('description', description.trim());
      formData.append('is_featured', isFeatured ? '1' : '0');
      formData.append('is_promo', isPromo ? '1' : '0');
      formData.append('is_active', isActive ? '1' : '0');
      formData.append('specifications', JSON.stringify(specsObj));

      if (imageUrlInput.trim()) {
        formData.append('image_urls', imageUrlInput.trim());
      }

      for (const file of newImageFiles) {
        formData.append('images', file);
      }

      let res;
      if (isEditing) {
        // Mode modification
        res = await fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: name.trim(),
            category_id: categoryId || null,
            sku: sku.trim(),
            price: parseInt(price, 10),
            compare_price: comparePrice ? parseInt(comparePrice, 10) : null,
            stock: parseInt(stock, 10),
            low_stock_threshold: parseInt(lowStockThreshold, 10),
            short_description: shortDescription.trim(),
            description: description.trim(),
            is_featured: isFeatured ? 1 : 0,
            is_promo: isPromo ? 1 : 0,
            is_active: isActive ? 1 : 0,
            specifications: specsObj
          })
        });

        // Téléverser de nouvelles photos si fournies
        if (newImageFiles.length > 0) {
          const imgForm = new FormData();
          for (const file of newImageFiles) {
            imgForm.append('images', file);
          }
          await fetch(`/api/admin/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: imgForm
          });
        }
      } else {
        // Mode création
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(isEditing ? 'Produit modifié avec succès !' : 'Nouveau produit créé avec succès !', 'success');
        onNavigate('/admin/products');
      } else {
        showToast(data.message || 'Erreur lors de l’enregistrement.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur serveur.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement du formulaire...</div>;
  }

  return (
    <div style={{ maxWidth: '880px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>
            {isEditing ? 'Modifier le Produit' : 'Créer un Nouveau Produit'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Remplissez les informations, les tarifs en FCFA et les photos du produit.
          </p>
        </div>

        <button className="btn btn-outline" onClick={() => onNavigate('/admin/products')}>
          Annuler & Retour
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* BLOC 1 : INFORMATIONS DE BASE */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Informations Principales</h3>

          <div className="form-group">
            <label className="form-label">Nom du Produit *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Robe Longue Wax Ébène & Or"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- Choisir une catégorie --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Référence / SKU (Unique)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: ROB-WAX-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <span className="form-hint">Laissez vide pour génération automatique</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description Courte</label>
            <input
              type="text"
              className="form-input"
              placeholder="Phrase d'accroche visible sous le titre du produit..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description Détaillée</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Détails du produit, coupe, matières, conseils d'entretien..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* BLOC 2 : PRIX & GESTION DU STOCK */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Prix & Inventaire</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Prix de Vente (en FCFA) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ex: 35000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ancien Prix (si promotion - FCFA)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ex: 45000"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
              />
              <span className="form-hint">Permet d’afficher le badge de réduction -%</span>
            </div>

            <div className="form-group">
              <label className="form-label">Quantité en Stock *</label>
              <input
                type="number"
                className="form-input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Seuil d'Alerte Stock Faible</label>
              <input
                type="number"
                className="form-input"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
              <span className="form-hint">Alerte sur le tableau de bord quand le stock passe sous ce chiffre</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>Mettre en Vedette (Accueil)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isPromo}
                onChange={(e) => setIsPromo(e.target.checked)}
              />
              <span style={{ color: 'var(--danger)' }}>En Promotion 🔥</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Produit Actif (Visible en boutique)</span>
            </label>
          </div>
        </div>

        {/* BLOC 3 : PHOTOS DU PRODUIT */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>Galerie Photos du Produit</h3>

          {/* Photos déjà enregistrées */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Photos actuelles</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {existingImages.map((img) => (
                  <div key={img.id} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: img.is_primary === 1 ? '3px solid var(--primary)' : '1px solid var(--border)' }}>
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(220, 38, 38, 0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.75rem' }}
                      title="Supprimer la photo"
                    >
                      ✕
                    </button>
                    {img.is_primary === 1 ? (
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Principale</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: '0.65rem', cursor: 'pointer' }}
                      >
                        Mettre principale
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Téléverser des fichiers images depuis le PC / Smartphone */}
          <div className="form-group">
            <label className="form-label">Téléverser des photos (JPG, PNG, WEBP)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="form-input"
              onChange={handleImageFileChange}
            />
            <span className="form-hint">Vous pouvez sélectionner plusieurs photos à la fois (max 5 Mo par photo).</span>
          </div>

          {/* Ou coller une URL d'image */}
          <div className="form-group">
            <label className="form-label">Ou coller une URL d'image directe</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
            />
          </div>
        </div>

        {/* BLOC 4 : CARACTÉRISTIQUES TECHNIQUES */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>Caractéristiques & Guide</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleAddSpecRow}>
              + Ajouter une caractéristique
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {specs.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Propriété (ex: Matière, Taille, Entretien)"
                  value={s.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  style={{ width: '40%' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Valeur (ex: 100% Coton Wax, Cuir de zébu)"
                  value={s.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecRow(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem' }}
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BOUTON ENREGISTRER */}
        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={submitting}
        >
          {submitting ? 'Enregistrement en cours...' : (isEditing ? 'Enregistrer les Modifications' : 'Créer et Mettre en Ligne')}
        </button>
      </form>
    </div>
  );
}
