import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function runFullJourneyTest() {
  console.log('🚀 Démarrage du test de parcours complet Client & Admin...\n');

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
      comment: 'Finitions impeccables et tissu d’une grande qualité. Je recommande vivement !'
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
  console.log(`     - Total réglé : ${order.total_amount} FCFA`);
  console.log(`     - Moyen de paiement : ${order.payment_method}`);
  console.log(`     - Lien WhatsApp généré : ${orderData.whatsappUrl ? 'OUI (prêt à envoyer)' : 'NON'}`);

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
  console.log(`   ✓ Suivi réussi : Statut actuel = [${trackData.order.order_status.toUpperCase()}]`);

  // 10. Connexion Administrateur
  console.log('\n🔟 Connexion Espace Administrateur (/api/auth/login)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@salmashop.sn',
      password: 'AdminSalma2026!'
    })
  });
  const loginData = await loginRes.json();
  assert.ok(loginData.success, 'Connexion admin échouée');
  const adminToken = loginData.token;
  console.log(`   ✓ Connecté en tant qu’administrateur (${loginData.user.first_name} ${loginData.user.last_name})`);

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
  console.log('\n1️⃣3️⃣ Modification des paramètres du magasin sans toucher au code (/api/admin/settings)...');
  const updateSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      announcement_bar: '✨ Grande Vente Privée Dakar : Livraison offerte dès 40 000 FCFA !'
    })
  });
  const updateSettingsData = await updateSettingsRes.json();
  assert.ok(updateSettingsData.success);

  const publicSettingsRes = await fetch(`${BASE_URL}/api/settings`);
  const publicSettingsData = await publicSettingsRes.json();
  assert.strictEqual(publicSettingsData.settings.announcement_bar, '✨ Grande Vente Privée Dakar : Livraison offerte dès 40 000 FCFA !');
  console.log(`   ✓ Paramètre mis à jour et vérifié sur l’API publique : "${publicSettingsData.settings.announcement_bar}"`);

  console.log('\n======================================================');
  console.log('🏆 TOUS LES TESTS DU PARCOURS CLIENT & ADMIN ONT RÉUSSI !');
  console.log('======================================================\n');
}

runFullJourneyTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Échec du test:', err);
    process.exit(1);
  });
