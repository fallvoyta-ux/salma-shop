import express from 'express';
import { db } from '../db/connection.js';

const router = express.Router();

// Récupérer les produits en vedette (Homepage)
router.get('/featured', async (req, res, next) => {
  try {
    const products = await db.queryAll(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND p.is_featured = 1
      ORDER BY p.id DESC
      LIMIT 8
    `);

    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

// Récupérer les nouveautés
router.get('/new-arrivals', async (req, res, next) => {
  try {
    const products = await db.queryAll(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

// Récupérer les promotions
router.get('/promotions', async (req, res, next) => {
  try {
    const products = await db.queryAll(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND (p.is_promo = 1 OR p.compare_price > p.price)
      ORDER BY p.id DESC
      LIMIT 8
    `);

    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

// Catalogue complet avec filtres, recherche, tri et pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      category,
      min_price,
      max_price,
      in_stock,
      promo,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const offset = (parsedPage - 1) * parsedLimit;

    let whereConditions = ['p.is_active = 1'];
    let params = [];

    // Recherche par mot-clé (nom, description, référence SKU)
    if (search && search.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR c.name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    // Filtre catégorie (par slug ou id)
    if (category && category !== 'all') {
      if (!isNaN(category)) {
        whereConditions.push('p.category_id = ?');
        params.push(parseInt(category, 10));
      } else {
        whereConditions.push('c.slug = ?');
        params.push(category.trim());
      }
    }

    // Filtre prix minimum
    if (min_price && !isNaN(min_price)) {
      whereConditions.push('p.price >= ?');
      params.push(parseInt(min_price, 10));
    }

    // Filtre prix maximum
    if (max_price && !isNaN(max_price)) {
      whereConditions.push('p.price <= ?');
      params.push(parseInt(max_price, 10));
    }

    // Filtre disponibilité en stock
    if (in_stock === 'true' || in_stock === '1') {
      whereConditions.push('p.stock > 0');
    }

    // Filtre promotions
    if (promo === 'true' || promo === '1') {
      whereConditions.push('(p.is_promo = 1 OR p.compare_price > p.price)');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Tri
    let orderBy = 'p.id DESC';
    if (sort === 'price_asc') {
      orderBy = 'p.price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'p.price DESC';
    } else if (sort === 'popularity') {
      orderBy = 'p.stock ASC, p.id DESC';
    } else if (sort === 'newest') {
      orderBy = 'p.created_at DESC';
    }

    // Compter le nombre total d'articles pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
    `;
    const countRow = await db.queryOne(countQuery, params);
    const total = countRow ? countRow.total : 0;
    const totalPages = Math.ceil(total / parsedLimit);

    // Récupérer les produits
    const selectQuery = `
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE(
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const products = await db.queryAll(selectQuery, [...params, parsedLimit, offset]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
});

// Détail d'un produit par son slug
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await db.queryOne(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE (p.slug = ? OR p.id = ?) AND p.is_active = 1
    `, [req.params.slug, req.params.slug]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ce produit est actuellement indisponible ou a été retiré.'
      });
    }

    // Récupérer toutes les photos de la galerie
    const images = await db.queryAll(`
      SELECT id, image_url, is_primary, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC, id ASC
    `, [product.id]);

    // Récupérer les avis approuvés et la note moyenne
    const reviews = await db.queryAll(`
      SELECT id, user_name, rating, comment, created_at
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
      ORDER BY created_at DESC
    `, [product.id]);

    const reviewStats = await db.queryOne(`
      SELECT COUNT(*) as review_count, AVG(rating) as average_rating
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
    `, [product.id]);

    // Parser les spécifications techniques
    let parsedSpecs = {};
    if (product.specifications) {
      try {
        parsedSpecs = JSON.parse(product.specifications);
      } catch (e) {
        parsedSpecs = {};
      }
    }

    res.json({
      success: true,
      product: {
        ...product,
        images,
        reviews,
        review_count: reviewStats ? reviewStats.review_count : 0,
        average_rating: reviewStats && reviewStats.average_rating ? Number(reviewStats.average_rating.toFixed(1)) : 5.0,
        parsed_specifications: parsedSpecs
      }
    });
  } catch (err) {
    next(err);
  }
});

// Produits similaires (même catégorie)
router.get('/:slug/related', async (req, res, next) => {
  try {
    const product = await db.queryOne(`
      SELECT id, category_id FROM products WHERE slug = ? OR id = ?
    `, [req.params.slug, req.params.slug]);

    if (!product) {
      return res.json({ success: true, products: [] });
    }

    const related = await db.queryAll(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE(
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY p.id DESC
      LIMIT 4
    `, [product.category_id, product.id]);

    res.json({ success: true, products: related });
  } catch (err) {
    next(err);
  }
});

export default router;
