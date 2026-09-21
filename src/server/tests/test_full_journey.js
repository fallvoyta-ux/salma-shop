import assert from 'assert';
import crypto from 'crypto';
import http from 'http';
import bcrypt from 'bcryptjs';
import { db, initSchema } from '../db/connection.js';
import { app } from '../index.js';

let server = null;
let BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
let testAdminEmail = null;

async function setupServerAndAdmin() {
  await initSchema();

  // 1. Vérifier si un serveur tourne déjà sur le port 5000, sinon démarrer un serveur éphémère
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (healthCheck.status === 200) {
      console.log(`📡 Connexion au serveur existant sur ${BASE_URL}`);
    } else {
      throw new Error('Statut non 200');
    }
  } catch (e) {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    BASE_URL = `http://127.0.0.1:${port}`;
    console.log(`📡 Serveur de test éphémère démarré sur ${BASE_URL}`);
  }

  // 2. Création d'un compte administrateur dédié éphémère de test
  // Aucun identifiant de production n'est utilisé dans ce test
  testAdminEmail = `admin-test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@salmashop.local`;
  const testAdminPassword = `TestAdmin_${crypto.randomBytes(12).toString('hex')}!`;
  const passwordHash = await bcrypt.hash(testAdminPassword, 10);

  await db.execute(`
    INSERT INTO users (email, password_hash, first_name, last_name, role, city, region)
    VALUES (?, ?, 'AdminTest', 'Automatisé', 'admin', 'Dakar', 'Dakar')
  `, [testAdminEmail, passwordHash]);

  console.log(`🔑 Administrateur de test éphémère créé : ${testAdminEmail}\n`);

  return { testAdminEmail, testAdminPassword };
}

async function runFullJourneyTest() {
  console.log('🚀 Démarrage du test de parcours complet Client & Admin...\n');

  const { testAdminEmail: adminEmail, testAdminPassword: adminPassword } = await setupServerAndAdmin();

  try {
    // 1. Health check
    console.log('1️⃣ Vérification de l’état du serveur (/api/health)...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Le serveur doit répondre 200 OK');
    const health = await healthRes.json();
    assert.strictEqual(health.status, 'ok');
    console.log(`   ✓ Serveur en ligne (${health.store}, Mode: ${health.paymentMode})`);

    // 2. Récupérer les catégories
    console.log('\n2️⃣ Consultation des catégories (/api/categories)...');
    const catRes = await fetch(`${BASE_URL}/api/categories`);
    const catData = await catRes.json();
    assert.ok(catData.success);
    assert.ok(catData.categories.length >= 4, 'Au moins 4 catégories');
    console.log(`   ✓ ${catData.categories.length} catégories trouvées : ${catData.categories.map(c => c.name).join(', ')}`);

    // 3. Recherche et filtrage des produits
    console.log('\n3️⃣ Recherche et filtrage (/api/products)...');
    const searchRes = await fetch(`${BASE_URL}/api/products?search=wax&sort=price_asc`);
    const searchData = await searchRes.json();
    assert.ok(searchData.success);
    assert.ok(searchData.products.length > 0, 'Au moins un produit trouvé pour "wax"');
    console.log(`   ✓ ${searchData.products.length} produit(s) trouvé(s) pour "wax". Premier : ${searchData.products[0].name} (${searchData.products[0].price} FCFA)`);

    // 4. Consultation de la fiche produit
    const targetSlug = searchData.products[0].slug;
    console.log(`\n4️⃣ Consultation de la fiche produit (/api/products/${targetSlug})...`);
    const prodRes = await fetch(`${BASE_URL}/api/products/${targetSlug}`);
    const prodData = await prodRes.json();
    assert.ok(prodData.success);
    const product = prodData.product;
    const initialStock = product.stock;
    console.log(`   ✓ Fiche produit chargée : "${product.name}"`);
    console.log(`     - Prix : ${product.price} FCFA | Ancien prix : ${product.compare_price || 'Aucun'}`);
    console.log(`     - Stock disponible actuel : ${initialStock} pièces`);
    console.log(`     - Photos dans la galerie : ${product.images.length}`);
    console.log(`     - Note moyenne : ${product.average_rating}/5 (${product.review_count} avis)`);

    // 5. Ajout d'un avis client
    console.log('\n5️⃣ Publication d’un nouvel avis client...');
    const reviewRes = await fetch(`${BASE_URL}/api/reviews/product/${product.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: 'Khady Ndiaye',
        rating: 5,
        comment: 'Finitions remarquables et tissu de très haute qualité. Bravo à Salma Shop !'
      })
    });
    const reviewData = await reviewRes.json();
    assert.ok(reviewData.success, 'Avis client enregistré');
    console.log('   ✓ Avis client publié avec succès');

    // 6. Récupération des zones de livraison
    console.log('\n6️⃣ Choix de la zone de livraison (/api/delivery-zones)...');
    const zonesRes = await fetch(`${BASE_URL}/api/delivery-zones`);
    const zonesData = await zonesRes.json();
    assert.ok(zonesData.success);
    const selectedZone = zonesData.zones.find(z => z.name.includes('Almadies') || z.price === 2000) || zonesData.zones[0];
    console.log(`   ✓ Zone sélectionnée : ${selectedZone.name} (${selectedZone.price} FCFA, ${selectedZone.estimated_days})`);

    // 7. Création de la commande par un client (Achat de 2 exemplaires)
    const orderQty = 2;
    console.log(`\n7️⃣ Passage de commande (quantité: ${orderQty})...`);
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Marième Fall',
        customer_email: 'marieme.fall@example.sn',
        customer_phone: '+221 77 987 65 43',
        delivery_region: 'Dakar',
        delivery_city: 'Almadies, Dakar',
        delivery_address: 'Route des Almadies, près de la corniche',
        delivery_notes: 'Appeler avant de livrer',
        delivery_zone_id: selectedZone.id,
        payment_method: 'wave',
        items: [
          { productId: product.id, quantity: orderQty }
        ]
      })
    });

    const orderData = await orderRes.json();
    assert.ok(orderData.success, `Erreur commande: ${orderData.message}`);
    const order = orderData.order;
    console.log(`   ✓ Commande créée : ${order.order_number}`);
    console.log(`     - Sous-total : ${order.subtotal} FCFA`);
    console.log(`     - Frais livraison : ${order.delivery_fee} FCFA`);
    console.log(`     - Total à régler : ${order.total_amount} FCFA`);
    console.log(`     - Moyen de paiement : ${order.payment_method}`);
    console.log(`     - Code secret fourni au client : ${orderData.tracking_code ? 'OUI (confidentiel)' : 'NON'}`);

    // Sécurité Vérification : Le code secret ne doit PAS figurer dans l'URL WhatsApp
    if (orderData.whatsappUrl) {
      assert.ok(
        !orderData.whatsappUrl.includes('Code%20secret') && !orderData.whatsappUrl.includes('tracking_code'),
        'Le lien WhatsApp ne doit jamais exposer le code secret de suivi'
      );
      if (orderData.tracking_code) {
        assert.ok(
          !orderData.whatsappUrl.includes(orderData.tracking_code),
          'Le code secret ne doit pas être présent dans le paramètre text du lien WhatsApp'
        );
      }
      console.log('   ✓ Sécurité WhatsApp vérifiée : Le code secret est totalement absent de l’URL publique');
    }

    // 8. Vérification de la décrémentation automatique du stock
    console.log('\n8️⃣ Vérification de l’ajustement automatique du stock...');
    const verifyProdRes = await fetch(`${BASE_URL}/api/products/${targetSlug}`);
    const verifyProdData = await verifyProdRes.json();
    const newStock = verifyProdData.product.stock;
    assert.strictEqual(newStock, initialStock - orderQty, `Le stock doit avoir diminué de ${orderQty} (initial: ${initialStock}, actuel: ${newStock})`);
    console.log(`   ✓ Stock vérifié : ${initialStock} -> ${newStock} (-${orderQty})`);

    // 9. Suivi public de la commande par son numéro
    console.log(`\n9️⃣ Suivi de commande (/api/orders/track/${order.order_number})...`);
    const trackRes = await fetch(`${BASE_URL}/api/orders/track/${order.order_number}`);
    const trackData = await trackRes.json();
    assert.ok(trackData.success);
    assert.strictEqual(trackData.order.order_number, order.order_number);
    console.log(`   ✓ Suivi public réussi : Statut = [${trackData.order.order_status.toUpperCase()}]`);
    assert.strictEqual(trackData.order.delivery_address, undefined, 'L’adresse complète doit être masquée en public sans code secret');
    console.log('   ✓ Confidentialité respectée : Adresse complète masquée en consultation publique');

    // 9bis. Suivi avec le header secret x-tracking-code
    if (orderData.tracking_code) {
      const trackAuthRes = await fetch(`${BASE_URL}/api/orders/track/${order.order_number}`, {
        headers: { 'x-tracking-code': orderData.tracking_code }
      });
      const trackAuthData = await trackAuthRes.json();
      assert.ok(trackAuthData.success);
      assert.ok(trackAuthData.order.delivery_address, 'L’adresse doit être accessible avec le code secret');
      console.log('   ✓ Suivi authentifié par x-tracking-code validé : Détails complets déverrouillés');
    }

    // 10. Connexion Administrateur avec le compte de test éphémère
    console.log(`\n🔟 Connexion Espace Administrateur (${adminEmail})...`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });
    const loginData = await loginRes.json();
    assert.ok(loginData.success, 'Connexion de l’administrateur de test échouée');
    const adminToken = loginData.token;
    console.log(`   ✓ Connecté en tant qu’administrateur test (${loginData.user.first_name} ${loginData.user.last_name})`);

    // 11. Consultation du tableau de bord et KPI réels
    console.log('\n1️⃣1️⃣ Consultation des statistiques réelles du Dashboard (/api/admin/stats)...');
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    assert.ok(statsData.success);
    const s = statsData.stats;
    console.log(`   ✓ KPI chargés :`);
    console.log(`     - Chiffre d'affaires total : ${s.total_revenue.toLocaleString('fr-FR')} FCFA`);
    console.log(`     - Total commandes : ${s.total_orders}`);
    console.log(`     - Commandes en attente : ${s.pending_orders}`);
    console.log(`     - Panier moyen : ${s.average_order_value.toLocaleString('fr-FR')} FCFA`);
    console.log(`     - Nombre de clients : ${s.total_customers}`);
    console.log(`     - Alertes de stock faible : ${s.low_stock_count}`);

    // 12. Mise à jour du statut de la commande côté administrateur
    console.log('\n1️⃣2️⃣ Traitement de la commande par l’administrateur...');
    const updateStatusRes = await fetch(`${BASE_URL}/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const updateStatusData = await updateStatusRes.json();
    assert.ok(updateStatusData.success);
    console.log(`   ✓ Statut de la commande mis à jour vers "confirmed"`);

    // Validation du paiement
    const updatePayRes = await fetch(`${BASE_URL}/api/admin/orders/${order.id}/payment-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ payment_status: 'paid' })
    });
    const updatePayData = await updatePayRes.json();
    assert.ok(updatePayData.success);
    console.log(`   ✓ Statut du paiement mis à jour vers "paid"`);

    // 13. Test de mise à jour des paramètres du magasin
    console.log('\n1️⃣3️⃣ Modification des paramètres du magasin (/api/admin/settings)...');
    const testBanner = `✨ Grande Vente Dakar ${Date.now()} : Livraison offerte dès 40 000 FCFA !`;
    const updateSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ announcement_bar: testBanner })
    });
    const updateSettingsData = await updateSettingsRes.json();
    assert.ok(updateSettingsData.success);

    const publicSettingsRes = await fetch(`${BASE_URL}/api/settings`);
    const publicSettingsData = await publicSettingsRes.json();
    assert.strictEqual(publicSettingsData.settings.announcement_bar, testBanner);
    console.log(`   ✓ Paramètre mis à jour et vérifié sur l’API publique : "${publicSettingsData.settings.announcement_bar}"`);

    console.log('\n======================================================');
    console.log('🏆 TOUS LES TESTS DU PARCOURS CLIENT & ADMIN ONT RÉUSSI !');
    console.log('======================================================\n');
  } finally {
    // Nettoyage impératif de l'utilisateur administrateur éphémère de test
    if (testAdminEmail) {
      try {
        await db.execute('DELETE FROM users WHERE email = ?', [testAdminEmail]);
        console.log(`🧹 Nettoyage : Administrateur temporaire (${testAdminEmail}) supprimé de la base.`);
      } catch (cleanErr) {
        console.warn('Erreur nettoyage admin test:', cleanErr.message);
      }
    }
    if (server) {
      await new Promise(r => server.close(r));
      console.log('🛑 Serveur de test éphémère arrêté.');
    }
  }
}

runFullJourneyTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Échec du test:', err);
    process.exit(1);
  });
