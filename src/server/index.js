import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import { config, validateConfig } from './config.js';
import { db, initSchema } from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { requireAdmin } from './middleware/adminAuth.js';

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
import contactRoutes from './routes/contactRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Validation environnement de démarrage
validateConfig();

const app = express();

// En-têtes HTTP de sécurité renforcés
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (config.env === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.removeHeader('X-Powered-By');
  next();
});
// Render / Railway placent l'application derrière un proxy inverse.
// Sans cette ligne, express-rate-limit voit la même IP pour tous les visiteurs.
app.set('trust proxy', 1);
app.use(compression());

// Configuration CORS sécurisée
const allowedOrigins = [
  'https://salmashop.onrender.com',
  'https://www.salmashop.sn',
  config.clientUrl
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requêtes sans origine (app mobile, curl, même domaine) : autorisées
    if (!origin) return callback(null, true);

    if (config.env !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origine CORS non autorisée'));
  },
  credentials: true
}));

// Body parsers avec capture de req.rawBody pour la vérification des signatures de webhooks (Wave HMAC)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dossier pour les fichiers téléversés
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(config.uploadsDir));

// Servir les fichiers statiques du dossier public (logos, icônes SVG)
const publicDir = path.resolve(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// 1. Limitation anti force-brute sur l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Limitation anti-inondation sur la création de commandes
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    message: 'Trop de commandes passées récemment. Veuillez patienter quelques minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 3. Limitation sur les endpoints de paiement
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Trop de requêtes de paiement. Veuillez patienter.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
// 4. Limitation anti-spam sur les avis et messages de contact
const publicWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Trop d’envois depuis votre appareil. Veuillez réessayer dans une heure.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Enregistrement des routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/reviews', publicWriteLimiter, reviewRoutes);
app.use('/api/delivery-zones', deliveryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', publicWriteLimiter, contactRoutes);

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

// Initialisation ordonnée de la base de données PUIS démarrage du serveur
async function startServer() {
  try {
    await initSchema();

    // Vérifier si la base de données contient des produits, sinon lancer le seed
    const count = await db.queryOne('SELECT COUNT(*) as count FROM products');
    const totalCount = count ? parseInt(count.count, 10) : 0;
    if (totalCount === 0) {
      console.log('📦 Base de données vide détectée. Lancement automatique du seed initial...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la DB:', err);
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 GLOBAL BUSINESS SERVICES GRP SF - GROUPE SALMA FALL`);
    console.log(`🌐 URL : http://localhost:${config.port}`);
    console.log(`💳 Mode Paiement : [${config.paymentMode.toUpperCase()}]`);
    console.log(`======================================================\n`);
  });
}

startServer();

export default app;
