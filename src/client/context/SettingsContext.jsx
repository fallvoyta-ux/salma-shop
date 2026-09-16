import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    store_name: 'Salma Shop',
    store_subtitle: 'Chic Ladies',
    store_slogan: 'Se vêtir à tous prix 💜 | S’habiller selon son Budget 🌹',
    store_description: 'Salma Shop - Chic Ladies : Vente d’articles divers à Dakar. Robes glamour, ensembles chic, maroquinerie, accessoires et soins pour se vêtir selon son budget.',
    store_phone: '+221 77 201 86 97',
    store_whatsapp: '221772018697',
    store_email: 'contact@salmashop.sn',
    store_address: 'Dakar, Sénégal',
    currency: 'FCFA',
    announcement_bar: '✨ Bienvenue chez Salma Shop Chic Ladies ! Se vêtir à tous prix 💜 - S’habiller selon son Budget 🌹 | WhatsApp : +221 77 201 86 97',
    announcement_active: 'true',
    whatsapp_ordering_enabled: 'true',
    free_shipping_threshold: '40000',
    store_logo: '/logo.jpg'
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Formatage des montants en FCFA (XOF)
  const formatPrice = (amount) => {
    const num = Math.round(Number(amount) || 0);
    return `${num.toLocaleString('fr-FR')} ${settings.currency || 'FCFA'}`;
  };

  const getWhatsAppUrl = (customText = '') => {
    const phone = (settings.store_whatsapp || '221772018697').replace(/[^0-9]/g, '');
    const text = customText || `Bonjour Salma Shop Chic Ladies ! 👋 Je souhaite commander ou avoir des renseignements sur vos articles.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      refreshSettings,
      formatPrice,
      getWhatsAppUrl
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings doit être utilisé au sein d’un SettingsProvider');
  }
  return context;
}
