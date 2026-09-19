import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function Messages({ onNavigate }) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/admin/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Impossible de charger les messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [token]);

  const markAsRead = async (id) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, is_read: 1 } : c));
    try {
      await fetch(`/api/admin/contacts/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer définitivement ce message ?')) return;
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Message supprimé.', 'success');
        setContacts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const waLink = (c) => {
    const phone = (c.phone || '').replace(/[^0-9]/g, '');
    const text = `Bonjour ${c.name} 👋, je réponds à votre message envoyé sur Salma Shop.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const visible = filter === 'unread' ? contacts.filter(c => !c.is_read) : contacts;
  const unreadCount = contacts.filter(c => !c.is_read).length;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--dark)' }}>Messages de Contact</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Les messages envoyés depuis le formulaire « Nous contacter » du site.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={filter === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setFilter('all')}
          >
            Tous ({contacts.length})
          </button>
          <button
            className={filter === 'unread' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setFilter('unread')}
          >
            Non lus ({unreadCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chargement des messages...</div>
      ) : visible.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem', color: 'var(--text-muted)',
          background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
        }}>
          {filter === 'unread' ? 'Aucun message non lu.' : 'Aucun message reçu pour l’instant.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visible.map((c) => (
            <div
              key={c.id}
              onClick={() => !c.is_read && markAsRead(c.id)}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                border: c.is_read ? '1px solid var(--border)' : '1px solid var(--primary)',
                boxShadow: 'var(--shadow-sm)',
                padding: '1.25rem 1.5rem',
                position: 'relative',
                cursor: c.is_read ? 'default' : 'pointer'
              }}
            >
              {!c.is_read && (
                <span style={{
                  position: 'absolute', top: '1.25rem', right: '1.5rem',
                  width: '9px', height: '9px', borderRadius: '50%', background: 'var(--primary)'
                }} title="Non lu" />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{c.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.75rem' }}>
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  📞 {c.phone} {c.email ? `· ✉️ ${c.email}` : ''}
                </div>
              </div>

              <p style={{ color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                {c.message}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <a
                  href={waLink(c)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ color: '#25D366', borderColor: '#25D366', textDecoration: 'none' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  💬 Répondre sur WhatsApp
                </a>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
