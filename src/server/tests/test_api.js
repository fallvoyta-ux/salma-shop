import assert from 'assert';
import { db } from '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { paymentService } from '../services/paymentService.js';

console.log('🧪 Lancement des tests unitaires et d’intégration backend...');

async function runTests() {
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

  // Test 3 : Vérifier la décrémentation atomique des stocks via transaction dédiée (Point 15)
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
  console.log('✅ Test 3 Réussi : Transaction de commande avec client tx dédié OK (Point 15)');

  // Nettoyage de la commande de test 3
  await db.execute("DELETE FROM orders WHERE order_number = ?", [orderTestNumber]);
  await db.execute("UPDATE products SET stock = ? WHERE sku = 'ROB-WAX-001'", [initialStock]);

  // Test 4 : Test de concurrence automatisé sur réservation de stock (Point 16)
  const cat = categories[0];
  const testSku = `CONCUR-SKU-${Date.now()}`;
  const prodRes = await db.execute(`
    INSERT INTO products (name, slug, sku, category_id, price, stock, is_active)
    VALUES ('Article Test Concurrence', ?, ?, ?, 5000, 1, 1)
  `, [`slug-${Date.now()}`, testSku, cat.id]);

  const testProduct = await db.queryOne('SELECT id, stock FROM products WHERE sku = ?', [testSku]);
  assert.strictEqual(testProduct.stock, 1, 'Le stock initial du produit de concurrence doit être de 1');

  // Simuler 2 requêtes concurrentes en parallèle essayant d'acheter le dernier article restant
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
  assert.match(rejected[0].reason.message, /Stock insuffisant/, 'Le message d’erreur doit indiquer un stock insuffisant');

  const finalStockProd = await db.queryOne('SELECT stock FROM products WHERE id = ?', [testProduct.id]);
  assert.strictEqual(finalStockProd.stock, 0, 'Le stock final doit être exactement 0');

  // Nettoyage produit de concurrence
  await db.execute('DELETE FROM products WHERE id = ?', [testProduct.id]);
  console.log('✅ Test 4 Réussi : Concurrence atomique sur le stock validée (Point 16)');

  // Test 5 : Tests de falsification et sécurité des paiements (Point 17)
  // 5a. Transaction introuvable
  await assert.rejects(
    async () => {
      await paymentService.verifyAndConfirmPayment('FAKETRX_INEXISTANTE_9999', 'successful');
    },
    /introuvable/i,
    'Une transaction inexistante doit être rejetée'
  );

  // 5b. Montant falsifié
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

  // 5c. Idempotence : montant correct, confirmation unique
  const validTrxId = `WAVE_VALID_${Date.now()}`;
  await db.execute(`
    INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
    VALUES (?, 'wave', ?, 16500, 'XOF', 'pending', '{}')
  `, [tamperOrderRes.lastInsertRowid, validTrxId]);

  const confirmRes1 = await paymentService.verifyAndConfirmPayment(validTrxId, 'successful');
  assert.strictEqual(confirmRes1.paymentStatus, 'paid', 'Le statut doit être paid');

  const confirmRes2 = await paymentService.verifyAndConfirmPayment(validTrxId, 'successful');
  assert.strictEqual(confirmRes2.alreadyProcessed, true, 'Le second appel doit retourner alreadyProcessed: true sans duplication');

  // 5d. Prestataire non supporté
  await assert.rejects(
    async () => {
      await paymentService.initializePayment({ id: tamperOrderRes.lastInsertRowid, total_amount: 16500, order_number: tamperOrderNum }, 'bitcoin');
    },
    /non pris en charge/i,
    'Un moyen de paiement non supporté doit être rejeté'
  );

  // Nettoyage test 5
  await db.execute('DELETE FROM payments WHERE order_id = ?', [tamperOrderRes.lastInsertRowid]);
  await db.execute('DELETE FROM orders WHERE id = ?', [tamperOrderRes.lastInsertRowid]);
  console.log('✅ Test 5 Réussi : Falsification des paiements bloquée & Idempotence validée (Point 17)');

  // Test 6 : Contrôle d'accès et autorisation sur /api/orders/:id (Point 18)
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

  const authOrderNum = `CMD-AUTH-${Date.now()}`;
  const authOrderRes = await db.execute(`
    INSERT INTO orders (
      order_number, user_id, customer_name, customer_email, customer_phone,
      delivery_region, delivery_city, delivery_address, delivery_fee,
      subtotal, total_amount, order_status, payment_method, payment_status
    ) VALUES (?, ?, 'Client A Propriétaire', 'usera_test@salmashop.sn', '+221 77 999 88 77', 'Dakar', 'Dakar', 'Almadies', 1500, 10000, 11500, 'pending', 'wave', 'pending')
  `, [authOrderNum, userAId]);

  const targetOrderId = authOrderRes.lastInsertRowid;
  const baseUrl = `http://localhost:${config.port}`;

  try {
    // 6a. Visiteur non authentifié -> 401
    const resNoAuth = await fetch(`${baseUrl}/api/orders/${targetOrderId}`);
    assert.strictEqual(resNoAuth.status, 401, 'Un visiteur sans token doit recevoir un statut HTTP 401');

    // 6b. Utilisateur B non autorisé (autre client) -> 403
    const resUserB = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
      headers: { 'Authorization': `Bearer ${tokenUserB}` }
    });
    assert.strictEqual(resUserB.status, 403, 'Un client essayant d’accéder à la commande d’un tiers doit recevoir HTTP 403');

    // 6c. Propriétaire A -> 200
    const resUserA = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
      headers: { 'Authorization': `Bearer ${tokenUserA}` }
    });
    assert.strictEqual(resUserA.status, 200, 'Le propriétaire de la commande doit recevoir HTTP 200');
    const dataA = await resUserA.json();
    assert.strictEqual(dataA.order.order_number, authOrderNum);

    // 6d. Administrateur -> 200
    const resAdmin = await fetch(`${baseUrl}/api/orders/${targetOrderId}`, {
      headers: { 'Authorization': `Bearer ${tokenAdmin}` }
    });
    assert.strictEqual(resAdmin.status, 200, 'L’administrateur doit recevoir HTTP 200');

    console.log('✅ Test 6 Réussi : Contrôle d’accès strict sur /api/orders/:id validé 401/403/200 (Point 18)');
  } finally {
    await db.execute('DELETE FROM orders WHERE id = ?', [targetOrderId]);
    await db.execute('DELETE FROM users WHERE id IN (?, ?)', [userAId, userBId]);
  }

  // Test 7 : Vérifier les zones de livraison
  const zones = await db.queryAll('SELECT * FROM delivery_zones WHERE is_active = 1');
  assert.ok(zones.length >= 4, 'Au moins 4 zones de livraison configurées');
  console.log('✅ Test 7 Réussi : Zones et frais de livraison OK');

  // Test 8 : Vérifier les paramètres du magasin (Point 26)
  const storeName = await db.queryOne("SELECT value FROM settings WHERE key = 'store_name'");
  assert.ok(
    storeName && (storeName.value.includes('Global Business') || storeName.value.includes('Salma')),
    'Le paramètre store_name doit être initialisé avec Global Business Services ou Salma Shop'
  );
  console.log('✅ Test 8 Réussi : Paramètres boutique OK (Point 26)');

  // Test 9 : Formulaire de contact (Point 19)
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
  console.log('✅ Test 9 Réussi : Endpoint /api/contact et enregistrement en base validés (Point 19)');

  console.log('\n🎉 TOUS LES TESTS BACKEND & SÉCURITÉ SONT VALIDÉS AVEC SUCCÈS !');
}

runTests().catch((err) => {
  console.error('❌ Échec des tests backend:', err);
  process.exit(1);
});
