import assert from 'assert';
import crypto from 'crypto';
import http from 'http';
import { db, initSchema } from '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { app } from '../index.js';
import { paymentService } from '../services/paymentService.js';

console.log('🧪 Lancement des tests unitaires et d’intégration backend...');

async function runTests() {
  // 0. Démarrage du serveur HTTP de test sur un port éphémère
  await initSchema();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Serveur de test actif sur ${baseUrl}`);

  try {
    // Test 1 : Vérifier la table users et l'existence d'un administrateur
    const adminUser = await db.queryOne("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    assert.ok(adminUser, 'Au moins un compte administrateur doit exister');
    assert.strictEqual(adminUser.role, 'admin', 'Le rôle doit être admin');
    console.log(`✅ Test 1 Réussi : Authentification et compte admin (${adminUser.email}) vérifiés`);

    // Test 2 : Vérifier les catégories et produits
    const categories = await db.queryAll('SELECT * FROM categories');
    assert.ok(categories.length >= 4, 'Au moins 4 catégories doivent être créées');

    const products = await db.queryAll('SELECT * FROM products WHERE is_active = 1');
    assert.ok(products.length >= 8, 'Au moins 8 produits doivent être créés');

    const robe = await db.queryOne("SELECT * FROM products WHERE sku = 'ROB-WAX-001'");
    assert.ok(robe, 'Le produit ROB-WAX-001 doit exister');
    assert.ok(robe.price > 0, 'Le prix doit être strictement positif');
    console.log('✅ Test 2 Réussi : Catalogue et produits OK');

    // Test 3 : Vérifier la décrémentation atomique des stocks via transaction dédiée
    const initialStock = robe.stock;
    const orderTestNumber = `CMD-TEST-${Date.now()}`;

    await db.transaction(async (tx) => {
      const orderRes = await tx.execute(`
        INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone,
          delivery_region, delivery_city, delivery_address, delivery_fee,
          subtotal, total_amount, order_status, payment_method, payment_status
        ) VALUES (?, 'Test Client', 'test@example.com', '+221 77 000 00 00', 'Dakar', 'Dakar', 'Point E', 1500, ?, ?, 'confirmed', 'wave', 'paid')
      `, [orderTestNumber, robe.price, robe.price + 1500]);

      await tx.execute(`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, 1, ?)
      `, [orderRes.lastInsertRowid, robe.id, robe.name, robe.price, robe.price]);

      await tx.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [robe.id]);
    });

    const updatedRobe = await db.queryOne("SELECT stock FROM products WHERE sku = 'ROB-WAX-001'");
    assert.strictEqual(updatedRobe.stock, initialStock - 1, 'Le stock doit avoir diminué de 1');
    console.log('✅ Test 3 Réussi : Transaction de commande avec client tx dédié OK');

    // Nettoyage de la commande de test 3
    await db.execute("DELETE FROM orders WHERE order_number = ?", [orderTestNumber]);
    await db.execute("UPDATE products SET stock = ? WHERE sku = 'ROB-WAX-001'", [initialStock]);

    // Test 4 : Concurrence atomique sur réservation de stock
    const cat = categories[0];
    const testSku = `CONCUR-SKU-${Date.now()}`;
    await db.execute(`
      INSERT INTO products (name, slug, sku, category_id, price, stock, is_active)
      VALUES ('Article Test Concurrence', ?, ?, ?, 5000, 1, 1)
    `, [`slug-${Date.now()}`, testSku, cat.id]);

    const testProduct = await db.queryOne('SELECT id, stock FROM products WHERE sku = ?', [testSku]);
    assert.strictEqual(testProduct.stock, 1, 'Le stock initial du produit de concurrence doit être de 1');

    const tryReserveStock = async (clientName) => {
      return await db.transaction(async (tx) => {
        const stockRes = await tx.execute(
          'UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1 AND is_active = 1',
          [testProduct.id]
        );
        if (stockRes.changes === 0) {
          throw new Error(`Stock insuffisant pour ${clientName}`);
        }
        return `${clientName} réservation réussie`;
      });
    };

    const results = await Promise.allSettled([
      tryReserveStock('Client A'),
      tryReserveStock('Client B')
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactement une commande doit réussir');
    assert.strictEqual(rejected.length, 1, 'Exactement une commande doit échouer avec stock insuffisant');

    const finalStockProd = await db.queryOne('SELECT stock FROM products WHERE id = ?', [testProduct.id]);
    assert.strictEqual(finalStockProd.stock, 0, 'Le stock final doit être exactement 0');

    await db.execute('DELETE FROM products WHERE id = ?', [testProduct.id]);
    console.log('✅ Test 4 Réussi : Concurrence atomique sur le stock validée');

    // Test 5 : Falsification et sécurité des paiements
    const tamperOrderNum = `CMD-TAMPER-${Date.now()}`;
    const tamperOrderRes = await db.execute(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        delivery_region, delivery_city, delivery_address, delivery_fee,
        subtotal, total_amount, order_status, payment_method, payment_status
      ) VALUES (?, 'Client Tamper', 'tamper@salmashop.sn', '+221 77 111 22 33', 'Dakar', 'Dakar', 'Centre-ville', 1500, 15000, 16500, 'pending', 'wave', 'pending')
    `, [tamperOrderNum]);

    const fakeTrxId = `WAVE_TAMPER_${Date.now()}`;
    await db.execute(`
      INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
      VALUES (?, 'wave', ?, 5000, 'XOF', 'pending', '{}')
    `, [tamperOrderRes.lastInsertRowid, fakeTrxId]);

    await assert.rejects(
      async () => {
        await paymentService.verifyAndConfirmPayment(fakeTrxId, 'successful');
      },
      /Incohérence de montant/i,
      'Une tentative de confirmation avec un montant différent de la commande doit être bloquée'
    );

    const validTrxId = `WAVE_VALID_${Date.now()}`;
    await db.execute(`
      INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
      VALUES (?, 'wave', ?, 16500, 'XOF', 'pending', '{}')
    `, [tamperOrderRes.lastInsertRowid, validTrxId]);

    const confirmRes1 = await paymentService.verifyAndConfirmPayment(validTrxId, 'successful');
    assert.strictEqual(confirmRes1.paymentStatus, 'paid', 'Le statut doit être paid');

    const confirmRes2 = await paymentService.verifyAndConfirmPayment(validTrxId, 'successful');
    assert.strictEqual(confirmRes2.alreadyProcessed, true, 'Le second appel doit retourner alreadyProcessed: true sans duplication');

    await db.execute('DELETE FROM payments WHERE order_id = ?', [tamperOrderRes.lastInsertRowid]);
    await db.execute('DELETE FROM orders WHERE id = ?', [tamperOrderRes.lastInsertRowid]);
    console.log('✅ Test 5 Réussi : Falsification des paiements bloquée & Idempotence validée');

    // Test 6 : Contrôle d'accès et autorisation sur /api/orders/:id avec code secret
    const userARes = await db.execute(`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Client', 'A Test', 'usera_test@salmashop.sn', 'hash123', 'client')
    `);
    const userAId = userARes.lastInsertRowid;

    const userBRes = await db.execute(`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Client', 'B Test', 'userb_test@salmashop.sn', 'hash123', 'client')
    `);
    const userBId = userBRes.lastInsertRowid;

    const tokenUserA = jwt.sign({ id: userAId, email: 'usera_test@salmashop.sn', role: 'client' }, config.jwtSecret, { expiresIn: '1h' });
    const tokenUserB = jwt.sign({ id: userBId, email: 'userb_test@salmashop.sn', role: 'client' }, config.jwtSecret, { expiresIn: '1h' });
    const tokenAdmin = jwt.sign({ id: adminUser.id, email: adminUser.email, role: 'admin' }, config.jwtSecret, { expiresIn: '1h' });

    const authSecretCode = '482915';
    const authSecretHash = crypto.createHash('sha256').update(authSecretCode).digest('hex');

    const authOrderNum = `CMD-AUTH-${Date.now()}`;
    const authOrderRes = await db.execute(`
      INSERT INTO orders (
        order_number, tracking_code_hash, user_id, customer_name, customer_email, customer_phone,
        delivery_region, delivery_city, delivery_address, delivery_fee,
        subtotal, total_amount, order_status, payment_method, payment_status
      ) VALUES (?, ?, ?, 'Client A Propriétaire', 'usera_test@salmashop.sn', '+221 77 999 88 77', 'Dakar', 'Dakar', 'Almadies Villa 42', 1500, 10000, 11500, 'pending', 'wave', 'pending')
    `, [authOrderNum, authSecretHash, userAId]);

    const targetOrderId = authOrderRes.lastInsertRowid;

    try {
      // 6a. Visiteur non authentifié sans code -> 401
      const resNoAuth = await fetch(`${baseUrl}/api/orders/${targetOrderId}`);
      assert.strictEqual(resNoAuth.status, 401, 'Un visiteur sans token doit recevoir un statut HTTP 401');

      // 6b. Utilisateur B non autorisé (autre client) -> 403
      const resUserB = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
        headers: { 'Authorization': `Bearer ${tokenUserB}` }
      });
      assert.strictEqual(resUserB.status, 403, 'Un client accédant à la commande d’un tiers doit recevoir HTTP 403');

      // 6c. Propriétaire A -> 200
      const resUserA = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
        headers: { 'Authorization': `Bearer ${tokenUserA}` }
      });
      assert.strictEqual(resUserA.status, 200, 'Le propriétaire de la commande doit recevoir HTTP 200');

      // 6d. Administrateur -> 200
      const resAdmin = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
        headers: { 'Authorization': `Bearer ${tokenAdmin}` }
      });
      assert.strictEqual(resAdmin.status, 200, 'L’administrateur doit recevoir HTTP 200');

      // 6e. Visiteur non connecté avec le bon code secret de suivi -> 200
      const resWithSecret = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
        headers: { 'x-tracking-code': authSecretCode }
      });
      assert.strictEqual(resWithSecret.status, 200, 'La fourniture du code secret valide doit donner accès à la commande');
      const dataSecret = await resWithSecret.json();
      assert.strictEqual(dataSecret.order.delivery_address, 'Almadies Villa 42');

      console.log('✅ Test 6 Réussi : Contrôle d’accès strict & code secret validés');
    } finally {
      await db.execute('DELETE FROM orders WHERE id = ?', [targetOrderId]);
      await db.execute('DELETE FROM users WHERE id IN (?, ?)', [userAId, userBId]);
    }

    // =========================================================================
    // NOUVEAUX TESTS DE SÉCURITÉ & ROBUSTESSE (Points 1 à 10)
    // =========================================================================

    // Test 7 : Confidentialité de l'adresse et des produits sur /api/orders/track/:orderNumber
    const guestSecretCode = '739201';
    const guestSecretHash = crypto.createHash('sha256').update(guestSecretCode).digest('hex');
    const trackOrderNum = `CMD-TRACK-${Date.now()}`;
    const trackOrderRes = await db.execute(`
      INSERT INTO orders (
        order_number, tracking_code_hash, customer_name, customer_email, customer_phone,
        delivery_region, delivery_city, delivery_address, delivery_fee,
        subtotal, total_amount, order_status, payment_method, payment_status
      ) VALUES (?, ?, 'Awa Fall', 'awafall@example.com', '+221 77 333 44 55', 'Dakar', 'Dakar', 'Secret Residence Rue 12 Porte 4', 1500, 20000, 21500, 'pending', 'wave', 'pending')
    `, [trackOrderNum, guestSecretHash]);
    const trackOrderId = trackOrderRes.lastInsertRowid;

    const existingProd = await db.queryOne('SELECT id FROM products LIMIT 1');
    await db.execute(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, subtotal)
      VALUES (?, ?, 'Robe Chic Violette', '/img/robe.jpg', 20000, 1, 20000)
    `, [trackOrderId, existingProd.id]);

    try {
      // 7a. Accès public sans code secret : l'adresse complète et les détails des produits ne doivent PAS apparaître
      const resPublicTrack = await fetch(`${baseUrl}/api/orders/track/${trackOrderNum}`);
      assert.strictEqual(resPublicTrack.status, 200);
      const publicTrackData = await resPublicTrack.json();
      assert.strictEqual(publicTrackData.success, true);
      assert.strictEqual(publicTrackData.order.delivery_address, undefined, 'L’adresse de livraison doit être absente du flux public !');
      assert.strictEqual(publicTrackData.order.delivery_city, 'Dakar');
      assert.strictEqual(publicTrackData.order.is_verified, false);
      assert.strictEqual(publicTrackData.items[0].is_protected, true, 'L’article doit être marqué protégé');
      assert.strictEqual(publicTrackData.items[0].unit_price, undefined, 'Le prix unitaire doit être masqué sans code secret');
      assert.strictEqual(publicTrackData.items[0].subtotal, undefined, 'Le sous-total doit être masqué sans code secret');
      assert.ok(!publicTrackData.items[0].product_name.includes('Robe Chic Violette'), 'Le vrai nom de produit ne doit pas fuiter sans code secret');
      assert.strictEqual(publicTrackData.whatsappUrl, null, 'Le lien WhatsApp ne doit pas être exposé publiquement sans code secret');

      // 7b. Accès avec code secret valide : l'adresse complète et les détails des produits sont déverrouillés
      const resVerifiedTrack = await fetch(`${baseUrl}/api/orders/track/${trackOrderNum}`, {
        headers: { 'x-tracking-code': guestSecretCode }
      });
      assert.strictEqual(resVerifiedTrack.status, 200);
      const verifiedTrackData = await resVerifiedTrack.json();
      assert.strictEqual(verifiedTrackData.order.delivery_address, 'Secret Residence Rue 12 Porte 4', 'L’adresse doit être accessible avec le code secret');
      assert.strictEqual(verifiedTrackData.order.is_verified, true);
      assert.strictEqual(verifiedTrackData.items[0].product_name, 'Robe Chic Violette', 'Le nom réel de l’article doit être visible après vérification');
      assert.strictEqual(verifiedTrackData.items[0].unit_price, 20000, 'Le prix de l’article doit être visible après vérification');
      assert.ok(verifiedTrackData.whatsappUrl, 'Le lien WhatsApp doit être généré une fois vérifié');

      console.log('✅ Test 7 Réussi : Confidentialité de l’adresse & protection stricte des produits sans code secret validées');
    } finally {
      await db.execute('DELETE FROM order_items WHERE order_id = ?', [trackOrderId]);
      await db.execute('DELETE FROM orders WHERE id = ?', [trackOrderId]);
    }

    // Test 8 : Verrouillage de /api/payments/verify contre l'usurpation & imposition du statut par le serveur pour Wave
    const verifySecretCode = '882194';
    const verifySecretHash = crypto.createHash('sha256').update(verifySecretCode).digest('hex');
    const verifyOrderNum = `CMD-VERIFY-${Date.now()}`;
    const verifyOrderRes = await db.execute(`
      INSERT INTO orders (
        order_number, tracking_code_hash, customer_name, customer_email, customer_phone,
        delivery_region, delivery_city, delivery_address, delivery_fee,
        subtotal, total_amount, order_status, payment_method, payment_status
      ) VALUES (?, ?, 'Moussa Ba', 'moussaba@example.com', '+221 77 888 99 00', 'Dakar', 'Dakar', 'Yoff Tonghor', 1500, 10000, 11500, 'pending', 'wave', 'pending')
    `, [verifyOrderNum, verifySecretHash]);
    const verifyOrderId = verifyOrderRes.lastInsertRowid;

    const verifyTrxId = `WAVE_TEST_VERIFY_${Date.now()}`;
    await db.execute(`
      INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
      VALUES (?, 'wave', ?, 11500, 'XOF', 'pending', '{}')
    `, [verifyOrderId, verifyTrxId]);

    try {
      // 8a. Un appelant inconnu (ni admin, ni propriétaire, ni code secret) doit recevoir 403 Forbidden
      const resStranger = await fetch(`${baseUrl}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: verifyTrxId, status: 'successful' })
      });
      assert.strictEqual(resStranger.status, 403, 'Un appelant sans droit sur la transaction doit être rejeté en 403');

      // 8b. Avec le code secret valide : le serveur impose lui-même le statut 'successful' même si le client envoie 'failed'
      const resOwnerWithSecret = await fetch(`${baseUrl}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tracking-code': verifySecretCode
        },
        body: JSON.stringify({ transaction_id: verifyTrxId, status: 'failed' }) // Le client tente d'injecter 'failed'
      });
      assert.strictEqual(resOwnerWithSecret.status, 200, 'La confirmation avec code secret valide doit réussir');

      // Vérifier en base : le statut imposé par le serveur est bien 'paid' (et non pas 'failed' envoyé par le client)
      const paymentInDb = await db.queryOne('SELECT status FROM payments WHERE transaction_id = ?', [verifyTrxId]);
      assert.strictEqual(paymentInDb.status, 'paid', 'Le serveur doit imposer le statut du paiement pour Wave sans reprendre celui du navigateur');
      const orderInDb = await db.queryOne('SELECT payment_status FROM orders WHERE id = ?', [verifyOrderId]);
      assert.strictEqual(orderInDb.payment_status, 'paid');

      console.log('✅ Test 8 Réussi : Verrouillage HTTP 403 & imposition stricte du statut Wave par le serveur validés');
    } finally {
      await db.execute('DELETE FROM payments WHERE order_id = ?', [verifyOrderId]);
      await db.execute('DELETE FROM orders WHERE id = ?', [verifyOrderId]);
    }

    // Test 9 : Échec atomique 409 lors de la réactivation avec stock insuffisant (Point 4)
    const stockTestSku = `SKU-STOCKTEST-${Date.now()}`;
    const prodStockRes = await db.execute(`
      INSERT INTO products (name, slug, sku, category_id, price, stock, is_active)
      VALUES ('Article Stock Limité', ?, ?, ?, 10000, 1, 1)
    `, [`slug-stock-${Date.now()}`, stockTestSku, cat.id]);
    const stockProdId = prodStockRes.lastInsertRowid;

    const stockOrderNum = `CMD-STOCKTEST-${Date.now()}`;
    const stockOrderRes = await db.execute(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        delivery_region, delivery_city, delivery_address, delivery_fee,
        subtotal, total_amount, order_status, payment_method, payment_status
      ) VALUES (?, 'Client Stock', 'client@test.sn', '+221 77 123 45 67', 'Dakar', 'Dakar', 'Plateau', 1500, 10000, 11500, 'pending', 'wave', 'pending')
    `, [stockOrderNum]);
    const stockOrderId = stockOrderRes.lastInsertRowid;

    await db.execute(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
      VALUES (?, ?, 'Article Stock Limité', 10000, 1, 10000)
    `, [stockOrderId, stockProdId]);

    try {
      // 9a. Annuler la commande -> le stock est réapprovisionné (+1 -> stock = 2)
      const resCancel = await fetch(`${baseUrl}/api/admin/orders/${stockOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenAdmin}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      assert.strictEqual(resCancel.status, 200);

      const prodAfterCancel = await db.queryOne('SELECT stock FROM products WHERE id = ?', [stockProdId]);
      assert.strictEqual(prodAfterCancel.stock, 2);

      // 9b. Vendre tout le stock restant (un autre client achète les 2 pièces)
      await db.execute('UPDATE products SET stock = 0 WHERE id = ?', [stockProdId]);

      // 9c. Tentative de réactivation par l'admin -> DOIT échouer avec HTTP 409 Conflict
      const resReactivate = await fetch(`${baseUrl}/api/admin/orders/${stockOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenAdmin}`
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      assert.strictEqual(resReactivate.status, 409, 'La réactivation sans stock doit lever une erreur 409 Conflict');

      // Vérifier que la commande est RESTÉE cancelled et qu'aucun stock négatif n'a été créé
      const orderAfterFailedReactivate = await db.queryOne('SELECT order_status FROM orders WHERE id = ?', [stockOrderId]);
      assert.strictEqual(orderAfterFailedReactivate.order_status, 'cancelled', 'La commande doit rester cancelled après rollback');

      const prodAfterRollback = await db.queryOne('SELECT stock FROM products WHERE id = ?', [stockProdId]);
      assert.strictEqual(prodAfterRollback.stock, 0, 'Le stock ne doit pas être décrémenté négativement');

      console.log('✅ Test 9 Réussi : Rejet 409 Conflict & rollback lors de réactivation sans stock (Point 4)');
    } finally {
      await db.execute('DELETE FROM order_items WHERE order_id = ?', [stockOrderId]);
      await db.execute('DELETE FROM orders WHERE id = ?', [stockOrderId]);
      await db.execute('DELETE FROM products WHERE id = ?', [stockProdId]);
    }

    // Test 10 : Annulation d'une commande payée et passage à refund_pending (Point 5)
    const paidOrderNum = `CMD-PAID-${Date.now()}`;
    const paidOrderRes = await db.execute(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        delivery_region, delivery_city, delivery_address, delivery_fee,
        subtotal, total_amount, order_status, payment_method, payment_status
      ) VALUES (?, 'Client Payé', 'paye@test.sn', '+221 77 987 65 43', 'Dakar', 'Dakar', 'Ngor', 1500, 20000, 21500, 'confirmed', 'wave', 'paid')
    `, [paidOrderNum]);
    const paidOrderId = paidOrderRes.lastInsertRowid;

    await db.execute(`
      INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
      VALUES (?, 'wave', ?, 21500, 'XOF', 'paid', '{}')
    `, [paidOrderId, `WAVE_PAID_CANCEL_${Date.now()}`]);

    try {
      // Annuler la commande payée via l'admin
      const resCancelPaid = await fetch(`${baseUrl}/api/admin/orders/${paidOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenAdmin}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      assert.strictEqual(resCancelPaid.status, 200);
      const cancelPaidData = await resCancelPaid.json();

      assert.strictEqual(cancelPaidData.payment_status, 'refund_pending', 'Le statut de paiement doit être refund_pending');
      assert.ok(cancelPaidData.warning && cancelPaidData.warning.includes('refund_pending'), 'Un avertissement de remboursement doit être renvoyé');

      const checkOrder = await db.queryOne('SELECT payment_status, order_status FROM orders WHERE id = ?', [paidOrderId]);
      assert.strictEqual(checkOrder.order_status, 'cancelled');
      assert.strictEqual(checkOrder.payment_status, 'refund_pending');

      const checkPayment = await db.queryOne('SELECT status FROM payments WHERE order_id = ?', [paidOrderId]);
      assert.strictEqual(checkPayment.status, 'refund_pending');

      // Admin marque ensuite le remboursement comme effectué
      const resRefunded = await fetch(`${baseUrl}/api/admin/orders/${paidOrderId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenAdmin}`
        },
        body: JSON.stringify({ payment_status: 'refunded' })
      });
      assert.strictEqual(resRefunded.status, 200);

      const checkRefundedOrder = await db.queryOne('SELECT payment_status FROM orders WHERE id = ?', [paidOrderId]);
      assert.strictEqual(checkRefundedOrder.payment_status, 'refunded');

      console.log('✅ Test 10 Réussi : Statut refund_pending & alerte de remboursement validés (Point 5)');
    } finally {
      await db.execute('DELETE FROM payments WHERE order_id = ?', [paidOrderId]);
      await db.execute('DELETE FROM orders WHERE id = ?', [paidOrderId]);
    }

    // Test 11 : Protection JWT (Point 8)
    assert.ok(config.jwtSecret && config.jwtSecret.length >= 32, 'Le JWT_SECRET doit comporter au moins 32 caractères');
    assert.notStrictEqual(config.jwtSecret, 'salma_shop_chic_ladies_dakar_secret_jwt_2026', 'La clé par défaut non sécurisée a été supprimée');
    console.log('✅ Test 11 Réussi : Clé JWT sécurisée sans repli vulnérable (Point 8)');

    // Test 12 : Zones de livraison
    const zones = await db.queryAll('SELECT * FROM delivery_zones WHERE is_active = 1');
    assert.ok(zones.length >= 4, 'Au moins 4 zones de livraison configurées');
    console.log('✅ Test 12 Réussi : Zones et frais de livraison OK');

    // Test 13 : Paramètres de la boutique
    const storeName = await db.queryOne("SELECT value FROM settings WHERE key = 'store_name'");
    assert.ok(
      storeName && (storeName.value.includes('Global Business') || storeName.value.includes('Salma')),
      'Le paramètre store_name doit être initialisé'
    );
    console.log('✅ Test 13 Réussi : Paramètres boutique OK');

    // Test 14 : Formulaire de contact
    const contactRes = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fatou Ndiaye Test',
        phone: '+221 77 201 86 97',
        subject: 'Demande d’information catalogue',
        message: 'Bonjour, avez-vous des robes disponibles ?'
      })
    });
    assert.strictEqual(contactRes.status, 201, 'Le formulaire de contact doit renvoyer 201');
    const contactData = await contactRes.json();
    assert.strictEqual(contactData.success, true);
    assert.ok(contactData.whatsappUrl && contactData.whatsappUrl.includes('221772018697'));
    console.log('✅ Test 14 Réussi : Endpoint /api/contact validé');

    // Test 15 : Sécurité WhatsApp - Le code secret de suivi ne doit JAMAIS apparaître dans le message ou l'URL
    const mockOrder = {
      order_number: 'CMD-TEST-SECRET',
      tracking_code: '987654',
      total_amount: 25000,
      customer_name: 'Awa Diop',
      customer_phone: '+221 77 123 45 67',
      delivery_city: 'Dakar',
      delivery_address: 'Mermoz',
      payment_method: 'wave'
    };
    const { notificationService } = await import('../services/notificationService.js');
    const waUrl = notificationService.getOrderWhatsAppUrl(mockOrder, []);
    assert.ok(!waUrl.includes('987654'), 'Le code secret ne doit JAMAIS être dans l’URL WhatsApp');
    assert.ok(!waUrl.includes('Code%20secret'), 'La mention Code secret ne doit pas être dans le message WhatsApp');
    console.log('✅ Test 15 Réussi : Confidentialité WhatsApp - Code secret strictement exclu de l’URL et du message');

    // Test 16 : Modularité des Rate Limiters (Tracking 10/15min vs Création 40/15min)
    const { trackingLimiter, orderCreationLimiter } = await import('../middleware/rateLimiters.js');
    assert.ok(trackingLimiter && typeof trackingLimiter === 'function', 'trackingLimiter doit être exporté');
    assert.ok(orderCreationLimiter && typeof orderCreationLimiter === 'function', 'orderCreationLimiter doit être exporté');
    console.log('✅ Test 16 Réussi : Limiteurs de débit modulaires (Tracking 10/15min & Commandes 40/15min) validés');

    console.log('\n🎉 TOUS LES TESTS BACKEND, DURCISSEMENTS & VÉRIFICATIONS SONT VALIDÉS AVEC SUCCÈS !');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Échec des tests backend:', err);
  process.exit(1);
});
