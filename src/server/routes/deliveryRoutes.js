import express from 'express';
import { db } from '../db/connection.js';

const router = express.Router();

// Récupérer la liste des zones et tarifs de livraison actifs
router.get('/', (req, res, next) => {
  try {
    const zones = db.queryAll(`
      SELECT * FROM delivery_zones
      WHERE is_active = 1
      ORDER BY price ASC, id ASC
    `);

    res.json({
      success: true,
      zones
    });
  } catch (err) {
    next(err);
  }
});

export default router;
