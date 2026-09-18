import express from 'express';
import { db } from '../db/connection.js';

const router = express.Router();

// Récupérer tous les paramètres publics de la boutique
router.get('/', async (req, res, next) => {
  try {
    const rows = await db.queryAll('SELECT key, value FROM settings');
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    res.json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
});

// Mettre à jour les paramètres de la boutique
router.put('/', async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await db.execute(`
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `, [key, String(value)]);
      }
    }
    res.json({ success: true, message: 'Paramètres mis à jour avec succès' });
  } catch (err) {
    next(err);
  }
});

export default router;
