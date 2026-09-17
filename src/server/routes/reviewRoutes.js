import express from 'express';
import { db } from '../db/connection.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Récupérer les avis approuvés d'un produit
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await db.queryAll(`
      SELECT r.id, r.user_name, r.rating, r.comment, r.created_at
      FROM reviews r
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [req.params.productId]);

    res.json({
      success: true,
      reviews
    });
  } catch (err) {
    next(err);
  }
});

// Ajouter un avis client (avec modération par défaut ou approbation immédiate)
router.post('/product/:productId', optionalAuthenticate, async (req, res, next) => {
  try {
    const { user_name, rating, comment } = req.body;
    const productId = req.params.productId;

    if (!user_name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner votre nom, attribuer une note (1 à 5 étoiles) et rédiger un commentaire.'
      });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être comprise entre 1 et 5 étoiles.'
      });
    }

    const product = await db.queryOne('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable.'
      });
    }

    const userId = req.user ? req.user.id : null;
    const authorName = req.user ? `${req.user.first_name} ${req.user.last_name}` : user_name.trim();

    // Pour une boutique en production, on peut approuver directement ou mettre en pending.
    // Mettons 'approved' pour une expérience immédiate satisfaisante, avec modération possible dans /admin
    const result = await db.execute(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment, status)
      VALUES (?, ?, ?, ?, ?, 'approved')
    `, [productId, userId, authorName, parsedRating, comment.trim()]);

    res.status(201).json({
      success: true,
      message: 'Merci beaucoup pour votre avis ! Il a bien été publié.',
      reviewId: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
});

export default router;
