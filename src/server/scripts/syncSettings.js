import { db } from '../db/connection.js';

const officialSettings = [
  { key: 'store_name', value: 'Global Business Services Grp SF' },
  { key: 'store_subtitle', value: 'Groupe Salma Fall - Vente Articles Divers' },
  { key: 'store_slogan', value: '« La Qualité fait la Différence 💜🕊️🌹 »' },
  { key: 'store_description', value: 'Global Business Services Grp SF (Groupe Salma Fall) : Vente d’articles divers à Dakar, Sénégal. « La Qualité fait la Différence 💜🕊️🌹 ».' },
  { key: 'announcement_bar', value: '✨ Global Business Services Grp SF • Groupe Salma Fall • « La Qualité fait la Différence 💜🕊️🌹 » • WhatsApp : +221 77 201 86 97 • 76 251 11 12' },
  { key: 'announcement_active', value: 'true' },
  { key: 'whatsapp_ordering_enabled', value: 'true' },
  { key: 'free_shipping_threshold', value: '40000' },
  { key: 'store_phone', value: '+221 77 201 86 97' },
  { key: 'store_phone_alt1', value: '+221 76 251 11 12' },
  { key: 'store_whatsapp', value: '221772018697' },
  { key: 'store_email', value: 'contact@salmashop.sn' },
  { key: 'store_address', value: 'Dakar, Sénégal' },
  { key: 'currency', value: 'FCFA' },
  { key: 'store_logo', value: '/logo.jpg' }
];

async function sync() {
  for (const s of officialSettings) {
    await db.execute(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `, [s.key, s.value]);
  }
  console.log('✅ Paramètres officiels synchronisés en base locale.');
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
