import express from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Liste blanche des clés de configuration autorisées
const ALLOWED_SETTING_KEYS = new Set([
  'store_name',
  'store_subtitle',
  'store_slogan',
  'store_phone',
  'store_phone_alt1',
  'store_phone_alt2',
  'store_whatsapp',
  'store_email',
  'store_address',
  'currency',
  'announcement_bar',
  'announcement_active',
  'whatsapp_ordering_enabled',
  'free_shipping_threshold',
  'store_logo'
]);

const DEFAULT_SETTINGS = {
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
};

// Récupérer tous les paramètres publics de la boutique
router.get('/', async (req, res, next) => {
  try {
    const rows = await db.queryAll('SELECT key, value FROM settings');
    const settings = { ...DEFAULT_SETTINGS };
    for (const r of rows) {
      if (ALLOWED_SETTING_KEYS.has(r.key)) {
        settings[r.key] = r.value;
      }
    }

    res.json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
});

// Mettre à jour les paramètres de la boutique (Réservé exclusivement aux Administrateurs)
router.put('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Format de paramètres invalide.'
      });
    }

    for (const [key, value] of Object.entries(settings)) {
      if (!ALLOWED_SETTING_KEYS.has(key)) {
        continue; // Ignore toute clé non autorisée
      }
      await db.execute(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `, [key, String(value)]);
    }

    res.json({ success: true, message: 'Paramètres mis à jour avec succès.' });
  } catch (err) {
    next(err);
  }
});

export default router;
