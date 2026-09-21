import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function DeliveryZones({ onNavigate }) {
  const { token } = useAuth();
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('2000');
  const [estimatedDays, setEstimatedDays] = useState('24h');
  const [submitting, setSubmitting] = useState(false);

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/delivery-zones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingZone(null);
    setName('');
    setPrice('2000');
    setEstimatedDays('24h');
    setModalOpen(true);
  };

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setName(zone.name);
    setPrice(zone.price.toString());
    setEstimatedDays(zone.estimated_days || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || price === '') return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        price: parseInt(price, 10),
        estimated_days: estimatedDays.trim()
      };

      let res;
      if (editingZone) {
        res = await fetch(`/api/admin/delivery-zones/${editingZone.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/delivery-zones', {
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
        showToast(editingZone ? 'Zone mise à jour !' : 'Nouvelle zone ajoutée !', 'success');
        setModalOpen(false);
        fetchZones();
      } else {
        showToast(data.message || 'Erreur enregistrement zone.', 'error');
      }
    } catch (err) {
      showToast('Erreur serveur.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (!confirm('Supprimer cette zone de livraison ?')) return;

    try {
      const res = await fetch(`/api/admin/delivery-zones/${zoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Zone supprimée.', 'success');
        setZones(prev => prev.filter(z => z.id !== zoneId));
      }
    } catch (err) {
      showToast('Erreur suppression.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Zones & Tarifs de Livraison</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Configurez les coûts de transport et délais estimés pour Dakar et l'intérieur du pays.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Ajouter une Zone
        </button>
      </div>

      {/* Tableau des zones de livraison (Desktop) */}
      <div className="admin-desktop-table" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Zone de Livraison</th>
              <th style={{ padding: '1rem' }}>Délai Estimé</th>
              <th style={{ padding: '1rem' }}>Tarif (FCFA)</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</td></tr>
            ) : zones.map((z) => (
              <tr key={z.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--dark)' }}>
                  {z.name}
                </td>

                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  ⏱️ {z.estimated_days || 'Non spécifié'}
                </td>

                <td style={{ padding: '1rem', fontWeight: 800, color: z.price === 0 ? 'var(--success)' : 'var(--dark)' }}>
                  {z.price === 0 ? 'Gratuit' : formatPrice(z.price)}
                </td>

                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(z)}>
                      Modifier
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => handleDelete(z.id)}
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
            Chargement des zones...
          </div>
        ) : zones.length === 0 ? (
          <div style={{ background: '#fff', padding: '2.5rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucune zone de livraison configurée.
          </div>
        ) : (
          zones.map((z) => (
            <div
              key={z.id}
              className="admin-card-item"
            >
              {/* Entête zone : Nom et Prix */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dark)' }}>
                    📍 {z.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    ⏱️ Délai : <strong>{z.estimated_days || 'Non spécifié'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: z.price === 0 ? 'var(--success)' : 'var(--primary)'
                  }}>
                    {z.price === 0 ? 'Gratuit' : formatPrice(z.price)}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, minHeight: '40px', fontWeight: 600 }}
                  onClick={() => handleOpenEdit(z)}
                >
                  ✏️ Modifier
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '40px', minWidth: '44px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => handleDelete(z.id)}
                  title="Supprimer cette zone"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingZone ? 'Modifier la Zone' : 'Nouvelle Zone de Livraison'}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        confirmText={submitting ? 'Enregistrement...' : 'Enregistrer'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nom de la Zone / Quartiers *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Dakar Plateau, Fann, Point E"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Frais de livraison (en FCFA) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="Ex: 2000 (0 pour gratuit)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Délai estimé</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Livraison en 24h ouvrées"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
