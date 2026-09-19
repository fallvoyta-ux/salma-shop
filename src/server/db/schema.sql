-- =======================================================
-- TERANGA SHOP DAKAR - SCHEMA BASE DE DONNEES RELATIONNELLE
-- =======================================================

PRAGMA foreign_keys = ON;

-- 1. Table des utilisateurs (Clients & Administrateurs)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'admin', 'employee')),
  address TEXT,
  city TEXT DEFAULT 'Dakar',
  region TEXT DEFAULT 'Dakar',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des catégories de produits
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des produits
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price INTEGER NOT NULL CHECK(price >= 0),            -- Prix en FCFA (sans décimales)
  compare_price INTEGER CHECK(compare_price IS NULL OR compare_price >= price), -- Ancien prix si promotion
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sku TEXT UNIQUE,                                     -- Référence unique du produit
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK(is_featured IN (0, 1)),
  is_promo INTEGER NOT NULL DEFAULT 0 CHECK(is_promo IN (0, 1)),
  specifications TEXT,                                 -- Données techniques en JSON (matière, taille, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des photos des produits (multi-images)
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des zones et tarifs de livraison configurables
CREATE TABLE IF NOT EXISTS delivery_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK(price >= 0),  -- Frais de port en FCFA
  estimated_days TEXT,                                 -- Ex: "24h à 48h", "Même jour"
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,                   -- Ex: CMD-2026-000001
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_region TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  delivery_zone_id INTEGER REFERENCES delivery_zones(id) ON DELETE SET NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK(order_status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'
  )),
  payment_method TEXT NOT NULL CHECK(payment_method IN (
    'wave', 'orange_money', 'card', 'cash_on_delivery'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  whatsapp_notified INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  subtotal INTEGER NOT NULL
);

-- 8. Table des transactions de paiement
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('wave', 'orange_money', 'card', 'paytech', 'cash')),
  transaction_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'paid', 'successful', 'failed', 'cancelled', 'refunded')),
  raw_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table des avis clients et notations
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table des paramètres et configuration de la boutique
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table du journal d'audit administratif
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les recherches et requêtes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 12. Table des messages du formulaire de contact
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
