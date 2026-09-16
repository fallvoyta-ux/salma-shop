import express from 'express';
import { db } from '../db/connection.js';

const router = express.Router();

// Récupérer tous les paramètres publics de la boutique
router.get('/', (req, res, next) => {
  try {
    const rows = db.queryAll('SELECT key, value FROM settings');
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

export default router;
