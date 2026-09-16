import express from 'express';
import { db } from '../db/connection.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { paymentService } from '../services/paymentService.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

// Créer une commande
router.post('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      delivery_region,
      delivery_city,
      delivery_address,
      delivery_notes,
      delivery_zone_id,
      payment_method,
      items
    } = req.body;

    if (!customer_name || !customer_phone || !delivery_address || !delivery_city) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner votre nom, téléphone et adresse complète de livraison.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Votre panier est vide.'
      });
    }

    const validPaymentMethods = ['wave', 'orange_money', 'card', 'cash_on_delivery'];
    if (!validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Moyen de paiement non valide.'
      });
    }

    // Récupération de la zone de livraison
    let deliveryFee = 2000; // Par défaut si non spécifié
    let zoneName = 'Livraison standard Dakar';
    if (delivery_zone_id) {
      const zone = db.queryOne('SELECT * FROM delivery_zones WHERE id = ?', [delivery_zone_id]);
      if (zone) {
        deliveryFee = zone.price;
        zoneName = zone.name;
      }
    }

    // Récupération du seuil de gratuité de livraison depuis les paramètres
    const freeShippingSetting = db.queryOne("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");
    const freeShippingThreshold = freeShippingSetting ? parseInt(freeShippingSetting.value, 10) : 50000;

    let createdOrder = null;
    let orderItemsData = [];

    // Transaction DB : vérification des stocks et insertion
    db.transaction(() => {
      let calculatedSubtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prodId = item.productId || item.product_id || item.id;
        const qty = parseInt(item.quantity, 10) || 1;

        if (qty <= 0) continue;

        const product = db.queryOne('SELECT * FROM products WHERE id = ?', [prodId]);
        if (!product) {
          throw new Error(`Le produit sélectionné (ID #${prodId}) n'est plus disponible.`);
        }

        if (product.is_active !== 1) {
          throw new Error(`Le produit "${product.name}" n'est plus commercialisé.`);
        }

        if (product.stock < qty) {
          throw new Error(`Stock insuffisant pour "${product.name}". Il ne reste que ${product.stock} pièce(s) disponible(s).`);
        }

        const itemSubtotal = product.price * qty;
        calculatedSubtotal += itemSubtotal;

        // Récupérer l'image principale
        const primaryImg = db.queryOne(`
          SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1
        `, [product.id]);

        verifiedItems.push({
          product_id: product.id,
          name: product.name,
          image: primaryImg ? primaryImg.image_url : null,
          price: product.price,
          quantity: qty,
          subtotal: itemSubtotal
        });
      }

      if (verifiedItems.length === 0) {
        throw new Error('Aucun article valide trouvé dans votre panier.');
      }

      // Application de la livraison gratuite si seuil atteint
      let finalDeliveryFee = deliveryFee;
      if (calculatedSubtotal >= freeShippingThreshold && deliveryFee > 0) {
        finalDeliveryFee = 0;
      }

      const totalAmount = calculatedSubtotal + finalDeliveryFee;

      // Génération du numéro unique de commande
      const countRes = db.queryOne('SELECT COUNT(*) as total FROM orders');
      const nextSeq = (countRes ? countRes.total : 0) + 1;
      const orderNumber = `CMD-2026-${String(nextSeq).padStart(6, '0')}`;

      const userId = req.user ? req.user.id : null;

      // Insertion de la commande
      const orderRes = db.execute(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          delivery_region, delivery_city, delivery_address, delivery_notes,
          delivery_zone_id, delivery_fee, subtotal, discount_amount, total_amount,
          order_status, payment_method, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending')
      `, [
        orderNumber,
        userId,
        customer_name.trim(),
        (customer_email || '').trim().toLowerCase() || 'client@terangashop.sn',
        customer_phone.trim(),
        delivery_region || 'Dakar',
        delivery_city.trim(),
        delivery_address.trim(),
        delivery_notes ? delivery_notes.trim() : '',
        delivery_zone_id || null,
        finalDeliveryFee,
        calculatedSubtotal,
        0,
        totalAmount,
        payment_method
      ]);

      const orderId = orderRes.lastInsertRowid;

      // Insertion des articles et décrémentation des stocks
      const insertItemStmt = db.getRawDb().prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const decrementStockStmt = db.getRawDb().prepare(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `);

      for (const it of verifiedItems) {
        insertItemStmt.run(orderId, it.product_id, it.name, it.image, it.price, it.quantity, it.subtotal);
        decrementStockStmt.run(it.quantity, it.product_id);
      }

      createdOrder = db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
      orderItemsData = verifiedItems;
    });

    // Initialiser le paiement via le service de paiement
    const paymentInfo = await paymentService.initializePayment(createdOrder, payment_method);

    // Générer le message et lien WhatsApp
    const whatsappUrl = notificationService.getOrderWhatsAppUrl(createdOrder, orderItemsData);

    res.status(201).json({
      success: true,
      message: 'Votre commande a été enregistrée avec succès !',
      order: createdOrder,
      items: orderItemsData,
      payment: paymentInfo,
      whatsappUrl
    });
  } catch (err) {
    next(err);
  }
});

// Suivi public d'une commande par son numéro
router.get('/track/:orderNumber', (req, res, next) => {
  try {
    const order = db.queryOne(`
      SELECT o.id, o.order_number, o.customer_name, o.delivery_city, o.delivery_address,
             o.total_amount, o.delivery_fee, o.order_status, o.payment_method, o.payment_status,
             o.created_at, z.name as zone_name
      FROM orders o
      LEFT JOIN delivery_zones z ON z.id = o.delivery_zone_id
      WHERE o.order_number = ?
    `, [req.params.orderNumber.toUpperCase()]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Aucune commande trouvée pour la référence ${req.params.orderNumber}.`
      });
    }

    const items = db.queryAll(`
      SELECT id, product_name, product_image, unit_price, quantity, subtotal
      FROM order_items
      WHERE order_id = ?
    `, [order.id]);

    res.json({
      success: true,
      order,
      items
    });
  } catch (err) {
    next(err);
  }
});

// Historique des commandes du client connecté
router.get('/my-orders', authenticate, (req, res, next) => {
  try {
    const orders = db.queryAll(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      orders
    });
  } catch (err) {
    next(err);
  }
});

// Détail d'une commande par ID
router.get('/:id', optionalAuthenticate, (req, res, next) => {
  try {
    const order = db.queryOne(`
      SELECT o.*, z.name as zone_name
      FROM orders o
      LEFT JOIN delivery_zones z ON z.id = o.delivery_zone_id
      WHERE o.id = ? OR o.order_number = ?
    `, [req.params.id, req.params.id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable.'
      });
    }

    // Si l'utilisateur est connecté et n'est pas admin, il ne doit voir que ses propres commandes
    if (req.user && req.user.role !== 'admin' && order.user_id && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette commande.'
      });
    }

    const items = db.queryAll(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [order.id]);

    const payments = db.queryAll(`
      SELECT id, provider, transaction_id, amount, currency, status, created_at
      FROM payments WHERE order_id = ?
    `, [order.id]);

    res.json({
      success: true,
      order,
      items,
      payments
    });
  } catch (err) {
    next(err);
  }
});

export default router;
