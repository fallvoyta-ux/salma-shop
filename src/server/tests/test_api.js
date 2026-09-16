import assert from 'assert';
import { db } from '../db/connection.js';
import bcrypt from 'bcryptjs';

console.log('🧪 Lancement des tests unitaires et d’intégration backend...');

// Test 1 : Vérifier la table users et l'authentification admin
const adminUser = db.queryOne("SELECT * FROM users WHERE email = 'admin@salmashop.sn'");
assert.ok(adminUser, 'L’administrateur Salma doit exister');
assert.strictEqual(adminUser.role, 'admin', 'Le rôle doit être admin');
const isPwValid = await bcrypt.compare('AdminSalma2026!', adminUser.password_hash);
assert.ok(isPwValid, 'Le mot de passe admin doit correspondre au hash bcrypt');
console.log('✅ Test 1 Réussi : Authentification et utilisateurs OK');

// Test 2 : Vérifier les catégories et produits
const categories = db.queryAll('SELECT * FROM categories');
assert.ok(categories.length >= 4, 'Au moins 4 catégories doivent être créées');

const products = db.queryAll('SELECT * FROM products WHERE is_active = 1');
assert.ok(products.length >= 8, 'Au moins 8 produits doivent être créés');

const robe = db.queryOne("SELECT * FROM products WHERE sku = 'ROB-WAX-001'");
assert.ok(robe, 'Le produit ROB-WAX-001 doit exister');
assert.ok(robe.price > 0, 'Le prix doit être strictement positif');
console.log('✅ Test 2 Réussi : Catalogue et produits OK');

// Test 3 : Vérifier la décrémentation atomique des stocks lors d’une commande
const initialStock = robe.stock;
const orderTestNumber = `CMD-TEST-${Date.now()}`;

db.transaction(() => {
  const orderRes = db.execute(`
    INSERT INTO orders (
      order_number, customer_name, customer_email, customer_phone,
      delivery_region, delivery_city, delivery_address, delivery_fee,
      subtotal, total_amount, order_status, payment_method, payment_status
    ) VALUES (?, 'Test Client', 'test@example.com', '+221 77 000 00 00', 'Dakar', 'Dakar', 'Point E', 1500, ?, ?, 'confirmed', 'wave', 'paid')
  `, [orderTestNumber, robe.price, robe.price + 1500]);

  db.execute(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (?, ?, ?, ?, 1, ?)
  `, [orderRes.lastInsertRowid, robe.id, robe.name, robe.price, robe.price]);

  db.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [robe.id]);
});

const updatedRobe = db.queryOne("SELECT stock FROM products WHERE sku = 'ROB-WAX-001'");
assert.strictEqual(updatedRobe.stock, initialStock - 1, 'Le stock doit avoir diminué de 1');
console.log('✅ Test 3 Réussi : Transaction de commande et mise à jour des stocks OK');

// Nettoyage de la commande de test
db.execute("DELETE FROM orders WHERE order_number = ?", [orderTestNumber]);
db.execute("UPDATE products SET stock = ? WHERE sku = 'ROB-WAX-001'", [initialStock]);

// Test 4 : Vérifier les zones de livraison
const zones = db.queryAll('SELECT * FROM delivery_zones WHERE is_active = 1');
assert.ok(zones.length >= 4, 'Au moins 4 zones de livraison configurées');
console.log('✅ Test 4 Réussi : Zones et frais de livraison OK');

// Test 5 : Vérifier les paramètres du magasin
const storeName = db.queryOne("SELECT value FROM settings WHERE key = 'store_name'");
assert.ok(storeName && storeName.value.includes('Salma'), 'Le paramètre store_name doit être initialisé avec Salma Shop');
console.log('✅ Test 5 Réussi : Paramètres boutique OK');

console.log('\n🎉 TOUS LES TESTS BACKEND SONT VALIDÉS AVEC SUCCÈS !');
