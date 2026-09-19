import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    store_name: 'Global Business Services Grp SF',
    store_subtitle: 'Groupe Salma Fall - Vente Articles Divers',
    store_slogan: '« La Qualité fait la Différence 💜🕊️🌹 »',
    store_description: 'Global Business Services Grp SF (Groupe Salma Fall) : Vente d’articles divers à Dakar, Sénégal. « La Qualité fait la Différence 💜🕊️🌹 ».',
    store_phone: '+221 77 201 86 97',
    store_phone_alt1: '+221 76 251 11 12',
    store_phone_alt2: '+221 77 201 86 97',
    store_whatsapp: '221772018697',
    store_email: 'contact@salmashop.sn',
    store_address: 'Dakar, Sénégal',
    currency: 'FCFA',
    announcement_bar: '✨ Global Business Services Grp SF • Groupe Salma Fall • « La Qualité fait la Différence 💜🕊️🌹 » • WhatsApp : +221 77 201 86 97 • 76 251 11 12',
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
    const text = customText || `Bonjour Global Business Services Grp SF (Groupe Salma Fall) ! 👋 Je souhaite commander ou avoir des renseignements sur vos articles. 💜`;
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
