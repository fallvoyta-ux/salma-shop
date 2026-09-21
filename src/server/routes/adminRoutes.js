import express from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { upload, fileUrl, persistUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// Tous les endpoints /api/admin sont protégés par authentification et rôle admin
router.use(authenticate, requireAdmin);

// ==========================================
// 1. STATISTIQUES & TABLEAU DE BORD
// ==========================================
router.get('/stats', async (req, res, next) => {
  try {
    // Chiffre d'affaires
    const totalRevRow = await db.queryOne("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'");
    const todayRevRow = await db.queryOne("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND DATE(created_at) = DATE('now')");
    const weekRevRow = await db.queryOne("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND created_at >= DATE('now', '-7 days')");
    const monthRevRow = await db.queryOne("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND created_at >= DATE('now', 'start of month')");

    // Commandes
    const totalOrdersRow = await db.queryOne('SELECT COUNT(*) as total FROM orders');
    const pendingOrdersRow = await db.queryOne("SELECT COUNT(*) as total FROM orders WHERE order_status = 'pending'");
    const deliveredOrdersRow = await db.queryOne("SELECT COUNT(*) as total FROM orders WHERE order_status = 'delivered'");

    // Clients & Produits
    const totalCustomersRow = await db.queryOne("SELECT COUNT(*) as total FROM users WHERE role = 'client'");
    const totalProductsRow = await db.queryOne('SELECT COUNT(*) as total FROM products');

    // Panier moyen
    const avgOrderRow = await db.queryOne("SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE payment_status = 'paid'");

    // Produits en alerte de stock faible
    const lowStockProducts = await db.queryAll(`
      SELECT id, name, sku, stock, low_stock_threshold, price
      FROM products
      WHERE stock <= low_stock_threshold
      ORDER BY stock ASC
      LIMIT 10
    `);

    // Ventes des 7 derniers jours (uniquement les commandes payées et validées)
    const salesChart = await db.queryAll(`
      SELECT DATE(created_at) as date,
             COUNT(*) as order_count,
             COALESCE(SUM(total_amount), 0) as total_sales
      FROM orders
      WHERE created_at >= DATE('now', '-7 days') AND payment_status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Dernières commandes
    const recentOrders = await db.queryAll(`
      SELECT o.id, o.order_number, o.customer_name, o.customer_phone, o.total_amount,
             o.order_status, o.payment_status, o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    // Meilleurs produits vendus
    const topProducts = await db.queryAll(`
      SELECT oi.product_id, oi.product_name, 
             SUM(oi.quantity) as total_sold,
             SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.order_status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        total_revenue: totalRevRow ? totalRevRow.total : 0,
        today_revenue: todayRevRow ? todayRevRow.total : 0,
        week_revenue: weekRevRow ? weekRevRow.total : 0,
        month_revenue: monthRevRow ? monthRevRow.total : 0,
        total_orders: totalOrdersRow ? totalOrdersRow.total : 0,
        pending_orders: pendingOrdersRow ? pendingOrdersRow.total : 0,
        delivered_orders: deliveredOrdersRow ? deliveredOrdersRow.total : 0,
        total_customers: totalCustomersRow ? totalCustomersRow.total : 0,
        total_products: totalProductsRow ? totalProductsRow.total : 0,
        average_order_value: avgOrderRow ? Math.round(avgOrderRow.avg) : 0,
        low_stock_count: lowStockProducts.length,
        low_stock_products: lowStockProducts,
        sales_chart: salesChart,
        recent_orders: recentOrders,
        top_products: topProducts
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. GESTION DES PRODUITS
// ==========================================
router.get('/products', async (req, res, next) => {
  try {
    const products = await db.queryAll(`
      SELECT p.*, c.name as category_name,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
             ) as primary_image,
             (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as images_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `);

    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

// Créer un produit avec images uploadées ou URLs
router.post('/products', upload.array('images', 6), async (req, res, next) => {
  try {
    const {
      name,
      category_id,
      description,
      short_description,
      price,
      compare_price,
      stock,
      low_stock_threshold,
      sku,
      is_featured,
      is_promo,
      specifications,
      image_urls // URLs d'images optionnelles si pas d'upload direct
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du produit et le prix sont obligatoires.'
      });
    }

    // Génération du slug
    let baseSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await db.queryOne('SELECT id FROM products WHERE slug = ?', [slug])) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Génération du SKU si non fourni
    const finalSku = sku ? sku.trim().toUpperCase() : `SLM-${Date.now().toString().slice(-6)}`;

    const result = await db.execute(`
      INSERT INTO products (
        category_id, name, slug, description, short_description,
        price, compare_price, stock, low_stock_threshold, sku,
        is_active, is_featured, is_promo, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `, [
      category_id ? parseInt(category_id, 10) : null,
      name.trim(),
      slug,
      description ? description.trim() : '',
      short_description ? short_description.trim() : '',
      parseInt(price, 10),
      compare_price ? parseInt(compare_price, 10) : null,
      stock ? parseInt(stock, 10) : 0,
      low_stock_threshold ? parseInt(low_stock_threshold, 10) : 5,
      finalSku,
      is_featured === 'true' || is_featured === 1 ? 1 : 0,
      is_promo === 'true' || is_promo === 1 ? 1 : 0,
      typeof specifications === 'object' ? JSON.stringify(specifications) : (specifications || null)
    ]);

    const productId = result.lastInsertRowid;

    // Traitement des images uploadées
    let imageIndex = 0;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = fileUrl(file);
        await db.execute(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES (?, ?, ?, ?)
        `, [productId, imageUrl, imageIndex === 0 ? 1 : 0, imageIndex]);
        imageIndex++;
      }
      await persistUploadedFiles(req.files);
    }

    // Traitement des URLs d'images si fournies
    if (image_urls) {
      const urls = Array.isArray(image_urls) ? image_urls : [image_urls];
      for (const url of urls) {
        if (url && typeof url === 'string' && url.trim()) {
          await db.execute(`
            INSERT INTO product_images (product_id, image_url, is_primary, display_order)
            VALUES (?, ?, ?, ?)
          `, [productId, url.trim(), imageIndex === 0 ? 1 : 0, imageIndex]);
          imageIndex++;
        }
      }
    }

    const createdProduct = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès.',
      product: createdProduct
    });
  } catch (err) {
    next(err);
  }
});

// Modifier un produit
router.put('/products/:id', async (req, res, next) => {
  try {
    const {
      name,
      category_id,
      description,
      short_description,
      price,
      compare_price,
      stock,
      low_stock_threshold,
      sku,
      is_active,
      is_featured,
      is_promo,
      specifications
    } = req.body;

    const productId = req.params.id;
    const existing = await db.queryOne('SELECT id FROM products WHERE id = ?', [productId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produit introuvable.' });
    }

    await db.execute(`
      UPDATE products
      SET name = COALESCE(?, name),
          category_id = ?,
          description = COALESCE(?, description),
          short_description = COALESCE(?, short_description),
          price = COALESCE(?, price),
          compare_price = ?,
          stock = COALESCE(?, stock),
          low_stock_threshold = COALESCE(?, low_stock_threshold),
          sku = COALESCE(?, sku),
          is_active = COALESCE(?, is_active),
          is_featured = COALESCE(?, is_featured),
          is_promo = COALESCE(?, is_promo),
          specifications = COALESCE(?, specifications),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : undefined,
      description,
      short_description,
      price !== undefined ? parseInt(price, 10) : undefined,
      compare_price !== undefined ? (compare_price ? parseInt(compare_price, 10) : null) : null,
      stock !== undefined ? parseInt(stock, 10) : undefined,
      low_stock_threshold !== undefined ? parseInt(low_stock_threshold, 10) : undefined,
      sku,
      is_active !== undefined ? (is_active ? 1 : 0) : undefined,
      is_featured !== undefined ? (is_featured ? 1 : 0) : undefined,
      is_promo !== undefined ? (is_promo ? 1 : 0) : undefined,
      typeof specifications === 'object' ? JSON.stringify(specifications) : specifications,
      productId
    ]);

    const updated = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
    res.json({ success: true, message: 'Produit mis à jour.', product: updated });
  } catch (err) {
    next(err);
  }
});

// Supprimer un produit
router.delete('/products/:id', async (req, res, next) => {
  try {
    const productId = req.params.id;
    await db.execute('DELETE FROM products WHERE id = ?', [productId]);
    res.json({ success: true, message: 'Produit supprimé avec succès.' });
  } catch (err) {
    next(err);
  }
});

// Activer / Désactiver rapidement un produit
router.patch('/products/:id/toggle-status', async (req, res, next) => {
  try {
    const product = await db.queryOne('SELECT id, is_active FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable.' });
    }

    const newStatus = product.is_active === 1 ? 0 : 1;
    await db.execute('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, req.params.id]);

    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    next(err);
  }
});

// Ajuster le stock d'un produit
router.patch('/products/:id/stock', async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || isNaN(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: 'Quantité de stock invalide.' });
    }

    await db.execute('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [parseInt(stock, 10), req.params.id]);
    res.json({ success: true, message: 'Stock mis à jour.' });
  } catch (err) {
    next(err);
  }
});

// Téléverser des images pour un produit
router.post('/products/:id/images', upload.array('images', 6), async (req, res, next) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    const existingCount = await db.queryOne('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?', [productId]);
    let orderIndex = existingCount ? existingCount.count : 0;

    for (const file of files) {
      const url = fileUrl(file);
      await db.execute(`
        INSERT INTO product_images (product_id, image_url, is_primary, display_order)
        VALUES (?, ?, ?, ?)
      `, [productId, url, orderIndex === 0 ? 1 : 0, orderIndex]);
      orderIndex++;
    }
    await persistUploadedFiles(files);

    const images = await db.queryAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC', [productId]);
    res.json({ success: true, message: 'Images ajoutées.', images });
  } catch (err) {
    next(err);
  }
});

// Définir une image comme principale
router.patch('/products/images/:imageId/set-primary', async (req, res, next) => {
  try {
    const img = await db.queryOne('SELECT id, product_id FROM product_images WHERE id = ?', [req.params.imageId]);
    if (!img) {
      return res.status(404).json({ success: false, message: 'Image introuvable.' });
    }

    await db.transaction(async (tx) => {
      await tx.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [img.product_id]);
      await tx.execute('UPDATE product_images SET is_primary = 1 WHERE id = ?', [img.id]);
    });

    res.json({ success: true, message: 'Photo principale mise à jour.' });
  } catch (err) {
    next(err);
  }
});

// Supprimer une image de produit
router.delete('/products/images/:imageId', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM product_images WHERE id = ?', [req.params.imageId]);
    res.json({ success: true, message: 'Image supprimée.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. GESTION DES COMMANDES
// ==========================================
router.get('/orders', async (req, res, next) => {
  try {
    const { status, payment_status, search } = req.query;

    let conditions = [];
    let params = [];

    if (status && status !== 'all') {
      conditions.push('o.order_status = ?');
      params.push(status);
    }

    if (payment_status && payment_status !== 'all') {
      conditions.push('o.payment_status = ?');
      params.push(payment_status);
    }

    if (search && search.trim()) {
      conditions.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orders = await db.queryAll(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
             z.name as zone_name
      FROM orders o
      LEFT JOIN delivery_zones z ON z.id = o.delivery_zone_id
      ${whereClause}
      ORDER BY o.created_at DESC
    `, params);

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await db.queryOne(`
      SELECT o.*, z.name as zone_name, z.estimated_days
      FROM orders o
      LEFT JOIN delivery_zones z ON z.id = o.delivery_zone_id
      WHERE o.id = ?
    `, [req.params.id]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande introuvable.' });
    }

    const items = await db.queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const payments = await db.queryAll('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC', [order.id]);

    res.json({ success: true, order, items, payments });
  } catch (err) {
    next(err);
  }
});

// Mettre à jour le statut d'une commande
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut de commande non valide.' });
    }

    const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande introuvable.' });
    }

    let stockWarning = null;
    let newPaymentStatus = order.payment_status;

    await db.transaction(async (tx) => {
      const wasCancelled = order.order_status === 'cancelled';
      const willBeCancelled = status === 'cancelled';

      // Annulation : la commande n'était pas annulée avant, elle l'est maintenant → réapprovisionner le stock.
      if (willBeCancelled && !wasCancelled) {
        const items = await tx.queryAll('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const it of items) {
          if (it.product_id) {
            await tx.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
          }
        }

        // Si la commande était déjà payée, basculer vers 'refund_pending' pour exiger le remboursement
        if (order.payment_status === 'paid') {
          newPaymentStatus = 'refund_pending';
          await tx.execute("UPDATE orders SET payment_status = 'refund_pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [orderId]);
          await tx.execute("UPDATE payments SET status = 'refund_pending' WHERE order_id = ? AND status IN ('paid', 'successful')", [orderId]);
          stockWarning = "⚠️ Attention : Cette commande avait déjà été payée. Le statut de paiement a été passé à 'refund_pending' (remboursement client à effectuer).";
        }
      }

      // Réactivation : la commande était annulée (stock réapprovisionné) et repart vers un autre statut
      // → il faut re-décrémenter le stock. Si stock insuffisant, INTERROMPRE la transaction (409 Conflict)
      if (wasCancelled && !willBeCancelled) {
        const items = await tx.queryAll('SELECT product_id, product_name, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const it of items) {
          if (!it.product_id) continue;
          const res = await tx.execute(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [it.quantity, it.product_id, it.quantity]
          );
          if (res.changes === 0) {
            const err = new Error(
              `Stock insuffisant pour réactiver la commande : l'article "${it.product_name}" n'a plus assez de pièces disponibles.`
            );
            err.status = 409;
            throw err;
          }
        }
      }

      await tx.execute('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, orderId]);
    });

    res.json({
      success: true,
      message: `Statut de la commande mis à jour: ${status}`,
      warning: stockWarning,
      payment_status: newPaymentStatus
    });
  } catch (err) {
    next(err);
  }
});

// Mettre à jour le statut de paiement d'une commande
router.patch('/orders/:id/payment-status', async (req, res, next) => {
  try {
    const { payment_status } = req.body;
    const orderId = req.params.id;

    const validStatuses = ['pending', 'paid', 'failed', 'refund_pending', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Statut de paiement non valide.' });
    }

    await db.execute('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [payment_status, orderId]);
    res.json({ success: true, message: `Statut de paiement mis à jour: ${payment_status}` });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. GESTION DES CATÉGORIES
// ==========================================
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await db.queryAll(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.id ASC
    `);

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, display_order, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le nom de la catégorie est obligatoire.' });
    }

    let baseSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await db.queryOne('SELECT id FROM categories WHERE slug = ?', [slug])) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const finalImage = req.file ? fileUrl(req.file) : (image_url || null);
    if (req.file) {
      await persistUploadedFiles(req.file);
    }

    const result = await db.execute(`
      INSERT INTO categories (name, slug, description, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [name.trim(), slug, description ? description.trim() : null, finalImage, display_order ? parseInt(display_order, 10) : 0]);

    const created = await db.queryOne('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, message: 'Catégorie créée.', category: created });
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, display_order, is_active, image_url } = req.body;
    const catId = req.params.id;

    const finalImage = req.file ? fileUrl(req.file) : (image_url !== undefined ? image_url : undefined);
    if (req.file) {
      await persistUploadedFiles(req.file);
    }

    await db.execute(`
      UPDATE categories
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          image_url = COALESCE(?, image_url)
      WHERE id = ?
    `, [
      name,
      description,
      display_order !== undefined ? parseInt(display_order, 10) : undefined,
      is_active !== undefined ? (is_active ? 1 : 0) : undefined,
      finalImage,
      catId
    ]);

    const updated = await db.queryOne('SELECT * FROM categories WHERE id = ?', [catId]);
    res.json({ success: true, message: 'Catégorie mise à jour.', category: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Catégorie supprimée.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. GESTION DES CLIENTS
// ==========================================
router.get('/customers', async (req, res, next) => {
  try {
    const customers = await db.queryAll(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.city, u.region, u.created_at,
             COUNT(o.id) as orders_count,
             COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, customers });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. GESTION DES AVIS CLIENTS
// ==========================================
router.get('/reviews', async (req, res, next) => {
  try {
    const reviews = await db.queryAll(`
      SELECT r.*, p.name as product_name, p.slug as product_slug
      FROM reviews r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
    `);

    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut d’avis invalide.' });
    }

    await db.execute('UPDATE reviews SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Avis ${status}.` });
  } catch (err) {
    next(err);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Avis supprimé.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7. ZONES DE LIVRAISON
// ==========================================
router.get('/delivery-zones', async (req, res, next) => {
  try {
    const zones = await db.queryAll('SELECT * FROM delivery_zones ORDER BY price ASC');
    res.json({ success: true, zones });
  } catch (err) {
    next(err);
  }
});

router.post('/delivery-zones', async (req, res, next) => {
  try {
    const { name, price, estimated_days } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Nom et tarif requis.' });
    }

    const result = await db.execute(`
      INSERT INTO delivery_zones (name, price, estimated_days, is_active)
      VALUES (?, ?, ?, 1)
    `, [name.trim(), parseInt(price, 10), estimated_days ? estimated_days.trim() : null]);

    const created = await db.queryOne('SELECT * FROM delivery_zones WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, message: 'Zone de livraison ajoutée.', zone: created });
  } catch (err) {
    next(err);
  }
});

router.put('/delivery-zones/:id', async (req, res, next) => {
  try {
    const { name, price, estimated_days, is_active } = req.body;

    await db.execute(`
      UPDATE delivery_zones
      SET name = COALESCE(?, name),
          price = COALESCE(?, price),
          estimated_days = COALESCE(?, estimated_days),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [
      name,
      price !== undefined ? parseInt(price, 10) : undefined,
      estimated_days,
      is_active !== undefined ? (is_active ? 1 : 0) : undefined,
      req.params.id
    ]);

    const updated = await db.queryOne('SELECT * FROM delivery_zones WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Zone mise à jour.', zone: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/delivery-zones/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM delivery_zones WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Zone de livraison supprimée.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 8. LOGS DE PAIEMENTS
// ==========================================
router.get('/payments', async (req, res, next) => {
  try {
    const payments = await db.queryAll(`
      SELECT p.*, o.order_number, o.customer_name
      FROM payments p
      LEFT JOIN orders o ON o.id = p.order_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    res.json({ success: true, payments });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 9. PARAMÈTRES DE LA BOUTIQUE
// ==========================================
router.get('/settings', async (req, res, next) => {
  try {
    const rows = await db.queryAll('SELECT * FROM settings');
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ success: true, settings, raw: rows });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const updates = req.body; // Objet clé -> valeur

    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(updates)) {
        await tx.execute(`
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `, [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]);
      }
    });

    res.json({ success: true, message: 'Paramètres mis à jour avec succès.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 10. MESSAGES DU FORMULAIRE DE CONTACT
// ==========================================
router.get('/contacts', async (req, res, next) => {
  try {
    const contacts = await db.queryAll(`
      SELECT id, name, email, phone, message, is_read, created_at
      FROM contacts
      ORDER BY created_at DESC
    `);
    const unreadRow = await db.queryOne('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0');
    const unreadCount = unreadRow ? Number(unreadRow.count) : 0;

    res.json({ success: true, contacts, unreadCount });
  } catch (err) {
    next(err);
  }
});

router.patch('/contacts/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.execute('UPDATE contacts SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Message marqué comme lu.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/contacts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Message supprimé.' });
  } catch (err) {
    next(err);
  }
});

export default router;
