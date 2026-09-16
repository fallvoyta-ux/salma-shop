import express from 'express';
import { db } from '../db/connection.js';

const router = express.Router();

// Récupérer toutes les catégories actives avec le nombre de produits
router.get('/', (req, res, next) => {
  try {
    const categories = db.queryAll(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `);

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    next(err);
  }
});

// Récupérer une catégorie par son slug
router.get('/:slug', (req, res, next) => {
  try {
    const category = db.queryOne(`
      SELECT * FROM categories WHERE slug = ? AND is_active = 1
    `, [req.params.slug]);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable.'
      });
    }

    const products = db.queryAll(`
      SELECT p.*, 
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image
      FROM products p
      WHERE p.category_id = ? AND p.is_active = 1
      ORDER BY p.id DESC
    `, [category.id]);

    res.json({
      success: true,
      category,
      products
    });
  } catch (err) {
    next(err);
  }
});

export default router;
