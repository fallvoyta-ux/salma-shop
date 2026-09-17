-- =======================================================
-- SALMA SHOP DAKAR - SCHEMA POSTGRESQL (Railway Cloud)
-- =======================================================

-- 1. Table des utilisateurs (Clients & Administrateurs)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'admin', 'employee')),
  address TEXT,
  city VARCHAR(100) DEFAULT 'Dakar',
  region VARCHAR(100) DEFAULT 'Dakar',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des catégories de produits
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des produits
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price INTEGER NOT NULL CHECK(price >= 0),
  compare_price INTEGER CHECK(compare_price IS NULL OR compare_price >= price),
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sku VARCHAR(100) UNIQUE,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  is_featured SMALLINT NOT NULL DEFAULT 0 CHECK(is_featured IN (0, 1)),
  is_promo SMALLINT NOT NULL DEFAULT 0 CHECK(is_promo IN (0, 1)),
  specifications TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des photos de produits
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary SMALLINT NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des zones de livraison
CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK(price >= 0),
  estimated_days VARCHAR(100),
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  delivery_region VARCHAR(100) NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  delivery_zone_id INTEGER REFERENCES delivery_zones(id) ON DELETE SET NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK(order_status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'
  )),
  payment_method VARCHAR(50) NOT NULL CHECK(payment_method IN (
    'wave', 'orange_money', 'card', 'cash_on_delivery'
  )),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK(payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  whatsapp_notified SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table des articles d'une commande
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  subtotal INTEGER NOT NULL
);

-- 8. Table des transactions de paiement
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(150) UNIQUE,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  status VARCHAR(50) DEFAULT 'pending',
  raw_response TEXT,
  payload TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table des avis clients
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(150) NOT NULL,
  rating SMALLINT NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table des paramètres de la boutique
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index d'optimisation
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
