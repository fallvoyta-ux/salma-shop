import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function WhatsAppButton() {
  const { getWhatsAppUrl, settings } = useSettings();

  return (
    <a
      href={getWhatsAppUrl(`Bonjour ${settings.store_name} ! Je visite votre boutique en ligne et j'aimerais avoir des renseignements.`)}
      target="_blank"
      rel="noreferrer"
      className="floating-whatsapp"
      title="Discuter directement sur WhatsApp"
    >
      <span style={{ fontSize: '1.3rem' }}>💬</span>
      <span>Besoin d'aide ? WhatsApp</span>
    </a>
  );
}
