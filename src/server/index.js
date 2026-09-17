import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { db, initSchema } from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import des routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const app = express();

// Configuration CORS & Cookies
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dossier pour les fichiers téléversés
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(config.uploadsDir));

// Servir également les fichiers statiques du dossier public (logos, icônes SVG de catégories...)
const publicDir = path.resolve(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Limitation de requêtes sur l'authentification (anti force-brute)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requêtes max par fenêtre
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Enregistrement des routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/delivery-zones', deliveryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: config.storeName,
    paymentMode: config.paymentMode,
    timestamp: new Date().toISOString()
  });
});

// En production, servir les fichiers statiques construits par Vite
const distPath = path.resolve(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Gestionnaire d'erreurs global
app.use(errorHandler);

// Démarrage du serveur et initialisation automatique si nécessaire
app.listen(config.port, '0.0.0.0', async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SALMA SHOP - CHIC LADIES DAKAR (Serveur Démarré)`);
  console.log(`🌐 URL : http://localhost:${config.port}`);
  console.log(`💳 Mode Paiement : [${config.paymentMode.toUpperCase()}]`);
  console.log(`======================================================\n`);

  try {
    // Initialiser le schéma de tables si nécessaire (PostgreSQL ou SQLite)
    await initSchema();

    // Vérifier si la base de données contient des produits, sinon lancer le seed
    const count = await db.queryOne('SELECT COUNT(*) as count FROM products');
    if (!count || count.count === 0) {
      console.log('📦 Base de données vide détectée. Lancement automatique du seed initial...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Erreur lors de la vérification du seed:', err);
  }
});

export default app;
